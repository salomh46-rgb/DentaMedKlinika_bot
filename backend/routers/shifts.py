from fastapi import APIRouter, HTTPException, Request, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone, timedelta
import time
import server
from server import *

router = APIRouter(tags=["Shifts & Cashier & Debts"])

@router.get("/api/shifts/current")
def get_current_shift(clinicId: str = "dentamed-nukus", tenantId: str = "dentamed"):
    shifts = load_json_file(SHIFTS_FILE)
    current = next((s for s in shifts if s.get("clinicId") == clinicId and s.get("tenantId") == tenantId and s.get("status") == "open"), None)
    if not current:
        return {"hasActiveShift": False, "shift": None}
    
    # Calculate live revenue and expenses during this shift
    db = load_db()
    expenses = load_json_file(EXPENSES_FILE)
    
    opened_at = current.get("openedAt", "")
    shift_appts = [
        a for a in db 
        if a.get("clinicId") == clinicId and a.get("tenantId") == tenantId 
        and a.get("status") != "cancelled" 
        and a.get("createdAt", "") >= opened_at
    ]
    shift_expenses = [
        e for e in expenses
        if e.get("clinicId") == clinicId and e.get("tenantId") == tenantId
        and e.get("createdAt", "") >= opened_at
    ]

    total_revenue = sum(a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0) for a in shift_appts)
    cash_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") == "cash"
    )
    card_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["card", "terminal"]
    )
    online_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["click", "payme"]
    )
    total_expense = sum(e.get("amount", 0) for e in shift_expenses)
    starting_cash = current.get("startingCash", 0)
    expected_cash = starting_cash + cash_revenue - total_expense

    return {
        "hasActiveShift": True,
        "shift": current,
        "liveStats": {
            "appointmentsCount": len(shift_appts),
            "totalRevenue": total_revenue,
            "cashRevenue": cash_revenue,
            "cardRevenue": card_revenue,
            "onlineRevenue": online_revenue,
            "totalExpense": total_expense,
            "startingCash": starting_cash,
            "expectedCash": expected_cash,
            "expenses": shift_expenses
        }
    }

@router.post("/api/shifts/open")
def open_shift(payload: ShiftOpenModel):
    shifts = load_json_file(SHIFTS_FILE)
    existing = next((s for s in shifts if s.get("clinicId") == payload.clinicId and s.get("tenantId") == payload.tenantId and s.get("status") == "open"), None)
    if existing:
        return {"status": "already_open", "shift": existing}

    shift_id = f"SHIFT-{int(datetime.now().timestamp())}"
    new_shift = {
        "id": shift_id,
        "clinicId": payload.clinicId,
        "tenantId": payload.tenantId,
        "cashierName": payload.cashierName,
        "startingCash": payload.startingCash,
        "openedAt": datetime.now(TASHKENT_TZ).isoformat(),
        "status": "open",
        "notes": payload.notes or ""
    }
    shifts.insert(0, new_shift)
    save_json_file(SHIFTS_FILE, shifts)
    return {"status": "success", "shift": new_shift}

@router.post("/api/shifts/expense")
def add_shift_expense(payload: ShiftExpenseModel):
    expenses = load_json_file(EXPENSES_FILE)
    expense_id = f"EXP-{int(datetime.now().timestamp())}"
    new_expense = {
        "id": expense_id,
        "clinicId": payload.clinicId,
        "tenantId": payload.tenantId,
        "category": payload.category,
        "amount": payload.amount,
        "recipient": payload.recipient,
        "comment": payload.comment or "",
        "createdAt": datetime.now(TASHKENT_TZ).isoformat()
    }
    expenses.insert(0, new_expense)
    save_json_file(EXPENSES_FILE, expenses)
    return {"status": "success", "expense": new_expense}

