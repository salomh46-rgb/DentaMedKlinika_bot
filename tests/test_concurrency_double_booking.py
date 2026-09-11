import sys
import os
import json
import pytest
import asyncio
from pathlib import Path
from httpx import AsyncClient, ASGITransport
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
    test_db = tmp_dir / f"test_appointments_{os.getpid()}.json"
    test_prescriptions = tmp_dir / f"test_prescriptions_{os.getpid()}.json"
    
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

@pytest.mark.asyncio
async def test_concurrency_double_booking_lock():
    """
    Talab 1: Bir vaqtda ikkita bemor aynan bir xil shifokor, sana va vaqtga qabul so'rovi yuborganda Concurrency Lock ishlashini tekshirish.
    - Bitta so'rov muvaffaqiyatli (200 OK) o'tishi,
    - Ikkinchi so'rov esa 409 Conflict qaytarishi isbotlanishi shart!
    """
    req_patient_1 = {
        "id": "MED-CONC-001",
        "pinCode": "1111",
        "patientName": "Aziz Rahimov",
        "phone": "+998901112233",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Estetik Plomba"}, "price": 350000},
        "date": "2026-09-20",
        "time": "10:30",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }

    req_patient_2 = {
        "id": "MED-CONC-002",
        "pinCode": "2222",
        "patientName": "Dilshod Karimov",
        "phone": "+998909998877",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 102, "title": {"uz": "Implantatsiya"}, "price": 3200000},
        "date": "2026-09-20",
        "time": "10:30",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }

    async def send_booking(payload):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            return await ac.post("/api/appointments", json=payload)

    responses = await asyncio.gather(
        send_booking(req_patient_1),
        send_booking(req_patient_2)
    )

    status_codes = [r.status_code for r in responses]
    assert 200 in status_codes, "Bitta qabul muvaffaqiyatli o'tishi kerak (200 OK)"
    assert 409 in status_codes, "Ikkinchi parallel qabul 409 Conflict qaytarishi kerak (Double Booking Lock)"
    
    conflict_res = next(r for r in responses if r.status_code == 409)
    assert "band qilingan" in conflict_res.json()["detail"].lower()

    appointments = server.load_db()
    assert len(appointments) == 1
    assert appointments[0]["time"] == "10:30"
    assert appointments[0]["date"] == "2026-09-20"

def test_sequential_double_booking_rejected():
    client = TestClient(app)
    req_first = {
        "id": "MED-SEQ-001",
        "pinCode": "3333",
        "patientName": "Malika Aliyeva",
        "phone": "+998935554433",
        "doctor": {"id": 2, "name": "Dr. Shahlo Karimova"},
        "service": {"id": 103, "title": {"uz": "Breket"}, "price": 4500000},
        "date": "2026-09-21",
        "time": "14:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }
    r1 = client.post("/api/appointments", json=req_first)
    assert r1.status_code == 200

    req_second = {
        "id": "MED-SEQ-002",
        "pinCode": "4444",
        "patientName": "Gulnoza Usmonova",
        "phone": "+998977778899",
        "doctor": {"id": 2, "name": "Dr. Shahlo Karimova"},
        "service": {"id": 104, "title": {"uz": "AirFlow"}, "price": 400000},
        "date": "2026-09-21",
        "time": "14:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:31:00"
    }
    r2 = client.post("/api/appointments", json=req_second)
    assert r2.status_code == 409
    assert "band qilingan" in r2.json()["detail"].lower()

def test_different_times_or_doctors_allowed():
    client = TestClient(app)
    req1 = {
        "id": "MED-DIFF-001",
        "pinCode": "5555",
        "patientName": "Olim Saidov",
        "phone": "+998901234567",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-22",
        "time": "11:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }
    r1 = client.post("/api/appointments", json=req1)
    assert r1.status_code == 200

    req2 = {
        "id": "MED-DIFF-002",
        "pinCode": "6666",
        "patientName": "Anvar Qosimov",
        "phone": "+998907654321",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-22",
        "time": "12:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:31:00"
    }
    r2 = client.post("/api/appointments", json=req2)
    assert r2.status_code == 200

def test_cancelled_appointment_frees_slot():
    client = TestClient(app)
    req1 = {
        "id": "MED-CANC-001",
        "pinCode": "7777",
        "patientName": "Sardor Ahmedov",
        "phone": "+998901110000",
        "doctor": {"id": 3, "name": "Dr. Bobur Mahmudov"},
        "service": {"id": 201, "title": {"uz": "Endoskopiya"}, "price": 250000},
        "date": "2026-09-23",
        "time": "15:30",
        "clinicId": "dentamed-chilonzor",
        "createdAt": "2026-09-11T23:30:00"
    }
    r1 = client.post("/api/appointments", json=req1)
    assert r1.status_code == 200

    db = server.load_db()
    for a in db:
        if a["id"] == "MED-CANC-001":
            a["status"] = "cancelled"
    server.save_db(db)

    req2 = {
        "id": "MED-CANC-002",
        "pinCode": "8888",
        "patientName": "Jasurbek Bekov",
        "phone": "+998902220000",
        "doctor": {"id": 3, "name": "Dr. Bobur Mahmudov"},
        "service": {"id": 201, "title": {"uz": "Endoskopiya"}, "price": 250000},
        "date": "2026-09-23",
        "time": "15:30",
        "clinicId": "dentamed-chilonzor",
        "createdAt": "2026-09-11T23:35:00"
    }
    r2 = client.post("/api/appointments", json=req2)
    assert r2.status_code == 200

def test_slots_availability_endpoint():
    client = TestClient(app)
    req1 = {
        "id": "MED-SLOT-001",
        "pinCode": "9991",
        "patientName": "Bemor 1",
        "phone": "+998901111111",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-25",
        "time": "09:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }
    req2 = {
        "id": "MED-SLOT-002",
        "pinCode": "9992",
        "patientName": "Bemor 2",
        "phone": "+998902222222",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-09-25",
        "time": "14:30",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:31:00"
    }
    client.post("/api/appointments", json=req1)
    client.post("/api/appointments", json=req2)

    resp = client.get("/api/slots?doctorId=1&date=2026-09-25&clinicId=dentamed-nukus")
    assert resp.status_code == 200
    data = resp.json()
    assert "bookedTimes" in data
    assert "09:00" in data["bookedTimes"]
    assert "14:30" in data["bookedTimes"]