import { Doctor, Service, Appointment, Prescription, AppointmentStatus } from '../types';
import { DOCTORS, SERVICES, INITIAL_RECEPTION_APPOINTMENTS } from '../data/mockData';

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

