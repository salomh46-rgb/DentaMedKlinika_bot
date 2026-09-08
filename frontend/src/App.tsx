import React, { useState, useEffect } from 'react';
import { Language, Doctor, Service, ToothData, Appointment } from './types';
import { DOCTORS, SERVICES } from './data/mockData';
import { showTelegramConfirm } from './utils/telegramAlerts';
import { fetchDoctors, fetchServices } from './services/api';
import { Header } from './components/Header';
import { CrossPromoBanner } from './components/CrossPromoBanner';
import { ServiceTabs } from './components/ServiceTabs';
import { DoctorCard } from './components/DoctorCard';
import { DentalChart } from './components/DentalChart';
import { BeforeAfterGallery } from './components/BeforeAfterGallery';
import { BookingModal } from './components/BookingModal';
import { MyAppointments } from './components/MyAppointments';
import { Calendar, CheckCircle2, Shield, Award, Users, PhoneCall, Sparkles } from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<Language>('uz');
  const [activeTab, setActiveTab] = useState<string>('services');
  
  // Dynamic Live Data from Backend API (with instant mock fallback)
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);
  const [services, setServices] = useState<Service[]>(SERVICES);

  useEffect(() => {
    fetchDoctors().then(setDoctors);
    fetchServices().then(setServices);
  }, []);
  
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
    setIsBookingOpen(true);
  };

  const handleBookFromDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    const matchedService = services.find(s => s.department === doctor.department) || services[0];
    setSelectedService(matchedService);
    setIsBookingOpen(true);
  };

  const handleBookFromTooth = (tooth: ToothData) => {
    setSelectedService(services[0]);
    setSelectedDoctor(doctors[0]);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setAppointments([newAppointment, ...appointments]);
    setActiveTab('appointments');
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
      />

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 pt-4">
        {/* Toast alert */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#112E24] text-[#FAF8F5] px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce border border-[#C5A880]/40">
            <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Cross Promotion Banner */}
        <CrossPromoBanner
          lang={lang}
          onClaim={() => {
            setSelectedService(services[4] || services[0]); // LOR Endoskopiya
            setSelectedDoctor(doctors[2] || doctors[0]);
            setIsBookingOpen(true);
          }}
        />

        {/* Dynamic View based on Active Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <ServiceTabs
              lang={lang}
              onBookService={handleBookFromService}
              services={services}
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
            doctors={doctors}
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

      {/* Booking Wizard Modal */}
      <BookingModal
        lang={lang}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false);
          setSelectedDoctor(null);
          setSelectedService(null);
        }}
        onSuccess={handleBookingSuccess}
        preselectedDoctor={selectedDoctor}
        preselectedService={selectedService}
      />
    </div>
  );
}

export default App;
