import React from 'react';
import { Language } from '../types';
import { Gift, ArrowRight, Stethoscope, Sparkles } from 'lucide-react';

interface CrossPromoBannerProps {
  lang: Language;
  onClaim: () => void;
}

export const CrossPromoBanner: React.FC<CrossPromoBannerProps> = ({ lang, onClaim }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#112E24] dark:bg-[#0A1D16] border border-[#C5A880]/30 dark:border-[#C5A880]/40 p-5 text-[#FAF8F5] shadow-lg shadow-[#112E24]/10 dark:shadow-black/40 mb-6">
      {/* Background luxury glow and watermark */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#C5A880]/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-4 top-4 text-[#C5A880]/15 pointer-events-none">
        <Stethoscope className="w-20 h-20" />
      </div>

      <div className="relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#D6BF9F] px-3 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wider uppercase mb-2.5">
          <Gift className="w-3 h-3 text-[#C5A880]" />
          <span>{lang === 'uz' ? 'Eksklyuziv Atelier Taklifi' : 'Эксклюзивное Предложение'}</span>
        </div>

        <h3 className="font-serif text-lg sm:text-xl font-bold leading-snug mb-1.5 text-[#FAF8F5] max-w-sm">
          {lang === 'uz'
            ? 'Tish davolatganga LOR ko\'rigi — 50% Imtiyoz'
            : 'При лечении зубов — консультация ЛОР со скидкой 50%'}
        </h3>

        <p className="text-xs text-[#FAF8F5]/80 mb-4 max-w-sm leading-relaxed font-sans font-light">
          {lang === 'uz'
            ? 'Gaymorit va tish kanallari o\'zaro bog\'liq. Shveysariya protokoli bo\'yicha kompleks tashxisdan o\'ting.'
            : 'Здоровье корней зубов и гайморовых пазух связано. Пройдите комплексную диагностику по швейцарскому протоколу.'}
        </p>

        <button
          onClick={onClaim}
          className="inline-flex items-center gap-2 bg-[#C5A880] hover:bg-[#D6BF9F] active:scale-95 text-[#112E24] px-4 py-2 rounded-full font-bold text-xs tracking-wide shadow-md transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#112E24]" />
          <span>{lang === 'uz' ? 'Imtiyoz bilan yozilish' : 'Записаться по привилегии'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
