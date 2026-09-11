import sys
import os
import json
import pytest
from datetime import datetime, timedelta
from pathlib import Path

# Backend papkasini sys.path ga qo'shish
backend_dir = Path(__file__).parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
import server
from server import app
from reminders import (
    calculate_reminder_times,
    evaluate_reminders,
    format_reminder_message,
    create_digital_prescription,
    format_prescription_telegram_payload
)

@pytest.fixture(autouse=True)
def isolate_database(tmp_path, monkeypatch):
    """Har bir test uchun toza vaqtinchalik ma'lumotlar bazasi"""
    test_db = tmp_path / "test_appointments.json"
    test_prescriptions = tmp_path / "test_prescriptions.json"
    
    with open(test_db, "w", encoding="utf-8") as f:
        json.dump([], f)
    with open(test_prescriptions, "w", encoding="utf-8") as f:
        json.dump([], f)

    monkeypatch.setattr(server, "DB_FILE", test_db)
    monkeypatch.setattr(server, "PRESCRIPTIONS_FILE", test_prescriptions)
    
    async def mock_notify(*args, **kwargs):
        return True
    monkeypatch.setattr(server, "notify_patient", mock_notify)
    monkeypatch.setattr(server, "notify_admin_group", mock_notify)
    monkeypatch.setattr(server, "notify_prescription", mock_notify)

def test_calculate_reminder_times():
    """1. 24 soatlik va 2 soatlik eslatmalar hisob-kitobi aniqligi"""
    date_str = "2026-09-20"
    time_str = "14:30"
    times = calculate_reminder_times(date_str, time_str)

    expected_appt = datetime(2026, 9, 20, 14, 30)
    expected_24h = expected_appt - timedelta(hours=24)
    expected_2h = expected_appt - timedelta(hours=2)

    assert times["appointment_datetime"] == expected_appt
    assert times["reminder_24h"] == expected_24h
    assert times["reminder_2h"] == expected_2h
    assert times["reminder_24h"] == datetime(2026, 9, 19, 14, 30)
    assert times["reminder_2h"] == datetime(2026, 9, 20, 12, 30)

def test_evaluate_24h_reminder_status():
    """2. 24 soatlik eslatma holati dinamik tekshiruvi"""
    appointment = {
        "id": "MED-REM-001",
        "date": "2026-09-20",
        "time": "14:30",
        "reminder_24h_sent": False,
        "reminder_2h_sent": False,
        "status": "confirmed"
    }

    # Holat 1: Qabulga 30 soat bor (hali eslatma vaqti emas)
    t_early = datetime(2026, 9, 19, 8, 30)
    res_early = evaluate_reminders(appointment, t_early)
    assert res_early["should_send_24h"] is False
    assert res_early["should_send_2h"] is False

    # Holat 2: Qabulga 22 soat qolgan (24 soatlik eslatma yuborilishi shart!)
    t_24h_window = datetime(2026, 9, 19, 16, 30)
    res_24h = evaluate_reminders(appointment, t_24h_window)
    assert res_24h["should_send_24h"] is True
    assert res_24h["should_send_2h"] is False

    # Holat 3: 24h eslatma allaqachon yuborilgan bo'lsa, qayta yuborilmasligi (Idempotency)
    appointment_sent = dict(appointment, reminder_24h_sent=True)
    res_sent = evaluate_reminders(appointment_sent, t_24h_window)
    assert res_sent["should_send_24h"] is False

def test_evaluate_2h_reminder_status():
    """3. 2 soatlik eslatma holati dinamik tekshiruvi"""
    appointment = {
        "id": "MED-REM-002",
        "date": "2026-09-20",
        "time": "14:30",
        "reminder_24h_sent": True,
        "reminder_2h_sent": False,
        "status": "confirmed"
    }

    # Holat 1: Qabulga 4 soat bor (hali 2h eslatma vaqti emas)
    t_pre_2h = datetime(2026, 9, 20, 10, 30)
    res_pre = evaluate_reminders(appointment, t_pre_2h)
    assert res_pre["should_send_2h"] is False

    # Holat 2: Qabulga 1 soat 15 daqiqa qolgan (2 soatlik eslatma oynasida!)
    t_2h_window = datetime(2026, 9, 20, 13, 15)
    res_2h = evaluate_reminders(appointment, t_2h_window)
    assert res_2h["should_send_2h"] is True
    assert res_2h["should_send_24h"] is False

    # Holat 3: 2h eslatma yuborilgach, qayta jo'natilmaydi
    appointment_sent = dict(appointment, reminder_2h_sent=True)
    res_2h_sent = evaluate_reminders(appointment_sent, t_2h_window)
    assert res_2h_sent["should_send_2h"] is False

