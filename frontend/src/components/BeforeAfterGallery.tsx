import React, { useState } from 'react';
import { Language } from '../types';
import { BEFORE_AFTER_CASES } from '../data/mockData';
import { Sparkles, Check, ArrowRight, MoveHorizontal } from 'lucide-react';

interface BeforeAfterGalleryProps {
  lang: Language;
  onConsult: () => void;
}

export const BeforeAfterGallery: React.FC<BeforeAfterGalleryProps> = ({ lang, onConsult }) => {
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100 percentage

  const currentCase = BEFORE_AFTER_CASES[activeCaseIndex];

  return (
    <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-5 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <h3 className="font-serif font-bold text-lg text-[#1A221E] dark:text-[#FAF8F5] tracking-tight">
              {lang === 'uz' ? 'Estetik Natijalar (Oldin / Keyin)' : 'Результаты Работ (До / После)'}
            </h3>
          </div>
          <p className="text-xs text-[#627068] dark:text-[#9FB1A7] font-sans">
            {lang === 'uz'
              ? 'Interaktiv slayder orqali tabiiy estetikani baholang.'
              : 'Оцените естественную эстетику с помощью интерактивного слайдера.'}
          </p>
        </div>
      </div>

      {/* Case Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
        {BEFORE_AFTER_CASES.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveCaseIndex(idx);
              setSliderPos(50);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs tracking-wide transition-all ${
              activeCaseIndex === idx
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
                : 'bg-[#FAF8F5] dark:bg-[#183F32]/50 text-[#627068] dark:text-[#9FB1A7] border border-[#E8E2D8] dark:border-[#C5A880]/20 hover:border-[#C5A880]'
            }`}
          >
            {lang === 'uz' ? c.category.uz : c.category.ru}
          </button>
        ))}
      </div>

      {/* Interactive Before/After Viewport */}
      <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden select-none border border-[#E8E2D8] dark:border-[#183F32] shadow-inner">
        {/* "After" Image (Full background) */}
        <img
          src={currentCase.afterImg}
          alt="After treatment"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 bg-[#112E24]/85 backdrop-blur-md text-[#C5A880] border border-[#C5A880]/30 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase shadow">
          {lang === 'uz' ? 'Natija' : 'После'}
        </div>

        {/* "Before" Image (Clipped overlay with CSS clip-path for 100% distortion-free alignment) */}
        <div
          className="absolute inset-0 select-none pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img
            src={currentCase.beforeImg}
            alt="Before treatment"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-[#1A221E]/80 backdrop-blur-md text-[#FAF8F5] px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase shadow">
            {lang === 'uz' ? 'Dastlabki' : 'До'}
          </div>
        </div>

        {/* Divider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#C5A880] shadow-2xl cursor-ew-resize flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border-2 border-[#C5A880] shadow-xl flex items-center justify-center text-[#112E24]">
            <MoveHorizontal className="w-4 h-4 text-[#112E24]" />
          </div>
        </div>

        {/* Transparent Range Input Slider on top */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={e => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        />
      </div>

      {/* Description & Action */}
      <div className="bg-[#FAF8F5] dark:bg-[#0A1D16] p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-serif font-bold text-sm text-[#1A221E] dark:text-[#FAF8F5] mb-0.5">
            {lang === 'uz' ? currentCase.title.uz : currentCase.title.ru}
          </h4>
          <p className="text-[11px] text-[#627068] dark:text-[#9FB1A7] font-sans leading-relaxed">
            {lang === 'uz' ? currentCase.description.uz : currentCase.description.ru}
          </p>
        </div>

        <button
          onClick={onConsult}
          className="flex-shrink-0 flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] hover:bg-[#183F32] dark:hover:bg-[#D6BF9F] active:scale-95 text-[#FAF8F5] dark:text-[#07130F] px-4 py-2 rounded-full text-xs font-semibold tracking-wide shadow-sm transition-all"
        >
          <span>{lang === 'uz' ? 'Konsultatsiya olish' : 'Консультация'}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#C5A880] dark:text-[#07130F]" />
        </button>
      </div>
    </div>
  );
};
