import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path
import json
import uuid
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from server import app, load_db, save_db, load_json_file, save_json_file, SHIFTS_FILE, EXPENSES_FILE, DEBTS_FILE

client = TestClient(app)

def test_shift_lifecycle_and_z_report():
    tenant_id = f"test_tenant_{uuid.uuid4().hex[:6]}"
    clinic_id = f"test_clinic_{uuid.uuid4().hex[:6]}"

    # 1. Initially no active shift
    res = client.get(f"/api/shifts/current?clinicId={clinic_id}&tenantId={tenant_id}")
    assert res.status_code == 200
    assert res.json()["hasActiveShift"] is False

    # 2. Open shift with 500,000 UZS starting cash
    open_res = client.post("/api/shifts/open", json={
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "cashierName": "Dilnoza Rahimova",
        "startingCash": 500000,
        "notes": "Ertalabki smena ochildi"
    })
    assert open_res.status_code == 200
    shift_data = open_res.json()["shift"]
    assert shift_data["status"] == "open"
    assert shift_data["startingCash"] == 500000

    # 3. Add expense (e.g. 50,000 UZS for supplies)
    exp_res = client.post("/api/shifts/expense", json={
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "category": "materiallar",
        "amount": 50000,
        "recipient": "StomMarket MChJ",
        "comment": "Bir martalik shpritslar"
    })
    assert exp_res.status_code == 200
    assert exp_res.json()["expense"]["amount"] == 50000

    # 4. Check live stats during shift
    curr_res = client.get(f"/api/shifts/current?clinicId={clinic_id}&tenantId={tenant_id}")
    assert curr_res.status_code == 200
    live = curr_res.json()["liveStats"]
    assert live["startingCash"] == 500000
    assert live["totalExpense"] == 50000
    assert live["expectedCash"] == 450000

    # 5. Close shift with actual counted cash
    close_res = client.post("/api/shifts/close", json={
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "actualCash": 450000,
        "notes": "Kassa to'liq mos keldi"
    })
    assert close_res.status_code == 200
    closed_shift = close_res.json()["shift"]
    assert closed_shift["status"] == "closed"
    assert closed_shift["expectedCash"] == 450000
    assert closed_shift["actualCash"] == 450000
    assert closed_shift["difference"] == 0

def test_debt_module_and_installment_payment():
    tenant_id = f"test_tenant_{uuid.uuid4().hex[:6]}"
    clinic_id = f"test_clinic_{uuid.uuid4().hex[:6]}"
    appt_id = f"APPT-DEBT-{uuid.uuid4().hex[:6]}"

    # Create appointment with 5,000,000 total: 2,000,000 paid, 3,000,000 debt (nasiya)
    appt_payload = {
        "id": appt_id,
        "pinCode": "5566",
        "patientName": "Aziz Olimov",
        "phone": "+998901234599",
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"name": "Shveysariya Implanti", "price": 5000000},
        "date": "2026-11-20",
        "time": "15:00",
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "totalAmount": 5000000,
        "paidAmount": 2000000,
        "debtAmount": 3000000,
        "paymentStatus": "partial",
        "createdAt": datetime.now().isoformat()
    }
    create_res = client.post("/api/appointments", json=appt_payload)
    assert create_res.status_code == 200

    # Verify debt was recorded in debts ledger
    debts_res = client.get(f"/api/debts?clinicId={clinic_id}&tenantId={tenant_id}")
    assert debts_res.status_code == 200
    debts = debts_res.json()
    assert len(debts) == 1
    assert debts[0]["appointmentId"] == appt_id
    assert debts[0]["debtAmount"] == 3000000
    assert debts[0]["paidAmount"] == 2000000

    # Pay 1,000,000 towards debt
    pay_res = client.post(f"/api/debts/{appt_id}/pay", json={
        "amount": 1000000,
        "paymentMethod": "card",
        "notes": "Terminal orqali qisman to'lov"
    })
    assert pay_res.status_code == 200
    updated = pay_res.json()["debt"]
    assert updated["debtAmount"] == 2000000
    assert updated["paidAmount"] == 3000000
    assert updated["paymentStatus"] == "partial"
    assert len(updated["history"]) == 2

    # Pay remaining 2,000,000 to clear debt
    full_pay_res = client.post(f"/api/debts/{appt_id}/pay", json={
        "amount": 2000000,
        "paymentMethod": "cash",
        "notes": "Qoldiq to'liq to'landi"
    })
    assert full_pay_res.status_code == 200
    cleared = full_pay_res.json()["debt"]
    assert cleared["debtAmount"] == 0
    assert cleared["paidAmount"] == 5000000
    assert cleared["paymentStatus"] == "paid"

def test_family_member_booking_bypass():
    tenant_id = f"test_tenant_{uuid.uuid4().hex[:6]}"
    clinic_id = f"test_clinic_{uuid.uuid4().hex[:6]}"
    phone = "+998909998877"

    # 1. First appointment for the parent
    parent_appt = {
        "id": f"APPT-P-{uuid.uuid4().hex[:6]}",
        "pinCode": "1111",
        "patientName": "Farhod Eshmatov",
        "phone": phone,
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"name": "Terapevtik ko'rik", "price": 100000},
        "date": "2026-11-25",
        "time": "10:00",
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "createdAt": datetime.now().isoformat()
    }
    res1 = client.post("/api/appointments", json=parent_appt)
    assert res1.status_code == 200

    # 2. Second appointment with SAME phone, without familyMemberName -> should be blocked by anti-spam
    duplicate_appt = {
        "id": f"APPT-D-{uuid.uuid4().hex[:6]}",
        "pinCode": "2222",
        "patientName": "Farhod Eshmatov",
        "phone": phone,
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"name": "Terapevtik ko'rik", "price": 100000},
        "date": "2026-11-26",
        "time": "11:00",
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "createdAt": datetime.now().isoformat()
    }
    res2 = client.post("/api/appointments", json=duplicate_appt)
    assert res2.status_code == 400
    assert "faol qabulingiz mavjud" in res2.json()["detail"]

    # 3. Third appointment with SAME phone, but FOR CHILD (familyMemberName) -> should succeed!
    child_appt = {
        "id": f"APPT-C-{uuid.uuid4().hex[:6]}",
        "pinCode": "3333",
        "patientName": "Farhod Eshmatov (Farzandi: Jasurbek)",
        "familyMemberName": "Jasurbek Eshmatov (o'g'li, 7 yosh)",
        "phone": phone,
        "doctor": {"id": 1, "name": "Dr. Jamshid Rustamov"},
        "service": {"name": "Bolalar stomatologiyasi", "price": 150000},
        "date": "2026-11-26",
        "time": "12:00",
        "clinicId": clinic_id,
        "tenantId": tenant_id,
        "createdAt": datetime.now().isoformat()
    }
    res3 = client.post("/api/appointments", json=child_appt)
    assert res3.status_code == 200
    assert res3.json()["appointment"]["familyMemberName"] == "Jasurbek Eshmatov (o'g'li, 7 yosh)"
