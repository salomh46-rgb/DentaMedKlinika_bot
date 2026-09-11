export type ClinicId = 'nukus' | 'chilonzor';

export interface Clinic {
  id: ClinicId;
  name: string;
  branchName: {
    uz: string;
    ru: string;
  };
  address: {
    uz: string;
    ru: string;
  };
  phone: string;
  workingHours: {
    uz: string;
    ru: string;
  };
  badge: string;
}

export type Language = 'uz' | 'ru';

export type Department = 'stomatology' | 'lor';

export interface Doctor {
  id: number;
  name: string;
  specialty: {
    uz: string;
    ru: string;
  };
  department: Department;
  experience: number;
  rating: number;
  reviewsCount: number;
  photo: string;
  availableDays: string[];
  clinicIds?: ClinicId[];
}

export interface Service {
  id: number;
  department: Department;
  category: {
    uz: string;
    ru: string;
  };
  title: {
    uz: string;
    ru: string;
  };
  desc: {
    uz: string;
    ru: string;
  };
  price: number;
  duration: number; // minutes
  isPopular?: boolean;
  clinicIds?: ClinicId[];
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'waiting' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';

export interface Appointment {
  id: string;
  pinCode: string; // 4-digit reception PIN code (e.g. '8492')
  patientName: string;
  phone: string;
  doctor: Doctor;
  service: Service;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  selectedTeethNumbers?: number[];
  hasPromoUltrasonic?: boolean;
  discountAmount?: number;
  totalAmount?: number;
  clinicId?: ClinicId;
  telegramUserId?: number;
  telegramUsername?: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  pinCode: string;
  patientName: string;
  phone: string;
  doctorName: string;
  clinicId: ClinicId;
  date: string;
  medicines: PrescriptionMedicine[];
  recommendations: string[];
  customNotes?: string;
  createdAt: string;
  telegramUserId?: number;
}


export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar' | 'wisdom';
export type JawQuadrant = 'upper_right' | 'upper_left' | 'lower_right' | 'lower_left';

export interface ToothData {
  number: number;
  label: string;
  type: ToothType;
  name: {
    uz: string;
    ru: string;
  };
  quadrant: JawQuadrant;
  condition: 'healthy' | 'caries' | 'filling' | 'crown' | 'implant' | 'missing';
  treatment?: {
    uz: string;
    ru: string;
  };
  price?: number;
}

export interface BeforeAfterItem {
  id: number;
  title: {
    uz: string;
    ru: string;
  };
  category: {
    uz: string;
    ru: string;
  };
  beforeImg: string;
  afterImg: string;
  description: {
    uz: string;
    ru: string;
  };
}
