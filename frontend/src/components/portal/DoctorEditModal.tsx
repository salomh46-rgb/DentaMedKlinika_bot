import React from 'react';
import { X, Upload } from 'lucide-react';
import { Doctor } from '../../types';

interface DoctorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDoc: Doctor | null;
  docName: string;
  setDocName: (name: string) => void;
  docSpecUz: string;
  setDocSpecUz: (spec: string) => void;
  docDept: 'stomatology' | 'lor';
  setDocDept: (dept: 'stomatology' | 'lor') => void;
  docExp: number;
  setDocExp: (exp: number) => void;
  docPhotoBase64: string;
  handleDocPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveDoctor: (e: React.FormEvent) => void;
}

export const DoctorEditModal: React.FC<DoctorEditModalProps> = ({
  isOpen,
  onClose,
  editingDoc,
  docName,
  setDocName,
  docSpecUz,
  setDocSpecUz,
  docDept,
  setDocDept,
  docExp,
  setDocExp,
  docPhotoBase64,
  handleDocPhotoUpload,
  handleSaveDoctor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSaveDoctor}
        className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-md w-full border border-[#C5A880]/40 shadow-2xl space-y-4 animate-scale-up"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
            {editingDoc ? 'Shifokorni Tahrirlash' : 'Yangi Shifokor Qo\'shish'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
              F.I.Sh (Ismi va Familiyasi):
            </label>
            <input
              type="text"
              required
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="Dr. Jamshid Rustamov"
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
              Mutaxassisligi:
            </label>
            <input
              type="text"
              required
              value={docSpecUz}
              onChange={e => setDocSpecUz(e.target.value)}
              placeholder="Bosh Implantolog, Ortodont"
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold focus:outline-none focus:border-[#C5A880]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Bo'lim:
              </label>
              <select
                value={docDept}
                onChange={e => setDocDept(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-bold focus:outline-none focus:border-[#C5A880]"
              >
                <option value="stomatology">Stomatologiya</option>
                <option value="lor">LOR Bo'limi</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                Tajriba (Yil):
              </label>
              <input
                type="number"
                value={docExp}
                onChange={e => setDocExp(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-mono font-bold focus:outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>

          {/* Photo Upload (Base64) */}
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
              Fotosurat yuklash (Base64 format):
            </label>
            <div className="flex items-center gap-3">
              {docPhotoBase64 ? (
                <img
                  src={docPhotoBase64}
                  alt="Doctor Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-[#C5A880]"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <Upload className="w-5 h-5" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleDocPhotoUpload}
                className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#112E24] file:text-[#FAF8F5] hover:file:bg-[#183F32] cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold transition shadow-md hover:scale-95"
          >
            Saqlash
          </button>
        </div>
      </form>
    </div>
  );
};