@router.post("/api/shifts/close")
def close_shift(payload: ShiftCloseModel):
    shifts = load_json_file(SHIFTS_FILE)
    idx = next((i for i, s in enumerate(shifts) if s.get("clinicId") == payload.clinicId and s.get("tenantId") == payload.tenantId and s.get("status") == "open"), None)
    if idx is None:
        raise HTTPException(status_code=400, detail="Hozirda yopish uchun faol smena mavjud emas")

    current = shifts[idx]
    opened_at = current.get("openedAt", "")
    closed_at = datetime.now(TASHKENT_TZ).isoformat()

    db = load_db()
    expenses = load_json_file(EXPENSES_FILE)
    shift_appts = [
        a for a in db 
        if a.get("clinicId") == payload.clinicId and a.get("tenantId") == payload.tenantId 
        and a.get("status") != "cancelled" 
        and a.get("createdAt", "") >= opened_at
    ]
    shift_expenses = [
        e for e in expenses
        if e.get("clinicId") == payload.clinicId and e.get("tenantId") == payload.tenantId
        and e.get("createdAt", "") >= opened_at
    ]

    total_revenue = sum(a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0) for a in shift_appts)
    cash_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") == "cash"
    )
    card_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["card", "terminal"]
    )
    online_revenue = sum(
        (a.get("paidAmount") if a.get("paidAmount") is not None else (a.get("totalAmount") or a.get("service", {}).get("price") or 0))
        for a in shift_appts if a.get("paymentMethod") in ["click", "payme"]
    )
    total_expense = sum(e.get("amount", 0) for e in shift_expenses)
    starting_cash = current.get("startingCash", 0)
    expected_cash = starting_cash + cash_revenue - total_expense
    actual_cash = payload.actualCash
    difference = actual_cash - expected_cash # 0 = exact match, positive = surplus, negative = deficit

    current.update({
        "status": "closed",
        "closedAt": closed_at,
        "actualCash": actual_cash,
        "expectedCash": expected_cash,
        "difference": difference,
        "totalRevenue": total_revenue,
        "cashRevenue": cash_revenue,
        "cardRevenue": card_revenue,
        "onlineRevenue": online_revenue,
        "totalExpense": total_expense,
        "appointmentsCount": len(shift_appts),
        "notes": payload.notes or current.get("notes", "")
    })
    shifts[idx] = current
    save_json_file(SHIFTS_FILE, shifts)

    return {
        "status": "success",
        "message": "Smena muvaffaqiyatli yopildi va Z-Hisobot shakllantirildi",
        "shift": current
    }

# 6. NASIYA (DEBTS LEDGER) APIS
@router.get("/api/debts")
def list_debts(clinicId: Optional[str] = None, tenantId: Optional[str] = None):
    debts = load_json_file(DEBTS_FILE)
    result = debts
    if tenantId:
        result = [d for d in result if d.get("tenantId") == tenantId]
    if clinicId:
        result = [d for d in result if d.get("clinicId") == clinicId]
    return result

@router.post("/api/debts/{appointment_id}/pay")
def pay_debt(appointment_id: str, payload: DebtPaymentModel):
    debts = load_json_file(DEBTS_FILE)
    idx = next((i for i, d in enumerate(debts) if d.get("appointmentId") == appointment_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Nasiya qaydi topilmadi")

    record = debts[idx]
    current_debt = record.get("debtAmount", 0)
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="To'lov summasi musbat bo'lishi kerak")

    actual_pay = min(payload.amount, current_debt)
    record["paidAmount"] = (record.get("paidAmount") or 0) + actual_pay
    record["debtAmount"] = max(0, current_debt - actual_pay)
    record["paymentStatus"] = "paid" if record["debtAmount"] == 0 else "partial"

    if "history" not in record:
        record["history"] = []
    record["history"].append({
        "amount": actual_pay,
        "date": datetime.now(TASHKENT_TZ).isoformat(),
        "method": payload.paymentMethod or "cash",
        "notes": payload.notes or "Nasiya so'ndirish"
    })
    debts[idx] = record
    save_json_file(DEBTS_FILE, debts)

    # Sync with appointment in db
    db = load_db()
    for appt in db:
        if appt.get("id") == appointment_id:
            appt["paidAmount"] = record["paidAmount"]
            appt["debtAmount"] = record["debtAmount"]
            appt["paymentStatus"] = record["paymentStatus"]
            save_db(db)
            break

    return {
        "status": "success",
        "message": f"{actual_pay:,} so'm to'lov qabul qilindi. Qoldiq nasiya: {record['debtAmount']:,} so'm",
        "debt": record
    }

class SmsSendModel(BaseModel):
    phone: str
    message: str

SMS_RATE_LIMIT = {}

@router.post("/api/sms/send")
async def send_sms_api(payload: SmsSendModel, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now_ts = time.time()
    recent = [t for t in SMS_RATE_LIMIT.get(client_ip, []) if now_ts - t < 60]
    if len(recent) >= 5:
        raise HTTPException(status_code=429, detail="Juda ko'p SMS so'rovi yuborildi. Iltimos, 1 daqiqa kuting.")
    recent.append(now_ts)
    SMS_RATE_LIMIT[client_ip] = recent

    clean_phone = "".join(c for c in payload.phone if c.isdigit())
    if not (len(clean_phone) >= 9 and len(clean_phone) <= 12):
        raise HTTPException(status_code=400, detail="Telefon raqami noto'g'ri ko'rsatilgan.")

    if len(payload.message.strip()) > 300:
        raise HTTPException(status_code=400, detail="Xabar matni juda uzun (maksimal 300 belgi).")

    try:
        from sms_service import send_sms_notification
    except ImportError:
        from backend.sms_service import send_sms_notification
    success = await send_sms_notification(payload.phone, payload.message)
    return {"status": "success" if success else "failed", "phone": payload.phone}

@router.get("/api/db/health")
def db_health():
    try:
        from db import db
    except ImportError:
        from backend.db import db
    return {
        "status": "healthy",
        "mode": "postgresql" if db.is_postgres else "json_file",
        "tenantsCount": len(db.get_tenants()),
        "clinicsCount": len(db.get_clinics()),
        "doctorsCount": len(db.get_doctors())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)