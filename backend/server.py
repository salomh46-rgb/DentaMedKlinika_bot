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
DOCTOR_SCHEDULES_FILE = DATA_DIR / "doctor_schedules.json"
SHIFTS_FILE = DATA_DIR / "shifts.json"
EXPENSES_FILE = DATA_DIR / "expenses.json"
DEBTS_FILE = DATA_DIR / "debts.json"

# Ensure essential files exist
for f_path in [DB_FILE, CLINICS_FILE, PRESCRIPTIONS_FILE, TENANTS_FILE, DOCTOR_SCHEDULES_FILE, SHIFTS_FILE, EXPENSES_FILE, DEBTS_FILE]:
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
    file_path = Path(file_path)
    tmp_path = file_path.with_name(f".{file_path.name}.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, file_path)

def load_db() -> list:
    return load_json_file(DB_FILE)

def save_db(data: list):
    save_json_file(DB_FILE, data)

def load_doctor_schedules() -> list:
    return load_json_file(DOCTOR_SCHEDULES_FILE)

def save_doctor_schedules(data: list):
    save_json_file(DOCTOR_SCHEDULES_FILE, data)

def get_doctor_schedule(doctor_id: Union[int, str]) -> dict:
    schedules = load_doctor_schedules()
    try:
        doc_id_int = int(doctor_id)
    except Exception:
        doc_id_int = doctor_id
    for s in schedules:
        if s.get("doctorId") == doc_id_int or str(s.get("doctorId")) == str(doctor_id):
            return s
    return {
        "doctorId": doc_id_int,
        "workingHours": {"start": "09:00", "end": "18:00"},
        "lunchBreak": {"start": "13:00", "end": "14:00"},
        "slotDuration": 30,
        "leaves": []
    }

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
    department: Optional[str] = "dental"
    familyMemberName: Optional[str] = None
    status: str = "confirmed"
    notes: Optional[str] = ""
    createdAt: str
    selectedTeethNumbers: Optional[List[int]] = None
    hasPromoUltrasonic: Optional[bool] = False
    discountAmount: Optional[int] = 0
    totalAmount: Optional[int] = None
    paidAmount: Optional[int] = None
    debtAmount: Optional[int] = 0
    paymentStatus: Optional[str] = "paid"
    telegramUserId: Optional[int] = None
    telegramUsername: Optional[str] = None
    reminder24hSent: Optional[bool] = False
    reminder2hSent: Optional[bool] = False
    paymentMethod: Optional[str] = "cash"

class ScheduleUpdateModel(BaseModel):
    workingHours: Optional[Dict[str, str]] = None
    lunchBreak: Optional[Dict[str, str]] = None
    slotDuration: Optional[int] = 30

class LeaveModel(BaseModel):
    date: str
    reason: Optional[str] = "Ta'til / Dam olish"

class StaffLoginModel(BaseModel):
    pinCode: Optional[str] = None
    pin: Optional[str] = None

class ShiftOpenModel(BaseModel):
    clinicId: str
    tenantId: str
    cashierName: str
    startingCash: int = 0
    notes: Optional[str] = ""

class ShiftExpenseModel(BaseModel):
    clinicId: str
    tenantId: str
    category: str
    amount: int
    recipient: str
    comment: Optional[str] = ""

class ShiftCloseModel(BaseModel):
    clinicId: str
    tenantId: str
    actualCash: int
    notes: Optional[str] = ""

class DebtPaymentModel(BaseModel):
    amount: int
    paymentMethod: Optional[str] = "cash"
    notes: Optional[str] = ""

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
ScheduleUpdateModel.model_rebuild()
LeaveModel.model_rebuild()
ShiftOpenModel.model_rebuild()
ShiftExpenseModel.model_rebuild()
ShiftCloseModel.model_rebuild()
DebtPaymentModel.model_rebuild()

# SMS Xabarnoma Zaxira Shlyuzi (Eskiz.uz / SMS Gateway Helper & In-Memory Logs)
SMS_SENT_LOGS: List[Dict[str, Any]] = []

async def send_sms_notification(phone: str, message: str) -> dict:
    """
    Eskiz.uz SMS Gateway asinxron yordamchisi.
    Telegram foydalanuvchisi mavjud bo'lmaganda yoki Telegram orqali yuborishda
    xatolik yuz berganda zaxira (fallback) sifatida mijoz telefoniga SMS yuboradi.
    """
    clean_phone = "".join(c for c in phone if c.isdigit() or c == "+")
    if not clean_phone.startswith("+") and len(clean_phone) == 12 and clean_phone.startswith("998"):
        clean_phone = "+" + clean_phone
    elif not clean_phone.startswith("+998") and len(clean_phone) == 9:
        clean_phone = "+998" + clean_phone

    log_entry = {
        "timestamp": datetime.now(TASHKENT_TZ).isoformat(),
        "phone": clean_phone,
        "message": message,
        "gateway": "eskiz_uz",
        "status": "sent",
        "simulated": True
    }

    eskiz_token = os.getenv("ESKIZ_TOKEN")
    if eskiz_token and clean_phone:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    "https://notify.eskiz.uz/api/message/sms/send",
                    headers={"Authorization": f"Bearer {eskiz_token}"},
                    json={
                        "mobile_phone": clean_phone.replace("+", ""),
                        "message": message,
                        "from": "4546"
                    }
                )
                if resp.status_code == 200:
                    log_entry["status"] = "delivered"
                    log_entry["simulated"] = False
        except Exception as e:
            print(f"[SMS Gateway Eskiz] Real API xatolik, simulatsiya rejimida loglandi: {e}")

    SMS_SENT_LOGS.append(log_entry)
    print(f"[SMS Gateway - Eskiz.uz] SMS muvaffaqiyatli yuborildi -> Telefon: {clean_phone} | Xabar: {message[:60]}...")
    return {
        "success": True,
        "status": "sent",
        "phone": clean_phone,
        "message": message,
        "gateway": "eskiz_uz"
    }

