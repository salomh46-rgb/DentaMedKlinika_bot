import React, { useState, useMemo, useEffect } from 'react';
import { Language, Appointment, AppointmentStatus, ClinicId, Prescription, PrescriptionMedicine, StaffSession } from '../types';
import { CLINICS } from '../data/mockData';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  UserX,
  Pill,
  Send,
  X,
  Phone,
  Building2,
  Check,
  Plus,
  Trash2,
  Hash,
  Stethoscope,
  RefreshCw,
  Crown,
  Lock,
  TrendingUp,
  Coins,
  Users,
  MapPin
} from 'lucide-react';
import { updateAppointmentStatus, sendPrescription } from '../services/api';
import { showTelegramAlert } from '../utils/telegramAlerts';

interface ReceptionDashboardProps {
  lang: Language;
  appointments: Appointment[];
  onAppointmentsChange: (updated: Appointment[]) => void;
  selectedClinicId: ClinicId;
  onSelectClinic: (clinicId: ClinicId) => void;
  staffSession?: StaffSession | null;
  onRefresh?: () => void;
}

const COMMON_RECOMMENDATIONS = [
  { id: 'no_eat_2h', uz: '2 soat ovqat yemang va suv ichmang', ru: 'Не есть и не пить 2 часа' },
  { id: 'ice_pack', uz: 'Yonoqqa muz bosing (15 daqiqadan tanaffus bilan)', ru: 'Прикладывать холод к щеке (по 15 мин)' },
  { id: 'soft_food', uz: 'Issiq, qattiq va achchiq taomlardan tiyiling', ru: 'Исключить горячую, твердую и острую пищу' },
  { id: 'mouthwash', uz: 'Tish ipi va antiseptik chayish vositasidan foydalaning', ru: 'Использовать зубную нить и антисептические ополаскиватели' },
  { id: 'no_smoking', uz: 'Chekish va spirtli ichimliklardan saqlaning', ru: 'Воздержаться от курения и алкоголя' },
  { id: 'control_visit', uz: '3 kundan so\'ng qayta nazorat ko\'rigiga keling', ru: 'Прийти на контрольный осмотр через 3 дня' }
];

const QUICK_MEDICINE_TEMPLATES: PrescriptionMedicine[] = [
  { name: 'Nimesil', dosage: '100 mg', frequency: 'Og\'riq bo\'lganda 1 paket', duration: '3 kun' },
  { name: 'Amoksiklav', dosage: '625 mg', frequency: 'Kuniga 2 mahal, ovqatdan so\'ng', duration: '5 kun' },
  { name: 'Metrogil Denta', dosage: 'Gel', frequency: 'Milklarga surtish, kuniga 2 mahal', duration: '7 kun' },
  { name: 'Xlorgeksidin', dosage: '0.05% eritma', frequency: 'Kuniga 3 mahal og\'izni chayish', duration: '5 kun' },
  { name: 'Loratadin', dosage: '10 mg', frequency: 'Kuniga 1 tabletka kechqurun', duration: '3 kun' }
];

