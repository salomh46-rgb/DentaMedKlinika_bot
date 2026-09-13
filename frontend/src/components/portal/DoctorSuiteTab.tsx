import React from 'react';
import { Users, Plus, Coffee } from 'lucide-react';
import { Doctor, Appointment, AppointmentStatus } from '../../types';

interface DoctorSuiteTabProps {
  lang: 'uz' | 'ru';
  activeDoctor: Doctor | null;
  selectedDoctorId: number;
  setSelectedDoctorId: (id: number) => void;
  tenantDoctors: Doctor[];
  setActiveTab: (tab: 'frontdesk' | 'doctor_suite' | 'ceo_finance' | 'sms_settings') => void;
  teethChart: any[];
  selectedOdontoTooth: any;
  setSelectedOdontoTooth: (tooth: any) => void;
  handleUpdateToothCondition: (toothNumber: number, condition: any) => void;
  isLunchBlocked: boolean;
  setIsLunchBlocked: (blocked: boolean) => void;
  isWeekendBlocked: boolean;
  setIsWeekendBlocked: (blocked: boolean) => void;
  doctorTodayAppointments: Appointment[];
  handleUpdateStatus: (id: string, status: AppointmentStatus) => void;
  handleOpenPrescription: (appt: Appointment) => void;
}

export const DoctorSuiteTab: React.FC<DoctorSuiteTabProps> = ({
  lang,
  activeDoctor,
  selectedDoctorId,
  setSelectedDoctorId,
  tenantDoctors,
  setActiveTab,
  teethChart,
  selectedOdontoTooth,
  setSelectedOdontoTooth,
  handleUpdateToothCondition,
  isLunchBlocked,
  setIsLunchBlocked,
  isWeekendBlocked,
  setIsWeekendBlocked,
  doctorTodayAppointments,
  handleUpdateStatus,
  handleOpenPrescription,
}) => {
  return (
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
  );
};
