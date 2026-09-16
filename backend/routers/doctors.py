from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone, timedelta
import server
from server import *

router = APIRouter(tags=["Doctors & Services"])

@router.get("/api/doctors")
def get_doctors(
    clinicId: Optional[str] = Query(None),
    tenantId: Optional[str] = Query(None)
):
    doctors = load_json_file(DOCTORS_FILE)
    if tenantId:
        doctors = [d for d in doctors if d.get("tenantId") == tenantId]
    if clinicId:
        doctors = [
            d for d in doctors
            if d.get("clinicId") == clinicId or (isinstance(d.get("clinicIds"), list) and clinicId in d.get("clinicIds"))
        ]
    return doctors

# Filtered services by clinicId and tenantId
@router.get("/api/services")
def get_services(
    clinicId: Optional[str] = Query(None),
    tenantId: Optional[str] = Query(None)
):
    services = load_json_file(SERVICES_FILE)
    if tenantId:
        services = [s for s in services if s.get("tenantId") == tenantId]
    if clinicId:
        services = [
            s for s in services
            if s.get("clinicId") == clinicId or (isinstance(s.get("clinicIds"), list) and clinicId in s.get("clinicIds"))
        ]
    return services

@router.get("/api/clinic-data")
def get_clinic_data(clinicId: Optional[str] = Query(None)):
    clinics = load_json_file(CLINICS_FILE)
    clinic = get_clinic_by_id(clinicId) if clinicId else (clinics[0] if clinics else {})
    doctors = get_doctors(clinicId)
    services = get_services(clinicId)
    return {
        "clinic": clinic,
        "clinics": clinics,
        "clinicName": clinic.get("name", "DentaMed Atelier"),
        "phone": clinic.get("phone", "+998 (71) 200-00-00"),
        "address": clinic.get("address", "Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy"),
        "doctors": doctors,
        "services": services,
    }

@router.put("/api/services/{service_id}")
async def update_service(service_id: int, request: Request):
    data = await request.json()
    services = load_json_file(SERVICES_FILE)
    found = False
    for i, srv in enumerate(services):
        if srv.get("id") == service_id:
            services[i] = {**srv, **data, "id": service_id}
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    save_json_file(SERVICES_FILE, services)
    return {"status": "success", "service": services[i]}

@router.post("/api/services")
async def create_service(request: Request):
    data = await request.json()
    services = load_json_file(SERVICES_FILE)
    new_id = max([s.get("id", 0) for s in services] + [0]) + 1
    new_srv = {
        "id": new_id,
        "tenantId": data.get("tenantId", "dentamed"),
        "department": data.get("department", "stomatology"),
        "category": data.get("category", {"uz": "Umumiy", "ru": "Общее"}),
        "title": data.get("title", {"uz": "Yangi xizmat", "ru": "Новая услуга"}),
        "desc": data.get("desc", {"uz": "", "ru": ""}),
        "price": int(data.get("price", 100000)),
        "duration": int(data.get("duration", 30)),
        "isPopular": bool(data.get("isPopular", False)),
        "clinicIds": data.get("clinicIds", [])
    }
    services.append(new_srv)
    save_json_file(SERVICES_FILE, services)
    return {"status": "success", "service": new_srv}

@router.delete("/api/services/{service_id}")
def delete_service(service_id: int):
    services = load_json_file(SERVICES_FILE)
    new_services = [s for s in services if s.get("id") != service_id]
    if len(new_services) == len(services):
        raise HTTPException(status_code=404, detail="Xizmat topilmadi")
    save_json_file(SERVICES_FILE, new_services)
    return {"status": "success", "message": "Xizmat o'chirildi"}

# 2. DOCTOR MANAGEMENT ENDPOINTS (Owner / Admin)
@router.post("/api/doctors")
async def create_doctor(request: Request):
    data = await request.json()
    doctors = load_json_file(DOCTORS_FILE)
    new_id = max([d.get("id", 0) for d in doctors] + [0]) + 1
    spec_data = data.get("specialty", {})
    if isinstance(spec_data, str):
        spec_data = {"uz": spec_data, "ru": spec_data}
    new_doc = {
        "id": new_id,
        "tenantId": data.get("tenantId", "dentamed"),
        "name": data.get("name", "Yangi Shifokor"),
        "specialty": spec_data,
        "department": data.get("department", "stomatology"),
        "experience": int(data.get("experience", 5)),
        "rating": float(data.get("rating", 4.9)),
        "reviewsCount": int(data.get("reviewsCount", 10)),
        "photo": data.get("photo", "/images/doctors/dr_jamshid.jpg"),
        "availableDays": data.get("availableDays", ["Dush", "Sesh", "Chor", "Pay", "Jum"]),
        "clinicId": data.get("clinicId"),
        "clinicIds": data.get("clinicIds", [data.get("clinicId")] if data.get("clinicId") else [])
    }
    doctors.append(new_doc)
    save_json_file(DOCTORS_FILE, doctors)
    return {"status": "success", "doctor": new_doc}

