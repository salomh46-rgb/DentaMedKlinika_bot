import React, { useState } from 'react';
import { ToothData, Language } from '../types';
import { Eye, EyeOff, Stethoscope, ArrowLeft, ArrowRight, Lightbulb, MousePointerClick, Zap } from 'lucide-react';
import { LuxuryArchIcon, LuxuryToothIcon, LuxuryScanBoxIcon, LuxuryMirrorIcon } from './LuxuryIcons';

interface InteractiveJawModelProps {
  lang: Language;
  teeth: ToothData[];
  selectedTooth: ToothData | null;
  onSelectTooth: (tooth: ToothData) => void;
  activeArch: 'minimal' | 'upper' | 'lower' | 'photo';
  onChangeArch: (arch: 'minimal' | 'upper' | 'lower' | 'photo') => void;
}

interface ToothPos {
  number: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  type: 'molar' | 'premolar' | 'canine' | 'incisor';
}

// 1-RASMDAGI MINIMALIST AESTHETIC 32-TOOTH COMPLETE ARCH
const MINIMAL_TEETH_POS: ToothPos[] = [
  // Yuqori o'ng (Upper Right: 18 -> 11)
  { number: 18, x: 62, y: 205, w: 26, h: 25, rotation: 90, type: 'molar' },
  { number: 17, x: 64, y: 172, w: 27, h: 25, rotation: 78, type: 'molar' },
  { number: 16, x: 70, y: 140, w: 28, h: 26, rotation: 65, type: 'molar' },
  { number: 15, x: 80, y: 112, w: 22, h: 22, rotation: 52, type: 'premolar' },
  { number: 14, x: 96, y: 88,  w: 22, h: 22, rotation: 40, type: 'premolar' },
  { number: 13, x: 116, y: 69, w: 20, h: 22, rotation: 28, type: 'canine' },
  { number: 12, x: 138, y: 57, w: 19, h: 20, rotation: 14, type: 'incisor' },
  { number: 11, x: 160, y: 52, w: 20, h: 21, rotation: 3,  type: 'incisor' },

  // Yuqori chap (Upper Left: 21 -> 28)
  { number: 21, x: 180, y: 52, w: 20, h: 21, rotation: -3,  type: 'incisor' },
  { number: 22, x: 202, y: 57, w: 19, h: 20, rotation: -14, type: 'incisor' },
  { number: 23, x: 224, y: 69, w: 20, h: 22, rotation: -28, type: 'canine' },
  { number: 24, x: 244, y: 88, w: 22, h: 22, rotation: -40, type: 'premolar' },
  { number: 25, x: 260, y: 112, w: 22, h: 22, rotation: -52, type: 'premolar' },
  { number: 26, x: 270, y: 140, w: 28, h: 26, rotation: -65, type: 'molar' },
  { number: 27, x: 276, y: 172, w: 27, h: 25, rotation: -78, type: 'molar' },
  { number: 28, x: 278, y: 205, w: 26, h: 25, rotation: -90, type: 'molar' },

  // Pastki o'ng (Lower Right: 48 -> 41)
  { number: 48, x: 62, y: 235, w: 26, h: 25, rotation: -90, type: 'molar' },
  { number: 47, x: 64, y: 268, w: 27, h: 25, rotation: -78, type: 'molar' },
  { number: 46, x: 70, y: 300, w: 28, h: 26, rotation: -65, type: 'molar' },
  { number: 45, x: 80, y: 328, w: 22, h: 22, rotation: -52, type: 'premolar' },
  { number: 44, x: 96, y: 352, w: 22, h: 22, rotation: -40, type: 'premolar' },
  { number: 43, x: 116, y: 371, w: 20, h: 22, rotation: -28, type: 'canine' },
  { number: 42, x: 138, y: 383, w: 19, h: 20, rotation: -14, type: 'incisor' },
  { number: 41, x: 160, y: 388, w: 19, h: 21, rotation: -3,  type: 'incisor' },

  // Pastki chap (Lower Left: 31 -> 38)
  { number: 31, x: 180, y: 388, w: 19, h: 21, rotation: 3,   type: 'incisor' },
  { number: 32, x: 202, y: 383, w: 19, h: 20, rotation: 14,  type: 'incisor' },
  { number: 33, x: 224, y: 371, w: 20, h: 22, rotation: 28,  type: 'canine' },
  { number: 34, x: 244, y: 352, w: 22, h: 22, rotation: 40,  type: 'premolar' },
  { number: 35, x: 260, y: 328, w: 22, h: 22, rotation: 52,  type: 'premolar' },
  { number: 36, x: 270, y: 300, w: 28, h: 26, rotation: 65,  type: 'molar' },
  { number: 37, x: 276, y: 268, w: 27, h: 25, rotation: 78,  type: 'molar' },
  { number: 38, x: 278, y: 235, w: 26, h: 25, rotation: 90,  type: 'molar' }
];

