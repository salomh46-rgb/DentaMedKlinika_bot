from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid

def parse_appointment_datetime(date_str: str, time_str: str) -> datetime:
    """Parse YYYY-MM-DD and HH:MM into datetime object"""
    return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")

def calculate_reminder_times(date_str: str, time_str: str) -> Dict[str, datetime]:
    """Calculate 24-hour and 2-hour reminder timestamps for an appointment"""
    appt_dt = parse_appointment_datetime(date_str, time_str)
    return {
        "appointment_datetime": appt_dt,
        "reminder_24h": appt_dt - timedelta(hours=24),
        "reminder_2h": appt_dt - timedelta(hours=2)
    }

def evaluate_reminders(appointment: Dict[str, Any], current_time: datetime) -> Dict[str, Any]:
    """
    Evaluate if 24h or 2h reminders should be dispatched.
    Returns status flags: should_send_24h, should_send_2h, is_expired.
    """
    appt_dt = parse_appointment_datetime(appointment["date"], appointment["time"])
    rem_24h = appt_dt - timedelta(hours=24)
    rem_2h = appt_dt - timedelta(hours=2)
    
    sent_24h = appointment.get("reminder_24h_sent", False)
    sent_2h = appointment.get("reminder_2h_sent", False)
    status = appointment.get("status", "confirmed")
    
    if status == "cancelled" or current_time >= appt_dt:
        return {
            "should_send_24h": False,
            "should_send_2h": False,
            "is_expired": current_time >= appt_dt,
            "is_cancelled": status == "cancelled"
        }
        
    should_send_24h = (current_time >= rem_24h) and (not sent_24h) and (current_time < rem_2h)
    should_send_2h = (current_time >= rem_2h) and (not sent_2h) and (current_time < appt_dt)
    
    # If 24h was never sent and we are already within 2h window, we prioritize the imminent 2h alert
    if current_time >= rem_2h and not sent_2h:
        should_send_2h = True
        should_send_24h = False

    return {
        "should_send_24h": should_send_24h,
        "should_send_2h": should_send_2h,
        "is_expired": False,
        "is_cancelled": False
    }

def format_reminder_message(appointment: Dict[str, Any], reminder_type: str) -> str:
    """Format Telegram HTML notification message for reminders"""
    patient_name = appointment.get("patientName", "Hurmatli bemor")
    date = appointment.get("date", "")
    time = appointment.get("time", "")
    pin_code = appointment.get("pinCode", "----")
    doctor = appointment.get("doctor", {})
    doc_name = doctor.get("name", "Shifokor") if isinstance(doctor, dict) else "Shifokor"
    branch = appointment.get("branch", "nukus").lower()
    
    branch_name = "Nukus filiali" if "nukus" in branch else "Chilonzor filiali"
    address = (
        "Mirobod t., Nukus ko'chasi, 24-uy (Rossiya elchixonasi yonida)"
        if "nukus" in branch
        else "Chilonzor t., Bunyodkor shoh ko'chasi, 42-uy (Mirzo Ulug'bek metro)"
    )

    if reminder_type == "24h":
        return (
            f"?? <b>DENTAMED: QABULINGIZGA 24 SOAT QOLDI!</b>\n"
            f"????????????????????????\n"
            f"?? Hurmatli <b>{patient_name}</b>!\n"
            f"Ertaga sizning qabulingiz rejalashtirilgan:\n\n"
            f"????? <b>Shifokor:</b> {doc_name}\n"
            f"?? <b>Sana & Vaqt:</b> {date} soat {time}\n"
            f"?? <b>Filial:</b> {branch_name}\n"
            f"?? <b>Manzil:</b> {address}\n"
            f"?? <b>Retsepshn PIN-kod:</b> <code>{pin_code}</code>\n"
            f"????????????????????????\n"
            f"?? <i>Iltimos, belgilangan vaqtdan 10 daqiqa oldinroq tashrif buyuring.</i>\n"
            f"?? Bog'lanish: +998 (71) 200-00-00"
        )
    elif reminder_type == "2h":
        return (
            f"? <b>TEZKOR ESLATMA: QABULGA 2 SOAT QOLDI!</b>\n"
            f"????????????????????????\n"
            f"?? Hurmatli <b>{patient_name}</b>!\n"
            f"Bugun soat <b>{time}</b> da sizni <b>{doc_name}</b> ko'rikka kutmoqda.\n\n"
            f"?? <b>Filial:</b> {branch_name}\n"
            f"?? <b>Manzil:</b> {address}\n"
            f"?? <b>Navbatsiz o'tish PIN-kodingiz:</b> <code>{pin_code}</code>\n"
            f"????????????????????????\n"
            f"?? Yo'lda tirbandliklarni hisobga olishingizni so'raymiz."
        )
    else:
        raise ValueError(f"Noma'lum eslatma turi: {reminder_type}")

