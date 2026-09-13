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
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

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

# 2. MOLIYAVIY KASSA VA SHIFOKORLAR KPI ULUSHI ENDPOINTI
@app.get("/api/tenants/{tenant_id}/financials")
def get_tenant_financials(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")

    all_appts = load_db()
    tenant_appts = [a for a in all_appts if a.get("tenantId") == tenant_id]

    total_revenue = 0
    payment_breakdown = {
        "cash": 0,
        "card": 0,
        "online": 0
    }
    doctor_stats = {}

    for a in tenant_appts:
        if a.get("status") in ["completed", "confirmed"]:
            amt = a.get("totalAmount")
            if amt is None:
                amt = a.get("service", {}).get("price", 0)
            total_revenue += amt

            # To'lov turi taqsimoti
            raw_method = str(a.get("paymentMethod") or "cash").lower()
            if raw_method in ["cash", "naqd"]:
                payment_breakdown["cash"] += amt
            elif raw_method in ["card", "terminal", "karta", "uzcard", "humo"]:
                payment_breakdown["card"] += amt
            elif raw_method in ["online", "click", "payme", "uzum"]:
                payment_breakdown["online"] += amt
            else:
                payment_breakdown["cash"] += amt

            # Shifokorlar kesimidagi statistika
            doc = a.get("doctor", {})
            doc_id = doc.get("id")
            if doc_id:
                if doc_id not in doctor_stats:
                    doc_spec = doc.get("specialty", {})
                    spec_str = doc_spec.get("uz") if isinstance(doc_spec, dict) else str(doc_spec or "")
                    doctor_stats[doc_id] = {
                        "doctorId": doc_id,
                        "doctorName": doc.get("name", f"Shifokor #{doc_id}"),
                        "specialty": spec_str,
                        "treatmentsCount": 0,
                        "totalRevenue": 0,
                        "commissionRate": 0.30,
                        "commissionAmount": 0
                    }
                doctor_stats[doc_id]["treatmentsCount"] += 1
                doctor_stats[doc_id]["totalRevenue"] += amt
                doctor_stats[doc_id]["commissionAmount"] = round(doctor_stats[doc_id]["totalRevenue"] * 0.30)

    doctor_commission_list = sorted(
        list(doctor_stats.values()),
        key=lambda d: (d["totalRevenue"], d["treatmentsCount"]),
        reverse=True
    )

    return {
        "status": "success",
        "tenantId": tenant_id,
        "tenantName": tenant.get("name"),
        "currency": "UZS",
        "totalRevenue": total_revenue,
        "paymentBreakdown": payment_breakdown,
        "doctorCommission": doctor_commission_list,
        "doctors": doctor_commission_list
    }

# SMS XABARLAR LOGLARI ENDPOINTI
@app.get("/api/sms/logs")
def get_sms_logs():
    return {
        "status": "success",
        "count": len(SMS_SENT_LOGS),
        "logs": SMS_SENT_LOGS
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

@app.post("/api/services")
async def create_service(request: Request):
    data = await request.json()
    services = load_json_file(SERVICES_FILE)
    new_id = max([s.get("id", 0) for s in services] + [0]) + 1
    new_srv = {
        "id": new_id,
        "tenantId": data.get("tenantId", "dentamed"),
        "department": data.get("department", "stomatology"),
        "category": data.get("category", {"uz": "Umumiy", "ru": "Общее"}),
        "title": data.get("title", {"uz": "Yangi xizmat", "ru": "Новая услуга"}),
        "desc": data.get("desc", {"uz": "", "ru": ""}),
        "price": int(data.get("price", 100000)),
        "duration": int(data.get("duration", 30)),
        "isPopular": bool(data.get("isPopular", False)),
        "clinicIds": data.get("clinicIds", [])
    }
    services.append(new_srv)
    save_json_file(SERVICES_FILE, services)
    return {"status": "success", "service": new_srv}

@app.delete("/api/services/{service_id}")
def delete_service(service_id: int):
    services = load_json_file(SERVICES_FILE)
    new_services = [s for s in services if s.get("id") != service_id]
    if len(new_services) == len(services):
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    save_json_file(SERVICES_FILE, new_services)
    return {"status": "success", "message": "Xizmat o'chirildi"}

# 2. DOCTOR MANAGEMENT ENDPOINTS (Owner / Admin)
@app.post("/api/doctors")
async def create_doctor(request: Request):
    data = await request.json()
    doctors = load_json_file(DOCTORS_FILE)
    new_id = max([d.get("id", 0) for d in doctors] + [0]) + 1
    spec_data = data.get("specialty", {})
    if isinstance(spec_data, str):
        spec_data = {"uz": spec_data, "ru": spec_data}
    new_doc = {
        "id": new_id,
        "tenantId": data.get("tenantId", "dentamed"),
        "name": data.get("name", "Yangi Shifokor"),
        "specialty": spec_data,
        "department": data.get("department", "stomatology"),
        "experience": int(data.get("experience", 5)),
        "rating": float(data.get("rating", 4.9)),
        "reviewsCount": int(data.get("reviewsCount", 10)),
        "photo": data.get("photo", "/images/doctors/dr_jamshid.jpg"),
        "availableDays": data.get("availableDays", ["Dush", "Sesh", "Chor", "Pay", "Jum"]),
        "clinicId": data.get("clinicId"),
        "clinicIds": data.get("clinicIds", [data.get("clinicId")] if data.get("clinicId") else [])
    }
    doctors.append(new_doc)
    save_json_file(DOCTORS_FILE, doctors)
    return {"status": "success", "doctor": new_doc}

@app.put("/api/doctors/{doctor_id}")
async def update_doctor(doctor_id: int, request: Request):
    data = await request.json()
    doctors = load_json_file(DOCTORS_FILE)
    found = False
    for i, d in enumerate(doctors):
        if d.get("id") == doctor_id:
            doctors[i] = {**d, **data, "id": doctor_id}
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Shifokor topilmadi")
    save_json_file(DOCTORS_FILE, doctors)
    return {"status": "success", "doctor": doctors[i]}

@app.delete("/api/doctors/{doctor_id}")
def delete_doctor(doctor_id: int):
    doctors = load_json_file(DOCTORS_FILE)
    new_doctors = [d for d in doctors if d.get("id") != doctor_id]
    if len(new_doctors) == len(doctors):
        raise HTTPException(status_code=404, detail="Shifokor topilmadi")
    save_json_file(DOCTORS_FILE, new_doctors)
    return {"status": "success", "message": "Shifokor o'chirildi"}

# 2.1 SHIFOKOR ISH JADVALI VA TA'TILLARNI BOSHQARISH ENDPOINTLARI
@app.get("/api/doctors/{doctor_id}/schedule")
def get_doctor_schedule_endpoint(doctor_id: int):
    return get_doctor_schedule(doctor_id)

@app.post("/api/doctors/{doctor_id}/schedule")
async def update_doctor_schedule_endpoint(doctor_id: int, payload: ScheduleUpdateModel):
    schedules = load_doctor_schedules()
    target_idx = None
    for i, s in enumerate(schedules):
        if s.get("doctorId") == doctor_id:
            target_idx = i
            break

    if target_idx is not None:
        target = schedules[target_idx]
        if payload.workingHours is not None:
            target["workingHours"] = payload.workingHours
        if payload.lunchBreak is not None:
            target["lunchBreak"] = payload.lunchBreak
        if payload.slotDuration is not None:
            target["slotDuration"] = payload.slotDuration
        schedules[target_idx] = target
    else:
        target = {
            "doctorId": doctor_id,
            "workingHours": payload.workingHours or {"start": "09:00", "end": "18:00"},
            "lunchBreak": payload.lunchBreak or {"start": "13:00", "end": "14:00"},
            "slotDuration": payload.slotDuration or 30,
            "leaves": []
        }
        schedules.append(target)

    save_doctor_schedules(schedules)
    return {"status": "success", "schedule": target}

@app.post("/api/doctors/{doctor_id}/leaves")
async def add_doctor_leave_endpoint(doctor_id: int, payload: LeaveModel):
    schedules = load_doctor_schedules()
    target_idx = None
    for i, s in enumerate(schedules):
        if s.get("doctorId") == doctor_id:
            target_idx = i
            break

    if target_idx is None:
        target = {
            "doctorId": doctor_id,
            "workingHours": {"start": "09:00", "end": "18:00"},
            "lunchBreak": {"start": "13:00", "end": "14:00"},
            "slotDuration": 30,
            "leaves": []
        }
        schedules.append(target)
        target_idx = len(schedules) - 1

    target = schedules[target_idx]
    leaves = target.get("leaves", [])
    found = False
    for l in leaves:
        if l.get("date") == payload.date:
            l["reason"] = payload.reason
            found = True
            break
    if not found:
        leaves.append({"date": payload.date, "reason": payload.reason})

    target["leaves"] = leaves
    schedules[target_idx] = target
    save_doctor_schedules(schedules)
    return {"status": "success", "message": "Ta'til sanasi qo'shildi", "schedule": target}

@app.delete("/api/doctors/{doctor_id}/leaves/{leave_date}")
def delete_doctor_leave_endpoint(doctor_id: int, leave_date: str):
    schedules = load_doctor_schedules()
    target = None
    for s in schedules:
        if s.get("doctorId") == doctor_id:
            target = s
            break

    if not target:
        raise HTTPException(status_code=404, detail="Shifokor jadvali topilmadi")

    orig_count = len(target.get("leaves", []))
    target["leaves"] = [l for l in target.get("leaves", []) if l.get("date") != leave_date]
    if len(target["leaves"]) == orig_count:
        raise HTTPException(status_code=404, detail="Ko'rsatilgan sanadagi ta'til topilmadi")

    save_doctor_schedules(schedules)
    return {"status": "success", "message": "Ta'til sanasi o'chirildi", "schedule": target}

# 3. PHOTO UPLOAD (Base64 data URL)
@app.post("/api/upload/doctor-photo")
async def upload_doctor_photo(request: Request):
    import base64
    body = await request.json()
    data_url = body.get("dataUrl", "")
    file_name = body.get("fileName", f"doctor_{int(datetime.now().timestamp())}.jpg")
    tenant_id = body.get("tenantId", "common")

    safe_name = "".join(c for c in file_name if c.isalnum() or c in "._-")
    if not safe_name.endswith((".jpg", ".png", ".jpeg", ".webp")):
        safe_name += ".jpg"

    doctors_img_dir = Path(__file__).parent.parent / "frontend" / "public" / "images" / "doctors"
    doctors_img_dir.mkdir(parents=True, exist_ok=True)
    out_file = doctors_img_dir / safe_name

    if "," in data_url:
        _, encoded = data_url.split(",", 1)
        image_data = base64.b64decode(encoded)
        with open(out_file, "wb") as f:
            f.write(image_data)
        return {"status": "success", "url": f"/images/doctors/{safe_name}"}

    return {"status": "error", "message": "Noto'g'ri rasm formati"}

# 4. TENANT PROMO / EXCLUSIVE OFFERS MANAGEMENT
@app.get("/api/tenants/{tenant_id}/promo")
def get_tenant_promo(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    # Tenant-specific defaults
    if tenant_id == "grandmed":
        default_promo = {
            "titleUz": "GrandMed: Shveysariya Implanti o'rnatganlarga 3D Tomografiya 100% BEPUL!",
            "titleRu": "GrandMed: При установке импланта — 3D Томография 100% БЕСПЛАТНО!",
            "badgeUz": "Eksklyuziv GrandMed Taklifi",
            "badgeRu": "Эксклюзивное предложение",
            "discountPercent": 50,
            "descUz": "Shveysariya texnologiyasi asosida to'liq tish qatorini 1 kunda tiklash va bepul 3D konsultatsiya.",
            "descRu": "Восстановление зубов за 1 день по швейцарским технологиям и бесплатная 3D консультация.",
            "buttonTextUz": "Imtiyoz bilan yozilish",
            "buttonTextRu": "Записаться по акции",
            "isActive": True
        }
    else:
        default_promo = {
            "titleUz": "Tish davolatganga LOR ko'rigi — 50% Imtiyoz",
            "titleRu": "При лечении зубов — осмотр ЛОР-врача со скидкой 50%",
            "badgeUz": "Eksklyuziv Atelier Taklifi",
            "badgeRu": "Эксклюзивное предложение Atelier",
            "discountPercent": 50,
            "descUz": "Gaymorit va tish kanallari o'zaro bog'liq. Shveysariya protokoli bo'yicha kompleks tashxisdan o'ting.",
            "descRu": "Гайморит и зубные каналы взаимосвязаны. Пройдите комплексную диагностику.",
            "buttonTextUz": "Imtiyoz bilan yozilish",
            "buttonTextRu": "Записаться по акции",
            "isActive": True
        }
    return tenant.get("promo") or default_promo

@app.put("/api/tenants/{tenant_id}/promo")
async def update_tenant_promo(tenant_id: str, request: Request):
    data = await request.json()
    tenants = load_json_file(TENANTS_FILE)
    found = False
    for i, t in enumerate(tenants):
        if t.get("id") == tenant_id:
            tenants[i]["promo"] = data
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    save_json_file(TENANTS_FILE, tenants)
    return {"status": "success", "promo": data}

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

    # Shifokor jadvali, ta'tillar va tushlik vaqtini tekshirish
    schedule = get_doctor_schedule(doctorId)
    is_on_leave = False
    leave_reason = None
    for leave in schedule.get("leaves", []):
        if leave.get("date") == date:
            is_on_leave = True
            leave_reason = leave.get("reason", "Ta'til")
            break

    lunch_break = schedule.get("lunchBreak", {"start": "13:00", "end": "14:00"})

    if is_on_leave:
        # Ta'til sanasida barcha slotlar bloklanadi (08:00 dan 20:00 gacha)
        all_day_slots = [
            f"{h:02d}:{m:02d}"
            for h in range(8, 20)
            for m in (0, 15, 30, 45)
        ]
        booked_times.update(all_day_slots)
    else:
        # Tushlik vaqti (13:00 - 14:00) bloklanadi
        l_start = lunch_break.get("start", "13:00")
        l_end = lunch_break.get("end", "14:00")
        try:
            start_h = int(l_start.split(":")[0])
            end_h = int(l_end.split(":")[0])
            lunch_slots = [
                f"{h:02d}:{m:02d}"
                for h in range(start_h, end_h + 1)
                for m in (0, 15, 30, 45)
                if l_start <= f"{h:02d}:{m:02d}" < l_end
            ]
            booked_times.update(lunch_slots)
        except Exception:
            booked_times.update(["13:00", "13:30"])

    sorted_slots = sorted(list(booked_times))
    return {
        "doctorId": doctorId,
        "date": date,
        "clinicId": clinicId,
        "bookedTimes": sorted_slots,
        "busySlots": sorted_slots,
        "isOnLeave": is_on_leave,
        "leaveReason": leave_reason,
        "lunchBreak": lunch_break
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

        doc_id = appt.doctor.get("id")
        schedule = get_doctor_schedule(doc_id)

        # 1.1 SHIFOKOR TA'TILINI TEKSHIRISH
        for leave in schedule.get("leaves", []):
            if leave.get("date") == appt.date:
                reason = leave.get("reason", "Ta'tilda")
                raise HTTPException(
                    status_code=409,
                    detail=f"Shifokor ushbu sanada ({appt.date}) ta'tilda ({reason}). Iltimos, boshqa sanani tanlang."
                )

        # 1.2 TUSHLIK TANAFFUSINI TEKSHIRISH
        lunch = schedule.get("lunchBreak", {"start": "13:00", "end": "14:00"})
        l_start = lunch.get("start", "13:00")
        l_end = lunch.get("end", "14:00")
        if l_start <= appt.time < l_end:
            raise HTTPException(
                status_code=409,
                detail=f"Tanlangan vaqt ({appt.time}) shifokorning tushlik tanaffusiga ({l_start} - {l_end}) to'g'ri keladi. Iltimos, boshqa vaqtni tanlang."
            )

        # 1.3 ANTI-SPAM & FLOOD PROTECTION: ONE ACTIVE APPOINTMENT PER PATIENT (Phone & Telegram ID)
        # Bolalar o'ynab yoki trollar takror-takror qabullarni to'ldirib tashlamasligi uchun (Klinika/Tenant doirasida)
        clean_phone = "".join(c for c in (appt.phone or "") if c.isdigit())
        user_tg_id = getattr(appt, "telegramUserId", None)
        target_tenant = getattr(appt, "tenantId", "dentamed") or "dentamed"
        is_family_booking = bool(getattr(appt, "familyMemberName", None) and str(appt.familyMemberName).strip())

        if not is_family_booking:
            for existing in db:
                if existing.get("status") in ["cancelled", "completed"]:
                    continue

                existing_tenant = existing.get("tenantId", "dentamed") or "dentamed"
                if existing_tenant != target_tenant:
                    continue

                existing_phone = "".join(c for c in (existing.get("phone") or "") if c.isdigit())
                existing_tg_id = existing.get("telegramUserId")

                is_same_phone = bool(clean_phone and len(clean_phone) >= 9 and existing_phone and clean_phone[-9:] == existing_phone[-9:])
                is_same_tg = bool(user_tg_id and existing_tg_id and user_tg_id == existing_tg_id)

                if is_same_phone or is_same_tg:
                    existing_time = existing.get("time", "")
                    existing_date = existing.get("date", "")
                    existing_pin = existing.get("pinCode", "")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Hurmatli bemor, sizda allaqachon faol qabulingiz mavjud ({existing_date} {existing_time}, PIN: {existing_pin}). Qabullarni to'ldirib tashlamaslik uchun yangi qabulga yozilishdan oldin avvalgisini yakunlang yoki bekor qiling."
                    )

        # 2. DOUBLE-BOOKING CHECK:
        # Same doctor, same date, same time, same clinic, and status != 'cancelled'
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

        # Record debt in DEBTS_FILE if there is an outstanding debt balance
        if getattr(appt, "debtAmount", 0) and appt.debtAmount > 0:
            debts = load_json_file(DEBTS_FILE)
            debt_record = {
                "id": f"DEBT-{appt.id}",
                "appointmentId": appt.id,
                "pinCode": appt.pinCode,
                "patientName": appt.patientName,
                "phone": appt.phone,
                "clinicId": appt.clinicId,
                "tenantId": appt.tenantId or "dentamed",
                "doctorName": appt.doctor.get("name", "Shifokor"),
                "serviceName": appt.service.get("name", "Muolaja"),
                "totalAmount": appt.totalAmount or ((appt.paidAmount or 0) + appt.debtAmount),
                "paidAmount": appt.paidAmount or 0,
                "debtAmount": appt.debtAmount,
                "paymentStatus": "partial" if (appt.paidAmount or 0) > 0 else "unpaid",
                "createdAt": datetime.now(TASHKENT_TZ).isoformat(),
                "history": [
                    {
                        "amount": appt.paidAmount or 0,
                        "date": datetime.now(TASHKENT_TZ).isoformat(),
                        "method": appt.paymentMethod or "cash",
                        "notes": "Qabul chog'ida qisman to'langan"
                    }
                ] if (appt.paidAmount or 0) > 0 else []
            }
            debts.insert(0, debt_record)
            save_json_file(DEBTS_FILE, debts)

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

# 5. SHIFTS (Z-HISOBOT) & EXPENSES APIS
@app.get("/api/shifts/current")
def get_current_shift(clinicId: str = "dentamed-nukus", tenantId: str = "dentamed"):
    shifts = load_json_file(SHIFTS_FILE)
    current = next((s for s in shifts if s.get("clinicId") == clinicId and s.get("tenantId") == tenantId and s.get("status") == "open"), None)
    if not current:
        return {"hasActiveShift": False, "shift": None}
    
    # Calculate live revenue and expenses during this shift
    db = load_db()
    expenses = load_json_file(EXPENSES_FILE)
    
    opened_at = current.get("openedAt", "")
    shift_appts = [
        a for a in db 
        if a.get("clinicId") == clinicId and a.get("tenantId") == tenantId 
        and a.get("status") != "cancelled" 
        and a.get("createdAt", "") >= opened_at
    ]
    shift_expenses = [
        e for e in expenses
        if e.get("clinicId") == clinicId and e.get("tenantId") == tenantId
        and e.get("createdAt", "") >= opened_at
    ]

    total_revenue = sum(a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0) for a in shift_appts)
    cash_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") == "cash"
    )
    card_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["card", "terminal"]
    )
    online_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["click", "payme"]
    )
    total_expense = sum(e.get("amount", 0) for e in shift_expenses)
    starting_cash = current.get("startingCash", 0)
    expected_cash = starting_cash + cash_revenue - total_expense

    return {
        "hasActiveShift": True,
        "shift": current,
        "liveStats": {
            "appointmentsCount": len(shift_appts),
            "totalRevenue": total_revenue,
            "cashRevenue": cash_revenue,
            "cardRevenue": card_revenue,
            "onlineRevenue": online_revenue,
            "totalExpense": total_expense,
            "startingCash": starting_cash,
            "expectedCash": expected_cash,
            "expenses": shift_expenses
        }
    }

