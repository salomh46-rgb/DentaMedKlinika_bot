import React from 'react';
import {
  Building2, Clock, Printer, Lock, Sparkles, RefreshCw, Sun, Moon,
  LogOut, CheckCircle2, Layers, Stethoscope, Crown, MessageSquare
} from 'lucide-react';
import { Tenant, Clinic, Appointment } from '../../types';

interface PortalHeaderProps {
  currentTenant: Tenant;
  lang: 'uz' | 'ru';
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  visibleBranches: Clinic[];
  activeSession: any;
  currentDateTime: string;
  handleStaffLogout: () => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setSignUpStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>> | ((step: 1 | 2 | 3) => void);
  setIsSignUpModalOpen: (open: boolean) => void;
  refreshAllData: () => void;
  isRefreshing: boolean;
  onToggleTheme?: () => void;
  isDarkTheme?: boolean;
  onExitPortal: () => void;
  portalToast: { message: string; type: 'success' | 'info' | 'error' } | null;
  activeTab: 'frontdesk' | 'doctor_suite' | 'ceo_finance' | 'sms_settings';
  setActiveTab: (tab: 'frontdesk' | 'doctor_suite' | 'ceo_finance' | 'sms_settings') => void;
  branchFilteredAppointments: Appointment[];
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  currentTenant,
  lang,
  selectedBranchId,
  setSelectedBranchId,
  visibleBranches,
  activeSession,
  currentDateTime,
  handleStaffLogout,
  setIsLoginModalOpen,
  setSignUpStep,
  setIsSignUpModalOpen,
  refreshAllData,
  isRefreshing,
  onToggleTheme,
  isDarkTheme,
  onExitPortal,
  portalToast,
  activeTab,
  setActiveTab,
  branchFilteredAppointments,
}) => {
  return (
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
              <span>{currentTenant.tagline?.[lang] || currentTenant.tagline?.uz || 'Enterprise Medical CRM & Kassa'}</span>
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
                  📍 {clinic.branchName?.[lang] || clinic.name}
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
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#C5A880] to-[#8C7350] hover:from-[#D4B992] hover:to-[#BFA075] text-[#112E24] px-3.5 py-1.5 rounded-xl text-xs font-black transition shadow-md hover:scale-95 animate-pulse"
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
  );
};
