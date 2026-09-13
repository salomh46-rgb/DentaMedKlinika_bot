import React from 'react';
import { Language } from '../../types';
import { Key, Lock, Phone, X } from 'lucide-react';

interface PinLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginPin: string;
  setLoginPin: (p: string) => void;
  loginError: string | null;
  rememberMe: boolean;
  setRememberMe: (r: boolean) => void;
  onLogin: (e?: React.FormEvent) => void;
  isForgotPinOpen: boolean;
  setIsForgotPinOpen: (o: boolean) => void;
  recoveryPhone: string;
  setRecoveryPhone: (p: string) => void;
  recoveryStatus: 'idle' | 'sending' | 'success' | 'error';
  recoveredPinInfo: string | null;
  onRecoverPin: (e: React.FormEvent) => void;
  lang: Language;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  isOpen,
  onClose,
  loginPin,
  setLoginPin,
  loginError,
  rememberMe,
  setRememberMe,
  onLogin,
  isForgotPinOpen,
  setIsForgotPinOpen,
  recoveryPhone,
  setRecoveryPhone,
  recoveryStatus,
  recoveredPinInfo,
  onRecoverPin,
  lang
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 sm:p-8 max-w-md w-full border-2 border-[#C5A880] shadow-2xl space-y-5 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-center font-bold shadow">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                {lang === 'uz' ? 'Xodim PIN-Kodi Bilan Kirish' : 'Вход по PIN-коду Сотрудника'}
              </h3>
              <p className="text-xs text-gray-500">
                {lang === 'uz' ? 'Klinika rahbari yoki filial retsepshn kodi' : 'Код директора или администратора филиала'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block mb-1">
              {lang === 'uz' ? 'Shaxsiy 4-6 xonali PIN-kod:' : 'Персональный PIN-код:'}
            </label>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={loginPin}
              onChange={e => setLoginPin(e.target.value)}
              placeholder="••••"
              className="w-full text-center tracking-[0.5em] text-2xl font-mono font-black p-3.5 rounded-2xl border-2 border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] focus:outline-none focus:border-[#C5A880] text-[#112E24] dark:text-[#FAF8F5]"
            />
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fade-in">
              {loginError}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="rounded text-[#C5A880] focus:ring-0"
              />
              <span>{lang === 'uz' ? 'Eslab qolish' : 'Запомнить'}</span>
            </label>

            <button
              type="button"
              onClick={() => setIsForgotPinOpen(!isForgotPinOpen)}
              className="text-[#C5A880] hover:underline font-medium text-[11px]"
            >
              {lang === 'uz' ? 'PIN-kod esingizdan chiqdimi?' : 'Забыли PIN-код?'}
            </button>
          </div>

          {/* Emergency PIN Recovery Box */}
          {isForgotPinOpen && (
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#07130F] border border-gray-200 dark:border-gray-800 space-y-2.5 animate-fade-in text-xs">
              <div className="font-bold text-[#112E24] dark:text-[#FAF8F5] flex items-center justify-between">
                <span>{lang === 'uz' ? 'SMS orqali PINni tiklash' : 'Восстановление PIN по SMS'}</span>
                <span className="text-[10px] text-gray-500">(Tezkor yordam)</span>
              </div>
              <p className="text-[11px] text-gray-500">
                {lang === 'uz'
                  ? "Klinikada ro'yxatdan o'tgan telefon raqamingizni kiriting. Tizim sizga zudlik bilan SMS yuboradi."
                  : "Введите номер телефона, зарегистрированный в клинике. Система отправит SMS."}
              </p>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={recoveryPhone}
                  onChange={e => setRecoveryPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="flex-1 p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={onRecoverPin}
                  disabled={recoveryStatus === 'sending'}
                  className="px-3.5 py-2.5 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-bold text-xs rounded-xl shadow hover:scale-95 transition"
                >
                  {recoveryStatus === 'sending' ? (lang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...') : (lang === 'uz' ? 'SMS Yuborish' : 'Выслать SMS')}
                </button>
              </div>

              {recoveredPinInfo && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium animate-fade-in">
                  {recoveredPinInfo}
                </div>
              )}

              <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
                <span>{lang === 'uz' ? "Qo'ng'iroq orqali yordam:" : "Помощь по телефону:"}</span>
                <a href="tel:+998712000000" className="font-bold text-[#112E24] dark:text-[#C5A880] hover:underline flex items-center gap-1">
                  <Phone className="w-3 h-3" /> +998 (71) 200-00-00
                </a>
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{lang === 'uz' ? 'Tizimga Kirish' : 'Войти'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
