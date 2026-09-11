import React from 'react';
import { Language, ClinicId } from '../types';
import { CLINICS } from '../data/mockData';
import { PhoneCall, Globe, Clock, Sparkles, Sun, Moon, MapPin, Building2, ChevronDown } from 'lucide-react';

interface HeaderProps {
  lang: Language;
  setLang: (lang: Language) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  appointmentsCount: number;
  isDark: boolean;
  onToggleDark: () => void;
  selectedClinicId?: ClinicId;
  onSelectClinic?: (clinicId: ClinicId) => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  activeTab,
  setActiveTab,
  appointmentsCount,
  isDark,
  onToggleDark,
  selectedClinicId = 'nukus',
  onSelectClinic
}) => {
  const [isClinicMenuOpen, setIsClinicMenuOpen] = React.useState(false);
  const activeClinic = CLINICS.find(c => c.id === selectedClinicId) || CLINICS[0];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#07130F]/95 backdrop-blur-md border-b border-[#E8E2D8] dark:border-[#183F32] transition-all">
      {/* Top boutique status bar */}
      <div className="bg-[#112E24] dark:bg-[#050E0B] text-[#FAF8F5] px-4 py-1.5 text-xs flex justify-between items-center border-b border-[#183F32] dark:border-[#0C241B]">
        <div className="flex items-center gap-2 text-[11px] tracking-wider uppercase font-medium text-[#D6BF9F]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A880] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C5A880]"></span>
          </span>
          <span>{lang === 'uz' ? 'Ochiq • Konsultatsiya 24/7' : 'Открыто • Консультации 24/7'}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`tel:${activeClinic.phone.replace(/[^0-9+]/g, '')}`}
            className="flex items-center gap-1.5 text-[11px] text-[#FAF8F5]/90 hover:text-[#C5A880] font-sans tracking-wide transition"
          >
            <PhoneCall className="w-3 h-3 text-[#C5A880]" />
            <span className="hidden sm:inline">{activeClinic.phone}</span>
          </a>

          {/* Day / Night Theme Toggle */}
          <button
            onClick={onToggleDark}
            className="flex items-center gap-1.5 bg-[#183F32] hover:bg-[#225745] text-[#C5A880] px-2.5 py-0.5 rounded-full border border-[#C5A880]/30 text-[10px] font-bold tracking-wider transition active:scale-95"
            title={
              lang === 'uz'
                ? isDark ? 'Kunduzgi rejimga o\'tish' : 'Tungi rejimga o\'tish'
                : isDark ? 'Дневной режим' : 'Ночной режим'
            }
          >
            {isDark ? (
              <>
                <Sun className="w-3 h-3 text-[#E5C9A4] animate-spin-slow" />
                <span className="text-[10px]">{lang === 'uz' ? 'Kun' : 'День'}</span>
              </>
            ) : (
              <>
                <Moon className="w-3 h-3 text-[#C5A880]" />
                <span className="text-[10px]">{lang === 'uz' ? 'Tun' : 'Ночь'}</span>
              </>
            )}
          </button>

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
            className="flex items-center gap-1 bg-[#183F32] hover:bg-[#1E4D3E] text-[#C5A880] px-2 py-0.5 rounded border border-[#C5A880]/30 text-[10px] font-bold tracking-widest transition"
          >
            <Globe className="w-3 h-3" />
            <span>{lang === 'uz' ? 'RU' : 'UZ'}</span>
          </button>
        </div>
      </div>

      {/* Main atelier brand banner */}
      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Bespoke Luxury Emblem */}
          <div className="w-10 h-10 rounded-xl bg-[#112E24] dark:bg-[#183F32] border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880] shadow-sm flex-shrink-0">
            <span className="font-serif text-lg font-bold tracking-tight">D</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base sm:text-lg font-bold text-[#1A221E] dark:text-[#FAF8F5] tracking-tight">
                {activeClinic.name}
              </h1>
              <span className="bg-[#112E24]/5 dark:bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#112E24] dark:text-[#D6BF9F] text-[9px] font-semibold px-2 py-0.5 rounded-full tracking-[0.15em] uppercase">
                {activeClinic.badge}
              </span>
            </div>
            <p className="text-[10px] sm:text-[10.5px] text-[#627068] dark:text-[#9FB1A7] tracking-wide font-sans truncate max-w-[200px] sm:max-w-xs">
              {lang === 'uz' ? activeClinic.address.uz : activeClinic.address.ru}
            </p>
          </div>
        </div>

        {/* Right action tools: Clinic Switcher & Appointments */}
        <div className="flex items-center gap-1.5">
          {/* Multi-Tenant Clinic Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsClinicMenuOpen(!isClinicMenuOpen)}
              className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#C5A880]/40 hover:border-[#C5A880] text-[#112E24] dark:text-[#D6BF9F] px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
              title={lang === 'uz' ? 'Filialni almashtirish' : 'Сменить филиал'}
            >
              <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="text-[11px] font-medium hidden sm:inline">
                {lang === 'uz' ? activeClinic.branchName.uz : activeClinic.branchName.ru}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isClinicMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Switcher popup menu */}
            {isClinicMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0E231B] rounded-2xl shadow-xl border border-[#C5A880]/30 p-2 z-50 space-y-1 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider px-2 py-1">
                  🏥 {lang === 'uz' ? 'Klinika filialini tanlang:' : 'Выберите филиал клиники:'}
                </div>
                {CLINICS.map(clinic => {
                  const isCur = clinic.id === selectedClinicId;
                  return (
                    <button
                      key={clinic.id}
                      onClick={() => {
                        onSelectClinic?.(clinic.id);
                        setIsClinicMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2 ${
                        isCur
                          ? 'bg-[#112E24] dark:bg-[#183F32] text-[#FAF8F5]'
                          : 'hover:bg-[#FAF8F5] dark:hover:bg-[#133025] text-[#1A221E] dark:text-[#FAF8F5]'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCur ? 'text-[#C5A880]' : 'text-[#627068]'}`} />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{clinic.name}</span>
                          {isCur && <span className="text-[9px] bg-[#C5A880] text-[#112E24] px-1.5 py-0.2 rounded font-bold">Faol</span>}
                        </div>
                        <div className={`text-[10px] mt-0.5 font-medium ${isCur ? 'text-[#D6BF9F]' : 'text-[#C5A880]'}`}>
                          {lang === 'uz' ? clinic.branchName.uz : clinic.branchName.ru}
                        </div>
                        <div className="text-[9.5px] opacity-75 truncate">
                          {lang === 'uz' ? clinic.address.uz : clinic.address.ru}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick appointments badge */}
          <button
            onClick={() => setActiveTab('appointments')}
            className={`relative p-2 rounded-xl border transition-all ${
              activeTab === 'appointments'
                ? 'bg-[#112E24] dark:bg-[#C5A880] border-[#112E24] dark:border-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
                : 'bg-white dark:bg-[#0E231B] border-[#E8E2D8] dark:border-[#C5A880]/30 text-[#1A221E] dark:text-[#FAF8F5] hover:border-[#C5A880]'
            }`}
            title={lang === 'uz' ? 'Mening navbatlarim' : 'Мои записи'}
          >
            <Clock className="w-4 h-4" />
            {appointmentsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C5A880] text-[#112E24] text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {appointmentsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="max-w-xl mx-auto px-2 flex gap-1.5 border-t border-[#E8E2D8]/80 dark:border-[#183F32] overflow-x-auto no-scrollbar py-1.5">
        {[
          { id: 'services', labelUz: 'Xizmatlar', labelRu: 'Услуги', icon: Sparkles },
          { id: 'reception', labelUz: '📋 Retsepshn', labelRu: '📋 Ресепшн', icon: null, highlight: true },
          { id: 'chart', labelUz: 'Tish Xaritasi', labelRu: 'Карта зубов', icon: null },
          { id: 'doctors', labelUz: 'Shifokorlar', labelRu: 'Врачи', icon: null },
          { id: 'gallery', labelUz: 'Natijalar (Oldin/Keyin)', labelRu: 'До / После', icon: null },
          { id: 'appointments', labelUz: `Qabullarim (${appointmentsCount})`, labelRu: `Записи (${appointmentsCount})`, icon: null }
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 rounded-full text-xs tracking-wide transition-all whitespace-nowrap flex items-center gap-1 ${
                isActive
                  ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
                  : item.highlight
                  ? 'text-[#C5A880] bg-[#C5A880]/10 hover:bg-[#C5A880]/20 font-semibold border border-[#C5A880]/30'
                  : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5] hover:bg-[#EBE5DC]/60 dark:hover:bg-[#183F32]/60 font-medium'
              }`}
            >
              <span>{lang === 'uz' ? item.labelUz : item.labelRu}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
