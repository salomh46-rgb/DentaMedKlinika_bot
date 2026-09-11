import React, { useState } from 'react';
import { Language, ClinicId, StaffSession } from '../types';
import { CLINICS, TENANTS } from '../data/mockData';
import { PhoneCall, Globe, Clock, Sparkles, Sun, Moon, MapPin, Building2, ChevronDown, Lock, Crown, Check } from 'lucide-react';

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
  isStaff?: boolean;
  staffSession?: StaffSession | null;
  onToggleStaff?: () => void;
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
  onSelectClinic,
  isStaff = false,
  staffSession = null,
  onToggleStaff
}) => {
  const [isClinicMenuOpen, setIsClinicMenuOpen] = useState(false);
  
  const activeClinic = CLINICS.find(c => c.id === selectedClinicId) || CLINICS[0];
  const activeTenantId = activeClinic.tenantId || 'dentamed';
  const [menuTenantTab, setMenuTenantTab] = useState<string>(activeTenantId);

  // Sync menu tenant tab if active clinic changes
  React.useEffect(() => {
    if (activeClinic.tenantId) {
      setMenuTenantTab(activeClinic.tenantId);
    }
  }, [activeClinic.tenantId]);

  const isReception = staffSession?.role === 'reception';
  const isDirector = staffSession?.isDirector;

  // Filter branches for the selected tenant tab
  const branchesForTab = CLINICS.filter(c => (c.tenantId || 'dentamed') === menuTenantTab);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#07130F]/95 backdrop-blur-md border-b border-[#E8E2D8] dark:border-[#183F32] transition-all">
      {/* Top boutique status bar */}
      <div className="bg-[#112E24] dark:bg-[#050E0B] text-[#FAF8F5] px-4 py-1.5 text-xs flex justify-between items-center border-b border-[#183F32] dark:border-[#0C241B]">
        <div className="flex items-center gap-2 text-[11px] tracking-wider uppercase font-medium text-[#D6BF9F]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C5A880] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#C5A880]"></span>
          </span>
          {isDirector ? (
            <span className="text-[#E5C9A4] font-bold flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-[#E5C9A4]" />
              <span>{lang === 'uz' ? '👑 Klinika Rahbari (Barcha 5 ta filial)' : '👑 Руководитель (Все 5 филиалов)'}</span>
            </span>
          ) : isReception ? (
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{lang === 'uz' ? `📍 ${activeClinic.branchName.uz} Retsepshni` : `📍 Ресепшн ${activeClinic.branchName.ru}`}</span>
            </span>
          ) : (
            <span>{lang === 'uz' ? 'Ochiq • Konsultatsiya 24/7' : 'Открыто • Консультации 24/7'}</span>
          )}
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
                ? isDark ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"
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
            <span className="font-serif text-lg font-bold tracking-tight">
              {activeTenantId === 'grandmed' ? 'G' : 'D'}
            </span>
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

        {/* Right action tools: 2-Step Multi-Tenant Switcher & Appointments */}
        <div className="flex items-center gap-1.5">
          {/* Multi-Tenant Clinic Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (!isReception) {
                  setIsClinicMenuOpen(!isClinicMenuOpen);
                }
              }}
              className={`flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#0E231B] border px-2.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95 ${
                isReception
                  ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300 cursor-default'
                  : 'border-[#C5A880]/40 hover:border-[#C5A880] text-[#112E24] dark:text-[#D6BF9F]'
              }`}
              title={isReception ? (lang === 'uz' ? 'Filial qulflangan (Retsepshn xodimi)' : 'Филиал зафиксирован') : (lang === 'uz' ? 'Filialni almashtirish' : 'Сменить филиал')}
            >
              {isReception ? (
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-[#C5A880]" />
              )}
              <span className="text-[11px] font-medium hidden sm:inline">
                {lang === 'uz' ? activeClinic.branchName.uz : activeClinic.branchName.ru}
              </span>
              {!isReception && (
                <ChevronDown className={`w-3 h-3 transition-transform ${isClinicMenuOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* 2-Step Switcher popup menu */}
            {isClinicMenuOpen && !isReception && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0E231B] rounded-2xl shadow-2xl border border-[#C5A880]/30 p-2.5 z-50 space-y-2 animate-fadeIn">
                <div className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider px-1">
                  🏥 {lang === 'uz' ? '1-bosqich: Klinika / Brendni tanlang' : 'Шаг 1: Выберите Клинику / Бренд'}
                </div>

                {/* Step 1: Tenant Brands Selector */}
                <div className="grid grid-cols-2 gap-1 bg-[#FAF8F5] dark:bg-[#07130F] p-1 rounded-xl border border-[#E8E2D8] dark:border-[#183F32]">
                  {TENANTS.map(tenant => {
                    const isTabActive = menuTenantTab === tenant.id;
                    return (
                      <button
                        key={tenant.id}
                        type="button"
                        onClick={() => setMenuTenantTab(tenant.id)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                          isTabActive
                            ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] shadow-sm'
                            : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#112E24] dark:hover:text-[#FAF8F5]'
                        }`}
                      >
                        <span>{tenant.id === 'dentamed' ? '🏥 DentaMed' : '🏥 GrandMed'}</span>
                        <span className="text-[9px] opacity-75">({tenant.badge.split(' ')[0]})</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider px-1 pt-1">
                  📍 {lang === 'uz' ? '2-bosqich: Filialni tanlang' : 'Шаг 2: Выберите филиал'}
                </div>

                {/* Step 2: Branches List for the active tenant */}
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {branchesForTab.map(clinic => {
                    const isCur = clinic.id === selectedClinicId;
                    return (
                      <button
                        key={clinic.id}
                        type="button"
                        onClick={() => {
                          onSelectClinic?.(clinic.id);
                          setIsClinicMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2 border ${
                          isCur
                            ? 'bg-[#112E24] dark:bg-[#183F32] border-[#C5A880] text-[#FAF8F5]'
                            : 'hover:bg-[#FAF8F5] dark:hover:bg-[#133025] border-transparent text-[#1A221E] dark:text-[#FAF8F5]'
                        }`}
                      >
                        <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isCur ? 'text-[#C5A880]' : 'text-[#627068]'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs flex items-center justify-between">
                            <span className="truncate">{lang === 'uz' ? clinic.branchName.uz : clinic.branchName.ru}</span>
                            {isCur && (
                              <span className="text-[9px] bg-[#C5A880] text-[#112E24] px-1.5 py-0.2 rounded font-extrabold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> Faol
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] mt-0.5 font-medium ${isCur ? 'text-[#D6BF9F]' : 'text-[#C5A880]'}`}>
                            {clinic.badge} • {clinic.workingHours.uz.split('•')[0]}
                          </div>
                          <div className="text-[9.5px] opacity-75 truncate">
                            {lang === 'uz' ? clinic.address.uz : clinic.address.ru}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
      <div className="max-w-xl mx-auto px-2 flex gap-1.5 border-t border-[#E8E2D8]/80 dark:border-[#183F32] overflow-x-auto no-scrollbar py-1.5 items-center">
        {[
          { id: 'services', labelUz: 'Xizmatlar', labelRu: 'Услуги', icon: Sparkles },
          ...(isStaff ? [{ id: 'reception', labelUz: isDirector ? '👑 Boshqaruv (Kanban)' : '📋 Retsepshn', labelRu: isDirector ? '👑 Руководство' : '📋 Ресепшн', icon: null, highlight: true }] : []),
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

        {isStaff && (
          <button
            onClick={onToggleStaff}
            className="ml-auto text-[10px] text-[#A63A3A] dark:text-[#F87171] bg-[#FEE2E2]/60 dark:bg-[#450A0A]/40 px-2 py-0.5 rounded-full border border-red-300 dark:border-red-900 whitespace-nowrap font-bold hover:scale-95 transition"
            title={lang === 'uz' ? 'Xodim rejimidan chiqish' : 'Выйти из режима сотрудника'}
          >
            {lang === 'uz' ? 'Chiqish' : 'Выход'}
          </button>
        )}
      </div>
    </header>
  );
};
