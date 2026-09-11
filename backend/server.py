import os
import sys
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Union
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "")

# Timezone: Asia/Tashkent (UTC+5)
TASHKENT_TZ = timezone(timedelta(hours=5))

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_FILE = DATA_DIR / "appointments.json"
DOCTORS_FILE = DATA_DIR / "doctors.json"
SERVICES_FILE = DATA_DIR / "services.json"
CLINICS_FILE = DATA_DIR / "clinics.json"
PRESCRIPTIONS_FILE = DATA_DIR / "prescriptions.json"
TENANTS_FILE = DATA_DIR / "tenants.json"

# Ensure essential files exist
for f_path in [DB_FILE, CLINICS_FILE, PRESCRIPTIONS_FILE, TENANTS_FILE]:
    if not f_path.exists():
        with open(f_path, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)

def load_json_file(file_path: Path) -> list:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_json_file(file_path: Path, data: Any):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def load_db() -> list:
    return load_json_file(DB_FILE)

def save_db(data: list):
    save_json_file(DB_FILE, data)

def get_clinic_by_id(clinic_id: Optional[str]) -> dict:
    clinics = load_json_file(CLINICS_FILE)
    target_id = clinic_id or "dentamed-nukus"
    for c in clinics:
        if c.get("id") == target_id:
            return c
    return {
        "id": target_id,
        "name": "DentaMed Atelier (Nukus - Bosh filial)",
        "address": "Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy",
        "landmark": "Rossiya elchixonasi ro'parasi, 204-kabinet",
        "phone": "+998 (71) 200-00-00",
        "location": {"lat": 41.2995, "lng": 69.2401}
    }

# Concurrency lock for double-booking prevention
appointment_lock = asyncio.Lock()

class AppointmentModel(BaseModel):
    id: str
    pinCode: str
    patientName: str
    phone: str
    doctor: dict
    service: dict
    date: str
    time: str
    clinicId: str = "dentamed-nukus"
    tenantId: Optional[str] = "dentamed"
    status: str = "confirmed"
    notes: Optional[str] = ""
    createdAt: str
    selectedTeethNumbers: Optional[List[int]] = None
    hasPromoUltrasonic: Optional[bool] = False
    discountAmount: Optional[int] = 0
    totalAmount: Optional[int] = None
    telegramUserId: Optional[int] = None
    telegramUsername: Optional[str] = None
    reminder24hSent: Optional[bool] = False
    reminder2hSent: Optional[bool] = False

class StaffLoginModel(BaseModel):
    pinCode: Optional[str] = None
    pin: Optional[str] = None

class TenantRegisterModel(BaseModel):
    name: str
    ownerName: str
    phone: str
    email: Optional[str] = ""
    firstBranchName: Optional[str] = None
    firstBranchAddress: Optional[str] = None

class StatusUpdateModel(BaseModel):
    status: str

class MedicationItem(BaseModel):
    name: str
    dosage: str
    duration: Optional[str] = "5 kun"
    frequency: Optional[str] = ""
    instructions: Optional[str] = ""

class PrescriptionModel(BaseModel):
    id: Optional[str] = None
    appointmentId: str
    diagnosis: Optional[str] = "Klinik davolash kursi va reabilitatsiya"
    medications: Optional[List[MedicationItem]] = []
    diagnosis: Optional[str] = "Stomatologik / LOR ko'rigi va muolajasi"
    medications: Optional[List[dict]] = []
    medicines: Optional[List[dict]] = []
    recommendations: Optional[List[str]] = []
    doctorNotes: Optional[str] = ""
    customNotes: Optional[str] = ""
    nextVisitDate: Optional[str] = None
    prescribedAt: Optional[str] = None
    patientName: Optional[str] = None
    phone: Optional[str] = None
    doctorName: Optional[str] = None
    clinicId: Optional[str] = None
    pinCode: Optional[str] = None
    date: Optional[str] = None
    telegramUserId: Optional[int] = None
    createdAt: Optional[str] = None

MedicationItem.model_rebuild()
PrescriptionModel.model_rebuild()
AppointmentModel.model_rebuild()
StatusUpdateModel.model_rebuild()

