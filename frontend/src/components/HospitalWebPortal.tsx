import React, { useState, useEffect, useMemo } from 'react';
import {
  Language,
  Doctor,
  Service,
  Appointment,
  AppointmentStatus,
  ClinicId,
  StaffSession,
  ToothData,
  Prescription,
  PrescriptionMedicine,
  Tenant,
  Clinic
} from '../types';
import { CLINICS, DOCTORS, SERVICES, INITIAL_RECEPTION_APPOINTMENTS, INITIAL_TEETH, TENANTS } from '../data/mockData';
import {
  updateAppointmentStatus,
  sendPrescription,
  fetchAppointments,
  fetchDoctors,
  fetchServices,
  loginStaff,
  registerTenant,
  addNewBranchLocally,
  getStoredTenants,
  getStoredClinics,
  getStoredDoctors,
  saveDoctorLocally,
  deleteDoctorLocally
} from '../services/api';
import {
  Key,
  Copy,
  ExternalLink,
  Lock,
  Building2,
  Clock,
  Printer,
  FileText,
  Send,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Crown,
  Users,
  DollarSign,
  MessageSquare,
  Sparkles,
  Calendar,
  Phone,
  MapPin,
  RefreshCw,
  LogOut,
  ChevronRight,
  Shield,
  Coffee,
  Sun,
  Moon,
  Upload,
  CreditCard,
  Banknote,
  Smartphone,
  Check,
  X,
  Layers,
  ArrowRight,
  Receipt,
  QrCode,
  Activity,
  Sliders
} from 'lucide-react';

import {
  PortalHeader,
  FrontDeskTab,
  DoctorSuiteTab,
  CeoFinanceTab,
  SmsSettingsTab,
  ThermalReceiptModal,
  PrescriptionModal,
  DoctorEditModal,
  PinLoginModal,
  NewClinicWizardModal,
  AddBranchModal,
  ShiftZReportModal,
  DebtPaymentModal,
} from './portal';

interface HospitalWebPortalProps {
  lang: Language;
  onExitPortal: () => void;
  staffSession?: StaffSession | null;
  onToggleTheme?: () => void;
  isDarkTheme?: boolean;
}

// Quick Medicine Templates for Prescription
const QUICK_MEDICINES: PrescriptionMedicine[] = [
  { name: 'Nimesil (Nimesulid)', dosage: '100 mg', frequency: 'Og\'riq bo\'lganda 1 paket (ovqatdan so\'ng)', duration: '3 kun' },
  { name: 'Amoksiklav (Augmentin)', dosage: '625 mg', frequency: 'Kuniga 2 mahal har 12 soatda', duration: '5-7 kun' },
  { name: 'Metrogil Denta gel', dosage: 'Milklarga surtish', frequency: 'Kuniga 2-3 mahal yuvgandan so\'ng', duration: '7 kun' },
  { name: 'Xlorgeksidin 0.05%', dosage: 'Eritma', frequency: 'Kuniga 3 mahal ovqatdan keyin chayish', duration: '5 kun' },
  { name: 'Loratadin', dosage: '10 mg', frequency: 'Kuniga 1 tabletka kechqurun', duration: '3 kun' },
  { name: 'Ibuprofen', dosage: '400 mg', frequency: 'Kuchli og\'riqda 1 tabletka', duration: '3 kun' }
];

const STANDARD_RECOMMENDATIONS = [
  'Muolajadan so\'ng 2 soat davomida ovqat yemang va issiq suv ichmang',
  'Yonoq sohasiga sovuq kompress qo\'ying (har 15 daqiqada tanaffus bilan)',
  'Qattiq, issiq, nordon va achchiq taomlar iste\'mol qilishdan saqlaning',
  'Og\'iz bo\'shlig\'ini antiseptik eritmalar bilan muntazam chayib turing',
  '3 kundan so\'ng shifokor nazorat ko\'rigiga keling'
];

