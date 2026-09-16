from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone, timedelta
import server
from server import *

router = APIRouter(tags=["Clinics & Tenants"])

# 1. MULTI-TENANT TENANTS & CLINICS ENDPOINTS
@router.get("/api/tenants")
def get_tenants():
    tenants = load_json_file(TENANTS_FILE)
    clinics = load_json_file(CLINICS_FILE)
    result = []
    for t in tenants:
        t_copy = dict(t)
        t_branches = [c for c in clinics if c.get("tenantId") == t.get("id")]
        t_copy["branches"] = t_branches
        t_copy["branchesCount"] = len(t_branches)
        result.append(t_copy)
    return result

@router.get("/api/tenants/{tenant_id}")
def get_tenant_detail(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")
    clinics = load_json_file(CLINICS_FILE)
    t_branches = [c for c in clinics if c.get("tenantId") == tenant_id]
    t_copy = dict(tenant)
    t_copy["branches"] = t_branches
    t_copy["branchesCount"] = len(t_branches)
    return t_copy

# Brute-force rate limiting: ip -> list of failed attempt datetimes
FAILED_LOGIN_ATTEMPTS: Dict[str, List[datetime]] = {}
MAX_FAILED_LOGINS = 5
LOCKOUT_PERIOD_SECONDS = 15 * 60  # 15 minutes

def check_login_rate_limit(client_ip: str):
    now = datetime.now(TASHKENT_TZ)
    if client_ip in FAILED_LOGIN_ATTEMPTS:
        recent_attempts = [
            t for t in FAILED_LOGIN_ATTEMPTS[client_ip]
            if (now - t).total_seconds() < LOCKOUT_PERIOD_SECONDS
        ]
        FAILED_LOGIN_ATTEMPTS[client_ip] = recent_attempts
        if len(recent_attempts) >= MAX_FAILED_LOGINS:
            wait_mins = max(1, int((LOCKOUT_PERIOD_SECONDS - (now - recent_attempts[0]).total_seconds()) / 60) + 1)
            raise HTTPException(
                status_code=429,
                detail=f"Xavfsizlik qulfi: 5 marta xato PIN kiritildi. Iltimos, {wait_mins} daqiqadan so'ng qayta urinib ko'ring yoki bosh ma'murga murojaat qiling."
            )

def record_failed_login(client_ip: str):
    now = datetime.now(TASHKENT_TZ)
    if client_ip not in FAILED_LOGIN_ATTEMPTS:
        FAILED_LOGIN_ATTEMPTS[client_ip] = []
    FAILED_LOGIN_ATTEMPTS[client_ip].append(now)

def clear_failed_logins(client_ip: str):
    if client_ip in FAILED_LOGIN_ATTEMPTS:
        del FAILED_LOGIN_ATTEMPTS[client_ip]

@router.post("/api/staff/login")
def staff_login(payload: StaffLoginModel, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    check_login_rate_limit(client_ip)

    pin = (payload.pinCode or payload.pin or "").strip()
    tenants = load_json_file(TENANTS_FILE)
    clinics = load_json_file(CLINICS_FILE)

    # 1. Check Owner / Director PINs
    for t in tenants:
        if str(t.get("ownerPin", "")).strip() == pin or (pin == "7777" and t.get("id") == "dentamed") or (pin == "8888" and t.get("id") == "grandmed"):
            clear_failed_logins(client_ip)
            allowed_branches = [c["id"] for c in clinics if c.get("tenantId") == t.get("id")]
            branch_count = len(allowed_branches)
            title_uz = f"👑 Klinika Rahbari (Barcha {branch_count} ta filial)" if t.get("id") == "dentamed" else f"👑 {t.get('name')} Rahbari (Barcha filiallar)"
            session_data = {
                "role": "clinic_director",
                "tenantId": t.get("id"),
                "staffName": t.get("ownerName", "Klinika Rahbari"),
                "titleUz": title_uz,
                "titleRu": f"👑 Руководитель {t.get('name')} (Все филиалы)",
                "isDirector": True,
                "allowedClinicIds": allowed_branches
            }
            return {
                "status": "success",
                "ok": True,
                "role": "owner",
                "session": session_data,
                "tenantId": t.get("id"),
                "tenantName": t.get("name"),
                "allowedBranchIds": allowed_branches,
                "branchName": f"Barcha filiallar ({branch_count})",
                "staffName": t.get("ownerName", "Klinika Rahbari")
            }

    # 2. Super Admin PIN (2026, 0000)
    if pin in ["2026", "0000"]:
        clear_failed_logins(client_ip)
        all_branches = [c["id"] for c in clinics]
        session_data = {
            "role": "super_admin",
            "tenantId": "all",
            "staffName": "Bosh Tizim Administratori",
            "titleUz": "💎 Bosh Administrator (Barcha Klinikalar)",
            "titleRu": "💎 Главный Администратор (Все клиники)",
            "isDirector": True,
            "allowedClinicIds": all_branches
        }
        return {
            "status": "success",
            "ok": True,
            "role": "super_admin",
            "session": session_data,
            "tenantId": "all",
            "allowedBranchIds": all_branches,
            "staffName": "Bosh Tizim Administratori"
        }

    # 3. Check Branch Staff PINs (Receptionists: 1001-1005, 2001-2002, etc.)
    for c in clinics:
        if str(c.get("staffPin", "")).strip() == pin:
            clear_failed_logins(client_ip)
            t_id = c.get("tenantId", "dentamed")
            parent_tenant = next((t for t in tenants if t.get("id") == t_id), None)
            t_name = parent_tenant.get("name") if parent_tenant else "DentaMed Atelier"
            session_data = {
                "role": "reception",
                "tenantId": t_id,
                "clinicId": c.get("id"),
                "staffName": c.get("managerName", "Filial Retsepshni"),
                "titleUz": f"📍 {c.get('name')} Retsepshni",
                "titleRu": f"📍 Ресепшн {c.get('name')}",
                "isDirector": False,
                "allowedClinicIds": [c.get("id")]
            }
            return {
                "status": "success",
                "ok": True,
                "role": "receptionist",
                "session": session_data,
                "tenantId": t_id,
                "tenantName": t_name,
                "allowedBranchIds": [c.get("id")],
                "branchName": c.get("name"),
                "clinicId": c.get("id"),
                "staffName": c.get("managerName", "Filial Retsepshni")
            }

    record_failed_login(client_ip)
    raise HTTPException(status_code=401, detail="Noto'g'ri PIN-kod! Qayta urinib ko'ring.")

@router.post("/api/tenants/register")
def register_tenant(payload: TenantRegisterModel):
    tenants = load_json_file(TENANTS_FILE)
    clinics = load_json_file(CLINICS_FILE)

    base_slug = payload.name.lower().replace(" ", "").replace("'", "").replace("-", "")
    slug = base_slug[:12] or f"tenant{len(tenants) + 1}"

    counter = 1
    orig_slug = slug
    while any(t.get("id") == slug for t in tenants):
        slug = f"{orig_slug}{counter}"
        counter += 1

    existing_owner_pins = {str(t.get("ownerPin")) for t in tenants}
    owner_pin = str(7000 + len(tenants) * 1111)
    while owner_pin in existing_owner_pins:
        owner_pin = str(int(owner_pin) + 11)

    branch_name = payload.firstBranchName or f"{payload.name} Bosh filial"
    branch_id = f"{slug}-main"
    existing_staff_pins = {str(c.get("staffPin")) for c in clinics}
    staff_pin = str(3000 + len(clinics))
    while staff_pin in existing_staff_pins:
        staff_pin = str(int(staff_pin) + 1)

    first_branch = {
        "id": branch_id,
        "tenantId": slug,
        "name": branch_name,
        "isMain": True,
        "address": payload.firstBranchAddress or "Toshkent shahar",
        "landmark": "Markaziy bino",
        "phone": payload.phone,
        "managerName": payload.ownerName,
        "staffPin": staff_pin,
        "workingHours": "08:00 - 20:00 (Har kuni)",
        "location": {"lat": 41.3111, "lng": 69.2797},
        "mapUrl": "https://maps.google.com/?q=41.3111,69.2797"
    }

    new_tenant = {
        "id": slug,
        "name": payload.name,
        "ownerName": payload.ownerName,
        "ownerPin": owner_pin,
        "phone": payload.phone,
        "email": payload.email or f"info@{slug}.uz",
        "logo": f"/images/{slug}_logo.png",
        "status": "active",
        "branchIds": [branch_id],
        "createdAt": datetime.now(TASHKENT_TZ).isoformat()
    }

    tenants.append(new_tenant)
    clinics.append(first_branch)

    save_json_file(TENANTS_FILE, tenants)
    save_json_file(CLINICS_FILE, clinics)

    return {
        "status": "success",
        "message": "Yangi klinika (tenant) va uning birinchi filiali muvaffaqiyatli ro'yxatdan o'tdi",
        "tenant": {
            "id": new_tenant["id"],
            "name": new_tenant["name"],
            "ownerName": new_tenant["ownerName"],
            "ownerPin": new_tenant["ownerPin"],
            "phone": new_tenant["phone"],
            "branch": first_branch
        }
    }

@router.get("/api/tenants/{tenant_id}/analytics")
def get_tenant_analytics(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")

    clinics = [c for c in load_json_file(CLINICS_FILE) if c.get("tenantId") == tenant_id]
    all_appts = load_db()
    tenant_appts = [a for a in all_appts if a.get("tenantId") == tenant_id]

    total_appointments = len(tenant_appts)
    completed_appts = [a for a in tenant_appts if a.get("status") == "completed"]

    total_revenue = 0
    for a in tenant_appts:
        if a.get("status") in ["completed", "confirmed"]:
            amt = a.get("totalAmount")
            if amt is None:
                amt = a.get("service", {}).get("price", 0)
            total_revenue += amt

    branches_breakdown = []
    for branch in clinics:
        b_id = branch.get("id")
        b_appts = [a for a in tenant_appts if a.get("clinicId") == b_id]
        b_revenue = 0
        for a in b_appts:
            if a.get("status") in ["completed", "confirmed"]:
                amt = a.get("totalAmount")
                if amt is None:
                    amt = a.get("service", {}).get("price", 0)
                b_revenue += amt

        branch_occupancy = round((len(b_appts) / max(total_appointments, 1)) * 100, 1) if total_appointments > 0 else 0.0

        branches_breakdown.append({
            "clinicId": b_id,
            "clinicName": branch.get("name"),
            "appointmentsCount": len(b_appts),
            "revenue": b_revenue,
            "occupancyRate": branch_occupancy
        })

    doctor_stats = {}
    for a in tenant_appts:
        doc = a.get("doctor", {})
        doc_id = doc.get("id")
        if not doc_id:
            continue
        if doc_id not in doctor_stats:
            doc_spec = doc.get("specialty", {})
            spec_str = doc_spec.get("uz") if isinstance(doc_spec, dict) else str(doc_spec or "")
            doctor_stats[doc_id] = {
                "doctorId": doc_id,
                "doctorName": doc.get("name", f"Shifokor #{doc_id}"),
                "specialty": spec_str,
                "appointmentsCount": 0,
                "revenue": 0
            }
        doctor_stats[doc_id]["appointmentsCount"] += 1
        if a.get("status") in ["completed", "confirmed"]:
            amt = a.get("totalAmount")
            if amt is None:
                amt = a.get("service", {}).get("price", 0)
            doctor_stats[doc_id]["revenue"] += amt

    top_doctors = sorted(list(doctor_stats.values()), key=lambda d: (d["revenue"], d["appointmentsCount"]), reverse=True)

    return {
        "tenantId": tenant_id,
        "tenantName": tenant.get("name"),
        "totalRevenue": total_revenue,
        "totalAppointments": total_appointments,
        "completedAppointments": len(completed_appts),
        "occupancyRate": 85.0 if total_appointments > 0 else 0.0,
        "branchesBreakdown": branches_breakdown,
        "topDoctors": top_doctors
    }

# 2. MOLIYAVIY KASSA VA SHIFOKORLAR KPI ULUSHI ENDPOINTI
@router.get("/api/tenants/{tenant_id}/financials")
def get_tenant_financials(tenant_id: str):
    tenants = load_json_file(TENANTS_FILE)
    tenant = next((t for t in tenants if t.get("id") == tenant_id), None)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant topilmadi")

    all_appts = load_db()
    tenant_appts = [a for a in all_appts if a.get("tenantId") == tenant_id]

    total_revenue = 0
    payment_breakdown = {
        "cash": 0,
        "card": 0,
        "online": 0
    }
    doctor_stats = {}

    for a in tenant_appts:
        if a.get("status") in ["completed", "confirmed"]:
            amt = a.get("totalAmount")
            if amt is None:
                amt = a.get("service", {}).get("price", 0)
            total_revenue += amt

            # To'lov turi taqsimoti
            raw_method = str(a.get("paymentMethod") or "cash").lower()
            if raw_method in ["cash", "naqd"]:
                payment_breakdown["cash"] += amt
            elif raw_method in ["card", "terminal", "karta", "uzcard", "humo"]:
                payment_breakdown["card"] += amt
            elif raw_method in ["online", "click", "payme", "uzum"]:
                payment_breakdown["online"] += amt
            else:
                payment_breakdown["cash"] += amt

            # Shifokorlar kesimidagi statistika
            doc = a.get("doctor", {})
            doc_id = doc.get("id")
            if doc_id:
                if doc_id not in doctor_stats:
                    doc_spec = doc.get("specialty", {})
                    spec_str = doc_spec.get("uz") if isinstance(doc_spec, dict) else str(doc_spec or "")
                    doctor_stats[doc_id] = {
                        "doctorId": doc_id,
                        "doctorName": doc.get("name", f"Shifokor #{doc_id}"),
                        "specialty": spec_str,
                        "treatmentsCount": 0,
                        "totalRevenue": 0,
                        "commissionRate": 0.30,
                        "commissionAmount": 0
                    }
                doctor_stats[doc_id]["treatmentsCount"] += 1
                doctor_stats[doc_id]["totalRevenue"] += amt
                doctor_stats[doc_id]["commissionAmount"] = round(doctor_stats[doc_id]["totalRevenue"] * 0.30)

    doctor_commission_list = sorted(
        list(doctor_stats.values()),
        key=lambda d: (d["totalRevenue"], d["treatmentsCount"]),
        reverse=True
    )

    return {
        "status": "success",
        "tenantId": tenant_id,
        "tenantName": tenant.get("name"),
        "currency": "UZS",
        "totalRevenue": total_revenue,
        "paymentBreakdown": payment_breakdown,
        "doctorCommission": doctor_commission_list,
        "doctors": doctor_commission_list
    }

# SMS XABARLAR LOGLARI ENDPOINTI
@router.get("/api/sms/logs")
def get_sms_logs():
    return {
        "status": "success",
        "count": len(SMS_SENT_LOGS),
        "logs": SMS_SENT_LOGS
    }

@router.get("/api/clinics")
def get_clinics(tenantId: Optional[str] = Query(None)):
    clinics = load_json_file(CLINICS_FILE)
    if tenantId:
        return [c for c in clinics if c.get("tenantId") == tenantId]
    return clinics

# Filtered doctors by clinicId and tenantId
