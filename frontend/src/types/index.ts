export type TenantId = 'dentamed' | 'grandmed' | string;
export type ClinicId = string;

export interface Tenant {
  id: TenantId;
  name: string;
  tagline: {
    uz: string;
    ru: string;
  };
  logo?: string;
  badge: string;
  defaultBranchId: ClinicId;
}

export interface Clinic {
  id: ClinicId;
  tenantId?: TenantId;
  name: string;
  branchName: {
    uz: string;
    ru: string;
  };
  city?: {
    uz: string;
    ru: string;
  };
  address: {
    uz: string;
    ru: string;
  };
  landmark?: {
    uz: string;
    ru: string;
  };
  phone: string;
  workingHours: {
    uz: string;
    ru: string;
  };
  badge: string;
  isMain?: boolean;
  staffPin?: string;
  managerName?: string;
}

export type StaffRole = 'reception' | 'clinic_director' | 'super_admin';

export interface StaffSession {
  role: StaffRole;
  tenantId: TenantId | 'all';
  clinicId?: ClinicId;
  staffName: string;
  titleUz: string;
  titleRu: string;
  isDirector: boolean;
  allowedClinicIds: ClinicId[];
}

export type Language = 'uz' | 'ru';

export type Department = 'stomatology' | 'lor';

export interface Doctor {
  id: number;
  tenantId?: TenantId;
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
  clinicId?: ClinicId;
  clinicIds?: ClinicId[];
}

export interface Service {
  id: number;
  tenantId?: TenantId;
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
  paidAmount?: number;
  debtAmount?: number;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: string;
  familyMemberName?: string;
  department?: Department;
  clinicId?: ClinicId;
  telegramUserId?: number;
  telegramUsername?: string;
}

export interface ShiftExpense {
  id: string;
  clinicId: string;
  tenantId: string;
  category: string;
  amount: number;
  recipient: string;
  comment?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  clinicId: string;
  tenantId: string;
  cashierName: string;
  startingCash: number;
  openedAt: string;
  status: 'open' | 'closed';
  notes?: string;
  closedAt?: string;
  actualCash?: number;
  expectedCash?: number;
  difference?: number;
  totalRevenue?: number;
  cashRevenue?: number;
  cardRevenue?: number;
  onlineRevenue?: number;
  totalExpense?: number;
  appointmentsCount?: number;
}

export interface DebtPaymentHistory {
  amount: number;
  date: string;
  method: string;
  notes?: string;
}

export interface DebtRecord {
  id: string;
  appointmentId: string;
  pinCode: string;
  patientName: string;
  phone: string;
  clinicId: string;
  tenantId: string;
  doctorName: string;
  serviceName: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  createdAt: string;
  history: DebtPaymentHistory[];
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
  diagnosis?: string;
  medications?: any[];
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
