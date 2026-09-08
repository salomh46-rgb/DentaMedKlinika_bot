import { Doctor, Service } from '../types';
import { DOCTORS, SERVICES } from '../data/mockData';

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
