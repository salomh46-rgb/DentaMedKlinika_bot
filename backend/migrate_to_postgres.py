import os
import sys
import json
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

DATA_DIR = Path(__file__).resolve().parent / 'data'
SQL_OUT_FILE = DATA_DIR / 'dump_postgres.sql'

def escape_sql(val):
    if val is None:
        return 'NULL'
    if isinstance(val, bool):
        return 'TRUE' if val else 'FALSE'
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, (dict, list)):
        dumped = json.dumps(val, ensure_ascii=False)
        return "'" + dumped.replace("'", "''") + "'::jsonb"
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_postgres_migration():
    print("="*60)
    print("🚀 DentaMed -> PostgreSQL / Supabase 1-Click Migration")
    print("="*60)

    sql_statements = []

    ddl = """-- =========================================================
-- DentaMed & Multi-Tenant Medical CRM - PostgreSQL Schema
-- Compatible with PostgreSQL 14+, Supabase, Neon, AWS RDS
-- =========================================================

CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone VARCHAR(64),
    email VARCHAR(128),
    owner_pin VARCHAR(32),
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinics (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    landmark TEXT,
    phone VARCHAR(64),
    manager_name VARCHAR(255),
    staff_pin VARCHAR(32),
    working_hours VARCHAR(128),
    is_main BOOLEAN DEFAULT FALSE,
    location JSONB DEFAULT '{}'::jsonb,
    map_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id INT PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialty JSONB DEFAULT '{}'::jsonb,
    department VARCHAR(64) DEFAULT 'stomatologiya',
    experience INT DEFAULT 5,
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    photo TEXT,
    available_days JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(64),
    title JSONB NOT NULL,
    price INT NOT NULL DEFAULT 0,
    duration INT DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_schedules (
    doctor_id INT PRIMARY KEY,
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}'::jsonb,
    lunch_break JSONB DEFAULT '{"start": "13:00", "end": "14:00"}'::jsonb,
    slot_duration INT DEFAULT 30,
    leaves JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    clinic_id VARCHAR(64),
    patient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    date VARCHAR(32) NOT NULL,
    time VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    pin_code VARCHAR(16) NOT NULL,
    notes TEXT,
    total_amount INT,
    selected_teeth_numbers JSONB DEFAULT '[]'::jsonb,
    has_promo_ultrasonic BOOLEAN DEFAULT FALSE,
    telegram_user_id BIGINT,
    reminder24h_sent BOOLEAN DEFAULT FALSE,
    reminder2h_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(64) PRIMARY KEY,
    appointment_id VARCHAR(64),
    tenant_id VARCHAR(64),
    clinic_id VARCHAR(64),
    patient_name VARCHAR(255),
    phone VARCHAR(64),
    doctor_name VARCHAR(255),
    diagnosis TEXT,
    medications JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    doctor_notes TEXT,
    next_visit_date VARCHAR(64),
    telegram_user_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    clinic_id VARCHAR(64),
    cashier_name VARCHAR(255),
    opened_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    opening_cash INT DEFAULT 0,
    closing_cash INT DEFAULT 0,
    total_revenue INT DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE,
    z_report_summary JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS debts (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    clinic_id VARCHAR(64),
    appointment_id VARCHAR(64),
    patient_name VARCHAR(255) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    total_debt INT NOT NULL,
    paid_amount INT DEFAULT 0,
    remaining_debt INT NOT NULL,
    due_date VARCHAR(32),
    status VARCHAR(32) DEFAULT 'active',
    payments_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64),
    clinic_id VARCHAR(64),
    shift_id VARCHAR(64),
    category VARCHAR(64),
    amount INT NOT NULL,
    description TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
"""
    sql_statements.append(ddl)

    tables = [
        ('tenants.json', 'tenants', ['id', 'name', 'ownerName', 'phone', 'email', 'ownerPin']),
        ('clinics.json', 'clinics', ['id', 'tenantId', 'name', 'address', 'landmark', 'phone', 'managerName', 'staffPin', 'workingHours', 'isMain', 'location', 'mapUrl']),
        ('doctors.json', 'doctors', ['id', 'tenantId', 'name', 'specialty', 'department', 'experience', 'rating', 'reviewsCount', 'photo', 'availableDays']),
        ('services.json', 'services', ['id', 'tenantId', 'category', 'title', 'price', 'duration']),
        ('doctor_schedules.json', 'doctor_schedules', ['doctorId', 'workingHours', 'lunchBreak', 'slotDuration', 'leaves']),
        ('appointments.json', 'appointments', ['id', 'tenantId', 'clinicId', 'patientName', 'phone', 'date', 'time', 'status', 'pinCode', 'notes', 'totalAmount', 'selectedTeethNumbers', 'hasPromoUltrasonic', 'telegramUserId', 'reminder24hSent', 'reminder2hSent', 'createdAt']),
        ('prescriptions.json', 'prescriptions', ['id', 'appointmentId', 'tenantId', 'clinicId', 'patientName', 'phone', 'doctorName', 'diagnosis', 'medications', 'recommendations', 'doctorNotes', 'nextVisitDate', 'telegramUserId', 'createdAt']),
        ('shifts.json', 'shifts', ['id', 'tenantId', 'clinicId', 'cashierName', 'openedAt', 'closedAt', 'openingCash', 'closingCash', 'totalRevenue', 'isClosed', 'zReportSummary']),
        ('debts.json', 'debts', ['id', 'tenantId', 'clinicId', 'appointmentId', 'patientName', 'phone', 'totalDebt', 'paidAmount', 'remainingDebt', 'dueDate', 'status', 'paymentsHistory', 'createdAt']),
        ('expenses.json', 'expenses', ['id', 'tenantId', 'clinicId', 'shiftId', 'category', 'amount', 'description', 'createdBy', 'createdAt'])
    ]

    total_records = 0
    for filename, table_name, fields in tables:
        fpath = DATA_DIR / filename
        if not fpath.exists():
            continue
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                records = json.load(f)
            if not isinstance(records, list):
                continue
            
            if records:
                sql_statements.append(f'-- Records for {table_name} ({len(records)} items)')
                for r in records:
                    cols = []
                    vals = []
                    for col_camel in fields:
                        col_snake = ''.join(['_' + c.lower() if c.isupper() else c for c in col_camel]).lstrip('_')
                        cols.append(col_snake)
                        vals.append(escape_sql(r.get(col_camel)))
                    
                    cols_str = ', '.join(cols)
                    vals_str = ', '.join(vals)
                    if table_name == 'doctor_schedules':
                        stmt = f'INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str}) ON CONFLICT (doctor_id) DO NOTHING;'
                    else:
                        stmt = f'INSERT INTO {table_name} ({cols_str}) VALUES ({vals_str}) ON CONFLICT (id) DO NOTHING;'
                    sql_statements.append(stmt)
                total_records += len(records)
                print(f"  • {table_name}: {len(records)} ta yozuv SQL ga o'girildi")
        except Exception as e:
            print(f"  ⚠️ {filename} o'qishda xatolik: {e}")

    with open(SQL_OUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))

    print("="*60)
    print(f"✅ Migratsiya fayli tayyorlandi: {SQL_OUT_FILE}")
    print(f"📊 Jami {total_records} ta yozuv PostgreSQL SQL formatiga o'tkazildi.")
    print("💡 Ushbu faylni to'g'ridan-to'g'ri Supabase SQL Editor yoki PostgreSQL psql ga yuklash mumkin!")
    print("="*60)

if __name__ == '__main__':
    generate_postgres_migration()
