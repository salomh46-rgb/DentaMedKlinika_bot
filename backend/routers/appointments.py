from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone, timedelta
import server
from server import *

router = APIRouter(tags=["Appointments & Slots"])

@router.get("/api/slots")
def get_available_slots(doctorId: int = Query(...), date: str = Query(...), clinicId: Optional[str] = Query(None)):
    db = load_db()
    booked_times = set()
    for a in db:
        if a.get("status") == "cancelled":
            continue
        a_doc_id = a.get("doctor", {}).get("id")
        a_date = a.get("date")
        a_clinic = a.get("clinicId", "dentamed-nukus")

        if a_doc_id == doctorId and a_date == date:
            if clinicId is None or a_clinic == clinicId:
                t = a.get("time")
                if t:
                    booked_times.add(t)

    # Shifokor jadvali, ta'tillar va tushlik vaqtini tekshirish
    schedule = get_doctor_schedule(doctorId)
    is_on_leave = False
    leave_reason = None
    for leave in schedule.get("leaves", []):
        if leave.get("date") == date:
            is_on_leave = True
            leave_reason = leave.get("reason", "Ta'til")
            break

    lunch_break = schedule.get("lunchBreak", {"start": "13:00", "end": "14:00"})

    if is_on_leave:
        # Ta'til sanasida barcha slotlar bloklanadi (08:00 dan 20:00 gacha)
        all_day_slots = [
            f"{h:02d}:{m:02d}"
            for h in range(8, 20)
            for m in (0, 15, 30, 45)
        ]
        booked_times.update(all_day_slots)
    else:
        # Tushlik vaqti (13:00 - 14:00) bloklanadi
        l_start = lunch_break.get("start", "13:00")
        l_end = lunch_break.get("end", "14:00")
        try:
            start_h = int(l_start.split(":")[0])
            end_h = int(l_end.split(":")[0])
            lunch_slots = [
                f"{h:02d}:{m:02d}"
                for h in range(start_h, end_h + 1)
                for m in (0, 15, 30, 45)
                if l_start <= f"{h:02d}:{m:02d}" < l_end
            ]
            booked_times.update(lunch_slots)
        except Exception:
            booked_times.update(["13:00", "13:30"])

    sorted_slots = sorted(list(booked_times))
    return {
        "doctorId": doctorId,
        "date": date,
        "clinicId": clinicId,
        "bookedTimes": sorted_slots,
        "busySlots": sorted_slots,
        "isOnLeave": is_on_leave,
        "leaveReason": leave_reason,
        "lunchBreak": lunch_break
    }