export const ReceptionDashboard: React.FC<ReceptionDashboardProps> = ({
  lang,
  appointments,
  onAppointmentsChange,
  selectedClinicId,
  onSelectClinic,
  staffSession = null,
  onRefresh
}) => {
  const isReception = staffSession?.role === 'reception';
  const isDirector = staffSession?.isDirector;
  const lockedClinicId = isReception && staffSession?.clinicId ? staffSession.clinicId : null;

  const [pinSearch, setPinSearch] = useState<string>('');
  const [generalSearch, setGeneralSearch] = useState<string>('');
  const [clinicFilter, setClinicFilter] = useState<'all' | ClinicId>(lockedClinicId || (isDirector ? 'all' : selectedClinicId));

  // If receptionist is logged in, strictly enforce their assigned branch
  useEffect(() => {
    if (lockedClinicId) {
      setClinicFilter(lockedClinicId);
      onSelectClinic(lockedClinicId);
    }
  }, [lockedClinicId, onSelectClinic]);

  // Multi-Branch Stats Calculation (Nukus: 12, Chilonzor: 8, Yunusobod: 5, Samarqand: 6, Buxoro: 4)
  const branchStats = useMemo(() => {
    const relevantClinics = CLINICS.filter(c => {
      if (staffSession?.tenantId && staffSession.tenantId !== 'all') {
        return c.tenantId === staffSession.tenantId;
      }
      return true;
    });

    let totalRevenue = 0;
    let totalPatients = 0;

    const list = relevantClinics.map(clinic => {
      const branchAppts = appointments.filter(a => (a.clinicId || 'nukus') === clinic.id);
      const count = branchAppts.length;
      const revenue = branchAppts
        .filter(a => a.status !== 'cancelled' && a.status !== 'no_show')
        .reduce((sum, a) => sum + (a.totalAmount ?? a.service?.price ?? 0), 0);

      totalPatients += count;
      totalRevenue += revenue;

      return {
        clinic,
        count,
        revenue
      };
    });

    return {
      list,
      totalPatients,
      totalRevenue
    };
  }, [appointments, staffSession]);

  // Prescription Modal State
  const [prescriptionAppt, setPrescriptionAppt] = useState<Appointment | null>(null);
  const [selectedRecommendations, setSelectedRecommendations] = useState<string[]>([
    COMMON_RECOMMENDATIONS[0].uz,
    COMMON_RECOMMENDATIONS[2].uz
  ]);
  const [medicines, setMedicines] = useState<PrescriptionMedicine[]>([
    { ...QUICK_MEDICINE_TEMPLATES[0] }
  ]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSendingPrescription, setIsSendingPrescription] = useState<boolean>(false);
  const [prescriptionSuccessMsg, setPrescriptionSuccessMsg] = useState<string | null>(null);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
      // Receptionist strictly sees only their branch
      if (lockedClinicId) {
        const apptClinic = appt.clinicId || 'nukus';
        if (apptClinic !== lockedClinicId) return false;
      } else if (clinicFilter !== 'all') {
        const apptClinic = appt.clinicId || 'nukus';
        if (apptClinic !== clinicFilter) return false;
      }

      // PIN-code search (exact or partial match)
      if (pinSearch.trim()) {
        const cleanPin = pinSearch.trim();
        if (!appt.pinCode.includes(cleanPin)) return false;
      }

      // General search (name, phone, doctor, id)
      if (generalSearch.trim()) {
        const query = generalSearch.toLowerCase().trim();
        const nameMatch = appt.patientName.toLowerCase().includes(query);
        const phoneMatch = appt.phone.includes(query);
        const idMatch = appt.id.toLowerCase().includes(query);
        const docMatch = appt.doctor.name.toLowerCase().includes(query);
        if (!nameMatch && !phoneMatch && !idMatch && !docMatch) return false;
      }

      return true;
    });
  }, [appointments, lockedClinicId, clinicFilter, pinSearch, generalSearch]);

  // Group into 4 Kanban Columns
  const waitingList = filteredAppointments.filter(
    a => a.status === 'waiting' || a.status === 'confirmed' || a.status === 'pending'
  );
  const inProgressList = filteredAppointments.filter(a => a.status === 'in_progress');
  const completedList = filteredAppointments.filter(a => a.status === 'completed');
  const noShowList = filteredAppointments.filter(a => a.status === 'no_show' || a.status === 'cancelled');

  // Change Appointment Status
  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const updated = appointments.map(a => (a.id === appointmentId ? { ...a, status: newStatus } : a));
    onAppointmentsChange(updated);

    try {
      localStorage.setItem('dentamed_reception_appts', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Server API sync
    await updateAppointmentStatus(appointmentId, newStatus);
  };

  // Open Prescription Wizard
  const handleOpenPrescription = (appt: Appointment) => {
    setPrescriptionAppt(appt);
    setSelectedRecommendations([
      lang === 'uz' ? COMMON_RECOMMENDATIONS[0].uz : COMMON_RECOMMENDATIONS[0].ru,
      lang === 'uz' ? COMMON_RECOMMENDATIONS[2].uz : COMMON_RECOMMENDATIONS[2].ru
    ]);
    setMedicines([{ ...QUICK_MEDICINE_TEMPLATES[0] }]);
    setCustomNotes('');
    setPrescriptionSuccessMsg(null);
  };

  // Toggle recommendation
  const toggleRecommendation = (text: string) => {
    if (selectedRecommendations.includes(text)) {
      setSelectedRecommendations(selectedRecommendations.filter(r => r !== text));
    } else {
      setSelectedRecommendations([...selectedRecommendations, text]);
    }
  };

  // Add medicine
  const handleAddMedicine = (template?: PrescriptionMedicine) => {
    if (template) {
      setMedicines([...medicines, { ...template }]);
    } else {
      setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
    }
  };

  // Update medicine field
  const handleUpdateMedicine = (index: number, field: keyof PrescriptionMedicine, val: string) => {
    const next = [...medicines];
    next[index] = { ...next[index], [field]: val };
    setMedicines(next);
  };

  // Remove medicine
  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // Send Prescription to Backend / Telegram
  const handleSendPrescription = async () => {
    if (!prescriptionAppt) return;

    setIsSendingPrescription(true);
    const validMeds = medicines.filter(m => m.name.trim().length > 0);
    const serviceTitle = prescriptionAppt.service?.title
      ? (typeof prescriptionAppt.service.title === 'object' ? prescriptionAppt.service.title[lang] || prescriptionAppt.service.title.uz : prescriptionAppt.service.title)
      : 'Stomatologik / LOR ko\'rigi va muolajasi';

    const newPrescription: Prescription = {
      id: 'RX-' + Math.floor(100000 + Math.random() * 900000),
      appointmentId: prescriptionAppt.id,
      pinCode: prescriptionAppt.pinCode,
      patientName: prescriptionAppt.patientName,
      phone: prescriptionAppt.phone,
      doctorName: prescriptionAppt.doctor.name,
      clinicId: prescriptionAppt.clinicId || selectedClinicId,
      date: new Date().toISOString().split('T')[0],
      medicines: validMeds,
      medications: validMeds,
      diagnosis: `${serviceTitle} (Qabul: ${prescriptionAppt.date} ${prescriptionAppt.time})`,
      recommendations: selectedRecommendations,
      customNotes: customNotes.trim(),
      createdAt: new Date().toISOString(),
      telegramUserId: prescriptionAppt.telegramUserId
    };

    const res = await sendPrescription(newPrescription);
    setIsSendingPrescription(false);

    if (res.ok) {
      setPrescriptionSuccessMsg(
        lang === 'uz'
          ? 'Retsept bemorning Telegramiga va elektron tibbiy kartasiga muvaffaqiyatli yuborildi!'
          : 'Рецепт успешно отправлен пациенту в Telegram и электронную карту!'
      );
      setTimeout(() => {
        setPrescriptionAppt(null);
        setPrescriptionSuccessMsg(null);
      }, 2200);
    } else {
      showTelegramAlert(
        lang === 'uz'
          ? 'Retsept saqlandi, ammo Telegram bot orqali jo\'natishda xatolik yuz berdi.'
          : 'Рецепт сохранен локально.'
      );
      setPrescriptionAppt(null);
    }
  };

  // PIN Exact Match Highlight
  const exactPinMatch = pinSearch.trim().length === 4
    ? appointments.find(a => a.pinCode === pinSearch.trim())
    : null;

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Top Banner & Clinic Triage Controller */}
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-4 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-3">
        {/* DIRECTOR VIEW: Multi-Branch Network Header */}
        {isDirector ? (
          <div className="bg-gradient-to-r from-[#112E24] via-[#183F32] to-[#0A1A14] text-[#FAF8F5] p-4 rounded-2xl border border-[#C5A880]/40 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#C5A880]/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C5A880] to-[#8C6D3F] text-[#112E24] flex items-center justify-center font-bold text-xl shadow-lg flex-shrink-0">
                  <Crown className="w-6 h-6 text-[#112E24]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif font-bold text-base sm:text-lg text-white tracking-wide">
                      {staffSession?.titleUz || (lang === 'uz' ? '👑 Klinika Rahbari (Barcha 5 ta filial)' : '👑 Руководитель (Все 5 филиалов)')}
                    </h2>
                    <span className="bg-[#C5A880] text-[#112E24] text-[9.5px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      CEO Access
                    </span>
                  </div>
                  <p className="text-xs text-[#D6BF9F] mt-0.5">
                    {lang === 'uz'
                      ? `Xodim: ${staffSession?.staffName || 'Dr. Jamshid Rustamov'} • 5 ta filial bo'yicha markaziy kassa va navbatlar nazorati`
                      : `Руководитель: ${staffSession?.staffName || 'Dr. Jamshid Rustamov'} • Центральный контроль кассы и очередей`}
                  </p>
                </div>
              </div>

              {/* Total Aggregate Metrics */}
              <div className="flex items-center gap-2 bg-[#07130F]/60 p-2 rounded-xl border border-[#C5A880]/30 text-xs">
                <div className="px-2 text-center border-r border-[#C5A880]/30">
                  <div className="text-[10px] text-[#D6BF9F]">Jami Bemorlar</div>
                  <div className="font-serif font-bold text-base text-white">{branchStats.totalPatients} ta</div>
                </div>
                <div className="px-2 text-center">
                  <div className="text-[10px] text-[#D6BF9F]">Umumiy Kassa</div>
                  <div className="font-serif font-bold text-sm text-[#C5A880]">
                    {branchStats.totalRevenue.toLocaleString('uz-UZ')} so'm
                  </div>
                </div>
              </div>
            </div>

            {/* FILIALLAR STATISTIKASI (Multi-Branch Indicator Cards) */}
            <div className="pt-3">
              <div className="text-[10.5px] font-bold uppercase tracking-wider text-[#D6BF9F] mb-2 flex items-center justify-between">
                <span>📊 {lang === 'uz' ? 'Filiallar Ko\'rsatkichlari (Bemorlar & Kassa):' : 'Показатели филиалов:'}</span>
                <span className="text-[10px] text-[#FAF8F5]/70 normal-case">
                  {lang === 'uz' ? 'Filialni tanlash uchun kartochkani bosing' : 'Нажмите для перехода к филиалу'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {branchStats.list.map(({ clinic, count, revenue }) => {
                  const isSelected = clinicFilter === clinic.id;
                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => {
                        setClinicFilter(clinic.id);
                        onSelectClinic(clinic.id);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#C5A880] text-[#112E24] border-white shadow-lg scale-[1.02]'
                          : 'bg-[#0E231B]/80 hover:bg-[#133025] text-[#FAF8F5] border-[#C5A880]/30 hover:border-[#C5A880]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-[#112E24]' : 'text-white'}`}>
                          {clinic.branchName.uz}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[#112E24] animate-ping" />
                        )}
                      </div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className={`font-serif font-extrabold text-sm ${isSelected ? 'text-[#112E24]' : 'text-[#C5A880]'}`}>
                          {count} {lang === 'uz' ? 'bemor' : 'пац.'}
                        </span>
                        <span className={`text-[9.5px] font-semibold ${isSelected ? 'text-[#112E24]/80' : 'text-[#FAF8F5]/70'}`}>
                          {clinic.badge.split(' ')[0]}
                        </span>
                      </div>
                      <div className={`text-[10px] font-medium mt-1 truncate ${isSelected ? 'text-[#112E24]/90' : 'text-[#D6BF9F]'}`}>
                        💰 {revenue.toLocaleString('uz-UZ')} so'm
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 1-Click Quick Branch Switcher Pills */}
              <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setClinicFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 shadow-sm ${
                    clinicFilter === 'all'
                      ? 'bg-white text-[#112E24] ring-2 ring-[#C5A880]'
                      : 'bg-[#07130F] text-[#D6BF9F] hover:text-white border border-[#C5A880]/30'
                  }`}
                >
                  <span>🌟 {lang === 'uz' ? 'Barcha 5 ta filial' : 'Все 5 филиалов'}</span>
                  <span className="text-[10px] opacity-80">({branchStats.totalPatients})</span>
                </button>

                {branchStats.list.map(({ clinic, count }) => {
                  const isCur = clinicFilter === clinic.id;
                  return (
                    <button
                      key={clinic.id}
                      type="button"
                      onClick={() => {
                        setClinicFilter(clinic.id);
                        onSelectClinic(clinic.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                        isCur
                          ? 'bg-[#C5A880] text-[#112E24] font-bold shadow-sm'
                          : 'bg-[#07130F] text-[#FAF8F5]/80 hover:text-white border border-[#C5A880]/20'
                      }`}
                    >
                      <Building2 className="w-3 h-3 text-[#C5A880]" />
                      <span>{clinic.branchName.uz}</span>
                      <span className="text-[10px] opacity-75 font-bold">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : isReception ? (
          /* RECEPTIONIST VIEW: Strict Single-Branch Isolation */
          <div className="bg-gradient-to-r from-emerald-900/90 to-[#112E24] text-white p-4 rounded-2xl border border-emerald-500/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow-md flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                    📍 {CLINICS.find(c => c.id === (lockedClinicId || selectedClinicId))?.name || 'Filial Retsepshni'}
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Qulflangan
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  {lang === 'uz'
                    ? `Mas'ul xodim: ${staffSession?.staffName || 'Retsepshn'} • Ushbu hisob FAQAT o'z filiali navbatlarini ko'radi va boshqaradi`
                    : `Сотрудник: ${staffSession?.staffName || 'Ресепшн'} • Доступ ограничен текущим филиалом`}
                </p>
              </div>
            </div>

            <div className="bg-black/30 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'uz' ? 'Filial xavfsizligi faol' : 'Безопасность филиала активна'}</span>
            </div>
          </div>
        ) : (
          /* GENERAL / DEFAULT VIEW */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#112E24] text-[#C5A880] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                🏥
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    {lang === 'uz' ? 'Retsepshn Veb-Doskasi' : 'Ресепшн Веб-Доска'}
                  </h2>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {lang === 'uz' ? 'Jonli Navbat' : 'Живая очередь'}
                  </span>
                </div>
                <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                  {lang === 'uz'
                    ? 'Klinikaga kelgan bemorlarni 4 xonali PIN bilan kutib olish va yo\'naltirish'
                    : 'Встреча и маршрутизация пациентов по 4-значному PIN-коду'}
                </p>
              </div>
            </div>

            {/* Clinic Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#07130F] p-1 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] overflow-x-auto no-scrollbar">
              <button
                onClick={() => setClinicFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  clinicFilter === 'all'
                    ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] shadow-sm'
                    : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E]'
                }`}
              >
                {lang === 'uz' ? 'Barcha filiallar' : 'Все филиалы'}
              </button>
              {CLINICS.map(clinic => (
                <button
                  key={clinic.id}
                  onClick={() => {
                    setClinicFilter(clinic.id);
                    onSelectClinic(clinic.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 whitespace-nowrap ${
                    clinicFilter === clinic.id
                      ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] shadow-sm'
                      : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E]'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>{lang === 'uz' ? clinic.branchName.uz : clinic.branchName.ru}</span>
                </button>
              ))}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-1.5 text-[#627068] hover:text-[#C5A880] rounded-xl transition flex-shrink-0"
                  title="Yangilash"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4-DIGIT PIN QUICK SEARCH & GENERAL SEARCH */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
          {/* Large 4-digit PIN Box */}
          <div className="md:col-span-5 bg-gradient-to-r from-[#112E24] to-[#183F32] p-3 rounded-2xl text-[#FAF8F5] border border-[#C5A880]/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-[#D6BF9F] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{lang === 'uz' ? '4 xonali PIN-kod Tezkor Qidiruv:' : 'Быстрый поиск по 4-значному PIN:'}</span>
              </label>
              {pinSearch && (
                <button
                  onClick={() => setPinSearch('')}
                  className="text-[10px] text-[#D6BF9F] hover:text-white underline"
                >
                  {lang === 'uz' ? 'Tozalash' : 'Очистить'}
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pinSearch}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinSearch(val);
                }}
                placeholder="Masalan: 8492"
                className="w-full bg-[#07130F]/70 border-2 border-[#C5A880] focus:border-white rounded-xl px-4 py-2 text-xl font-mono font-bold tracking-[0.3em] text-[#C5A880] placeholder:text-[#C5A880]/30 placeholder:tracking-normal placeholder:text-xs placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-[#C5A880]/50 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#D6BF9F] pointer-events-none">
                {pinSearch.length}/4
              </span>
            </div>
            <p className="text-[10px] text-[#FAF8F5]/80 mt-1">
              {lang === 'uz'
                ? 'Bemor kelganda talonidagi 4 xonali kodni kiriting — kartochka darhol topiladi.'
                : 'Введите 4-значный код из талона пациента для мгновенного поиска.'}
            </p>
          </div>

          {/* General Name / Phone Search */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-2">
            <div>
              <label className="text-xs font-semibold text-[#112E24] dark:text-[#FAF8F5] mb-1 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{lang === 'uz' ? 'Bemor ismi yoki telefoni bo\'yicha qidiruv:' : 'Поиск по имени или телефону:'}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={generalSearch}
                  onChange={e => setGeneralSearch(e.target.value)}
                  placeholder={lang === 'uz' ? 'Ism, telefon raqami yoki talon raqami...' : 'Имя, телефон или номер талона...'}
                  className="w-full bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32] rounded-xl p-2.5 pl-9 text-xs text-[#1A221E] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                />
                <Search className="w-4 h-4 text-[#627068] absolute left-3 top-1/2 -translate-y-1/2" />
                {generalSearch && (
                  <button
                    onClick={() => setGeneralSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#627068] hover:text-[#1A221E]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <div className="bg-[#FAF8F5] dark:bg-[#07130F] p-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] text-center">
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">⏳ Kutilmoqda</div>
                <div className="font-serif font-bold text-sm text-amber-600 dark:text-amber-400">{waitingList.length}</div>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#07130F] p-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] text-center">
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">🟢 Xonada</div>
                <div className="font-serif font-bold text-sm text-emerald-600 dark:text-emerald-400">{inProgressList.length}</div>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#07130F] p-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] text-center">
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">✅ Yakunlandi</div>
                <div className="font-serif font-bold text-sm text-teal-600 dark:text-teal-400">{completedList.length}</div>
              </div>
              <div className="bg-[#FAF8F5] dark:bg-[#07130F] p-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] text-center">
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">⚠️ Kelmadi</div>
                <div className="font-serif font-bold text-sm text-rose-500">{noShowList.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PIN Match Highlight Notification Banner */}
        {exactPinMatch && (
          <div className="mt-3 p-3 bg-[#112E24] text-[#FAF8F5] rounded-2xl border-2 border-[#C5A880] flex items-center justify-between shadow-lg animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A880] text-[#112E24] flex items-center justify-center font-bold text-xl">
                ✓
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D6BF9F]">
                  🎯 PIN MOS KELDI: {exactPinMatch.pinCode}
                </span>
                <h4 className="font-serif font-bold text-sm text-white">
                  {exactPinMatch.patientName} — {exactPinMatch.time} ({exactPinMatch.doctor.name})
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusChange(exactPinMatch.id, 'in_progress')}
                className="bg-[#C5A880] hover:bg-[#D6BF9F] text-[#112E24] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'uz' ? 'Xonaga kirdi' : 'В кабинет'}</span>
              </button>
              <button
                onClick={() => handleOpenPrescription(exactPinMatch)}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1"
              >
                <Pill className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{lang === 'uz' ? 'Retsept' : 'Рецепт'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* JONLI NAVBAT USTUNLARI (4 KANBAN COLUMNS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
        {/* USTUN 1: KUTILMOQDA (Waiting) */}
        <div className="bg-[#FAF8F5] dark:bg-[#07130F] rounded-3xl p-3 border border-amber-200 dark:border-amber-900/40 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/40">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1">
                <span>⏳ {lang === 'uz' ? 'Kutilmoqda' : 'Ожидаются'}</span>
              </h3>
            </div>
            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300">
              {waitingList.length}
            </span>
          </div>

          <div className="space-y-2.5 min-h-[160px]">
            {waitingList.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#627068] dark:text-[#9FB1A7]/60 italic">
                {lang === 'uz' ? 'Kutilayotgan bemorlar yo\'q' : 'Нет ожидающих пациентов'}
              </div>
            ) : (
              waitingList.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  lang={lang}
                  onStatusChange={handleStatusChange}
                  onOpenPrescription={handleOpenPrescription}
                  isHighlighted={pinSearch === appt.pinCode}
                />
              ))
            )}
          </div>
        </div>

        {/* USTUN 2: XONAGA KIRDI (In Progress) */}
        <div className="bg-[#FAF8F5] dark:bg-[#07130F] rounded-3xl p-3 border border-emerald-300 dark:border-emerald-800/50 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-300 dark:border-emerald-800/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1">
                <span>🟢 {lang === 'uz' ? 'Xonaga kirdi' : 'В кабинете'}</span>
              </h3>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-400">
              {inProgressList.length}
            </span>
          </div>

          <div className="space-y-2.5 min-h-[160px]">
            {inProgressList.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#627068] dark:text-[#9FB1A7]/60 italic">
                {lang === 'uz' ? 'Hozirda muolajada bemor yo\'q' : 'Сейчас на приеме никого нет'}
              </div>
            ) : (
              inProgressList.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  lang={lang}
                  onStatusChange={handleStatusChange}
                  onOpenPrescription={handleOpenPrescription}
                  isHighlighted={pinSearch === appt.pinCode}
                />
              ))
            )}
          </div>
        </div>

        {/* USTUN 3: MUOLAJA YAKUNLANDI (Completed) */}
        <div className="bg-[#FAF8F5] dark:bg-[#07130F] rounded-3xl p-3 border border-teal-300 dark:border-teal-800/50 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-teal-300 dark:border-teal-800/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                ✅ {lang === 'uz' ? 'Yakunlandi' : 'Завершено'}
              </h3>
            </div>
            <span className="bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-teal-400">
              {completedList.length}
            </span>
          </div>

          <div className="space-y-2.5 min-h-[160px]">
            {completedList.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#627068] dark:text-[#9FB1A7]/60 italic">
                {lang === 'uz' ? 'Bugun yakunlanganlar yo\'q' : 'Завершенных записей пока нет'}
              </div>
            ) : (
              completedList.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  lang={lang}
                  onStatusChange={handleStatusChange}
                  onOpenPrescription={handleOpenPrescription}
                  isHighlighted={pinSearch === appt.pinCode}
                />
              ))
            )}
          </div>
        </div>

        {/* USTUN 4: KECHIKMOQDA / KELMADI (No show) */}
        <div className="bg-[#FAF8F5] dark:bg-[#07130F] rounded-3xl p-3 border border-rose-200 dark:border-rose-900/40 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-900/40">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <h3 className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                ⚠️ {lang === 'uz' ? 'Kelmadi' : 'Не пришел'}
              </h3>
            </div>
            <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-300">
              {noShowList.length}
            </span>
          </div>

          <div className="space-y-2.5 min-h-[160px]">
            {noShowList.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#627068] dark:text-[#9FB1A7]/60 italic">
                {lang === 'uz' ? 'Kechikkanlar mavjud emas' : 'Нет непришедших'}
              </div>
            ) : (
              noShowList.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  lang={lang}
                  onStatusChange={handleStatusChange}
                  onOpenPrescription={handleOpenPrescription}
                  isHighlighted={pinSearch === appt.pinCode}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* RAQAMLI RETSEPT YOZISH MODALI (Prescription Wizard) */}
      {prescriptionAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0A1A14] rounded-3xl shadow-2xl border border-[#C5A880]/50 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-[#112E24] text-[#FAF8F5] flex items-center justify-between border-b border-[#C5A880]/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#C5A880] text-[#112E24] flex items-center justify-center shadow-sm">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                    {lang === 'uz' ? 'Raqamli Retsept Yozish' : 'Электронный Рецепт'}
                  </h3>
                  <p className="text-[10.5px] text-[#D6BF9F]">
                    {prescriptionAppt.patientName} • {prescriptionAppt.phone} (PIN: {prescriptionAppt.pinCode})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPrescriptionAppt(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              {prescriptionSuccessMsg ? (
                <div className="p-6 text-center space-y-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-300">
                  <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center text-2xl animate-bounce">
                    ✓
                  </div>
                  <h4 className="font-serif font-bold text-base text-emerald-800 dark:text-emerald-200">
                    {prescriptionSuccessMsg}
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {lang === 'uz' ? 'Bemorga Telegram orqali xabarnoma yetkazildi.' : 'Уведомление отправлено в Telegram.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Doctor & Clinic Info Badge */}
                  <div className="bg-[#FAF8F5] dark:bg-[#0E231B] p-2.5 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-[#C5A880]" />
                      <span className="font-bold text-[#112E24] dark:text-[#FAF8F5]">{prescriptionAppt.doctor.name}</span>
                    </div>
                    <span className="text-[#627068] dark:text-[#9FB1A7]">
                      {prescriptionAppt.service.title.uz}
                    </span>
                  </div>

                  {/* 1. Shifokor Tavsiyalari (Checkboxes) */}
                  <div>
                    <label className="block font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] mb-2 flex items-center gap-1.5">
                      <span>🩺</span>
                      <span>{lang === 'uz' ? 'Shifokor Tavsiyalari (Keraklisini tanlang):' : 'Рекомендации Врача:'}</span>
                    </label>

                    <div className="space-y-1.5">
                      {COMMON_RECOMMENDATIONS.map(rec => {
                        const label = lang === 'uz' ? rec.uz : rec.ru;
                        const isChecked = selectedRecommendations.includes(label);
                        return (
                          <div
                            key={rec.id}
                            onClick={() => toggleRecommendation(label)}
                            className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                              isChecked
                                ? 'bg-[#112E24]/5 dark:bg-[#183F32]/50 border-[#C5A880] text-[#112E24] dark:text-[#FAF8F5] font-medium'
                                : 'bg-[#FAF8F5] dark:bg-[#07130F] border-[#E8E2D8] dark:border-[#183F32] text-[#627068] dark:text-[#9FB1A7]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                isChecked
                                  ? 'bg-[#112E24] dark:bg-[#C5A880] border-[#112E24] dark:border-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
                                  : 'border-[#627068]/50'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Dorilar Ro'yxati (Medications) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1.5">
                        <Pill className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>{lang === 'uz' ? 'Belgilangan Dorilar Ro\'yxati:' : 'Список Назначенных Лекарств:'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddMedicine()}
                        className="text-[11px] font-bold text-[#C5A880] hover:text-[#B39366] flex items-center gap-1 bg-[#C5A880]/10 px-2 py-0.5 rounded-lg transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{lang === 'uz' ? 'Dori qo\'shish' : 'Добавить'}</span>
                      </button>
                    </div>

                    {/* Quick Medicine Templates */}
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5 mb-2">
                      {QUICK_MEDICINE_TEMPLATES.map(tpl => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => handleAddMedicine(tpl)}
                          className="bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#C5A880]/40 hover:border-[#C5A880] text-[#112E24] dark:text-[#D6BF9F] text-[10px] font-semibold px-2 py-1 rounded-xl whitespace-nowrap transition active:scale-95"
                        >
                          + {tpl.name} ({tpl.dosage})
                        </button>
                      ))}
                    </div>

                    {/* Medicines List Items */}
                    <div className="space-y-2">
                      {medicines.map((med, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32] space-y-2 relative"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              placeholder={lang === 'uz' ? 'Dori nomi (Nimesil...)' : 'Название лекарства'}
                              value={med.name}
                              onChange={e => handleUpdateMedicine(idx, 'name', e.target.value)}
                              className="font-bold text-xs bg-transparent border-b border-[#E8E2D8] dark:border-[#183F32] focus:border-[#C5A880] focus:outline-none flex-1 py-0.5 text-[#112E24] dark:text-[#FAF8F5]"
                            />
                            <input
                              type="text"
                              placeholder={lang === 'uz' ? 'Dozasi (100mg)' : 'Дозировка'}
                              value={med.dosage}
                              onChange={e => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                              className="text-xs bg-transparent border-b border-[#E8E2D8] dark:border-[#183F32] focus:border-[#C5A880] focus:outline-none w-24 py-0.5 text-[#112E24] dark:text-[#FAF8F5]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded transition"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder={lang === 'uz' ? 'Qabul qilish tartibi (kuniga 2 mahal)' : 'Режим приема'}
                              value={med.frequency}
                              onChange={e => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                              className="text-[11px] bg-white dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#183F32] rounded-xl px-2 py-1 text-[#1A221E] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                            />
                            <input
                              type="text"
                              placeholder={lang === 'uz' ? 'Muddati (5 kun)' : 'Длительность'}
                              value={med.duration}
                              onChange={e => handleUpdateMedicine(idx, 'duration', e.target.value)}
                              className="text-[11px] bg-white dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#183F32] rounded-xl px-2 py-1 text-[#1A221E] dark:text-[#FAF8F5] focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. Qo'shimcha Izoh (Custom Notes) */}
                  <div>
                    <label className="block font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] mb-1">
                      {lang === 'uz' ? 'Qo\'shimcha shifokor ko\'rsatmasi:' : 'Дополнительные указания врача:'}
                    </label>
                    <textarea
                      rows={2}
                      value={customNotes}
                      onChange={e => setCustomNotes(e.target.value)}
                      placeholder={lang === 'uz' ? 'Og\'riq kuchaysa zudlik bilan qo\'ng\'iroq qiling...' : 'В случае усиления боли срочно связаться...'}
                      className="w-full bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32] rounded-2xl p-2 text-xs text-[#1A221E] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!prescriptionSuccessMsg && (
              <div className="p-3 bg-[#FAF8F5] dark:bg-[#07130F] border-t border-[#E8E2D8] dark:border-[#183F32] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPrescriptionAppt(null)}
                  className="px-4 py-2 rounded-full border border-[#E8E2D8] dark:border-[#183F32] text-xs font-semibold text-[#627068] hover:text-[#1A221E] transition"
                >
                  {lang === 'uz' ? 'Yopish' : 'Отмена'}
                </button>

                <button
                  type="button"
                  onClick={handleSendPrescription}
                  disabled={isSendingPrescription || medicines.length === 0}
                  className={`flex items-center gap-1.5 bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] dark:hover:bg-[#B39366] text-[#FAF8F5] dark:text-[#07130F] px-5 py-2 rounded-full text-xs font-bold tracking-wide border border-[#C5A880]/40 shadow-md transition active:scale-95 ${
                    isSendingPrescription ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSendingPrescription
                      ? (lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...')
                      : (lang === 'uz' ? 'Telegramga Retsept Yuborish' : 'Отправить в Telegram')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Individual Appointment Card
interface AppointmentCardProps {
  appt: Appointment;
  lang: Language;
  onStatusChange: (id: string, newStatus: AppointmentStatus) => void;
  onOpenPrescription: (appt: Appointment) => void;
  isHighlighted?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appt,
  lang,
  onStatusChange,
  onOpenPrescription,
  isHighlighted
}) => {
  return (
    <div
      className={`p-3 rounded-2xl border transition-all duration-200 space-y-2 relative ${
        isHighlighted
          ? 'bg-amber-50 dark:bg-[#1A3328] border-2 border-amber-500 shadow-md ring-2 ring-amber-400/40 animate-pulse'
          : 'bg-white dark:bg-[#0E231B] border-[#E8E2D8] dark:border-[#183F32] hover:border-[#C5A880]/70 shadow-sm'
      }`}
    >
      {/* Card Header: PIN & Time */}
      <div className="flex items-center justify-between gap-1">
        <span className="bg-[#112E24] text-[#C5A880] text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg border border-[#C5A880]/30 flex items-center gap-1 shadow-sm">
          <span>PIN:</span>
          <span className="text-white tracking-widest">{appt.pinCode}</span>
        </span>

        <div className="flex items-center gap-1 text-xs font-bold text-[#112E24] dark:text-[#FAF8F5]">
          <Clock className="w-3 h-3 text-[#C5A880]" />
          <span>{appt.time}</span>
        </div>
      </div>

      {/* Patient Name & Phone */}
      <div>
        <h4 className="font-serif font-bold text-xs sm:text-sm text-[#112E24] dark:text-[#FAF8F5] leading-tight">
          {appt.patientName}
        </h4>
        <a
          href={`tel:${appt.phone.replace(/[^0-9+]/g, '')}`}
          className="text-[11px] text-[#627068] dark:text-[#9FB1A7] hover:text-[#C5A880] flex items-center gap-1 mt-0.5 transition"
        >
          <Phone className="w-2.5 h-2.5 text-[#C5A880]" />
          <span>{appt.phone}</span>
        </a>
      </div>

      {/* Branch Indicator Tag */}
      {(() => {
        const bClinic = CLINICS.find(c => c.id === (appt.clinicId || 'nukus'));
        return (
          <div className="flex items-center gap-1">
            <span className="text-[9.5px] bg-[#112E24]/5 dark:bg-[#C5A880]/15 text-[#112E24] dark:text-[#D6BF9F] font-bold px-2 py-0.5 rounded-md border border-[#C5A880]/30 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5 text-[#C5A880]" />
              <span>{lang === 'uz' ? bClinic?.branchName.uz : bClinic?.branchName.ru}</span>
            </span>
          </div>
        );
      })()}

      {/* Selected Teeth Numbers & Promo */}
      {(appt.selectedTeethNumbers && appt.selectedTeethNumbers.length > 0) || appt.hasPromoUltrasonic ? (
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          {appt.selectedTeethNumbers && appt.selectedTeethNumbers.length > 0 && (
            <span className="bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>🦷</span>
              <span>{appt.selectedTeethNumbers.map(n => `№${n}`).join(', ')}</span>
            </span>
          )}
          {appt.hasPromoUltrasonic && (
            <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md">
              🎁 50% Clean
            </span>
          )}
        </div>
      ) : null}

      {/* Service & Doctor */}
      <div className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32]/80 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-[#112E24] dark:text-[#FAF8F5] font-medium">
          <span className="truncate max-w-[140px]">{lang === 'uz' ? appt.service.title.uz : appt.service.title.ru}</span>
          <span className="font-mono font-bold text-[#C5A880] text-[10px]">
            {((appt.totalAmount ?? appt.service.price) || 0).toLocaleString('uz-UZ')} {lang === 'uz' ? "so'm" : 'сум'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-[#627068] dark:text-[#9FB1A7]">
          <img
            src={appt.doctor.photo}
            alt={appt.doctor.name}
            className="w-4 h-4 rounded-full object-cover object-top"
          />
          <span className="truncate">{appt.doctor.name}</span>
        </div>
      </div>

      {/* 1-Click Action Buttons */}
      <div className="pt-1 flex flex-wrap items-center gap-1.5">
        {appt.status !== 'in_progress' && appt.status !== 'completed' && (
          <button
            type="button"
            onClick={() => onStatusChange(appt.id, 'in_progress')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
            title="Shifokor xonasiga kirdi"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{lang === 'uz' ? 'Xonaga kirdi' : 'В кабинет'}</span>
          </button>
        )}

        {appt.status !== 'completed' && (
          <button
            type="button"
            onClick={() => onStatusChange(appt.id, 'completed')}
            className="flex-1 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
            title="Muolaja yakunlandi"
          >
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>{lang === 'uz' ? 'Yakunlash' : 'Завершить'}</span>
          </button>
        )}

        {appt.status !== 'no_show' && appt.status !== 'completed' && (
          <button
            type="button"
            onClick={() => onStatusChange(appt.id, 'no_show')}
            className="bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5"
            title="Bemor kelmadi"
          >
            <UserX className="w-2.5 h-2.5" />
            <span>{lang === 'uz' ? 'Kelmadi' : 'Не явился'}</span>
          </button>
        )}

        {/* Prescription Button */}
        <button
          type="button"
          onClick={() => onOpenPrescription(appt)}
          className="w-full bg-[#112E24]/10 hover:bg-[#112E24]/20 dark:bg-[#C5A880]/15 dark:hover:bg-[#C5A880]/25 text-[#112E24] dark:text-[#D6BF9F] py-1 px-2 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 border border-[#C5A880]/30 active:scale-95"
          title="Raqamli retsept yozish"
        >
          <Pill className="w-3 h-3 text-[#C5A880]" />
          <span>💊 {lang === 'uz' ? 'Raqamli Retsept Yozish' : 'Выписать Рецепт'}</span>
        </button>
      </div>
    </div>
  );
};
