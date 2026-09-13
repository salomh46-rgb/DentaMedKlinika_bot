import React from 'react';
import {
  Building2, Plus, Key, DollarSign, Banknote, CreditCard,
  Smartphone, Printer, Receipt, RefreshCw, Users, Edit3,
  Trash2, Sparkles, CheckCircle2
} from 'lucide-react';
import { Tenant, Clinic, Doctor, PatientDebt } from '../../types';

interface CeoFinanceTabProps {
  currentTenant: Tenant;
  setIsAddBranchModalOpen: (open: boolean) => void;
  lang: 'uz' | 'ru';
  visibleBranches: Clinic[];
  financeKPIs: {
    totalRevenue: number;
    cashTotal: number;
    cardTotal: number;
    clickTotal: number;
    docKPIList: Array<{
      doctor: Doctor;
      patientCount: number;
      totalRevenue: number;
      doctorShare: number;
      clinicShare: number;
    }>;
  };
  debtsList: PatientDebt[];
  loadDebtsData: () => void;
  setSelectedDebt: (debt: any) => void;
  setDebtPayAmount: (amount: number) => void;
  setIsDebtPayModalOpen: (open: boolean) => void;
  tenantDoctors: Doctor[];
  setEditingDoc: (doc: Doctor | null) => void;
  setDocName: (name: string) => void;
  setDocSpecUz: (spec: string) => void;
  setDocPhotoBase64: (photo: string) => void;
  setIsDocModalOpen: (open: boolean) => void;
  setDocDept: (dept: 'stomatology' | 'lor') => void;
  setDocExp: (exp: number) => void;
  handleDeleteDoctor: (id: number) => void;
  promoTitle: string;
  setPromoTitle: (title: string) => void;
  promoDiscount: number;
  setPromoDiscount: (discount: number) => void;
  isPromoActive: boolean;
  setIsPromoActive: (active: boolean) => void;
  promoSaveSuccess: boolean;
  setPromoSaveSuccess: (success: boolean) => void;
}