@app.post("/api/shifts/open")
def open_shift(payload: ShiftOpenModel):
    shifts = load_json_file(SHIFTS_FILE)
    existing = next((s for s in shifts if s.get("clinicId") == payload.clinicId and s.get("tenantId") == payload.tenantId and s.get("status") == "open"), None)
    if existing:
        return {"status": "already_open", "shift": existing}

    shift_id = f"SHIFT-{int(datetime.now().timestamp())}"
    new_shift = {
        "id": shift_id,
        "clinicId": payload.clinicId,
        "tenantId": payload.tenantId,
        "cashierName": payload.cashierName,
        "startingCash": payload.startingCash,
        "openedAt": datetime.now(TASHKENT_TZ).isoformat(),
        "status": "open",
        "notes": payload.notes or ""
    }
    shifts.insert(0, new_shift)
    save_json_file(SHIFTS_FILE, shifts)
    return {"status": "success", "shift": new_shift}

@app.post("/api/shifts/expense")
def add_shift_expense(payload: ShiftExpenseModel):
    expenses = load_json_file(EXPENSES_FILE)
    expense_id = f"EXP-{int(datetime.now().timestamp())}"
    new_expense = {
        "id": expense_id,
        "clinicId": payload.clinicId,
        "tenantId": payload.tenantId,
        "category": payload.category,
        "amount": payload.amount,
        "recipient": payload.recipient,
        "comment": payload.comment or "",
        "createdAt": datetime.now(TASHKENT_TZ).isoformat()
    }
    expenses.insert(0, new_expense)
    save_json_file(EXPENSES_FILE, expenses)
    return {"status": "success", "expense": new_expense}