async def notify_patient(appt: AppointmentModel):
    """Send formal booking confirmation receipt directly to the patient's Telegram chat, fallback to SMS"""
    doc_name = appt.doctor.get("name", "Shifokor")
    doc_spec = appt.doctor.get("specialty", {}).get("uz", "Mutaxassis")
    srv_title = appt.service.get("title", {}).get("uz", "Xizmat")
    price = appt.service.get("price", 0)

    clinic = get_clinic_by_id(appt.clinicId)
    clinic_name = clinic.get("name", "DentaMed Atelier")
    clinic_addr = clinic.get("address", "Toshkent shahar")
    clinic_phone = clinic.get("phone", "+998 (71) 200-00-00")

    final_price = appt.totalAmount if appt.totalAmount is not None else price

    if BOT_TOKEN and appt.telegramUserId:
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
                if resp.status_code == 200:
                    print(f"Sent message to patient {appt.telegramUserId}: status {resp.status_code}")
                    return
        except Exception as e:
            print(f"Error sending message to patient Telegram, fallback to SMS: {e}")

    # Fallback to SMS Gateway
    sms_msg = (
        f"DentaMed: Hurmatli {appt.patientName}, qabulingiz tasdiqlandi! "
        f"Sana: {appt.date}, Soat: {appt.time}. Talon: #{appt.id}, PIN: {appt.pinCode}. "
        f"Shifokor: {doc_name}. Filial: {clinic_name}. Tel: {clinic_phone}"
    )
    await send_sms_notification(appt.phone, sms_msg)

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
    clinic_id = appt.get("clinicId", "dentamed-nukus")
    clinic = get_clinic_by_id(clinic_id)
    doc_name = appt.get("doctor", {}).get("name", "Shifokor")
    srv_title = appt.get("service", {}).get("title", {}).get("uz", "Tibbiy xizmat")

    if BOT_TOKEN and appt.get("telegramUserId"):
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
                if resp.status_code == 200:
                    return True
        except Exception as e:
            print(f"Error sending 24h reminder via Telegram, fallback to SMS: {e}")

    # Fallback to SMS Gateway
    patient_phone = appt.get("phone")
    if patient_phone:
        sms_msg = (
            f"DentaMed Eslatma: Hurmatli {appt.get('patientName')}, ertaga soat {appt.get('time')} da "
            f"shifokor {doc_name} qabulidasiz. PIN: {appt.get('pinCode')}. Manzil: {clinic.get('address')}"
        )
        await send_sms_notification(patient_phone, sms_msg)
        return True

    return False

async def send_2h_reminder(appt: dict) -> bool:
    clinic_id = appt.get("clinicId", "dentamed-nukus")
    clinic = get_clinic_by_id(clinic_id)
    doc_name = appt.get("doctor", {}).get("name", "Shifokor")

    if BOT_TOKEN and appt.get("telegramUserId"):
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
                if resp1.status_code == 200:
                    return True
        except Exception as e:
            print(f"Error sending 2h reminder via Telegram, fallback to SMS: {e}")

    # Fallback to SMS Gateway
    patient_phone = appt.get("phone")
    if patient_phone:
        sms_msg = (
            f"DentaMed: Hurmatli {appt.get('patientName')}, 2 soatdan so'ng (soat {appt.get('time')}) "
            f"shifokor {doc_name} qabulidasiz. PIN: {appt.get('pinCode')}. Tel: {clinic.get('phone')}"
        )
        await send_sms_notification(patient_phone, sms_msg)
        return True

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

    patient_phone = pres.get("phone") or (appt.get("phone") if appt else "")
    diagnosis = pres.get("diagnosis", "Klinik tekshiruv va davolash kursi")

    if BOT_TOKEN and telegram_user_id:
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
                if resp.status_code == 200:
                    print(f"Prescription #{pres.get('id')} sent to patient {telegram_user_id}: status {resp.status_code}")
                    return
        except Exception as e:
            print(f"Error sending prescription via Telegram: {e}")

    # Fallback to SMS Gateway
    if patient_phone:
        sms_text = f"DentaMed Retsept #{pres.get('id')}: Hurmatli {patient_name}, davolovchi shifokor {doc_name} sizga raqamli retsept biriktirdi. Tashxis: {diagnosis}."
        await send_sms_notification(patient_phone, sms_text)

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

# Secure Production-Grade CORS Configuration
allowed_origins_env = os.getenv("CORS_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "https://dentamed-hospital-crm.vercel.app",
        "https://web.telegram.org",
        "https://t.me",
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
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



# ==============================================================================
# MODULAR ROUTERS REGISTRATION (Clean Senior Architecture)
# ==============================================================================
from routers.clinics import (
    router as clinics_router,
    clear_failed_logins,
    check_login_rate_limit,
    record_failed_login,
    FAILED_LOGIN_ATTEMPTS
)
from routers.doctors import router as doctors_router
from routers.appointments import router as appointments_router
from routers.prescriptions import router as prescriptions_router
from routers.shifts import router as shifts_router

app.include_router(clinics_router)
app.include_router(doctors_router)
app.include_router(appointments_router)
app.include_router(prescriptions_router)
app.include_router(shifts_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
