import sys
import os
import json
import pytest
from pathlib import Path

backend_dir = Path(__file__).parent.parent / 'backend'
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from server import (
    app,
    load_json_file,
    load_db,
    save_db,
    get_doctor_schedule,
    send_sms_notification,
    SMS_SENT_LOGS,
    DOCTOR_SCHEDULES_FILE,
    DB_FILE
)

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_state():
    # Testlar oldidan va keyin zaxira holatini saqlash
    orig_db = load_json_file(DB_FILE)
    orig_schedules = load_json_file(DOCTOR_SCHEDULES_FILE)
    orig_sms_count = len(SMS_SENT_LOGS)
    yield
    save_db(orig_db)
    with open(DOCTOR_SCHEDULES_FILE, 'w', encoding='utf-8') as f:
        json.dump(orig_schedules, f, ensure_ascii=False, indent=2)

def test_doctor_default_schedule_for_new_doctor():
    # Mavjud bo'lmagan shifokor uchun standart jadval qaytishi
    resp = client.get('/api/doctors/999/schedule')
    assert resp.status_code == 200
    data = resp.json()
    assert data['doctorId'] == 999
    assert data['workingHours']['start'] == '09:00'
    assert data['workingHours']['end'] == '18:00'
    assert data['lunchBreak']['start'] == '13:00'
    assert data['lunchBreak']['end'] == '14:00'
    assert isinstance(data['leaves'], list)

def test_doctor_schedule_crud_flow():
    # 1. Jadvalni olish
    resp_get = client.get('/api/doctors/1/schedule')
    assert resp_get.status_code == 200
    sched = resp_get.json()
    assert sched['doctorId'] == 1

    # 2. Jadvalni yangilash
    update_payload = {
        'workingHours': {'start': '08:30', 'end': '19:00'},
        'lunchBreak': {'start': '13:00', 'end': '14:00'},
        'slotDuration': 45
    }
    resp_post = client.post('/api/doctors/1/schedule', json=update_payload)
    assert resp_post.status_code == 200
    updated = resp_post.json()['schedule']
    assert updated['workingHours']['start'] == '08:30'
    assert updated['slotDuration'] == 45

def test_doctor_leaves_add_and_delete():
    # Yangi ta'til sanasi qo'shish
    leave_payload = {
        'date': '2026-11-15',
        'reason': 'Tibbiyot simpoziumi'
    }
    resp_add = client.post('/api/doctors/1/leaves', json=leave_payload)
    assert resp_add.status_code == 200
    sched = resp_add.json()['schedule']
    assert any(l['date'] == '2026-11-15' and 'simpozium' in l['reason'].lower() for l in sched['leaves'])

    # Ta'tilni o'chirish
    resp_del = client.delete('/api/doctors/1/leaves/2026-11-15')
    assert resp_del.status_code == 200
    sched_after = resp_del.json()['schedule']
    assert not any(l['date'] == '2026-11-15' for l in sched_after['leaves'])

    # Mavjud bo'lmagan ta'tilni o'chirishga urinish (404)
    resp_del_404 = client.delete('/api/doctors/1/leaves/2029-01-01')
    assert resp_del_404.status_code == 404

def test_slots_lunch_break_automatically_blocked():
    # Shifokor tushlik vaqti (13:00 va 13:30) avtomatik tarzda slotlarda bloklanishi
    resp = client.get('/api/slots?doctorId=1&date=2026-11-20&clinicId=dentamed-nukus')
    assert resp.status_code == 200
    data = resp.json()
    booked = data['bookedTimes']
    assert '13:00' in booked
    assert '13:30' in booked
    assert data['lunchBreak']['start'] == '13:00'

def test_appointment_rejected_during_lunch_break():
    # Bemor shifokorning tushlik vaqtiga (13:00) yozilishga uringanda 409 qaytarilishi
    appt_payload = {
        'id': 'TEST-LUNCH-001',
        'pinCode': '9901',
        'patientName': 'Sardor Alimov',
        'phone': '+998901112233',
        'doctor': {'id': 1, 'name': 'Dr. Jamshid Rustamov'},
        'service': {'id': 101, 'title': {'uz': 'Estetik Plomba'}, 'price': 350000},
        'date': '2026-11-20',
        'time': '13:00',
        'clinicId': 'dentamed-nukus',
        'createdAt': '2026-09-12T12:00:00'
    }
    resp = client.post('/api/appointments', json=appt_payload)
    assert resp.status_code == 409
    assert 'tushlik' in resp.json()['detail'].lower()

