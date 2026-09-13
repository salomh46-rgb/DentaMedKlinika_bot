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
      {/* 1. TOP SWISS LUXURY ENTERPRISE MEDICAL BAR */}
      <header className="bg-[#112E24] dark:bg-[#071712] text-[#FAF8F5] border-b border-[#C5A880]/30 shadow-lg sticky top-0 z-50">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand Emblem & Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A880] to-[#8C7350] text-[#112E24] font-serif font-black text-xl flex items-center justify-center shadow-md border border-[#FAF8F5]/30">
              {currentTenant.name.charAt(0) || 'D'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-bold tracking-tight text-[#FAF8F5]">
                  {currentTenant.name}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#C5A880]/20 text-[#D6BF9F] px-2 py-0.5 rounded border border-[#C5A880]/30">
                  {currentTenant.badge || 'Swiss Luxury Hospital Portal'}
                </span>
              </div>
              <p className="text-[11px] text-[#A2B5AB] flex items-center gap-1.5">
                <span>{currentTenant.tagline[lang] || 'Enterprise Medical CRM & Kassa'}</span>
                <span>•</span>
                <span className="text-[#C5A880] font-mono">v4.8 High-Precision</span>
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Branch Switcher */}
          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-[#183F32] dark:bg-[#0E241D] px-3.5 py-1.5 rounded-xl border border-[#C5A880]/30 shadow-inner">
              <Building2 className="w-4 h-4 text-[#C5A880]" />
              <span className="text-xs font-medium text-[#A2B5AB]">
                {lang === 'uz' ? 'Filial:' : 'Филиал:'}
              </span>
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#FAF8F5] focus:outline-none cursor-pointer max-w-[200px]"
              >
                {(!activeSession || activeSession.role === 'super_admin' || activeSession.isDirector) && (
                  <option value="all" className="bg-[#112E24] text-[#FAF8F5]">
                    🌐 {lang === 'uz' ? `Barcha ${visibleBranches.length} ta Filial (Umumiy)` : `Все ${visibleBranches.length} Филиалов`}
                  </option>
                )}
                {visibleBranches.map(clinic => (
                  <option key={clinic.id} value={clinic.id} className="bg-[#112E24] text-[#FAF8F5]">
                    📍 {clinic.branchName[lang] || clinic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Clock */}
            <div className="hidden lg:flex items-center gap-2 bg-[#183F32]/60 px-3 py-1.5 rounded-xl border border-[#C5A880]/20 text-xs text-[#FAF8F5]">
              <Clock className="w-3.5 h-3.5 text-[#C5A880] animate-pulse" />
              <span className="font-mono font-semibold tracking-wide text-[#E5C9A4]">
                {currentDateTime}
              </span>
            </div>

            {/* System Status Indicators */}
            <div className="hidden xl:flex items-center gap-2.5 text-[10px] text-[#A2B5AB] bg-[#0A1E17] px-3 py-1.5 rounded-xl border border-[#183F32]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3" />
                <span className="text-emerald-300 font-bold">Online 24/7</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sky-300">
                <Printer className="w-3 h-3 text-sky-400" /> Kassa 58/80mm
              </span>
            </div>
          </div>

          {/* Right Action Tools: Auth Actions, Refresh, Theme, Exit */}
          <div className="flex items-center gap-2">
            {/* Authenticated User or Sign Up / Login buttons */}
            {activeSession ? (
              <div className="flex items-center gap-2 bg-[#183F32] px-3 py-1.5 rounded-xl border border-[#C5A880]/40 shadow-sm">
                <div className="text-right">
                  <div className="text-xs font-bold text-[#FAF8F5] leading-tight flex items-center gap-1">
                    <span>{activeSession.staffName}</span>
                  </div>
                  <div className="text-[10px] text-[#C5A880] leading-tight">
                    {activeSession.titleUz}
                  </div>
                </div>
                <button
                  onClick={handleStaffLogout}
                  className="p-1 rounded-lg hover:bg-rose-900/50 text-rose-300 transition"
                  title="Chiqish"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* 1. Login Button */}
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 bg-[#183F32] hover:bg-[#225745] text-[#FAF8F5] border border-[#C5A880]/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm hover:scale-95"
                  title="PIN-kod orqali kirish"
                >
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Kirish (PIN)' : 'Войти'}</span>
                </button>

                {/* 2. Sign Up (New Clinic) Button */}
                <button
                  onClick={() => {
                    setSignUpStep(1);
                    setIsSignUpModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-[#C5A880] to-[#A88B63] hover:from-[#D4B992] hover:to-[#BFA075] text-[#112E24] px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow-md hover:scale-95 animate-pulse"
                  title="Yangi klinika ulash"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'uz' ? '+ Yangi Klinika Ulash' : '+ Подключить Клинику'}</span>
                </button>
              </div>
            )}

            <button
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[#183F32] hover:bg-[#225745] text-[#C5A880] border border-[#C5A880]/30 transition active:scale-95"
              title="Ma'lumotlarni yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl bg-[#183F32] hover:bg-[#225745] text-[#C5A880] border border-[#C5A880]/30 transition active:scale-95"
                title="Mavzuni o'zgartirish"
              >
                {isDarkTheme ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#C5A880]" />}
              </button>
            )}

            {/* Exit to Patient View */}
            <button
              onClick={onExitPortal}
              className="flex items-center gap-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/50 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title="Bemorlar ilovasiga qaytish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'uz' ? 'Bemor Rejimi' : 'Режим Пациента'}</span>
            </button>
          </div>
        </div>

        {/* Global Toast Alert */}
        {portalToast && (
          <div className="bg-[#C5A880] text-[#112E24] px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{portalToast.message}</span>
          </div>
        )}

        {/* DEMO / SIMULATION NOTIFICATION BANNER */}
        {!activeSession && (
          <div className="bg-gradient-to-r from-amber-500/25 via-amber-400/20 to-amber-500/25 text-amber-950 dark:text-amber-200 px-6 py-2 border-t border-b border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-500 text-black px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> DEMO SIMULYATOR
              </span>
              <span className="font-semibold text-[11px] sm:text-xs">
                {lang === 'uz'
                  ? "Siz hozir ko'rgazmali test rejimidasiz. Barcha ko'rsatilgan bemorlar, navbatlar va filiallar sinov uchun yaratilgan feyk namuna."
                  : "Вы находитесь в демонстрационном режиме. Все пациенты, очереди и филиалы являются тестовой симуляцией."}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-3.5 py-1 rounded-xl text-xs font-bold transition shadow hover:scale-95 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#C5A880] dark:text-[#112E24]" />
                <span>{lang === 'uz' ? "Klinika xodimi sifatida kirish (PIN)" : "Войти как сотрудник (PIN)"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 4 Main Portal Tabs (Swiss Navigation Ribbon) */}
        <div className="px-6 flex gap-2 border-t border-[#183F32] overflow-x-auto no-scrollbar bg-[#0E271F] py-2">
          <button
            onClick={() => setActiveTab('frontdesk')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === 'frontdesk'
                ? 'bg-[#C5A880] text-[#112E24] shadow-md scale-100'
                : 'text-[#FAF8F5]/80 hover:bg-[#183F32] hover:text-[#FAF8F5]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📋 {lang === 'uz' ? 'Retsepshn (Front-Desk)' : 'Ресепшн (Front-Desk)'}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'frontdesk' ? 'bg-[#112E24] text-[#FAF8F5]' : 'bg-[#183F32] text-[#C5A880]'}`}>
              {branchFilteredAppointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('doctor_suite')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === 'doctor_suite'
                ? 'bg-[#C5A880] text-[#112E24] shadow-md scale-100'
                : 'text-[#FAF8F5]/80 hover:bg-[#183F32] hover:text-[#FAF8F5]'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>🩺 {lang === 'uz' ? 'Shifokor Kabineti (Doctor Suite)' : 'Кабинет Врача (Doctor Suite)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ceo_finance')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === 'ceo_finance'
                ? 'bg-[#C5A880] text-[#112E24] shadow-md scale-100'
                : 'text-[#FAF8F5]/80 hover:bg-[#183F32] hover:text-[#FAF8F5]'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>👑 {lang === 'uz' ? 'Boshqaruv & Kassa (CEO & Finance Hub)' : 'Управление и Касса (CEO Hub)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sms_settings')}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeTab === 'sms_settings'
                ? 'bg-[#C5A880] text-[#112E24] shadow-md scale-100'
                : 'text-[#FAF8F5]/80 hover:bg-[#183F32] hover:text-[#FAF8F5]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>📱 {lang === 'uz' ? 'SMS & Aloqa Sozlamalari' : 'SMS и Связь'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA (OPTIMIZED FOR 24-27 INCH SCREENS, MAX-W-7XL OR FULL-WIDTH) */}
      <main className="flex-1 p-6 max-w-[1720px] w-full mx-auto">
        {/* ========================================================================= */}
        {/* TAB 1: RETSEPSHN (FRONT-DESK) KANBAN + 4-DIGIT PIN SEARCH + RECEIPT + RX */}
        {/* ========================================================================= */}
        {activeTab === 'frontdesk' && (
          <div className="space-y-5">
            {/* Top Toolbar: 4-digit PIN Quick Search & Filters */}
            <div className="bg-white dark:bg-[#0E231B] p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-3 w-full">
                {/* Unified Smart Search (PIN, Name, Phone, Service) */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#C5A880] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={lang === 'uz' ? "🔍 PIN-kod (#8492), Bemor ismi, telefon raqami yoki xizmat..." : "🔍 PIN-код (#8492), Имя пациента, телефон или услуга..."}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Smena / Z-Hisobot Button */}
                <button
                  onClick={() => setIsShiftModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-bold transition shadow-xs whitespace-nowrap active:scale-95"
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{currentShift?.status === 'open' ? '📊 Smena & Z-Hisobot' : '🟢 Smena Ochish'}</span>
                </button>
              </div>

              {/* Status Counters */}
              <div className="flex items-center gap-3 text-xs font-semibold text-[#627068] dark:text-[#9FB1A7]">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                  ⏳ {lang === 'uz' ? 'Kutilmoqda:' : 'Ожидают:'} <b>{kanbanColumns.waiting.length}</b>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-400/30">
                  🚪 {lang === 'uz' ? 'Xonada:' : 'В кабинете:'} <b>{kanbanColumns.in_progress.length}</b>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                  ✅ {lang === 'uz' ? 'Yakunlandi:' : 'Завершено:'} <b>{kanbanColumns.completed.length}</b>
                </span>
              </div>
            </div>

            {/* KANBAN BOARD (4 REAL-TIME COLUMNS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Column 1: KUTILMOQDA (Waiting) */}
              <div className="bg-[#FAF8F5] dark:bg-[#0A1B15] rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex flex-col min-h-[600px] shadow-sm">
                <div className="p-3.5 border-b border-[#E8E2D8] dark:border-[#183F32] bg-amber-50/60 dark:bg-amber-950/20 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                      ⏳ {lang === 'uz' ? 'Kutilmoqda (Navbat)' : 'Ожидают (Очередь)'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    {kanbanColumns.waiting.length}
                  </span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
                  {kanbanColumns.waiting.map(appt => (
                    <div
                      key={appt.id}
                      className="bg-white dark:bg-[#0E231B] p-3.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] hover:border-[#C5A880] transition-all shadow-sm hover:shadow-md space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-[#C5A880] bg-[#C5A880]/10 px-2 py-0.5 rounded">
                              #{appt.pinCode}
                            </span>
                            <span className="font-semibold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                              {appt.patientName}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#627068] dark:text-[#9FB1A7] mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#C5A880]" />
                            <span>{appt.phone}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold bg-[#112E24]/5 dark:bg-[#C5A880]/10 text-[#112E24] dark:text-[#C5A880] px-2 py-0.5 rounded">
                            {appt.time}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] bg-[#FAF8F5] dark:bg-[#07130F] p-2 rounded-lg border border-[#E8E2D8]/60 dark:border-[#183F32]/60 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Shifokor:</span>
                          <span className="font-medium text-[#112E24] dark:text-[#FAF8F5] truncate max-w-[140px]">
                            {appt.doctor.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Xizmat:</span>
                          <span className="font-medium text-[#C5A880] truncate max-w-[140px]">
                            {appt.service.title[lang] || appt.service.title.uz}
                          </span>
                        </div>
                        {appt.selectedTeethNumbers && appt.selectedTeethNumbers.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tishlar:</span>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              #{appt.selectedTeethNumbers.join(', #')}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-1 border-t border-gray-200 dark:border-gray-800">
                          <span>Jami to'lov:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                            {(appt.totalAmount || appt.service.price || 400000).toLocaleString('uz-UZ')} UZS
                          </span>
                        </div>
                      </div>

                      {/* Action buttons: Move to Room, Cash Receipt, Cancel */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'in_progress')}
                          className="flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-sm"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Xonaga kirdi</span>
                        </button>

                        <button
                          onClick={() => handleOpenReceipt(appt)}
                          className="flex items-center justify-center gap-1 bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] dark:hover:bg-[#D6BF9F] text-[#FAF8F5] dark:text-[#07130F] py-1.5 px-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-sm"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Kassa Cheki</span>
                        </button>
                      </div>

                      <div className="flex justify-end items-center text-[10px] pt-1">
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'no_show')}
                          className="text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Kelmadi / Bekor</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {kanbanColumns.waiting.length === 0 && (
                    <div className="text-center py-12 text-xs text-gray-400">
                      Kutilayotgan bemorlar yo'q
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: XONAGA KIRDI (In Progress) */}
              <div className="bg-[#FAF8F5] dark:bg-[#0A1B15] rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex flex-col min-h-[600px] shadow-sm">
                <div className="p-3.5 border-b border-[#E8E2D8] dark:border-[#183F32] bg-blue-50/60 dark:bg-blue-950/20 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                      🚪 {lang === 'uz' ? 'Xonada (Davolashda)' : 'В кабинете (Лечение)'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                    {kanbanColumns.in_progress.length}
                  </span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
                  {kanbanColumns.in_progress.map(appt => (
                    <div
                      key={appt.id}
                      className="bg-white dark:bg-[#0E231B] p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          #{appt.pinCode}
                        </span>
                        <span className="font-semibold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                          {appt.patientName}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#627068] dark:text-[#9FB1A7]">
                        <div>Shifokor: <span className="text-[#112E24] dark:text-[#FAF8F5] font-medium">{appt.doctor.name}</span></div>
                        <div>Xizmat: <span className="text-[#C5A880] font-medium">{appt.service.title.uz}</span></div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'completed')}
                          className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Yakunlash</span>
                        </button>

                        <button
                          onClick={() => handleOpenReceipt(appt)}
                          className="flex items-center justify-center gap-1 bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] py-1.5 px-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-sm"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Kassa Cheki</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {kanbanColumns.in_progress.length === 0 && (
                    <div className="text-center py-12 text-xs text-gray-400">
                      Hozirda muolaja xonasida bemor yo'q
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: YAKUNLANDI (Completed) */}
              <div className="bg-[#FAF8F5] dark:bg-[#0A1B15] rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex flex-col min-h-[600px] shadow-sm">
                <div className="p-3.5 border-b border-[#E8E2D8] dark:border-[#183F32] bg-emerald-50/60 dark:bg-emerald-950/20 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                      ✅ {lang === 'uz' ? 'Yakunlandi (To\'landi)' : 'Завершено (Оплачено)'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                    {kanbanColumns.completed.length}
                  </span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
                  {kanbanColumns.completed.map(appt => (
                    <div
                      key={appt.id}
                      className="bg-white dark:bg-[#0E231B] p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] opacity-95 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                            #{appt.pinCode}
                          </span>
                          <span className="font-semibold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                            {appt.patientName}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {(appt.totalAmount || appt.service.price || 400000).toLocaleString('uz-UZ')} UZS
                        </span>
                      </div>

                      <div className="text-[11px] text-[#627068] dark:text-[#9FB1A7] flex justify-between">
                        <span>{appt.service.title.uz}</span>
                        <span>{appt.doctor.name.split(' ')[1] || appt.doctor.name}</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleOpenReceipt(appt)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#07130F] text-[10px] font-bold text-[#112E24] dark:text-[#FAF8F5] border border-gray-300 dark:border-gray-700 hover:border-[#C5A880]"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Qayta Chek</span>
                        </button>
                        {appt.debtAmount && appt.debtAmount > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedDebt({
                                appointmentId: appt.id,
                                patientName: appt.patientName,
                                debtAmount: appt.debtAmount,
                                totalAmount: appt.totalAmount || appt.service.price || 400000
                              });
                              setDebtPayAmount(appt.debtAmount || 0);
                              setIsDebtPayModalOpen(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-[#112E24] text-[10px] font-bold shadow-xs"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Nasiya: {(appt.debtAmount).toLocaleString()}</span>
                          </button>
                        ) : (
                          <span className="flex-1 flex items-center justify-center py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            To'liq to'langan
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {kanbanColumns.completed.length === 0 && (
                    <div className="text-center py-12 text-xs text-gray-400">
                      Hozircha yakunlangan qabullar yo'q
                    </div>
                  )}
                </div>
              </div>

              {/* Column 4: KELMADI / BEKOR (No Show) */}
              <div className="bg-[#FAF8F5] dark:bg-[#0A1B15] rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex flex-col min-h-[600px] shadow-sm">
                <div className="p-3.5 border-b border-[#E8E2D8] dark:border-[#183F32] bg-rose-50/60 dark:bg-rose-950/20 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                      ❌ {lang === 'uz' ? 'Kelmadi / Bekor' : 'Не явились / Отмена'}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-rose-500/20 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full">
                    {kanbanColumns.cancelled.length}
                  </span>
                </div>

                <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[75vh]">
                  {kanbanColumns.cancelled.map(appt => (
                    <div
                      key={appt.id}
                      className="bg-white dark:bg-[#0E231B] p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs space-y-1.5 opacity-75"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-rose-800 dark:text-rose-300">
                          {appt.patientName}
                        </span>
                        <span className="font-mono text-gray-400">#{appt.pinCode}</span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {appt.phone} • {appt.time}
                      </div>
                      <div className="pt-1 flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'waiting')}
                          className="text-[10px] text-blue-600 hover:underline"
                        >
                          Navbatga qaytarish
                        </button>
                      </div>
                    </div>
                  ))}
                  {kanbanColumns.cancelled.length === 0 && (
                    <div className="text-center py-12 text-xs text-gray-400">
                      Bekor qilingan qabullar mavjud emas
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DOCTOR SUITE (24-INCH 32-TEETH ODONTOGRAM + QUEUE + LUNCH BLOCK)  */}
        {/* ========================================================================= */}
        {activeTab === 'doctor_suite' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left 8 Cols: Full 32-Teeth Swiss Odontogram */}
            <div className="xl:col-span-8 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-6">
              {/* Odontogram Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                      Odontogramma & Davolash Rejasi
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      FDI 32 Teeth Standard
                    </span>
                  </div>
                  <h2 className="font-serif text-lg font-bold text-[#112E24] dark:text-[#FAF8F5] mt-0.5">
                    {activeDoctor ? activeDoctor.name : (lang === 'uz' ? 'Shifokor biriktirilmagan' : 'Врач не назначен')} — Bemorlar Jag' Xaritasi
                  </h2>
                </div>

                {/* Switch Doctor */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Shifokor:</span>
                  <select
                    value={selectedDoctorId}
                    onChange={e => setSelectedDoctorId(Number(e.target.value))}
                    className="bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32] rounded-xl px-3 py-1.5 text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                  >
                    {tenantDoctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.department === 'stomatology' ? 'Stomatolog' : 'LOR'})
                      </option>
                    ))}
                    {tenantDoctors.length === 0 && (
                      <option value="">(Shifokorlar mavjud emas)</option>
                    )}
                  </select>
                </div>
              </div>

              {tenantDoctors.length === 0 ? (
                <div className="py-16 px-6 text-center bg-[#FAF8F5] dark:bg-[#07130F] rounded-2xl border border-dashed border-[#E8E2D8] dark:border-[#183F32] space-y-3">
                  <Users className="w-12 h-12 text-[#C5A880] mx-auto opacity-40" />
                  <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    Ushbu filialda hozircha shifokorlar mavjud emas
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Klinika rahbari sifatida yangi shifokorlarni kiritish va xaritani faollashtirish uchun Boshqaruv bo'limiga o'ting.
                  </p>
                  <button
                    onClick={() => setActiveTab('ceo_finance')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-sm hover:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Shifokor Qo'shish (CEO Hub)</span>
                  </button>
                </div>
              ) : (
                <>

              {/* 32 Teeth Visual Grid: Upper Arch (18..11, 21..28) & Lower Arch (48..41, 31..38) */}
              <div className="space-y-6 bg-[#FAF8F5] dark:bg-[#07130F] p-6 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32]">
                {/* Upper Arch */}
                <div>
                  <div className="text-center text-xs font-bold uppercase tracking-widest text-[#C5A880] mb-3">
                    ▲ YUQORI JAG' (MAXILLARY ARCH)
                  </div>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
                    {teethChart.slice(0, 16).map(tooth => {
                      const isSelected = selectedOdontoTooth?.number === tooth.number;
                      let badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                      if (tooth.condition === 'caries') badgeColor = 'bg-rose-100 border-rose-400 text-rose-900 font-bold animate-pulse';
                      if (tooth.condition === 'filling') badgeColor = 'bg-sky-100 border-sky-400 text-sky-900';
                      if (tooth.condition === 'crown') badgeColor = 'bg-amber-100 border-amber-400 text-amber-950 font-bold';
                      if (tooth.condition === 'implant') badgeColor = 'bg-purple-100 border-purple-400 text-purple-900';
                      if (tooth.condition === 'missing') badgeColor = 'bg-gray-100 border-dashed border-gray-300 text-gray-400 opacity-60';

                      return (
                        <button
                          key={tooth.number}
                          onClick={() => setSelectedOdontoTooth(tooth)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-between min-h-[70px] transition-all ${badgeColor} ${
                            isSelected ? 'ring-2 ring-[#C5A880] scale-105 shadow-md z-10' : 'hover:scale-102'
                          }`}
                        >
                          <span className="font-mono text-xs font-black">#{tooth.number}</span>
                          <span className="text-[9px] truncate max-w-[48px]">{tooth.label}</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-75">
                            {tooth.condition}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-dashed border-[#C5A880]/40 my-2" />

                {/* Lower Arch */}
                <div>
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
                    {teethChart.slice(16, 32).map(tooth => {
                      const isSelected = selectedOdontoTooth?.number === tooth.number;
                      let badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                      if (tooth.condition === 'caries') badgeColor = 'bg-rose-100 border-rose-400 text-rose-900 font-bold animate-pulse';
                      if (tooth.condition === 'filling') badgeColor = 'bg-sky-100 border-sky-400 text-sky-900';
                      if (tooth.condition === 'crown') badgeColor = 'bg-amber-100 border-amber-400 text-amber-950 font-bold';
                      if (tooth.condition === 'implant') badgeColor = 'bg-purple-100 border-purple-400 text-purple-900';
                      if (tooth.condition === 'missing') badgeColor = 'bg-gray-100 border-dashed border-gray-300 text-gray-400 opacity-60';

                      return (
                        <button
                          key={tooth.number}
                          onClick={() => setSelectedOdontoTooth(tooth)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-between min-h-[70px] transition-all ${badgeColor} ${
                            isSelected ? 'ring-2 ring-[#C5A880] scale-105 shadow-md z-10' : 'hover:scale-102'
                          }`}
                        >
                          <span className="font-mono text-xs font-black">#{tooth.number}</span>
                          <span className="text-[9px] truncate max-w-[48px]">{tooth.label}</span>
                          <span className="text-[8px] uppercase tracking-tighter opacity-75">
                            {tooth.condition}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-center text-xs font-bold uppercase tracking-widest text-[#C5A880] mt-3">
                    ▼ PASTKI JAG' (MANDIBULAR ARCH)
                  </div>
                </div>
              </div>

              {/* Tooth Diagnostic Detail & Instant Action Bar */}
              {selectedOdontoTooth && (
                <div className="bg-[#FAF8F5] dark:bg-[#07130F] p-4 rounded-2xl border border-[#C5A880]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-[#C5A880] bg-[#112E24] px-2.5 py-1 rounded-lg">
                        Tish #{selectedOdontoTooth.number}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">
                        {selectedOdontoTooth.name[lang] || selectedOdontoTooth.name.uz}
                      </h4>
                    </div>
                    <p className="text-xs text-[#627068] dark:text-[#9FB1A7] mt-1">
                      Tavsiya: {selectedOdontoTooth.treatment?.[lang] || selectedOdontoTooth.treatment?.uz || 'Profilaktik ko\'rik va tozalash'}
                    </p>
                  </div>

                  {/* Condition Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleUpdateToothCondition(selectedOdontoTooth.number, 'healthy')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedOdontoTooth.condition === 'healthy'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      Sog'lom
                    </button>
                    <button
                      onClick={() => handleUpdateToothCondition(selectedOdontoTooth.number, 'caries')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedOdontoTooth.condition === 'caries'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                    >
                      Karies
                    </button>
                    <button
                      onClick={() => handleUpdateToothCondition(selectedOdontoTooth.number, 'filling')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedOdontoTooth.condition === 'filling'
                          ? 'bg-sky-600 text-white'
                          : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                      }`}
                    >
                      Plomba
                    </button>
                    <button
                      onClick={() => handleUpdateToothCondition(selectedOdontoTooth.number, 'crown')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedOdontoTooth.condition === 'crown'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      Koronka
                    </button>
                    <button
                      onClick={() => handleUpdateToothCondition(selectedOdontoTooth.number, 'implant')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedOdontoTooth.condition === 'implant'
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      }`}
                    >
                      Implant
                    </button>
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {/* Right 4 Cols: Today's Patient Queue & Schedule Blocking */}
            <div className="xl:col-span-4 space-y-6">
              {/* Schedule Blocker Card */}
              <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">
                      Ish Grafigi va Bloklash
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                    Aktiv
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Lunch Break Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32]">
                    <div>
                      <div className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                        🍱 Tushlik vaqti (13:00 - 14:00)
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {isLunchBlocked ? 'Vaqt oralig\'i qabullar uchun yopilgan' : 'Qabullar ochiq'}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsLunchBlocked(!isLunchBlocked)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isLunchBlocked
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isLunchBlocked ? 'Bloklangan' : 'Ochiq'}
                    </button>
                  </div>

                  {/* Weekend Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32]">
                    <div>
                      <div className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                        🏖️ Dam olish kunlari (Shanba-Yakshanba)
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {isWeekendBlocked ? 'Dam olish kunlari yopiq' : 'Standart rejim'}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsWeekendBlocked(!isWeekendBlocked)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isWeekendBlocked
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {isWeekendBlocked ? 'Yopiq' : 'Faol'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Today's Queue for activeDoctor */}
              <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">
                      Bugungi Navbatdagi Bemorlar
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-[#C5A880]/10 text-[#C5A880] px-2 py-0.5 rounded-full">
                    {doctorTodayAppointments.length} bemor
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {doctorTodayAppointments.map(appt => (
                    <div
                      key={appt.id}
                      className="p-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] hover:border-[#C5A880] transition space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#C5A880]">
                            #{appt.pinCode}
                          </span>
                          <span className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                            {appt.patientName}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-bold bg-[#112E24] text-[#FAF8F5] dark:bg-[#C5A880] dark:text-[#07130F] px-2 py-0.5 rounded">
                          {appt.time}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 flex justify-between items-center">
                        <span>{appt.service.title.uz}</span>
                        {appt.selectedTeethNumbers && appt.selectedTeethNumbers.length > 0 && (
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            Tish: #{appt.selectedTeethNumbers.join(', #')}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'in_progress')}
                          className="flex-1 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition"
                        >
                          Xonaga chaqirish
                        </button>
                        <button
                          onClick={() => handleOpenPrescription(appt)}
                          className="py-1 px-2.5 rounded-lg bg-[#C5A880]/10 text-[#C5A880] text-[10px] font-bold border border-[#C5A880]/30 hover:bg-[#C5A880]/20"
                        >
                          Retsept
                        </button>
                      </div>
                    </div>
                  ))}
                  {doctorTodayAppointments.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Ushbu shifokorda bugungi qabullar yo'q
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CEO & FINANCE HUB (DOCTORS CRUD + BASE64 + PROMO + 30% KPI TABLE) */}
        {/* ========================================================================= */}
        {activeTab === 'ceo_finance' && (
          <div className="space-y-6">
            {/* Multi-Branch Management Banner for Clinic Owner */}
            <div className="bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-center font-bold shadow">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                      🏥 {currentTenant.name} Filiallari va Retsepshn Kalitlari
                    </h3>
                    <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                      Barcha filiallar xodimlarining PIN-kodlari va boshqaruv markazi
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddBranchModalOpen(true)}
                  className="flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow hover:scale-95 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'uz' ? '+ Yangi Filial Qo\'shish' : '+ Добавить Филиал'}</span>
                </button>
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleBranches.map(branch => (
                  <div
                    key={branch.id}
                    className="p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] hover:border-[#C5A880] transition space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1.5">
                          <span>📍 {branch.branchName[lang] || branch.name}</span>
                          {branch.isMain && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                              Bosh filial
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[220px]">
                          {branch.address[lang] || branch.address.uz}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E8E2D8]/60 dark:border-[#183F32]/60 flex items-center justify-between text-xs">
                      <div className="text-gray-500 text-[11px]">
                        Admin: <b className="text-[#112E24] dark:text-[#FAF8F5]">{branch.managerName || 'Retsepshn'}</b>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#112E24]/5 dark:bg-[#C5A880]/10 px-2 py-0.5 rounded border border-[#C5A880]/20">
                        <Key className="w-3 h-3 text-[#C5A880]" />
                        <span className="text-[10px] text-gray-500">PIN:</span>
                        <span className="font-mono font-bold text-[#112E24] dark:text-[#FAF8F5]">
                          {branch.staffPin || '1001'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Revenue Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
                    Jami Kassa Tushumi
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
                  {financeKPIs.totalRevenue.toLocaleString('uz-UZ')} UZS
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                  +18% o'tgan haftaga nisbatan
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
                    Naqd Pul (Cash)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
                  {financeKPIs.cashTotal.toLocaleString('uz-UZ')} UZS
                </div>
                <div className="text-[10px] text-gray-500 mt-1 font-semibold">
                  Kassa seyfida saqlanmoqda
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
                    Bank Kartalari (Humo/Uzcard)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
                  {financeKPIs.cardTotal.toLocaleString('uz-UZ')} UZS
                </div>
                <div className="text-[10px] text-blue-500 mt-1 font-semibold">
                  Hisob raqamga o'tkazildi
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
                    Click / Payme / Online
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
                  {financeKPIs.clickTotal.toLocaleString('uz-UZ')} UZS
                </div>
                <div className="text-[10px] text-purple-500 mt-1 font-semibold">
                  0% komissiya dasturi
                </div>
              </div>
            </div>

            {/* Doctors 30% KPI Table */}
            <div className="bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <div>
                  <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    Shifokorlar Oylik Ulushi (30% KPI Taqsimoti)
                  </h3>
                  <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                    Har bir shifokor ko'rsatgan xizmatidan 30% bonus, 70% klinika sof daromadi hisoblanadi
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#07130F] hover:bg-[#E8E2D8] dark:hover:bg-[#183F32] text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Jadvalni Chop Etish</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] dark:bg-[#07130F] text-[#627068] dark:text-[#9FB1A7] uppercase text-[10px] tracking-wider border-b border-[#E8E2D8] dark:border-[#183F32]">
                    <tr>
                      <th className="py-3 px-4">Shifokor F.I.Sh</th>
                      <th className="py-3 px-4">Mutaxassisligi</th>
                      <th className="py-3 px-4 text-center">Bemorlar</th>
                      <th className="py-3 px-4 text-right">Jami Tushum</th>
                      <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                        Shifokor Ulushi (30%)
                      </th>
                      <th className="py-3 px-4 text-right text-[#C5A880]">Klinika Ulushi (70%)</th>
                      <th className="py-3 px-4 text-center">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#183F32]">
                    {financeKPIs.docKPIList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                          Hozircha hisoblangan shifokorlar mavjud emas
                        </td>
                      </tr>
                    ) : (
                      financeKPIs.docKPIList.map(item => (
                      <tr key={item.doctor.id} className="hover:bg-[#FAF8F5]/60 dark:hover:bg-[#07130F]/40 transition">
                        <td className="py-3 px-4 font-bold text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-2">
                          <img
                            src={item.doctor.photo}
                            alt={item.doctor.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#C5A880]/30"
                          />
                          <span>{item.doctor.name}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {item.doctor.specialty.uz}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          {item.patientCount} ta
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          {item.totalRevenue.toLocaleString('uz-UZ')} UZS
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {item.doctorShare.toLocaleString('uz-UZ')} UZS
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#C5A880]">
                          {item.clinicShare.toLocaleString('uz-UZ')} UZS
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Hisoblangan
                          </span>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nasiya va Qarzlar Daftari (Debts & Installments Ledger) */}
            <div className="bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                      Nasiya va Qarzlar Daftari (Debts & Installments Ledger)
                    </h3>
                  </div>
                  <p className="text-xs text-[#627068] dark:text-[#9FB1A7] mt-1">
                    Muolaja qildirib, to'lovni qisman yoki nasiyaga qoldirgan bemorlar va so'ndirilgan to'lovlar monitoringi
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3.5 py-2 rounded-2xl text-right">
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Jami Nasiya Qoldig'i</div>
                    <div className="font-mono text-sm font-black text-amber-600 dark:text-amber-300">
                      {debtsList.filter(d => d.status !== 'settled').reduce((sum, d) => sum + (d.debtAmount || 0), 0).toLocaleString('uz-UZ')} UZS
                    </div>
                  </div>
                  <button
                    onClick={loadDebtsData}
                    className="p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                    title="Yangilash"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] dark:bg-[#07130F] text-[#627068] dark:text-[#9FB1A7] uppercase text-[10px] tracking-wider border-b border-[#E8E2D8] dark:border-[#183F32]">
                    <tr>
                      <th className="py-3 px-4">Bemor F.I.Sh</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Sana / Shifokor</th>
                      <th className="py-3 px-4 text-right">Jami Muolaja</th>
                      <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">To'langan</th>
                      <th className="py-3 px-4 text-right text-rose-500 font-bold">Qarz Qoldig'i</th>
                      <th className="py-3 px-4 text-center">Holat</th>
                      <th className="py-3 px-4 text-center">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#183F32]">
                    {debtsList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500 text-xs">
                          Hozircha faol nasiya yoki qarz yozuvlari mavjud emas (Kassa toza).
                        </td>
                      </tr>
                    ) : (
                      debtsList.map(debt => (
                        <tr key={debt.appointmentId} className="hover:bg-[#FAF8F5]/60 dark:hover:bg-[#07130F]/40 transition">
                          <td className="py-3 px-4 font-bold text-[#112E24] dark:text-[#FAF8F5]">
                            {debt.patientName}
                          </td>
                          <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                            {debt.phone}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            <div>{debt.date}</div>
                            <div className="text-[10px] text-[#C5A880]">{debt.doctorName || 'Shifokor'}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {(debt.totalAmount || 0).toLocaleString('uz-UZ')} UZS
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {(debt.paidAmount || 0).toLocaleString('uz-UZ')} UZS
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-rose-500">
                            {(debt.debtAmount || 0).toLocaleString('uz-UZ')} UZS
                          </td>
                          <td className="py-3 px-4 text-center">
                            {debt.debtAmount <= 0 || debt.status === 'settled' ? (
                              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                To'liq to'langan
                              </span>
                            ) : debt.paidAmount > 0 ? (
                              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                Qisman to'langan
                              </span>
                            ) : (
                              <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                Nasiya (100% qarz)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {debt.debtAmount > 0 ? (
                              <button
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setDebtPayAmount(debt.debtAmount);
                                  setIsDebtPayModalOpen(true);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-[#112E24] text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95"
                              >
                                To'lov Qabul Qilish
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs font-semibold">Yopilgan</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctors CRUD & Promo Customizer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Doctors Management (8 Cols) */}
              <div className="lg:col-span-8 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                      Shifokorlar Shtati va CRUD
                    </h3>
                    <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                      Yangi mutaxassislarni qo'shish, ma'lumotlarni va fotosuratlarni tahrirlash
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDoc(null);
                      setDocName('');
                      setDocSpecUz('');
                      setDocPhotoBase64('');
                      setIsDocModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yangi Shifokor Qo'shish</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tenantDoctors.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-[#FAF8F5] dark:bg-[#07130F] rounded-2xl border border-dashed border-[#E8E2D8] dark:border-[#183F32] space-y-2">
                      <Users className="w-8 h-8 mx-auto text-[#C5A880] opacity-50" />
                      <p className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5]">Hozircha biriktirilgan shifokorlar yo'q</p>
                      <p className="text-[11px] text-gray-500">Ushbu klinika uchun birinchi shifokorni ro'yxatdan o'tkazing</p>
                      <button
                        onClick={() => {
                          setEditingDoc(null);
                          setDocName('');
                          setDocSpecUz('');
                          setDocPhotoBase64('');
                          setIsDocModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#C5A880] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Birinchi Shifokorni Qo'shish</span>
                      </button>
                    </div>
                  ) : (
                    tenantDoctors.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between gap-3 hover:border-[#C5A880] transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={doc.photo}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#C5A880]/30 shadow-sm"
                        />
                        <div>
                          <div className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                            {doc.name}
                          </div>
                          <div className="text-[11px] text-[#C5A880]">
                            {doc.specialty.uz}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {doc.experience} yil tajriba • {doc.department.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingDoc(doc);
                            setDocName(doc.name);
                            setDocSpecUz(doc.specialty.uz);
                            setDocDept(doc.department);
                            setDocExp(doc.experience);
                            setDocPhotoBase64(doc.photo);
                            setIsDocModalOpen(true);
                          }}
                          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc.id)}
                          className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )))}
                </div>
              </div>

              {/* Promo Banner Customizer (4 Cols) */}
              <div className="lg:col-span-4 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A880]" />
                    <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                      Eksklyuziv Aksiya
                    </h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold bg-[#C5A880]/10 text-[#C5A880] px-2 py-0.5 rounded-full">
                    Jonli Bemor Ekrani
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      Aksiya Sarlavhasi:
                    </label>
                    <input
                      type="text"
                      value={promoTitle}
                      onChange={e => setPromoTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-1">
                      Chegirma Foizi (%):
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={90}
                      value={promoDiscount}
                      onChange={e => setPromoDiscount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-mono font-bold focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5]">
                      Aksiya Holati:
                    </span>
                    <button
                      onClick={() => setIsPromoActive(!isPromoActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isPromoActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {isPromoActive ? 'Aktiv (Ko\'rinmoqda)' : 'O\'chirilgan'}
                    </button>
                  </div>

                  {promoSaveSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aksiya muvaffaqiyatli saqlandi!</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem(`dentamed_promo_${currentTenant.id}`, JSON.stringify({
                          title: promoTitle,
                          discount: promoDiscount,
                          isActive: isPromoActive
                        }));
                      } catch (err) {
                        console.error(err);
                      }
                      setPromoSaveSuccess(true);
                      setTimeout(() => setPromoSaveSuccess(false), 3000);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-sm hover:scale-95"
                  >
                    Saqlash va E'lon Qilish
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SMS & ALOQA SOZLAMALARI (ESKIZ.UZ SMS BACKUP + TEMPLATES)         */}
        {/* ========================================================================= */}
        {activeTab === 'sms_settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Eskiz.uz Token, Balance, Templates */}
            <div className="lg:col-span-7 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    SMS
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                      Eskiz.uz SMS Provayder Integratsiyasi
                    </h3>
                    <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                      Telegram bot bilan parallel holda zaxira SMS bildirishnomalari
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-500">Mavjud Balans:</div>
                  <div className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                    {eskizBalance} ta SMS
                  </div>
                </div>
              </div>

              {/* Eskiz API Token Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block">
                  Eskiz.uz Bearer API Token:
                </label>
                <input
                  type="password"
                  value={eskizToken}
                  onChange={e => setEskizToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              {/* SMS Templates */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#C5A880]">
                  Avtomatik SMS Xabar Shablonlari:
                </h4>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 block">
                    1. Qabuldan 2 soat oldin (Tezkor eslatma):
                  </label>
                  <textarea
                    rows={2}
                    value={smsTemplate2h}
                    onChange={e => setSmsTemplate2h(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 block">
                    2. Qabuldan 1 kun oldin (Kunlik reja):
                  </label>
                  <textarea
                    rows={2}
                    value={smsTemplate1d}
                    onChange={e => setSmsTemplate1d(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-gray-500 block">
                    3. Davolash yakunlanganda (Raqamli Retsept havolasi):
                  </label>
                  <textarea
                    rows={2}
                    value={smsTemplateRx}
                    onChange={e => setSmsTemplateRx(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                {smsSaveSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SMS sozlamalari va shablonlar ushbu klinika uchun saqlandi!</span>
                  </div>
                )}

                <button
                  onClick={handleSaveSmsSettings}
                  className="w-full py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-sm hover:scale-95"
                >
                  Shablonlarni Saqlash
                </button>
              </div>
            </div>

            {/* Right 5 Cols: SMS Gateway Delivery Log & Health */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    SMS Shlyuz Monitoringi
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Faol • 99.8% Uptime
                </span>
              </div>

              {/* Delivery History Log */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Oxirgi Yetkazilgan SMS Xabarlar (Jonli Log):
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {[
                    { phone: '+998 90 123-45-67', type: '24h Eslatma', time: '10:45', status: 'delivered' },
                    { phone: '+998 97 712-34-56', type: '2h Eslatma + PIN', time: '09:30', status: 'delivered' },
                    { phone: '+998 93 555-88-99', type: 'Raqamli Retsept', time: '08:15', status: 'delivered' },
                    { phone: '+998 99 800-11-22', type: 'Qabul Tasdig\'i', time: 'Kecha', status: 'delivered' },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl border border-[#E8E2D8]/60 dark:border-[#183F32]/60 bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#112E24] dark:text-[#FAF8F5]">{log.phone}</div>
                        <div className="text-[10px] text-gray-500">{log.type} • {log.time}</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Yetkazildi</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Test SMS Sender */}
              <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#183F32] space-y-2.5">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Send className="w-3 h-3 text-[#C5A880]" />
                  <span>Tezkor Test SMS Yuborish:</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testSmsPhone}
                    onChange={e => setTestSmsPhone(e.target.value)}
                    placeholder="+998 90 123-45-67"
                    className="flex-1 p-2 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                  />
                  <button
                    onClick={handleSendTestSms}
                    disabled={testSmsStatus === 'sending'}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#112E24] font-bold text-xs transition active:scale-95 flex items-center gap-1"
                  >
                    <Send className={`w-3.5 h-3.5 ${testSmsStatus === 'sending' ? 'animate-spin' : ''}`} />
                    <span>Yuborish</span>
                  </button>
                </div>
                {testSmsStatus === 'success' && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SMS {testSmsPhone} ga jo'natildi!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. THERMAL RECEIPT MODAL (58mm / 80mm OFFICIAL THERMAL RECEIPT PRINT)     */}
      {/* ========================================================================= */}
      {isReceiptOpen && receiptAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-lg w-full border border-[#C5A880]/40 shadow-2xl space-y-4 animate-scale-up">
            {/* Modal Header & Width Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                  Rasmiy Termal Kassa Cheki
                </h3>
              </div>

              {/* 58mm vs 80mm Switcher */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#07130F] p-1 rounded-xl border border-gray-300 dark:border-gray-700 text-xs">
                <button
                  onClick={() => setReceiptFormat('58mm')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    receiptFormat === '58mm'
                      ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
                      : 'text-gray-500'
                  }`}
                >
                  58 mm
                </button>
                <button
                  onClick={() => setReceiptFormat('80mm')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    receiptFormat === '80mm'
                      ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
                      : 'text-gray-500'
                  }`}
                >
                  80 mm
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="flex items-center justify-between text-xs bg-[#FAF8F5] dark:bg-[#07130F] p-2 rounded-xl border border-gray-200 dark:border-gray-800">
              <span className="font-bold text-gray-500">To'lov usuli:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    paymentMethod === 'cash' ? 'bg-amber-500 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Naqd
                </button>
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    paymentMethod === 'card' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Karta
                </button>
                <button
                  onClick={() => setPaymentMethod('click')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${
                    paymentMethod === 'click' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Click/Payme
                </button>
              </div>
            </div>

            {/* THERMAL PRINTABLE CONTAINER (COURIER NEW / MONOSPACE) */}
            <div className="bg-amber-50/40 dark:bg-black/30 p-3 rounded-2xl border border-dashed border-gray-400 overflow-y-auto max-h-[50vh]">
              <div
                id="thermal-receipt-printable"
                className={`mx-auto bg-white text-black p-4 text-[11px] font-mono shadow-sm leading-relaxed ${
                  receiptFormat === '58mm' ? 'max-w-[260px]' : 'max-w-[360px]'
                }`}
                style={{ fontFamily: 'Courier New, Courier, monospace' }}
              >
                <div className="text-center pb-2 border-b border-dashed border-black">
                  <div className="font-black text-sm uppercase">{currentTenant.name}</div>
                  <div className="text-[10px]">{visibleBranches.find(b => b.id === receiptAppointment.clinicId)?.name || currentTenant.name}</div>
                  <div className="text-[9px]">{visibleBranches.find(b => b.id === receiptAppointment.clinicId)?.address?.uz || (visibleBranches.find(b => b.id === receiptAppointment.clinicId) as any)?.address || "Toshkent shahri"}</div>
                  <div className="text-[9px]">Tel: {visibleBranches.find(b => b.id === receiptAppointment.clinicId)?.phone || "+998 (71) 200-00-00"}</div>
                  <div className="text-[9px]">STIR (INN): 308942189</div>
                </div>

                <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>CHEK: #CHK-{receiptAppointment.pinCode}-{receiptAppointment.id.slice(-4)}</span>
                    <span>{receiptAppointment.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sana:</span>
                    <span>{new Date().toISOString().split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kassir:</span>
                    <span>Malika Y. (Retsepshn)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bemor:</span>
                    <span className="font-bold">{receiptAppointment.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bemor PIN:</span>
                    <span className="font-bold">#{receiptAppointment.pinCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shifokor:</span>
                    <span>{receiptAppointment.doctor.name}</span>
                  </div>
                </div>

                <div className="py-2 border-b border-dashed border-black space-y-1">
                  <div className="font-bold text-[10px] uppercase">Xizmatlar:</div>
                  <div className="flex justify-between font-bold">
                    <span>1. {receiptAppointment.service.title.uz}</span>
                    <span>{(receiptAppointment.totalAmount || receiptAppointment.service.price || 400000).toLocaleString('uz-UZ')}</span>
                  </div>
                  {receiptAppointment.selectedTeethNumbers && receiptAppointment.selectedTeethNumbers.length > 0 && (
                    <div className="text-[9px] text-gray-700">
                      Davolangan tishlar: #{receiptAppointment.selectedTeethNumbers.join(', #')}
                    </div>
                  )}
                  {receiptAppointment.hasPromoUltrasonic && (
                    <div className="flex justify-between text-[9px] text-gray-700">
                      <span>Aksiya (Ultratovushli tozalash 50%)</span>
                      <span>+200 000 UZS</span>
                    </div>
                  )}
                </div>

                <div className="py-2 border-b-2 border-black space-y-1">
                  <div className="flex justify-between text-xs font-black">
                    <span>JAMI TO'LOV:</span>
                    <span>{(receiptAppointment.totalAmount || receiptAppointment.service.price || 400000).toLocaleString('uz-UZ')} UZS</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>To'lov turi:</span>
                    <span className="uppercase font-bold">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-600">
                    <span>QQS (0% Tibbiyot):</span>
                    <span>0 UZS</span>
                  </div>
                </div>

                {/* Fiscal QR Barcode Illustration */}
                <div className="text-center pt-3 pb-1 space-y-1">
                  <div className="font-mono text-[9px] tracking-widest text-center">
                    ||| | ||||| || |||||| |||| | |||
                  </div>
                  <div className="text-[8px] uppercase tracking-tighter">
                    Fiskal belgi: 98402948102948
                  </div>
                  <div className="text-[9px] font-bold mt-1">
                    Salomat bo'ling! Ishonchingiz uchun rahmat!
                  </div>
                  <div className="text-[8px] text-gray-500">
                    www.dentamed.uz
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Close Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsReceiptOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Yopish
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 rounded-xl bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Chop Etish (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DIGITAL PRESCRIPTION MODAL (TELEGRAM INTEGRATION)                      */}
      {/* ========================================================================= */}
      {isPrescriptionOpen && prescriptionAppointment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-xl w-full border border-[#C5A880]/40 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C5A880]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    Raqamli Retsept Yozish
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Bemor: {prescriptionAppointment.patientName} (#{prescriptionAppointment.pinCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrescriptionOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnosis Input */}
            <div>
              <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block mb-1">
                Tashxis & Muolaja tavsifi:
              </label>
              <input
                type="text"
                value={prescriptionDiagnosis}
                onChange={e => setPrescriptionDiagnosis(e.target.value)}
                placeholder="Masalan: O'tkir chuqur karies, plomba o'rnatildi..."
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-medium focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            {/* Fast Medicine Presets */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
                Tezkor dorilar shablonlari (1-klikda qo'shish):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MEDICINES.map((med, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!prescriptionMeds.some(m => m.name === med.name)) {
                        setPrescriptionMeds([...prescriptionMeds, med]);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#07130F] text-[11px] font-semibold border border-gray-200 dark:border-gray-800 hover:border-[#C5A880] transition"
                  >
                    + {med.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Prescribed Medicines List */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              <label className="text-[11px] font-bold text-[#112E24] dark:text-[#FAF8F5] block">
                Retseptga kiritilgan dorilar ({prescriptionMeds.length}):
              </label>
              {prescriptionMeds.map((med, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-[#112E24] dark:text-[#FAF8F5]">
                      {med.name} ({med.dosage})
                    </div>
                    <div className="text-[10.5px] text-gray-500">
                      {med.frequency} • {med.duration}
                    </div>
                  </div>
                  <button
                    onClick={() => setPrescriptionMeds(prescriptionMeds.filter((_, idx) => idx !== i))}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {prescriptionSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{prescriptionSuccessMsg}</span>
              </div>
            )}

            {/* Send via Telegram button */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsPrescriptionOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSendPrescriptionToTelegram}
                className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md flex items-center justify-center gap-2 hover:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Telegramga Jo'natish (1-klik)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DOCTOR CREATE/EDIT MODAL (BASE64 PHOTO UPLOAD)                          */}
      {/* ========================================================================= */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveDoctor}
            className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-md w-full border border-[#C5A880]/40 shadow-2xl space-y-4 animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                {editingDoc ? 'Shifokorni Tahrirlash' : 'Yangi Shifokor Qo\'shish'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  F.I.Sh (Ismi va Familiyasi):
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="Dr. Jamshid Rustamov"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  Mutaxassisligi:
                </label>
                <input
                  type="text"
                  required
                  value={docSpecUz}
                  onChange={e => setDocSpecUz(e.target.value)}
                  placeholder="Bosh Implantolog, Ortodont"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                    Bo'lim:
                  </label>
                  <select
                    value={docDept}
                    onChange={e => setDocDept(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="stomatology">Stomatologiya</option>
                    <option value="lor">LOR Bo'limi</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                    Tajriba (Yil):
                  </label>
                  <input
                    type="number"
                    value={docExp}
                    onChange={e => setDocExp(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-mono font-bold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              {/* Photo Upload (Base64) */}
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  Fotosurat yuklash (Base64 format):
                </label>
                <div className="flex items-center gap-3">
                  {docPhotoBase64 ? (
                    <img
                      src={docPhotoBase64}
                      alt="Doctor Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-[#C5A880]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDocPhotoUpload}
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#112E24] file:text-[#FAF8F5] hover:file:bg-[#183F32] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PIN AUTHENTICATION / LOGIN MODAL (RBAC)                                 */}
      {/* ========================================================================= */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#C5A880]/50 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    {lang === 'uz' ? 'CRM Tizimiga Kirish' : 'Вход в CRM'}
                  </h3>
                  <p className="text-[11px] text-[#627068] dark:text-[#9FB1A7]">
                    {lang === 'uz' ? 'Klinika Rahbari yoki Filial PIN-kodi' : 'PIN-код руководителя или филиала'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoginModalOpen(false);
                  setLoginError(null);
                }}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Demo PIN hints */}
            <div className="bg-[#FAF8F5] dark:bg-[#07130F] p-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] space-y-1.5 text-xs">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {lang === 'uz' ? 'Tezkor Sinov PIN-kodlari (1-klikda tanlash):' : 'Быстрые тестовые PIN-коды:'}
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setLoginPin('7777')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0E231B] border border-amber-500/30 hover:border-amber-500 text-left transition"
                >
                  <span className="font-semibold text-amber-700 dark:text-amber-300 truncate">👑 DentaMed CEO</span>
                  <span className="font-mono font-bold ml-1 bg-amber-500/10 px-1.5 py-0.5 rounded">7777</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginPin('8888')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0E231B] border border-blue-500/30 hover:border-blue-500 text-left transition"
                >
                  <span className="font-semibold text-blue-600 dark:text-blue-400 truncate">👑 GrandMed CEO</span>
                  <span className="font-mono font-bold ml-1 bg-blue-500/10 px-1.5 py-0.5 rounded">8888</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginPin('1001')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0E231B] border border-emerald-500/30 hover:border-emerald-500 text-left transition"
                >
                  <span className="font-medium text-emerald-700 dark:text-emerald-300 truncate">📍 Nukus Retsepshn</span>
                  <span className="font-mono font-bold ml-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">1001</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginPin('2001')}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0E231B] border border-purple-500/30 hover:border-purple-500 text-left transition"
                >
                  <span className="font-medium text-purple-600 dark:text-purple-400 truncate">📍 GrandMed Retsepshn</span>
                  <span className="font-mono font-bold ml-1 bg-purple-500/10 px-1.5 py-0.5 rounded">2001</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1.5">
                  {lang === 'uz' ? '4 xonali PIN-kod:' : '4-значный PIN-код:'}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="PIN: 7777 / 8888 / 1001"
                  value={loginPin}
                  onChange={e => {
                    setLoginPin(e.target.value);
                    setLoginError(null);
                  }}
                  className="w-full text-center tracking-[0.3em] font-mono text-2xl py-3 rounded-2xl border-2 border-[#C5A880] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                />
                {loginError && (
                  <div className="text-rose-500 text-xs text-center mt-2 font-semibold">
                    {loginError}
                  </div>
                )}

                {/* Remember Me & Forgot PIN recovery */}
                <div className="flex items-center justify-between text-xs mt-2.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[#627068] dark:text-[#9FB1A7]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-[#C5A880] text-[#112E24] focus:ring-[#C5A880] w-4 h-4 cursor-pointer"
                    />
                    <span>{lang === 'uz' ? "Meni eslab qolish (30 kun)" : "Запомнить меня на 30 дней"}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsForgotPinOpen(!isForgotPinOpen)}
                    className="text-[#C5A880] hover:underline font-semibold text-[11px]"
                  >
                    {lang === 'uz' ? "📲 Kodingiz esdan chiqdimi?" : "📲 Забыли код?"}
                  </button>
                </div>

                {/* Doctor PIN Recovery Panel (for older 30-65 staff) */}
                {isForgotPinOpen && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#C5A880]/40 space-y-2.5 text-xs animate-fade-in mt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#C5A880]" />
                        {lang === 'uz' ? "PIN kodni SMS orqali olish" : "Восстановление PIN по SMS"}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">Eskiz.uz SMS Gateway</span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      {lang === 'uz'
                        ? "Katta yoshdagi shifokorlarimiz uchun qulaylik: Telefon raqamingizni kiriting, kod SMS orqali yuboriladi va avtomatik kiritiladi."
                        : "Введите ваш номер телефона, и код доступа будет отправлен по SMS."}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={recoveryPhone}
                        onChange={e => setRecoveryPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="flex-1 p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleRecoverPin}
                        disabled={recoveryStatus === 'sending'}
                        className="px-3.5 py-2.5 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-bold text-xs rounded-xl shadow hover:scale-95 transition"
                      >
                        {recoveryStatus === 'sending' ? (lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...') : (lang === 'uz' ? 'SMS Yuborish' : 'Выслать SMS')}
                      </button>
                    </div>

                    {recoveredPinInfo && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium animate-fade-in">
                        {recoveredPinInfo}
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{lang === 'uz' ? "Qo'ng'iroq orqali yordam:" : "Помощь по телефону:"}</span>
                      <a href="tel:+998712000000" className="font-bold text-[#112E24] dark:text-[#C5A880] hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" /> +998 (71) 200-00-00
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{lang === 'uz' ? 'Tizimga Kirish' : 'Войти'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SIGN UP ONBOARDING WIZARD MODAL (YANGI KLINIKA ULASH / 3 BOSQICH)        */}
      {/* ========================================================================= */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-[#C5A880] shadow-2xl space-y-5 animate-scale-up">
            {/* Header & Step Tracker */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C5A880]" />
                  <h3 className="font-serif font-bold text-lg text-[#112E24] dark:text-[#FAF8F5]">
                    {signUpStep === 3
                      ? (lang === 'uz' ? '🎉 Tabriklaymiz! Tizim Tayyor!' : '🎉 Поздравляем!')
                      : (lang === 'uz' ? 'Yangi Klinika Ulash (14 Kun Bepul)' : 'Подключение Новой Клиники')}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {signUpStep === 1 && (lang === 'uz' ? '1-Qadam: Klinika brendi va Rahbar ma\'lumotlari' : 'Шаг 1: Клиника и Руководитель')}
                  {signUpStep === 2 && (lang === 'uz' ? '2-Qadam: Birlamchi filial manzili va ish vaqti' : 'Шаг 2: Первый филиал')}
                  {signUpStep === 3 && (lang === 'uz' ? '3-Qadam: Barcha PIN-kodlar va Telegram ulanish kalitlari' : 'Шаг 3: Ваши ключи доступа')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSignUpModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full transition-all ${signUpStep >= 1 ? 'bg-[#C5A880]' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all ${signUpStep >= 2 ? 'bg-[#C5A880]' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`flex-1 h-1.5 rounded-full transition-all ${signUpStep === 3 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
            </div>

            {/* STEP 1 & 2 FORM */}
            {signUpStep !== 3 ? (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {signUpStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Klinika yoki Tibbiyot Markazi Nomi: *
                      </label>
                      <input
                        type="text"
                        required
                        value={signUpData.clinicName}
                        onChange={e => setSignUpData({ ...signUpData, clinicName: e.target.value })}
                        placeholder="Masalan: Shifo Nur Med, Perfect Smile..."
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Bosh Shifokor / Klinika Rahbari F.I.Sh: *
                      </label>
                      <input
                        type="text"
                        required
                        value={signUpData.ownerName}
                        onChange={e => setSignUpData({ ...signUpData, ownerName: e.target.value })}
                        placeholder="Dr. Nodir Zokirov"
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Rahbar Telefon Raqami: *
                        </label>
                        <input
                          type="text"
                          required
                          value={signUpData.phone}
                          onChange={e => setSignUpData({ ...signUpData, phone: e.target.value })}
                          className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                          Email (Ixtiyoriy):
                        </label>
                        <input
                          type="email"
                          value={signUpData.email}
                          onChange={e => setSignUpData({ ...signUpData, email: e.target.value })}
                          placeholder="info@shifonur.uz"
                          className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {signUpStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        1-Birlamchi Filial Nomi:
                      </label>
                      <input
                        type="text"
                        value={signUpData.firstBranchName}
                        onChange={e => setSignUpData({ ...signUpData, firstBranchName: e.target.value })}
                        placeholder={`${signUpData.clinicName || 'Klinika'} Bosh Filiali`}
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Filial Shahri va Manzili:
                      </label>
                      <input
                        type="text"
                        value={signUpData.firstBranchAddress}
                        onChange={e => setSignUpData({ ...signUpData, firstBranchAddress: e.target.value })}
                        placeholder="Toshkent sh., Chilonzor 9-mavze, 12-uy (Metro yaqinida)"
                        className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>
                        Tizim sizga <b>Rahbar Super PIN</b> va <b>Filial Retsepshn PIN</b> kodlarini avtomatik generatsiya qilib beradi!
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  {signUpStep === 2 && (
                    <button
                      type="button"
                      onClick={() => setSignUpStep(1)}
                      className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
                    >
                      Orqaga
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={signUpLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#112E24] to-[#1C4D3D] dark:from-[#C5A880] dark:to-[#A88B63] text-[#FAF8F5] dark:text-[#07130F] text-xs font-black transition shadow-lg hover:scale-95 flex items-center justify-center gap-2"
                  >
                    {signUpLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : signUpStep === 1 ? (
                      <>
                        <span>Keyingi Bosqich</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Klinikani Ishga Tushirish (14 Kun Bepul)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* STEP 3: CELEBRATION & GENERATED ACCESS KEYS */
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs">
                  <div className="font-bold flex items-center gap-1.5 text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Tabriklaymiz! {signUpResult?.tenantName} tizimi faollashtirildi!</span>
                  </div>
                  <p>
                    Quyidagi kalitlar va bot havolasini saqlab oling. Ushbu PIN-kodlar orqali har doim CRM ga kirasiz:
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Key 1: Owner PIN */}
                  <div className="p-3.5 rounded-2xl border-2 border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">
                        👑 Sizning Rahbar Super PIN-kodingiz:
                      </div>
                      <div className="font-mono text-xl font-black text-[#112E24] dark:text-[#FAF8F5] tracking-widest mt-0.5">
                        {signUpResult?.ownerPin}
                      </div>
                      <div className="text-[10.5px] text-gray-500">
                        Moliya, kassa va filiallar boshqaruvi uchun
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(signUpResult?.ownerPin || '', 'ownerPin')}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1"
                    >
                      {copiedKey === 'ownerPin' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey === 'ownerPin' ? 'Nusxalandi' : 'Nusxa'}</span>
                    </button>
                  </div>

                  {/* Key 2: Branch Staff PIN */}
                  <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
                        📍 1-Filial Retsepshn PIN-kodi:
                      </div>
                      <div className="font-mono text-xl font-black text-[#112E24] dark:text-[#FAF8F5] tracking-widest mt-0.5">
                        {signUpResult?.staffPin}
                      </div>
                      <div className="text-[10.5px] text-gray-500">
                        Administrator bemorlarni kutib olishi va kassa cheki uchun
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(signUpResult?.staffPin || '', 'staffPin')}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1"
                    >
                      {copiedKey === 'staffPin' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedKey === 'staffPin' ? 'Nusxalandi' : 'Nusxa'}</span>
                    </button>
                  </div>

                  {/* Key 3: Telegram Bot Link */}
                  <div className="p-3 rounded-2xl border border-blue-500/40 bg-blue-50/40 dark:bg-blue-950/20 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300">
                        🤖 Bemorlar uchun Telegram Bot:
                      </div>
                      <div className="font-mono text-xs font-bold text-blue-800 dark:text-blue-200 mt-0.5">
                        @DentaMedKlinika_bot
                      </div>
                    </div>
                    <a
                      href="https://t.me/DentaMedKlinika_bot"
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ochish</span>
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoginAsNewTenant}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-lg hover:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span>CRM Tizimiga Rahbar Sifatida Kirish 🚀</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. ADD BRANCH MODAL (YANGI FILIAL QO'SHISH)                                */}
      {/* ========================================================================= */}
      {isAddBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddBranchSubmit}
            className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#C5A880]/50 shadow-2xl space-y-4 animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                  {lang === 'uz' ? 'Yangi Filial Qo\'shish' : 'Добавить Филиал'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBranchModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Filial Nomi: *
                </label>
                <input
                  type="text"
                  required
                  value={newBranchData.name}
                  onChange={e => setNewBranchData({ ...newBranchData, name: e.target.value })}
                  placeholder="Masalan: Samarqand Filiali, Chilonzor 2..."
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Manzil va Mo'ljal: *
                </label>
                <input
                  type="text"
                  required
                  value={newBranchData.address}
                  onChange={e => setNewBranchData({ ...newBranchData, address: e.target.value })}
                  placeholder="Shahar, tuman, ko'cha, mo'ljal..."
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Administrator F.I.Sh:
                  </label>
                  <input
                    type="text"
                    value={newBranchData.managerName}
                    onChange={e => setNewBranchData({ ...newBranchData, managerName: e.target.value })}
                    placeholder="Nilufar Karimova"
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Telefon:
                  </label>
                  <input
                    type="text"
                    value={newBranchData.phone}
                    onChange={e => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Xodim Retsepshn PIN-kodi (Ixtiyoriy, avtomatik yaratiladi):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={newBranchData.staffPin}
                  onChange={e => setNewBranchData({ ...newBranchData, staffPin: e.target.value })}
                  placeholder="Masalan: 3002"
                  className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsAddBranchModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Filialni Qo'shish</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SHIFT & Z-REPORT MODAL (SMENA BOSHQARUVI, XARAJAT VA Z-HISOBOT)         */}
      {/* ========================================================================= */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-2xl w-full border border-[#C5A880]/50 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header & Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-center font-bold shadow-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    Smena Boshqaruvi va Z-Hisobot
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Kassa monitoringi, operatsion chiqimlar va kunlik moliyaviy smena yopilishi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShiftModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shift Sub-Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 text-xs font-bold gap-1 pb-1">
              <button
                onClick={() => setShiftTab('status')}
                className={`px-3 py-2 rounded-xl transition ${shiftTab === 'status' ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]' : 'text-gray-500 hover:text-[#112E24] dark:hover:text-[#FAF8F5]'}`}
              >
                📊 Smena Holati
              </button>
              {currentShift && (
                <>
                  <button
                    onClick={() => setShiftTab('expense')}
                    className={`px-3 py-2 rounded-xl transition ${shiftTab === 'expense' ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]' : 'text-gray-500 hover:text-[#112E24] dark:hover:text-[#FAF8F5]'}`}
                  >
                    💸 Xarajat Kiritish
                  </button>
                  <button
                    onClick={() => setShiftTab('close')}
                    className={`px-3 py-2 rounded-xl transition ${shiftTab === 'close' ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]' : 'text-gray-500 hover:text-[#112E24] dark:hover:text-[#FAF8F5]'}`}
                  >
                    🔒 Smenani Yopish
                  </button>
                </>
              )}
              {closedZReport && (
                <button
                  onClick={() => setShiftTab('zreport')}
                  className={`px-3 py-2 rounded-xl transition ${shiftTab === 'zreport' ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]' : 'text-gray-500 hover:text-[#112E24] dark:hover:text-[#FAF8F5]'}`}
                >
                  🖨️ Z-Hisobot Cheki
                </button>
              )}
            </div>

            {/* TAB: STATUS */}
            {shiftTab === 'status' && (
              <div className="space-y-4">
                {!currentShift ? (
                  <div className="p-6 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32] space-y-4 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">Bugungi smena hali ochilmagan</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Kassani qabul qilib olib, ertalabki boshlang'ich kassa qoldig'i bilan smenani oching</p>
                    </div>

                    <div className="max-w-sm mx-auto space-y-3 text-left">
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Kassir / Mas'ul xodim:</label>
                        <input
                          type="text"
                          value={shiftCashierName}
                          onChange={e => setShiftCashierName(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Ertalabki boshlang'ich naqd pul (UZS):</label>
                        <input
                          type="number"
                          value={shiftStartingCash}
                          onChange={e => setShiftStartingCash(Number(e.target.value))}
                          placeholder="Masalan: 500000"
                          className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-mono font-bold"
                        />
                      </div>
                      <button
                        onClick={handleOpenShift}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Kassani Qabul Qilish va Smenani Ochish</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Shift Header */}
                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                            Smena Faol (Ochiq)
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Mas'ul: <b>{currentShift.cashierName}</b> • Ochilgan: {currentShift.openedAt?.split('T')[1]?.slice(0, 5) || 'Bugun'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase">Boshlang'ich Kassa:</div>
                        <div className="font-mono text-xs font-bold text-[#112E24] dark:text-[#FAF8F5]">
                          {(currentShift.startingCash || 0).toLocaleString('uz-UZ')} UZS
                        </div>
                      </div>
                    </div>

                    {/* Live Financial Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Naqd Tushum</div>
                        <div className="font-mono text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {(shiftLiveStats?.cash || 0).toLocaleString('uz-UZ')} UZS
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Karta (Terminal)</div>
                        <div className="font-mono text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">
                          {(shiftLiveStats?.card || 0).toLocaleString('uz-UZ')} UZS
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32]">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">Click / Payme</div>
                        <div className="font-mono text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5">
                          {(shiftLiveStats?.click || 0).toLocaleString('uz-UZ')} UZS
                        </div>
                      </div>
                      <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20">
                        <div className="text-[10px] text-rose-500 uppercase font-bold">Chiqimlar</div>
                        <div className="font-mono text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">
                          -{(shiftLiveStats?.totalExpenses || 0).toLocaleString('uz-UZ')} UZS
                        </div>
                      </div>
                    </div>

                    {/* Safe Expected Cash */}
                    <div className="p-4 rounded-2xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-between shadow-md">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider font-bold opacity-80">
                          Hozir Kassada Kutilayotgan Naqd Pul (Seyfda Bo'lishi Kerak):
                        </div>
                        <div className="text-[10px] opacity-70 mt-0.5">
                          (Boshlang'ich {(currentShift.startingCash || 0).toLocaleString('uz-UZ')} + Naqd {(shiftLiveStats?.cash || 0).toLocaleString('uz-UZ')} - Chiqim {(shiftLiveStats?.totalExpenses || 0).toLocaleString('uz-UZ')})
                        </div>
                      </div>
                      <div className="font-mono text-xl font-black">
                        {(shiftLiveStats?.expectedCash || 0).toLocaleString('uz-UZ')} UZS
                      </div>
                    </div>

                    {/* Expenses List */}
                    {currentShift.expenses && currentShift.expenses.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-600 dark:text-gray-300">Bugungi chiqimlar ro'yxati:</div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {currentShift.expenses.map((exp: any, i: number) => (
                            <div key={i} className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between text-xs">
                              <div>
                                <span className="font-bold text-[#112E24] dark:text-[#FAF8F5]">{exp.recipient}</span>
                                <span className="text-gray-500 text-[11px]"> ({exp.category}) - {exp.comment || "Izohsiz"}</span>
                              </div>
                              <span className="font-mono font-bold text-rose-500">-{(exp.amount || 0).toLocaleString('uz-UZ')} UZS</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShiftTab('expense')}
                        className="flex-1 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/20 transition flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Xarajat Kiritish</span>
                      </button>
                      <button
                        onClick={() => {
                          setShiftActualCash(shiftLiveStats?.expectedCash || 0);
                          setShiftTab('close');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Smenani Yopish (Z-Hisobot)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: EXPENSE */}
            {shiftTab === 'expense' && (
              <div className="space-y-3.5">
                <div className="text-xs text-gray-500">
                  Kassadan chiqarilgan operatsion xarajatlarni qayd etish (material, tushlik, maosh avansi, kommunal)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Kategoriya:</label>
                    <select
                      value={shiftExpenseCategory}
                      onChange={e => setShiftExpenseCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
                    >
                      <option value="materiallar">Tibbiy materiallar / Dori-darmon</option>
                      <option value="maosh">Xodim avansi / Maosh</option>
                      <option value="kommunal">Kommunal / Xo'jalik xarajatlari</option>
                      <option value="reklama">Marketing / Reklama</option>
                      <option value="boshqa">Boshqa chiqimlar</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Chiqim Summasi (UZS): *</label>
                    <input
                      type="number"
                      required
                      value={shiftExpenseAmount}
                      onChange={e => setShiftExpenseAmount(Number(e.target.value))}
                      placeholder="Masalan: 120000"
                      className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Kimga / Qayerga berildi: *</label>
                  <input
                    type="text"
                    required
                    value={shiftExpenseRecipient}
                    onChange={e => setShiftExpenseRecipient(e.target.value)}
                    placeholder="Masalan: DentPlus distribyutor, Kuryer, Tozalash..."
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Izoh:</label>
                  <input
                    type="text"
                    value={shiftExpenseComment}
                    onChange={e => setShiftExpenseComment(e.target.value)}
                    placeholder="Qo'shimcha izoh yoki chek raqami"
                    className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShiftTab('status')}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
                  >
                    Orqaga
                  </button>
                  <button
                    type="button"
                    onClick={handleAddShiftExpense}
                    disabled={shiftExpenseAmount <= 0}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#112E24] font-bold text-xs transition shadow-md active:scale-95"
                  >
                    Chiqimni Kassadan Chiqarish
                  </button>
                </div>
              </div>
            )}

            {/* TAB: CLOSE SHIFT */}
            {shiftTab === 'close' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
                  <div className="font-bold text-amber-800 dark:text-amber-300">
                    Smenani yopish oldidan kassadagi barcha naqd pullarni sanang
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    Tizim bo'yicha kutilayotgan naqd pul: <b className="font-mono text-[#112E24] dark:text-[#FAF8F5]">{(shiftLiveStats?.expectedCash || 0).toLocaleString('uz-UZ')} UZS</b>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                    Kassada sanalgan haqiqiy naqd pul (Actual Cash): *
                  </label>
                  <input
                    type="number"
                    value={shiftActualCash}
                    onChange={e => setShiftActualCash(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border-2 border-[#C5A880] bg-white dark:bg-[#0E231B] font-mono text-base font-bold focus:outline-none"
                  />
                </div>

                {/* Discrepancy Calculation */}
                {(() => {
                  const expected = shiftLiveStats?.expectedCash || 0;
                  const diff = shiftActualCash - expected;
                  return (
                    <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${diff === 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : diff > 0 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500/40 text-blue-700 dark:text-blue-300' : 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/40 text-rose-700 dark:text-rose-300'}`}>
                      <span>Kassa Farqi (Discrepancy):</span>
                      <span className="font-mono text-sm">
                        {diff === 0 ? "0 UZS (Aniq / Mos keldi ✅)" : diff > 0 ? `+${diff.toLocaleString('uz-UZ')} UZS (Ortiqcha / Surplus)` : `${diff.toLocaleString('uz-UZ')} UZS (Kamomad / Deficit ⚠️)`}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShiftTab('status')}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
                  >
                    Orqaga
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseShift}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Smenani Yakunlash va Z-Hisobot</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: Z-REPORT THERMAL PRINT */}
            {shiftTab === 'zreport' && (closedZReport || currentShift) && (
              <div className="space-y-4">
                <div className="bg-[#FAF8F5] text-[#112E24] p-5 rounded-2xl border border-gray-300 font-mono text-[11px] leading-relaxed max-w-sm mx-auto shadow-inner">
                  <div className="text-center pb-2 border-b border-dashed border-gray-400 space-y-0.5">
                    <div className="font-black text-sm uppercase">KUNLIK Z-HISOBOT</div>
                    <div className="text-[10px]">{currentTenant.name}</div>
                    <div className="text-[9px] text-gray-500">Filial: {activeClinicTarget}</div>
                    <div className="text-[9px] text-gray-500">Smena: {(closedZReport || currentShift)?.id}</div>
                  </div>

                  <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>Kassir:</span>
                      <span className="font-bold">{(closedZReport || currentShift)?.cashierName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ochilgan:</span>
                      <span>{(closedZReport || currentShift)?.openedAt?.replace('T', ' ').slice(0, 16)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yopilgan:</span>
                      <span>{(closedZReport || currentShift)?.closedAt?.replace('T', ' ').slice(0, 16) || 'Hozir'}</span>
                    </div>
                  </div>

                  <div className="py-2 border-b border-dashed border-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Boshlang'ich kassa:</span>
                      <span>{((closedZReport || currentShift)?.startingCash || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Naqd tushum:</span>
                      <span>{((closedZReport?.summary?.cashRevenue ?? shiftLiveStats?.cash) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Karta tushum:</span>
                      <span>{((closedZReport?.summary?.cardRevenue ?? shiftLiveStats?.card) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Click tushum:</span>
                      <span>{((closedZReport?.summary?.clickRevenue ?? shiftLiveStats?.click) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Jami chiqimlar:</span>
                      <span>-{((closedZReport?.summary?.totalExpenses ?? shiftLiveStats?.totalExpenses) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1 text-xs font-bold">
                    <div className="flex justify-between">
                      <span>JAMI AYLANMA:</span>
                      <span className="font-black">{((closedZReport?.summary?.totalRevenue ?? ((shiftLiveStats?.cash || 0) + (shiftLiveStats?.card || 0) + (shiftLiveStats?.click || 0))) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Kutilgan naqd pul:</span>
                      <span>{((closedZReport?.expectedCash ?? shiftLiveStats?.expectedCash) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Haqiqiy topshirilgan:</span>
                      <span>{((closedZReport?.actualCash ?? shiftActualCash) || 0).toLocaleString('uz-UZ')} UZS</span>
                    </div>
                    {closedZReport && (
                      <div className={`flex justify-between text-[10px] pt-1 border-t border-dashed border-gray-400 ${closedZReport.difference === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        <span>FARQ / TAFAVUT:</span>
                        <span>{closedZReport.difference === 0 ? "0 UZS (ANIQ)" : `${closedZReport.difference?.toLocaleString('uz-UZ')} UZS`}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShiftTab('status')}
                    className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
                  >
                    Orqaga
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Z-Hisobotni Chop Etish (Termal)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. DEBT PAYMENT MODAL (NASIYA TO'LOVINI QABUL QILISH)                     */}
      {/* ========================================================================= */}
      {isDebtPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-md w-full border border-amber-500/50 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                  Nasiya To'lovini Qabul Qilish
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDebtPayModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-gray-200 dark:border-gray-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Bemor:</span>
                <span className="font-bold text-[#112E24] dark:text-[#FAF8F5]">{selectedDebt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Telefon:</span>
                <span className="font-mono font-semibold">{selectedDebt.phone}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-1">
                <span className="text-gray-500">Umumiy Qarz Qoldig'i:</span>
                <span className="font-mono font-black text-rose-500">{(selectedDebt.debtAmount || 0).toLocaleString('uz-UZ')} UZS</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  To'lanayotgan Summa (UZS): *
                </label>
                <input
                  type="number"
                  max={selectedDebt.debtAmount}
                  value={debtPayAmount}
                  onChange={e => setDebtPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-mono font-black text-emerald-600"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setDebtPayAmount(selectedDebt.debtAmount)}
                    className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold"
                  >
                    100% To'liq So'ndirish
                  </button>
                  {selectedDebt.debtAmount > 100000 && (
                    <button
                      type="button"
                      onClick={() => setDebtPayAmount(Math.round(selectedDebt.debtAmount / 2))}
                      className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold"
                    >
                      50% Qisman
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">To'lov Usuli:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Naqd Pul' },
                    { id: 'card', label: 'Terminal' },
                    { id: 'click', label: 'Click/Payme' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDebtPayMethod(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${debtPayMethod === m.id ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24]' : 'bg-[#FAF8F5] dark:bg-[#07130F] text-gray-500 border-gray-300 dark:border-gray-700'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Izoh:</label>
                <input
                  type="text"
                  value={debtPayNotes}
                  onChange={e => setDebtPayNotes(e.target.value)}
                  placeholder="Kvitansiya #, to'lov sababi..."
                  className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDebtPayModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handlePayDebtSubmit}
                disabled={debtPayAmount <= 0}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>To'lovni Qabul Qilish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