@router.get("/api/appointments")
def get_appointments(
    tenantId: Optional[str] = Query(None),
    clinicId: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    db = load_db()
    results = db
    if tenantId:
        results = [a for a in results if a.get("tenantId") == tenantId]
    if clinicId:
        results = [a for a in results if a.get("clinicId") == clinicId]
    if status:
        results = [a for a in results if a.get("status") == status]
    return results

# STATUS UPDATE ENDPOINT (PATCH)
@router.patch("/api/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, payload: StatusUpdateModel):
    async with appointment_lock:
        db = load_db()
        found = False
        for a in db:
            if a.get("id") == appointment_id:
                a["status"] = payload.status
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail="Qabul topilmadi")
        save_db(db)
    return {"status": "success", "appointmentId": appointment_id, "newStatus": payload.status}

# 2. CONCURRENCY & DOUBLE-BOOKING PREVENTION
@router.post("/api/appointments")
async def create_appointment(appt: AppointmentModel):
    async with appointment_lock:
        db = load_db()

        # Auto-resolve tenantId from clinic if not explicitly set
        if not getattr(appt, "tenantId", None) or appt.tenantId == "dentamed":
            clinic_info = get_clinic_by_id(appt.clinicId)
            if clinic_info and clinic_info.get("tenantId"):
                appt.tenantId = clinic_info.get("tenantId")

        # 1. Check duplicate appointment ID
        if any(a.get("id") == appt.id for a in db):
            return {"status": "already_exists", "appointment": appt}

        doc_id = appt.doctor.get("id")
        schedule = get_doctor_schedule(doc_id)

        # 1.1 SHIFOKOR TA'TILINI TEKSHIRISH
        for leave in schedule.get("leaves", []):
            if leave.get("date") == appt.date:
                reason = leave.get("reason", "Ta'tilda")
                raise HTTPException(
                    status_code=409,
                    detail=f"Shifokor ushbu sanada ({appt.date}) ta'tilda ({reason}). Iltimos, boshqa sanani tanlang."
                )

        # 1.2 TUSHLIK TANAFFUSINI TEKSHIRISH
        lunch = schedule.get("lunchBreak", {"start": "13:00", "end": "14:00"})
        l_start = lunch.get("start", "13:00")
        l_end = lunch.get("end", "14:00")
        if l_start <= appt.time < l_end:
            raise HTTPException(
                status_code=409,
                detail=f"Tanlangan vaqt ({appt.time}) shifokorning tushlik tanaffusiga ({l_start} - {l_end}) to'g'ri keladi. Iltimos, boshqa vaqtni tanlang."
            )

        # 1.3 ANTI-SPAM & FLOOD PROTECTION: ONE ACTIVE APPOINTMENT PER PATIENT (Phone & Telegram ID)
        # Bolalar o'ynab yoki trollar takror-takror qabullarni to'ldirib tashlamasligi uchun (Klinika/Tenant doirasida)
        clean_phone = "".join(c for c in (appt.phone or "") if c.isdigit())
        user_tg_id = getattr(appt, "telegramUserId", None)
        target_tenant = getattr(appt, "tenantId", "dentamed") or "dentamed"
        is_family_booking = bool(getattr(appt, "familyMemberName", None) and str(appt.familyMemberName).strip())

        if not is_family_booking:
            for existing in db:
                if existing.get("status") in ["cancelled", "completed"]:
                    continue

                existing_tenant = existing.get("tenantId", "dentamed") or "dentamed"
                if existing_tenant != target_tenant:
                    continue

                existing_phone = "".join(c for c in (existing.get("phone") or "") if c.isdigit())
                existing_tg_id = existing.get("telegramUserId")

                is_same_phone = bool(clean_phone and len(clean_phone) >= 9 and existing_phone and clean_phone[-9:] == existing_phone[-9:])
                is_same_tg = bool(user_tg_id and existing_tg_id and user_tg_id == existing_tg_id)

                if is_same_phone or is_same_tg:
                    existing_time = existing.get("time", "")
                    existing_date = existing.get("date", "")
                    existing_pin = existing.get("pinCode", "")
                    raise HTTPException(
                        status_code=400,
                        detail=f"Hurmatli bemor, sizda allaqachon faol qabulingiz mavjud ({existing_date} {existing_time}, PIN: {existing_pin}). Qabullarni to'ldirib tashlamaslik uchun yangi qabulga yozilishdan oldin avvalgisini yakunlang yoki bekor qiling."
                    )

        # 2. DOUBLE-BOOKING CHECK:
        # Same doctor, same date, same time across ANY clinic, and status != 'cancelled'
        for existing in db:
            if existing.get("status") == "cancelled":
                continue
            existing_doc_id = existing.get("doctor", {}).get("id")

            if (
                existing_doc_id == doc_id
                and existing.get("date") == appt.date
                and existing.get("time") == appt.time
            ):
                existing_clinic = existing.get("clinicId", "dentamed-nukus")
                new_clinic = appt.clinicId or "dentamed-nukus"
                if existing_clinic == new_clinic:
                    detail_msg = "Ushbu vaqt allaqachon boshqa bemor tomonidan band qilingan. Iltimos, boshqa vaqtni tanlang."
                else:
                    detail_msg = f"Shifokor ushbu vaqtda boshqa filialda ({existing_clinic}) qabulda bo'ladi. Iltimos, boshqa vaqtni tanlang."
                raise HTTPException(status_code=409, detail=detail_msg)

        appt_dict = appt.model_dump() if hasattr(appt, "model_dump") else appt.dict()
        db.insert(0, appt_dict)
        save_db(db)

        # Record debt in DEBTS_FILE if there is an outstanding debt balance
        if getattr(appt, "debtAmount", 0) and appt.debtAmount > 0:
            debts = load_json_file(DEBTS_FILE)
            debt_record = {
                "id": f"DEBT-{appt.id}",
                "appointmentId": appt.id,
                "pinCode": appt.pinCode,
                "patientName": appt.patientName,
                "phone": appt.phone,
                "clinicId": appt.clinicId,
                "tenantId": appt.tenantId or "dentamed",
                "doctorName": appt.doctor.get("name", "Shifokor"),
                "serviceName": appt.service.get("name", "Muolaja"),
                "totalAmount": appt.totalAmount or ((appt.paidAmount or 0) + appt.debtAmount),
                "paidAmount": appt.paidAmount or 0,
                "debtAmount": appt.debtAmount,
                "paymentStatus": "partial" if (appt.paidAmount or 0) > 0 else "unpaid",
                "createdAt": datetime.now(TASHKENT_TZ).isoformat(),
                "history": [
                    {
                        "amount": appt.paidAmount or 0,
                        "date": datetime.now(TASHKENT_TZ).isoformat(),
                        "method": appt.paymentMethod or "cash",
                        "notes": "Qabul chog'ida qisman to'langan"
                    }
                ] if (appt.paidAmount or 0) > 0 else []
            }
            debts.insert(0, debt_record)
            save_json_file(DEBTS_FILE, debts)

    # Notifications outside lock to keep critical section fast
    await server.notify_patient(appt)
    await server.notify_admin_group(appt)

    return {
        "status": "success",
        "message": "Qabul muvaffaqiyatli saqlandi va Telegramga xabar yuborildi",
        "appointment": appt
    }

# 3. AUTOMATED REMINDERS TRIGGER ENDPOINT
