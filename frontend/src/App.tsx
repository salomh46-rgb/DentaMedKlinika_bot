import React, { useState, useEffect, useMemo } from 'react';
import { Language, Doctor, Service, ToothData, Appointment, ClinicId } from './types';
import { DOCTORS, SERVICES } from './data/mockData';
import { showTelegramConfirm } from './utils/telegramAlerts';
import { fetchDoctors, fetchServices, fetchAppointments } from './services/api';
import { Header } from './components/Header';
import { CrossPromoBanner } from './components/CrossPromoBanner';
import { ServiceTabs } from './components/ServiceTabs';
import { DoctorCard } from './components/DoctorCard';
import { DentalChart } from './components/DentalChart';
import { BeforeAfterGallery } from './components/BeforeAfterGallery';
import { BookingModal } from './components/BookingModal';
import { MyAppointments } from './components/MyAppointments';
import { EmergencyFloatingButton } from './components/EmergencyFloatingButton';
import { DigitalTicketModal } from './components/DigitalTicketModal';
import { ReceptionDashboard } from './components/ReceptionDashboard';
import { Calendar, CheckCircle2, Shield, Award, Users } from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<Language>('uz');
  const [activeTab, setActiveTab] = useState<string>('services');
  const [selectedClinicId, setSelectedClinicId] = useState<ClinicId>('nukus');
  
  // Dynamic Live Data from Backend API (with instant mock fallback)
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [receptionAppointments, setReceptionAppointments] = useState<Appointment[]>([]);

  // Staff Mode (Reception access gatekeeper - hidden from ordinary patients)
  const [isStaff, setIsStaff] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('staff') === '1' || urlParams.get('role') === 'reception' || urlParams.get('admin') === '1') {
        localStorage.setItem('dentamed_is_staff', 'true');
        return true;
      }
      return localStorage.getItem('dentamed_is_staff') === 'true';
    } catch {
      return false;
    }
  });

  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [staffPin, setStaffPin] = useState<string>('');
  const [staffPinError, setStaffPinError] = useState<string | null>(null);

  const handleToggleStaff = () => {
    if (isStaff) {
      setIsStaff(false);
      localStorage.removeItem('dentamed_is_staff');
      if (activeTab === 'reception') {
        setActiveTab('services');
      }
      showToast(lang === 'uz' ? "Xodim rejimidan chiqildi" : "Вы вышли из режима сотрудника");
    } else {
      setIsStaffModalOpen(true);
      setStaffPin('');
      setStaffPinError(null);
    }
  };

  const handleVerifyStaffPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (staffPin === '7777' || staffPin === '2026') {
      setIsStaff(true);
      localStorage.setItem('dentamed_is_staff', 'true');
      setIsStaffModalOpen(false);
      setActiveTab('reception');
      showToast(lang === 'uz' ? "Xush kelibsiz! Retsepshn paneli faollashtirildi" : "Добро пожаловать! Панель ресепшн активирована");
    } else {
      setStaffPinError(lang === 'uz' ? "Noto'g'ri PIN-kod! (Namuna: 7777)" : "Неверный PIN-код! (Пример: 7777)");
    }
  };

  useEffect(() => {
    fetchDoctors().then(setDoctors);
    fetchServices().then(setServices);
    fetchAppointments().then(setReceptionAppointments);
  }, []);

  // Filter doctors & services by selected clinic (Multi-Tenant Branch Switcher)
  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => !d.clinicIds || d.clinicIds.includes(selectedClinicId));
  }, [doctors, selectedClinicId]);

  const filteredServices = useMemo(() => {
    return services.filter(s => !s.clinicIds || s.clinicIds.includes(selectedClinicId));
  }, [services, selectedClinicId]);

  
  // Theme state: dark / light
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('dentamed_theme');
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dentamed_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dentamed_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);
  
  // Isolate appointments per Telegram user so each patient only sees their own appointments
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const storageKey = tgUser?.id ? `dentamed_appts_${tgUser.id}` : 'dentamed_appts';

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.log('Error reading appointments:', e);
    }
    return [];
  });

  // Keep localStorage in sync per user
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(appointments));
    } catch (e) {
      console.log('Error saving appointments:', e);
    }
  }, [appointments, storageKey]);

  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-teeth & Cross-Promo states for booking
  const [bookingTeethNumbers, setBookingTeethNumbers] = useState<number[]>([]);
  const [bookingHasPromo, setBookingHasPromo] = useState<boolean>(false);
  const [bookingDiscount, setBookingDiscount] = useState<number>(0);
  const [bookingTotalPrice, setBookingTotalPrice] = useState<number | undefined>(undefined);

  // Digital Ticket (QR Boarding Pass) Modal State
  const [activeTicket, setActiveTicket] = useState<Appointment | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState<boolean>(false);

  // Auto-expand Telegram WebApp if opened in Telegram
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBookFromService = (service: Service) => {
    setSelectedService(service);
    const matchedDoc = doctors.find(d => d.department === service.department) || doctors[0];
    setSelectedDoctor(matchedDoc);
    setBookingTeethNumbers([]);
    setBookingHasPromo(false);
    setBookingDiscount(0);
    setBookingTotalPrice(undefined);
    setIsBookingOpen(true);
  };

  const handleBookFromDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    const matchedService = services.find(s => s.department === doctor.department) || services[0];
    setSelectedService(matchedService);
    setBookingTeethNumbers([]);
    setBookingHasPromo(false);
    setBookingDiscount(0);
    setBookingTotalPrice(undefined);
    setIsBookingOpen(true);
  };

  const handleBookFromTooth = (
    tooth: ToothData,
    additionalTeeth?: ToothData[],
    includePromo?: boolean,
    promoDiscount?: number,
    totalPrice?: number
  ) => {
    const dentalService = services.find(s => s.department === 'stomatology') || services[0];
    setSelectedService(dentalService);
    const matchedDoc = doctors.find(d => d.department === 'stomatology') || doctors[0];
    setSelectedDoctor(matchedDoc);

    const teethNums = additionalTeeth && additionalTeeth.length > 0
      ? additionalTeeth.map(t => t.number)
      : [tooth.number];

    setBookingTeethNumbers(teethNums);
    setBookingHasPromo(!!includePromo);
    setBookingDiscount(promoDiscount || 0);
    setBookingTotalPrice(totalPrice);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments([newAppointment, ...appointments]);
    setReceptionAppointments(prev => [newAppointment, ...prev]);
    setActiveTab('appointments');
    setActiveTicket(newAppointment);
    setIsTicketOpen(true);
    showToast(
      lang === 'uz'
        ? `Qabul muvaffaqiyatli band qilindi! Talon № ${newAppointment.id}`
        : `Запись успешно оформлена! Талон № ${newAppointment.id}`
    );
  };

  const handleCancelAppointment = (id: string) => {
    showTelegramConfirm(
      lang === 'uz' ? 'Qabulni bekor qilmoqchimisiz?' : 'Отменить эту запись?',
      () => {
        setAppointments(appointments.filter(a => a.id !== id));
        setReceptionAppointments(receptionAppointments.filter(a => a.id !== id));
        showToast(lang === 'uz' ? 'Qabul bekor qilindi.' : 'Запись отменена.');
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#07130F] text-[#1A221E] dark:text-[#FAF8F5] pb-24 font-sans transition-colors duration-300">
      {/* Header */}
      <Header
        lang={lang}
        setLang={setLang}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appointmentsCount={appointments.length}
        isDark={isDark}
        onToggleDark={toggleTheme}
        selectedClinicId={selectedClinicId}
        onSelectClinic={setSelectedClinicId}
        isStaff={isStaff}
        onToggleStaff={handleToggleStaff}
      />

      {/* Main Container - Expands for Reception Kanban */}
      <main className={`mx-auto px-4 pt-4 transition-all duration-300 ${
        activeTab === 'reception' && isStaff ? 'max-w-7xl' : 'max-w-xl'
      }`}>
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#112E24] text-[#FAF8F5] px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce border border-[#C5A880]/40">
            <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Cross Promotion Banner */}
        {activeTab !== 'reception' && (
          <CrossPromoBanner
            lang={lang}
            onClaim={() => {
              setSelectedService(services[4] || services[0]); // LOR Endoskopiya
              setSelectedDoctor(doctors[2] || doctors[0]);
              setIsBookingOpen(true);
            }}
          />
        )}

        {/* Dynamic View based on Active Tab (Protected Reception View) */}
        {activeTab === 'reception' && isStaff && (
          <ReceptionDashboard
            lang={lang}
            appointments={receptionAppointments}
            onAppointmentsChange={setReceptionAppointments}
            selectedClinicId={selectedClinicId}
            onSelectClinic={setSelectedClinicId}
            onRefresh={() => fetchAppointments().then(setReceptionAppointments)}
          />
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <ServiceTabs
              lang={lang}
              onBookService={handleBookFromService}
              services={filteredServices}
            />

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-white dark:bg-[#0E231B] p-3.5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] text-center shadow-sm">
                <Users className="w-5 h-5 text-[#C5A880] mx-auto mb-1.5" />
                <div className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">15 000+</div>
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7] tracking-wide">
                  {lang === 'uz' ? 'Bemorlar' : 'Пациентов'}
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E231B] p-3.5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] text-center shadow-sm">
                <Shield className="w-5 h-5 text-[#C5A880] mx-auto mb-1.5" />
                <div className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">100%</div>
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7] tracking-wide">
                  {lang === 'uz' ? 'Og\'riqsiz' : 'Без боли'}
                </div>
              </div>

              <div className="bg-white dark:bg-[#0E231B] p-3.5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] text-center shadow-sm">
                <Award className="w-5 h-5 text-[#C5A880] mx-auto mb-1.5" />
                <div className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5]">15 Yil</div>
                <div className="text-[10px] text-[#627068] dark:text-[#9FB1A7] tracking-wide">
                  {lang === 'uz' ? 'Tajriba' : 'Опыта'}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <DentalChart
            lang={lang}
            onBookTooth={handleBookFromTooth}
          />
        )}

        {activeTab === 'doctors' && (
          <DoctorCard
            lang={lang}
            onBookDoctor={handleBookFromDoctor}
            doctors={filteredDoctors}
          />
        )}

        {activeTab === 'gallery' && (
          <BeforeAfterGallery
            lang={lang}
            onConsult={() => {
              setSelectedService(services[3] || services[0]); // AirFlow
              setSelectedDoctor(doctors[0]);
              setIsBookingOpen(true);
            }}
          />
        )}

        {activeTab === 'appointments' && (
          <MyAppointments
            lang={lang}
            appointments={appointments}
            onCancel={handleCancelAppointment}
            onBookNew={() => setIsBookingOpen(true)}
          />
        )}
      </main>

      {/* Floating Bottom Quick Booking Button (Mobile/Telegram WebApp Friendly) */}
      <div className="fixed bottom-0 inset-x-0 bg-[#FAF8F5]/95 dark:bg-[#07130F]/95 backdrop-blur-md border-t border-[#E8E2D8] dark:border-[#183F32] px-4 py-2.5 z-40 transition-colors duration-300">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider block font-medium">
              {lang === 'uz' ? 'Kutishlarsiz qabul' : 'Прием без очередей'}
            </span>
            <span className="font-serif text-sm font-bold text-[#112E24] dark:text-[#FAF8F5]">
              {lang === 'uz' ? '24/7 Qabulga Yozilish' : 'Онлайн Запись 24/7'}
            </span>
          </div>

          <button
            onClick={() => setIsBookingOpen(true)}
            className="flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] hover:bg-[#183F32] dark:hover:bg-[#D6BF9F] active:scale-95 text-[#FAF8F5] dark:text-[#07130F] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide border border-[#C5A880]/40 shadow-sm transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C5A880] dark:text-[#07130F]" />
            <span>{lang === 'uz' ? 'Qabulga Yozilish' : 'Записаться'}</span>
          </button>
        </div>
      </div>

      {/* Subtle Staff Portal Trigger in Footer */}
      <div className="max-w-xl mx-auto px-4 py-6 text-center text-xs text-[#627068]/60 dark:text-[#9FB1A7]/40">
        <button
          onClick={handleToggleStaff}
          className="hover:text-[#C5A880] transition inline-flex items-center gap-1.5 text-[11px] font-medium"
        >
          <span>{isStaff ? '🔑 Xodim / Retsepshn Rejimi Faol (Chiqish)' : '🔐 Xodimlar / Retsepshn Kirishi'}</span>
        </button>
      </div>

      {/* Staff Passcode Verification Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] dark:bg-[#0E231B] rounded-3xl p-6 max-w-sm w-full border border-[#C5A880]/40 shadow-2xl animate-scale-up">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#112E24] text-[#C5A880] flex items-center justify-center mx-auto mb-3 border border-[#C5A880]/30 shadow-inner">
                <span className="text-xl">🔐</span>
              </div>
              <h3 className="font-serif text-lg font-bold text-[#112E24] dark:text-[#FAF8F5]">
                {lang === 'uz' ? 'Xodimlar va Retsepshn Kirishi' : 'Вход для персонала'}
              </h3>
              <p className="text-xs text-[#627068] dark:text-[#9FB1A7] mt-1">
                {lang === 'uz' ? 'Klinika PIN-kodini kiriting (Standart: 7777)' : 'Введите PIN-код клиники (По умолчанию: 7777)'}
              </p>
            </div>

            <form onSubmit={handleVerifyStaffPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="PIN-kod: 7777"
                  value={staffPin}
                  onChange={e => {
                    setStaffPin(e.target.value);
                    setStaffPinError(null);
                  }}
                  className="w-full text-center tracking-[0.3em] font-mono text-xl py-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                />
                {staffPinError && (
                  <div className="text-red-500 text-xs text-center mt-2 font-medium">
                    {staffPinError}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#E8E2D8] dark:border-[#183F32] text-xs font-semibold text-[#627068] dark:text-[#9FB1A7] hover:bg-[#EBE5DC]/50 dark:hover:bg-[#183F32]/50 transition"
                >
                  {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold hover:bg-[#183F32] dark:hover:bg-[#D6BF9F] transition shadow-md"
                >
                  {lang === 'uz' ? 'Kirish' : 'Войти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Call / Telegram Assistant Floating Button */}
      <EmergencyFloatingButton lang={lang} />

      {/* Booking Wizard Modal */}
      <BookingModal
        lang={lang}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedDoctor(null);
          setSelectedService(null);
          setBookingTeethNumbers([]);
          setBookingHasPromo(false);
          setBookingDiscount(0);
          setBookingTotalPrice(undefined);
        }}
        onSuccess={handleBookingSuccess}
        preselectedDoctor={selectedDoctor}
        preselectedService={selectedService}
        selectedTeethNumbers={bookingTeethNumbers}
        hasPromoUltrasonic={bookingHasPromo}
        discountAmount={bookingDiscount}
        totalPrice={bookingTotalPrice}
        selectedClinicId={selectedClinicId}
      />

      {/* Digital Receipt / QR Boarding Pass Modal */}
      <DigitalTicketModal
        lang={lang}
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        appointment={activeTicket}
      />
    </div>
  );
}

export default App;
