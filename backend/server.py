import os
import sys
import json
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
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

# Ensure essential files exist
for f_path in [DB_FILE, CLINICS_FILE, PRESCRIPTIONS_FILE]:
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

class MedicationItem(BaseModel):
    name: str
    dosage: str
    duration: str
    instructions: Optional[str] = ""

class PrescriptionModel(BaseModel):
    id: Optional[str] = None
    appointmentId: str
    diagnosis: str
    medications: List[MedicationItem] = []
    doctorNotes: Optional[str] = ""
    nextVisitDate: Optional[str] = None
    prescribedAt: Optional[str] = None

MedicationItem.model_rebuild()
PrescriptionModel.model_rebuild()
AppointmentModel.model_rebuild()

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

    telegram_user_id = None
    patient_name = "Hurmatli bemor"
    doc_name = "Shifokor"
    clinic_name = "DentaMed Atelier"

    if appt:
        telegram_user_id = appt.get("telegramUserId")
        patient_name = appt.get("patientName", "Hurmatli bemor")
        doc_name = appt.get("doctor", {}).get("name", "DentaMed Shifokori")
        clinic_id = appt.get("clinicId", "dentamed-nukus")
        clinic = get_clinic_by_id(clinic_id)
        clinic_name = clinic.get("name", "DentaMed Atelier")

    if not telegram_user_id:
        return

    meds_text = ""
    for idx, med in enumerate(pres.get("medications", []), 1):
        instructions = f" ({med.get('instructions')})" if med.get("instructions") else ""
        meds_text += f"{idx}. 💊 <b>{med.get('name')}</b> — {med.get('dosage')}\n   ⏱ Qabul davomiyligi: {med.get('duration')}{instructions}\n"

    next_visit = pres.get("nextVisitDate")
    next_visit_text = f"📅 <b>Keyingi nazorat ko'rigi:</b> {next_visit}\n" if next_visit else ""
    doc_notes = pres.get("doctorNotes")
    notes_text = f"💡 <b>Shifokor tavsiyasi:</b>\n{doc_notes}\n" if doc_notes else ""

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
        f"<b>{pres.get('diagnosis')}</b>\n\n"
        f"💊 <b>BELGILANGAN DORI VOSITALARI:</b>\n"
        f"{meds_text}\n"
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

# 1. MULTI-TENANT CLINICS ENDPOINT
@app.get("/api/clinics")
def get_clinics():
    return load_json_file(CLINICS_FILE)

# Filtered doctors by clinicId
@app.get("/api/doctors")
def get_doctors(clinicId: Optional[str] = Query(None)):
    doctors = load_json_file(DOCTORS_FILE)
    if clinicId:
        return [d for d in doctors if d.get("clinicId") == clinicId or (isinstance(d.get("clinicIds"), list) and clinicId in d.get("clinicIds"))]
    return doctors

# Filtered services by clinicId
@app.get("/api/services")
def get_services(clinicId: Optional[str] = Query(None)):
    services = load_json_file(SERVICES_FILE)
    if clinicId:
        return [s for s in services if s.get("clinicId") == clinicId or (isinstance(s.get("clinicIds"), list) and clinicId in s.get("clinicIds"))]
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
    norm_clinic = None
    if clinicId:
        norm_clinic = "dentamed-nukus" if "nukus" in clinicId.lower() else ("dentamed-chilonzor" if "chilonzor" in clinicId.lower() else clinicId)

    for a in db:
        if a.get("status") in ["cancelled", "no_show"]:
            continue
        a_doc_id = a.get("doctor", {}).get("id")
        a_date = a.get("date")
        a_clinic = a.get("clinicId", "dentamed-nukus")

        if str(a_doc_id) == str(doctorId) and a_date == date:
            if norm_clinic is None or a_clinic == norm_clinic or a_clinic == clinicId:
                t = a.get("time")
                if t:
                    booked_times.add(t)

    slot_list = sorted(list(booked_times))
    return {
        "doctorId": doctorId,
        "date": date,
        "clinicId": clinicId,
        "bookedTimes": slot_list,
        "busySlots": slot_list
    }

@app.patch("/api/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, request: Request):
    data = await request.json()
    new_status = data.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status kiritilishi shart")

    db = load_db()
    found_idx = -1
    for i, a in enumerate(db):
        if a.get("id") == appointment_id:
            found_idx = i
            break

    if found_idx == -1:
        raise HTTPException(status_code=404, detail="Qabul topilmadi")

    db[found_idx]["status"] = new_status
    save_db(db)
    return {"status": "success", "appointment": db[found_idx]}

@app.get("/api/appointments")

def get_appointments():
    return load_db()

# 2. CONCURRENCY & DOUBLE-BOOKING PREVENTION
@app.post("/api/appointments")
async def create_appointment(appt: AppointmentModel):
    async with appointment_lock:
        db = load_db()

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

        # Insert new appointment using Pydantic v2 model_dump()
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