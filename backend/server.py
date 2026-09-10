import os
import sys
import json
from datetime import datetime
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_FILE = DATA_DIR / "appointments.json"
DOCTORS_FILE = DATA_DIR / "doctors.json"
SERVICES_FILE = DATA_DIR / "services.json"

if not DB_FILE.exists():
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

def load_json_file(file_path: Path) -> list:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_json_file(file_path: Path, data: list):
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

app = FastAPI(title="DentaMed Clinic API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AppointmentModel(BaseModel):
    id: str
    pinCode: str
    patientName: str
    phone: str
    doctor: dict
    service: dict
    date: str
    time: str
    status: str = "confirmed"
    notes: Optional[str] = ""
    createdAt: str
    telegramUserId: Optional[int] = None
    telegramUsername: Optional[str] = None

def load_db() -> list:
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_db(data: list):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

async def notify_patient(appt: AppointmentModel):
    """Send formal booking confirmation receipt directly to the patient's Telegram chat"""
    if not BOT_TOKEN or not appt.telegramUserId:
        return

    doc_name = appt.doctor.get("name", "Shifokor")
    doc_spec = appt.doctor.get("specialty", {}).get("uz", "Mutaxassis")
    doc_room = appt.doctor.get("room", "204-kabinet")
    srv_title = appt.service.get("title", {}).get("uz", "Xizmat")
    price = appt.service.get("price", 0)

    # Calculate human-friendly date text (Ertaga, Indinga, etc.)
    patient_msg = (
        f"🎉 <b>QABULINGIZ TASDIQLANDI!</b>\n"
        f"────────────────────────\n"
        f"👤 <b>Hurmatli {appt.patientName}!</b>\n"
        f"Siz <b>DentaMed Atelier</b> klinikasida shifokor ko'rigiga muvaffaqiyatli yozildingiz.\n\n"
        f"👨‍⚕️ <b>Shifokor:</b> {doc_name}\n"
        f"💼 <b>Mutaxassisligi:</b> {doc_spec}\n"
        f"🦷 <b>Tanlangan xizmat:</b> {srv_title}\n"
        f"📅 <b>Qabul sanasi:</b> {appt.date}\n"
        f"⏰ <b>Qabul vaqti:</b> soat {appt.time}\n"
        f"💰 <b>Ko'rik narxi:</b> {price:,} so'm\n"
        f"────────────────────────\n"
        f"🎫 <b>Qabul Taloningiz:</b> <code>#{appt.id}</code>\n"
        f"🔑 <b>Retsepshnda aytiladigan kod:</b> <code>{appt.pinCode}</code>\n\n"
        f"📍 <b>Manzilimiz:</b> Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy (2-qavat, {doc_room})\n\n"
        f"ℹ️ <i>Iltimos, belgilangan vaqtdan 5-10 daqiqa oldinroq tashrif buyurishingizni so'raymiz. Retsepshnga ushbu <b>{appt.pinCode}</b> kodini ko'rsatib navbatsiz qabulga o'tasiz.</i>\n\n"
        f"📞 <b>Qo'shimcha savollar bo'lsa:</b> +998 (71) 200-00-00"
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

    admin_msg = (
        f"🚨 <b>YANGI BEMOR QABULGA YOZILDI!</b>\n"
        f"────────────────────────\n"
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

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "DentaMed Clinic API", "time": datetime.now().isoformat()}

@app.get("/api/doctors")
def get_doctors():
    """Return live list of doctors from database"""
    return load_json_file(DOCTORS_FILE)

@app.get("/api/services")
def get_services():
    """Return live list of clinic services & pricing from database"""
    return load_json_file(SERVICES_FILE)

@app.get("/api/clinic-data")
def get_clinic_data():
    """Return consolidated clinic configuration, doctors and services"""
    return {
        "clinicName": "DentaMed Atelier",
        "phone": "+998 (71) 200-00-00",
        "address": "Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy",
        "doctors": load_json_file(DOCTORS_FILE),
        "services": load_json_file(SERVICES_FILE),
    }

@app.put("/api/services/{service_id}")
async def update_service(service_id: int, request: Request):
    """Allow clinic admin to update service price or details without rebuilding frontend"""
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

@app.get("/api/appointments")
def get_appointments():
    return load_db()

@app.post("/api/appointments")
async def create_appointment(appt: AppointmentModel):
    db = load_db()
    # Check if duplicate ID
    if any(a.get("id") == appt.id for a in db):
        return {"status": "already_exists", "appointment": appt}

    db.insert(0, appt.dict())
    save_db(db)
    
    # 1. Send immediate confirmation receipt to the patient's Telegram
    await notify_patient(appt)
    
    # 2. Send notification to the Clinic Admin Group
    await notify_admin_group(appt)
    
    return {"status": "success", "message": "Qabul muvaffaqiyatli saqlandi va Telegramga xabar yuborildi", "appointment": appt}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
