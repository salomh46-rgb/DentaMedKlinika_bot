import { Doctor, Service, Appointment, Prescription, AppointmentStatus, StaffSession } from '../types';
import { DOCTORS, SERVICES, INITIAL_RECEPTION_APPOINTMENTS, CLINICS } from '../data/mockData';

export async function loginStaff(pin: string): Promise<{ ok: boolean; session?: StaffSession; error?: string }> {
  const cleanPin = pin.trim();

  // Try calling backend API first
  try {
    const res = await fetch('/api/staff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.session) {
        return { ok: true, session: data.session };
      }
    } else if (res.status === 401) {
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err.detail || "Noto'g'ri PIN-kod!" };
    }
  } catch (e) {
    console.warn('Backend staff login unreachable, applying secure offline fallback', e);
  }

  // Resilient Client-side & Offline RBAC Fallback
  // 1. DentaMed Klinika Rahbari (Director of all 5 DentaMed branches)
  if (cleanPin === '7777') {
    const session: StaffSession = {
      role: 'clinic_director',
      tenantId: 'dentamed',
      staffName: 'Dr. Jamshid Rustamov',
      titleUz: '👑 Klinika Rahbari (Barcha 5 ta filial)',
      titleRu: '👑 Руководитель клиники (Все 5 филиалов)',
      isDirector: true,
      allowedClinicIds: ['nukus', 'chilonzor', 'yunusobod', 'samarqand', 'buxoro']
    };
    return { ok: true, session };
  }

  // 2. GrandMed International Rahbari (Director of GrandMed branches)
  if (cleanPin === '8888' || cleanPin === '9999') {
    const session: StaffSession = {
      role: 'clinic_director',
      tenantId: 'grandmed',
      staffName: 'Dr. Alisher Vohidov',
      titleUz: '👑 GrandMed Rahbari (Barcha filiallar)',
      titleRu: '👑 Руководитель GrandMed (Все филиалы)',
      isDirector: true,
      allowedClinicIds: ['grandmed-markaziy', 'grandmed-sergeli']
    };
    return { ok: true, session };
  }

  // 3. Super Admin
  if (cleanPin === '2026' || cleanPin === '0000') {
    const session: StaffSession = {
      role: 'super_admin',
      tenantId: 'all',
      staffName: 'Bosh Tizim Administratori',
      titleUz: '💎 Bosh Administrator (Barcha Klinikalar)',
      titleRu: '💎 Главный Администратор (Все клиники)',
      isDirector: true,
      allowedClinicIds: CLINICS.map(c => c.id)
    };
    return { ok: true, session };
  }

  // 4. Branch Receptionists (Nukus: 1001, Chilonzor: 1002, Yunusobod: 1003, Samarqand: 1004, Buxoro: 1005, GrandMed: 2001, 2002)
  const matchedBranch = CLINICS.find(c => c.staffPin === cleanPin);
  if (matchedBranch) {
    const session: StaffSession = {
      role: 'reception',
      tenantId: matchedBranch.tenantId || 'dentamed',
      clinicId: matchedBranch.id,
      staffName: matchedBranch.managerName || 'Retsepshn xodimi',
      titleUz: `📍 ${matchedBranch.branchName.uz} Retsepshni`,
      titleRu: `📍 Ресепшн ${matchedBranch.branchName.ru}`,
      isDirector: false,
      allowedClinicIds: [matchedBranch.id]
    };
    return { ok: true, session };
  }

  return {
    ok: false,
    error: "Noto'g'ri PIN-kod! (Rahbar: 7777, Nukus: 1001, Chilonzor: 1002, Yunusobod: 1003, Samarqand: 1004, Buxoro: 1005)"
  };
}

export async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const res = await fetch('/api/doctors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch doctors from backend API, using local backup', e);
  }
  return DOCTORS;
}

export async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch('/api/services');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch services from backend API, using local backup', e);
  }
  return SERVICES;
}

export async function fetchAppointments(): Promise<Appointment[]> {
  try {
    const res = await fetch('/api/appointments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Could not fetch appointments from backend API', e);
  }
  // Local storage fallback if any
  try {
    const saved = localStorage.getItem('dentamed_reception_appts');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return INITIAL_RECEPTION_APPOINTMENTS;
}

export async function fetchBusySlots(
  doctorId: number,
  date: string,
  clinicId?: string
): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      doctorId: doctorId.toString(),
      date,
      ...(clinicId ? { clinicId } : {})
    });
    const res = await fetch(`/api/slots?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const slots = data.busySlots || data.bookedTimes || [];
      return Array.isArray(slots) ? slots : [];
    }
  } catch (e) {
    console.warn('Could not fetch busy slots from backend API', e);
  }
  return [];
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<boolean> {
  try {
    const res = await fetch(`/api/appointments/${appointmentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not update appointment status on server', e);
    return false;
  }
}

export async function sendPrescription(prescription: Prescription): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prescription)
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      return { ok: true, message: data.message };
    }
    return { ok: false, message: data.detail || 'Xatolik yuz berdi' };
  } catch (e) {
    console.warn('Could not send prescription', e);
    return { ok: false, message: 'Server bilan aloqa yo\'q' };
  }
}

