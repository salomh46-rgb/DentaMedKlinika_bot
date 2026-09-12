import sys
import os
import json
import pytest
from pathlib import Path

backend_dir = Path(__file__).parent.parent / 'backend'
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from server import app, load_json_file, DOCTORS_FILE, SERVICES_FILE, TENANTS_FILE

client = TestClient(app)

def test_tenant_promo_api():
    res = client.get('/api/tenants/dentamed/promo')
    assert res.status_code == 200
    data = res.json()
    assert 'titleUz' in data
    assert data['discountPercent'] == 50

    res_gm = client.get('/api/tenants/grandmed/promo')
    assert res_gm.status_code == 200

    update_payload = {
        'titleUz': 'Test Yangilangan Aksiya',
        'titleRu': 'Тестовая акция',
        'badgeUz': 'Aksiya',
        'badgeRu': 'Акция',
        'discountPercent': 40,
        'descUz': 'Tavsif',
        'descRu': 'Описание',
        'buttonTextUz': 'Yozilish',
        'buttonTextRu': 'Записаться',
        'isActive': True
    }
    res_put = client.put('/api/tenants/grandmed/promo', json=update_payload)
    assert res_put.status_code == 200
    assert res_put.json()['promo']['discountPercent'] == 40

def test_doctor_crud_flow():
    new_doc_payload = {
        'tenantId': 'grandmed',
        'name': 'Dr. Rustam Karimov',
        'specialty': {'uz': 'Bosh Shifokor, Jarroh', 'ru': 'Главный Врач, Хирург'},
        'department': 'stomatology',
        'experience': 16,
        'rating': 5.0,
        'reviewsCount': 24,
        'clinicId': 'grandmed-markaziy',
        'clinicIds': ['grandmed-markaziy']
    }
    res_post = client.post('/api/doctors', json=new_doc_payload)
    assert res_post.status_code == 200
    created = res_post.json()['doctor']
    doc_id = created['id']
    assert created['tenantId'] == 'grandmed'
    assert created['name'] == 'Dr. Rustam Karimov'

    res_put = client.put(f'/api/doctors/{doc_id}', json={'experience': 17, 'rating': 4.95})
    assert res_put.status_code == 200
    assert res_put.json()['doctor']['experience'] == 17

    res_del = client.delete(f'/api/doctors/{doc_id}')
    assert res_del.status_code == 200
    assert res_del.json()['status'] == 'success'

def test_doctor_photo_upload():
    dummy_b64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    res = client.post('/api/upload/doctor-photo', json={
        'dataUrl': dummy_b64,
        'fileName': 'test_upload_doc.jpg',
        'tenantId': 'grandmed'
    })
    assert res.status_code == 200
    assert res.json()['status'] == 'success'
    assert '/images/doctors/' in res.json()['url']

def test_service_crud_flow():
    new_srv = {
        'tenantId': 'grandmed',
        'department': 'stomatology',
        'title': {'uz': '3D Diagnostika', 'ru': '3D Диагностика'},
        'desc': {'uz': 'Batafsil tekshiruv', 'ru': 'Детальный осмоtr'},
        'price': 250000,
        'duration': 25,
        'clinicIds': ['grandmed-markaziy']
    }
    res = client.post('/api/services', json=new_srv)
    assert res.status_code == 200
    created = res.json()['service']
    srv_id = created['id']

    res_del = client.delete(f'/api/services/{srv_id}')
    assert res_del.status_code == 200
