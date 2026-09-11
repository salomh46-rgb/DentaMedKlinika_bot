import React from 'react';
import { Language, Appointment } from '../types';
import { Calendar, Clock, QrCode, ShieldCheck, MapPin, User, Phone, CheckCircle2, X, Download, Share2, Sparkles, Percent } from 'lucide-react';
import { LuxuryToothIcon } from './LuxuryIcons';

interface DigitalTicketModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const DigitalTicketModal: React.FC<DigitalTicketModalProps> = ({
  lang,
  isOpen,
  onClose,
  appointment
}) => {
  if (!isOpen || !appointment) return null;

  const handleShare = () => {
    const text = lang === 'uz'
      ? `🎫 DENTAMED & LOR ATELIER Qabul Taloni\n№: ${appointment.id}\nRetsepshn PIN: ${appointment.pinCode}\nBemor: ${appointment.patientName}\nShifokor: ${appointment.doctor.name}\nSana: ${appointment.date}, ${appointment.time}`
      : `🎫 DENTAMED & LOR ATELIER Талон на прием\n№: ${appointment.id}\nPIN для рецепции: ${appointment.pinCode}\nПациент: ${appointment.patientName}\nВрач: ${appointment.doctor.name}\nДата: ${appointment.date}, ${appointment.time}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(text)}`);
    } else if (navigator.share) {
      navigator.share({ title: 'Dentamed Pass', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
      alert(lang === 'uz' ? "Talon ma'lumotlari nusxalandi!" : 'Данные талона скопированы!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md my-auto relative">
        {/* Close Button on Top */}
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Boarding Pass / Digital Ticket Card */}
        <div className="bg-[#FAF8F5] dark:bg-[#0E231B] text-[#1A221E] dark:text-[#FAF8F5] rounded-3xl shadow-2xl border border-[#C5A880]/50 overflow-hidden relative">
          {/* Top Pass Header */}
          <div className="bg-gradient-to-r from-[#112E24] via-[#183F32] to-[#112E24] p-5 text-white relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#C5A880]/25 border border-[#C5A880]/40 flex items-center justify-center text-[#C5A880]">
                  <LuxuryToothIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm tracking-wide text-[#FAF8F5]">
                    DENTAMED & LOR
                  </h3>
                  <span className="text-[9px] uppercase tracking-widest text-[#D6BF9F] block">
                    Swiss Medical Atelier
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="bg-[#C5A880] text-[#112E24] text-[9.5px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider block">
                  {lang === 'uz' ? 'Raqamli Chipta' : 'Э-Талон'}
                </span>
                <span className="font-mono text-[10px] text-[#D6BF9F] font-semibold mt-1 block">
                  #{appointment.id}
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs border-t border-white/10 pt-3">
              <div>
                <span className="text-[9.5px] text-[#D6BF9F] uppercase tracking-wider block font-light">
                  {lang === 'uz' ? 'Bemor F.I.SH' : 'Пациент'}
                </span>
                <span className="font-serif font-bold text-sm text-white truncate max-w-[170px] block">
                  {appointment.patientName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9.5px] text-[#D6BF9F] uppercase tracking-wider block font-light">
                  {lang === 'uz' ? 'Telefon' : 'Телефон'}
                </span>
                <span className="font-mono text-xs text-white font-medium block">
                  {appointment.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Perforated Divider (Boarding Pass Notch) */}
          <div className="relative flex items-center justify-between bg-transparent -my-3 px-1 z-10 pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-black/75 -ml-4 border-r border-[#C5A880]/40"></div>
            <div className="flex-1 border-b-2 border-dashed border-[#C5A880]/40 mx-2"></div>
            <div className="w-6 h-6 rounded-full bg-black/75 -mr-4 border-l border-[#C5A880]/40"></div>
          </div>

          {/* Ticket Body */}
          <div className="p-5 space-y-4">
            {/* Reception Fast PIN Code Banner */}
            <div className="bg-[#112E24] dark:bg-[#071711] text-[#FAF8F5] rounded-2xl p-4 flex items-center justify-between border border-[#C5A880]/40 shadow-sm">
              <div>
                <span className="text-[9.5px] text-[#D6BF9F] uppercase tracking-widest font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Retsepshn PIN-kodi:' : 'Код для рецепции:'}</span>
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-mono font-bold tracking-widest text-[#C5A880]">
                    {appointment.pinCode || '8492'}
                  </span>
                  <span className="text-[9.5px] text-white/80 bg-white/10 px-2 py-0.5 rounded-full">
                    {lang === 'uz' ? 'Navbatsiz' : 'Экспресс'}
                  </span>
                </div>
              </div>

              {/* QR Code Matrix */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow text-[#112E24]">
                <QrCode className="w-12 h-12 text-[#112E24]" />
                <span className="text-[7px] font-bold tracking-tighter text-[#627068] mt-0.5">SCAN TO CHECKIN</span>
              </div>
            </div>

            {/* Date, Time & Doctor Details */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white dark:bg-[#0A1D16] p-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32]">
                <span className="text-[9.5px] text-[#627068] dark:text-[#9FB1A7] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C5A880]" />
                  {lang === 'uz' ? 'Qabul Sanasi:' : 'Дата приема:'}
                </span>
                <span className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5] block mt-0.5">
                  {appointment.date}
                </span>
                <span className="text-[10px] text-[#C5A880] font-mono flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> {appointment.time}
                </span>
              </div>

              <div className="bg-white dark:bg-[#0A1D16] p-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32]">
                <span className="text-[9.5px] text-[#627068] dark:text-[#9FB1A7] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#C5A880]" />
                  {lang === 'uz' ? 'Shifokor:' : 'Лечащий врач:'}
                </span>
                <span className="font-serif font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] truncate block mt-0.5">
                  {appointment.doctor.name}
                </span>
                <span className="text-[10px] text-[#627068] dark:text-[#9FB1A7] truncate block mt-0.5">
                  {lang === 'uz' ? appointment.doctor.specialty.uz : appointment.doctor.specialty.ru}
                </span>
              </div>
            </div>

            {/* Selected Service & Teeth Details */}
            <div className="bg-white dark:bg-[#0A1D16] p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#112E24] dark:text-[#FAF8F5]">
                  {lang === 'uz' ? appointment.service.title.uz : appointment.service.title.ru}
                </span>
                <span className="font-mono font-bold text-[#C5A880]">
                  {(appointment.totalAmount || appointment.service.price).toLocaleString('uz-UZ')} {lang === 'uz' ? "so'm" : 'сум'}
                </span>
              </div>

              {/* Selected Teeth list */}
              {appointment.selectedTeethNumbers && appointment.selectedTeethNumbers.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#627068] dark:text-[#9FB1A7]">
                  <span>{lang === 'uz' ? 'Tanlangan tishlar:' : 'Зубы:'}</span>
                  <div className="flex flex-wrap gap-1">
                    {appointment.selectedTeethNumbers.map(n => (
                      <span key={n} className="bg-[#112E24]/10 dark:bg-[#183F32] text-[#112E24] dark:text-[#FAF8F5] px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">
                        №{n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cross-Promo Applied Note */}
              {appointment.hasPromoUltrasonic && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 p-2 rounded-xl flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    <span>{lang === 'uz' ? 'Ultratovushli tozalash 50% chegirmada' : 'Ультразвуковая чистка со скидкой 50%'}</span>
                  </span>
                  <span className="font-bold">-200 000 {lang === 'uz' ? "so'm" : 'сум'}</span>
                </div>
              )}
            </div>

            {/* Address & Instructions */}
            <div className="text-[10.5px] text-[#627068] dark:text-[#9FB1A7] flex items-center gap-2 bg-[#FAF8F5] dark:bg-[#0A1D16] p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32]">
              <MapPin className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
              <span>
                {lang === 'uz'
                  ? "Toshkent, Navoiy ko'chasi 14 (Sirk ro'parasi), 204-kabinet"
                  : 'Ташкент, ул. Навои 14 (напротив Цирка), каб. 204'}
              </span>
            </div>

            {/* Actions: Share / Telegram & Close */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 bg-[#2AABEE] hover:bg-[#229ED9] active:scale-95 text-white font-bold text-xs py-3 rounded-full shadow transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{lang === 'uz' ? 'Ulashish' : 'Поделиться'}</span>
              </button>

              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 bg-[#112E24] dark:bg-[#C5A880] hover:bg-[#183F32] dark:hover:bg-[#D6BF9F] active:scale-95 text-[#FAF8F5] dark:text-[#07130F] font-bold text-xs py-3 rounded-full shadow transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lang === 'uz' ? 'Tushundim' : 'Готово'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

