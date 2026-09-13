import React, { useState } from 'react';
import { Appointment, PrescriptionMedicine } from '../../types';
import { FileText, X, Plus, Trash2, Send } from 'lucide-react';

// Quick Medicine Templates for Prescription
export const QUICK_MEDICINES: PrescriptionMedicine[] = [
  { name: 'Nimesil (Nimesulid)', dosage: '100 mg', frequency: 'Og\'riq bo\'lganda 1 paket (ovqatdan so\'ng)', duration: '3 kun' },
  { name: 'Amoksiklav (Augmentin)', dosage: '625 mg', frequency: 'Kuniga 2 mahal har 12 soatda', duration: '5-7 kun' },
  { name: 'Metrogil Denta gel', dosage: 'Milklarga surtish', frequency: 'Kuniga 2-3 mahal yuvgandan so\'ng', duration: '7 kun' },
  { name: 'Xlorgeksidin 0.05%', dosage: 'Eritma', frequency: 'Kuniga 3 mahal ovqatdan keyin chayish', duration: '5 kun' },
  { name: 'Loratadin', dosage: '10 mg', frequency: 'Kuniga 1 tabletka kechqurun', duration: '3 kun' },
  { name: 'Ibuprofen', dosage: '400 mg', frequency: 'Kuchli og\'riqda 1 tabletka', duration: '3 kun' }
];

export const STANDARD_RECOMMENDATIONS = [
  'Muolajadan so\'ng 2 soat davomida ovqat yemang va issiq suv ichmang',
  'Yonoq sohasiga sovuq kompress qo\'ying (har 15 daqiqada tanaffus bilan)',
  'Qattiq, issiq, nordon va achchiq taomlar iste\'mol qilishdan saqlaning',
  'Og\'iz bo\'shlig\'ini antiseptik eritmalar bilan muntazam chayib turing',
  '3 kundan so\'ng shifokor nazorat ko\'rigiga keling'
];

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  diagnosis: string;
  setDiagnosis: (d: string) => void;
  medications: PrescriptionMedicine[];
  setMedications: React.Dispatch<React.SetStateAction<PrescriptionMedicine[]>>;
  recommendations: string[];
  setRecommendations: React.Dispatch<React.SetStateAction<string[]>>;
  nextVisitDate: string;
  setNextVisitDate: (d: string) => void;
  doctorNotes: string;
  setDoctorNotes: (n: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  appointment,
  diagnosis,
  setDiagnosis,
  medications,
  setMedications,
  recommendations,
  setRecommendations,
  nextVisitDate,
  setNextVisitDate,
  doctorNotes,
  setDoctorNotes,
  onSend,
  isSending
}) => {
  const [customMedName, setCustomMedName] = useState('');
  const [customMedDosage, setCustomMedDosage] = useState('');
  const [customMedFreq, setCustomMedFreq] = useState('');
  const [customMedDuration, setCustomMedDuration] = useState('5 kun');

  if (!isOpen || !appointment) return null;

  const handleAddCustomMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMedName.trim()) return;
    setMedications(prev => [
      ...prev,
      {
        name: customMedName.trim(),
        dosage: customMedDosage.trim() || 'Standart',
        frequency: customMedFreq.trim() || 'Kuniga 2 mahal',
        duration: customMedDuration.trim() || '5 kun'
      }
    ]);
    setCustomMedName('');
    setCustomMedDosage('');
    setCustomMedFreq('');
  };

  const toggleRecommendation = (rec: string) => {
    setRecommendations(prev =>
      prev.includes(rec) ? prev.filter(r => r !== rec) : [...prev, rec]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 max-w-xl w-full border border-[#C5A880]/40 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C5A880]" />
            <div>
              <h3 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                Raqamli Retsept Yozish
              </h3>
              <p className="text-[11px] text-gray-500">
                Bemor: {appointment.patientName} (#{appointment.pinCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnosis Input */}
        <div>
          <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block mb-1">
            Tashxis & Muolaja tavsifi:
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Masalan: O'tkir chuqur karies, plomba o'rnatildi..."
            className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-medium focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        {/* Fast Medicine Presets */}
        <div>
          <label className="text-[11px] font-bold text-gray-500 block mb-1.5">
            Tezkor dorilar shablonlari (1-klikda qo'shish):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_MEDICINES.map((med, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!medications.some(m => m.name === med.name)) {
                    setMedications(prev => [...prev, med]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#07130F] text-[11px] font-semibold border border-gray-200 dark:border-gray-800 hover:border-[#C5A880] transition"
              >
                + {med.name}
              </button>
            ))}
          </div>
        </div>

        {/* Prescribed Medicines List */}
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          <label className="text-[11px] font-bold text-[#112E24] dark:text-[#FAF8F5] block">
            Retseptga kiritilgan dorilar ({medications.length}):
          </label>
          {medications.map((med, i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-[#FAF8F5] dark:bg-[#07130F] flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-[#112E24] dark:text-[#FAF8F5]">
                  {med.name} ({med.dosage})
                </div>
                <div className="text-gray-500 text-[11px]">
                  {med.frequency} • Davomiyligi: {med.duration}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMedications(prev => prev.filter((_, idx) => idx !== i))}
                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {medications.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-400">
              Hozircha dorilar kiritilmadi. Yuqoridagi shablonlardan tanlang yoki yangi dori qo'shing.
            </div>
          )}
        </div>

        {/* Add Custom Medicine Row */}
        <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#07130F] border border-[#E8E2D8] dark:border-[#183F32] space-y-2">
          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 block">
            Yangi dori vositasi qo'shish:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Dori nomi (masalan: Paratsetamol)"
              value={customMedName}
              onChange={e => setCustomMedName(e.target.value)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs font-semibold"
            />
            <input
              type="text"
              placeholder="Dozasi (500 mg)"
              value={customMedDosage}
              onChange={e => setCustomMedDosage(e.target.value)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Qabul qilish tartibi"
              value={customMedFreq}
              onChange={e => setCustomMedFreq(e.target.value)}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0E231B] text-xs"
            />
            <button
              type="button"
              onClick={handleAddCustomMedicine}
              className="py-2 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold rounded-lg hover:scale-95 transition flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Qo'shish</span>
            </button>
          </div>
        </div>

        {/* Recommendations Checklist */}
        <div>
          <label className="text-[11px] font-bold text-gray-500 block mb-1">
            Shifokor tavsiyalari (belgilang):
          </label>
          <div className="space-y-1">
            {STANDARD_RECOMMENDATIONS.map((rec, i) => (
              <label key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recommendations.includes(rec)}
                  onChange={() => toggleRecommendation(rec)}
                  className="rounded text-[#C5A880]"
                />
                <span>{rec}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Next Visit Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block mb-1">
              Keyingi nazorat ko'rigi:
            </label>
            <input
              type="date"
              value={nextVisitDate}
              onChange={e => setNextVisitDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] block mb-1">
              Qo'shimcha izoh:
            </label>
            <input
              type="text"
              value={doctorNotes}
              onChange={e => setDoctorNotes(e.target.value)}
              placeholder="Shaxsiy ko'rsatmalar..."
              className="w-full p-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-medium"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 transition"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSending ? 'Yuborilmoqda...' : 'Telegramga Retsept Yuborish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
