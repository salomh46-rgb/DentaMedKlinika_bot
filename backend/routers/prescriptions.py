from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone, timedelta
import server
from server import *

router = APIRouter(tags=["Prescriptions & Reminders"])

@router.post("/api/reminders/process")
async def process_reminders():
    sent_count = await check_and_send_reminders()
    return {
        "status": "success",
        "processedAt": datetime.now(TASHKENT_TZ).isoformat(),
        "remindersSent": sent_count
    }

# 4. POST-VISIT DIGITAL PRESCRIPTION APIS
@router.get("/api/prescriptions")
def list_prescriptions():
    return load_json_file(server.PRESCRIPTIONS_FILE)

@router.get("/api/prescriptions/{appointment_id}")
def get_prescription(appointment_id: str):
    prescriptions = load_json_file(server.PRESCRIPTIONS_FILE)
    for p in prescriptions:
        if p.get("appointmentId") == appointment_id:
            return p
    raise HTTPException(status_code=404, detail="Ushbu qabul bo'yicha retsept topilmadi")

@router.post("/api/prescriptions")
async def create_prescription(pres: PrescriptionModel):
    prescriptions = load_json_file(server.PRESCRIPTIONS_FILE)
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

    save_json_file(server.PRESCRIPTIONS_FILE, prescriptions)

    await server.notify_prescription(pres_dict, appt)

    return {
        "status": "success",
        "message": "Raqamli retsept muvaffaqiyatli saqlandi va Telegram orqali bemorga yuborildi",
        "prescription": pres_dict
    }

# 5. SHIFTS (Z-HISOBOT) & EXPENSES APIS
