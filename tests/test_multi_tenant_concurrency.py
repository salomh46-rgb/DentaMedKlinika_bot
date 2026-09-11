import pytest
import asyncio
import json
from pathlib import Path
from fastapi.testclient import TestClient
from httpx import AsyncClient, ASGITransport

import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from server import app, load_db, save_db, CLINICS_FILE, PRESCRIPTIONS_FILE, DB_FILE

client = TestClient(app)

def test_multi_tenant_clinics():
    """1. Multi-tenant: GET /api/clinics kamida 2 ta klinikani qaytarishi kerak"""
    resp = client.get("/api/clinics")
    assert resp.status_code == 200
    clinics = resp.json()
    assert isinstance(clinics, list)
    assert len(clinics) >= 2
    clinic_ids = [c["id"] for c in clinics]
    assert "dentamed-nukus" in clinic_ids
    assert "dentamed-chilonzor" in clinic_ids

def test_doctors_and_services_filter_by_clinic():
    """1. Multi-tenant: GET /api/doctors?clinicId=... va GET /api/services?clinicId=..."""
    # All doctors
    resp_all = client.get("/api/doctors")
    assert resp_all.status_code == 200
    all_docs = resp_all.json()
    assert len(all_docs) >= 4

    # Doctors for Nukus
    resp_nukus = client.get("/api/doctors?clinicId=dentamed-nukus")
    assert resp_nukus.status_code == 200
    nukus_docs = resp_nukus.json()
    assert len(nukus_docs) > 0
    assert all(d.get("clinicId") == "dentamed-nukus" for d in nukus_docs)

    # Services for Chilonzor
    resp_chilonzor_srv = client.get("/api/services?clinicId=dentamed-chilonzor")
    assert resp_chilonzor_srv.status_code == 200
    ch_services = resp_chilonzor_srv.json()
    assert len(ch_services) > 0
    assert all(s.get("clinicId") == "dentamed-chilonzor" for s in ch_services)