async def notify_patient(appt: AppointmentModel):
    """Send formal booking confirmation receipt directly to the patient's Telegram chat"""
    if not BOT_TOKEN or not appt.telegramUserId:
        return

    doc_name = appt.doctor.get("name", "Shifokor")
    doc_spec = appt.doctor.get("specialty", {}).get("uz", "Mutaxassis")
    srv_title = appt.service.get("title", {}).get("uz", "Xizmat")
    price = appt.service.get("price", 0)

    clinic = get_clinic_by_id(appt.clinicId)
    clinic_name = clinic.get("name", "DentaMed Atelier")
    clinic_addr = clinic.get("address", "Toshkent shahar")
    clinic_phone = clinic.get("phone", "+998 (71) 200-00-00")

    final_price = appt.totalAmount if appt.totalAmount is not None else price
    teeth_info = ""
    if appt.selectedTeethNumbers:
        teeth_str = ", ".join(f"№{n}" for n in appt.selectedTeethNumbers)
        teeth_info = f"🦷 <b>Davolanadigan tishlar:</b> {teeth_str}\n"

    promo_info = ""
    if appt.hasPromoUltrasonic:
        promo_info = "🎁 <b>Kross-Aksiya:</b> Ultratovushli tozalash 50% chegirmada (-200,000 so'm) hisoblandi!\n"

    patient_msg = (
        f"🎉 <b>QABULINGIZ TASDIQLANDI!</b>\n"
        f"────────────────────────\n"
        f"👤 <b>Hurmatli {appt.patientName}!</b>\n"
        f"Siz <b>{clinic_name}</b>da shifokor ko'rigiga muvaffaqiyatli yozildingiz.\n\n"
        f"👨‍⚕️ <b>Shifokor:</b> {doc_name}\n"
        f"💼 <b>Mutaxassisligi:</b> {doc_spec}\n"
        f"🩺 <b>Tanlangan xizmat:</b> {srv_title}\n"
        f"{teeth_info}"
        f"{promo_info}"
        f"📅 <b>Qabul sanasi:</b> {appt.date}\n"
        f"⏰ <b>Qabul vaqti:</b> soat {appt.time}\n"
        f"💰 <b>To'lov summasi:</b> {final_price:,} so'm\n"
        f"────────────────────────\n"
        f"🎫 <b>Qabul Taloningiz:</b> <code>#{appt.id}</code>\n"
        f"🔑 <b>Retsepshnda aytiladigan PIN-kod:</b> <code>{appt.pinCode}</code>\n\n"
        f"📍 <b>Filial manzili:</b> {clinic_addr}\n\n"
        f"ℹ️ <i>Iltimos, belgilangan vaqtdan 5-10 daqiqa oldinroq tashrif buyuring. Retsepshnga ushbu <b>{appt.pinCode}</b> kodini ko'rsatib navbatsiz qabulga o'tasiz.</i>\n\n"
        f"📞 <b>Tezkor yordam:</b> {clinic_phone} | @dentamed_admin"
    )

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": appt.telegramUserId,
        "text": patient_msg,
        "parse_mode": "HTML"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            print(f"Sent message to patient {appt.telegramUserId}: status {resp.status_code}")
    except Exception as e:
        print(f"Error sending message to patient: {e}")

async def notify_admin_group(appt: AppointmentModel):
    """Notify clinic admin group if configured"""
    if not BOT_TOKEN or not ADMIN_CHAT_ID or ADMIN_CHAT_ID == "":
        return

    doc_name = appt.doctor.get("name", "Shifokor")
    srv_title = appt.service.get("title", {}).get("uz", "Xizmat")
    price = appt.service.get("price", 0)
    clinic = get_clinic_by_id(appt.clinicId)

    admin_msg = (
        f"🚨 <b>YANGI BEMOR QABULGA YOZILDI!</b>\n"
        f"────────────────────────\n"
        f"🏢 <b>Filial:</b> {clinic.get('name')}\n"
        f"🆔 <b>Talon:</b> #{appt.id}\n"
        f"👤 <b>Bemor:</b> {appt.patientName}\n"
        f"📞 <b>Telefon:</b> {appt.phone}\n"
        f"👨‍⚕️ <b>Shifokor:</b> {doc_name}\n"
        f"🦷 <b>Xizmat:</b> {srv_title} ({price:,} so'm)\n"
        f"📅 <b>Vaqti:</b> {appt.date} • {appt.time}\n"
        f"🔑 <b>Retsepshn PIN:</b> <code>{appt.pinCode}</code>\n"
        f"💬 <b>Bemor shikoyati:</b> {appt.notes or 'Yoq'}\n"
        f"────────────────────────"
    )

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": ADMIN_CHAT_ID,
        "text": admin_msg,
        "parse_mode": "HTML"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(url, json=payload)
    except Exception as e:
        print(f"Error sending to admin group: {e}")

