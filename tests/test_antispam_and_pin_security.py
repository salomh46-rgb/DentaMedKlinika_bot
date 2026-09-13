import sys
import os
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import server
from server import app

@pytest.fixture(autouse=True)
def isolate_database(monkeypatch):
    """Har bir test uchun alohida toza vaqtinchalik ma'lumotlar bazasi"""
    tmp_dir = Path(__file__).parent / ".tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    test_db = tmp_dir / f"test_antispam_{os.getpid()}.json"
    test_prescriptions = tmp_dir / f"test_antispam_rx_{os.getpid()}.json"
    
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

def test_single_active_booking_enforced_by_phone():
    """
    1-Test: Bir bemor (yoki bola) o'z telefoni bilan bir vaqtda 2-3 martalab
    navbatlarni to'ldirib tashlashining oldi olinishi (Max 1 Active Booking).
    """
    client = TestClient(app)
    
    # 1-qabul muvaffaqiyatli o'tadi
    appt_1 = {
        "id": "MED-SPAM-001",
        "pinCode": "1234",
        "patientName": "Jasur Aliyev",
        "phone": "+998 90 123 45 67",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-25",
        "time": "10:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-13T10:00:00"
    }
    r1 = client.post("/api/appointments", json=appt_1)
    assert r1.status_code == 200

    # 2-qabul: Ayni shu telefon boshqa vaqtga (15:00) yozilmoqchi bo'lganda 400 xatosi bilan to'xtatiladi
    appt_2 = {
        "id": "MED-SPAM-002",
        "pinCode": "5678",
        "patientName": "Jasur Aliyev",
        "phone": "+998901234567",  # Formatidan qat'i nazar (bo'shliqlarsiz)
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-25",
        "time": "15:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-13T10:05:00"
    }
    r2 = client.post("/api/appointments", json=appt_2)
    assert r2.status_code == 400
    detail = r2.json()["detail"]
    assert "faol qabulingiz mavjud" in detail
    assert "PIN: 1234" in detail

def test_single_active_booking_enforced_by_telegram_user_id():
    """
    2-Test: Foydalanuvchi turli xil soxta telefon raqamlarni kiritib o'ynasa ham,
    bitta Telegram ID dan ikkinchi faol qabulga ruxsat berilmasligi.
    """
    client = TestClient(app)
    
    appt_1 = {
        "id": "MED-TG-001",
        "pinCode": "4321",
        "patientName": "Akbar",
        "phone": "+998 90 999 00 11",
        "telegramUserId": 77889911,
        "doctor": {"id": 2, "name": "Dr. Shahlo Karimova"},
        "service": {"id": 103, "title": {"uz": "Breket"}, "price": 4500000},
        "date": "2026-09-26",
        "time": "11:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-13T10:00:00"
    }
    r1 = client.post("/api/appointments", json=appt_1)
    assert r1.status_code == 200

    # Boshqa telefon kiritdi, lekin Telegram ID si bir xil (troll/bola)
    appt_2 = {
        "id": "MED-TG-002",
        "pinCode": "8765",
        "patientName": "Akbar Fake",
        "phone": "+998 90 888 77 66",
        "telegramUserId": 77889911,
        "doctor": {"id": 2, "name": "Dr. Shahlo Karimova"},
        "service": {"id": 103, "title": {"uz": "Breket"}, "price": 4500000},
        "date": "2026-09-26",
        "time": "16:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-13T10:06:00"
    }
    r2 = client.post("/api/appointments", json=appt_2)
    assert r2.status_code == 400
    assert "faol qabulingiz mavjud" in r2.json()["detail"]

def test_booking_allowed_after_previous_cancelled_or_completed():
    """
    3-Test: Agar avvalgi qabul 'completed' (yakunlangan) yoki 'cancelled' (bekor qilingan)
    bo'lsa, o'sha bemor yana yangi qabulga bemalol yozilishi mumkin.
    """
    client = TestClient(app)
    
    appt_1 = {
        "id": "MED-REL-001",
        "pinCode": "9988",
        "patientName": "Zuhra Karimova",
        "phone": "+998 90 555 12 34",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-27",
        "time": "09:30",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-13T10:00:00"
    }
    r1 = client.post("/api/appointments", json=appt_1)
    assert r1.status_code == 200

    # Bemor qabulga keldi va muolaja yakunlandi ('completed')
    patch_res = client.patch("/api/appointments/MED-REL-001/status", json={"status": "completed"})
    assert patch_res.status_code == 200

    # Endi keyingi hafta uchun yangi qabulga yozilishga ruxsat beriladi!
    appt_2 = {
        "id": "MED-REL-002",
        "pinCode": "7766",
        "patientName": "Zuhra Karimova",
        "phone": "+998 90 555 12 34",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-10-05",
        "time": "14:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-13T11:00:00"
    }
    r2 = client.post("/api/appointments", json=appt_2)
    assert r2.status_code == 200
    assert r2.json()["status"] == "success"