def test_double_booking_lock_and_slots():
    """2. Double-booking prevention & slots check"""
    test_date = "2026-10-25"
    test_time = "11:30"
    doc_id = 1
    clinic_id = "dentamed-nukus"

    # Pre-clean test slots from db
    db = load_db()
    db = [a for a in db if not (a.get("date") == test_date and a.get("time") == test_time)]
    save_db(db)

    # 1. Check slots before booking
    resp_slots1 = client.get(f"/api/slots?doctorId={doc_id}&date={test_date}&clinicId={clinic_id}")
    assert resp_slots1.status_code == 200
    assert test_time not in resp_slots1.json()["bookedTimes"]

    # 2. Book appointment 1
    appt_data_1 = {
        "id": "MED-TEST-001",
        "pinCode": "1234",
        "patientName": "Ali Valiyev",
        "phone": "+998 90 123-45-67",
        "doctor": {"id": doc_id, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": test_date,
        "time": test_time,
        "clinicId": clinic_id,
        "status": "confirmed",
        "createdAt": "2026-09-11T12:00:00Z"
    }
    resp_book1 = client.post("/api/appointments", json=appt_data_1)
    assert resp_book1.status_code == 200
    assert resp_book1.json()["status"] == "success"

    # 3. Check slots after booking
    resp_slots2 = client.get(f"/api/slots?doctorId={doc_id}&date={test_date}&clinicId={clinic_id}")
    assert resp_slots2.status_code == 200
    assert test_time in resp_slots2.json()["bookedTimes"]

    # 4. Attempt double-booking with different patient at the same slot
    appt_data_2 = {
        "id": "MED-TEST-002",
        "pinCode": "5678",
        "patientName": "Vali Aliyev",
        "phone": "+998 91 987-65-43",
        "doctor": {"id": doc_id, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 102, "title": {"uz": "Implant"}, "price": 3000000},
        "date": test_date,
        "time": test_time,
        "clinicId": clinic_id,
        "status": "confirmed",
        "createdAt": "2026-09-11T12:01:00Z"
    }
    resp_book2 = client.post("/api/appointments", json=appt_data_2)
    # Must be 409 Conflict
    assert resp_book2.status_code == 409
    assert "Ushbu vaqt allaqachon boshqa bemor tomonidan band qilingan" in resp_book2.json()["detail"]

    # Clean up test records
    db = load_db()
    db = [a for a in db if a.get("id") not in ["MED-TEST-001", "MED-TEST-002"]]
    save_db(db)

@pytest.mark.asyncio
async def test_atomic_concurrency_race_condition():
    """2. Race condition: 5 ta parallel so'rovdan faqat 1 tasi o'tishi kerak"""
    test_date = "2026-11-15"
    test_time = "16:00"
    doc_id = 2
    clinic_id = "dentamed-nukus"

    # Pre-clean
    db = load_db()
    db = [a for a in db if not (a.get("date") == test_date and a.get("time") == test_time)]
    save_db(db)

    async def send_req(i: int):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            payload = {
                "id": f"MED-RACE-{i}",
                "pinCode": f"100{i}",
                "patientName": f"Bemor {i}",
                "phone": f"+998 90 000 00 0{i}",
                "doctor": {"id": doc_id, "name": "Dr. Shahlo Karimova"},
                "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
                "date": test_date,
                "time": test_time,
                "clinicId": clinic_id,
                "status": "confirmed",
                "createdAt": "2026-09-11T12:00:00Z"
            }
            return await ac.post("/api/appointments", json=payload)

    # 5 concurrent requests
    responses = await asyncio.gather(*[send_req(i) for i in range(5)])
    status_codes = [r.status_code for r in responses]

    # Exactly 1 success (200) and 4 conflicts (409)
    assert status_codes.count(200) == 1
    assert status_codes.count(409) == 4

    # Clean up
    db = load_db()
    db = [a for a in db if not a.get("id", "").startswith("MED-RACE-")]
    save_db(db)

def test_reminders_endpoint():
    """3. Eslatmalar trigger endpointi: POST /api/reminders/process"""
    resp = client.post("/api/reminders/process")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "remindersSent" in data
    assert "processedAt" in data

def test_digital_prescription_flow():
    """4. Raqamli Retsept: POST /api/prescriptions va GET /api/prescriptions/{appointmentId}"""
    test_appt_id = "MED-RX-TEST-99"
    prescription_payload = {
        "appointmentId": test_appt_id,
        "diagnosis": "Surunkali chuqur karies va o'tkir pulpitis asorati",
        "medications": [
            {
                "name": "Amoxicillin / Clavulanate 625mg",
                "dosage": "1 tabletkadan 3 mahal",
                "duration": "5 kun",
                "instructions": "Ovqatdan keyin ko'p miqdorda suv bilan"
            },
            {
                "name": "Ketonal 50mg",
                "dosage": "1 tabletka og'riq bo'lganda",
                "duration": "3 kun",
                "instructions": "Kuniga ko'pi bilan 2 martagacha"
            },
            {
                "name": "Xlorgeksidin 0.05% eritmasi",
                "dosage": "Og'izni chayqash",
                "duration": "7 kun",
                "instructions": "Har ovqatdan keyin 1 daqiqa chayqash"
            }
        ],
        "doctorNotes": "Issiq va sovuq taomlardan 3 kun tiyilish, qattiq luqmalar chaynash tavsiya etilmaydi.",
        "nextVisitDate": "2026-09-20"
    }

    # 1. Create prescription
    resp_create = client.post("/api/prescriptions", json=prescription_payload)
    assert resp_create.status_code == 200
    create_data = resp_create.json()
    assert create_data["status"] == "success"
    rx = create_data["prescription"]
    assert rx["appointmentId"] == test_appt_id
    assert len(rx["medications"]) == 3
    assert rx["id"].startswith("RX-")

    # 2. Get prescription by appointmentId
    resp_get = client.get(f"/api/prescriptions/{test_appt_id}")
    assert resp_get.status_code == 200
    fetched_rx = resp_get.json()
    assert fetched_rx["diagnosis"] == prescription_payload["diagnosis"]
    assert fetched_rx["doctorNotes"] == prescription_payload["doctorNotes"]

    # 3. Not found case
    resp_not_found = client.get("/api/prescriptions/MED-NONEXISTENT-XYZ")
    assert resp_not_found.status_code == 404