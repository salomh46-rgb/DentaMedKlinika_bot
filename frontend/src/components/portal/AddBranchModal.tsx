import React from 'react';
import { Building2, X, Plus } from 'lucide-react';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: string;
  newBranchData: {
    name: string;
    address: string;
    managerName: string;
    phone: string;
    staffPin: string;
  };
  setNewBranchData: React.Dispatch<React.SetStateAction<{
    name: string;
    address: string;
    managerName: string;
    phone: string;
    staffPin: string;
  }>>;
  handleAddBranchSubmit: (e: React.FormEvent) => void;
}

export const AddBranchModal: React.FC<AddBranchModalProps> = ({
  isOpen,
  onClose,
  lang,
  newBranchData,
  setNewBranchData,
  handleAddBranchSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleAddBranchSubmit}
        className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-[#C5A880]/50 shadow-2xl space-y-4 animate-scale-up"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#C5A880]" />
            <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
              {lang === 'uz' ? 'Yangi Filial Qo\'shish' : 'Добавить Филиал'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Filial Nomi: *
            </label>
            <input
              type="text"
              required
              value={newBranchData.name}
              onChange={e => setNewBranchData({ ...newBranchData, name: e.target.value })}
              placeholder="Masalan: Samarqand Filiali, Chilonzor 2..."
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Manzil va Mo'ljal: *
            </label>
            <input
              type="text"
              required
              value={newBranchData.address}
              onChange={e => setNewBranchData({ ...newBranchData, address: e.target.value })}
              placeholder="Shahar, tuman, ko'cha, mo'ljal..."
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Administrator F.I.Sh:
              </label>
              <input
                type="text"
                value={newBranchData.managerName}
                onChange={e => setNewBranchData({ ...newBranchData, managerName: e.target.value })}
                placeholder="Nilufar Karimova"
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Telefon:
              </label>
              <input
                type="text"
                value={newBranchData.phone}
                onChange={e => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              Xodim Retsepshn PIN-kodi (Ixtiyoriy, avtomatik yaratiladi):
            </label>
            <input
              type="text"
              maxLength={6}
              value={newBranchData.staffPin}
              onChange={e => setNewBranchData({ ...newBranchData, staffPin: e.target.value })}
              placeholder="Masalan: 3002"
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] font-mono text-xs font-bold focus:outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Filialni Qo'shish</span>
          </button>
        </div>
      </form>
    </div>
  );
};
