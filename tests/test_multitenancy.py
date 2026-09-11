import sys
import os
import json
import pytest
from pathlib import Path

# Backend papkasini sys.path ga qo'shish
backend_dir = Path(__file__).parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
import server
from server import app

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

def test_clinics_list_multitenant():
    """1. /api/clinics filiallar ro'yxati va ularning to'liqligi"""
    client = TestClient(app)
    response = client.get("/api/clinics")
    assert response.status_code == 200
    clinics = response.json()
    assert len(clinics) >= 2

    clinic_ids = [c["id"] for c in clinics]
    assert "dentamed-nukus" in clinic_ids
    assert "dentamed-chilonzor" in clinic_ids

    nukus = next(c for c in clinics if c["id"] == "dentamed-nukus")
    assert nukus["isMain"] is True
    assert "Nukus" in nukus["name"]
    assert "+998 (71) 200-00-00" in nukus["phone"]

    chilonzor = next(c for c in clinics if c["id"] == "dentamed-chilonzor")
    assert chilonzor["isMain"] is False
    assert "Chilonzor" in chilonzor["name"]

def test_doctors_tenant_isolation():
    """2. Shifokorlar multi-tenant izolyatsiyasi (Nukus va Chilonzor)"""
    client = TestClient(app)

    # Nukus shifokorlari
    res_nukus = client.get("/api/doctors?clinicId=dentamed-nukus")
    assert res_nukus.status_code == 200
    nukus_doctors = res_nukus.json()
    nukus_doc_ids = {d["id"] for d in nukus_doctors}

    # Chilonzor shifokorlari
    res_chilonzor = client.get("/api/doctors?clinicId=dentamed-chilonzor")
    assert res_chilonzor.status_code == 200
    chilonzor_doctors = res_chilonzor.json()
    chilonzor_doc_ids = {d["id"] for d in chilonzor_doctors}

    # Har bir filialda kamida bitta shifokor bo'lishi shart
    assert len(nukus_doc_ids) > 0
    assert len(chilonzor_doc_ids) > 0

    # Shifokorlar ro'yxati kesishmasligi (Multi-tenant Strict Isolation)
    common_doctors = nukus_doc_ids.intersection(chilonzor_doc_ids)
    assert len(common_doctors) == 0, f"Filiallararo shifokorlar izolyatsiyasi buzildi: {common_doctors}"

    # Barcha shifokorlar (filtrsiz)
    res_all = client.get("/api/doctors")
    assert res_all.status_code == 200
    all_doctors = res_all.json()
    assert len(all_doctors) == len(nukus_doctors) + len(chilonzor_doctors)

def test_services_tenant_isolation():
    """3. Xizmatlar multi-tenant ajralishi va filtrlash"""
    client = TestClient(app)

    res_nukus = client.get("/api/services?clinicId=dentamed-nukus")
    assert res_nukus.status_code == 200
    nukus_services = res_nukus.json()

    res_chilonzor = client.get("/api/services?clinicId=dentamed-chilonzor")
    assert res_chilonzor.status_code == 200
    chilonzor_services = res_chilonzor.json()

    # Nukus xizmatlarining barchasi 'dentamed-nukus' ga tegishli bo'lishi kerak
    for s in nukus_services:
        clinic_match = (s.get("clinicId") == "dentamed-nukus") or ("dentamed-nukus" in s.get("clinicIds", []))
        assert clinic_match is True, f"Xizmat Nukus filialiga tegishli emas: {s}"

    # Chilonzor xizmatlarining barchasi 'dentamed-chilonzor' ga tegishli bo'lishi kerak
    for s in chilonzor_services:
        clinic_match = (s.get("clinicId") == "dentamed-chilonzor") or ("dentamed-chilonzor" in s.get("clinicIds", []))
        assert clinic_match is True, f"Xizmat Chilonzor filialiga tegishli emas: {s}"

def test_appointments_multitenancy_independence():
    """
    4. Qabullar izolyatsiyasi:
    Bir vaqtda bir xil sana va soatda turli filiallarda qabullar o'zaro to'qnashmasligi (Mustaqil tenantiya)
    """
    client = TestClient(app)

    # Nukus filialiga qabul (Dr. Jamshid Rustamov, 2026-10-01, 10:00)
    appt_nukus = {
        "id": "MED-NUK-101",
        "pinCode": "1001",
        "patientName": "Valijon Qodirov",
        "phone": "+998901110001",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
        "date": "2026-10-01",
        "time": "10:00",
        "clinicId": "dentamed-nukus",
        "createdAt": "2026-09-11T23:30:00"
    }

    # Chilonzor filialiga qabul (Dr. Shahlo Karimova, 2026-10-01, 10:00 - AYNAN BIR XIL SANA VA VAQT!)
    appt_chilonzor = {
        "id": "MED-CHIL-202",
        "pinCode": "2002",
        "patientName": "Zulayho Karimova",
        "phone": "+998901110002",
        "doctor": {"id": 2, "name": "Dr. Shahlo Karimova"},
        "service": {"id": 103, "title": {"uz": "Breket"}, "price": 4500000},
        "date": "2026-10-01",
        "time": "10:00",
        "clinicId": "dentamed-chilonzor",
        "createdAt": "2026-09-11T23:30:00"
    }

    r1 = client.post("/api/appointments", json=appt_nukus)
    assert r1.status_code == 200

    r2 = client.post("/api/appointments", json=appt_chilonzor)
    assert r2.status_code == 200, "Turli filiallardagi parallel qabullar bir-birini bloklamasligi kerak"

    db = server.load_db()
    assert len(db) == 2
    clinics_saved = {a["clinicId"] for a in db}
    assert "dentamed-nukus" in clinics_saved
    assert "dentamed-chilonzor" in clinics_saved

def test_clinic_data_consolidated():
    """5. /api/clinic-data konsolidatsiyalangan ma'lumotlar filiallar bo'yicha to'g'ri shakllanishi"""
    client = TestClient(app)

    res_nukus = client.get("/api/clinic-data?clinicId=dentamed-nukus")
    assert res_nukus.status_code == 200
    data_nukus = res_nukus.json()
    assert data_nukus["clinic"]["id"] == "dentamed-nukus"
    assert "Nukus" in data_nukus["clinicName"]
    assert "+998 (71) 200-00-00" in data_nukus["phone"]
    for d in data_nukus["doctors"]:
        assert d.get("clinicId") == "dentamed-nukus" or "dentamed-nukus" in d.get("clinicIds", [])

    res_chilonzor = client.get("/api/clinic-data?clinicId=dentamed-chilonzor")
    assert res_chilonzor.status_code == 200
    data_chilonzor = res_chilonzor.json()
    assert data_chilonzor["clinic"]["id"] == "dentamed-chilonzor"
    assert "Chilonzor" in data_chilonzor["clinicName"]
    assert "+998 (71) 200-03-03" in data_chilonzor["phone"]
    for d in data_chilonzor["doctors"]:
        assert d.get("clinicId") == "dentamed-chilonzor" or "dentamed-chilonzor" in d.get("clinicIds", [])
