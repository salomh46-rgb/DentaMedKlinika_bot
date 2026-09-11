import React, { useState } from 'react';
import { Language } from '../types';
import { PhoneCall, Send, AlertTriangle, X, ShieldAlert, Clock, MapPin } from 'lucide-react';

interface EmergencyFloatingButtonProps {
  lang: Language;
}

export const EmergencyFloatingButton: React.FC<EmergencyFloatingButtonProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);

  const emergencyPhone = '+998712000303';
  const adminTelegramUrl = 'https://t.me/dentamed_admin';

  const handleOpenTelegram = () => {
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(adminTelegramUrl);
    } else {
      window.open(adminTelegramUrl, '_blank');
    }
  };

  return (
    <>
      {/* Floating SOS Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 bg-gradient-to-r from-rose-600 via-rose-700 to-[#112E24] text-white px-4 py-3 rounded-full shadow-2xl border-2 border-[#C5A880]/50 hover:scale-105 active:scale-95 transition-all duration-300"
          aria-label="Favqulodda yordam"
        >
          {/* Pulsing Radar Ring */}
          <span className="absolute -inset-1 rounded-full bg-rose-600/40 animate-ping pointer-events-none"></span>
          
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <PhoneCall className="w-4 h-4 text-white animate-pulse" />
          </div>
          
          <div className="text-left hidden xs:block sm:block pr-1">
            <span className="text-[9px] uppercase tracking-widest text-[#D6BF9F] font-bold block leading-none">
              {lang === 'uz' ? '24/7 SOS' : '24/7 SOS'}
            </span>
            <span className="text-xs font-bold font-serif leading-tight">
              {lang === 'uz' ? 'Tezkor Yordam' : 'Срочная Помощь'}
            </span>
          </div>

          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
          </span>
        </button>
      </div>

      {/* Emergency Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FAF8F5] dark:bg-[#0A1D16] border border-[#C5A880]/40 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl text-[#1A221E] dark:text-[#FAF8F5] space-y-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center text-[#627068] dark:text-[#9FB1A7] transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 flex-shrink-0">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {lang === 'uz' ? 'Shoshilinch Bog\'lanish' : 'Экстренная Связь'}
                  </span>
                  <span className="text-[10px] text-[#627068] dark:text-[#9FB1A7] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#C5A880]" /> 24/7
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg leading-tight mt-0.5">
                  {lang === 'uz' ? 'Klinika Administratori & SOS' : 'Администратор Клиники & SOS'}
                </h3>
              </div>
            </div>

            {/* Acute Pain Advisory */}
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-3.5 rounded-2xl text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <AlertTriangle className="w-4 h-4" />
                <span>{lang === 'uz' ? 'O\'tkir tish yoki quloq og\'rig\'i bormi?' : 'Острая боль зуба или уха?'}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {lang === 'uz'
                  ? 'Bemorlarimiz uchun navbatsiz shoshilinch qabul mavjud. Shifokorimiz darhol og\'riq qoldiruvchi shveysariya protokolini qo\'llaydi.'
                  : 'Для пациентов с острой болью действует прием без очереди. Дежурный врач окажет экстренную помощь.'}
              </p>
            </div>

            {/* Direct Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Phone Call */}
              <a
                href={`tel:${emergencyPhone}`}
                className="flex items-center justify-center gap-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3.5 px-4 rounded-2xl shadow-md transition active:scale-95 text-center"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{lang === 'uz' ? 'Qo\'ng\'iroq qilish' : 'Позвонить в клинику'}</span>
              </a>

              {/* Telegram Chat */}
              <button
                onClick={handleOpenTelegram}
                className="flex items-center justify-center gap-2.5 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-xs py-3.5 px-4 rounded-2xl shadow-md transition active:scale-95 text-center"
              >
                <Send className="w-4 h-4" />
                <span>{lang === 'uz' ? 'Telegram Yordamchi' : 'Telegram Чат'}</span>
              </button>
            </div>

            {/* Location & Details */}
            <div className="bg-white dark:bg-[#0E231B] p-3 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex items-center gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#183F32] flex items-center justify-center text-[#C5A880] flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="font-semibold block text-[#112E24] dark:text-[#FAF8F5]">
                  {lang === 'uz' ? 'Toshkent, Navoiy ko\'chasi 14-uy' : 'Ташкент, ул. Навои 14'}
                </span>
                <span className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">
                  {lang === 'uz' ? 'Mo\'ljal: Sirk bekati, shoshilinch qabul 24/7' : 'Ориентир: ст. м. Цирк, дежурный вход 24/7'}
                </span>
              </div>
            </div>

            {/* Close action */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs text-[#627068] dark:text-[#9FB1A7] hover:text-[#112E24] dark:hover:text-[#FAF8F5] py-1 font-medium transition"
            >
              {lang === 'uz' ? 'Yopish' : 'Закрыть'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