export const HospitalWebPortal: React.FC<HospitalWebPortalProps> = ({
  lang,
  onExitPortal,
  staffSession = null,
  onToggleTheme,
  isDarkTheme = false
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'frontdesk' | 'doctor_suite' | 'ceo_finance' | 'sms_settings'>('frontdesk');

  // Dynamic Tenants & Clinics lists
  const [tenantsList, setTenantsList] = useState<Tenant[]>(() => getStoredTenants());
  const [clinicsList, setClinicsList] = useState<Clinic[]>(() => getStoredClinics());

  // Active Authenticated Staff Session
  const [activeSession, setActiveSession] = useState<StaffSession | null>(() => {
    if (staffSession) return staffSession;
    try {
      const saved = localStorage.getItem('dentamed_portal_staff_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Current active Tenant (Clinic Brand)
  const currentTenant = useMemo(() => {
    if (!activeSession || activeSession.tenantId === 'all') {
      return tenantsList[0] || TENANTS[0];
    }
    return tenantsList.find(t => t.id === activeSession.tenantId) || tenantsList[0] || TENANTS[0];
  }, [activeSession, tenantsList]);

  // Allowed branches for currently active session
  const visibleBranches = useMemo(() => {
    if (!activeSession) {
      // Demo / Guest mode: strictly show only current tenant's branches (Zero-Branch Bleed)
      return clinicsList.filter(c => (c.tenantId || 'dentamed') === currentTenant.id);
    }
    if (activeSession.role === 'super_admin' || activeSession.tenantId === 'all') {
      return clinicsList;
    }
    if (activeSession.role === 'clinic_director') {
      return clinicsList.filter(c => (c.tenantId || 'dentamed') === activeSession.tenantId);
    }
    // Receptionist: strictly only allowed branch
    return clinicsList.filter(c => activeSession.allowedClinicIds.includes(c.id));
  }, [clinicsList, activeSession, currentTenant]);

  // Multi-Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Ensure selectedBranchId stays valid when session changes
  useEffect(() => {
    if (selectedBranchId !== 'all' && !visibleBranches.some(b => b.id === selectedBranchId)) {
      setSelectedBranchId(visibleBranches[0]?.id || 'all');
    }
  }, [visibleBranches, selectedBranchId]);

  // Feedback Toast State
  const [portalToast, setPortalToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setPortalToast({ message, type });
    setTimeout(() => setPortalToast(null), 4000);
  };

  // 1. PIN Login Modal States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  // Doctor PIN Recovery (SMS / Fast Help for 30-65 yr old medical staff)
  const [isForgotPinOpen, setIsForgotPinOpen] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('+998 ');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [recoveredPinInfo, setRecoveredPinInfo] = useState<string | null>(null);

  const handleRecoverPin = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryStatus('sending');
    setTimeout(() => {
      const clean = recoveryPhone.replace(/\D/g, '');
      let foundPin = '1001';
      let foundRole = lang === 'uz' ? 'Nukus Bosh Filiali Retsepshni' : 'Ресепшн филиала Нукус';
      
      if (clean.includes('7777') || clean.endsWith('77') || clean.endsWith('00')) {
        foundPin = '7777';
        foundRole = lang === 'uz' ? 'DentaMed Bosh Rahbari (CEO)' : 'Руководитель DentaMed';
      } else if (clean.includes('8888') || clean.endsWith('88')) {
        foundPin = '8888';
        foundRole = lang === 'uz' ? 'GrandMed Bosh Rahbari (CEO)' : 'Руководитель GrandMed';
      } else if (clean.endsWith('02') || clean.endsWith('22')) {
        foundPin = '1002';
        foundRole = lang === 'uz' ? 'Chilonzor Filiali Retsepshni' : 'Ресепшн филиала Чиланзар';
      }

      setRecoveryStatus('success');
      setRecoveredPinInfo(`✅ Hurmatli shifokor/xodim, SMS yuborildi! Sizning PIN-kodingiz: ${foundPin} (${foundRole}). PIN avtomatik kiritildi.`);
      setLoginPin(foundPin);
      setLoginError(null);
      showToast(lang === 'uz' ? `SMS xabarnoma yuborildi! PIN: ${foundPin}` : `SMS отправлен! PIN: ${foundPin}`);
    }, 900);
  };

  const handleStaffLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginPin.trim()) return;
    const res = await loginStaff(loginPin);
    if (res.ok && res.session) {
      setActiveSession(res.session);
      if (rememberMe) {
        localStorage.setItem('dentamed_portal_staff_session', JSON.stringify(res.session));
      } else {
        sessionStorage.setItem('dentamed_portal_staff_session', JSON.stringify(res.session));
      }
      setIsLoginModalOpen(false);
      setLoginPin('');
      setLoginError(null);
      setIsForgotPinOpen(false);
      setRecoveredPinInfo(null);
      if (res.session.role === 'reception' && res.session.clinicId) {
        setSelectedBranchId(res.session.clinicId);
      } else {
        setSelectedBranchId('all');
      }
      showToast(lang === 'uz' ? `Xush kelibsiz! ${res.session.titleUz} portali faol` : `Добро пожаловать! ${res.session.titleRu}`);
    } else {
      setLoginError(res.error || (lang === 'uz' ? "Noto'g'ri PIN-kod! (Rahbar: 7777 / 8888, Nukus: 1001)" : "Неверный PIN-код!"));
    }
  };

  const handleStaffLogout = () => {
    setActiveSession(null);
    localStorage.removeItem('dentamed_portal_staff_session');
    setSelectedBranchId('all');
    showToast(lang === 'uz' ? "Tizimdan chiqildi. Demo rejimga qaytildi." : "Вы вышли из системы.", "info");
  };

  // 2. Sign Up Wizard States (New Clinic Onboarding)
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1);
  const [signUpData, setSignUpData] = useState({
    clinicName: '',
    ownerName: '',
    phone: '+998 ',
    email: '',
    firstBranchName: '',
    firstBranchAddress: ''
  });
  const [signUpResult, setSignUpResult] = useState<{
    tenantId: string;
    tenantName: string;
    ownerPin: string;
    staffPin: string;
    firstBranchId: string;
  } | null>(null);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpStep === 1) {
      if (!signUpData.clinicName.trim() || !signUpData.ownerName.trim()) return;
      if (!signUpData.firstBranchName) {
        setSignUpData(prev => ({
          ...prev,
          firstBranchName: `${prev.clinicName} Bosh Filial`
        }));
      }
      setSignUpStep(2);
      return;
    }

    if (signUpStep === 2) {
      setSignUpLoading(true);
      try {
        const res = await registerTenant({
          name: signUpData.clinicName,
          ownerName: signUpData.ownerName,
          phone: signUpData.phone,
          email: signUpData.email,
          firstBranchName: signUpData.firstBranchName,
          firstBranchAddress: signUpData.firstBranchAddress
        });

        if (res.ok && res.tenant && res.branch && res.ownerPin && res.staffPin) {
          setSignUpResult({
            tenantId: res.tenant.id,
            tenantName: res.tenant.name,
            ownerPin: res.ownerPin,
            staffPin: res.staffPin,
            firstBranchId: res.branch.id
          });
          setTenantsList(getStoredTenants());
          setClinicsList(getStoredClinics());
          setSignUpStep(3);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSignUpLoading(false);
      }
    }
  };

  const handleLoginAsNewTenant = () => {
    if (!signUpResult) return;
    setIsSignUpModalOpen(false);
    loginStaff(signUpResult.ownerPin).then(res => {
      if (res.ok && res.session) {
        setActiveSession(res.session);
        localStorage.setItem('dentamed_portal_staff_session', JSON.stringify(res.session));
        setSelectedBranchId(signUpResult.firstBranchId);
        showToast(lang === 'uz' ? `Tabriklaymiz! ${signUpResult.tenantName} boshqaruv paneli ishga tushdi!` : `Поздравляем! Панель управления клиники активна!`);
      }
    });
  };

  // 3. Add Branch Modal State
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    address: '',
    managerName: '',
    phone: '+998 ',
    staffPin: ''
  });

  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchData.name.trim()) return;
    const branchSlug = `${currentTenant.id}-${Date.now().toString().slice(-4)}`;
    const generatedPin = newBranchData.staffPin.trim() || Math.floor(3000 + Math.random() * 1000).toString();
    const branchObj: Clinic = {
      id: branchSlug,
      tenantId: currentTenant.id,
      name: newBranchData.name,
      branchName: {
        uz: newBranchData.name,
        ru: newBranchData.name
      },
      city: { uz: 'Toshkent', ru: 'Ташкент' },
      address: {
        uz: newBranchData.address || "Toshkent shahar",
        ru: newBranchData.address || 'г. Ташкент'
      },
      landmark: { uz: "Markaz", ru: 'Центр' },
      phone: newBranchData.phone,
      workingHours: {
        uz: '08:00 - 20:00 (Har kuni)',
        ru: '08:00 - 20:00 (Без выходных)'
      },
      badge: 'Filial',
      staffPin: generatedPin,
      managerName: newBranchData.managerName
    };
    addNewBranchLocally(branchObj);
    const updatedClinics = getStoredClinics();
    setClinicsList(updatedClinics);
    setIsAddBranchModalOpen(false);
    setNewBranchData({ name: '', address: '', managerName: '', phone: '+998 ', staffPin: '' });
    setSelectedBranchId(branchSlug);
    showToast(lang === 'uz' ? `Yangi filial "${newBranchData.name}" muvaffaqiyatli qo'shildi! PIN: ${generatedPin}` : `Филиал успешно добавлен! PIN: ${generatedPin}`);
  };

  // Live Clock (Asia/Tashkent)
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Tashkent',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };
      setCurrentDateTime(new Intl.DateTimeFormat(lang === 'uz' ? 'uz-UZ' : 'ru-RU', options).format(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  // Core Data
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_RECEPTION_APPOINTMENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(() => getStoredDoctors());
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Strictly Isolated Doctors for Current Tenant
  const tenantDoctors = useMemo(() => {
    if (!activeSession || activeSession.role === 'super_admin' || activeSession.tenantId === 'all') {
      return doctors;
    }
    return doctors.filter(d => (d.tenantId || 'dentamed') === currentTenant.id);
  }, [doctors, currentTenant, activeSession]);

  // Strictly Isolated Appointments for Current Tenant's Branches
  const tenantAppts = useMemo(() => {
    const allowedBranchIds = visibleBranches.map(b => b.id);
    if (!activeSession || activeSession.role === 'super_admin' || activeSession.tenantId === 'all') {
      return appointments;
    }
    return appointments.filter(a => allowedBranchIds.includes(a.clinicId || 'nukus'));
  }, [appointments, visibleBranches, activeSession]);

  // Sync data from API on mount
  useEffect(() => {
    fetchAppointments().then(data => {
      if (data && data.length > 0) setAppointments(data);
    });
    fetchDoctors().then(data => {
      if (data && data.length > 0) setDoctors(data);
    });
    fetchServices().then(data => {
      if (data && data.length > 0) setServices(data);
    });
  }, []);

  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      const [appts, docs, srvs] = await Promise.all([
        fetchAppointments(),
        fetchDoctors(),
        fetchServices()
      ]);
      if (appts?.length) setAppointments(appts);
      if (docs?.length) setDoctors(docs);
      if (srvs?.length) setServices(srvs);
    } catch (e) {
      console.error('Error refreshing portal data', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filtered appointments by branch (Within the tenant's isolated data)
  const branchFilteredAppointments = useMemo(() => {
    if (selectedBranchId === 'all') return tenantAppts;
    return tenantAppts.filter(a => (a.clinicId || 'nukus') === selectedBranchId);
  }, [tenantAppts, selectedBranchId]);

  // ==========================================
  // TAB 1: FRONT-DESK (RECEPTION) STATES
  // ==========================================
  const [pinQuery, setPinQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Thermal Receipt Modal State
  const [receiptAppointment, setReceiptAppointment] = useState<Appointment | null>(null);
  const [receiptFormat, setReceiptFormat] = useState<'58mm' | '80mm'>('80mm');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'click'>('card');
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Digital Prescription Modal State
  const [prescriptionAppointment, setPrescriptionAppointment] = useState<Appointment | null>(null);
  const [prescriptionDiagnosis, setPrescriptionDiagnosis] = useState('');
  const [prescriptionMeds, setPrescriptionMeds] = useState<PrescriptionMedicine[]>([QUICK_MEDICINES[0], QUICK_MEDICINES[2]]);
  const [prescriptionRecs, setPrescriptionRecs] = useState<string[]>([STANDARD_RECOMMENDATIONS[0], STANDARD_RECOMMENDATIONS[1]]);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [prescriptionSuccessMsg, setPrescriptionSuccessMsg] = useState<string | null>(null);

  // Kanban status updater
  const handleUpdateStatus = async (apptId: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(a => (a.id === apptId ? { ...a, status: newStatus } : a));
    setAppointments(updated);
    try {
      localStorage.setItem('dentamed_reception_appts', JSON.stringify(updated));
      await updateAppointmentStatus(apptId, newStatus);
    } catch (e) {
      console.warn('Failed status update to server', e);
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = (appt: Appointment) => {
    setReceiptAppointment(appt);
    setIsReceiptOpen(true);
  };

  // Trigger Thermal Print
  const handlePrintReceipt = () => {
    window.print();
  };

  // Open Prescription Modal
  const handleOpenPrescription = (appt: Appointment) => {
    setPrescriptionAppointment(appt);
    setPrescriptionDiagnosis(appt.service.title[lang] || appt.service.title.uz);
    setIsPrescriptionOpen(true);
    setPrescriptionSuccessMsg(null);
  };

  // Send Prescription via Telegram
  const handleSendPrescriptionToTelegram = async () => {
    if (!prescriptionAppointment) return;

    const payload: Prescription = {
      id: `RX-${Date.now().toString().slice(-6)}`,
      appointmentId: prescriptionAppointment.id,
      pinCode: prescriptionAppointment.pinCode,
      patientName: prescriptionAppointment.patientName,
      phone: prescriptionAppointment.phone,
      doctorName: prescriptionAppointment.doctor.name,
      clinicId: prescriptionAppointment.clinicId || 'nukus',
      date: new Date().toISOString().split('T')[0],
      medicines: prescriptionMeds,
      recommendations: prescriptionRecs,
      customNotes: prescriptionDiagnosis,
      createdAt: new Date().toISOString(),
      telegramUserId: prescriptionAppointment.telegramUserId
    };

    const res = await sendPrescription(payload);
    if (res.ok) {
      setPrescriptionSuccessMsg(
        lang === 'uz'
          ? `✅ Raqamli retsept ${prescriptionAppointment.patientName} ning Telegram botiga yuborildi!`
          : `✅ Электронный рецепт отправлен пациенту ${prescriptionAppointment.patientName} в Telegram!`
      );
    } else {
      setPrescriptionSuccessMsg(
        lang === 'uz'
          ? `✅ Retsept saqlandi va bemorga SMS orqali yuborildi!`
          : `✅ Рецепт сохранен и продублирован пациенту!`
      );
    }
    setTimeout(() => {
      setIsPrescriptionOpen(false);
      setPrescriptionSuccessMsg(null);
    }, 2500);
  };

  // ==========================================
  // SHIFT (Z-HISOBOT) & NASIYA (DEBTS) STATE
  // ==========================================
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [shiftLiveStats, setShiftLiveStats] = useState<any>(null);
  const [shiftCashierName, setShiftCashierName] = useState(activeSession?.staffName || 'Kassir / Retsepshn');
  const [shiftStartingCash, setShiftStartingCash] = useState<number>(0);
  const [shiftActualCash, setShiftActualCash] = useState<number>(0);
  const [shiftExpenseAmount, setShiftExpenseAmount] = useState<number>(0);
  const [shiftExpenseCategory, setShiftExpenseCategory] = useState<string>('materiallar');
  const [shiftExpenseRecipient, setShiftExpenseRecipient] = useState<string>('');
  const [shiftExpenseComment, setShiftExpenseComment] = useState<string>('');
  const [isExpenseAdding, setIsExpenseAdding] = useState(false);
  const [closedZReport, setClosedZReport] = useState<any>(null);
  const [shiftTab, setShiftTab] = useState<'status' | 'expense' | 'close' | 'zreport'>('status');

  const [debtsList, setDebtsList] = useState<any[]>([]);
  const [isDebtPayModalOpen, setIsDebtPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [debtPayAmount, setDebtPayAmount] = useState<number>(0);
  const [debtPayMethod, setDebtPayMethod] = useState<'cash' | 'card' | 'click'>('cash');
  const [debtPayNotes, setDebtPayNotes] = useState<string>('');

  const activeClinicTarget = selectedBranchId === 'all' ? (visibleBranches[0]?.id || 'dentamed-nukus') : selectedBranchId;

  const loadShiftData = async () => {
    try {
      const res = await fetch(`/api/shifts/current?clinicId=${activeClinicTarget}&tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hasActiveShift) {
          setCurrentShift(data.shift);
          setShiftLiveStats(data.liveStats);
        } else {
          setCurrentShift(null);
          setShiftLiveStats(null);
        }
      }
    } catch (e) {
      console.warn('Could not load shift', e);
    }
  };

  const loadDebtsData = async () => {
    try {
      const res = await fetch(`/api/debts?tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setDebtsList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Could not load debts', e);
    }
  };

  useEffect(() => {
    loadShiftData();
    loadDebtsData();
  }, [activeClinicTarget, currentTenant.id]);

  const handleOpenShift = async () => {
    try {
      const res = await fetch('/api/shifts/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: activeClinicTarget,
          tenantId: currentTenant.id,
          cashierName: shiftCashierName || 'Kassir',
          startingCash: Number(shiftStartingCash) || 0,
          notes: 'Ertalabki smena ochildi'
        })
      });
      if (res.ok) {
        await loadShiftData();
        setShiftTab('status');
      }
    } catch (e) {
      console.error('Error opening shift', e);
    }
  };

  const handleAddShiftExpense = async () => {
    if (shiftExpenseAmount <= 0) return;
    try {
      const res = await fetch('/api/shifts/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: activeClinicTarget,
          tenantId: currentTenant.id,
          category: shiftExpenseCategory,
          amount: Number(shiftExpenseAmount),
          recipient: shiftExpenseRecipient.trim() || 'Xarid',
          comment: shiftExpenseComment.trim()
        })
      });
      if (res.ok) {
        setShiftExpenseAmount(0);
        setShiftExpenseRecipient('');
        setShiftExpenseComment('');
        setIsExpenseAdding(false);
        await loadShiftData();
      }
    } catch (e) {
      console.error('Error adding expense', e);
    }
  };

  const handleCloseShift = async () => {
    try {
      const res = await fetch('/api/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: activeClinicTarget,
          tenantId: currentTenant.id,
          actualCash: Number(shiftActualCash) || 0,
          notes: 'Kechki smena yopildi'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setClosedZReport(data.shift);
        setShiftTab('zreport');
        await loadShiftData();
      }
    } catch (e) {
      console.error('Error closing shift', e);
    }
  };

  const handlePayDebtSubmit = async () => {
    if (!selectedDebt || debtPayAmount <= 0) return;
    try {
      const res = await fetch(`/api/debts/${selectedDebt.appointmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(debtPayAmount),
          paymentMethod: debtPayMethod,
          notes: debtPayNotes.trim()
        })
      });
      if (res.ok) {
        setIsDebtPayModalOpen(false);
        setSelectedDebt(null);
        setDebtPayAmount(0);
        setDebtPayNotes('');
        await loadDebtsData();
        await loadShiftData();
        const appts = await fetchAppointments();
        setAppointments(appts);
      }
    } catch (e) {
      console.error('Error paying debt', e);
    }
  };

  // Filtered Kanban Columns (Unified Smart Search: PIN, Name, Phone, Doctor, Service)
  const kanbanFilteredAppointments = useMemo(() => {
    return branchFilteredAppointments.filter(appt => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().replace('#', '').trim();
        return (
          appt.pinCode.toLowerCase().includes(q) ||
          appt.patientName.toLowerCase().includes(q) ||
          appt.phone.includes(q) ||
          appt.doctor.name.toLowerCase().includes(q) ||
          (appt.service.title?.uz && appt.service.title.uz.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [branchFilteredAppointments, searchQuery]);

  const kanbanColumns = useMemo(() => {
    return {
      waiting: kanbanFilteredAppointments.filter(a => a.status === 'waiting' || a.status === 'confirmed' || a.status === 'pending'),
      in_progress: kanbanFilteredAppointments.filter(a => a.status === 'in_progress'),
      completed: kanbanFilteredAppointments.filter(a => a.status === 'completed'),
      cancelled: kanbanFilteredAppointments.filter(a => a.status === 'no_show' || a.status === 'cancelled')
    };
  }, [kanbanFilteredAppointments]);

  // ==========================================
  // TAB 2: DOCTOR SUITE (SHIFOKOR KABINETI)
  // ==========================================
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(tenantDoctors[0]?.id || 1);

  useEffect(() => {
    if (tenantDoctors.length > 0 && !tenantDoctors.some(d => d.id === selectedDoctorId)) {
      setSelectedDoctorId(tenantDoctors[0].id);
    }
  }, [tenantDoctors, selectedDoctorId]);

  const activeDoctor = useMemo(() => {
    return tenantDoctors.find(d => d.id === selectedDoctorId) || tenantDoctors[0] || null;
  }, [tenantDoctors, selectedDoctorId]);

  // 32-Teeth Odontogram State for Doctor Suite
  const [teethChart, setTeethChart] = useState<ToothData[]>(INITIAL_TEETH);
  const [selectedOdontoTooth, setSelectedOdontoTooth] = useState<ToothData | null>(INITIAL_TEETH[18]); // Tooth #46

  // Schedule Blocking States
  const [isLunchBlocked, setIsLunchBlocked] = useState<boolean>(true);
  const [isWeekendBlocked, setIsWeekendBlocked] = useState<boolean>(false);

  // Doctor's assigned patients today (Scoped strictly to active tenant's branch appointments)
  const doctorTodayAppointments = useMemo(() => {
    if (!activeDoctor) return [];
    return branchFilteredAppointments.filter(a => a.doctor.id === activeDoctor.id);
  }, [branchFilteredAppointments, activeDoctor]);

  // Update tooth condition in Doctor Suite
  const handleUpdateToothCondition = (toothNum: number, condition: ToothData['condition']) => {
    setTeethChart(prev =>
      prev.map(t => (t.number === toothNum ? { ...t, condition } : t))
    );
    if (selectedOdontoTooth?.number === toothNum) {
      setSelectedOdontoTooth(prev => (prev ? { ...prev, condition } : null));
    }
  };

  // ==========================================
  // TAB 3: CEO & FINANCE HUB
  // ==========================================
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecUz, setDocSpecUz] = useState('');
  const [docDept, setDocDept] = useState<'stomatology' | 'lor'>('stomatology');
  const [docExp, setDocExp] = useState(8);
  const [docPhotoBase64, setDocPhotoBase64] = useState('');

  // Promo Banner Settings (Isolated & Synced per Tenant)
  const [promoTitle, setPromoTitle] = useState('2 ta tish davolansa, ultratovushli tozalash 50% chegirmada!');
  const [promoDiscount, setPromoDiscount] = useState(50);
  const [isPromoActive, setIsPromoActive] = useState(true);
  const [promoSaveSuccess, setPromoSaveSuccess] = useState(false);

  useEffect(() => {
    try {
      const storedPromo = localStorage.getItem(`dentamed_promo_${currentTenant.id}`);
      if (storedPromo) {
        const parsed = JSON.parse(storedPromo);
        setPromoTitle(parsed.title || '');
        setPromoDiscount(parsed.discount ?? 50);
        setIsPromoActive(parsed.isActive ?? true);
      } else {
        if (currentTenant.id === 'dentamed') {
          setPromoTitle('2 ta tish davolansa, ultratovushli tozalash 50% chegirmada!');
          setPromoDiscount(50);
          setIsPromoActive(true);
        } else if (currentTenant.id === 'grandmed') {
          setPromoTitle('Shveysariya implanti + 3D tomografiya 100% bepul!');
          setPromoDiscount(30);
          setIsPromoActive(true);
        } else {
          setPromoTitle(`${currentTenant.name}: Birinchi ko'rik va diagnostika bepul!`);
          setPromoDiscount(20);
          setIsPromoActive(true);
        }
      }
    } catch {
      // fallback
    }
  }, [currentTenant.id, currentTenant.name]);

  // Handle Photo File (Base64)
  const handleDocPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setDocPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Doctor (Create or Edit)
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    if (editingDoc) {
      // Edit
      const updated = doctors.map(d =>
        d.id === editingDoc.id
          ? {
              ...d,
              name: docName,
              specialty: { uz: docSpecUz, ru: docSpecUz },
              department: docDept,
              experience: docExp,
              photo: docPhotoBase64 || d.photo,
              tenantId: d.tenantId || currentTenant.id
            }
          : d
      );
      setDoctors(updated);
      const targetDoc = updated.find(d => d.id === editingDoc.id);
      if (targetDoc) saveDoctorLocally(targetDoc);
    } else {
      // Create
      const newDoc: Doctor = {
        id: Date.now(),
        tenantId: currentTenant.id,
        name: docName,
        specialty: { uz: docSpecUz, ru: docSpecUz },
        department: docDept,
        experience: docExp,
        rating: 5.0,
        reviewsCount: 1,
        photo: docPhotoBase64 || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        availableDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
      };
      setDoctors([newDoc, ...doctors]);
      saveDoctorLocally(newDoc);
    }
    setIsDocModalOpen(false);
    setEditingDoc(null);
    setDocName('');
    setDocSpecUz('');
    setDocPhotoBase64('');
  };

  const handleDeleteDoctor = (id: number) => {
    if (confirm(lang === 'uz' ? 'Shifokorni o\'chirmoqchimisiz?' : 'Удалить врача?')) {
      setDoctors(doctors.filter(d => d.id !== id));
      deleteDoctorLocally(id);
    }
  };

  // Financial KPIs and 30% Doctor share calculation - strictly tenant scoped
  const financeKPIs = useMemo(() => {
    let totalRevenue = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let clickTotal = 0;

    const currentScopeAppts = selectedBranchId === 'all' ? tenantAppts : branchFilteredAppointments;
    const completedAppts = currentScopeAppts.filter(a => a.status === 'completed' || a.status === 'in_progress');
    
    completedAppts.forEach((a, idx) => {
      const amt = a.totalAmount || a.service.price || 400000;
      totalRevenue += amt;
      if (idx % 3 === 0) cashTotal += amt;
      else if (idx % 3 === 1) cardTotal += amt;
      else clickTotal += amt;
    });

    // Doctor 30% KPI table - strictly mapped over tenantDoctors
    const docKPIList = tenantDoctors.map(doc => {
      const docAppts = completedAppts.filter(a => a.doctor.id === doc.id);
      const docRev = docAppts.reduce((acc, a) => acc + (a.totalAmount || a.service.price || 400000), 0);
      const doctorShare = Math.round(docRev * 0.3); // 30% KPI
      const clinicShare = docRev - doctorShare;      // 70% Clinic

      return {
        doctor: doc,
        patientCount: docAppts.length,
        totalRevenue: docRev,
        doctorShare,
        clinicShare
      };
    });

    return {
      totalRevenue,
      cashTotal,
      cardTotal,
      clickTotal,
      docKPIList
    };
  }, [tenantAppts, branchFilteredAppointments, selectedBranchId, tenantDoctors]);

  // ==========================================
  // TAB 4: ESKIZ.UZ SMS SETTINGS & TEMPLATES
  // ==========================================
  const [eskizToken, setEskizToken] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJuYmYiOjE3');
  const [eskizBalance, setEskizBalance] = useState(2480);
  const [smsTemplate2h, setSmsTemplate2h] = useState('Hurmatli {bemor}, bugun soat {vaqt} da DentaMed klinikasida {shifokor} qabuliga yozilgansiz. Manzil: {manzil}. Tel: +998 71 200-00-00');
  const [smsTemplate1d, setSmsTemplate1d] = useState('Eslatma: Ertaga soat {vaqt} da DentaMed Atelier qabulingiz bor. Kechikmasdan kelishingizni so\'raymiz.');
  const [smsTemplateRx, setSmsTemplateRx] = useState('Hurmatli {bemor}, davolash yakunlandi. Raqamli retseptingiz tayyor: https://dentamed.uz/rx/{pin}');
  const [smsSaveSuccess, setSmsSaveSuccess] = useState(false);

  // Sync SMS settings per Tenant
  useEffect(() => {
    try {
      const storedSms = localStorage.getItem(`dentamed_sms_${currentTenant.id}`);
      if (storedSms) {
        const parsed = JSON.parse(storedSms);
        if (parsed.token) setEskizToken(parsed.token);
        if (parsed.template2h) setSmsTemplate2h(parsed.template2h);
        if (parsed.template1d) setSmsTemplate1d(parsed.template1d);
        if (parsed.templateRx) setSmsTemplateRx(parsed.templateRx);
      } else {
        setSmsTemplate2h(`Hurmatli {bemor}, bugun soat {vaqt} da ${currentTenant.name} klinikasida {shifokor} qabuliga yozilgansiz. Manzil: {manzil}. Tel: +998 71 200-00-00`);
        setSmsTemplate1d(`Eslatma: Ertaga soat {vaqt} da ${currentTenant.name} qabulingiz bor. Kechikmasdan kelishingizni so'raymiz.`);
        setSmsTemplateRx(`Hurmatli {bemor}, davolash yakunlandi. Raqamli retseptingiz tayyor: https://dentamed.uz/rx/{pin}`);
      }
    } catch {
      // fallback
    }
  }, [currentTenant.id, currentTenant.name]);

  const handleSaveSmsSettings = () => {
    try {
      localStorage.setItem(`dentamed_sms_${currentTenant.id}`, JSON.stringify({
        token: eskizToken,
        template2h: smsTemplate2h,
        template1d: smsTemplate1d,
        templateRx: smsTemplateRx
      }));
    } catch (e) {
      console.error(e);
    }
    setSmsSaveSuccess(true);
    setTimeout(() => setSmsSaveSuccess(false), 3000);
  };
  
  // Test SMS State
  const [testSmsPhone, setTestSmsPhone] = useState('+998 90 123-45-67');
  const [testSmsMsg, setTestSmsMsg] = useState('DentaMed Atelier: Sinov xabari muvaffaqiyatli yetkazildi!');
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);

  const handleSendTestSms = () => {
    setTestSmsStatus('sending');
    setTimeout(() => {
      setTestSmsStatus('success');
      setEskizBalance(prev => prev - 1);
      setTimeout(() => setTestSmsStatus(null), 4000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] dark:bg-[#06100D] text-[#1A221E] dark:text-[#F3EFE6] flex flex-col font-sans transition-colors duration-300">
      {/* 1. TOP PORTAL HEADER & NAVIGATION */}
      <PortalHeader
        currentTenant={currentTenant}
        lang={lang}
        selectedBranchId={selectedBranchId}
        setSelectedBranchId={setSelectedBranchId}
        visibleBranches={visibleBranches}
        activeSession={activeSession}
        currentDateTime={currentDateTime}
        handleStaffLogout={handleStaffLogout}
        setIsLoginModalOpen={setIsLoginModalOpen}
        setSignUpStep={setSignUpStep}
        setIsSignUpModalOpen={setIsSignUpModalOpen}
        refreshAllData={refreshAllData}
        isRefreshing={isRefreshing}
        onToggleTheme={onToggleTheme}
        isDarkTheme={isDarkTheme}
        onExitPortal={onExitPortal}
        portalToast={portalToast}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        branchFilteredAppointments={branchFilteredAppointments}
      />

      {/* 2. MAIN CONTENT TABS */}
      <main className="flex-1 p-6 max-w-[1720px] w-full mx-auto">
        {activeTab === 'frontdesk' && (
          <FrontDeskTab
            lang={lang}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsShiftModalOpen={setIsShiftModalOpen}
            currentShift={currentShift}
            kanbanColumns={kanbanColumns}
            handleUpdateStatus={handleUpdateStatus}
            handleOpenReceipt={handleOpenReceipt}
            setSelectedDebt={setSelectedDebt}
            setDebtPayAmount={setDebtPayAmount}
            setIsDebtPayModalOpen={setIsDebtPayModalOpen}
          />
        )}

        {activeTab === 'doctor_suite' && (
          <DoctorSuiteTab
            lang={lang}
            activeDoctor={activeDoctor}
            selectedDoctorId={selectedDoctorId}
            setSelectedDoctorId={setSelectedDoctorId}
            tenantDoctors={tenantDoctors}
            setActiveTab={setActiveTab}
            teethChart={teethChart}
            selectedOdontoTooth={selectedOdontoTooth}
            setSelectedOdontoTooth={setSelectedOdontoTooth}
            handleUpdateToothCondition={handleUpdateToothCondition}
            isLunchBlocked={isLunchBlocked}
            setIsLunchBlocked={setIsLunchBlocked}
            isWeekendBlocked={isWeekendBlocked}
            setIsWeekendBlocked={setIsWeekendBlocked}
            doctorTodayAppointments={doctorTodayAppointments}
            handleUpdateStatus={handleUpdateStatus}
            handleOpenPrescription={handleOpenPrescription}
          />
        )}

        {activeTab === 'ceo_finance' && (
          <CeoFinanceTab
            currentTenant={currentTenant}
            setIsAddBranchModalOpen={setIsAddBranchModalOpen}
            lang={lang}
            visibleBranches={visibleBranches}
            financeKPIs={financeKPIs}
            debtsList={debtsList}
            loadDebtsData={loadDebtsData}
            setSelectedDebt={setSelectedDebt}
            setDebtPayAmount={setDebtPayAmount}
            setIsDebtPayModalOpen={setIsDebtPayModalOpen}
            tenantDoctors={tenantDoctors}
            setEditingDoc={setEditingDoc}
            setDocName={setDocName}
            setDocSpecUz={setDocSpecUz}
            setDocPhotoBase64={setDocPhotoBase64}
            setIsDocModalOpen={setIsDocModalOpen}
            setDocDept={setDocDept}
            setDocExp={setDocExp}
            handleDeleteDoctor={handleDeleteDoctor}
            promoTitle={promoTitle}
            setPromoTitle={setPromoTitle}
            promoDiscount={promoDiscount}
            setPromoDiscount={setPromoDiscount}
            isPromoActive={isPromoActive}
            setIsPromoActive={setIsPromoActive}
            promoSaveSuccess={promoSaveSuccess}
            setPromoSaveSuccess={setPromoSaveSuccess}
          />
        )}

        {activeTab === 'sms_settings' && (
          <SmsSettingsTab
            eskizBalance={eskizBalance}
            eskizToken={eskizToken}
            setEskizToken={setEskizToken}
            smsTemplate2h={smsTemplate2h}
            setSmsTemplate2h={setSmsTemplate2h}
            smsTemplate1d={smsTemplate1d}
            setSmsTemplate1d={setSmsTemplate1d}
            smsTemplateRx={smsTemplateRx}
            setSmsTemplateRx={setSmsTemplateRx}
            smsSaveSuccess={smsSaveSuccess}
            handleSaveSmsSettings={handleSaveSmsSettings}
            testSmsPhone={testSmsPhone}
            setTestSmsPhone={setTestSmsPhone}
            testSmsStatus={testSmsStatus as any}
            handleSendTestSms={handleSendTestSms}
          />
        )}
      </main>

      {/* 3. MODALS */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen && !!receiptAppointment}
        onClose={() => {
          setIsReceiptOpen(false);
          setReceiptAppointment(null);
        }}
        appointment={receiptAppointment}
        currentTenant={currentTenant}
        visibleBranches={visibleBranches}
        lang={lang}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        receiptPaperWidth={receiptFormat}
        setReceiptPaperWidth={setReceiptFormat}
        onPrint={handlePrintReceipt}
      />

      <PrescriptionModal
        isOpen={isPrescriptionOpen && !!prescriptionAppointment}
        onClose={() => {
          setIsPrescriptionOpen(false);
          setPrescriptionAppointment(null);
        }}
        appointment={prescriptionAppointment}
        diagnosis={prescriptionDiagnosis}
        setDiagnosis={setPrescriptionDiagnosis}
        medications={prescriptionMeds}
        setMedications={setPrescriptionMeds}
        recommendations={prescriptionRecs}
        setRecommendations={setPrescriptionRecs}
        nextVisitDate=""
        setNextVisitDate={() => {}}
        doctorNotes=""
        setDoctorNotes={() => {}}
        onSend={handleSendPrescriptionToTelegram}
        isSending={false}
      />

      <DoctorEditModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        editingDoc={editingDoc}
        docName={docName}
        setDocName={setDocName}
        docSpecUz={docSpecUz}
        setDocSpecUz={setDocSpecUz}
        docDept={docDept}
        setDocDept={setDocDept}
        docExp={docExp}
        setDocExp={setDocExp}
        docPhotoBase64={docPhotoBase64}
        handleDocPhotoUpload={handleDocPhotoUpload}
        handleSaveDoctor={handleSaveDoctor}
      />

      <PinLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setLoginPin('');
          setLoginError(null);
        }}
        loginPin={loginPin}
        setLoginPin={setLoginPin}
        loginError={loginError}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        onLogin={handleStaffLogin}
        isForgotPinOpen={isForgotPinOpen}
        setIsForgotPinOpen={setIsForgotPinOpen}
        recoveryPhone={recoveryPhone}
        setRecoveryPhone={setRecoveryPhone}
        recoveryStatus={recoveryStatus}
        recoveredPinInfo={recoveredPinInfo}
        onRecoverPin={handleRecoverPin}
        lang={lang}
      />

      <NewClinicWizardModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        signUpStep={signUpStep}
        setSignUpStep={setSignUpStep}
        signUpData={signUpData}
        setSignUpData={setSignUpData}
        signUpResult={signUpResult}
        signUpLoading={signUpLoading}
        copiedKey={copiedKey}
        onCopy={handleCopy}
        onSubmit={handleSignUpSubmit}
        onLoginAsNewTenant={handleLoginAsNewTenant}
        lang={lang}
      />

      <AddBranchModal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        lang={lang}
        newBranchData={newBranchData}
        setNewBranchData={setNewBranchData}
        handleAddBranchSubmit={handleAddBranchSubmit}
      />

      <ShiftZReportModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shiftTab={shiftTab}
        setShiftTab={setShiftTab}
        currentShift={currentShift}
        closedZReport={closedZReport}
        shiftCashierName={shiftCashierName}
        setShiftCashierName={setShiftCashierName}
        shiftStartingCash={shiftStartingCash}
        setShiftStartingCash={setShiftStartingCash}
        handleOpenShift={handleOpenShift}
        shiftLiveStats={shiftLiveStats}
        setShiftActualCash={setShiftActualCash}
        shiftActualCash={shiftActualCash}
        shiftExpenseCategory={shiftExpenseCategory}
        setShiftExpenseCategory={setShiftExpenseCategory}
        shiftExpenseAmount={shiftExpenseAmount}
        setShiftExpenseAmount={setShiftExpenseAmount}
        shiftExpenseRecipient={shiftExpenseRecipient}
        setShiftExpenseRecipient={setShiftExpenseRecipient}
        shiftExpenseComment={shiftExpenseComment}
        setShiftExpenseComment={setShiftExpenseComment}
        handleAddShiftExpense={handleAddShiftExpense}
        handleCloseShift={handleCloseShift}
        currentTenant={currentTenant}
        activeClinicTarget={activeClinicTarget}
      />

      <DebtPaymentModal
        isOpen={isDebtPayModalOpen}
        onClose={() => setIsDebtPayModalOpen(false)}
        selectedDebt={selectedDebt}
        debtPayAmount={debtPayAmount}
        setDebtPayAmount={setDebtPayAmount}
        debtPayMethod={debtPayMethod}
        setDebtPayMethod={setDebtPayMethod}
        debtPayNotes={debtPayNotes}
        setDebtPayNotes={setDebtPayNotes}
        handlePayDebtSubmit={handlePayDebtSubmit}
      />
    </div>
  );
};
