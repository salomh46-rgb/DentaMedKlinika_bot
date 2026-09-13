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
def isolate_database(tmp_path, monkeypatch):
    """Testlar uchun DB va xabar jo'natish xizmatlarini izolyatsiya qilish"""
    test_db = tmp_path / "test_enterprise_appointments.json"
    test_prescriptions = tmp_path / "test_enterprise_prescriptions.json"
    
    # Dastlabki namunaviy appointments
    initial_appts = [
        {
            "id": "MED-T-101",
            "tenantId": "dentamed",
            "clinicId": "dentamed-nukus",
            "pinCode": "1001",
            "patientName": "Jasur Aliyev",
            "phone": "+998901110001",
            "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
            "service": {"id": 101, "title": {"uz": "Plomba"}, "price": 350000},
            "date": "2026-10-10",
            "time": "10:00",
            "status": "completed",
            "totalAmount": 350000,
            "createdAt": "2026-09-12T00:00:00"
        },
        {
            "id": "MED-T-102",
            "tenantId": "dentamed",
            "clinicId": "dentamed-chilonzor",
            "pinCode": "1002",
            "patientName": "Kamola Rustamova",
            "phone": "+998901110002",
            "doctor": {"id": 2, "name": "Dr. Shahlo Karimova"},
            "service": {"id": 103, "title": {"uz": "Breket"}, "price": 4500000},
            "date": "2026-10-10",
            "time": "11:00",
            "status": "confirmed",
            "totalAmount": 4500000,
            "createdAt": "2026-09-12T00:00:00"
        },
        {
            "id": "GM-T-201",
            "tenantId": "grandmed",
            "clinicId": "grandmed-markaziy",
            "pinCode": "2001",
            "patientName": "Sherzodbek Qosimov",
            "phone": "+998902220001",
            "doctor": {"id": 101, "name": "Dr. Alisher Vohidov"},
            "service": {"id": 301, "title": {"uz": "All-on-4 Implant"}, "price": 4200000},
            "date": "2026-10-10",
            "time": "10:00",
            "status": "completed",
            "totalAmount": 4200000,
            "createdAt": "2026-09-12T00:00:00"
        }
    ]

    with open(test_db, "w", encoding="utf-8") as f:
        json.dump(initial_appts, f, ensure_ascii=False, indent=2)
    with open(test_prescriptions, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)

    monkeypatch.setattr(server, "DB_FILE", test_db)
    monkeypatch.setattr(server, "PRESCRIPTIONS_FILE", test_prescriptions)

    async def mock_notify(*args, **kwargs):
        return True
    monkeypatch.setattr(server, "notify_patient", mock_notify)
    monkeypatch.setattr(server, "notify_admin_group", mock_notify)
    monkeypatch.setattr(server, "notify_prescription", mock_notify)


def test_tenants_and_branches_hierarchy():
    """1. Multi-tenant tuzilma: 2 ta mustaqil klinika va ularning filiallari"""
    client = TestClient(app)

    # 1. Barcha tenantlar
    res = client.get("/api/tenants")
    assert res.status_code == 200
    tenants = res.json()
    tenant_ids = [t["id"] for t in tenants]

    assert "dentamed" in tenant_ids
    assert "grandmed" in tenant_ids

    # DentaMed tekshiruvi (5 ta filial)
    dentamed = next(t for t in tenants if t["id"] == "dentamed")
    assert dentamed["name"] == "DentaMed Atelier"
    assert "Dr. Jamshid Rustamov" in dentamed["ownerName"]
    assert dentamed["branchesCount"] == 5
    dentamed_branches = [b["id"] for b in dentamed["branches"]]
    assert "dentamed-nukus" in dentamed_branches
    assert "dentamed-chilonzor" in dentamed_branches
    assert "dentamed-yunusobod" in dentamed_branches
    assert "dentamed-samarqand" in dentamed_branches
    assert "dentamed-buxoro" in dentamed_branches

    # GrandMed tekshiruvi (2 ta filial)
    grandmed = next(t for t in tenants if t["id"] == "grandmed")
    assert grandmed["name"] == "GrandMed International"
    assert "Dr. Alisher Vohidov" in grandmed["ownerName"]
    assert grandmed["branchesCount"] == 2
    grandmed_branches = [b["id"] for b in grandmed["branches"]]
    assert "grandmed-markaziy" in grandmed_branches
    assert "grandmed-sergeli" in grandmed_branches

    # Alohida tenant endpointi
    res_single = client.get("/api/tenants/dentamed")
    assert res_single.status_code == 200
    assert res_single.json()["id"] == "dentamed"

    # Mavjud bo'lmagan tenant
    res_not_found = client.get("/api/tenants/unknown_clinic_999")
    assert res_not_found.status_code == 404


