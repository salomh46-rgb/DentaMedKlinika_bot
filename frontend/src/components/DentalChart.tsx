import React, { useState } from 'react';
import { Language, ToothData, JawQuadrant, ToothType } from '../types';
import { INITIAL_TEETH } from '../data/mockData';
import { Info, CheckCircle2, AlertCircle, Sparkles, Calendar, HelpCircle, Compass, Search, Stethoscope, MapPin } from 'lucide-react';
import { InteractiveJawModel } from './InteractiveJawModel';
import { LuxuryToothIcon, QuadrantArrowIcon } from './LuxuryIcons';

interface DentalChartProps {
  lang: Language;
  onBookTooth: (tooth: ToothData) => void;
}

export const DentalChart: React.FC<DentalChartProps> = ({ lang, onBookTooth }) => {
  const [teeth] = useState<ToothData[]>(INITIAL_TEETH);
  // Default selected tooth is 46 (Katta oziq tish - lower arch)
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(INITIAL_TEETH[18]); // Tooth #46 (Molar)
  const [activeArch, setActiveArch] = useState<'minimal' | 'upper' | 'lower' | 'photo'>('minimal');
  const [hoveredTooth, setHoveredTooth] = useState<ToothData | null>(null);

  const getConditionColor = (cond: ToothData['condition'], isSelected: boolean) => {
    if (isSelected) {
      return 'border-[#112E24] bg-[#FAF8F5] ring-2 ring-[#C5A880]/40 scale-105 z-20 shadow-md';
    }
    switch (cond) {
      case 'healthy':
        return 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100/80';
      case 'caries':
        return 'bg-rose-100 text-rose-900 border-rose-400 hover:bg-rose-200 animate-pulse';
      case 'filling':
        return 'bg-sky-50 text-sky-900 border-sky-300 hover:bg-sky-100';
      case 'crown':
        return 'bg-amber-50 text-amber-950 border-amber-400 hover:bg-amber-100';
      case 'implant':
        return 'bg-purple-50 text-purple-900 border-purple-400 hover:bg-purple-100';
      case 'missing':
        return 'bg-slate-100 text-slate-400 border-dashed border-slate-300 opacity-50';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  const getConditionBadge = (cond: ToothData['condition']) => {
    switch (cond) {
      case 'healthy':
        return { label: lang === 'uz' ? 'Sog\'lom' : 'Здоров', color: 'bg-[#C5A880]' };
      case 'caries':
        return { label: lang === 'uz' ? 'Karies (Muolaja zarur)' : 'Кариес (Нужно лечение)', color: 'bg-rose-600 text-white' };
      case 'filling':
        return { label: lang === 'uz' ? 'Plomba' : 'Пломба', color: 'bg-[#183F32] text-[#FAF8F5]' };
      case 'crown':
        return { label: lang === 'uz' ? 'Toj (Koronka)' : 'Коронка', color: 'bg-[#C5A880] text-[#112E24]' };
      case 'implant':
        return { label: lang === 'uz' ? 'Implant' : 'Имплант', color: 'bg-[#112E24] text-[#FAF8F5]' };
      case 'missing':
        return { label: lang === 'uz' ? 'Olingan' : 'Удален', color: 'bg-slate-400 text-white' };
    }
  };

  const renderToothVisualBadge = (type: ToothType) => {
    return <LuxuryToothIcon className="w-5 h-5 text-[#C5A880]" />;
  };

  // State for patients who don't know the exact tooth number
  const [isUnknownMode, setIsUnknownMode] = useState<boolean>(false);
  const [unknownSide, setUnknownSide] = useState<'upper_right' | 'upper_left' | 'lower_right' | 'lower_left' | 'whole'>('lower_right');

  // Direct Zone Selectors (Oddiy inson tushunadigan 4 ta jag' qismi)
  const handleSelectZone = (zone: 'upper_right' | 'upper_left' | 'lower_right' | 'lower_left' | 'front') => {
    setIsUnknownMode(false);
    setActiveArch('minimal');
    if (zone === 'upper_right') {
      const t = teeth.find(x => x.number === 16);
      if (t) setSelectedTooth(t);
    } else if (zone === 'upper_left') {
      const t = teeth.find(x => x.number === 26);
      if (t) setSelectedTooth(t);
    } else if (zone === 'lower_right') {
      const t = teeth.find(x => x.number === 46);
      if (t) setSelectedTooth(t);
    } else if (zone === 'lower_left') {
      const t = teeth.find(x => x.number === 36);
      if (t) setSelectedTooth(t);
    } else if (zone === 'front') {
      const t = teeth.find(x => x.number === 11);
      if (t) setSelectedTooth(t);
    }
  };

  const handleToothSelectedFromModel = (tooth: ToothData) => {
    setIsUnknownMode(false);
    setSelectedTooth(tooth);
  };

  const activeTooth = hoveredTooth || selectedTooth;

  return (
    <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-4 sm:p-5 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-5">
      {/* Header with Human-Friendly Context */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#112E24] dark:bg-[#183F32] text-[#C5A880] border border-[#C5A880]/30 flex items-center justify-center shadow-xs">
              <LuxuryToothIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1A221E] dark:text-[#FAF8F5] leading-tight">
                {lang === 'uz' ? 'Interaktiv Tish & Jag\' Xaritasi' : 'Интерактивная Карта Зубов & Челюсти'}
              </h3>
              <p className="text-[11px] text-[#627068] dark:text-[#9FB1A7] font-sans">
                {lang === 'uz'
                  ? 'Og\'riyotgan tish yoki tomonni tanlang — tizim shveysariya protokoli bo\'yicha yechim ko\'rsatadi.'
                  : 'Выберите проблемный зуб или сторону — система покажет протокол лечения.'}
              </p>
            </div>
          </div>
          <span className="bg-[#112E24]/5 dark:bg-[#183F32] text-[#112E24] dark:text-[#FAF8F5] text-[9.5px] font-semibold px-2.5 py-1 rounded-full border border-[#C5A880]/30 tracking-wider uppercase">
            {lang === 'uz' ? 'Atelier Xarita' : 'Atelier Карта'}
          </span>
        </div>
      </div>

      {/* 1. Quick Zone Navigation (4 ta Jag' Qismi & Oldingi Tishlar) */}
      <div className="bg-[#FAF8F5] dark:bg-[#0A1D16] p-3.5 sm:p-4 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
            {lang === 'uz' ? 'Og\'riq qaysi tomonda? (Zonani tanlang):' : 'В какой зоне чувствуется дискомфорт?:'}
          </span>
        </div>

        {/* 4 Quadrants + Front Smiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
          <button
            onClick={() => handleSelectZone('upper_right')}
            className={`p-2.5 rounded-2xl border text-[11px] font-medium transition active:scale-95 flex items-center gap-2.5 ${
              !isUnknownMode && activeArch === 'upper' && selectedTooth?.quadrant === 'upper_right'
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24] dark:border-[#C5A880] shadow-sm font-semibold'
                : 'bg-white dark:bg-[#0E231B] hover:border-[#C5A880] text-[#1A221E] dark:text-[#FAF8F5] border-[#E8E2D8] dark:border-[#183F32]'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-[#112E24]/5 dark:bg-[#183F32] flex items-center justify-center text-[#C5A880]">
              <QuadrantArrowIcon dir="ur" className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold">{lang === 'uz' ? 'Yuqori O\'ng' : 'Верхний Правый'}</span>
              <span className="text-[9.5px] opacity-75 font-normal">{lang === 'uz' ? 'Chaynash tishlar' : 'Жевательные'}</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectZone('upper_left')}
            className={`p-2.5 rounded-2xl border text-[11px] font-medium transition active:scale-95 flex items-center gap-2.5 ${
              !isUnknownMode && activeArch === 'upper' && selectedTooth?.quadrant === 'upper_left'
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24] dark:border-[#C5A880] shadow-sm font-semibold'
                : 'bg-white dark:bg-[#0E231B] hover:border-[#C5A880] text-[#1A221E] dark:text-[#FAF8F5] border-[#E8E2D8] dark:border-[#183F32]'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-[#112E24]/5 dark:bg-[#183F32] flex items-center justify-center text-[#C5A880]">
              <QuadrantArrowIcon dir="ul" className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold">{lang === 'uz' ? 'Yuqori Chap' : 'Верхний Левый'}</span>
              <span className="text-[9.5px] opacity-75 font-normal">{lang === 'uz' ? 'Chaynash tishlar' : 'Жевательные'}</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectZone('front')}
            className={`p-2.5 rounded-2xl border text-[11px] font-medium transition active:scale-95 flex items-center gap-2.5 ${
              !isUnknownMode && (selectedTooth?.number === 11 || selectedTooth?.number === 21)
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24] dark:border-[#C5A880] shadow-sm font-semibold'
                : 'bg-white dark:bg-[#0E231B] hover:border-[#C5A880] text-[#1A221E] dark:text-[#FAF8F5] border-[#E8E2D8] dark:border-[#183F32]'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-[#112E24]/5 dark:bg-[#183F32] flex items-center justify-center text-[#C5A880]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold">{lang === 'uz' ? 'Oldingi Tishlar' : 'Передние Зубы'}</span>
              <span className="text-[9.5px] opacity-75 font-normal">{lang === 'uz' ? 'Vinir & Estetika' : 'Эстетика & Улыбка'}</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectZone('lower_right')}
            className={`p-2.5 rounded-2xl border text-[11px] font-medium transition active:scale-95 flex items-center gap-2.5 ${
              !isUnknownMode && activeArch === 'lower' && selectedTooth?.quadrant === 'lower_right'
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24] dark:border-[#C5A880] shadow-sm font-semibold'
                : 'bg-white dark:bg-[#0E231B] hover:border-[#C5A880] text-[#1A221E] dark:text-[#FAF8F5] border-[#E8E2D8] dark:border-[#183F32]'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-[#112E24]/5 dark:bg-[#183F32] flex items-center justify-center text-[#C5A880]">
              <QuadrantArrowIcon dir="lr" className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold">{lang === 'uz' ? 'Pastki O\'ng' : 'Нижний Правый'}</span>
              <span className="text-[9.5px] opacity-75 font-normal">{lang === 'uz' ? 'Katta oziq tish' : 'Коренной зуб'}</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectZone('lower_left')}
            className={`p-2.5 rounded-2xl border text-[11px] font-medium transition active:scale-95 flex items-center gap-2.5 ${
              !isUnknownMode && activeArch === 'lower' && selectedTooth?.quadrant === 'lower_left'
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24] dark:border-[#C5A880] shadow-sm font-semibold'
                : 'bg-white dark:bg-[#0E231B] hover:border-[#C5A880] text-[#1A221E] dark:text-[#FAF8F5] border-[#E8E2D8] dark:border-[#183F32]'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-[#112E24]/5 dark:bg-[#183F32] flex items-center justify-center text-[#C5A880]">
              <QuadrantArrowIcon dir="ll" className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold">{lang === 'uz' ? 'Pastki Chap' : 'Нижний Левый'}</span>
              <span className="text-[9.5px] opacity-75 font-normal">{lang === 'uz' ? 'Katta oziq tish' : 'Коренной зуб'}</span>
            </div>
          </button>

          {/* CRITICAL HELPER BUTTON: "Aynan qaysi tishligini bilmayman" */}
          <button
            onClick={() => setIsUnknownMode(true)}
            className={`p-2.5 rounded-2xl border text-[11px] transition active:scale-95 flex items-center gap-2.5 ${
              isUnknownMode
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] border-[#112E24] dark:border-[#C5A880] shadow-md font-semibold'
                : 'bg-[#C5A880]/15 dark:bg-[#C5A880]/20 hover:bg-[#C5A880]/25 text-[#112E24] dark:text-[#FAF8F5] border-[#C5A880]/40 font-medium'
            }`}
          >
            <div className="w-5 h-5 rounded-lg bg-[#C5A880]/30 flex items-center justify-center text-[#112E24] dark:text-[#C5A880]">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <span className="block font-semibold">{lang === 'uz' ? 'Qaysi tish — bilmayman' : 'Не знаю какой зуб'}</span>
              <span className="text-[9.5px] text-[#627068] dark:text-[#9FB1A7]">{lang === 'uz' ? 'Shu tomon og\'riyapti' : 'Просто болит зона'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Real Anatomical Interactive Jaw Model */}
      <InteractiveJawModel
        lang={lang}
        teeth={teeth}
        selectedTooth={isUnknownMode ? null : selectedTooth}
        onSelectTooth={handleToothSelectedFromModel}
        activeArch={activeArch}
        onChangeArch={setActiveArch}
      />

      {/* 3. SCENARIO A: Reassuring Diagnostic Card when patient doesn't know exact tooth */}
      {isUnknownMode ? (
        <div className="bg-[#112E24] text-[#FAF8F5] rounded-3xl p-5 shadow-xl border border-[#C5A880]/30 animate-fadeIn space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#183F32] border border-[#C5A880]/40 flex items-center justify-center flex-shrink-0 text-[#C5A880]">
              <Stethoscope className="w-6 h-6 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-base text-[#FAF8F5]">
                  {lang === 'uz'
                    ? 'Tish Og\'rig\'i Diagnostikasi & Bepul Ko\'rik'
                    : 'Диагностика Зубной Боли & Бесплатный Осмотр'}
                </h4>
                <span className="bg-[#C5A880] text-[#112E24] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'uz' ? '0 so\'m (Aksiya)' : '0 сум (Акция)'}
                </span>
              </div>

              <p className="text-xs text-[#FAF8F5]/85 mt-2 leading-relaxed bg-[#183F32]/80 p-3 rounded-2xl border border-[#C5A880]/20 font-sans font-light">
                {lang === 'uz' ? (
                  <>
                    <strong className="text-[#D6BF9F] font-semibold">Xavotir olmang!</strong> Tish nervi (pulpit) yallig‘langanda og‘riq butun jag‘ga tarqalishi tabiiy holat. Bemorlarning 70% qismi aynan qaysi tish og‘riyotganini o‘zi bilmaydi.
                    <br />
                    Atelierimizda raqamli <strong>3D Visiograf (Rentgen)</strong> apparati 2 daqiqada og‘riq manbaini 100% aniqlab beradi.
                  </>
                ) : (
                  <>
                    <strong className="text-[#D6BF9F] font-semibold">Не переживайте!</strong> При воспалении зубного нерва боль часто иррадиирует в соседние зубы. Более 70% пациентов не знают точный номер зуба.
                    <br />
                    В нашей клинике цифровой <strong>3D-визиограф (рентген)</strong> за 2 минуты определит очаг боли со 100% точностью.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick side confirmation for unknown tooth */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-[#D6BF9F] block">
              {lang === 'uz' ? 'Taxminan qaysi tomoningizda og\'riq sezilyapti?' : 'Примерно с какой стороны чувствуется боль?'}
            </span>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                onClick={() => setUnknownSide('upper_right')}
                className={`py-1.5 px-2 rounded-full border text-[11px] transition flex items-center justify-center gap-1 ${
                  unknownSide === 'upper_right' ? 'bg-[#C5A880] text-[#112E24] border-[#C5A880] font-bold' : 'bg-[#183F32] text-[#FAF8F5]/80 border-[#C5A880]/20'
                }`}
              >
                <QuadrantArrowIcon direction="ur" className={`w-3.5 h-3.5 ${unknownSide === 'upper_right' ? 'text-[#112E24]' : 'text-[#C5A880]'}`} />
                <span>{lang === 'uz' ? 'Yuqori O\'ng' : 'Верхний Прав.'}</span>
              </button>
              <button
                onClick={() => setUnknownSide('upper_left')}
                className={`py-1.5 px-2 rounded-full border text-[11px] transition flex items-center justify-center gap-1 ${
                  unknownSide === 'upper_left' ? 'bg-[#C5A880] text-[#112E24] border-[#C5A880] font-bold' : 'bg-[#183F32] text-[#FAF8F5]/80 border-[#C5A880]/20'
                }`}
              >
                <QuadrantArrowIcon direction="ul" className={`w-3.5 h-3.5 ${unknownSide === 'upper_left' ? 'text-[#112E24]' : 'text-[#C5A880]'}`} />
                <span>{lang === 'uz' ? 'Yuqori Chap' : 'Верхний Лев.'}</span>
              </button>
              <button
                onClick={() => setUnknownSide('whole')}
                className={`py-1.5 px-2 rounded-full border text-[11px] transition flex items-center justify-center gap-1 ${
                  unknownSide === 'whole' ? 'bg-[#C5A880] text-[#112E24] border-[#C5A880] font-bold' : 'bg-[#183F32] text-[#FAF8F5]/80 border-[#C5A880]/20'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${unknownSide === 'whole' ? 'text-[#112E24]' : 'text-[#C5A880]'}`} />
                <span>{lang === 'uz' ? 'Butun Jag\'' : 'Вся челюсть'}</span>
              </button>
              <button
                onClick={() => setUnknownSide('lower_right')}
                className={`py-1.5 px-2 rounded-full border text-[11px] transition flex items-center justify-center gap-1 ${
                  unknownSide === 'lower_right' ? 'bg-[#C5A880] text-[#112E24] border-[#C5A880] font-bold' : 'bg-[#183F32] text-[#FAF8F5]/80 border-[#C5A880]/20'
                }`}
              >
                <QuadrantArrowIcon direction="lr" className={`w-3.5 h-3.5 ${unknownSide === 'lower_right' ? 'text-[#112E24]' : 'text-[#C5A880]'}`} />
                <span>{lang === 'uz' ? 'Pastki O\'ng' : 'Нижний Прав.'}</span>
              </button>
              <button
                onClick={() => setUnknownSide('lower_left')}
                className={`py-1.5 px-2 rounded-full border text-[11px] transition flex items-center justify-center gap-1 ${
                  unknownSide === 'lower_left' ? 'bg-[#C5A880] text-[#112E24] border-[#C5A880] font-bold' : 'bg-[#183F32] text-[#FAF8F5]/80 border-[#C5A880]/20'
                }`}
              >
                <QuadrantArrowIcon direction="ll" className={`w-3.5 h-3.5 ${unknownSide === 'lower_left' ? 'text-[#112E24]' : 'text-[#C5A880]'}`} />
                <span>{lang === 'uz' ? 'Pastki Chap' : 'Нижний Лев.'}</span>
              </button>
              <button
                onClick={() => setIsUnknownMode(false)}
                className="py-1.5 px-2 rounded-full border text-[11px] bg-[#183F32] text-[#D6BF9F] border-[#C5A880]/30 hover:text-white flex items-center justify-center gap-1"
              >
                <LuxuryToothIcon className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{lang === 'uz' ? 'Tishni tanlash' : 'Выбрать зуб'}</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => onBookTooth(teeth[0])}
            className="w-full bg-[#C5A880] hover:bg-[#D6BF9F] active:scale-98 text-[#112E24] font-bold text-xs py-3 rounded-full flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Calendar className="w-4 h-4 text-[#112E24]" />
            <span>
              {lang === 'uz'
                ? 'Bepul Rentgen & Ko\'rikka Qabulga Yozilish'
                : 'Записаться на Бесплатный Осмотр и Рентген'}
            </span>
          </button>
        </div>
      ) : (
        /* SCENARIO B: Specific Tooth Detail Box (Patient-Friendly Description) */
        activeTooth && (
          <div className="bg-[#112E24] text-[#FAF8F5] rounded-3xl p-5 shadow-xl border border-[#C5A880]/30 animate-fadeIn space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                {/* Tooth Visual Anatomical Badge */}
                <div className="w-12 h-12 rounded-2xl bg-[#183F32] border border-[#C5A880]/30 flex flex-col items-center justify-center shadow-inner flex-shrink-0">
                  {renderToothVisualBadge(activeTooth.type)}
                  <span className="text-[9px] font-mono font-bold text-[#C5A880] mt-0.5">№{activeTooth.number}</span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-serif font-bold text-base text-[#FAF8F5]">
                      {lang === 'uz' ? activeTooth.name.uz : activeTooth.name.ru}
                    </h4>
                    <span className={`inline-flex items-center gap-1 text-[9.5px] text-[#112E24] px-2.5 py-0.5 rounded-full font-bold bg-[#C5A880]`}>
                      {getConditionBadge(activeTooth.condition).label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#D6BF9F] font-sans">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#C5A880]" />
                      {activeTooth.quadrant.includes('upper') ? (lang === 'uz' ? 'Yuqori Jag\'' : 'Верхняя') : (lang === 'uz' ? 'Pastki Jag\'' : 'Нижняя')}
                    </span>
                    <span>•</span>
                    <span>
                      {activeTooth.type === 'molar' || activeTooth.type === 'wisdom'
                        ? (lang === 'uz' ? 'Katta Chaynash Tishi' : 'Большой жевательный')
                        : activeTooth.type === 'premolar'
                        ? (lang === 'uz' ? 'Kichik Oziq Tish' : 'Малый коренной')
                        : activeTooth.type === 'canine'
                        ? (lang === 'uz' ? 'Qoziq Tish' : 'Клык')
                        : (lang === 'uz' ? 'Oldingi Kesuvchi Tish' : 'Передний резец')}
                    </span>
                    <span className="text-[#FAF8F5]/60 text-[10px]">(FDI: №{activeTooth.number})</span>
                  </div>

                  <p className="text-xs text-[#FAF8F5]/85 mt-2.5 leading-relaxed bg-[#183F32]/70 p-3 rounded-2xl border border-[#C5A880]/20 font-sans font-light">
                    {activeTooth.treatment
                      ? (lang === 'uz' ? activeTooth.treatment.uz : activeTooth.treatment.ru)
                      : (lang === 'uz' ? 'Tish butunlay sog\'lom, muolajaga ehtiyoj yo\'q.' : 'Зуб полностью здоров, вмешательство не требуется.')}
                  </p>
                </div>
              </div>

              {activeTooth.price && (
                <div className="text-right sm:self-start flex-shrink-0 bg-[#183F32] p-3 rounded-2xl border border-[#C5A880]/30 shadow-inner">
                  <span className="text-[9.5px] text-[#D6BF9F] block font-semibold uppercase tracking-wider">
                    {lang === 'uz' ? 'Muolaja narxi:' : 'Стоимость:'}
                  </span>
                  <span className="font-serif text-lg font-bold text-[#C5A880] mt-0.5 block">
                    {activeTooth.price.toLocaleString('uz-UZ')} <span className="font-sans text-xs font-normal text-[#FAF8F5]/70">{lang === 'uz' ? 'so\'m' : 'сум'}</span>
                  </span>
                </div>
              )}
            </div>

            {activeTooth.condition !== 'healthy' && activeTooth.condition !== 'missing' && (
              <button
                onClick={() => onBookTooth(activeTooth)}
                className="w-full bg-[#C5A880] hover:bg-[#D6BF9F] active:scale-98 text-[#112E24] font-bold text-xs py-3 rounded-full flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Calendar className="w-4 h-4 text-[#112E24]" />
                <span>
                  {lang === 'uz'
                    ? `№ ${activeTooth.number} tishni davolashga yozilish`
                    : `Записаться на лечение зуба № ${activeTooth.number}`}
                </span>
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
};
