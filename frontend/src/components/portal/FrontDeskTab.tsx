import React from 'react';
import { Search, X, DollarSign, Phone, ArrowRight, Printer, Check } from 'lucide-react';
import { Appointment, AppointmentStatus, Shift } from '../../types';

interface FrontDeskTabProps {
  lang: 'uz' | 'ru';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsShiftModalOpen: (open: boolean) => void;
  currentShift: Shift | null;
  kanbanColumns: {
    waiting: Appointment[];
    in_progress: Appointment[];
    completed: Appointment[];
    cancelled: Appointment[];
  };
  handleUpdateStatus: (id: string, status: AppointmentStatus) => void;
  handleOpenReceipt: (appt: Appointment) => void;
  setSelectedDebt: (debt: any) => void;
  setDebtPayAmount: (amount: number) => void;
  setIsDebtPayModalOpen: (open: boolean) => void;
}

export const FrontDeskTab: React.FC<FrontDeskTabProps> = ({
  lang,
  searchQuery,
  setSearchQuery,
  setIsShiftModalOpen,
  currentShift,
  kanbanColumns,
  handleUpdateStatus,
  handleOpenReceipt,
  setSelectedDebt,
  setDebtPayAmount,
  setIsDebtPayModalOpen,
}) => {
  return (
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
  );
};