@router.put("/api/doctors/{doctor_id}")
async def update_doctor(doctor_id: int, request: Request):
    data = await request.json()
    doctors = load_json_file(DOCTORS_FILE)
    found = False
    for i, d in enumerate(doctors):
        if d.get("id") == doctor_id:
            doctors[i] = {**d, **data, "id": doctor_id}
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Shifokor topilmadi")
    save_json_file(DOCTORS_FILE, doctors)
    return {"status": "success", "doctor": doctors[i]}

@router.delete("/api/doctors/{doctor_id}")
def delete_doctor(doctor_id: int):
    doctors = load_json_file(DOCTORS_FILE)
    new_doctors = [d for d in doctors if d.get("id") != doctor_id]
    if len(new_doctors) == len(doctors):
        raise HTTPException(status_code=404, detail="Shifokor topilmadi")
    save_json_file(DOCTORS_FILE, new_doctors)
    return {"status": "success", "message": "Shifokor o'chirildi"}

# 2.1 SHIFOKOR ISH JADVALI VA TA'TILLARNI BOSHQARISH ENDPOINTLARI
@router.get("/api/doctors/{doctor_id}/schedule")
def get_doctor_schedule_endpoint(doctor_id: int):
    return get_doctor_schedule(doctor_id)

@router.post("/api/doctors/{doctor_id}/schedule")
async def update_doctor_schedule_endpoint(doctor_id: int, payload: ScheduleUpdateModel):
    schedules = load_doctor_schedules()
    target_idx = None
    for i, s in enumerate(schedules):
        if s.get("doctorId") == doctor_id:
            target_idx = i
            break

    if target_idx is not None:
        target = schedules[target_idx]
        if payload.workingHours is not None:
            target["workingHours"] = payload.workingHours
        if payload.lunchBreak is not None:
            target["lunchBreak"] = payload.lunchBreak
        if payload.slotDuration is not None:
            target["slotDuration"] = payload.slotDuration
        schedules[target_idx] = target
    else:
        target = {
            "doctorId": doctor_id,
            "workingHours": payload.workingHours or {"start": "09:00", "end": "18:00"},
            "lunchBreak": payload.lunchBreak or {"start": "13:00", "end": "14:00"},
            "slotDuration": payload.slotDuration or 30,
            "leaves": []
        }
        schedules.append(target)

    save_doctor_schedules(schedules)
    return {"status": "success", "schedule": target}

@router.post("/api/doctors/{doctor_id}/leaves")
async def add_doctor_leave_endpoint(doctor_id: int, payload: LeaveModel):
    schedules = load_doctor_schedules()
    target_idx = None
    for i, s in enumerate(schedules):
        if s.get("doctorId") == doctor_id:
            target_idx = i
            break

    if target_idx is None:
        target = {
            "doctorId": doctor_id,
            "workingHours": {"start": "09:00", "end": "18:00"},
            "lunchBreak": {"start": "13:00", "end": "14:00"},
            "slotDuration": 30,
            "leaves": []
        }
        schedules.append(target)
        target_idx = len(schedules) - 1

    target = schedules[target_idx]
    leaves = target.get("leaves", [])
    found = False
    for l in leaves:
        if l.get("date") == payload.date:
            l["reason"] = payload.reason
            found = True
            break
    if not found:
        leaves.append({"date": payload.date, "reason": payload.reason})

    target["leaves"] = leaves
    schedules[target_idx] = target
    save_doctor_schedules(schedules)
    return {"status": "success", "message": "Ta'til sanasi qo'shildi", "schedule": target}