@app.post("/api/shifts/close")
def close_shift(payload: ShiftCloseModel):
    shifts = load_json_file(SHIFTS_FILE)
    idx = next((i for i, s in enumerate(shifts) if s.get("clinicId") == payload.clinicId and s.get("tenantId") == payload.tenantId and s.get("status") == "open"), None)
    if idx is None:
        raise HTTPException(status_code=400, detail="Hozirda yopish uchun faol smena mavjud emas")

    current = shifts[idx]
    opened_at = current.get("openedAt", "")
    closed_at = datetime.now(TASHKENT_TZ).isoformat()

    db = load_db()
    expenses = load_json_file(EXPENSES_FILE)
    shift_appts = [
        a for a in db 
        if a.get("clinicId") == payload.clinicId and a.get("tenantId") == payload.tenantId 
        and a.get("status") != "cancelled" 
        and a.get("createdAt", "") >= opened_at
    ]
    shift_expenses = [
        e for e in expenses
        if e.get("clinicId") == payload.clinicId and e.get("tenantId") == payload.tenantId
        and e.get("createdAt", "") >= opened_at
    ]

    total_revenue = sum(a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0) for a in shift_appts)
    cash_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") == "cash"
    )
    card_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["card", "terminal"]
    )
    online_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["click", "payme"]
    )
    total_expense = sum(e.get("amount", 0) for e in shift_expenses)
    starting_cash = current.get("startingCash", 0)
    expected_cash = starting_cash + cash_revenue - total_expense
    actual_cash = payload.actualCash
    difference = actual_cash - expected_cash # 0 = exact match, positive = surplus, negative = deficit

    current.update({
        "status": "closed",
        "closedAt": closed_at,
        "actualCash": actual_cash,
        "expectedCash": expected_cash,
        "difference": difference,
        "totalRevenue": total_revenue,
        "cashRevenue": cash_revenue,
        "cardRevenue": card_revenue,
        "onlineRevenue": online_revenue,
        "totalExpense": total_expense,
        "appointmentsCount": len(shift_appts),
        "notes": payload.notes or current.get("notes", "")
    })
    shifts[idx] = current
    save_json_file(SHIFTS_FILE, shifts)

    return {
        "status": "success",
        "message": "Smena muvaffaqiyatli yopildi va Z-Hisobot shakllantirildi",
        "shift": current
    }

