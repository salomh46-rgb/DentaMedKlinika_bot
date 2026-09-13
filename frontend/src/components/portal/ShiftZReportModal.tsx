import React from 'react';
import { Receipt, X, Lock, Plus, Check, Printer } from 'lucide-react';
import { Shift, ZReportSummary, Tenant } from '../../types';

interface ShiftZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftTab: 'status' | 'expense' | 'close' | 'zreport';
  setShiftTab: (tab: 'status' | 'expense' | 'close' | 'zreport') => void;
  currentShift: Shift | null;
  closedZReport: ZReportSummary | null;
  shiftCashierName: string;
  setShiftCashierName: (name: string) => void;
  shiftStartingCash: number;
  setShiftStartingCash: (cash: number) => void;
  handleOpenShift: () => void;
  shiftLiveStats: {
    cash: number;
    card: number;
    click: number;
    totalExpenses: number;
    expectedCash: number;
  };
  setShiftActualCash: (cash: number) => void;
  shiftActualCash: number;
  shiftExpenseCategory: string;
  setShiftExpenseCategory: (cat: string) => void;
  shiftExpenseAmount: number;
  setShiftExpenseAmount: (amount: number) => void;
  shiftExpenseRecipient: string;
  setShiftExpenseRecipient: (rec: string) => void;
  shiftExpenseComment: string;
  setShiftExpenseComment: (comment: string) => void;
  handleAddShiftExpense: () => void;
  handleCloseShift: () => void;
  currentTenant: Tenant;
  activeClinicTarget: string;
}

export const ShiftZReportModal: React.FC<ShiftZReportModalProps> = ({
  isOpen,
  onClose,
  shiftTab,
  setShiftTab,
  currentShift,
  closedZReport,
  shiftCashierName,
  setShiftCashierName,
  shiftStartingCash,
  setShiftStartingCash,
  handleOpenShift,
  shiftLiveStats,
  setShiftActualCash,
  shiftActualCash,
  shiftExpenseCategory,
  setShiftExpenseCategory,
  shiftExpenseAmount,
  setShiftExpenseAmount,
  shiftExpenseRecipient,
  setShiftExpenseRecipient,
  shiftExpenseComment,
  setShiftExpenseComment,
  handleAddShiftExpense,
  handleCloseShift,
  currentTenant,
  activeClinicTarget,
}) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
  );
};
