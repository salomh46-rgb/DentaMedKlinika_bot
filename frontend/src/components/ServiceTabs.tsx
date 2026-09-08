import React, { useState } from 'react';
import { Language, Department, Service } from '../types';
import { SERVICES } from '../data/mockData';
import { Sparkles, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { LuxuryToothIcon, LuxuryEntIcon } from './LuxuryIcons';

interface ServiceTabsProps {
  lang: Language;
  onBookService: (service: Service) => void;
  services?: Service[];
}

export const ServiceTabs: React.FC<ServiceTabsProps> = ({ lang, onBookService, services = SERVICES }) => {
  const [selectedDept, setSelectedDept] = useState<Department>('stomatology');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredServices = services.filter(s => {
    if (s.department !== selectedDept) return false;
    if (selectedCategory !== 'all' && s.category.uz !== selectedCategory && s.category.ru !== selectedCategory) {
      return false;
    }
    return true;
  });

  const categories = Array.from(
    new Set(
      services.filter(s => s.department === selectedDept).map(
        s => (lang === 'uz' ? s.category.uz : s.category.ru)
      )
    )
  );

  return (
    <div className="space-y-4">
      {/* Department Toggle (Stomatologiya vs LOR) */}
      <div className="grid grid-cols-2 p-1 bg-[#EBE5DC]/70 dark:bg-[#0A1D16] border border-[#E8E2D8] dark:border-[#183F32] rounded-full gap-1">
        <button
          onClick={() => {
            setSelectedDept('stomatology');
            setSelectedCategory('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs tracking-wide transition-all ${
            selectedDept === 'stomatology'
              ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
              : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5] font-medium'
          }`}
        >
          <LuxuryToothIcon className={`w-4 h-4 ${selectedDept === 'stomatology' ? 'text-[#C5A880] dark:text-[#07130F]' : 'text-[#627068] dark:text-[#9FB1A7]'}`} />
          <span>{lang === 'uz' ? 'Stomatologiya Atelyesi' : 'Стоматология'}</span>
        </button>

        <button
          onClick={() => {
            setSelectedDept('lor');
            setSelectedCategory('all');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs tracking-wide transition-all ${
            selectedDept === 'lor'
              ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
              : 'text-[#627068] dark:text-[#9FB1A7] hover:text-[#1A221E] dark:hover:text-[#FAF8F5] font-medium'
          }`}
        >
          <LuxuryEntIcon className={`w-4 h-4 ${selectedDept === 'lor' ? 'text-[#C5A880] dark:text-[#07130F]' : 'text-[#627068] dark:text-[#9FB1A7]'}`} />
          <span>{lang === 'uz' ? 'LOR Markazi' : 'ЛОР Отделение'}</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs tracking-wide transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
              : 'bg-white dark:bg-[#0E231B] text-[#627068] dark:text-[#9FB1A7] border border-[#E8E2D8] dark:border-[#183F32] hover:border-[#C5A880] font-medium'
          }`}
        >
          {lang === 'uz' ? 'Barchasi' : 'Все'}
        </button>

        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs tracking-wide transition-all ${
              selectedCategory === cat
                ? 'bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-semibold shadow-sm'
                : 'bg-white dark:bg-[#0E231B] text-[#627068] dark:text-[#9FB1A7] border border-[#E8E2D8] dark:border-[#183F32] hover:border-[#C5A880] font-medium'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="grid gap-3.5">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className="bg-white dark:bg-[#0E231B] rounded-3xl p-5 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm hover:shadow-md hover:border-[#C5A880]/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-semibold text-[#112E24] dark:text-[#D6BF9F] bg-[#FAF8F5] dark:bg-[#183F32]/60 border border-[#E8E2D8] dark:border-[#C5A880]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'uz' ? service.category.uz : service.category.ru}
                </span>

                {service.isPopular && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8B6B3E] dark:text-[#D6BF9F] bg-[#C5A880]/15 border border-[#C5A880]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-[#C5A880]" />
                    <span>{lang === 'uz' ? 'Prestige' : 'Премиум'}</span>
                  </span>
                )}
              </div>

              <h4 className="font-serif font-bold text-base text-[#1A221E] dark:text-[#FAF8F5] mb-1.5 leading-snug">
                {lang === 'uz' ? service.title.uz : service.title.ru}
              </h4>

              <p className="text-xs text-[#627068] dark:text-[#9FB1A7] mb-4 leading-relaxed font-sans font-light">
                {lang === 'uz' ? service.desc.uz : service.desc.ru}
              </p>
            </div>

            <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#183F32] flex items-center justify-between">
              <div>
                <div className="text-[10.5px] text-[#627068] dark:text-[#9FB1A7] font-medium flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-3 h-3 text-[#C5A880]" />
                  <span>{service.duration} {lang === 'uz' ? 'daqiqa' : 'мин'}</span>
                </div>
                <div className="font-serif text-base font-bold text-[#112E24] dark:text-[#C5A880]">
                  {service.price.toLocaleString('uz-UZ')} <span className="font-sans text-xs font-normal text-[#627068] dark:text-[#9FB1A7]">{lang === 'uz' ? 'so\'m' : 'сум'}</span>
                </div>
              </div>

              <button
                onClick={() => onBookService(service)}
                className="flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] hover:bg-[#183F32] dark:hover:bg-[#D6BF9F] active:scale-95 text-[#FAF8F5] dark:text-[#07130F] px-4 py-2 rounded-full text-xs font-semibold tracking-wide border border-[#C5A880]/40 shadow-sm transition-all"
              >
                <Calendar className="w-3.5 h-3.5 text-[#C5A880] dark:text-[#07130F]" />
                <span>{lang === 'uz' ? 'Yozilish' : 'Запись'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
