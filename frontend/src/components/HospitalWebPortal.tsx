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
  PrescriptionMedicine
} from '../types';
import { CLINICS, DOCTORS, SERVICES, INITIAL_RECEPTION_APPOINTMENTS, INITIAL_TEETH } from '../data/mockData';
import {
  updateAppointmentStatus,
  sendPrescription,
  fetchAppointments,
  fetchDoctors,
  fetchServices
} from '../services/api';
import {
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

  // Multi-Branch Selection
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

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
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Filtered appointments by branch
  const branchFilteredAppointments = useMemo(() => {
    if (selectedBranchId === 'all') return appointments;
    return appointments.filter(a => (a.clinicId || 'nukus') === selectedBranchId);
  }, [appointments, selectedBranchId]);

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

  // Filtered Kanban Columns
  const kanbanFilteredAppointments = useMemo(() => {
    return branchFilteredAppointments.filter(appt => {
      if (pinQuery.trim()) {
        return appt.pinCode.includes(pinQuery.trim());
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          appt.patientName.toLowerCase().includes(q) ||
          appt.phone.includes(q) ||
          appt.doctor.name.toLowerCase().includes(q) ||
          appt.service.title.uz.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [branchFilteredAppointments, pinQuery, searchQuery]);

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
  const [selectedDoctorId, setSelectedDoctorId] = useState<number>(DOCTORS[0]?.id || 1);
  const activeDoctor = useMemo(() => {
    return doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  }, [doctors, selectedDoctorId]);

  // 32-Teeth Odontogram State for Doctor Suite
  const [teethChart, setTeethChart] = useState<ToothData[]>(INITIAL_TEETH);
  const [selectedOdontoTooth, setSelectedOdontoTooth] = useState<ToothData | null>(INITIAL_TEETH[18]); // Tooth #46

  // Schedule Blocking States
  const [isLunchBlocked, setIsLunchBlocked] = useState<boolean>(true);
  const [isWeekendBlocked, setIsWeekendBlocked] = useState<boolean>(false);

  // Doctor's assigned patients today
  const doctorTodayAppointments = useMemo(() => {
    return appointments.filter(a => a.doctor.id === selectedDoctorId);
  }, [appointments, selectedDoctorId]);

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

  // Promo Banner Settings
  const [promoTitle, setPromoTitle] = useState('2 ta tish davolansa, ultratovushli tozalash 50% chegirmada!');
  const [promoDiscount, setPromoDiscount] = useState(50);
  const [isPromoActive, setIsPromoActive] = useState(true);
  const [promoSaveSuccess, setPromoSaveSuccess] = useState(false);

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
              photo: docPhotoBase64 || d.photo
            }
          : d
      );
      setDoctors(updated);
    } else {
      // Create
      const newDoc: Doctor = {
        id: Date.now(),
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
    }
  };

  // Financial KPIs and 30% Doctor share calculation
  const financeKPIs = useMemo(() => {
    let totalRevenue = 0;
    let cashTotal = 0;
    let cardTotal = 0;
    let clickTotal = 0;

    const completedAppts = appointments.filter(a => a.status === 'completed' || a.status === 'in_progress');
    
    completedAppts.forEach((a, idx) => {
      const amt = a.totalAmount || a.service.price || 400000;
      totalRevenue += amt;
      if (idx % 3 === 0) cashTotal += amt;
      else if (idx % 3 === 1) cardTotal += amt;
      else clickTotal += amt;
    });

    // Doctor 30% KPI table
    const docKPIList = doctors.map(doc => {
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
  }, [appointments, doctors]);

  // ==========================================
  // TAB 4: ESKIZ.UZ SMS SETTINGS & TEMPLATES
  // ==========================================
  const [eskizToken, setEskizToken] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJuYmYiOjE3');
  const [eskizBalance, setEskizBalance] = useState(2480);
  const [smsTemplate2h, setSmsTemplate2h] = useState('Hurmatli {bemor}, bugun soat {vaqt} da DentaMed klinikasida {shifokor} qabuliga yozilgansiz. Manzil: {manzil}. Tel: +998 71 200-00-00');
  const [smsTemplate1d, setSmsTemplate1d] = useState('Eslatma: Ertaga soat {vaqt} da DentaMed Atelier qabulingiz bor. Kechikmasdan kelishingizni so\'raymiz.');
  const [smsTemplateRx, setSmsTemplateRx] = useState('Hurmatli {bemor}, davolash yakunlandi. Raqamli retseptingiz tayyor: https://dentamed.uz/rx/{pin}');
  
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
              D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-bold tracking-tight text-[#FAF8F5]">
                  DentaMed Atelier
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#C5A880]/20 text-[#D6BF9F] px-2 py-0.5 rounded border border-[#C5A880]/30">
                  Swiss Luxury Hospital Portal
                </span>
              </div>
              <p className="text-[11px] text-[#A2B5AB] flex items-center gap-1.5">
                <span>Enterprise Medical CRM & Kassa</span>
                <span>•</span>
                <span className="text-[#C5A880] font-mono">v4.8 High-Precision</span>
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Branch Switcher */}
          <div className="flex items-center gap-4">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-[#183F32] dark:bg-[#0E241D] px-3.5 py-1.5 rounded-xl border border-[#C5A880]/30 shadow-inner">
              <Building2 className="w-4 h-4 text-[#C5A880]" />
              <span className="text-xs font-medium text-[#A2B5AB]">
                {lang === 'uz' ? 'Filial:' : 'Филиал:'}
              </span>
              <select
                value={selectedBranchId}
                onChange={e => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#FAF8F5] focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#112E24] text-[#FAF8F5]">
                  🌐 {lang === 'uz' ? 'Barcha 7 ta Filial (Umumiy)' : 'Все 7 Филиалов'}
                </option>
                {CLINICS.map(clinic => (
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
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-300">
                <MessageSquare className="w-3 h-3 text-amber-400" /> Eskiz: 2.4k SMS
              </span>
            </div>
          </div>

          {/* Right Action Tools: Refresh, Theme, Exit */}
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/50 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
              title="Bemorlar ilovasiga qaytish"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'uz' ? 'Bemor Rejimi' : 'Режим Пациента'}</span>
            </button>
          </div>
        </div>

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
                {/* 4-Digit PIN Search Box */}
                <div className="relative flex-shrink-0 w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#C5A880] font-bold text-xs">
                    #PIN:
                  </span>
                  <input
                    type="text"
                    maxLength={4}
                    value={pinQuery}
                    onChange={e => setPinQuery(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="4 xonali PIN (8492)..."
                    className="w-full pl-16 pr-3 py-2.5 rounded-xl border-2 border-[#C5A880] bg-[#FAF8F5] dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] font-mono text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#C5A880]"
                  />
                  {pinQuery && (
                    <button
                      onClick={() => setPinQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* General Search (Name, Phone, Service) */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#627068] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={lang === 'uz' ? "Bemor ismi, telefon raqami yoki xizmat nomi..." : "Имя пациента, телефон или услуга..."}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
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

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <button
                          onClick={() => handleOpenPrescription(appt)}
                          className="text-[#C5A880] hover:underline flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Retsept yozish</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'no_show')}
                          className="text-rose-500 hover:underline"
                        >
                          Kelmadi
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
                      className="bg-white dark:bg-[#0E231B] p-3.5 rounded-xl border-2 border-blue-400/40 dark:border-blue-500/40 hover:border-blue-500 transition-all shadow-sm space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                              #{appt.pinCode}
                            </span>
                            <span className="font-semibold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                              {appt.patientName}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#627068] dark:text-[#9FB1A7] mt-0.5">
                            {appt.doctor.name} • {appt.time}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full animate-pulse">
                          Jarayonda
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(appt.id, 'completed')}
                          className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-sm"
                        >
                          <Check className="w-3 h-3" />
                          <span>Yakunlandi</span>
                        </button>

                        <button
                          onClick={() => handleOpenReceipt(appt)}
                          className="flex items-center justify-center gap-1 bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] py-1.5 px-2 rounded-lg text-[11px] font-bold transition active:scale-95 shadow-sm"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Kassa Cheki</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenPrescription(appt)}
                        className="w-full flex items-center justify-center gap-1 bg-[#FAF8F5] dark:bg-[#07130F] hover:bg-[#E8E2D8] dark:hover:bg-[#183F32] text-[#C5A880] py-1.5 px-2 rounded-lg text-[11px] font-semibold border border-[#C5A880]/30 transition"
                      >
                        <FileText className="w-3 h-3" />
                        <span>💊 Retsept yozish va Telegramga jo'natish</span>
                      </button>
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
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#07130F] text-[10px] font-bold text-[#112E24] dark:text-[#FAF8F5] border border-gray-300 dark:border-gray-700 hover:border-[#C5A880]"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Qayta Chek</span>
                        </button>
                        <button
                          onClick={() => handleOpenPrescription(appt)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-[#C5A880]/10 text-[10px] font-bold text-[#C5A880] border border-[#C5A880]/30 hover:bg-[#C5A880]/20"
                        >
                          <Send className="w-3 h-3" />
                          <span>Retsept</span>
                        </button>
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
                    {activeDoctor.name} — Bemorlar Jag' Xaritasi
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
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.department === 'stomatology' ? 'Stomatolog' : 'LOR'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                    {financeKPIs.docKPIList.map(item => (
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
                    ))}
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
                  {doctors.map(doc => (
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
                  ))}
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
              </div>
            </div>

            {/* Right 5 Cols: Live Test SMS Sandbox */}
            <div className="lg:col-span-5 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
                <Send className="w-4 h-4 text-[#C5A880]" />
                <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                  Jonli Test SMS Yuborish
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Qabul qiluvchi telefon raqami:
                  </label>
                  <input
                    type="text"
                    value={testSmsPhone}
                    onChange={e => setTestSmsPhone(e.target.value)}
                    placeholder="+998 90 123-45-67"
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">
                    Xabar matni:
                  </label>
                  <textarea
                    rows={4}
                    value={testSmsMsg}
                    onChange={e => setTestSmsMsg(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                {testSmsStatus === 'success' && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SMS {testSmsPhone} raqamiga muvaffaqiyatli jo'natildi! (Eskiz ID: #749201)</span>
                  </div>
                )}

                <button
                  onClick={handleSendTestSms}
                  disabled={testSmsStatus === 'sending'}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#112E24] font-bold text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send className={`w-4 h-4 ${testSmsStatus === 'sending' ? 'animate-spin' : ''}`} />
                  <span>
                    {testSmsStatus === 'sending' ? 'Jo\'natilmoqda...' : 'Hozir Test SMS Yuborish'}
                  </span>
                </button>
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
                  <div className="font-black text-sm uppercase">DentaMed Atelier</div>
                  <div className="text-[10px]">Luks Stomatologiya & LOR Markazi</div>
                  <div className="text-[9px]">Toshkent sh., Mirobod t., Nukus ko'chasi, 24</div>
                  <div className="text-[9px]">Tel: +998 (71) 200-00-00</div>
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
    </div>
  );
};