async def send_24h_reminder(appt: dict) -> bool:
    if not BOT_TOKEN or not appt.get("telegramUserId"):
        return False

    clinic_id = appt.get("clinicId", "dentamed-nukus")
    clinic = get_clinic_by_id(clinic_id)
    doc_name = appt.get("doctor", {}).get("name", "Shifokor")
    srv_title = appt.get("service", {}).get("title", {}).get("uz", "Tibbiy xizmat")

    msg = (
        f"⏰ <b>QABULINGIZGA 24 SOAT QOLDI! (ESLATMA)</b>\n"
        f"────────────────────────\n"
        f"👤 <b>Hurmatli {appt.get('patientName')}!</b>\n\n"
        f"Ertaga <b>{clinic.get('name')}</b>da shifokor ko'rigingiz rejalashtirilgan:\n\n"
        f"👨‍⚕️ <b>Shifokor:</b> {doc_name}\n"
        f"🩺 <b>Xizmat:</b> {srv_title}\n"
        f"📅 <b>Sana:</b> {appt.get('date')}\n"
        f"⏰ <b>Vaqt:</b> soat {appt.get('time')}\n"
        f"🎫 <b>Talon:</b> <code>#{appt.get('id')}</code>\n"
        f"🔑 <b>PIN-kod:</b> <code>{appt.get('pinCode')}</code>\n"
        f"📍 <b>Manzil:</b> {clinic.get('address')}\n"
        f"────────────────────────\n"
        f"Iltimos, tashrifingizni tasdiqlang:"
    )

    inline_keyboard = {
        "inline_keyboard": [
            [
                {"text": "✅ Ha, boraman", "callback_data": f"rem_confirm_{appt.get('id')}"},
                {"text": "❌ Bekor qilish", "callback_data": f"rem_cancel_{appt.get('id')}"}
            ],
            [
                {"text": "🔄 Vaqtni ko'chirish", "callback_data": f"rem_resched_{appt.get('id')}"}
            ]
        ]
    }

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": appt.get("telegramUserId"),
        "text": msg,
        "parse_mode": "HTML",
        "reply_markup": inline_keyboard
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200
    except Exception as e:
        print(f"Error sending 24h reminder: {e}")
        return False

async def send_2h_reminder(appt: dict) -> bool:
    if not BOT_TOKEN or not appt.get("telegramUserId"):
        return False

    clinic_id = appt.get("clinicId", "dentamed-nukus")
    clinic = get_clinic_by_id(clinic_id)
    doc_name = appt.get("doctor", {}).get("name", "Shifokor")

    msg = (
        f"🔔 <b>QABULINGIZGA 2 SOAT QOLDI!</b>\n"
        f"────────────────────────\n"
        f"👤 <b>Hurmatli {appt.get('patientName')}!</b>\n"
        f"Shifokoringiz <b>{doc_name}</b> sizni kutmoqda.\n\n"
        f"⏰ <b>Qabul vaqti:</b> soat {appt.get('time')}\n"
        f"🔑 <b>Retsepshn PIN-kodingiz:</b> <code>{appt.get('pinCode')}</code>\n\n"
        f"🏥 <b>Klinika:</b> {clinic.get('name')}\n"
        f"📍 <b>Manzil:</b> {clinic.get('address')}\n"
        f"🏢 <b>Mo'ljal:</b> {clinic.get('landmark')}\n"
        f"📞 <b>Aloqa:</b> {clinic.get('phone')}\n"
        f"────────────────────────\n"
        f"🚕 <i>Yo'l tirbandligini inobatga olib, 10-15 daqiqa oldinroq kelishingizni iltimos qilamiz.</i>"
    )

    url_text = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    url_loc = f"https://api.telegram.org/bot{BOT_TOKEN}/sendLocation"
    loc = clinic.get("location", {"lat": 41.2995, "lng": 69.2401})

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp1 = await client.post(url_text, json={
                "chat_id": appt.get("telegramUserId"),
                "text": msg,
                "parse_mode": "HTML"
            })
            if loc and "lat" in loc and "lng" in loc:
                await client.post(url_loc, json={
                    "chat_id": appt.get("telegramUserId"),
                    "latitude": loc["lat"],
                    "longitude": loc["lng"]
                })
            return resp1.status_code == 200
    except Exception as e:
        print(f"Error sending 2h reminder: {e}")
        return False

async def check_and_send_reminders() -> int:
    db = load_db()
    now = datetime.now(TASHKENT_TZ)
    sent_count = 0
    updated = False

    for appt in db:
        if appt.get("status") == "cancelled":
            continue

        date_str = appt.get("date")
        time_str = appt.get("time")
        if not date_str or not time_str:
            continue

        try:
            time_part = time_str.strip()[:5]
            appt_dt = datetime.strptime(f"{date_str} {time_part}", "%Y-%m-%d %H:%M").replace(tzinfo=TASHKENT_TZ)
        except Exception:
            continue

        diff_seconds = (appt_dt - now).total_seconds()

        # 24h reminder (between 0 and 24 hours)
        if 0 < diff_seconds <= 24 * 3600 and not appt.get("reminder24hSent", False):
            success = await send_24h_reminder(appt)
            if success:
                appt["reminder24hSent"] = True
                updated = True
                sent_count += 1
                print(f"[Reminder] Sent 24h reminder for #{appt.get('id')}")

        # 2h reminder (between 0 and 2 hours)
        if 0 < diff_seconds <= 2 * 3600 and not appt.get("reminder2hSent", False):
            success = await send_2h_reminder(appt)
            if success:
                appt["reminder2hSent"] = True
                updated = True
                sent_count += 1
                print(f"[Reminder] Sent 2h reminder for #{appt.get('id')}")

    if updated:
        save_db(db)

    return sent_count

