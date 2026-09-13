import React from 'react';
import { Language } from '../../types';
import { Sparkles, Shield, X, Copy, Check, ExternalLink, Crown } from 'lucide-react';

interface NewClinicWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  signUpStep: 1 | 2 | 3;
  setSignUpStep: (s: 1 | 2 | 3) => void;
  signUpData: {
    clinicName: string;
    ownerName: string;
    phone: string;
    email: string;
    firstBranchName: string;
    firstBranchAddress: string;
  };
  setSignUpData: React.Dispatch<React.SetStateAction<any>>;
  signUpResult: {
    tenantId: string;
    tenantName: string;
    ownerPin: string;
    staffPin: string;
    firstBranchId: string;
  } | null;
  signUpLoading: boolean;
  copiedKey: string | null;
  onCopy: (text: string, keyName: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onLoginAsNewTenant: () => void;
  lang: Language;
}

export const NewClinicWizardModal: React.FC<NewClinicWizardModalProps> = ({
  isOpen,
  onClose,
  signUpStep,
  setSignUpStep,
  signUpData,
  setSignUpData,
  signUpResult,
  signUpLoading,
  copiedKey,
  onCopy,
  onSubmit,
  onLoginAsNewTenant,
  lang
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 sm:p-8 max-w-lg w-full border-2 border-[#C5A880] shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-lg text-[#112E24] dark:text-[#FAF8F5]">
                {signUpStep === 3
                  ? (lang === 'uz' ? '🎉 Tabriklaymiz! Tizim Tayyor!' : '🎉 Поздравляем!')
                  : (lang === 'uz' ? 'Yangi Klinika Ulash (14 Kun Bepul)' : 'Подключение Новой Клиники')}
              </h3>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {signUpStep === 1 && (lang === 'uz' ? '1-Qadam: Klinika brendi va Rahbar ma\'lumotlari' : 'Шаг 1: Клиника и Руководитель')}
              {signUpStep === 2 && (lang === 'uz' ? '2-Qadam: Birlamchi filial manzili va ish vaqti' : 'Шаг 2: Первый филиал')}
              {signUpStep === 3 && (lang === 'uz' ? '3-Qadam: Barcha PIN-kodlar va Telegram ulanish kalitlari' : 'Шаг 3: Ваши ключи доступа')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-1.5 rounded-full transition-all ${signUpStep >= 1 ? 'bg-[#C5A880]' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${signUpStep >= 2 ? 'bg-[#C5A880]' : 'bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`flex-1 h-1.5 rounded-full transition-all ${signUpStep === 3 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
        </div>

        {/* STEP 1 & 2 FORM */}
        {signUpStep !== 3 ? (
          <form onSubmit={onSubmit} className="space-y-4">
            {signUpStep === 1 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Klinika yoki Tibbiyot Markazi Nomi: *
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpData.clinicName}
                    onChange={e => setSignUpData({ ...signUpData, clinicName: e.target.value })}
                    placeholder="Masalan: Shifo Nur Med, Perfect Smile..."
                    className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Bosh Shifokor / Klinika Rahbari F.I.Sh: *
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpData.ownerName}
                    onChange={e => setSignUpData({ ...signUpData, ownerName: e.target.value })}
                    placeholder="Dr. Nodir Zokirov"
                    className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Rahbar Telefon Raqami: *
                    </label>
                    <input
                      type="text"
                      required
                      value={signUpData.phone}
                      onChange={e => setSignUpData({ ...signUpData, phone: e.target.value })}
                      className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Email (Ixtiyoriy):
                    </label>
                    <input
                      type="email"
                      value={signUpData.email}
                      onChange={e => setSignUpData({ ...signUpData, email: e.target.value })}
                      placeholder="info@shifonur.uz"
                      className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>
              </div>
            )}

            {signUpStep === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    1-Birlamchi Filial Nomi:
                  </label>
                  <input
                    type="text"
                    value={signUpData.firstBranchName}
                    onChange={e => setSignUpData({ ...signUpData, firstBranchName: e.target.value })}
                    placeholder={`${signUpData.clinicName || 'Klinika'} Bosh Filiali`}
                    className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Filial Shahri va Manzili:
                  </label>
                  <input
                    type="text"
                    value={signUpData.firstBranchAddress}
                    onChange={e => setSignUpData({ ...signUpData, firstBranchAddress: e.target.value })}
                    placeholder="Toshkent sh., Chilonzor 9-mavze, 12-uy (Metro yaqinida)"
                    className="w-full p-3 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/40 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>
                    Tizim sizga <b>Rahbar Super PIN</b> va <b>Filial Retsepshn PIN</b> kodlarini avtomatik generatsiya qilib beradi!
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              {signUpStep === 2 && (
                <button
                  type="button"
                  onClick={() => setSignUpStep(1)}
                  className="py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
                >
                  Orqaga
                </button>
              )}
              <button
                type="submit"
                disabled={signUpLoading}
                className="flex-1 py-3 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95 flex items-center justify-center gap-2"
              >
                <span>{signUpStep === 1 ? 'Keyingi qadam ➡️' : (signUpLoading ? 'Yaratilmoqda...' : 'Klinikani Faollashtirish 🚀')}</span>
              </button>
            </div>
          </form>
        ) : (
          /* STEP 3: SUCCESS CREDENTIALS */
          <div className="space-y-4 animate-scale-up">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/40 space-y-1 text-center">
              <div className="text-emerald-800 dark:text-emerald-300 font-serif font-bold text-sm">
                🎉 {signUpResult?.tenantName} Muvaffaqiyatli Ro'yxatdan O'tdi!
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400">
                14 kunlik to'liq bepul sinov davri faollashtirildi. Quyidagi kalitlarni saqlab oling:
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Owner Super PIN Card */}
              <div className="p-3.5 rounded-2xl border-2 border-[#C5A880] bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    👑 RAHBAR SUPER PIN (Barcha Filiallar Egasi):
                  </div>
                  <div className="font-mono text-xl font-black text-[#112E24] dark:text-[#FAF8F5] tracking-widest mt-0.5">
                    {signUpResult?.ownerPin}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(signUpResult?.ownerPin || '', 'owner')}
                  className="p-2 rounded-xl bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] transition"
                >
                  {copiedKey === 'owner' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Staff PIN Card */}
              <div className="p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    📍 1-FILIAL RETSEPSHN PIN KODI:
                  </div>
                  <div className="font-mono text-lg font-black text-[#112E24] dark:text-[#FAF8F5] tracking-widest mt-0.5">
                    {signUpResult?.staffPin}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(signUpResult?.staffPin || '', 'staff')}
                  className="p-2 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 transition text-gray-600 dark:text-gray-300"
                >
                  {copiedKey === 'staff' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onLoginAsNewTenant}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-lg hover:scale-95 transition flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>CRM Tizimiga Rahbar Sifatida Kirish 🚀</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
