import React, { useState, useEffect } from 'react';
import { Language, Doctor, Service, Clinic } from '../types';
import { 
  Users, Plus, Trash2, Edit3, Image, Upload, CheckCircle2, 
  Sparkles, DollarSign, Building2, Key, Star, Award, MapPin, 
  X, AlertCircle, Save
} from 'lucide-react';

interface ClinicOwnerDashboardProps {
  lang: Language;
  tenantId: string;
  tenantName: string;
  clinics: Clinic[];
  doctors: Doctor[];
  services: Service[];
  onDoctorsChange: (docs: Doctor[]) => void;
  onServicesChange: (srvs: Service[]) => void;
  onToast: (msg: string) => void;
}

export const ClinicOwnerDashboard: React.FC<ClinicOwnerDashboardProps> = ({
  lang,
  tenantId,
  tenantName,
  clinics,
  doctors,
  services,
  onDoctorsChange,
  onServicesChange,
  onToast
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'doctors' | 'promo' | 'services' | 'branches'>('doctors');

  const tenantDoctors = doctors.filter(d => d.tenantId === tenantId || (!d.tenantId && tenantId === 'dentamed'));
  const tenantServices = services.filter(s => s.tenantId === tenantId || (!s.tenantId && tenantId === 'dentamed'));
  const tenantClinics = clinics.filter(c => c.tenantId === tenantId);

  // Promo State
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(50);
  const [promoBadge, setPromoBadge] = useState('Eksklyuziv Taklif');
  const [isPromoSaving, setIsPromoSaving] = useState(false);

  // Doctor Form Modal State
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [docName, setDocName] = useState('');
  const [docSpecUz, setDocSpecUz] = useState('');
  const [docSpecRu, setDocSpecRu] = useState('');
  const [docDept, setDocDept] = useState<'stomatology' | 'lor'>('stomatology');
  const [docExp, setDocExp] = useState(10);
  const [docClinicId, setDocClinicId] = useState(tenantClinics[0]?.id || '');
  const [docPhotoUrl, setDocPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Fetch Promo on Load
  useEffect(() => {
    fetch(`/api/tenants/${tenantId}/promo`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setPromoTitle(data.titleUz || '');
          setPromoDesc(data.descUz || '');
          setPromoDiscount(data.discountPercent || 50);
          setPromoBadge(data.badgeUz || 'Eksklyuziv Taklif');
        }
      })
      .catch(() => {});
  }, [tenantId]);

  // Handle Photo Upload
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const cleanName = `${tenantId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const res = await fetch('/api/upload/doctor-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, fileName: cleanName, tenantId })
        });
        const json = await res.json();
        if (json.status === 'success') {
          setDocPhotoUrl(json.url);
          onToast(lang === 'uz' ? "Rasm muvaffaqiyatli yuklandi!" : "Фото успешно загружено!");
        } else {
          onToast(json.message || "Rasm yuklashda xatolik");
        }
      } catch {
        onToast("Server bilan aloqa yo'q");
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Doctor (Create or Update)
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docSpecUz.trim()) {
      alert("Iltimos, shifokor ismi va mutaxassisligini kiriting!");
      return;
    }

    const payload = {
      tenantId,
      name: docName.trim(),
      specialty: {
        uz: docSpecUz.trim(),
        ru: docSpecRu.trim() || docSpecUz.trim()
      },
      department: docDept,
      experience: Number(docExp) || 5,
      clinicId: docClinicId || tenantClinics[0]?.id,
      clinicIds: [docClinicId || tenantClinics[0]?.id],
      photo: docPhotoUrl || (docDept === 'stomatology' ? '/images/doctors/dr_jamshid.jpg' : '/images/doctors/dr_bobur.jpg')
    };

    try {
      if (editingDoctor) {
        const res = await fetch(`/api/doctors/${editingDoctor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
          onDoctorsChange(doctors.map(d => d.id === editingDoctor.id ? { ...d, ...data.doctor } : d));
          onToast(lang === 'uz' ? "Shifokor ma'lumotlari yangilandi!" : "Данные врача обновлены!");
        }
      } else {
        const res = await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
          onDoctorsChange([...doctors, data.doctor]);
          onToast(lang === 'uz' ? "Yangi shifokor muvaffaqiyatli qo'shildi!" : "Новый врач успешно добавлен!");
        }
      }
      setIsDoctorModalOpen(false);
      setEditingDoctor(null);
    } catch {
      onToast("Xatolik yuz berdi!");
    }
  };

  // Delete Doctor
  const handleDeleteDoctor = async (id: number, name: string) => {
    if (!confirm(`Haqiqatan ham ${name} shifokorini o'chirmoqchimisiz?`)) return;
    try {
      const res = await fetch(`/api/doctors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onDoctorsChange(doctors.filter(d => d.id !== id));
        onToast(lang === 'uz' ? "Shifokor o'chirildi" : "Врач удален");
      }
    } catch {
      onToast("O'chirishda xatolik");
    }
  };

  const openEditDoctor = (doc: Doctor) => {
    setEditingDoctor(doc);
    setDocName(doc.name);
    setDocSpecUz(typeof doc.specialty === 'object' ? doc.specialty.uz : doc.specialty);
    setDocSpecRu(typeof doc.specialty === 'object' ? doc.specialty.ru : doc.specialty);
    setDocDept((doc.department as any) || 'stomatology');
    setDocExp(doc.experience || 10);
    setDocClinicId(doc.clinicId || doc.clinicIds?.[0] || tenantClinics[0]?.id || '');
    setDocPhotoUrl(doc.photo || '');
    setIsDoctorModalOpen(true);
  };

  const handleSavePromo = async () => {
    setIsPromoSaving(true);
    try {
      const payload = {
        titleUz: promoTitle,
        titleRu: promoTitle,
        badgeUz: promoBadge,
        badgeRu: promoBadge,
        discountPercent: Number(promoDiscount),
        descUz: promoDesc,
        descRu: promoDesc,
        buttonTextUz: "Imtiyoz bilan yozilish",
        buttonTextRu: "Записаться по акции",
        isActive: true
      };
      const res = await fetch(`/api/tenants/${tenantId}/promo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onToast(lang === 'uz' ? "Eksklyuziv aksiya va banner muvaffaqiyatli saqlandi!" : "Акция и баннер успешно сохранены!");
      }
    } catch {
      onToast("Xatolik yuz berdi");
    } finally {
      setIsPromoSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Luxury Gradient */}
      <div className="bg-gradient-to-r from-[#112E24] via-[#163B2F] to-[#0A1E17] rounded-3xl p-5 sm:p-6 border border-[#C5A880]/40 shadow-xl text-[#FAF8F5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#C5A880] text-[#112E24] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                👑 CEO / Owner Suite
              </span>
              <span className="text-xs text-[#D6BF9F]">
                {tenantClinics.length} ta filial • {tenantDoctors.length} ta shifokor
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF8F5]">
              {tenantName} Boshqaruv Markazi
            </h2>
            <p className="text-xs text-[#9FB1A7] mt-1 max-w-xl">
              {lang === 'uz' 
                ? "Klinikangiz shifokorlarini qo'shing, rasmlarini yuklang, eksklyuziv aksiyalarni va xizmatlar narxini 1 ta klikda boshqaring."
                : "Управляйте врачами, фотосессиями, промо-акциями и прейскурантом вашей клиники в один клик."}
            </p>
          </div>

          <button
            onClick={() => {
              setEditingDoctor(null);
              setDocName('');
              setDocSpecUz('');
              setDocSpecRu('');
              setDocDept('stomatology');
              setDocExp(10);
              setDocClinicId(tenantClinics[0]?.id || '');
              setDocPhotoUrl('');
              setIsDoctorModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#C5A880] hover:bg-[#D6BF9F] text-[#112E24] font-bold px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 text-xs tracking-wide shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'uz' ? "+ Yangi Shifokor Qo'shish" : "+ Добавить Врача"}</span>
          </button>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'doctors', labelUz: `👨‍⚕️ Shifokorlar (${tenantDoctors.length})` },
            { id: 'promo', labelUz: '💎 Eksklyuziv Aksiya & Banner' },
            { id: 'services', labelUz: `🩺 Xizmatlar & Narxlar (${tenantServices.length})` },
            { id: 'branches', labelUz: `📍 Filiallar & PIN-kodlar (${tenantClinics.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveAdminTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all whitespace-nowrap flex items-center gap-2 ${
                activeAdminTab === tab.id
                  ? 'bg-[#FAF8F5] text-[#112E24] shadow'
                  : 'text-[#D6BF9F] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>{tab.labelUz}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DOCTORS MANAGEMENT */}
      {activeAdminTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#112E24] dark:text-[#FAF8F5]">
              {tenantName} Shifokorlari Ro'yxati
            </h3>
            <span className="text-xs text-[#627068] dark:text-[#9FB1A7]">
              Jami: <b>{tenantDoctors.length}</b> ta mutaxassis
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenantDoctors.map(doc => {
              const branch = tenantClinics.find(c => c.id === (doc.clinicId || doc.clinicIds?.[0]));
              const specText = typeof doc.specialty === 'object' ? doc.specialty.uz : doc.specialty;
              return (
                <div 
                  key={doc.id}
                  className="bg-white dark:bg-[#0E231B] rounded-3xl p-4 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm hover:border-[#C5A880]/60 transition flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-16 h-20 rounded-2xl overflow-hidden bg-[#112E24] shrink-0 border border-[#C5A880]/40 shadow">
                      <img 
                        src={doc.photo || '/images/doctors/dr_jamshid.jpg'} 
                        alt={doc.name} 
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          e.currentTarget.src = '/images/doctors/dr_jamshid.jpg';
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#112E24]/10 dark:bg-[#C5A880]/20 text-[#112E24] dark:text-[#E5C9A4] uppercase">
                          {doc.department === 'stomatology' ? 'Dental' : 'LOR'}
                        </span>
                        <span className="text-[10px] text-[#C5A880] font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#C5A880]" />
                          {doc.rating || 4.9}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5] truncate">
                        {doc.name}
                      </h4>
                      <p className="text-[11px] text-[#627068] dark:text-[#9FB1A7] line-clamp-2 mt-0.5">
                        {specText}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-[#627068] dark:text-[#9FB1A7] mt-1.5">
                        <span className="flex items-center gap-0.5">
                          <Award className="w-3 h-3 text-[#C5A880]" />
                          {doc.experience} yil
                        </span>
                        <span>•</span>
                        <span className="truncate flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-[#C5A880]" />
                          {branch?.name?.replace('DentaMed ', '').replace('GrandMed ', '') || 'Bosh filial'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#E8E2D8]/60 dark:border-[#183F32]/60">
                    <button
                      onClick={() => openEditDoctor(doc)}
                      className="flex-1 py-1.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] text-xs font-semibold text-[#112E24] dark:text-[#FAF8F5] hover:bg-[#EBE5DC]/50 dark:hover:bg-[#183F32]/50 transition flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Tahrirlash</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                      className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROMO & EXCLUSIVE OFFERS */}
      {activeAdminTab === 'promo' && (
        <div className="bg-white dark:bg-[#0E231B] rounded-3xl p-6 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#C5A880]" />
            <h3 className="font-serif font-bold text-lg text-[#112E24] dark:text-[#FAF8F5]">
              {tenantName}: Eksklyuziv Kross-Taklif va Banner Sozlamalari
            </h3>
          </div>
          <p className="text-xs text-[#627068] dark:text-[#9FB1A7] mb-5">
            Ushbu aksiya bemorlar ilovani ochganda bosh sahifaning eng yuqori qismida ko'rinadi va qabulga yozilish konversiyasini 40% ga oshiradi.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1.5">
                Aksiya Nishoni (Badge):
              </label>
              <input
                type="text"
                value={promoBadge}
                onChange={e => setPromoBadge(e.target.value)}
                placeholder="Masalan: Eksklyuziv GrandMed Taklifi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-medium text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1.5">
                Aksiya Sarlavhasi (Title):
              </label>
              <input
                type="text"
                value={promoTitle}
                onChange={e => setPromoTitle(e.target.value)}
                placeholder="Masalan: Shveysariya Implanti o'rnatganlarga 3D Tomografiya 100% BEPUL!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-medium text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1.5">
                Batafsil Tavsifi (Description):
              </label>
              <textarea
                rows={3}
                value={promoDesc}
                onChange={e => setPromoDesc(e.target.value)}
                placeholder="Masalan: To'liq tish qatorini 1 kunda tiklang va bepul 3D konsultatsiyaga ega bo'ling."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-medium text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div className="w-48">
              <label className="block text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1.5">
                Chegirma Foizi (%):
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={promoDiscount}
                onChange={e => setPromoDiscount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-[#FAF8F5] dark:bg-[#07130F] text-xs font-bold text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
              />
            </div>

            <div className="pt-3">
              <button
                onClick={handleSavePromo}
                disabled={isPromoSaving}
                className="flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] font-bold px-6 py-3 rounded-2xl shadow hover:opacity-90 transition active:scale-95 text-xs"
              >
                <Save className="w-4 h-4" />
                <span>{isPromoSaving ? "Saqlanmoqda..." : "Aksiyani Saqlash va Ekranga Chiqarish"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICING */}
      {activeAdminTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-[#112E24] dark:text-[#FAF8F5]">
              {tenantName} Tibbiy Xizmatlari & Narxlari
            </h3>
            <button
              onClick={async () => {
                const titleUz = prompt("Yangi xizmat nomi (O'zbekcha):");
                if (!titleUz) return;
                const priceStr = prompt("Xizmat narxi (so'mda):", "200000");
                const price = Number(priceStr) || 150000;
                const res = await fetch('/api/services', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tenantId,
                    title: { uz: titleUz, ru: titleUz },
                    price,
                    department: 'stomatology',
                    clinicIds: tenantClinics.map(c => c.id)
                  })
                });
                const data = await res.json();
                if (data.status === 'success') {
                  onServicesChange([...services, data.service]);
                  onToast("Yangi xizmat qo'shildi!");
                }
              }}
              className="flex items-center gap-1.5 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-4 py-2 rounded-xl text-xs font-bold shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Yangi Xizmat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tenantServices.map(srv => {
              const titleText = typeof srv.title === 'object' ? srv.title.uz : srv.title;
              return (
                <div 
                  key={srv.id}
                  className="bg-white dark:bg-[#0E231B] rounded-2xl p-4 border border-[#E8E2D8] dark:border-[#183F32] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#112E24]/10 dark:bg-[#C5A880]/20 text-[#112E24] dark:text-[#E5C9A4] uppercase">
                        {srv.department === 'stomatology' ? 'Dental' : 'LOR'}
                      </span>
                    </div>
                    <h5 className="font-serif font-bold text-sm text-[#112E24] dark:text-[#FAF8F5] truncate">
                      {titleText}
                    </h5>
                    <div className="text-xs font-bold text-[#C5A880] mt-1">
                      {srv.price ? `${srv.price.toLocaleString()} so'm` : "Bepul (Ko'rik)"}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        const newPriceStr = prompt("Yangi narxni so'mda kiriting:", String(srv.price));
                        if (newPriceStr && !isNaN(Number(newPriceStr))) {
                          const newPrice = Number(newPriceStr);
                          const res = await fetch(`/api/services/${srv.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ price: newPrice })
                          });
                          if (res.ok) {
                            onServicesChange(services.map(s => s.id === srv.id ? { ...s, price: newPrice } : s));
                            onToast("Narx yangilandi!");
                          }
                        }
                      }}
                      className="p-2 rounded-xl text-[#C5A880] hover:bg-[#FAF8F5] dark:hover:bg-[#183F32] transition"
                      title="Narxni o'zgartirish"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Haqiqatan ham "${titleText}" xizmatini o'chirmoqchimisiz?`)) return;
                        const res = await fetch(`/api/services/${srv.id}`, { method: 'DELETE' });
                        if (res.ok) {
                          onServicesChange(services.filter(s => s.id !== srv.id));
                          onToast("Xizmat o'chirildi");
                        }
                      }}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BRANCHES & PIN CODES */}
      {activeAdminTab === 'branches' && (
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg text-[#112E24] dark:text-[#FAF8F5]">
            {tenantName} Filiallari va Xodimlar PIN-kodlari
          </h3>
          <p className="text-xs text-[#627068] dark:text-[#9FB1A7]">
            Har bir filial xodimi o'zining shaxsiy PIN-kodi orqali kiradi va faqat o'z filialidagi bemorlarni ko'ra oladi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tenantClinics.map(b => (
              <div
                key={b.id}
                className="bg-white dark:bg-[#0E231B] rounded-3xl p-5 border border-[#E8E2D8] dark:border-[#183F32] shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-base text-[#112E24] dark:text-[#FAF8F5]">
                    {b.name}
                  </h4>
                  <span className="text-[10px] font-mono bg-[#112E24] text-[#C5A880] px-2.5 py-1 rounded-full border border-[#C5A880]/40 font-bold flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    PIN: {b.staffPin || '1001'}
                  </span>
                </div>

                <div className="text-xs text-[#627068] dark:text-[#9FB1A7] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{b.address[lang] || b.address.uz}</span>
                  </div>
                  <div>📞 Aloqa: <b>{b.phone}</b></div>
                  <div>👤 Mas'ul xodim: <b>{b.managerName || 'Administrator'}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DOCTOR CREATE / EDIT MODAL */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] dark:bg-[#0E231B] rounded-3xl p-6 max-w-lg w-full border border-[#C5A880]/40 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E2D8] dark:border-[#183F32]">
              <h3 className="font-serif text-lg font-bold text-[#112E24] dark:text-[#FAF8F5]">
                {editingDoctor ? "Shifokor Ma'lumotlarini Tahrirlash" : "Yangi Shifokor Qo'shish"}
              </h3>
              <button 
                onClick={() => setIsDoctorModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/10 transition"
              >
                <X className="w-5 h-5 text-[#627068]" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              {/* Doctor Photo Upload Section */}
              <div>
                <label className="block font-bold text-[#112E24] dark:text-[#FAF8F5] mb-2">
                  Shifokor Fotosurati (📷):
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-24 rounded-2xl overflow-hidden bg-[#112E24] border border-[#C5A880]/40 shrink-0 shadow">
                    <img 
                      src={docPhotoUrl || '/images/doctors/dr_jamshid.jpg'} 
                      alt="Preview" 
                      className="w-full h-full object-cover object-top"
                      onError={(e) => { e.currentTarget.src = '/images/doctors/dr_jamshid.jpg'; }}
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] px-4 py-2 rounded-xl cursor-pointer font-bold hover:opacity-90 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingPhoto ? "Yuklanmoqda..." : "Fayl yoki Rasm tanlash"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoFileChange}
                      />
                    </label>
                    <p className="text-[10px] text-[#627068] dark:text-[#9FB1A7]">
                      JPEG, PNG, WEBP formatlar qo'llab-quvvatlanadi. Tizim avtomatik tarzda o'lchamga moslaydi.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1">
                  F.I.Sh (To'liq ismi):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Dr. Alisher Vohidov"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1">
                  Mutaxassisligi (O'zbekcha):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Bosh Shifokor, Jag'-yuz jarrohi"
                  value={docSpecUz}
                  onChange={e => setDocSpecUz(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1">
                    Bo'limi:
                  </label>
                  <select
                    value={docDept}
                    onChange={e => setDocDept(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                  >
                    <option value="stomatology">Stomatologiya (Dental)</option>
                    <option value="lor">LOR Markazi (ENT)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1">
                    Ish tajribasi (yil):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={docExp}
                    onChange={e => setDocExp(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#112E24] dark:text-[#FAF8F5] mb-1">
                  Qaysi filialda qabul qiladi:
                </label>
                <select
                  value={docClinicId}
                  onChange={e => setDocClinicId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] bg-white dark:bg-[#07130F] text-[#112E24] dark:text-[#FAF8F5] focus:outline-none focus:border-[#C5A880]"
                >
                  {tenantClinics.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E8E2D8] dark:border-[#183F32] text-xs font-semibold text-[#627068] hover:bg-black/5"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#112E24] dark:bg-[#C5A880] text-[#FAF8F5] dark:text-[#07130F] text-xs font-bold hover:opacity-90 shadow"
                >
                  {editingDoctor ? "O'zgarishlarni Saqlash" : "Shifokorni Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};