// ANATOMICALLY ACCURATE UPPER JAW (Maxilla - teeth curve with incisors at top apex)
const UPPER_TEETH_POS: ToothPos[] = [
  // O'ng tomon (Right quadrant: 18 -> 11)
  { number: 18, x: 74, y: 255, w: 30, h: 28, rotation: 8, type: 'molar' },
  { number: 17, x: 78, y: 210, w: 32, h: 30, rotation: 14, type: 'molar' },
  { number: 16, x: 86, y: 165, w: 34, h: 32, rotation: 22, type: 'molar' }, // Katta oziq tish
  { number: 15, x: 99, y: 126, w: 26, h: 26, rotation: 32, type: 'premolar' },
  { number: 14, x: 118, y: 96, w: 26, h: 26, rotation: 44, type: 'premolar' },
  { number: 13, x: 139, y: 74, w: 24, h: 26, rotation: 58, type: 'canine' }, // Qoziq
  { number: 12, x: 162, y: 62, w: 22, h: 25, rotation: 74, type: 'incisor' },
  { number: 11, x: 186, y: 58, w: 24, h: 26, rotation: 88, type: 'incisor' }, // Markaziy oldingi

  // Chap tomon (Left quadrant: 21 -> 28 - exact mirror)
  { number: 21, x: 214, y: 58, w: 24, h: 26, rotation: -88, type: 'incisor' }, // Markaziy oldingi
  { number: 22, x: 238, y: 62, w: 22, h: 25, rotation: -74, type: 'incisor' },
  { number: 23, x: 261, y: 74, w: 24, h: 26, rotation: -58, type: 'canine' }, // Qoziq
  { number: 24, x: 282, y: 96, w: 26, h: 26, rotation: -44, type: 'premolar' },
  { number: 25, x: 301, y: 126, w: 26, h: 26, rotation: -32, type: 'premolar' },
  { number: 26, x: 314, y: 165, w: 34, h: 32, rotation: -22, type: 'molar' }, // Katta oziq tish
  { number: 27, x: 322, y: 210, w: 32, h: 30, rotation: -14, type: 'molar' },
  { number: 28, x: 326, y: 255, w: 30, h: 28, rotation: -8, type: 'molar' }
];

// ANATOMICALLY ACCURATE LOWER JAW (Mandibula - in open mouth view, front teeth at bottom front!)
const LOWER_TEETH_POS: ToothPos[] = [
  // O'ng tomon (Right quadrant: 48 at top back down to 41 at bottom front)
  { number: 48, x: 74, y: 75, w: 30, h: 28, rotation: -8, type: 'molar' },
  { number: 47, x: 78, y: 120, w: 32, h: 30, rotation: -14, type: 'molar' },
  { number: 46, x: 86, y: 165, w: 34, h: 32, rotation: -22, type: 'molar' }, // Katta oziq tish
  { number: 45, x: 99, y: 204, w: 26, h: 26, rotation: -32, type: 'premolar' },
  { number: 44, x: 118, y: 234, w: 26, h: 26, rotation: -44, type: 'premolar' },
  { number: 43, x: 139, y: 256, w: 24, h: 26, rotation: -58, type: 'canine' },
  { number: 42, x: 162, y: 268, w: 22, h: 25, rotation: -74, type: 'incisor' },
  { number: 41, x: 186, y: 272, w: 22, h: 26, rotation: -88, type: 'incisor' },

  // Chap tomon (Left quadrant: 31 at bottom front up to 38 at top back)
  { number: 31, x: 214, y: 272, w: 22, h: 26, rotation: 88, type: 'incisor' },
  { number: 32, x: 238, y: 268, w: 22, h: 25, rotation: 74, type: 'incisor' },
  { number: 33, x: 261, y: 256, w: 24, h: 26, rotation: 58, type: 'canine' },
  { number: 34, x: 282, y: 234, w: 26, h: 26, rotation: 44, type: 'premolar' },
  { number: 35, x: 301, y: 204, w: 26, h: 26, rotation: 32, type: 'premolar' },
  { number: 36, x: 314, y: 165, w: 34, h: 32, rotation: 22, type: 'molar' }, // Katta oziq tish
  { number: 37, x: 322, y: 120, w: 32, h: 30, rotation: 14, type: 'molar' },
  { number: 38, x: 326, y: 75, w: 30, h: 28, rotation: 8, type: 'molar' }
];