def create_digital_prescription(
    appointment_id: str,
    patient_name: str,
    doctor_name: str,
    diagnosis: str,
    medications: List[Dict[str, Any]],
    recommendations: Optional[str] = None,
    branch: str = "nukus"
) -> Dict[str, Any]:
    """Create a validated digital prescription structure"""
    if not patient_name or not doctor_name:
        raise ValueError("Bemor va shifokor ismi ko'rsatilishi shart!")
    if not diagnosis:
        raise ValueError("Tashxis (diagnosis) ko'rsatilishi shart!")
    if not medications or len(medications) == 0:
        raise ValueError("Kamida bitta dori (medication) yozilishi shart!")
        
    rx_id = f"RX-{uuid.uuid4().hex[:8].upper()}"
    created_at = datetime.now().isoformat()
    
    return {
        "id": rx_id,
        "appointmentId": appointment_id,
        "patientName": patient_name,
        "doctorName": doctor_name,
        "diagnosis": diagnosis,
        "medications": medications,
        "recommendations": recommendations or "Ko'p suyuqlik ichish va gigiyenaga rioya qilish tavsiya etiladi.",
        "branch": branch,
        "createdAt": created_at,
        "verificationUrl": f"https://dentamed.uz/verify-rx/{rx_id}",
        "status": "active"
    }

def format_prescription_telegram_payload(prescription: Dict[str, Any], chat_id: int) -> Dict[str, Any]:
    """Format digital prescription into a production Telegram Bot payload"""
    rx_id = prescription["id"]
    patient = prescription["patientName"]
    doctor = prescription["doctorName"]
    diagnosis = prescription["diagnosis"]
    branch = prescription.get("branch", "nukus").upper()
    recs = prescription.get("recommendations", "")
    
    meds_text = ""
    for i, med in enumerate(prescription.get("medications", []), 1):
        name = med.get("name", "")
        dosage = med.get("dosage", "")
        instruction = med.get("instruction", "")
        duration = med.get("duration", "")
        meds_text += f"{i}. ?? <b>{name}</b> ({dosage})\n   ? <i>{instruction} ({duration})</i>\n"

    message_text = (
        f"?? <b>DENTAMED RAQAMLI RETSEPT (#{rx_id})</b>\n"
        f"????????????????????????\n"
        f"?? <b>Bemor:</b> {patient}\n"
        f"????? <b>Davolovchi Shifokor:</b> {doctor}\n"
        f"?? <b>Klinika Filiali:</b> DentaMed {branch}\n"
        f"?? <b>Klinik Tashxis:</b> {diagnosis}\n"
        f"????????????????????????\n"
        f"?? <b>BELGILANGAN DORI-DARMONLAR:</b>\n"
        f"{meds_text}\n"
        f"?? <b>Shifokor Tavsiyasi:</b>\n"
        f"{recs}\n"
        f"????????????????????????\n"
        f"?? <b>QR-Tekshiruv:</b> {prescription.get('verificationUrl')}"
    )

    inline_keyboard = [
        [
            {"text": "?? PDF Retseptni Yuklab Olish", "url": prescription.get("verificationUrl")},
            {"text": "?? Dorixonadan Buyurtma Berish", "url": "https://t.me/dentamed_pharmacy_bot"}
        ],
        [
            {"text": "? Dori Ichish Eslatmasini Yoqish", "callback_data": f"rx_remind_{rx_id}"}
        ]
    ]

    return {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "HTML",
        "reply_markup": {
            "inline_keyboard": inline_keyboard
        }
    }
