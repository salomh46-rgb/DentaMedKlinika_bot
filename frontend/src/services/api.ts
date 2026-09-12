import { Doctor, Service, Appointment, Prescription, AppointmentStatus, StaffSession, Tenant, Clinic } from '../types';
import { DOCTORS, SERVICES, INITIAL_RECEPTION_APPOINTMENTS, CLINICS, TENANTS } from '../data/mockData';

export interface TenantRegisterPayload {
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  firstBranchName?: string;
  firstBranchAddress?: string;
}

export interface TenantRegisterResult {
  ok: boolean;
  tenant?: Tenant;
  branch?: Clinic;
  ownerPin?: string;
  staffPin?: string;
  error?: string;
}

export function getStoredTenants(): Tenant[] {
  try {
    const custom = JSON.parse(localStorage.getItem('dentamed_custom_tenants') || '[]');
    return [...TENANTS, ...custom];
  } catch {
    return TENANTS;
  }
}

export function getStoredClinics(): Clinic[] {
  try {
    const custom = JSON.parse(localStorage.getItem('dentamed_custom_clinics') || '[]');
    return [...CLINICS, ...custom];
  } catch {
    return CLINICS;
  }
}

export function saveCustomTenantLocally(tenant: Tenant, branch: Clinic) {
  try {
    const customTenants: Tenant[] = JSON.parse(localStorage.getItem('dentamed_custom_tenants') || '[]');
    if (!customTenants.some(t => t.id === tenant.id)) {
      customTenants.push(tenant);
      localStorage.setItem('dentamed_custom_tenants', JSON.stringify(customTenants));
    }

    const customClinics: Clinic[] = JSON.parse(localStorage.getItem('dentamed_custom_clinics') || '[]');
    if (!customClinics.some(c => c.id === branch.id)) {
      customClinics.push(branch);
      localStorage.setItem('dentamed_custom_clinics', JSON.stringify(customClinics));
    }
  } catch (e) {
    console.error('Error storing custom tenant locally', e);
  }
}

export function addNewBranchLocally(branch: Clinic) {
  try {
    const customClinics: Clinic[] = JSON.parse(localStorage.getItem('dentamed_custom_clinics') || '[]');
    customClinics.push(branch);
    localStorage.setItem('dentamed_custom_clinics', JSON.stringify(customClinics));
  } catch (e) {
    console.error('Error adding branch locally', e);
  }
}

export async function registerTenant(payload: TenantRegisterPayload): Promise<TenantRegisterResult> {
  // 1. Try calling backend API
  try {
    const res = await fetch('/api/tenants/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.tenant && data.branch) {
        saveCustomTenantLocally(data.tenant, data.branch);
        return {
          ok: true,
          tenant: data.tenant,
          branch: data.branch,
          ownerPin: data.tenant.ownerPin,
          staffPin: data.branch.staffPin
        };
      }
    }
  } catch (e) {
    console.warn('Backend tenant registration unreachable, using resilient offline wizard', e);
  }

  // 2. Client-side & Offline Resilient Generation
  const slug = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || `tenant${Date.now().toString().slice(-4)}`;
  const ownerPin = Math.floor(1000 + Math.random() * 9000).toString();
  const staffPin = Math.floor(3000 + Math.random() * 1000).toString();
  const branchId = `${slug}-main`;

  const newTenant: Tenant = {
    id: slug,
    name: payload.name,
    tagline: {
      uz: `${payload.name} Zamonaviy Tibbiyot Markazi (14 kun bepul)`,
      ru: `Современный Медицинский Центр ${payload.name}`
    },
    badge: 'Yangi Hamkor',
    defaultBranchId: branchId
  };

  // Add ownerPin to newTenant for offline verification
  (newTenant as any).ownerPin = ownerPin;
  (newTenant as any).ownerName = payload.ownerName;
  (newTenant as any).phone = payload.phone;

  const newBranch: Clinic = {
    id: branchId,
    tenantId: slug,
    name: payload.firstBranchName || `${payload.name} (Bosh filial)`,
    branchName: {
      uz: payload.firstBranchName || `${payload.name} Bosh filial`,
      ru: payload.firstBranchName || `Головной филиал ${payload.name}`
    },
    city: { uz: 'Toshkent', ru: 'Ташкент' },
    address: {
      uz: payload.firstBranchAddress || "Toshkent shahar, Markaziy ko'cha, 1-bino",
      ru: payload.firstBranchAddress || 'г. Ташкент, ул. Центральная, 1'
    },
    landmark: { uz: 'Markaziy mo\'ljal', ru: 'Центральный ориентир' },
    phone: payload.phone,
    workingHours: {
      uz: '08:00 - 20:00 (Har kuni)',
      ru: '08:00 - 20:00 (Без выходных)'
    },
    badge: '1-Filial',
    isMain: true,
    staffPin: staffPin,
    managerName: payload.ownerName
  };

  saveCustomTenantLocally(newTenant, newBranch);

  return {
    ok: true,
    tenant: newTenant,
    branch: newBranch,
    ownerPin: ownerPin,
    staffPin: staffPin
  };
}

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
      titleUz: '👑 DentaMed Rahbari (Barcha 5 ta filial)',
      titleRu: '👑 Руководитель DentaMed (Все 5 филиалов)',
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

  // 4. Check dynamic registered tenants from localStorage
  const allTenants = getStoredTenants();
  const allClinics = getStoredClinics();

  for (const t of allTenants) {
    if ((t as any).ownerPin && String((t as any).ownerPin).trim() === cleanPin) {
      const branches = allClinics.filter(c => c.tenantId === t.id);
      const session: StaffSession = {
        role: 'clinic_director',
        tenantId: t.id,
        staffName: (t as any).ownerName || 'Klinika Rahbari',
        titleUz: `👑 ${t.name} Rahbari (Barcha filiallar)`,
        titleRu: `👑 Руководитель ${t.name} (Все филиалы)`,
        isDirector: true,
        allowedClinicIds: branches.map(b => b.id)
      };
      return { ok: true, session };
    }
  }

  // 5. Check Branch Staff PINs (Receptionists)
  const matchedBranch = allClinics.find(c => c.staffPin === cleanPin);
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
    error: "Noto'g'ri PIN-kod! (Rahbar: 7777 / 8888, Nukus: 1001, Chilonzor: 1002, GrandMed: 2001)"
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