def test_expired_and_cancelled_reminders():
    """4. Qabul vaqti o'tib ketgan yoki bekor qilingan qabullarda eslatma yuborilmasligi"""
    appointment = {
        "id": "MED-REM-003",
        "date": "2026-09-20",
        "time": "14:30",
        "reminder_24h_sent": False,
        "reminder_2h_sent": False,
        "status": "confirmed"
    }

    # Qabul vaqtidan 1 daqiqa keyin
    t_past = datetime(2026, 9, 20, 14, 31)
    res_past = evaluate_reminders(appointment, t_past)
    assert res_past["should_send_24h"] is False
    assert res_past["should_send_2h"] is False
    assert res_past["is_expired"] is True

    # Bekor qilingan qabul
    appointment_cancelled = dict(appointment, status="cancelled")
    res_cancelled = evaluate_reminders(appointment_cancelled, datetime(2026, 9, 20, 13, 0))
    assert res_cancelled["should_send_24h"] is False
    assert res_cancelled["should_send_2h"] is False
    assert res_cancelled["is_cancelled"] is True

def test_reminder_message_formatting():
    """5. Eslatma xabarlari matni, klinik ma'lumotlari va PIN-kod to'liqligi"""
    sample_appt = {
        "id": "MED-990011",
        "pinCode": "4821",
        "patientName": "Javohirbek Asqarov",
        "doctor": {"name": "Dr. Jamshid Rustamov"},
        "date": "2026-09-21",
        "time": "11:00",
        "branch": "nukus"
    }

    # 24h xabar matni
    msg_24h = format_reminder_message(sample_appt, "24h")
    assert "24 SOAT QOLDI" in msg_24h
    assert "Javohirbek Asqarov" in msg_24h
    assert "Dr. Jamshid Rustamov" in msg_24h
    assert "4821" in msg_24h
    assert "Nukus filiali" in msg_24h
    assert "Mirobod" in msg_24h

    # 2h xabar matni
    msg_2h = format_reminder_message(sample_appt, "2h")
    assert "2 SOAT QOLDI" in msg_2h
    assert "11:00" in msg_2h
    assert "4821" in msg_2h
    assert "Dr. Jamshid Rustamov" in msg_2h

def test_digital_prescription_creation_and_validation():
    """6. Raqamli retsept yaratish va qat'iy validatsiyasi"""
    medications = [
        {
            "name": "Nimesil",
            "dosage": "100mg",
            "instruction": "Ovqatdan keyin 1 paketdan kuniga 2 mahal",
            "duration": "3 kun"
        },
        {
            "name": "Xlorgeksidin 0.05%",
            "dosage": "100ml",
            "instruction": "Tish yuvilgach 1 daqiqa chayish",
            "duration": "5 kun"
        }
    ]

    rx = create_digital_prescription(
        appointment_id="MED-990011",
        patient_name="Javohirbek Asqarov",
        doctor_name="Dr. Jamshid Rustamov",
        diagnosis="O'tkir o'choqli pulpitis (16-tish)",
        medications=medications,
        recommendations="3 kun davomida issiq va sovuq taomlardan saqlaning.",
        branch="nukus"
    )

    assert rx["id"].startswith("RX-")
    assert rx["appointmentId"] == "MED-990011"
    assert rx["patientName"] == "Javohirbek Asqarov"
    assert rx["doctorName"] == "Dr. Jamshid Rustamov"
    assert len(rx["medications"]) == 2
    assert "16-tish" in rx["diagnosis"]
    assert "https://dentamed.uz/verify-rx/" in rx["verificationUrl"]
    assert rx["status"] == "active"

    # Validatsiya xatoliklari tekshiruvi:
    with pytest.raises(ValueError, match="Bemor va shifokor ismi"):
        create_digital_prescription(
            appointment_id="MED-1", patient_name="", doctor_name="Dr. Test",
            diagnosis="Karies", medications=medications
        )

    with pytest.raises(ValueError, match="Tashxis"):
        create_digital_prescription(
            appointment_id="MED-1", patient_name="Ali", doctor_name="Dr. Test",
            diagnosis="", medications=medications
        )

    with pytest.raises(ValueError, match="Kamida bitta dori"):
        create_digital_prescription(
            appointment_id="MED-1", patient_name="Ali", doctor_name="Dr. Test",
            diagnosis="Karies", medications=[]
        )

