import React from 'react';
import { DollarSign, X, Check } from 'lucide-react';
import { PatientDebt } from '../../types';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDebt: PatientDebt | null;
  debtPayAmount: number;
  setDebtPayAmount: (amount: number) => void;
  debtPayMethod: 'cash' | 'card' | 'click';
  setDebtPayMethod: (method: 'cash' | 'card' | 'click') => void;
  debtPayNotes: string;
  setDebtPayNotes: (notes: string) => void;
  handlePayDebtSubmit: () => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedDebt,
  debtPayAmount,
  setDebtPayAmount,
  debtPayMethod,
  setDebtPayMethod,
  debtPayNotes,
  setDebtPayNotes,
  handlePayDebtSubmit,
}) => {
  if (!isOpen || !selectedDebt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-md w-full border border-amber-500/50 shadow-2xl space-y-4 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
              Nasiya To'lovini Qabul Qilish
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-gray-200 dark:border-gray-800 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Bemor:</span>
            <span className="font-bold text-[#112E24] dark:text-[#FAF8F5]">{selectedDebt.patientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Telefon:</span>
            <span className="font-mono font-semibold">{selectedDebt.phone}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-1">
            <span className="text-gray-500">Umumiy Qarz Qoldig'i:</span>
            <span className="font-mono font-black text-rose-500">{(selectedDebt.debtAmount || 0).toLocaleString('uz-UZ')} UZS</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
              To'lanayotgan Summa (UZS): *
            </label>
            <input
              type="number"
              max={selectedDebt.debtAmount}
              value={debtPayAmount}
              onChange={e => setDebtPayAmount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-mono font-black text-emerald-600"
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setDebtPayAmount(selectedDebt.debtAmount)}
                className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold"
              >
                100% To'liq So'ndirish
              </button>
              {selectedDebt.debtAmount > 100000 && (
                <button
                  type="button"
                  onClick={() => setDebtPayAmount(Math.round(selectedDebt.debtAmount / 2))}
                  className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-bold"
                >
                  50% Qisman
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">To'lov Usuli:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Naqd Pul' },
                { id: 'card', label: 'Terminal' },
                { id: 'click', label: 'Click/Payme' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDebtPayMethod(m.id as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${debtPayMethod === m.id ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24]' : 'bg-[#FAF8F5] dark:bg-[#07130F] text-gray-500 border-gray-300 dark:border-gray-700'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Izoh:</label>
            <input
              type="text"
              value={debtPayNotes}
              onChange={e => setDebtPayNotes(e.target.value)}
              placeholder="Kvitansiya #, to'lov sababi..."
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handlePayDebtSubmit}
            disabled={debtPayAmount <= 0}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>To'lovni Qabul Qilish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