def test_slots_all_blocked_during_doctor_leave():
    # 1. Shifokorga ta'til belgilash
    leave_payload = {'date': '2026-11-25', 'reason': 'Malaka oshirish kursi'}
    client.post('/api/doctors/1/leaves', json=leave_payload)

    # 2. Slotlarni tekshirish: barcha vaqtlar bloklangan bo'lishi kerak
    resp = client.get('/api/slots?doctorId=1&date=2026-11-25&clinicId=dentamed-nukus')
    assert resp.status_code == 200
    data = resp.json()
    assert data['isOnLeave'] is True
    assert 'Malaka oshirish' in data['leaveReason']
    booked = data['bookedTimes']
    # Barcha ish vaqtlari bloklangan bo'lishi shart
    for t in ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']:
        assert t in booked

def test_appointment_rejected_during_doctor_leave():
    # Shifokor ta'tilda bo'lgan sanaga qabulga yozilish rad etilishi (409)
    leave_payload = {'date': '2026-11-25', 'reason': 'Malaka oshirish kursi'}
    client.post('/api/doctors/1/leaves', json=leave_payload)

    appt_payload = {
        'id': 'TEST-LEAVE-001',
        'pinCode': '9902',
        'patientName': 'Bekzod Rahimov',
        'phone': '+998905556677',
        'doctor': {'id': 1, 'name': 'Dr. Jamshid Rustamov'},
        'service': {'id': 101, 'title': {'uz': 'Estetik Plomba'}, 'price': 350000},
        'date': '2026-11-25',
        'time': '10:00',
        'clinicId': 'dentamed-nukus',
        'createdAt': '2026-09-12T12:00:00'
    }
    resp = client.post('/api/appointments', json=appt_payload)
    assert resp.status_code == 409
    assert "ta'tilda" in resp.json()['detail'].lower() or "tatilda" in resp.json()['detail'].lower()

def test_tenant_financials_kpi_and_payment_breakdown():
    # Moliyaviy kassa va shifokorlar KPI ulushi hisoboti
    resp = client.get('/api/tenants/dentamed/financials')
    assert resp.status_code == 200
    fin = resp.json()
    assert fin['status'] == 'success'
    assert fin['tenantId'] == 'dentamed'
    assert fin['currency'] == 'UZS'
    assert fin['totalRevenue'] > 0

    # To'lov turlari taqsimoti
    breakdown = fin['paymentBreakdown']
    assert 'cash' in breakdown
    assert 'card' in breakdown
    assert 'online' in breakdown
    total_breakdown = breakdown['cash'] + breakdown['card'] + breakdown['online']
    assert total_breakdown == fin['totalRevenue']

    # Shifokorlar KPI va 30% komissiyasi
    commissions = fin['doctorCommission']
    assert len(commissions) > 0
    for doc_stat in commissions:
        assert 'doctorId' in doc_stat
        assert 'doctorName' in doc_stat
        assert 'treatmentsCount' in doc_stat
        assert 'totalRevenue' in doc_stat
        assert doc_stat['commissionRate'] == 0.30
        expected_commission = round(doc_stat['totalRevenue'] * 0.30)
        assert doc_stat['commissionAmount'] == expected_commission

def test_sms_gateway_fallback_and_logs():
    # Telegram ID si bo'lmagan bemor yozilganda SMS zaxira shlyuzining ishlashi
    initial_log_count = len(SMS_SENT_LOGS)
    appt_payload = {
        'id': 'TEST-SMS-FALLBACK-001',
        'pinCode': '5544',
        'patientName': "Nodir Jo'rayev",
        'phone': '+998907778899',
        'doctor': {'id': 2, 'name': 'Dr. Shahlo Karimova'},
        'service': {'id': 104, 'title': {'uz': 'Ultrasonik tozalash'}, 'price': 400000},
        'date': '2026-11-28',
        'time': '15:00',
        'clinicId': 'dentamed-nukus',
        'createdAt': '2026-09-12T12:00:00',
        'telegramUserId': None
    }
    resp = client.post('/api/appointments', json=appt_payload)
    assert resp.status_code == 200

    # SMS logs tekshiruvi
    resp_logs = client.get('/api/sms/logs')
    assert resp_logs.status_code == 200
    logs_data = resp_logs.json()
    assert logs_data['count'] > initial_log_count
    last_sms = logs_data['logs'][-1]
    assert '+998907778899' in last_sms['phone']
    assert 'DentaMed' in last_sms['message']

@pytest.mark.asyncio
async def test_direct_sms_notification_helper():
    # send_sms_notification to'g'ridan-to'g'ri chaqirilishi
    res = await send_sms_notification('+998 90 999 88 77', 'Hurmatli bemor, sinov xabari')
    assert res['success'] is True
    assert res['status'] == 'sent'
    assert res['phone'] == '+998909998877'
    assert res['gateway'] == 'eskiz_uz'