export const CeoFinanceTab: React.FC<CeoFinanceTabProps> = ({
  currentTenant,
  setIsAddBranchModalOpen,
  lang,
  visibleBranches,
  financeKPIs,
  debtsList,
  loadDebtsData,
  setSelectedDebt,
  setDebtPayAmount,
  setIsDebtPayModalOpen,
  tenantDoctors,
  setEditingDoc,
  setDocName,
  setDocSpecUz,
  setDocPhotoBase64,
  setIsDocModalOpen,
  setDocDept,
  setDocExp,
  handleDeleteDoctor,
  promoTitle,
  setPromoTitle,
  promoDiscount,
  setPromoDiscount,
  isPromoActive,
  setIsPromoActive,
  promoSaveSuccess,
  setPromoSaveSuccess,
}) => {
  return (
    <div className="space-y-6">
      {/* Multi-Branch Management Banner for Clinic Owner */}
      <div className="bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] flex items-center justify-center font-bold shadow">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                🏥 {currentTenant.name} Filiallari va Retsepshn Kalitlari
              </h3>
              <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                Barcha filiallar xodimlarining PIN-kodlari va boshqaruv markazi
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddBranchModalOpen(true)}
            className="flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow hover:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'uz' ? '+ Yangi Filial Qo\'shish' : '+ Добавить Филиал'}</span>
          </button>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleBranches.map(branch => (
            <div
              key={branch.id}
              className="p-4 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] hover:border-[#C5A880] transition space-y-2 relative group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-1.5">
                    <span>📍 {branch.branchName?.[lang] || branch.name}</span>
                    {branch.isMain && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                        Bosh filial
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[220px]">
                    {branch.address[lang] || branch.address.uz}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8E2D8]/60 dark:border-[#183F32]/60 flex items-center justify-between text-xs">
                <div className="text-gray-500 text-[11px]">
                  Admin: <b className="text-[#112E24] dark:text-[#FAF8F5]">{branch.managerName || 'Retsepshn'}</b>
                </div>
                <div className="flex items-center gap-1.5 bg-[#112E24]/5 dark:bg-[#C5A880]/10 px-2 py-0.5 rounded border border-[#C5A880]/20">
                  <Key className="w-3 h-3 text-[#C5A880]" />
                  <span className="text-[10px] text-gray-500">PIN:</span>
                  <span className="font-mono font-bold text-[#112E24] dark:text-[#FAF8F5]">
                    {branch.staffPin || '1001'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
              Jami Kassa Tushumi
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
            {financeKPIs.totalRevenue.toLocaleString('uz-UZ')} UZS
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            +18% o'tgan haftaga nisbatan
          </div>
        </div>

        <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
              Naqd Pul (Cash)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
            {financeKPIs.cashTotal.toLocaleString('uz-UZ')} UZS
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-semibold">
            Kassa seyfida saqlanmoqda
          </div>
        </div>

        <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
              Bank Kartalari (Humo/Uzcard)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
            {financeKPIs.cardTotal.toLocaleString('uz-UZ')} UZS
          </div>
          <div className="text-[10px] text-blue-500 mt-1 font-semibold">
            Hisob raqamga o'tkazildi
          </div>
        </div>

        <div className="bg-white dark:bg-[#0E231B] p-5 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#627068] dark:text-[#9FB1A7] uppercase tracking-wider">
              Click / Payme / Online
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-black text-xl text-[#112E24] dark:text-[#FAF8F5]">
            {financeKPIs.clickTotal.toLocaleString('uz-UZ')} UZS
          </div>
          <div className="text-[10px] text-purple-500 mt-1 font-semibold">
            0% komissiya dasturi
          </div>
        </div>
      </div>

      {/* Doctors 30% KPI Table */}
      <div className="bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
          <div>
            <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
              Shifokorlar Oylik Ulushi (30% KPI Taqsimoti)
            </h3>
            <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
              Har bir shifokor ko'rsatgan xizmatidan 30% bonus, 70% klinika sof daromadi hisoblanadi
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#07130F] hover:bg-[#E8E2D8] dark:hover:bg-[#183F32] text-xs font-bold px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Jadvalni Chop Etish</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] dark:bg-[#07130F] text-[#627068] dark:text-[#9FB1A7] uppercase text-[10px] tracking-wider border-b border-[#E8E2D8] dark:border-[#183F32]">
              <tr>
                <th className="py-3 px-4">Shifokor F.I.Sh</th>
                <th className="py-3 px-4">Mutaxassisligi</th>
                <th className="py-3 px-4 text-center">Bemorlar</th>
                <th className="py-3 px-4 text-right">Jami Tushum</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">
                  Shifokor Ulushi (30%)
                </th>
                <th className="py-3 px-4 text-right text-[#C5A880]">Klinika Ulushi (70%)</th>
                <th className="py-3 px-4 text-center">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#183F32]">
              {financeKPIs.docKPIList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                    Hozircha hisoblangan shifokorlar mavjud emas
                  </td>
                </tr>
              ) : (
                financeKPIs.docKPIList.map(item => (
                  <tr key={item.doctor.id} className="hover:bg-[#FAF8F5]/60 dark:hover:bg-[#07130F]/40 transition">
                    <td className="py-3 px-4 font-bold text-[#112E24] dark:text-[#FAF8F5] flex items-center gap-2">
                      <img
                        src={item.doctor.photo}
                        alt={item.doctor.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#C5A880]/30"
                      />
                      <span>{item.doctor.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {item.doctor.specialty.uz}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {item.patientCount} ta
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {item.totalRevenue.toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {item.doctorShare.toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#C5A880]">
                      {item.clinicShare.toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Hisoblangan
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nasiya va Qarzlar Daftari (Debts & Installments Ledger) */}
      <div className="bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                Nasiya va Qarzlar Daftari (Debts & Installments Ledger)
              </h3>
            </div>
            <p className="text-xs text-[#627068] dark:text-[#9FB1A7] mt-1">
              Muolaja qildirib, to'lovni qisman yoki nasiyaga qoldirgan bemorlar va so'ndirilgan to'lovlar monitoringi
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 px-3.5 py-2 rounded-2xl text-right">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Jami Nasiya Qoldig'i</div>
              <div className="font-mono text-sm font-black text-amber-600 dark:text-amber-300">
                {debtsList.filter(d => d.status !== 'settled').reduce((sum, d) => sum + (d.debtAmount || 0), 0).toLocaleString('uz-UZ')} UZS
              </div>
            </div>
            <button
              onClick={loadDebtsData}
              className="p-2.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
              title="Yangilash"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] dark:bg-[#07130F] text-[#627068] dark:text-[#9FB1A7] uppercase text-[10px] tracking-wider border-b border-[#E8E2D8] dark:border-[#183F32]">
              <tr>
                <th className="py-3 px-4">Bemor F.I.Sh</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4">Sana / Shifokor</th>
                <th className="py-3 px-4 text-right">Jami Muolaja</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">To'langan</th>
                <th className="py-3 px-4 text-right text-rose-500 font-bold">Qarz Qoldig'i</th>
                <th className="py-3 px-4 text-center">Holat</th>
                <th className="py-3 px-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2D8] dark:divide-[#183F32]">
              {debtsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 text-xs">
                    Hozircha faol nasiya yoki qarz yozuvlari mavjud emas (Kassa toza).
                  </td>
                </tr>
              ) : (
                debtsList.map(debt => (
                  <tr key={debt.appointmentId} className="hover:bg-[#FAF8F5]/60 dark:hover:bg-[#07130F]/40 transition">
                    <td className="py-3 px-4 font-bold text-[#112E24] dark:text-[#FAF8F5]">
                      {debt.patientName}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-600 dark:text-gray-300">
                      {debt.phone}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      <div>{debt.date}</div>
                      <div className="text-[10px] text-[#C5A880]">{debt.doctorName || 'Shifokor'}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {(debt.totalAmount || 0).toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {(debt.paidAmount || 0).toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-500">
                      {(debt.debtAmount || 0).toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className="py-3 px-4 text-center">
                      {debt.debtAmount <= 0 || debt.status === 'settled' ? (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          To'liq to'langan
                        </span>
                      ) : debt.paidAmount > 0 ? (
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Qisman to'langan
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Nasiya (100% qarz)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {debt.debtAmount > 0 ? (
                        <button
                          onClick={() => {
                            setSelectedDebt(debt);
                            setDebtPayAmount(debt.debtAmount);
                            setIsDebtPayModalOpen(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-[#112E24] text-[11px] font-bold px-3 py-1.5 rounded-xl transition shadow-xs active:scale-95"
                        >
                          To'lov Qabul Qilish
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs font-semibold">Yopilgan</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Doctors CRUD & Promo Customizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Doctors Management (8 Cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
            <div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                Shifokorlar Shtati va CRUD
              </h3>
              <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
                Yangi mutaxassislarni qo'shish, ma'lumotlarni va fotosuratlarni tahrirlash
              </p>
            </div>
            <button
              onClick={() => {
                setEditingDoc(null);
                setDocName('');
                setDocSpecUz('');
                setDocPhotoBase64('');
                setIsDocModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm hover:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Shifokor Qo'shish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tenantDoctors.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-[#FAF8F5] dark:bg-[#07130F] rounded-2xl border border-dashed border-[#E8E2D8] dark:border-[#183F32] space-y-2">
                <Users className="w-8 h-8 mx-auto text-[#C5A880] opacity-50" />
                <p className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5]">Hozircha biriktirilgan shifokorlar yo'q</p>
                <p className="text-[11px] text-gray-500">Ushbu klinika uchun birinchi shifokorni ro'yxatdan o'tkazing</p>
                <button
                  onClick={() => {
                    setEditingDoc(null);
                    setDocName('');
                    setDocSpecUz('');
                    setDocPhotoBase64('');
                    setIsDocModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#C5A880] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Birinchi Shifokorni Qo'shish</span>
                </button>
              </div>
            ) : (
              tenantDoctors.map(doc => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-2xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between gap-3 hover:border-[#C5A880] transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.photo}
                      alt={doc.name}
                      className="w-12 h-12 rounded-xl object-cover border border-[#C5A880]/30 shadow-sm"
                    />
                    <div>
                      <div className="font-bold text-xs text-[#112E24] dark:text-[#FAF8F5]">
                        {doc.name}
                      </div>
                      <div className="text-[11px] text-[#C5A880]">
                        {doc.specialty.uz}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {doc.experience} yil tajriba • {doc.department.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingDoc(doc);
                        setDocName(doc.name);
                        setDocSpecUz(doc.specialty.uz);
                        setDocDept(doc.department);
                        setDocExp(doc.experience);
                        setDocPhotoBase64(doc.photo);
                        setIsDocModalOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
                      title="Tahrirlash"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doc.id)}
                      className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Promo Banner Customizer (4 Cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0E231B] p-6 rounded-3xl border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                Eksklyuziv Aksiya
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold bg-[#C5A880]/10 text-[#C5A880] px-2 py-0.5 rounded-full">
              Jonli Bemor Ekrani
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-1">
                Aksiya Sarlavhasi:
              </label>
              <input
                type="text"
                value={promoTitle}
                onChange={e => setPromoTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 block mb-1">
                Chegirma Foizi (%):
              </label>
              <input
                type="number"
                min={10}
                max={90}
                value={promoDiscount}
                onChange={e => setPromoDiscount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-mono font-bold focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5]">
                Aksiya Holati:
              </span>
              <button
                onClick={() => setIsPromoActive(!isPromoActive)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  isPromoActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {isPromoActive ? 'Aktiv (Ko\'rinmoqda)' : 'O\'chirilgan'}
              </button>
            </div>

            {promoSaveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Aksiya muvaffaqiyatli saqlandi!</span>
              </div>
            )}

            <button
              onClick={() => {
                try {
                  localStorage.setItem(`dentamed_promo_${currentTenant.id}`, JSON.stringify({
                    title: promoTitle,
                    discount: promoDiscount,
                    isActive: isPromoActive
                  }));
                } catch (err) {
                  console.error(err);
                }
                setPromoSaveSuccess(true);
                setTimeout(() => setPromoSaveSuccess(false), 3000);
              }}
              className="w-full py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-sm hover:scale-95"
            >
              Saqlash va E'lon Qilish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
