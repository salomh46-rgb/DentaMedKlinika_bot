import React from 'react';
import { Appointment, Tenant, Clinic, Language } from '../../types';
import { Printer, X, Receipt } from 'lucide-react';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  currentTenant: Tenant;
  visibleBranches: Clinic[];
  lang: Language;
  paymentMethod: 'cash' | 'card' | 'click';
  setPaymentMethod: (m: 'cash' | 'card' | 'click') => void;
  receiptPaperWidth: '58mm' | '80mm';
  setReceiptPaperWidth: (w: '58mm' | '80mm') => void;
  onPrint: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment,
  currentTenant,
  visibleBranches,
  lang,
  paymentMethod,
  setPaymentMethod,
  receiptPaperWidth,
  setReceiptPaperWidth,
  onPrint
}) => {
  if (!isOpen || !appointment) return null;

  const targetBranch = visibleBranches.find(b => b.id === appointment.clinicId) || visibleBranches[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-md w-full border border-[#C5A880]/50 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                Kassa Cheki (Termal Printer)
              </h3>
              <p className="text-[11px] text-gray-500">
                58mm va 80mm rasmiy tibbiy xizmat cheki
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper & Payment Controls */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              Printer formati:
            </label>
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setReceiptPaperWidth('58mm')}
                className={`flex-1 py-1.5 text-center font-mono font-bold transition ${
                  receiptPaperWidth === '58mm'
                    ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setReceiptPaperWidth('80mm')}
                className={`flex-1 py-1.5 text-center font-mono font-bold transition ${
                  receiptPaperWidth === '80mm'
                    ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                80mm
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
              To'lov turi:
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as any)}
              className="w-full py-1.5 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
            >
              <option value="cash">Naqd Pul</option>
              <option value="card">Bank Kartasi (Terminal)</option>
              <option value="click">Click / Payme (Online)</option>
            </select>
          </div>
        </div>

        {/* Thermal Print Preview Container */}
        <div className="p-3 bg-gray-100 dark:bg-[#07130F] rounded-2xl flex justify-center border border-gray-200 dark:border-gray-800">
          <div
            id="thermal-receipt-container"
            style={{ width: receiptPaperWidth === '58mm' ? '240px' : '320px' }}
            className="bg-white text-black p-4 rounded-xl shadow-md font-mono text-[11px] leading-snug"
          >
            {/* Clinic Branding Header */}
            <div className="text-center pb-2 border-b-2 border-black space-y-0.5">
              <div className="font-black text-sm uppercase tracking-wider">
                {currentTenant.name}
              </div>
              <div className="text-[10px] uppercase font-bold text-gray-700">
                {targetBranch?.name || "Bosh filial"}
              </div>
              <div className="text-[9px] text-gray-600">
                {targetBranch?.address.uz || targetBranch?.address.ru || "Toshkent shahar"}
              </div>
              <div className="text-[9px] text-gray-600">
                Tel: {targetBranch?.phone || "+998 (71) 200-00-00"}
              </div>
            </div>

            {/* Receipt Metadata */}
            <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Chek raqami:</span>
                <span className="font-bold">#{appointment.id}</span>
              </div>
              <div className="flex justify-between">
                <span>PIN-kod:</span>
                <span className="font-black text-xs font-mono">#{appointment.pinCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Sana & Vaqt:</span>
                <span>{appointment.date} {appointment.time}</span>
              </div>
              <div className="flex justify-between">
                <span>Bemor:</span>
                <span className="font-bold">{appointment.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Shifokor:</span>
                <span>{appointment.doctor.name}</span>
              </div>
            </div>

            {/* Items & Services */}
            <div className="py-2 border-b border-dashed border-black space-y-1">
              <div className="font-bold text-[10px] uppercase">Xizmatlar:</div>
              <div className="flex justify-between font-bold">
                <span>1. {appointment.service.title.uz}</span>
                <span>{(appointment.totalAmount || appointment.service.price || 400000).toLocaleString('uz-UZ')}</span>
              </div>
              {appointment.selectedTeethNumbers && appointment.selectedTeethNumbers.length > 0 && (
                <div className="text-[9px] text-gray-700">
                  Davolangan tishlar: #{appointment.selectedTeethNumbers.join(', #')}
                </div>
              )}
              {appointment.hasPromoUltrasonic && (
                <div className="flex justify-between text-[9px] text-gray-700">
                  <span>Aksiya (Ultratovushli tozalash 50%)</span>
                  <span>+200 000 UZS</span>
                </div>
              )}
            </div>

            {/* Total & Taxes */}
            <div className="py-2 border-b-2 border-black space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span>JAMI TO'LOV:</span>
                <span>{(appointment.totalAmount || appointment.service.price || 400000).toLocaleString('uz-UZ')} UZS</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span>To'lov turi:</span>
                <span className="uppercase font-bold">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[9px] text-gray-600">
                <span>QQS (0% Tibbiyot):</span>
                <span>0 UZS</span>
              </div>
            </div>

            {/* Fiscal Barcode Illustration */}
            <div className="text-center pt-3 pb-1 space-y-1">
              <div className="font-mono text-[9px] tracking-widest text-center">
                ||| | ||||| || |||||| |||| | |||
              </div>
              <div className="text-[8px] uppercase tracking-tighter">
                Fiskal belgi: 98402948102948
              </div>
              <div className="text-[9px] font-bold mt-1">
                Salomat bo'ling! Ishonchingiz uchun rahmat!
              </div>
              <div className="text-[8px] text-gray-500">
                www.dentamed.uz
              </div>
            </div>
          </div>
        </div>

        {/* Print & Close Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Yopish
          </button>
          <button
            onClick={onPrint}
            className="flex-1 py-2.5 rounded-xl bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Chop Etish (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
