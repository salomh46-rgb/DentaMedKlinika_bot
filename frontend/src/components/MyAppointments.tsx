import React from 'react';
import { Language, Appointment } from '../types';
import { Calendar, Clock, QrCode, AlertCircle, XCircle, BellRing, PhoneCall, ShieldCheck, MapPin, User, Info } from 'lucide-react';

interface MyAppointmentsProps {
  lang: Language;
  appointments: Appointment[];
  onCancel: (id: string) => void;
  onBookNew: () => void;
}

export const MyAppointments: React.FC<MyAppointmentsProps> = ({
  lang,
  appointments,
  onCancel,
  onBookNew
}) => {
  if (appointments.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-8 border border-[#E8E2D8] dark:border-[#183F32] text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#FAF8F5] dark:bg-[#183F32] text-[#C5A880] border border-[#E8E2D8] dark:border-[#C5A880]/30 flex items-center justify-center mx-auto">
          <Calendar className="w-8 h-8 text-[#C5A880]" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-base text-[#1A221E] dark:text-[#FAF8F5] mb-1">
            {lang === 'uz' ? 'Hozircha faol navbatlaringiz yo\'q' : 'У вас пока нет активных записей'}
          </h3>
          <p className="text-xs text-[#627068] dark:text-[#9FB1A7] max-w-xs mx-auto font-sans">
            {lang === 'uz'
              ? 'Shifokor ko\'rigi yoki muolajaga 1 daqiqada onlayn yoziling.'
              : 'Запишитесь на осмотр или лечение за 1 минуту онлайн.'}
          </p>
        </div>

        <button
          onClick={onBookNew}
          className="bg-[#112E24] dark:bg-[#C5A880] hover:bg-[#183F32] dark:hover:bg-[#D6BF9F] text-[#FAF8F5] dark:text-[#07130F] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide border border-[#C5A880]/40 shadow-sm transition active:scale-95"
        >
          {lang === 'uz' ? 'Yangi qabul olish' : 'Записаться на прием'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Reminder Notification Banner */}
      <div className="p-3.5 bg-[#FAF8F5] dark:bg-[#0A1D16] border border-[#E8E2D8] dark:border-[#183F32] rounded-2xl flex items-start gap-2.5 text-xs text-[#1A221E] dark:text-[#FAF8F5]">
        <BellRing className="w-4 h-4 text-[#C5A880] flex-shrink-0 mt-0.5" />
        <p className="font-sans font-light text-[#627068] dark:text-[#9FB1A7]">
          {lang === 'uz'
            ? 'Atelier Eslatmasi: Qabuldan 24 soat va 2 soat oldin Telegram va SMS orqali qabul eslatmasi yuboriladi.'
            : 'Автонапоминание: За 24 часа и 2 часа до приема вам придет напоминание в Telegram и по SMS.'}
        </p>
      </div>

      <div className="grid gap-3.5">
        {appointments.map(app => (
          <div
            key={app.id}
            className="bg-white dark:bg-[#0E231B] rounded-3xl p-5 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4 relative overflow-hidden"
          >
            {/* Top Badge & Status */}
            <div className="flex items-center justify-between border-b border-[#E8E2D8] dark:border-[#183F32] pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#112E24]/5 dark:bg-[#183F32]/60 text-[#112E24] dark:text-[#D6BF9F] text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-[#C5A880]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse"></span>
                  {lang === 'uz' ? 'Qabul Tasdiqlangan' : 'Прием подтвержден'}
                </span>
                <span className="font-mono text-[10px] font-semibold text-[#627068] dark:text-[#9FB1A7]">
                  #{app.id}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold text-[#112E24] dark:text-[#FAF8F5] bg-[#FAF8F5] dark:bg-[#183F32]/60 px-3 py-1 rounded-full border border-[#E8E2D8] dark:border-[#C5A880]/30">
                <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{app.date}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{app.time}</span>
              </div>
            </div>

            {/* Reception Fast PIN Code Banner */}
            <div className="bg-[#112E24] dark:bg-[#071711] rounded-2xl p-4 text-[#FAF8F5] flex items-center justify-between border border-[#C5A880]/30 shadow-sm">
              <div>
                <span className="text-[10px] text-[#D6BF9F] uppercase tracking-widest font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Retsepshnda aytiladigan kod:' : 'Код для регистратуры:'}</span>
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-[#C5A880]">
                    {app.pinCode || '8492'}
                  </span>
                  <span className="text-[10px] text-[#FAF8F5]/80 bg-white/10 px-2 py-0.5 rounded-full">
                    {lang === 'uz' ? 'Tezkor o\'tish' : 'Быстрый проход'}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow text-[#112E24]">
                <QrCode className="w-9 h-9 text-[#112E24]" />
                <span className="text-[7px] font-bold tracking-tighter text-[#627068] mt-0.5">ATELIER PASS</span>
              </div>
            </div>

            {/* Doctor & Clinic Info */}
            <div className="flex items-center gap-3 bg-[#FAF8F5] dark:bg-[#0A1D16] p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32]">
              <img
                src={app.doctor.photo}
                alt={app.doctor.name}
                className="w-12 h-12 rounded-xl object-cover object-top border border-white shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-xs text-[#1A221E] dark:text-[#FAF8F5] truncate">
                  {app.doctor.name}
                </h4>
                <p className="text-[11px] text-[#C5A880] font-medium truncate">
                  {lang === 'uz' ? app.service.title.uz : app.service.title.ru}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#627068] dark:text-[#9FB1A7]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#C5A880]" />
                    <span>{lang === 'uz' ? '2-qavat, 204-kabinet' : '2 этаж, каб. 204'}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3 text-[#C5A880]" />
                    <span>{app.patientName}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Reception Instruction note */}
            <div className="text-[11px] text-[#627068] dark:text-[#9FB1A7] bg-[#FAF8F5] dark:bg-[#0A1D16] p-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C5A880] flex-shrink-0" />
              <span className="font-light">
                {lang === 'uz'
                  ? 'Klinikaga kelganingizda retsepshn xodimiga 4 xonali kodni ayting yoki talonni ko\'rsating. Siz navbatsiz qabulga yo\'naltirilasiz.'
                  : 'По прибытии в клинику назовите 4-значный код или покажите талон. Вас пригласят без очереди.'}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#183F32] flex items-center justify-between gap-2">
              <a
                href="tel:+998712000000"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] bg-[#FAF8F5] dark:bg-[#0A1D16] hover:border-[#C5A880] border border-[#E8E2D8] dark:border-[#183F32] px-3.5 py-2 rounded-full transition"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{lang === 'uz' ? 'Qo\'ng\'iroq' : 'Связь'}</span>
              </a>

              <button
                onClick={() => onCancel(app.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3.5 py-2 rounded-full transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{lang === 'uz' ? 'Bekor qilish' : 'Отменить'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
