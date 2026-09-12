import React, { useState } from 'react';
import { Language, Doctor } from '../types';
import { DOCTORS } from '../data/mockData';
import { Star, Award, Calendar, CheckCircle2, MapPin, Sparkles, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { LuxuryDoctorIcon, LuxuryToothIcon, LuxuryEntIcon } from './LuxuryIcons';

interface DoctorCardProps {
  lang: Language;
  onBookDoctor: (doctor: Doctor) => void;
  doctors?: Doctor[];
}

const DoctorImage: React.FC<{ doc: Doctor }> = ({ doc }) => {
  const [imgError, setImgError] = useState(false);
  const initials = doc.name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').slice(0, 2);
  const defaultFallbackPhoto = doc.id % 2 === 0 ? '/images/doctors/dr_shahlo.jpg' : '/images/doctors/dr_jamshid.jpg';

  if (imgError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#112E24] via-[#16382C] to-[#0A1F18] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-24 h-24 rounded-3xl bg-[#C5A880]/15 border border-[#C5A880]/50 flex items-center justify-center shadow-2xl mb-2 z-10 backdrop-blur-md">
          <span className="font-serif text-3xl font-bold text-[#C5A880] tracking-widest">{initials}</span>
        </div>
        <div className="text-[10px] text-[#D6BF9F] font-bold tracking-[0.2em] uppercase z-10">
          {doc.department === 'stomatology' ? 'Dental Expert' : 'ENT Surgeon'}
        </div>
      </div>
    );
  }

  return (
    <img
      src={doc.photo}
      alt=""
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src !== defaultFallbackPhoto && !target.dataset.triedFallback) {
          target.dataset.triedFallback = 'true';
          target.src = defaultFallbackPhoto;
        } else {
          setImgError(true);
        }
      }}
      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
    />
  );
};

