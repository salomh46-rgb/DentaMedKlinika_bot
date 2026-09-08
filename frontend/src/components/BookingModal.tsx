import React, { useState } from 'react';
import { Language, Doctor, Service, Appointment } from '../types';
import { DOCTORS, SERVICES, TIME_SLOTS } from '../data/mockData';
import { X, Calendar, Clock, User, Phone, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { showTelegramAlert } from '../utils/telegramAlerts';

interface BookingModalProps {
  lang: Language;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAppointment: Appointment) => void;
  preselectedDoctor?: Doctor | null;
  preselectedService?: Service | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  lang,
  isOpen,
  onClose,
  onSuccess,
  preselectedDoctor,
  preselectedService
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const [doctor, setDoctor] = useState<Doctor>(preselectedDoctor || DOCTORS[0]);
  const [service, setService] = useState<Service>(preselectedService || SERVICES[0]);
  
  // Date calculations: Start strictly from Tomorrow to prevent accidental 'today' booking
  const formatDateISO = (d: Date) => d.toISOString().split('T')[0];
  const now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = formatDateISO(tomorrow);

  const dayAfter = new Date(now);
  dayAfter.setDate(now.getDate() + 2);
  const dayAfterStr = formatDateISO(dayAfter);

  const day3 = new Date(now);
  day3.setDate(now.getDate() + 3);
  const day3Str = formatDateISO(day3);

  const day4 = new Date(now);
  day4.setDate(now.getDate() + 4);
  const day4Str = formatDateISO(day4);

  const [selectedDate, setSelectedDate] = useState<string>(tomorrowStr);
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[2]); // '10:30'

  const [patientName, setPatientName] = useState<string>(() => {
    const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tg?.first_name) {
      return `${tg.first_name} ${tg.last_name || ''}`.trim();
    }
    return '';
  });
  const [phone, setPhone] = useState<string>('+998 ');
  const [complaint, setComplaint] = useState<string>('');

  const quickDates = [
    {
      date: tomorrowStr,
      label: { uz: 'Ertaga', ru: 'Завтра' },
      weekday: {
        uz: tomorrow.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        ru: tomorrow.toLocaleDateString('ru-RU', { weekday: 'short', month: 'numeric', day: 'numeric' })
      },
      isHot: true
    },
    {
      date: dayAfterStr,
      label: { uz: 'Indinga', ru: 'Послезавтра' },
      weekday: {
        uz: dayAfter.toLocaleDateString('uz-UZ', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        ru: dayAfter.toLocaleDateString('ru-RU', { weekday: 'short', month: 'numeric', day: 'numeric' })
      }
    },
    {
      date: day3Str,
      label: {
        uz: day3.toLocaleDateString('uz-UZ', { weekday: 'short' }),
        ru: day3.toLocaleDateString('ru-RU', { weekday: 'short' })
      },
      weekday: {
        uz: day3.toLocaleDateString('uz-UZ', { month: 'numeric', day: 'numeric' }),
        ru: day3.toLocaleDateString('ru-RU', { month: 'numeric', day: 'numeric' })
      }
    },
    {
      date: day4Str,
      label: {
        uz: day4.toLocaleDateString('uz-UZ', { weekday: 'short' }),
        ru: day4.toLocaleDateString('ru-RU', { weekday: 'short' })
      },
      weekday: {
        uz: day4.toLocaleDateString('uz-UZ', { month: 'numeric', day: 'numeric' }),
        ru: day4.toLocaleDateString('ru-RU', { month: 'numeric', day: 'numeric' })
      }
    }
  ];

  const handlePhoneChange = (val: string) => {
    if (!val.startsWith('+998')) {
      setPhone('+998 ');
    } else {
      setPhone(val);
    }
  };

  const handleConfirm = () => {
    if (!patientName.trim()) {
      showTelegramAlert(lang === 'uz' ? 'Iltimos, ismingizni kiriting!' : 'Пожалуйста, введите ваше имя!');
      return;
    }
    if (phone.trim().length < 13) {
      showTelegramAlert(lang === 'uz' ? 'Iltimos, telefon raqamingizni to\'liq kiriting!' : 'Пожалуйста, введите полный номер телефона!');
      return;
    }

    const randomPin = Math.floor(1000 + Math.random() * 9000).toString(); // e.g. 7842
    const newAppointment: Appointment = {
      id: 'MED-' + Math.floor(100000 + Math.random() * 900000),
      pinCode: randomPin,
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctor,
      service,
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      notes: complaint.trim(),
      createdAt: new Date().toISOString()
    };

    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const apiPayload = {
      ...newAppointment,
      telegramUserId: tgUser?.id || null,
      telegramUsername: tgUser?.username || null
    };

    // Save to backend API (async without blocking UI)
    try {
      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      }).catch(err => console.log('API sync notice:', err));
    } catch (e) {
      console.log('API notice:', e);
    }

    // Telegram WebApp integration
    if (window.Telegram?.WebApp) {
      if (typeof window.Telegram.WebApp.sendData === 'function') {
        try {
          window.Telegram.WebApp.sendData(JSON.stringify(newAppointment));
        } catch (e) {
          console.log('sendData not in keyboard mode', e);
        }
      }
      if (window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
    }

    onSuccess(newAppointment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0A1A14] rounded-3xl shadow-2xl border border-[#E8E2D8] dark:border-[#C5A880]/30 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#112E24] text-[#FAF8F5] flex items-center justify-between border-b border-[#C5A880]/30">
          <div>
            <span className="text-[9.5px] uppercase tracking-wider font-semibold bg-[#C5A880] text-[#112E24] px-2.5 py-0.5 rounded-full">
              {lang === 'uz' ? `Bosqich ${step}/3` : `Шаг ${step}/3`}
            </span>
            <h3 className="font-serif font-bold text-base text-[#FAF8F5] mt-1">
              {lang === 'uz' ? 'Qabulga Onlayn Yozilish' : 'Онлайн Запись на Прием'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#FAF8F5] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: Xizmat va Shifokor */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] mb-1.5">
                  {lang === 'uz' ? '1. Xizmatni tanlang:' : '1. Выберите услугу:'}
                </label>
                <select
                  value={service.id}
                  onChange={e => {
                    const found = SERVICES.find(s => s.id === Number(e.target.value));
                    if (found) setService(found);
                  }}
                  className="w-full bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#C5A880]/20 rounded-2xl p-2.5 text-xs font-medium text-[#1A221E] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                >
                  {SERVICES.map(s => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-[#0E231B] text-[#1A221E] dark:text-[#FAF8F5]">
                      [{s.department === 'stomatology' ? 'Dental' : 'LOR'}] {lang === 'uz' ? s.title.uz : s.title.ru} — {s.price.toLocaleString('uz-UZ')} {lang === 'uz' ? 'so\'m' : 'сум'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] mb-1.5">
                  {lang === 'uz' ? '2. Shifokorni tanlang:' : '2. Выберите врача:'}
                </label>
                <div className="grid gap-2">
                  {DOCTORS.map(doc => {
                    const isSelected = doctor.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setDoctor(doc)}
                        className={`p-2.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                          isSelected
                            ? 'border-[#C5A880] bg-[#FAF8F5] dark:bg-[#0E231B] ring-1 ring-[#C5A880]/50 shadow-sm'
                            : 'border-[#E8E2D8] dark:border-[#C5A880]/15 hover:bg-[#FAF8F5] dark:hover:bg-[#0E231B]/60'
                        }`}
                      >
                        <img
                          src={doc.photo}
                          alt={doc.name}
                          className="w-12 h-12 rounded-xl object-cover object-top"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif font-bold text-xs text-[#1A221E] dark:text-[#FAF8F5] truncate">
                            {doc.name}
                          </h5>
                          <p className="text-[11px] text-[#C5A880] truncate font-medium">
                            {lang === 'uz' ? doc.specialty.uz : doc.specialty.ru}
                          </p>
                          <span className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">
                            ⭐ {doc.rating} • {doc.experience} {lang === 'uz' ? 'yil tajriba' : 'лет опыта'}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-[#112E24] dark:text-[#C5A880] flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Sana va Bo'sh Vaqt Slotlari */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{lang === 'uz' ? 'Qabul sanasini tanlang:' : 'Выберите дату приема:'}</span>
                  </label>
                  <span className="text-[9.5px] text-[#112E24] dark:text-[#C5A880] font-medium bg-[#112E24]/5 dark:bg-[#C5A880]/10 px-2 py-0.5 rounded-full border border-[#C5A880]/30">
                    {lang === 'uz' ? 'Bugunga joylar to\'lgan' : 'На сегодня мест нет'}
                  </span>
                </div>

                {/* Tezkor Sana Tugmalari (Quick-Select Date Pills) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
                  {quickDates.map(item => {
                    const isSelected = selectedDate === item.date;
                    return (
                      <button
                        key={item.date}
                        type="button"
                        onClick={() => setSelectedDate(item.date)}
                        className={`p-2 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#C5A880] bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] shadow-sm font-semibold'
                            : 'border-[#E8E2D8] dark:border-[#C5A880]/20 bg-[#FAF8F5] dark:bg-[#0E231B] hover:border-[#C5A880] text-[#1A221E] dark:text-[#FAF8F5]'
                        }`}
                      >
                        <span className={`text-[10px] ${isSelected ? 'text-[#D6BF9F] dark:text-[#332211]' : 'text-[#627068] dark:text-[#9FB1A7]'}`}>
                          {lang === 'uz' ? item.weekday.uz : item.weekday.ru}
                        </span>
                        <span className="text-xs font-bold mt-0.5">
                          {lang === 'uz' ? item.label.uz : item.label.ru}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Kalendar orqali erkin sana tanlash */}
                <div className="relative">
                  <input
                    type="date"
                    min={tomorrowStr}
                    value={selectedDate}
                    onChange={e => {
                      if (e.target.value >= tomorrowStr) {
                        setSelectedDate(e.target.value);
                      } else {
                        showTelegramAlert(lang === 'uz' ? 'Iltimos, ertangi kundan boshlab sana tanlang!' : 'Пожалуйста, выберите дату начиная с завтрашнего дня!');
                      }
                    }}
                    className="w-full bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#C5A880]/20 rounded-2xl p-2.5 text-xs font-medium text-[#1A221E] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[#627068] dark:text-[#9FB1A7] mt-1 flex items-center gap-1">
                  <span>ℹ️</span>
                  <span>
                    {lang === 'uz'
                      ? 'Adashib ketmaslik uchun qabullar ertangi kundan boshlab rejalashtiriladi.'
                      : 'Во избежание ошибок запись начинается со следующего дня.'}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Mavjud bo\'sh vaqtlar:' : 'Свободное время приема:'}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(time => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                          isSelected
                            ? 'bg-[#112E24] dark:bg-[#C5A880] border-[#112E24] dark:border-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] shadow-sm'
                            : 'bg-[#FAF8F5] dark:bg-[#0E231B] border-[#E8E2D8] dark:border-[#C5A880]/20 text-[#1A221E] dark:text-[#FAF8F5] hover:border-[#C5A880]'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#627068] dark:text-[#9FB1A7] mt-2">
                  {lang === 'uz'
                    ? '* Qabul davomiyligi o\'rtacha 30-40 daqiqa.'
                    : '* Средняя длительность приема 30-40 минут.'}
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Bemor Ma'lumotlari va Tasdiqlash */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Ism va Familiyangiz:' : 'Ваше Имя и Фамилия:'}</span>
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder={lang === 'uz' ? 'Masalan: Anvar Karimov' : 'Например: Анвар Каримов'}
                  className="w-full bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#C5A880]/20 rounded-2xl p-2.5 text-xs font-medium text-[#1A221E] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'uz' ? 'Telefon raqamingiz:' : 'Номер телефона:'}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#C5A880]/20 rounded-2xl p-2.5 text-xs font-medium text-[#1A221E] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] mb-1">
                  {lang === 'uz' ? 'Shikoyatingiz yoki belgilaringiz (ixtiyoriy):' : 'Жалобы или симптомы (необязательно):'}
                </label>
                <textarea
                  rows={2}
                  value={complaint}
                  onChange={e => setComplaint(e.target.value)}
                  placeholder={lang === 'uz' ? 'Tish zirqirashi, burun bitishi...' : 'Боль в зубе, заложенность носа...'}
                  className="w-full bg-[#FAF8F5] dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#C5A880]/20 rounded-2xl p-2.5 text-xs text-[#1A221E] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#C5A880] focus:outline-none"
                />
              </div>

              {/* Order Summary Box */}
              <div className="bg-[#FAF8F5] dark:bg-[#0E231B] p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#C5A880]/20 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#627068] dark:text-[#9FB1A7]">{lang === 'uz' ? 'Shifokor:' : 'Врач:'}</span>
                  <span className="font-serif font-bold text-[#1A221E] dark:text-[#FAF8F5]">{doctor.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#627068] dark:text-[#9FB1A7]">{lang === 'uz' ? 'Xizmat:' : 'Услуга:'}</span>
                  <span className="font-medium text-[#1A221E] dark:text-[#FAF8F5]">{lang === 'uz' ? service.title.uz : service.title.ru}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#627068] dark:text-[#9FB1A7]">{lang === 'uz' ? 'Vaqt:' : 'Время:'}</span>
                  <span className="font-semibold text-[#112E24] dark:text-[#C5A880]">{selectedDate} • {selectedTime}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E8E2D8] dark:border-[#C5A880]/20 text-sm">
                  <span className="font-semibold text-[#1A221E] dark:text-[#FAF8F5]">{lang === 'uz' ? 'Narx:' : 'Стоимость:'}</span>
                  <span className="font-serif font-bold text-base text-[#112E24] dark:text-[#C5A880]">
                    {service.price.toLocaleString('uz-UZ')} {lang === 'uz' ? 'so\'m' : 'сум'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Buttons */}
        <div className="p-4 bg-[#FAF8F5] dark:bg-[#07130F] border-t border-[#E8E2D8] dark:border-[#C5A880]/20 flex items-center justify-between gap-2">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 bg-white dark:bg-[#0E231B] border border-[#E8E2D8] dark:border-[#C5A880]/20 hover:border-[#C5A880] px-4 py-2 rounded-full text-xs font-semibold text-[#1A221E] dark:text-[#FAF8F5] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'uz' ? 'Orqaga' : 'Назад'}</span>
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] dark:hover:bg-[#B39366] text-[#FAF8F5] dark:text-[#07130F] px-5 py-2 rounded-full text-xs font-semibold tracking-wide border border-[#C5A880]/40 shadow-sm transition active:scale-95"
            >
              <span>{lang === 'uz' ? 'Davom etish' : 'Далее'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A880] dark:text-[#07130F]" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 bg-[#112E24] hover:bg-[#183F32] dark:bg-[#C5A880] dark:hover:bg-[#B39366] text-[#FAF8F5] dark:text-[#07130F] px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide border border-[#C5A880]/40 shadow-md transition active:scale-95"
            >
              <CheckCircle className="w-4 h-4 text-[#C5A880] dark:text-[#07130F]" />
              <span>{lang === 'uz' ? 'Qabulni Tasdiqlash' : 'Подтвердить Запись'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