def test_prescription_telegram_payload_format():
    """7. Raqamli retsept Telegram payload formati va interaktiv tugmalari"""
    medications = [
        {
            "name": "Augmentin",
            "dosage": "625mg",
            "instruction": "Har 12 soatda 1 tabletkadan",
            "duration": "5 kun"
        }
    ]

    rx = create_digital_prescription(
        appointment_id="MED-771122",
        patient_name="Dilfuza Rahimova",
        doctor_name="Dr. Bobur Mahmudov",
        diagnosis="Surunkali gaymorit qaytalanishi",
        medications=medications,
        recommendations="Burunni sho'r suv bilan yuvish.",
        branch="chilonzor"
    )

    payload = format_prescription_telegram_payload(rx, chat_id=987654321)

    assert payload["chat_id"] == 987654321
    assert payload["parse_mode"] == "HTML"
    
    text = payload["text"]
    assert "RAQAMLI RETSEPT" in text
    assert rx["id"] in text
    assert "Dilfuza Rahimova" in text
    assert "Dr. Bobur Mahmudov" in text
    assert "Surunkali gaymorit qaytalanishi" in text
    assert "Augmentin" in text
    assert "625mg" in text
    assert "Burunni sho'r suv bilan yuvish" in text

    # Inline tugmalar tekshiruvi
    keyboard = payload["reply_markup"]["inline_keyboard"]
    assert len(keyboard) == 2
    
    # 1-qator: PDF yuklab olish va Dorixona
    row1_urls = [btn.get("url") for btn in keyboard[0]]
    assert rx["verificationUrl"] in row1_urls
    assert "https://t.me/dentamed_pharmacy_bot" in row1_urls

    # 2-qator: Dori ichish eslatmasi
    btn_remind = keyboard[1][0]
    assert btn_remind["callback_data"] == f"rx_remind_{rx['id']}"

def test_api_prescription_endpoints():
    """8. FastAPI /api/prescriptions orqali retsept saqlash va qabul qilish"""
    client = TestClient(app)

    # 1. Avval qabul yaratamiz
    appt_data = {
        "id": "MED-RX-APPT-01",
        "pinCode": "3344",
        "patientName": "Shahboz Jo'rayev",
        "phone": "+998901239988",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-22",
        "time": "16:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }
    client.post("/api/appointments", json=appt_data)

    # 2. Retsept yozamiz
    pres_payload = {
        "appointmentId": "MED-RX-APPT-01",
        "diagnosis": "Chuqur karies va giperemiya",
        "medications": [
            {
                "name": "Ibuprofen",
                "dosage": "400mg",
                "duration": "2 kun",
                "instructions": "Og'riq bo'lganda ovqatdan so'ng"
            }
        ],
        "doctorNotes": "Qattiq narsalarni chaynash taqiqlanadi",
        "nextVisitDate": "2026-09-29"
    }

    res_create = client.post("/api/prescriptions", json=pres_payload)
    assert res_create.status_code == 200
    res_data = res_create.json()
    assert res_data["status"] == "success"
    rx_id = res_data["prescription"]["id"]
    assert rx_id.startswith("RX-")

    # 3. Retseptni appointmentId bo'yicha olamiz
    res_get = client.get("/api/prescriptions/MED-RX-APPT-01")
    assert res_get.status_code == 200
    retrieved_rx = res_get.json()
    assert retrieved_rx["appointmentId"] == "MED-RX-APPT-01"
    assert retrieved_rx["diagnosis"] == "Chuqur karies va giperemiya"
    assert len(retrieved_rx["medications"]) == 1
    assert retrieved_rx["medications"][0]["name"] == "Ibuprofen"

    # 4. Mavjud bo'lmagan retsept so'ralganda 404
    res_404 = client.get("/api/prescriptions/MED-NON-EXISTENT")
    assert res_404.status_code == 404

def test_api_process_reminders_endpoint():
    """9. /api/reminders/process endpointi to'g'ri ishlashi"""
    client = TestClient(app)
    res = client.post("/api/reminders/process")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "processedAt" in data
    assert "remindersSent" in data