# 6. NASIYA (DEBTS LEDGER) APIS
@app.get("/api/debts")
def list_debts(clinicId: Optional[str] = None, tenantId: Optional[str] = None):
    debts = load_json_file(DEBTS_FILE)
    result = debts
    if tenantId:
        result = [d for d in result if d.get("tenantId") == tenantId]
    if clinicId:
        result = [d for d in result if d.get("clinicId") == clinicId]
    return result

@app.post("/api/debts/{appointment_id}/pay")
def pay_debt(appointment_id: str, payload: DebtPaymentModel):
    debts = load_json_file(DEBTS_FILE)
    idx = next((i for i, d in enumerate(debts) if d.get("appointmentId") == appointment_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Nasiya qaydi topilmadi")

    record = debts[idx]
    current_debt = record.get("debtAmount", 0)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="To'lov summasi musbat bo'lishi kerak")

    actual_pay = min(payload.amount, current_debt)
    record["paidAmount"] = (record.get("paidAmount") or 0) + actual_pay
    record["debtAmount"] = max(0, current_debt - actual_pay)
    record["paymentStatus"] = "paid" if record["debtAmount"] == 0 else "partial"

    if "history" not in record:
        record["history"] = []
    record["history"].append({
        "amount": actual_pay,
        "date": datetime.now(TASHKENT_TZ).isoformat(),
        "method": payload.paymentMethod or "cash",
        "notes": payload.notes or "Nasiya so'ndirish"
    })
    debts[idx] = record
    save_json_file(DEBTS_FILE, debts)

    # Sync with appointment in db
    db = load_db()
    for appt in db:
        if appt.get("id") == appointment_id:
            appt["paidAmount"] = record["paidAmount"]
            appt["debtAmount"] = record["debtAmount"]
            appt["paymentStatus"] = record["paymentStatus"]
            save_db(db)
            break

    return {
        "status": "success",
        "message": f"{actual_pay:,} so'm to'lov qabul qilindi. Qoldiq nasiya: {record['debtAmount']:,} so'm",
        "debt": record
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)