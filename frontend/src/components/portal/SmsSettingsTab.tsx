import React from 'react';
import { CheckCircle2, Activity, Check, Send } from 'lucide-react';

interface SmsSettingsTabProps {
  eskizBalance: number;
  eskizToken: string;
  setEskizToken: (token: string) => void;
  smsTemplate2h: string;
  setSmsTemplate2h: (val: string) => void;
  smsTemplate1d: string;
  setSmsTemplate1d: (val: string) => void;
  smsTemplateRx: string;
  setSmsTemplateRx: (val: string) => void;
  smsSaveSuccess: boolean;
  handleSaveSmsSettings: () => void;
  testSmsPhone: string;
  setTestSmsPhone: (phone: string) => void;
  testSmsStatus: 'idle' | 'sending' | 'success' | 'error';
  handleSendTestSms: () => void;
}

export const SmsSettingsTab: React.FC<SmsSettingsTabProps> = ({
  eskizBalance,
  eskizToken,
  setEskizToken,
  smsTemplate2h,
  setSmsTemplate2h,
  smsTemplate1d,
  setSmsTemplate1d,
  smsTemplateRx,
  setSmsTemplateRx,
  smsSaveSuccess,
  handleSaveSmsSettings,
  testSmsPhone,
  setTestSmsPhone,
  testSmsStatus,
  handleSendTestSms,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: Eskiz.uz Token, Balance, Templates */}
      <div className="lg:col-span-7 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] dark:border-[#183F32]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              SMS
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                Eskiz.uz SMS Provayder Integratsiyasi
              </h3>
              <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                Telegram bot bilan parallel holda zaxira SMS bildirishnomalari
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">Mavjud Balans:</div>
            <div className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
              {eskizBalance} ta SMS
            </div>
          </div>
        </div>

        {/* Eskiz API Token Input */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block">
            Eskiz.uz Bearer API Token:
          </label>
          <input
            type="password"
            value={eskizToken}
            onChange={e => setEskizToken(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        {/* SMS Templates */}
        <div className="space-y-4">
          <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#C5A880]">
            Avtomatik SMS Xabar Shablonlari:
          </h4>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 block">
              1. Qabuldan 2 soat oldin (Tezkor eslatma):
            </label>
            <textarea
              rows={2}
              value={smsTemplate2h}
              onChange={e => setSmsTemplate2h(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 block">
              2. Qabuldan 1 kun oldin (Kunlik reja):
            </label>
            <textarea
              rows={2}
              value={smsTemplate1d}
              onChange={e => setSmsTemplate1d(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 block">
              3. Davolash yakunlanganda (Raqamli Retsept havolasi):
            </label>
            <textarea
              rows={2}
              value={smsTemplateRx}
              onChange={e => setSmsTemplateRx(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          {smsSaveSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>SMS sozlamalari va shablonlar ushbu klinika uchun saqlandi!</span>
            </div>
          )}

          <button
            onClick={handleSaveSmsSettings}
            className="w-full py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-sm hover:scale-95"
          >
            Shablonlarni Saqlash
          </button>
        </div>
      </div>

      {/* Right 5 Cols: SMS Gateway Delivery Log & Health */}
      <div className="lg:col-span-5 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
              SMS Shlyuz Monitoringi
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Faol • 99.8% Uptime
          </span>
        </div>

        {/* Delivery History Log */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Oxirgi Yetkazilgan SMS Xabarlar (Jonli Log):
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {[
              { phone: '+998 90 123-45-67', type: '24h Eslatma', time: '10:45', status: 'delivered' },
              { phone: '+998 97 712-34-56', type: '2h Eslatma + PIN', time: '09:30', status: 'delivered' },
              { phone: '+998 93 555-88-99', type: 'Raqamli Retsept', time: '08:15', status: 'delivered' },
              { phone: '+998 99 800-11-22', type: 'Qabul Tasdig\'i', time: 'Kecha', status: 'delivered' },
            ].map((log, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl border border-[#E8E2D8]/60 dark:border-[#183F32]/60 bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-[#112E24] dark:text-[#FAF8F5]">{log.phone}</div>
                  <div className="text-[10px] text-gray-500">{log.type} • {log.time}</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Yetkazildi</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Test SMS Sender */}
        <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#183F32] space-y-2.5">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
            <Send className="w-3 h-3 text-[#C5A880]" />
            <span>Tezkor Test SMS Yuborish:</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={testSmsPhone}
              onChange={e => setTestSmsPhone(e.target.value)}
              placeholder="+998 90 123-45-67"
              className="flex-1 p-2 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
            />
            <button
              onClick={handleSendTestSms}
              disabled={testSmsStatus === 'sending'}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#112E24] font-bold text-xs transition active:scale-95 flex items-center gap-1"
            >
              <Send className={`w-3.5 h-3.5 ${testSmsStatus === 'sending' ? 'animate-spin' : ''}`} />
              <span>Yuborish</span>
            </button>
          </div>
          {testSmsStatus === 'success' && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SMS {testSmsPhone} ga jo'natildi!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