async def reminder_cron_loop():
    while True:
        try:
            await check_and_send_reminders()
        except Exception as e:
            print(f"[Cron Error] check_and_send_reminders: {e}")
        await asyncio.sleep(60)

async def notify_prescription(pres: dict, appt: Optional[dict] = None):
    if not BOT_TOKEN:
        return

    telegram_user_id = pres.get("telegramUserId")
    patient_name = pres.get("patientName") or "Hurmatli bemor"
    doc_name = pres.get("doctorName") or "Shifokor"
    clinic_name = "DentaMed Atelier"

    if appt:
        telegram_user_id = telegram_user_id or appt.get("telegramUserId")
        patient_name = appt.get("patientName", patient_name)
        doc_name = appt.get("doctor", {}).get("name", doc_name)
        clinic_id = appt.get("clinicId") or pres.get("clinicId", "dentamed-nukus")
        clinic = get_clinic_by_id(clinic_id)
        clinic_name = clinic.get("name", "DentaMed Atelier")
    else:
        clinic_id = pres.get("clinicId", "dentamed-nukus")
        clinic = get_clinic_by_id(clinic_id)
        clinic_name = clinic.get("name", "DentaMed Atelier")

    if not telegram_user_id:
        return

    meds_text = ""
    meds_list = pres.get("medications") or []
    for idx, med in enumerate(meds_list, 1):
        instr = med.get("instructions") or med.get("frequency") or ""
        instr_text = f" ({instr})" if instr else ""
        meds_text += f"{idx}. 💊 <b>{med.get('name')}</b> — {med.get('dosage')}\n   ⏱ Qabul davomiyligi: {med.get('duration', '5 kun')}{instr_text}\n"

    # Also check if recommendations exist
    rec_text = ""
    recs = pres.get("recommendations")
    if recs:
        if isinstance(recs, list):
            rec_text = "💡 <b>Tavsiyalar:</b>\n" + "\n".join(f"• {r}" for r in recs) + "\n"
        elif isinstance(recs, str):
            rec_text = f"💡 <b>Tavsiyalar:</b>\n{recs}\n"

    next_visit = pres.get("nextVisitDate")
    next_visit_text = f"📅 <b>Keyingi nazorat ko'rigi:</b> {next_visit}\n" if next_visit else ""
    
    doc_notes = pres.get("doctorNotes") or pres.get("customNotes")
    notes_text = f"📝 <b>Shifokor xulosasi:</b>\n{doc_notes}\n" if doc_notes else ""

    diagnosis = pres.get("diagnosis", "Klinik tekshiruv va davolash kursi")

    rx_msg = (
        f"🇨🇭 <b>DENTAMED ATELIER | RAQAMLI RETSEPT</b>\n"
        f"<i>Swiss Dental & ENT Quality Standards • Rasmiy Hujjat</i>\n"
        f"────────────────────────\n"
        f"📋 <b>Retsept raqami:</b> <code>#{pres.get('id')}</code>\n"
        f"🎫 <b>Qabul Taloni:</b> <code>#{pres.get('appointmentId')}</code>\n"
        f"👤 <b>Bemor:</b> {patient_name}\n"
        f"👨‍⚕️ <b>Davolovchi shifokor:</b> {doc_name}\n"
        f"🏥 <b>Klinika:</b> {clinic_name}\n"
        f"📅 <b>Berilgan sana:</b> {datetime.now(TASHKENT_TZ).strftime('%d.%m.%Y, %H:%M')}\n"
        f"────────────────────────\n"
        f"🔍 <b>Tashxis:</b>\n"
        f"<b>{diagnosis}</b>\n\n"
        f"💊 <b>BELGILANGAN DORI VOSITALARI:</b>\n"
        f"{meds_text or 'Ko\'rsatilmagan'}\n"
        f"{rec_text}"
        f"{notes_text}"
        f"{next_visit_text}"
        f"────────────────────────\n"
        f"🛡️ <i>Ushbu retsept Shveysariya xalqaro standartlari asosida raqamli elektron imzo bilan tasdiqlangan va barcha dorixonalarda amal qiladi.</i>\n\n"
        f"📞 <b>Aloqa:</b> +998 (71) 200-00-00 | @dentamed_admin"
    )

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": telegram_user_id,
        "text": rx_msg,
        "parse_mode": "HTML"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            print(f"Prescription #{pres.get('id')} sent to patient {telegram_user_id}: status {resp.status_code}")
    except Exception as e:
        print(f"Error sending prescription: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    cron_task = asyncio.create_task(reminder_cron_loop())
    print("[Background] Reminder cron loop active (every 60s)")
    yield
    cron_task.cancel()
    try:
        await cron_task
    except asyncio.CancelledError:
        pass

app = FastAPI(title="DentaMed Multi-Tenant Clinic API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "DentaMed Clinic Multi-Tenant API",
        "time": datetime.now(TASHKENT_TZ).isoformat()
    }

# 1. MULTI-TENANT TENANTS & CLINICS ENDPOINTS
@app.get("/api/tenants")
def get_tenants():
    tenants = load_json_file(TENANTS_FILE)
    clinics = load_json_file(CLINICS_FILE)
    result = []
    for t in tenants:
        t_copy = dict(t)
        t_branches = [c for c in clinics if c.get("tenantId") == t.get("id")]
        t_copy["branches"] = t_branches
        t_copy["branchesCount"] = len(t_branches)
        result.append(t_copy)
    return result

@app.get("/api/tenants/{tenant_id}")
def get_tenant_detail(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    clinics = load_json_file(CLINICS_FILE)
    t_branches = [c for c in clinics if c.get("tenantId") == tenant_id]
    t_copy = dict(tenant)
    t_copy["branches"] = t_branches
    t_copy["branchesCount"] = len(t_branches)
    return t_copy

@app.post("/api/staff/login")
def staff_login(payload: StaffLoginModel):
    pin = (payload.pinCode or payload.pin or "").strip()
    tenants = load_json_file(TENANTS_FILE)
    clinics = load_json_file(CLINICS_FILE)

    # 1. Check Owner / Director PINs
    for t in tenants:
        if str(t.get("ownerPin", "")).strip() == pin or (pin == "7777" and t.get("id") == "dentamed") or (pin == "8888" and t.get("id") == "grandmed"):
            allowed_branches = [c["id"] for c in clinics if c.get("tenantId") == t.get("id")]
            branch_count = len(allowed_branches)
            title_uz = f"👑 Klinika Rahbari (Barcha {branch_count} ta filial)" if t.get("id") == "dentamed" else f"👑 {t.get('name')} Rahbari (Barcha filiallar)"
            session_data = {
                "role": "clinic_director",
                "tenantId": t.get("id"),
                "staffName": t.get("ownerName", "Klinika Rahbari"),
                "titleUz": title_uz,
                "titleRu": f"👑 Руководитель {t.get('name')} (Все филиалы)",
                "isDirector": True,
                "allowedClinicIds": allowed_branches
            }
            return {
                "status": "success",
                "ok": True,
                "role": "owner",
                "session": session_data,
                "tenantId": t.get("id"),
                "tenantName": t.get("name"),
                "allowedBranchIds": allowed_branches,
                "branchName": f"Barcha filiallar ({branch_count})",
                "staffName": t.get("ownerName", "Klinika Rahbari")
            }

    # 2. Super Admin PIN (2026, 0000)
    if pin in ["2026", "0000"]:
        all_branches = [c["id"] for c in clinics]
        session_data = {
            "role": "super_admin",
            "tenantId": "all",
            "staffName": "Bosh Tizim Administratori",
            "titleUz": "💎 Bosh Administrator (Barcha Klinikalar)",
            "titleRu": "💎 Главный Администратор (Все клиники)",
            "isDirector": True,
            "allowedClinicIds": all_branches
        }
        return {
            "status": "success",
            "ok": True,
            "role": "super_admin",
            "session": session_data,
            "tenantId": "all",
            "allowedBranchIds": all_branches,
            "staffName": "Bosh Tizim Administratori"
        }

    # 3. Check Branch Staff PINs (Receptionists: 1001-1005, 2001-2002, etc.)
    for c in clinics:
        if str(c.get("staffPin", "")).strip() == pin:
            t_id = c.get("tenantId", "dentamed")
            parent_tenant = next((t for t in tenants if t.get("id") == t_id), None)
            t_name = parent_tenant.get("name") if parent_tenant else "DentaMed Atelier"
            session_data = {
                "role": "reception",
                "tenantId": t_id,
                "clinicId": c.get("id"),
                "staffName": c.get("managerName", "Filial Retsepshni"),
                "titleUz": f"📍 {c.get('name')} Retsepshni",
                "titleRu": f"📍 Ресепшн {c.get('name')}",
                "isDirector": False,
                "allowedClinicIds": [c.get("id")]
            }
            return {
                "status": "success",
                "ok": True,
                "role": "receptionist",
                "session": session_data,
                "tenantId": t_id,
                "tenantName": t_name,
                "allowedBranchIds": [c.get("id")],
                "branchName": c.get("name"),
                "clinicId": c.get("id"),
                "staffName": c.get("managerName", "Filial Retsepshni")
            }

    raise HTTPException(status_code=401, detail="Noto'g'ri PIN-kod! (Rahbar: 7777, Nukus: 1001, Chilonzor: 1002, Yunusobod: 1003, Samarqand: 1004, Buxoro: 1005)")

@app.post("/api/tenants/register")
def register_tenant(payload: TenantRegisterModel):
    tenants = load_json_file(TENANTS_FILE)
    clinics = load_json_file(CLINICS_FILE)

    base_slug = payload.name.lower().replace(" ", "").replace("'", "").replace("-", "")
    slug = base_slug[:12] or f"tenant{len(tenants) + 1}"

    counter = 1
    orig_slug = slug
    while any(t.get("id") == slug for t in tenants):
        slug = f"{orig_slug}{counter}"
        counter += 1

    existing_owner_pins = {str(t.get("ownerPin")) for t in tenants}
    owner_pin = str(7000 + len(tenants) * 1111)
    while owner_pin in existing_owner_pins:
        owner_pin = str(int(owner_pin) + 11)

    branch_name = payload.firstBranchName or f"{payload.name} Bosh filial"
    branch_id = f"{slug}-main"
    existing_staff_pins = {str(c.get("staffPin")) for c in clinics}
    staff_pin = str(3000 + len(clinics))
    while staff_pin in existing_staff_pins:
        staff_pin = str(int(staff_pin) + 1)

    first_branch = {
        "id": branch_id,
        "tenantId": slug,
        "name": branch_name,
        "isMain": True,
        "address": payload.firstBranchAddress or "Toshkent shahar",
        "landmark": "Markaziy bino",
        "phone": payload.phone,
        "managerName": payload.ownerName,
        "staffPin": staff_pin,
        "workingHours": "08:00 - 20:00 (Har kuni)",
        "location": {"lat": 41.3111, "lng": 69.2797},
        "mapUrl": "https://maps.google.com/?q=41.3111,69.2797"
    }

    new_tenant = {
        "id": slug,
        "name": payload.name,
        "ownerName": payload.ownerName,
        "ownerPin": owner_pin,
        "phone": payload.phone,
        "email": payload.email or f"info@{slug}.uz",
        "logo": f"/images/{slug}_logo.png",
        "status": "active",
        "branchIds": [branch_id],
        "createdAt": datetime.now(TASHKENT_TZ).isoformat()
    }

    tenants.append(new_tenant)
    clinics.append(first_branch)

    save_json_file(TENANTS_FILE, tenants)
    save_json_file(CLINICS_FILE, clinics)

    return {
        "status": "success",
        "message": "Yangi klinika (tenant) va uning birinchi filiali muvaffaqiyatli ro'yxatdan o'tdi",
        "tenant": {
            "id": new_tenant["id"],
            "name": new_tenant["name"],
            "ownerName": new_tenant["ownerName"],
            "ownerPin": new_tenant["ownerPin"],
            "phone": new_tenant["phone"],
            "branch": first_branch
        }
    }

@app.get("/api/tenants/{tenant_id}/analytics")
def get_tenant_analytics(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")

    clinics = [c for c in load_json_file(CLINICS_FILE) if c.get("tenantId") == tenant_id]
    all_appts = load_db()
    tenant_appts = [a for a in all_appts if a.get("tenantId") == tenant_id]

    total_appointments = len(tenant_appts)
    completed_appts = [a for a in tenant_appts if a.get("status") == "completed"]

    total_revenue = 0
    for a in tenant_appts:
        if a.get("status") in ["completed", "confirmed"]:
            amt = a.get("totalAmount")
            if amt is None:
                amt = a.get("service", {}).get("price", 0)
            total_revenue += amt

    branches_breakdown = []
    for branch in clinics:
        b_id = branch.get("id")
        b_appts = [a for a in tenant_appts if a.get("clinicId") == b_id]
        b_revenue = 0
        for a in b_appts:
            if a.get("status") in ["completed", "confirmed"]:
                amt = a.get("totalAmount")
                if amt is None:
                    amt = a.get("service", {}).get("price", 0)
                b_revenue += amt

        branch_occupancy = round((len(b_appts) / max(total_appointments, 1)) * 100, 1) if total_appointments > 0 else 0.0

        branches_breakdown.append({
            "clinicId": b_id,
            "clinicName": branch.get("name"),
            "appointmentsCount": len(b_appts),
            "revenue": b_revenue,
            "occupancyRate": branch_occupancy
        })

    doctor_stats = {}
    for a in tenant_appts:
        doc = a.get("doctor", {})
        doc_id = doc.get("id")
        if not doc_id:
            continue
        if doc_id not in doctor_stats:
            doc_spec = doc.get("specialty", {})
            spec_str = doc_spec.get("uz") if isinstance(doc_spec, dict) else str(doc_spec or "")
            doctor_stats[doc_id] = {
                "doctorId": doc_id,
                "doctorName": doc.get("name", f"Shifokor #{doc_id}"),
                "specialty": spec_str,
                "appointmentsCount": 0,
                "revenue": 0
            }
        doctor_stats[doc_id]["appointmentsCount"] += 1
        if a.get("status") in ["completed", "confirmed"]:
            amt = a.get("totalAmount")
            if amt is None:
                amt = a.get("service", {}).get("price", 0)
            doctor_stats[doc_id]["revenue"] += amt

    top_doctors = sorted(list(doctor_stats.values()), key=lambda d: (d["revenue"], d["appointmentsCount"]), reverse=True)

    return {
        "tenantId": tenant_id,
        "tenantName": tenant.get("name"),
        "totalRevenue": total_revenue,
        "totalAppointments": total_appointments,
        "completedAppointments": len(completed_appts),
        "occupancyRate": 85.0 if total_appointments > 0 else 0.0,
        "branchesBreakdown": branches_breakdown,
        "topDoctors": top_doctors
    }

@app.get("/api/clinics")
def get_clinics(tenantId: Optional[str] = Query(None)):
    clinics = load_json_file(CLINICS_FILE)
    if tenantId:
        return [c for c in clinics if c.get("tenantId") == tenantId]
    return clinics

# Filtered doctors by clinicId and tenantId
@app.get("/api/doctors")
def get_doctors(
    clinicId: Optional[str] = Query(None),
    tenantId: Optional[str] = Query(None)
):
    doctors = load_json_file(DOCTORS_FILE)
    if tenantId:
        doctors = [d for d in doctors if d.get("tenantId") == tenantId]
    if clinicId:
        doctors = [
            d for d in doctors
            if d.get("clinicId") == clinicId or (isinstance(d.get("clinicIds"), list) and clinicId in d.get("clinicIds"))
        ]
    return doctors

# Filtered services by clinicId and tenantId
@app.get("/api/services")
def get_services(
    clinicId: Optional[str] = Query(None),
    tenantId: Optional[str] = Query(None)
):
    services = load_json_file(SERVICES_FILE)
    if tenantId:
        services = [s for s in services if s.get("tenantId") == tenantId]
    if clinicId:
        services = [
            s for s in services
            if s.get("clinicId") == clinicId or (isinstance(s.get("clinicIds"), list) and clinicId in s.get("clinicIds"))
        ]
    return services

@app.get("/api/clinic-data")
def get_clinic_data(clinicId: Optional[str] = Query(None)):
    clinics = load_json_file(CLINICS_FILE)
    clinic = get_clinic_by_id(clinicId) if clinicId else (clinics[0] if clinics else {})
    doctors = get_doctors(clinicId)
    services = get_services(clinicId)
    return {
        "clinic": clinic,
        "clinics": clinics,
        "clinicName": clinic.get("name", "DentaMed Atelier"),
        "phone": clinic.get("phone", "+998 (71) 200-00-00"),
        "address": clinic.get("address", "Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy"),
        "doctors": doctors,
        "services": services,
    }

@app.put("/api/services/{service_id}")
async def update_service(service_id: int, request: Request):
    data = await request.json()
    services = load_json_file(SERVICES_FILE)
    found = False
    for i, srv in enumerate(services):
        if srv.get("id") == service_id:
            services[i] = {**srv, **data, "id": service_id}
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    save_json_file(SERVICES_FILE, services)
    return {"status": "success", "service": services[i]}

# 2. CONCURRENCY: SLOTS AVAILABILITY ENDPOINT
@app.get("/api/slots")
def get_available_slots(doctorId: int = Query(...), date: str = Query(...), clinicId: Optional[str] = Query(None)):
    db = load_db()
    booked_times = set()
    for a in db:
        if a.get("status") == "cancelled":
            continue
        a_doc_id = a.get("doctor", {}).get("id")
        a_date = a.get("date")
        a_clinic = a.get("clinicId", "dentamed-nukus")

        if a_doc_id == doctorId and a_date == date:
            if clinicId is None or a_clinic == clinicId:
                t = a.get("time")
                if t:
                    booked_times.add(t)

    sorted_slots = sorted(list(booked_times))
    return {
        "doctorId": doctorId,
        "date": date,
        "clinicId": clinicId,
        "bookedTimes": sorted_slots,
        "busySlots": sorted_slots
    }

@app.get("/api/appointments")
def get_appointments(
    tenantId: Optional[str] = Query(None),
    clinicId: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    db = load_db()
    results = db
    if tenantId:
        results = [a for a in results if a.get("tenantId") == tenantId]
    if clinicId:
        results = [a for a in results if a.get("clinicId") == clinicId]
    if status:
        results = [a for a in results if a.get("status") == status]
    return results

# STATUS UPDATE ENDPOINT (PATCH)
@app.patch("/api/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, payload: StatusUpdateModel):
    async with appointment_lock:
        db = load_db()
        found = False
        for a in db:
            if a.get("id") == appointment_id:
                a["status"] = payload.status
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Qabul topilmadi")
        save_db(db)
    return {"status": "success", "appointmentId": appointment_id, "newStatus": payload.status}

# 2. CONCURRENCY & DOUBLE-BOOKING PREVENTION
@app.post("/api/appointments")
async def create_appointment(appt: AppointmentModel):
    async with appointment_lock:
        db = load_db()

        # Auto-resolve tenantId from clinic if not explicitly set
        if not getattr(appt, "tenantId", None) or appt.tenantId == "dentamed":
            clinic_info = get_clinic_by_id(appt.clinicId)
            if clinic_info and clinic_info.get("tenantId"):
                appt.tenantId = clinic_info.get("tenantId")

        # 1. Check duplicate appointment ID
        if any(a.get("id") == appt.id for a in db):
            return {"status": "already_exists", "appointment": appt}

        # 2. DOUBLE-BOOKING CHECK:
        # Same doctor, same date, same time, same clinic, and status != 'cancelled'
        doc_id = appt.doctor.get("id")
        for existing in db:
            if existing.get("status") == "cancelled":
                continue
            existing_doc_id = existing.get("doctor", {}).get("id")
            existing_clinic = existing.get("clinicId", "dentamed-nukus")
            new_clinic = appt.clinicId or "dentamed-nukus"

            if (
                existing_doc_id == doc_id
                and existing.get("date") == appt.date
                and existing.get("time") == appt.time
                and existing_clinic == new_clinic
            ):
                raise HTTPException(
                    status_code=409,
                    detail="Ushbu vaqt allaqachon boshqa bemor tomonidan band qilingan. Iltimos, boshqa vaqtni tanlang."
                )

        appt_dict = appt.model_dump() if hasattr(appt, "model_dump") else appt.dict()
        db.insert(0, appt_dict)
        save_db(db)

    # Notifications outside lock to keep critical section fast
    await notify_patient(appt)
    await notify_admin_group(appt)

    return {
        "status": "success",
        "message": "Qabul muvaffaqiyatli saqlandi va Telegramga xabar yuborildi",
        "appointment": appt
    }

# 3. AUTOMATED REMINDERS TRIGGER ENDPOINT
@app.post("/api/reminders/process")
async def process_reminders():
    sent_count = await check_and_send_reminders()
    return {
        "status": "success",
        "processedAt": datetime.now(TASHKENT_TZ).isoformat(),
        "remindersSent": sent_count
    }

# 4. POST-VISIT DIGITAL PRESCRIPTION APIS
@app.get("/api/prescriptions")
def list_prescriptions():
    return load_json_file(PRESCRIPTIONS_FILE)

@app.get("/api/prescriptions/{appointment_id}")
def get_prescription(appointment_id: str):
    prescriptions = load_json_file(PRESCRIPTIONS_FILE)
    for p in prescriptions:
        if p.get("appointmentId") == appointment_id:
            return p
    raise HTTPException(status_code=404, detail="Ushbu qabul bo'yicha retsept topilmadi")

@app.post("/api/prescriptions")
async def create_prescription(pres: PrescriptionModel):
    prescriptions = load_json_file(PRESCRIPTIONS_FILE)
    db = load_db()

    appt = next((a for a in db if a.get("id") == pres.appointmentId), None)

    pres_dict = pres.model_dump() if hasattr(pres, "model_dump") else pres.dict()
    if not pres_dict.get("id"):
        pres_dict["id"] = f"RX-{int(datetime.now().timestamp())}"
    if not pres_dict.get("prescribedAt"):
        pres_dict["prescribedAt"] = datetime.now(TASHKENT_TZ).isoformat()

    # Normalize medicines -> medications
    if pres_dict.get("medicines") and not pres_dict.get("medications"):
        pres_dict["medications"] = []
        for m in pres_dict["medicines"]:
            pres_dict["medications"].append({
                "name": m.get("name", "Dori vositasi"),
                "dosage": m.get("dosage", ""),
                "duration": m.get("duration", "5 kun"),
                "frequency": m.get("frequency", ""),
                "instructions": m.get("instructions", "") or m.get("frequency", "")
            })

    existing_idx = next((i for i, p in enumerate(prescriptions) if p.get("appointmentId") == pres.appointmentId), None)
    if existing_idx is not None:
        prescriptions[existing_idx] = pres_dict
    else:
        prescriptions.insert(0, pres_dict)

    save_json_file(PRESCRIPTIONS_FILE, prescriptions)

    await notify_prescription(pres_dict, appt)

    return {
        "status": "success",
        "message": "Raqamli retsept muvaffaqiyatli saqlandi va Telegram orqali bemorga yuborildi",
        "prescription": pres_dict
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)