export const DoctorCard: React.FC<DoctorCardProps> = ({ lang, onBookDoctor, doctors = DOCTORS }) => {
  const [filterDept, setFilterDept] = useState<'all' | 'stomatology' | 'lor'>('all');

  const filteredDoctors = filterDept === 'all'
    ? doctors
    : doctors.filter(d => d.department === filterDept);

  const handleBook = (doctor: Doctor) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    onBookDoctor(doctor);
  };

  return (
    <div className="space-y-5">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <h3 className="font-serif font-bold text-lg text-[#1A221E] dark:text-[#FAF8F5] tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#112E24] dark:bg-[#183F32] text-[#C5A880] flex items-center justify-center shadow-xs">
              <LuxuryDoctorIcon className="w-3.5 h-3.5" />
            </div>
            <span>{lang === 'uz' ? 'Yetakchi Shifokorlarimiz' : 'Ведущие Специалисты'}</span>
          </h3>
          <p className="text-xs text-[#627068] dark:text-[#9FB1A7] font-sans">
            {lang === 'uz'
              ? 'Xalqaro toifadagi, Shveysariya standartlarida ishlovchi oliy toifali shifokorlar'
              : 'Врачи высшей категории с международной практикой и швейцарскими стандартами'}
          </p>
        </div>

        <span className="self-start sm:self-auto bg-[#112E24]/5 dark:bg-[#183F32] text-[#112E24] dark:text-[#FAF8F5] text-[10.5px] font-semibold px-3 py-1 rounded-full border border-[#C5A880]/30 tracking-wider">
          {filteredDoctors.length} {lang === 'uz' ? 'mutaxassis' : 'врачей'}
        </span>
      </div>

      {/* Department Filter Pills */}
      <div className="flex bg-[#EBE5DC]/70 dark:bg-[#0A1D16] p-1 border border-[#E8E2D8] dark:border-[#183F32] rounded-full gap-1 text-xs">
        <button
          onClick={() => setFilterDept('all')}
          className={`flex-1 py-1.5 px-3 rounded-full transition-all text-xs tracking-wide ${
            filterDept === 'all'
              ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
              : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5] font-medium'
          }`}
        >
          {lang === 'uz' ? 'Barchasi (4)' : 'Все врачи (4)'}
        </button>

        <button
          onClick={() => setFilterDept('stomatology')}
          className={`flex-1 py-1.5 px-3 rounded-full transition-all flex items-center justify-center gap-1.5 text-xs tracking-wide ${
            filterDept === 'stomatology'
              ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
              : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5] font-medium'
          }`}
        >
          <LuxuryToothIcon className={`w-3.5 h-3.5 ${filterDept === 'stomatology' ? 'text-[#C5A880] dark:text-[#07130F]' : 'text-[#627068] dark:text-[#9FB1A7]'}`} />
          <span>{lang === 'uz' ? 'Stomatologiya' : 'Стоматология'}</span>
        </button>

        <button
          onClick={() => setFilterDept('lor')}
          className={`flex-1 py-1.5 px-3 rounded-full transition-all flex items-center justify-center gap-1.5 text-xs tracking-wide ${
            filterDept === 'lor'
              ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
              : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5] font-medium'
          }`}
        >
          <LuxuryEntIcon className={`w-3.5 h-3.5 ${filterDept === 'lor' ? 'text-[#C5A880] dark:text-[#07130F]' : 'text-[#627068] dark:text-[#9FB1A7]'}`} />
          <span>{lang === 'uz' ? 'LOR Markazi' : 'ЛОР Центр'}</span>
        </button>
      </div>

      {/* Luxury Doctor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredDoctors.map(doc => (
          <div
            key={doc.id}
            className="group relative bg-white dark:bg-[#0E231B] rounded-3xl overflow-hidden border border-[#E8E2D8] dark:border-[#183F32] shadow-sm hover:shadow-xl hover:border-[#C5A880]/60 transition-all duration-300 flex flex-col"
          >
            {/* HERO DOCTOR PORTRAIT WITH INTELLECTUAL FALLBACK */}
            <div className="relative w-full h-72 sm:h-80 overflow-hidden bg-[#112E24]">
              <DoctorImage doc={doc} />

              {/* Gradient Scrim for readable badges */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#112E24] via-[#112E24]/30 to-black/25 pointer-events-none"></div>

              {/* Top Floating Badges */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                {/* Rating Badge */}
                <div className="backdrop-blur-md bg-[#112E24]/85 text-[#FAF8F5] border border-[#C5A880]/40 px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 shadow">
                  <Star className="w-3.5 h-3.5 text-[#C5A880] fill-[#C5A880]" />
                  <span>{doc.rating}</span>
                  <span className="text-[#D6BF9F]/80 font-normal">({doc.reviewsCount})</span>
                </div>

                {/* Department Verified Pill */}
                <span className="backdrop-blur-md bg-[#C5A880] text-[#112E24] text-[9.5px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3 text-[#112E24]" />
                  <span>{doc.department === 'stomatology' ? 'Dental' : 'LOR'}</span>
                </span>
              </div>

              {/* Bottom Floating Info Overlays on Image */}
              <div className="absolute bottom-3 inset-x-3 z-10 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="backdrop-blur-md bg-[#FAF8F5]/90 dark:bg-[#0E231B]/90 text-[#1A221E] dark:text-[#FAF8F5] text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm border border-white/80 dark:border-[#C5A880]/30 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#C5A880]" />
                    <span>{lang === 'uz' ? 'Toshkent, Atelier Markazi' : 'Ташкент, Центр Atelier'}</span>
                  </span>

                  <span className="backdrop-blur-md bg-[#FAF8F5]/90 dark:bg-[#0E231B]/90 text-[#1A221E] dark:text-[#FAF8F5] text-[10px] font-medium px-2.5 py-1 rounded-full shadow-sm border border-white/80 dark:border-[#C5A880]/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-[#C5A880]" />
                    <span>{doc.experience} {lang === 'uz' ? 'yil tajriba' : 'лет опыта'}</span>
                  </span>
                </div>

                {/* Doctor Name inside the Hero Area */}
                <div className="text-[#FAF8F5]">
                  <h4 className="font-serif font-bold text-xl drop-shadow leading-tight">
                    {doc.name}
                  </h4>
                  <p className="text-xs text-[#D6BF9F] font-sans font-medium drop-shadow-sm">
                    {lang === 'uz' ? doc.specialty.uz : doc.specialty.ru}
                  </p>
                </div>
              </div>
            </div>

            {/* CARD BOTTOM CONTENT & ACTION */}
            <div className="p-4 bg-white dark:bg-[#0E231B] flex-1 flex flex-col justify-between space-y-3">
              {/* Working Days & Availability */}
              <div className="flex items-center justify-between text-[11px] text-[#627068] dark:text-[#9FB1A7] border-b border-[#E8E2D8] dark:border-[#183F32] pb-2.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span className="font-medium text-[#627068] dark:text-[#9FB1A7]">
                    {lang === 'uz' ? 'Qabul:' : 'Прием:'}
                  </span>
                  <span className="font-semibold text-[#1A221E] dark:text-[#FAF8F5]">
                    {doc.availableDays.join(', ')}
                  </span>
                </div>
                <span className="text-[#112E24] dark:text-[#D6BF9F] bg-[#112E24]/5 dark:bg-[#183F32]/60 px-2 py-0.5 rounded-full font-semibold text-[10px] border border-[#C5A880]/30">
                  {lang === 'uz' ? 'Joylar mavjud' : 'Есть места'}
                </span>
              </div>

              {/* Luxury CTA Button */}
              <button
                onClick={() => handleBook(doc)}
                className="w-full bg-[#112E24] dark:bg-[#183F32] hover:bg-[#183F32] dark:hover:bg-[#225745] active:scale-98 text-[#FAF8F5] border border-[#C5A880]/40 font-semibold text-xs py-2.5 px-4 rounded-full flex items-center justify-between shadow-sm transition-all group/btn"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Qabulga Yozilish' : 'Записаться на прием'}</span>
                </span>
                <span className="bg-[#C5A880] text-[#112E24] p-1.5 rounded-full group-hover/btn:translate-x-1 transition-transform">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