def test_staff_login_roles_and_branches():
    """2. PIN orqali autentifikatsiya va filial huquqlari (RBAC / Branch Isolation)"""
    client = TestClient(app)

    # A) DentaMed Rahbari Super PIN (7777)
    res_d_owner = client.post("/api/staff/login", json={"pinCode": "7777"})
    assert res_d_owner.status_code == 200
    data_d_owner = res_d_owner.json()
    assert data_d_owner["role"] == "owner"
    assert data_d_owner["tenantId"] == "dentamed"
    assert len(data_d_owner["allowedBranchIds"]) == 5
    assert "dentamed-nukus" in data_d_owner["allowedBranchIds"]
    assert "dentamed-buxoro" in data_d_owner["allowedBranchIds"]

    # B) GrandMed Rahbari Super PIN (8888)
    res_g_owner = client.post("/api/staff/login", json={"pinCode": "8888"})
    assert res_g_owner.status_code == 200
    data_g_owner = res_g_owner.json()
    assert data_g_owner["role"] == "owner"
    assert data_g_owner["tenantId"] == "grandmed"
    assert len(data_g_owner["allowedBranchIds"]) == 2
    assert "grandmed-markaziy" in data_g_owner["allowedBranchIds"]
    assert "grandmed-sergeli" in data_g_owner["allowedBranchIds"]

    # C) DentaMed Nukus Filiali Retsepshni (1001)
    res_nukus = client.post("/api/staff/login", json={"pinCode": "1001"})
    assert res_nukus.status_code == 200
    data_nukus = res_nukus.json()
    assert data_nukus["role"] == "receptionist"
    assert data_nukus["tenantId"] == "dentamed"
    assert data_nukus["allowedBranchIds"] == ["dentamed-nukus"]
    assert "Nukus" in data_nukus["branchName"]

    # D) DentaMed Chilonzor Filiali Retsepshni (1002)
    res_chilonzor = client.post("/api/staff/login", json={"pinCode": "1002"})
    assert res_chilonzor.status_code == 200
    data_chilonzor = res_chilonzor.json()
    assert data_chilonzor["role"] == "receptionist"
    assert data_chilonzor["tenantId"] == "dentamed"
    assert data_chilonzor["allowedBranchIds"] == ["dentamed-chilonzor"]

    # E) GrandMed Markaziy Filiali Retsepshni (2001)
    res_gm_center = client.post("/api/staff/login", json={"pinCode": "2001"})
    assert res_gm_center.status_code == 200
    data_gm_center = res_gm_center.json()
    assert data_gm_center["role"] == "receptionist"
    assert data_gm_center["tenantId"] == "grandmed"
    assert data_gm_center["allowedBranchIds"] == ["grandmed-markaziy"]

    # F) Noto'g'ri PIN-kod (401 xatolik)
    res_bad = client.post("/api/staff/login", json={"pinCode": "9999"})
    assert res_bad.status_code == 401

    # G) Brute-force himoyasi: 5 marta ketma-ket xato kiritilgach, 6-si 429 qaytarishi shart!
    for _ in range(3):
        client.post("/api/staff/login", json={"pinCode": "9999"})
    # 5th attempt
    res_bad_5th = client.post("/api/staff/login", json={"pinCode": "9999"})
    assert res_bad_5th.status_code == 401
    # 6th attempt -> 429 Too Many Requests (Lockout)
    res_locked = client.post("/api/staff/login", json={"pinCode": "9999"})
    assert res_locked.status_code == 429
    assert "Xavfsizlik qulfi" in res_locked.json().get("detail", "")

    # Muvaffaqiyatli kirish bilan tozalash
    from server import clear_failed_logins
    clear_failed_logins("testclient")


def test_doctors_and_services_strict_isolation():
    """3. Shifokorlar va xizmatlarning tenantlar hamda filiallar bo'yicha qat'iy ajralishi"""
    client = TestClient(app)

    # 1. Shifokorlar izolyatsiyasi
    dentamed_docs = client.get("/api/doctors?tenantId=dentamed").json()
    grandmed_docs = client.get("/api/doctors?tenantId=grandmed").json()

    assert len(dentamed_docs) >= 5
    assert len(grandmed_docs) >= 2

    dentamed_doc_ids = {d["id"] for d in dentamed_docs}
    grandmed_doc_ids = {d["id"] for d in grandmed_docs}

    # Tenantlararo shifokorlar kesishmasligi shart (Disjoint sets)
    common_docs = dentamed_doc_ids.intersection(grandmed_doc_ids)
    assert len(common_docs) == 0, f"DentaMed va GrandMed shifokorlari kesishmasligi kerak: {common_docs}"

    # Filial bo'yicha shifokor: Samarqand filiali
    samarqand_docs = client.get("/api/doctors?clinicId=dentamed-samarqand").json()
    assert len(samarqand_docs) > 0
    assert all(d["clinicId"] == "dentamed-samarqand" or "dentamed-samarqand" in d.get("clinicIds", []) for d in samarqand_docs)

    # 2. Xizmatlar izolyatsiyasi
    dentamed_srvs = client.get("/api/services?tenantId=dentamed").json()
    grandmed_srvs = client.get("/api/services?tenantId=grandmed").json()

    assert len(dentamed_srvs) >= 8
    assert len(grandmed_srvs) >= 3

    assert all(s.get("tenantId") == "dentamed" for s in dentamed_srvs)
    assert all(s.get("tenantId") == "grandmed" for s in grandmed_srvs)


