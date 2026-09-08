-- ==========================================================
-- DentaMed: LOR & Stomatologiya Markazi Ekotizimi
-- Ma'lumotlar Bazasi Sxemasi (PostgreSQL / SQLite moslashuvchan)
-- ==========================================================

-- 1. Foydalanuvchilar (Bemorlar va Tizim Adminlari)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(25) NOT NULL,
    birth_date DATE,
    gender VARCHAR(10),
    language VARCHAR(5) DEFAULT 'uz', -- 'uz' yoki 'ru'
    role VARCHAR(20) DEFAULT 'patient', -- 'patient', 'doctor', 'reception', 'admin'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shifokorlar (Stomatologlar va LOR Mutaxassislari)
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    specialty VARCHAR(100) NOT NULL, -- masalan: 'Ortodont', 'Implantolog', 'LOR-jarroh'
    department VARCHAR(50) NOT NULL, -- 'stomatology' yoki 'lor'
    experience_years INT DEFAULT 5,
    rating NUMERIC(2, 1) DEFAULT 4.9,
    photo_url TEXT,
    bio TEXT,
    work_start_time TIME DEFAULT '09:00:00',
    work_end_time TIME DEFAULT '18:00:00',
    slot_duration_minutes INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Xizmatlar Katalogi (Services)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    department VARCHAR(50) NOT NULL, -- 'stomatology' yoki 'lor'
    category VARCHAR(100) NOT NULL, -- 'Terapevtik', 'Jarrohlik', 'Ortodontiya', 'Endoskopiya'
    name_uz VARCHAR(200) NOT NULL,
    name_ru VARCHAR(200) NOT NULL,
    description_uz TEXT,
    description_ru TEXT,
    price_uzs NUMERIC(12, 2) NOT NULL,
    duration_minutes INT DEFAULT 30,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Qabullar / Navbatlar (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'
    patient_complaint TEXT,
    cancellation_reason TEXT,
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_2h_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appointment_date, appointment_time)
);

-- 5. Interaktiv Tish Xaritasi (Dental Charting - FDI 32 Teeth)
CREATE TABLE IF NOT EXISTS dental_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL, -- 11 dan 48 gacha bo'lgan tishlar
    condition VARCHAR(50) NOT NULL, -- 'healthy', 'caries', 'filling', 'crown', 'implant', 'missing'
    diagnosis TEXT,
    treatment_done TEXT,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
    cost_uzs NUMERIC(12, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. LOR Ko'rik Tarixi (LOR Examinations)
CREATE TABLE IF NOT EXISTS lor_examinations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE SET NULL,
    organ VARCHAR(50) NOT NULL, -- 'ear', 'nose', 'throat'
    endoscopy_findings TEXT,
    diagnosis TEXT NOT NULL,
    prescriptions TEXT,
    recommended_procedure TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Kross-Marketing va Aksiyalar (Cross Promotions)
CREATE TABLE IF NOT EXISTS cross_promotions (
    id SERIAL PRIMARY KEY,
    title_uz VARCHAR(200) NOT NULL,
    title_ru VARCHAR(200) NOT NULL,
    description_uz TEXT,
    description_ru TEXT,
    discount_percentage INT NOT NULL,
    source_department VARCHAR(50) NOT NULL, -- 'stomatology'
    target_department VARCHAR(50) NOT NULL, -- 'lor'
    promo_code VARCHAR(50) UNIQUE NOT NULL,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Eslatmalar va Bildirishnomalar Jurnali (Audit & Reminders Log)
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL, -- 'telegram', 'sms'
    notification_type VARCHAR(50) NOT NULL, -- '24h_reminder', '2h_reminder', '6m_reactivation', 'cross_promo'
    message_content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indekslar (Tezkor qidiruv va unumdorlik uchun)
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_dental_user ON dental_records(user_id);
CREATE INDEX IF NOT EXISTS idx_lor_user ON lor_examinations(user_id);