export const InteractiveJawModel: React.FC<InteractiveJawModelProps> = ({
  lang,
  teeth,
  selectedTooth,
  onSelectTooth,
  activeArch,
  onChangeArch
}) => {
  // 'mirror': User's right side is on the right of screen (selfie / mirror view)
  // 'clinical': Doctor view (FDI standard where patient right is screen left)
  const [viewMode, setViewMode] = useState<'mirror' | 'clinical'>('mirror');
  // Clean realistic teeth without numbers by default
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  const currentPositions = activeArch === 'upper' ? UPPER_TEETH_POS : activeArch === 'minimal' ? MINIMAL_TEETH_POS : LOWER_TEETH_POS;

  const handleToothClick = (tooth: ToothData) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    onSelectTooth(tooth);
  };

  return (
    <div className="space-y-3">
      {/* Mode Controls: Mirror vs Clinical & Number Toggle */}
      <div className="flex items-center justify-between px-1 text-xs">
        {/* Mirror vs Doctor View Switcher */}
        <div className="inline-flex bg-[#EBE5DC]/70 dark:bg-[#0E231B] p-1 rounded-full border border-[#E8E2D8] dark:border-[#C5A880]/20 gap-1">
          <button
            onClick={() => setViewMode('mirror')}
            className={`px-3 py-1 rounded-full font-medium text-[11px] transition flex items-center gap-1.5 ${
              viewMode === 'mirror'
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
                : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5]'
            }`}
            title={lang === 'uz' ? 'Oyna ko\'rinishi: o\'ng tomoningiz o\'ngda' : 'Зеркальный вид: ваша правая сторона справа'}
          >
            <LuxuryMirrorIcon className="w-3.5 h-3.5" />
            <span>{lang === 'uz' ? 'Ko\'zgu' : 'Как в зеркале'}</span>
          </button>
          <button
            onClick={() => setViewMode('clinical')}
            className={`px-3 py-1 rounded-full font-medium text-[11px] transition flex items-center gap-1.5 ${
              viewMode === 'clinical'
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
                : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5]'
            }`}
            title={lang === 'uz' ? 'Shifokor nigohi: standart stomatologik ko\'rinish' : 'Взгляд врача: стоматологический стандарт FDI'}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{lang === 'uz' ? 'FDI Standart' : 'Врачебный'}</span>
          </button>
        </div>

        {/* Numbers Toggle */}
        <button
          onClick={() => setShowNumbers(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            showNumbers
              ? 'bg-[#112E24] dark:bg-[#C5A880] border-[#112E24] dark:border-[#C5A880] text-[#FAF8F5] dark:text-[#07130F]'
              : 'bg-white dark:bg-[#0E231B] border-[#E8E2D8] dark:border-[#C5A880]/20 text-[#627068] dark:text-[#9FB1A7] hover:border-[#C5A880]'
          }`}
        >
          {showNumbers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{lang === 'uz' ? 'Raqamlar' : 'Номера'}</span>
        </button>
      </div>

      {/* VIEW A: 1-RASMDAGI MINIMALIST AESTHETIC 32-TOOTH DENTAL ARCH */}
      {activeArch === 'minimal' ? (
        <div className="relative bg-[#FAF8F5] dark:bg-[#07130F] rounded-3xl p-3 sm:p-5 border border-[#E8E2D8] dark:border-[#C5A880]/25 shadow-sm overflow-hidden bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:18px_18px]">
          {/* Side Indicators */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-medium text-[#627068] dark:text-[#9FB1A7] border-b border-[#E8E2D8] dark:border-[#C5A880]/20 pb-2 mb-2">
            <span className="flex items-center gap-1.5 text-[#112E24] dark:text-[#FAF8F5] font-semibold">
              <ArrowLeft className="w-3 h-3 text-[#C5A880]" />
              <span>{viewMode === 'mirror' ? (lang === 'uz' ? 'Chap tomoningiz' : 'Ваша левая') : (lang === 'uz' ? 'O\'ng tomon (FDI)' : 'Правая (FDI)')}</span>
            </span>
            <span className="bg-white dark:bg-[#0E231B] text-[#112E24] dark:text-[#FAF8F5] px-3 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border border-[#E8E2D8] dark:border-[#C5A880]/25">
              {lang === 'uz' ? '32 Tish To\'liq Yoyi' : 'Полная дуга 32 зуба'}
            </span>
            <span className="flex items-center gap-1.5 text-[#112E24] dark:text-[#FAF8F5] font-semibold">
              <span>{viewMode === 'mirror' ? (lang === 'uz' ? 'O\'ng tomoningiz' : 'Ваша правая') : (lang === 'uz' ? 'Chap tomon (FDI)' : 'Левая (FDI)')}</span>
              <ArrowRight className="w-3 h-3 text-[#C5A880]" />
            </span>
          </div>

          <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[340/430] select-none">
            {/* Center prompt icon and text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none text-[#627068] dark:text-[#9FB1A7] z-0 text-center">
              <MousePointerClick className="w-6 h-6 text-[#C5A880] animate-bounce mb-1" />
              <span className="text-xs font-semibold text-[#112E24] dark:text-[#FAF8F5] mt-0.5">
                {lang === 'uz' ? 'Tishni tanlang' : 'Click to select a tooth'}
              </span>
              <span className="text-[10px] text-[#627068] dark:text-[#9FB1A7] font-light">
                {lang === 'uz' ? 'Anatomik chaynash yuzasi' : 'Анатомическая поверхность'}
              </span>
            </div>

            <svg viewBox="0 0 340 440" className="w-full h-full relative z-10 filter drop-shadow-sm">
              {/* Ellipse Arch Reference Guide Line */}
              <ellipse cx="170" cy="220" rx="108" ry="165" fill="none" stroke="#C5A880" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* 32 Teeth Rendered with Clean Medical Vector Art */}
              {MINIMAL_TEETH_POS.map(pos => {
                const tooth = teeth.find(t => t.number === pos.number);
                if (!tooth) return null;

                const isSelected = selectedTooth?.number === tooth.number;
                const isCaries = tooth.condition === 'caries';
                const isFilling = tooth.condition === 'filling';
                const isCrown = tooth.condition === 'crown';

                const renderX = viewMode === 'mirror' ? 340 - pos.x : pos.x;
                const renderRot = viewMode === 'mirror' ? -pos.rotation : pos.rotation;

                let strokeColor = '#94a3b8';
                let fillColor = '#ffffff';
                if (isCaries) {
                  strokeColor = '#f43f5e';
                  fillColor = '#ffe4e6';
                } else if (isFilling) {
                  strokeColor = '#0284c7';
                  fillColor = '#e0f2fe';
                } else if (isCrown) {
                  strokeColor = '#f59e0b';
                  fillColor = '#fef3c7';
                }

                if (isSelected) {
                  strokeColor = isCaries ? '#e11d48' : '#112E24';
                  fillColor = isCaries ? '#fecdd3' : '#FAF8F5';
                }

                return (
                  <g
                    key={tooth.number}
                    onClick={() => handleToothClick(tooth)}
                    className="cursor-pointer transition-all duration-200 group"
                  >
                    {/* Glowing Selection Aura */}
                    {isSelected && (
                      <circle
                        cx={renderX}
                        cy={pos.y}
                        r={pos.w * 0.82}
                        fill="none"
                        stroke={isCaries ? '#f43f5e' : '#C5A880'}
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ transformOrigin: `${renderX}px ${pos.y}px`, animationDuration: '6s' }}
                      />
                    )}

                    {/* Red / Gold Beacon Halo for Caries or Active */}
                    {(isCaries || isSelected) && (
                      <circle
                        cx={renderX}
                        cy={pos.y}
                        r={pos.w * 0.9}
                        fill={isCaries ? '#f43f5e' : '#C5A880'}
                        opacity="0.22"
                        className="animate-pulse"
                      />
                    )}

                    {/* Tooth Body & Anatomical Fissures (Matching Reference Image 1) */}
                    <g transform={`translate(${renderX}, ${pos.y}) rotate(${renderRot})`}>
                      {pos.type === 'molar' ? (
                        <g>
                          <rect
                            x={-pos.w / 2}
                            y={-pos.h / 2}
                            width={pos.w}
                            height={pos.h}
                            rx={6.5}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.8}
                          />
                          {/* 4-Lobe Fissures */}
                          <path
                            d="M -5 -5 Q 0 0 5 5 M -5 5 Q 0 0 5 -5"
                            stroke={isCaries ? '#be123c' : isFilling ? '#0284c7' : '#94a3b8'}
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            fill="none"
                          />
                          <circle cx="0" cy="0" r={isCaries ? 2.5 : 1.2} fill={isCaries ? '#e11d48' : '#94a3b8'} />
                        </g>
                      ) : pos.type === 'premolar' ? (
                        <g>
                          <rect
                            x={-pos.w / 2}
                            y={-pos.h / 2}
                            width={pos.w}
                            height={pos.h}
                            rx={pos.w / 2}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.8}
                          />
                          {/* Dual-Arc Fissure */}
                          <path
                            d="M -3 -3 Q 0 0 -3 3 M 3 -3 Q 0 0 3 3"
                            stroke={isCaries ? '#be123c' : '#94a3b8'}
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </g>
                      ) : pos.type === 'canine' ? (
                        <g>
                          <path
                            d={`M ${-pos.w * 0.42} ${pos.h * 0.35} Q 0 ${-pos.h * 0.58} ${pos.w * 0.42} ${pos.h * 0.35} Q 0 ${pos.h * 0.45} ${-pos.w * 0.42} ${pos.h * 0.35} Z`}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.8}
                          />
                        </g>
                      ) : (
                        <g>
                          <rect
                            x={-pos.w * 0.46}
                            y={-pos.h * 0.35}
                            width={pos.w * 0.92}
                            height={pos.h * 0.7}
                            rx={3}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? 2.5 : 1.8}
                          />
                          <line x1={-pos.w * 0.25} y1="0" x2={pos.w * 0.25} y2="0" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" />
                        </g>
                      )}

                      {/* Number if toggled */}
                      {showNumbers && (
                        <text
                          x="0"
                          y={1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8.5"
                          fontWeight="900"
                          fill={isCaries ? '#991b1b' : '#334155'}
                          className="pointer-events-none select-none font-mono"
                        >
                          {tooth.number}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* RENDER ACTIVE TOOLTIP AS LAST SVG ELEMENT SO IT IS ALWAYS ON TOP */}
              {(() => {
                if (!selectedTooth) return null;
                const pos = MINIMAL_TEETH_POS.find(p => p.number === selectedTooth.number);
                if (!pos) return null;

                const isCaries = selectedTooth.condition === 'caries';
                const isFilling = selectedTooth.condition === 'filling';
                const renderX = viewMode === 'mirror' ? 340 - pos.x : pos.x;

                // Smart offset towards center cavity of arch (170, 220) so tooltip stays clear of other teeth
                const deltaX = 170 - renderX;
                const deltaY = 220 - pos.y;
                const dist = Math.hypot(deltaX, deltaY) || 1;
                const tooltipX = renderX + (deltaX / dist) * 32;
                const tooltipY = pos.y + (deltaY / dist) * 32;

                return (
                  <g transform={`translate(${tooltipX}, ${tooltipY})`} className="pointer-events-none select-none filter drop-shadow-xl z-50">
                    <rect
                      x="-54"
                      y="-13"
                      width="108"
                      height="26"
                      rx="8"
                      fill="#112E24"
                      stroke="#C5A880"
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y="1.5"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="9.5"
                      fontWeight="700"
                      fill={isCaries ? '#fca5a5' : isFilling ? '#93c5fd' : '#FAF8F5'}
                    >
                      №{selectedTooth.number} {pos.type === 'canine' ? (lang === 'uz' ? 'Qoziq' : 'Клык') : pos.type === 'molar' ? (lang === 'uz' ? 'Oziq' : 'Моляр') : pos.type === 'premolar' ? (lang === 'uz' ? 'Kichik' : 'Премоляр') : (lang === 'uz' ? 'Oldingi' : 'Резец')}
                    </text>
                    {/* Small gold pin indicator pointing back to tooth */}
                    <circle cx={(renderX - tooltipX) * 0.4} cy={(pos.y - tooltipY) * 0.4} r="3" fill={isCaries ? '#ef4444' : '#C5A880'} />
                  </g>
                );
              })()}
            </svg>
          </div>

          <div className="relative z-10 text-center text-[11px] text-[#112E24] dark:text-[#FAF8F5] bg-white/80 dark:bg-[#0E231B]/80 py-2 px-3 rounded-2xl border border-[#E8E2D8] dark:border-[#C5A880]/20 flex items-center justify-center gap-2 mt-2 font-medium">
            <Lightbulb className="w-3.5 h-3.5 text-[#C5A880] flex-shrink-0" />
            <span>
              {lang === 'uz'
                ? 'Istalgan tish ustiga bosing — tashxis, muolaja va narxi pastda darhol ochiladi.'
                : 'Нажмите на любой зуб — диагноз, лечение и стоимость откроются ниже.'}
            </span>
          </div>
        </div>
      ) : (
        /* VIEW B & C: DARK REALISTIC 3D JAW ARCH & 3D PHANTOM MODEL */
        <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-3 sm:p-5 border-2 border-slate-800 shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Anatomical Quadrant Indicators */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-bold text-slate-300 border-b border-slate-800/80 pb-2 mb-2">
            {viewMode === 'mirror' ? (
              <>
                <span className="flex items-center gap-1.5 text-sky-400 font-extrabold">
                  <ArrowLeft className="w-3 h-3 text-sky-400" />
                  <span>{lang === 'uz' ? 'Chap tomoningiz' : 'Ваша левая сторона'}</span>
                </span>
                <span className="bg-teal-900/60 text-teal-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-teal-700/50">
                  {activeArch === 'upper'
                    ? (lang === 'uz' ? 'Yuqori Jag\'' : 'Верхний Ряд')
                    : activeArch === 'lower'
                    ? (lang === 'uz' ? 'Pastki Jag\'' : 'Нижний Ряд')
                    : (lang === 'uz' ? '3D Qolip' : '3D Модель')}
                </span>
                <span className="flex items-center gap-1.5 text-teal-400 font-extrabold">
                  <span>{lang === 'uz' ? 'O\'ng tomoningiz' : 'Ваша правая сторона'}</span>
                  <ArrowRight className="w-3 h-3 text-teal-400" />
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-teal-400 font-extrabold">
                  <ArrowLeft className="w-3 h-3 text-teal-400" />
                  <span>{lang === 'uz' ? 'O\'ng tomon (FDI)' : 'Правая сторона (FDI)'}</span>
                </span>
                <span className="bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-700">
                  {lang === 'uz' ? 'Shifokor Ko\'rinishi' : 'Вид Стоматолога'}
                </span>
                <span className="flex items-center gap-1.5 text-sky-400 font-extrabold">
                  <span>{lang === 'uz' ? 'Chap tomon (FDI)' : 'Левая сторона (FDI)'}</span>
                  <ArrowRight className="w-3 h-3 text-sky-400" />
                </span>
              </>
            )}
          </div>

          {/* Interactive SVG Arch for Upper/Lower */}
          {activeArch !== 'photo' ? (
            <div className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[4/3.5] select-none">
              <svg viewBox="0 0 400 340" className="w-full h-full filter drop-shadow-2xl">
                <defs>
                  <radialGradient id="gumGradient" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="60%" stopColor="#e11d48" />
                    <stop offset="100%" stopColor="#881337" />
                  </radialGradient>

                  <radialGradient id="cavityGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                  </radialGradient>

                  <linearGradient id="enamelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="45%" stopColor="#f8fafc" />
                    <stop offset="85%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>

                  <linearGradient id="cariesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffe4e6" />
                    <stop offset="40%" stopColor="#fecdd3" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>

                  <linearGradient id="fillingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0f2fe" />
                    <stop offset="50%" stopColor="#7dd3fc" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>

                  <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>

                  <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#2dd4bf" floodOpacity="1" />
                    <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#14b8a6" floodOpacity="0.7" />
                  </filter>
                </defs>

                {/* Gingival Arch */}
                {activeArch === 'upper' ? (
                  <g>
                    <path
                      d="M 45 285 C 45 130, 110 32, 200 32 C 290 32, 355 130, 355 285 C 325 292, 305 250, 305 190 C 305 110, 260 78, 200 78 C 140 78, 95 110, 95 190 C 95 250, 75 292, 45 285 Z"
                      fill="url(#gumGradient)"
                      stroke="#fda4af"
                      strokeWidth="2"
                      className="filter drop-shadow-lg"
                    />
                    <path
                      d="M 95 190 C 95 110, 140 78, 200 78 C 260 78, 305 110, 305 190 C 270 230, 130 230, 95 190 Z"
                      fill="url(#cavityGradient)"
                      stroke="#9f1239"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />
                  </g>
                ) : (
                  <g>
                    <path
                      d="M 45 55 C 45 210, 110 308, 200 308 C 290 308, 355 210, 355 55 C 325 48, 305 90, 305 150 C 305 230, 260 262, 200 262 C 140 262, 95 230, 95 150 C 95 90, 75 48, 45 55 Z"
                      fill="url(#gumGradient)"
                      stroke="#fda4af"
                      strokeWidth="2"
                      className="filter drop-shadow-lg"
                    />
                    <path
                      d="M 95 150 C 95 230, 140 262, 200 262 C 260 262, 305 230, 305 150 C 270 110, 130 110, 95 150 Z"
                      fill="url(#cavityGradient)"
                      stroke="#9f1239"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />
                  </g>
                )}

                {/* Teeth on Pink Gum */}
                {currentPositions.map(pos => {
                  const tooth = teeth.find(t => t.number === pos.number);
                  if (!tooth) return null;

                  const isSelected = selectedTooth?.number === tooth.number;
                  const isCaries = tooth.condition === 'caries';
                  const isFilling = tooth.condition === 'filling';
                  const isCrown = tooth.condition === 'crown';
                  const isMissing = tooth.condition === 'missing';

                  let fill = 'url(#enamelGrad)';
                  if (isCaries) fill = 'url(#cariesGrad)';
                  if (isFilling) fill = 'url(#fillingGrad)';
                  if (isCrown) fill = 'url(#crownGrad)';

                  const renderX = viewMode === 'mirror' ? 400 - pos.x : pos.x;
                  const renderRot = viewMode === 'mirror' ? -pos.rotation : pos.rotation;

                  return (
                    <g
                      key={tooth.number}
                      onClick={() => handleToothClick(tooth)}
                      className="cursor-pointer transition-all duration-200 group"
                      style={{ filter: isSelected ? 'url(#neonGlow)' : 'none' }}
                    >
                      {isSelected && (
                        <circle
                          cx={renderX}
                          cy={pos.y}
                          r={pos.w * 0.75}
                          fill="none"
                          stroke="#2dd4bf"
                          strokeWidth="3.5"
                          strokeDasharray="4 2"
                          className="animate-spin"
                          style={{ transformOrigin: `${renderX}px ${pos.y}px`, animationDuration: '6s' }}
                        />
                      )}

                      <g transform={`translate(${renderX}, ${pos.y}) rotate(${renderRot})`}>
                        {pos.type === 'molar' ? (
                          <g>
                            <rect
                              x={-pos.w / 2}
                              y={-pos.h / 2}
                              width={pos.w}
                              height={pos.h}
                              rx={8}
                              fill={isMissing ? '#334155' : fill}
                              stroke={isSelected ? '#14b8a6' : isCaries ? '#f43f5e' : '#cbd5e1'}
                              strokeWidth={isSelected ? 3 : 1.8}
                              opacity={isMissing ? 0.3 : 1}
                              className="filter drop-shadow-md"
                            />
                            {!isMissing && (
                              <>
                                <line x1={-pos.w * 0.3} y1="0" x2={pos.w * 0.3} y2="0" stroke={isCaries ? '#991b1b' : '#94a3b8'} strokeWidth="1.6" strokeLinecap="round" />
                                <line x1="0" y1={-pos.h * 0.3} x2="0" y2={pos.h * 0.3} stroke={isCaries ? '#991b1b' : '#94a3b8'} strokeWidth="1.6" strokeLinecap="round" />
                                <circle cx={-pos.w * 0.22} cy={-pos.h * 0.22} r="1.5" fill="#f8fafc" opacity="0.8" />
                                <circle cx={pos.w * 0.22} cy={-pos.h * 0.22} r="1.5" fill="#f8fafc" opacity="0.8" />
                                <circle cx={-pos.w * 0.22} cy={pos.h * 0.22} r="1.5" fill="#f8fafc" opacity="0.8" />
                                <circle cx={pos.w * 0.22} cy={pos.h * 0.22} r="1.5" fill="#f8fafc" opacity="0.8" />
                                <circle cx="0" cy="0" r={isCaries ? 3.5 : 2} fill={isCaries ? '#dc2626' : isFilling ? '#0284c7' : '#94a3b8'} />
                              </>
                            )}
                          </g>
                        ) : pos.type === 'premolar' ? (
                          <g>
                            <ellipse
                              cx="0"
                              cy="0"
                              rx={pos.w * 0.48}
                              ry={pos.h * 0.45}
                              fill={isMissing ? '#334155' : fill}
                              stroke={isSelected ? '#14b8a6' : isCaries ? '#f43f5e' : '#cbd5e1'}
                              strokeWidth={isSelected ? 3 : 1.8}
                              opacity={isMissing ? 0.3 : 1}
                              className="filter drop-shadow-md"
                            />
                            {!isMissing && (
                              <>
                                <line x1={-pos.w * 0.26} y1="0" x2={pos.w * 0.26} y2="0" stroke={isCaries ? '#991b1b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="0" cy="0" r={isCaries ? 3 : 1.6} fill={isCaries ? '#dc2626' : isFilling ? '#0284c7' : '#94a3b8'} />
                              </>
                            )}
                          </g>
                        ) : pos.type === 'canine' ? (
                          <path
                            d={`M ${-pos.w * 0.42} ${pos.h * 0.35} Q 0 ${-pos.h * 0.58} ${pos.w * 0.42} ${pos.h * 0.35} Z`}
                            fill={isMissing ? '#334155' : fill}
                            stroke={isSelected ? '#14b8a6' : '#cbd5e1'}
                            strokeWidth={isSelected ? 3 : 1.8}
                            opacity={isMissing ? 0.3 : 1}
                            className="filter drop-shadow-md"
                          />
                        ) : (
                          <rect
                            x={-pos.w * 0.46}
                            y={-pos.h * 0.35}
                            width={pos.w * 0.92}
                            height={pos.h * 0.7}
                            rx={3.5}
                            fill={isMissing ? '#334155' : fill}
                            stroke={isSelected ? '#14b8a6' : '#cbd5e1'}
                            strokeWidth={isSelected ? 3 : 1.8}
                            opacity={isMissing ? 0.3 : 1}
                            className="filter drop-shadow-md"
                          />
                        )}

                        {showNumbers && (
                          <text
                            x="0"
                            y={1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="9"
                            fontWeight="900"
                            fill={isMissing ? '#64748b' : isCaries ? '#991b1b' : isFilling ? '#0369a1' : '#0f172a'}
                            className="pointer-events-none select-none font-mono"
                          >
                            {tooth.number}
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* Photographic 3D Phantom Model */
            <div className="relative w-full aspect-[4/3.8] max-w-sm mx-auto select-none rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-black">
              <img
                src="/images/jaw_model_open.png"
                alt="Dental Jaw Phantom Model"
                className="w-full h-full object-contain"
              />

              <div className="absolute inset-0">
                <button
                  onClick={() => {
                    const t = teeth.find(x => x.number === 46);
                    if (t) handleToothClick(t);
                  }}
                  className={`absolute left-[20%] bottom-[24%] px-2.5 py-1 rounded-full text-[10px] font-black transition transform active:scale-95 flex items-center gap-1.5 shadow-2xl ${
                    selectedTooth?.number === 46
                      ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-400/50 scale-110 z-20'
                      : 'bg-slate-900/90 text-white border border-teal-400 hover:bg-teal-500'
                  }`}
                >
                  <LuxuryToothIcon className="w-3 h-3 text-teal-300" />
                  <span>{lang === 'uz' ? '№46 Katta oziq tish' : '№46 Жевательный зуб'}</span>
                </button>

                <button
                  onClick={() => {
                    const t = teeth.find(x => x.number === 36);
                    if (t) handleToothClick(t);
                  }}
                  className={`absolute right-[20%] bottom-[24%] px-2.5 py-1 rounded-full text-[10px] font-black transition transform active:scale-95 flex items-center gap-1.5 shadow-2xl ${
                    selectedTooth?.number === 36
                      ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-400/50 scale-110 z-20'
                      : 'bg-slate-900/90 text-white border border-teal-400 hover:bg-teal-500'
                  }`}
                >
                  <LuxuryToothIcon className="w-3 h-3 text-teal-300" />
                  <span>{lang === 'uz' ? '№36 Katta oziq tish' : '№36 Жевательный зуб'}</span>
                </button>

                <button
                  onClick={() => {
                    const t = teeth.find(x => x.number === 14);
                    if (t) handleToothClick(t);
                  }}
                  className={`absolute left-[25%] top-[25%] px-2.5 py-1 rounded-full text-[10px] font-black transition transform active:scale-95 flex items-center gap-1.5 shadow-2xl ${
                    selectedTooth?.number === 14
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/50 scale-110 z-20 animate-pulse'
                      : 'bg-rose-600/90 text-white border border-rose-300 hover:bg-rose-700'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>{lang === 'uz' ? '№14 Karies' : '№14 Кариес'}</span>
                </button>

                <button
                  onClick={() => {
                    const t = teeth.find(x => x.number === 11);
                    if (t) handleToothClick(t);
                  }}
                  className={`absolute left-[42%] top-[18%] px-2.5 py-1 rounded-full text-[10px] font-black transition transform active:scale-95 flex items-center gap-1.5 shadow-2xl ${
                    selectedTooth?.number === 11
                      ? 'bg-teal-400 text-slate-950 ring-4 ring-teal-400/50 scale-110 z-20'
                      : 'bg-slate-900/90 text-white border border-teal-400 hover:bg-teal-500'
                  }`}
                >
                  <LuxuryToothIcon className="w-3 h-3 text-teal-300" />
                  <span>{lang === 'uz' ? '№11 Oldingi' : '№11 Передний'}</span>
                </button>
              </div>
            </div>
          )}

          {/* User Guidance Banner */}
          <div className="relative z-10 text-center text-[11px] text-teal-300/90 bg-teal-950/70 py-2 px-3 rounded-xl border border-teal-800/60 flex items-center justify-center gap-2 mt-2">
            <MousePointerClick className="w-3.5 h-3.5 text-teal-400" />
            <span>
              {lang === 'uz'
                ? 'Modeldagi istalgan tish ustiga bosing — tashxis, muolaja va narxi pastda darhol ochiladi.'
                : 'Нажмите на любой зуб — диагноз, план лечения и стоимость появятся ниже.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};