def test_appointments_isolation_per_tenant_and_branch():
    """4. Qabullar va ma'lumotlar bazasi darajasidagi Tenant Data Isolation"""
    client = TestClient(app)

    # A) DentaMed qabullari
    res_dentamed = client.get("/api/appointments?tenantId=dentamed")
    assert res_dentamed.status_code == 200
    d_appts = res_dentamed.json()
    assert len(d_appts) == 2
    assert all(a["tenantId"] == "dentamed" for a in d_appts)

    # B) GrandMed qabullari
    res_grandmed = client.get("/api/appointments?tenantId=grandmed")
    assert res_grandmed.status_code == 200
    g_appts = res_grandmed.json()
    assert len(g_appts) == 1
    assert all(a["tenantId"] == "grandmed" for a in g_appts)

    # C) Muayyan filial (Nukus) qabullari
    res_nukus = client.get("/api/appointments?clinicId=dentamed-nukus")
    assert res_nukus.status_code == 200
    nukus_appts = res_nukus.json()
    assert len(nukus_appts) == 1
    assert nukus_appts[0]["clinicId"] == "dentamed-nukus"

    # D) Yangi qabul yaratilganda tenantId avtomatik biriktirilishi
    new_gm_appt = {
        "id": "GM-PARALLEL-777",
        "pinCode": "2002",
        "patientName": "Farida Rahimova",
        "phone": "+998903330002",
        "doctor": {"id": 102, "name": "Dr. Madina Usmonova"},
        "service": {"id": 302, "title": {"uz": "Eylayner"}, "price": 6000000},
        "date": "2026-10-10",
        "time": "15:00",
        "clinicId": "grandmed-sergeli",
        "createdAt": "2026-09-12T00:00:00"
    }
    create_res = client.post("/api/appointments", json=new_gm_appt)
    assert create_res.status_code == 200

    # Saqlangan qabulda tenantId 'grandmed' ekanligini tekshirish
    g_appts_updated = client.get("/api/appointments?tenantId=grandmed").json()
    assert len(g_appts_updated) == 2
    saved_parallel = next(a for a in g_appts_updated if a["id"] == "GM-PARALLEL-777")
    assert saved_parallel["tenantId"] == "grandmed"
    assert saved_parallel["clinicId"] == "grandmed-sergeli"


def test_tenant_analytics_breakdown():
    """5. Rahbar uchun ko'p filialli analitika: tushum, bandlik va shifokorlar ko'rsatkichi"""
    client = TestClient(app)

    # DentaMed analitikasi
    res_d = client.get("/api/tenants/dentamed/analytics")
    assert res_d.status_code == 200
    analytics_d = res_d.json()

    assert analytics_d["tenantId"] == "dentamed"
    assert analytics_d["totalAppointments"] == 2
    assert analytics_d["totalRevenue"] == 350000 + 4500000
    assert len(analytics_d["branchesBreakdown"]) == 5
    assert len(analytics_d["topDoctors"]) >= 2

    # GrandMed analitikasi
    res_g = client.get("/api/tenants/grandmed/analytics")
    assert res_g.status_code == 200
    analytics_g = res_g.json()

    assert analytics_g["tenantId"] == "grandmed"
    assert analytics_g["totalAppointments"] == 1
    assert analytics_g["totalRevenue"] == 4200000
    assert len(analytics_g["branchesBreakdown"]) == 2


def test_tenant_registration_and_immediate_login():
    """6. Yangi klinika (SaaS Customer) ro'yxatdan o'tishi va tizimga kirishi"""
    client = TestClient(app)

    payload = {
        "name": "Shifo Nur Med",
        "ownerName": "Dr. Botir Qodirov",
        "phone": "+998 71 200-77-77",
        "email": "botir@shifonur.uz",
        "firstBranchName": "Shifo Nur Chilonzor",
        "firstBranchAddress": "Toshkent shahar, Chilonzor 9-mavze"
    }

    res = client.post("/api/tenants/register", json=payload)
    assert res.status_code == 200
    reg_data = res.json()
    assert reg_data["status"] == "success"
    
    tenant_info = reg_data["tenant"]
    new_owner_pin = tenant_info["ownerPin"]
    new_staff_pin = tenant_info["branch"]["staffPin"]
    new_tenant_id = tenant_info["id"]

    # 1. Yangi egasining PIN kodi orqali tizimga kirishi
    res_owner_login = client.post("/api/staff/login", json={"pinCode": new_owner_pin})
    assert res_owner_login.status_code == 200
    owner_login = res_owner_login.json()
    assert owner_login["role"] == "owner"
    assert owner_login["tenantId"] == new_tenant_id
    assert tenant_info["branch"]["id"] in owner_login["allowedBranchIds"]

    # 2. Yangi filial retsepshni PIN kodi orqali tizimga kirishi
    res_staff_login = client.post("/api/staff/login", json={"pinCode": new_staff_pin})
    assert res_staff_login.status_code == 200
    staff_login = res_staff_login.json()
    assert staff_login["role"] == "receptionist"
    assert staff_login["tenantId"] == new_tenant_id
    assert staff_login["clinicId"] == tenant_info["branch"]["id"]