@router.delete("/api/doctors/{doctor_id}/leaves/{leave_date}")
def delete_doctor_leave_endpoint(doctor_id: int, leave_date: str):
    schedules = load_doctor_schedules()
    target = None
    for s in schedules:
        if s.get("doctorId") == doctor_id:
            target = s
            break

    if not target:
        raise HTTPException(status_code=404, detail="Shifokor jadvali topilmadi")

    orig_count = len(target.get("leaves", []))
    target["leaves"] = [l for l in target.get("leaves", []) if l.get("date") != leave_date]
    if len(target["leaves"]) == orig_count:
        raise HTTPException(status_code=404, detail="Ko'rsatilgan sanadagi ta'til topilmadi")

    save_doctor_schedules(schedules)
    return {"status": "success", "message": "Ta'til sanasi o'chirildi", "schedule": target}

# 3. PHOTO UPLOAD (Base64 data URL)
@router.post("/api/upload/doctor-photo")
async def upload_doctor_photo(request: Request):
    import base64
    body = await request.json()
    data_url = body.get("dataUrl", "")
    file_name = body.get("fileName", f"doctor_{int(datetime.now().timestamp())}.jpg")
    tenant_id = body.get("tenantId", "common")

    safe_name = "".join(c for c in file_name if c.isalnum() or c in "._-")
    if not safe_name.endswith((".jpg", ".png", ".jpeg", ".webp")):
        safe_name += ".jpg"

    doctors_img_dir = Path(__file__).parent.parent / "frontend" / "public" / "images" / "doctors"
    doctors_img_dir.mkdir(parents=True, exist_ok=True)
    out_file = doctors_img_dir / safe_name

    if "," in data_url:
        _, encoded = data_url.split(",", 1)
        image_data = base64.b64decode(encoded)
        with open(out_file, "wb") as f:
            f.write(image_data)
        return {"status": "success", "url": f"/images/doctors/{safe_name}"}

    return {"status": "error", "message": "Noto'g'ri rasm formati"}

# 4. TENANT PROMO / EXCLUSIVE OFFERS MANAGEMENT
@router.get("/api/tenants/{tenant_id}/promo")
def get_tenant_promo(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    
    # Tenant-specific defaults
    if tenant_id == "grandmed":
        default_promo = {
            "titleUz": "GrandMed: Shveysariya Implanti o'rnatganlarga 3D Tomografiya 100% BEPUL!",
            "titleRu": "GrandMed: При установке импланта — 3D Томография 100% БЕСПЛАТНО!",
            "badgeUz": "Eksklyuziv GrandMed Taklifi",
            "badgeRu": "Эксклюзивное предложение",
            "discountPercent": 50,
            "descUz": "Shveysariya texnologiyasi asosida to'liq tish qatorini 1 kunda tiklash va bepul 3D konsultatsiya.",
            "descRu": "Восстановление зубов за 1 день по швейцарским технологиям и бесплатная 3D консультация.",
            "buttonTextUz": "Imtiyoz bilan yozilish",
            "buttonTextRu": "Записаться по акции",
            "isActive": True
        }
    else:
        default_promo = {
            "titleUz": "Tish davolatganga LOR ko'rigi — 50% Imtiyoz",
            "titleRu": "При лечении зубов — осмотр ЛОР-врача со скидкой 50%",
            "badgeUz": "Eksklyuziv Atelier Taklifi",
            "badgeRu": "Эксклюзивное предложение Atelier",
            "discountPercent": 50,
            "descUz": "Gaymorit va tish kanallari o'zaro bog'liq. Shveysariya protokoli bo'yicha kompleks tashxisdan o'ting.",
            "descRu": "Гайморит и зубные каналы взаимосвязаны. Пройдите комплексную диагностику.",
            "buttonTextUz": "Imtiyoz bilan yozilish",
            "buttonTextRu": "Записаться по акции",
            "isActive": True
        }
    return tenant.get("promo") or default_promo

@router.put("/api/tenants/{tenant_id}/promo")
async def update_tenant_promo(tenant_id: str, request: Request):
    data = await request.json()
    tenants = load_json_file(TENANTS_FILE)
    found = False
    for i, t in enumerate(tenants):
        if t.get("id") == tenant_id:
            tenants[i]["promo"] = data
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    save_json_file(TENANTS_FILE, tenants)
    return {"status": "success", "promo": data}

# 2. CONCURRENCY: SLOTS AVAILABILITY ENDPOINT
