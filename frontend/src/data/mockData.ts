import { Doctor, Service, ToothData, BeforeAfterItem, Clinic, ClinicId, Appointment } from '../types';

export const CLINICS: Clinic[] = [
  {
    id: 'nukus',
    name: 'DentaMed Atelier',
    branchName: {
      uz: 'Nukus filiali',
      ru: 'Нукусский филиал'
    },
    address: {
      uz: "Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy (Sirk ro'parasi)",
      ru: 'г. Ташкент, Мирабадский р-н, ул. Нукусская, 24'
    },
    phone: '+998 (71) 200-00-00',
    workingHours: {
      uz: 'Dush-Shan: 09:00 - 20:00 • Yak: 10:00 - 16:00',
      ru: 'Пн-Сб: 09:00 - 20:00 • Вс: 10:00 - 16:00'
    },
    badge: 'Atelier Flagship'
  },
  {
    id: 'chilonzor',
    name: 'DentaMed Elite',
    branchName: {
      uz: 'Chilonzor filiali',
      ru: 'Чиланзарский филиал'
    },
    address: {
      uz: "Toshkent shahar, Chilonzor tumani, Bunyodkor shoh ko'chasi, 42-uy (Metro Mirzo Ulug'bek)",
      ru: 'г. Ташкент, Чиланзарский р-н, пр-т Бунёдкор, 42 (м. Мирзо Улугбек)'
    },
    phone: '+998 (71) 200-11-22',
    workingHours: {
      uz: 'Dush-Yak: 08:30 - 21:00 (Dam olishsiz)',
      ru: 'Пн-Вс: 08:30 - 21:00 (Без выходных)'
    },
    badge: 'Elite Center'
  }
];

export const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Jamshid Rustamov',
    specialty: {
      uz: 'Bosh Stomatolog-Implantolog',
      ru: 'Главный Стоматолог-Имплантолог'
    },
    department: 'stomatology',
    experience: 12,
    rating: 4.95,
    reviewsCount: 342,
    photo: '/images/doctors/dr_jamshid.jpg',
    availableDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum'],
    clinicIds: ['nukus', 'chilonzor']
  },
  {
    id: 2,
    name: 'Dr. Shahlo Karimova',
    specialty: {
      uz: 'Ortodont (Breket & Eylayner)',
      ru: 'Ортодонт (Брекеты и Элайнеры)'
    },
    department: 'stomatology',
    experience: 9,
    rating: 4.92,
    reviewsCount: 285,
    photo: '/images/doctors/dr_shahlo.jpg',
    availableDays: ['Dush', 'Chor', 'Jum', 'Shan'],
    clinicIds: ['chilonzor']
  },
  {
    id: 3,
    name: 'Dr. Bobur Mahmudov',
    specialty: {
      uz: 'Oliy toifali LOR-Jarroh (Endoskopiya)',
      ru: 'ЛОР-Хирург высшей категории (Эндоскопия)'
    },
    department: 'lor',
    experience: 15,
    rating: 4.98,
    reviewsCount: 412,
    photo: '/images/doctors/dr_bobur.jpg',
    availableDays: ['Sesh', 'Pay', 'Shan'],
    clinicIds: ['nukus']
  },
  {
    id: 4,
    name: 'Dr. Dilnoza Alimova',
    specialty: {
      uz: 'Bolalar LOR Shifokori & Audiolog',
      ru: 'Детский ЛОР-Врач и Аудиолог'
    },
    department: 'lor',
    experience: 8,
    rating: 4.88,
    reviewsCount: 198,
    photo: '/images/doctors/dr_dilnoza.jpg',
    availableDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'],
    clinicIds: ['nukus', 'chilonzor']
  }
];

export const SERVICES: Service[] = [
  // Stomatologiya
  {
    id: 100,
    department: 'stomatology',
    category: {
      uz: 'Diagnostika',
      ru: 'Диагностика'
    },
    title: {
      uz: 'Shifokor Ko\'rigi + 3D Rentgen Diagnostika',
      ru: 'Осмотр Врача + 3D Рентген Диагностика'
    },
    desc: {
      uz: 'Tish og\'rig\'i manbaini 5 daqiqada 100% aniqlash va davolash rejasini tuzish',
      ru: 'Точное определение источника зубной боли за 5 минут и план лечения'
    },
    price: 0,
    duration: 20,
    isPopular: true,
    clinicIds: ['nukus', 'chilonzor']
  },
  {
    id: 101,
    department: 'stomatology',
    category: {
      uz: 'Terapevtik',
      ru: 'Терапия'
    },
    title: {
      uz: 'Estetik Plomba va Kariesni davolash',
      ru: 'Эстетическая пломба и лечение кариеса'
    },
    desc: {
      uz: 'Nemis kompozit materiallari bilan og\'riqsiz tishni tiklash',
      ru: 'Безболезненное восстановление зуба немецкими композитами'
    },
    price: 350000,
    duration: 40,
    isPopular: true,
    clinicIds: ['nukus', 'chilonzor']
  },
  {
    id: 102,
    department: 'stomatology',
    category: {
      uz: 'Implantatsiya',
      ru: 'Имплантация'
    },
    title: {
      uz: 'Koreya / Shveytsariya Implanti (Osstem/Straumann)',
      ru: 'Имплантация Корея / Швейцария (Osstem/Straumann)'
    },
    desc: {
      uz: 'Umrlik kafolatga ega, eng yuqori darajada ilashuvchi implantlar',
      ru: 'Премиум импланты с пожизненной гарантией приживаемости'
    },
    price: 3200000,
    duration: 60,
    isPopular: true,
    clinicIds: ['nukus']
  },
  {
    id: 103,
    department: 'stomatology',
    category: {
      uz: 'Ortodontiya',
      ru: 'Ортодонтия'
    },
    title: {
      uz: 'Keramik / Metall Breket o\'rnatish',
      ru: 'Установка металлических / керамических брекетов'
    },
    desc: {
      uz: 'Tish qatorini to\'g\'rilash va chiroyli tabassum yaratish',
      ru: 'Исправление прикуса и создание идеальной улыбки'
    },
    price: 4500000,
    duration: 50,
    isPopular: false,
    clinicIds: ['chilonzor']
  },
  {
    id: 104,
    department: 'stomatology',
    category: {
      uz: 'Gigiyena',
      ru: 'Гигиена'
    },
    title: {
      uz: 'Ultrasonik tozalash + AirFlow oqartirish',
      ru: 'Ультразвуковая чистка + AirFlow отбеливание'
    },
    desc: {
      uz: 'Toshlar va blyashkalarni tozalash, 2-3 tonna tabiiy oqartirish',
      ru: 'Удаление зубного камня, налета и осветление на 2-3 тона'
    },
    price: 400000,
    duration: 35,
    isPopular: true,
    clinicIds: ['nukus', 'chilonzor']
  },

  // LOR
  {
    id: 201,
    department: 'lor',
    category: {
      uz: 'Diagnostika',
      ru: 'Диагностика'
    },
    title: {
      uz: 'LOR-Kombayn Video-Endoskopik Ko\'rik',
      ru: 'Видео-эндоскопический осмотр на ЛОР-комбайне'
    },
    desc: {
      uz: 'Quloq, tomoq va burun bo\'shlig\'ini 4K mikrokamera orqali 100% aniq ko\'rish',
      ru: 'Сверхточный осмотр уха, горла и носа через 4K микрокамеру'
    },
    price: 180000,
    duration: 25,
    isPopular: true,
    clinicIds: ['nukus']
  },
  {
    id: 202,
    department: 'lor',
    category: {
      uz: 'Muolaja',
      ru: 'Процедуры'
    },
    title: {
      uz: 'Gaymoritni punksiyasiz (Kukushka) davolash',
      ru: 'Беспункционное лечение гайморита («Кукушка»)'
    },
    desc: {
      uz: 'Burun bo\'shliqlarini vakuumli dorilar bilan yuvish va nafasni ochish',
      ru: 'Вакуумное промывание пазух носа антисептиками без прокола'
    },
    price: 150000,
    duration: 20,
    isPopular: true,
    clinicIds: ['nukus', 'chilonzor']
  },
  {
    id: 203,
    department: 'lor',
    category: {
      uz: 'Muolaja',
      ru: 'Процедуры'
    },
    title: {
      uz: 'Tonzillorni yuvish (Surunkali angina/tonzillit)',
      ru: 'Промывание миндалин на аппарате Тонзиллор'
    },
    desc: {
      uz: 'Tomoq og\'rig\'i va hidni yo\'qotuvchi chuqur ultratovushli tozalash',
      ru: 'Глубокое ультразвуковое очищение миндалин от пробок'
    },
    price: 120000,
    duration: 20,
    isPopular: false,
    clinicIds: ['nukus', 'chilonzor']
  },
  {
    id: 204,
    department: 'lor',
    category: {
      uz: 'Bolalar LOR',
      ru: 'Детский ЛОР'
    },
    title: {
      uz: 'Bolalar Adenoid va Eshitish qobiliyati testi',
      ru: 'Тест слуха и диагностика аденоидов у детей'
    },
    desc: {
      uz: 'Bolaning tinch nafas olishi va eshitishini tiklash diagnostikasi',
      ru: 'Комплексная проверка слуха и проходимости носового дыхания'
    },
    price: 220000,
    duration: 30,
    isPopular: true
  }
];

export const INITIAL_TEETH: ToothData[] = [
  // Yuqori Jag' - O'ng tomon (Upper Right - Quadrant 1: 18 -> 11)
  {
    number: 18,
    label: '18',
    type: 'wisdom',
    quadrant: 'upper_right',
    name: { uz: 'O\'ng yuqori aql tishi (8-tish)', ru: 'Правый верхний зуб мудрости (8-ка)' },
    condition: 'healthy'
  },
  {
    number: 17,
    label: '17',
    type: 'molar',
    quadrant: 'upper_right',
    name: { uz: '2-katta chaynash tishi (Molyar)', ru: '2-й большой жевательный зуб (Моляр)' },
    condition: 'healthy'
  },
  {
    number: 16,
    label: '16',
    type: 'molar',
    quadrant: 'upper_right',
    name: { uz: '1-katta chaynash tishi (Molyar)', ru: '1-й большой жевательный зуб (Моляр)' },
    condition: 'filling',
    treatment: { uz: 'Fotopolimer plomba qo\'yilgan (Holati a\'lo)', ru: 'Фотополимерная пломба (В отличном состоянии)' },
    price: 350000
  },
  {
    number: 15,
    label: '15',
    type: 'premolar',
    quadrant: 'upper_right',
    name: { uz: '2-kichik oziq tish (Premo\'lyar)', ru: '2-й малый коренной зуб (Премоляр)' },
    condition: 'healthy'
  },
  {
    number: 14,
    label: '14',
    type: 'premolar',
    quadrant: 'upper_right',
    name: { uz: '1-kichik oziq tish (Premo\'lyar)', ru: '1-й малый коренной зуб (Премоляр)' },
    condition: 'caries',
    treatment: { uz: 'O\'rta karies aniqlangan — shoshilinch davolash zarur', ru: 'Обнаружен средний кариес — рекомендуется лечение' },
    price: 320000
  },
  {
    number: 13,
    label: '13',
    type: 'canine',
    quadrant: 'upper_right',
    name: { uz: 'O\'ng qoziq tish (O\'tkir tish)', ru: 'Правый клык' },
    condition: 'healthy'
  },
  {
    number: 12,
    label: '12',
    type: 'incisor',
    quadrant: 'upper_right',
    name: { uz: 'O\'ng yon kesuvchi tish (Oldingi)', ru: 'Боковой резец (Передний)' },
    condition: 'healthy'
  },
  {
    number: 11,
    label: '11',
    type: 'incisor',
    quadrant: 'upper_right',
    name: { uz: 'Markaziy oldingi tish (Tabassum markazi)', ru: 'Центральный передний резец' },
    condition: 'healthy'
  },

  // Yuqori Jag' - Chap tomon (Upper Left - Quadrant 2: 21 -> 28)
  {
    number: 21,
    label: '21',
    type: 'incisor',
    quadrant: 'upper_left',
    name: { uz: 'Chap markaziy oldingi tish', ru: 'Левый центральный передний резец' },
    condition: 'healthy'
  },
  {
    number: 22,
    label: '22',
    type: 'incisor',
    quadrant: 'upper_left',
    name: { uz: 'Chap yon kesuvchi tish (Oldingi)', ru: 'Левый боковой резец' },
    condition: 'healthy'
  },
  {
    number: 23,
    label: '23',
    type: 'canine',
    quadrant: 'upper_left',
    name: { uz: 'Chap qoziq tish (O\'tkir tish)', ru: 'Левый клык' },
    condition: 'healthy'
  },
  {
    number: 24,
    label: '24',
    type: 'premolar',
    quadrant: 'upper_left',
    name: { uz: '1-kichik oziq tish (Premo\'lyar)', ru: '1-й малый коренной зуб (Премоляр)' },
    condition: 'healthy'
  },
  {
    number: 25,
    label: '25',
    type: 'premolar',
    quadrant: 'upper_left',
    name: { uz: '2-kichik oziq tish (Premo\'lyar)', ru: '2-й малый коренной зуб (Премоляр)' },
    condition: 'healthy'
  },
  {
    number: 26,
    label: '26',
    type: 'molar',
    quadrant: 'upper_left',
    name: { uz: '1-katta chaynash tishi (Molyar)', ru: '1-й большой жевательный зуб (Моляр)' },
    condition: 'crown',
    treatment: { uz: 'Sirkoniy estetik toj (koronka) o\'rnatilgan', ru: 'Установлена циркониевая коронка' },
    price: 1200000
  },
  {
    number: 27,
    label: '27',
    type: 'molar',
    quadrant: 'upper_left',
    name: { uz: '2-katta chaynash tishi (Molyar)', ru: '2-й большой жевательный зуб (Моляр)' },
    condition: 'healthy'
  },
  {
    number: 28,
    label: '28',
    type: 'wisdom',
    quadrant: 'upper_left',
    name: { uz: 'Chap yuqori aql tishi (8-tish)', ru: 'Левый верхний зуб мудрости' },
    condition: 'healthy'
  },

  // Pastki Jag' - O'ng tomon (Lower Right - Quadrant 4: 48 -> 41)
  {
    number: 48,
    label: '48',
    type: 'wisdom',
    quadrant: 'lower_right',
    name: { uz: 'O\'ng pastki aql tishi', ru: 'Правый нижний зуб мудрости' },
    condition: 'missing',
    treatment: { uz: 'Retinirlangan aql tishi operatsiya qilib olingan', ru: 'Ретинированный зуб мудрости удален' }
  },
  {
    number: 47,
    label: '47',
    type: 'molar',
    quadrant: 'lower_right',
    name: { uz: '2-katta chaynash tishi (Molyar)', ru: '2-й жевательный зуб' },
    condition: 'healthy'
  },
  {
    number: 46,
    label: '46',
    type: 'molar',
    quadrant: 'lower_right',
    name: { uz: '1-katta chaynash tishi (Implant)', ru: '1-й жевательный зуб (Имплант)' },
    condition: 'implant',
    treatment: { uz: 'Osstem (Janubiy Koreya) implanti o\'rnatilgan', ru: 'Установлен имплант Osstem' },
    price: 3200000
  },
  {
    number: 45,
    label: '45',
    type: 'premolar',
    quadrant: 'lower_right',
    name: { uz: '2-kichik oziq tish (Premo\'lyar)', ru: '2-й малый коренной зуб' },
    condition: 'healthy'
  },
  {
    number: 44,
    label: '44',
    type: 'premolar',
    quadrant: 'lower_right',
    name: { uz: '1-kichik oziq tish (Premo\'lyar)', ru: '1-й малый коренной зуб' },
    condition: 'healthy'
  },
  {
    number: 43,
    label: '43',
    type: 'canine',
    quadrant: 'lower_right',
    name: { uz: 'O\'ng pastki qoziq tish', ru: 'Правый нижний клык' },
    condition: 'healthy'
  },
  {
    number: 42,
    label: '42',
    type: 'incisor',
    quadrant: 'lower_right',
    name: { uz: 'O\'ng pastki yon kesuvchi tish', ru: 'Правый нижний боковой резец' },
    condition: 'healthy'
  },
  {
    number: 41,
    label: '41',
    type: 'incisor',
    quadrant: 'lower_right',
    name: { uz: 'O\'ng pastki markaziy tish', ru: 'Правый нижний центральный резец' },
    condition: 'healthy'
  },

  // Pastki Jag' - Chap tomon (Lower Left - Quadrant 3: 31 -> 38)
  {
    number: 31,
    label: '31',
    type: 'incisor',
    quadrant: 'lower_left',
    name: { uz: 'Chap pastki markaziy tish', ru: 'Левый нижний центральный резец' },
    condition: 'healthy'
  },
  {
    number: 32,
    label: '32',
    type: 'incisor',
    quadrant: 'lower_left',
    name: { uz: 'Chap pastki yon kesuvchi tish', ru: 'Левый нижний боковой резец' },
    condition: 'healthy'
  },
  {
    number: 33,
    label: '33',
    type: 'canine',
    quadrant: 'lower_left',
    name: { uz: 'Chap pastki qoziq tish', ru: 'Левый нижний клык' },
    condition: 'healthy'
  },
  {
    number: 34,
    label: '34',
    type: 'premolar',
    quadrant: 'lower_left',
    name: { uz: '1-kichik oziq tish (Premo\'lyar)', ru: '1-й малый коренной зуб' },
    condition: 'healthy'
  },
  {
    number: 35,
    label: '35',
    type: 'premolar',
    quadrant: 'lower_left',
    name: { uz: '2-kichik oziq tish (Premo\'lyar)', ru: '2-й малый коренной зуб' },
    condition: 'healthy'
  },
  {
    number: 36,
    label: '36',
    type: 'molar',
    quadrant: 'lower_left',
    name: { uz: '1-katta chaynash tishi (Molyar)', ru: '1-й жевательный зуб' },
    condition: 'filling',
    treatment: { uz: 'Estetik plomba yangilangan', ru: 'Эстетическая пломба обновлена' },
    price: 350000
  },
  {
    number: 37,
    label: '37',
    type: 'molar',
    quadrant: 'lower_left',
    name: { uz: '2-katta chaynash tishi (Molyar)', ru: '2-й жевательный зуб' },
    condition: 'caries',
    treatment: { uz: 'Boshlang\'ich emal kariesi — tozalash va flyuoridlash tavsiya etiladi', ru: 'Начальный кариес эмали — рекомендуется чистка' },
    price: 280000
  },
  {
    number: 38,
    label: '38',
    type: 'wisdom',
    quadrant: 'lower_left',
    name: { uz: 'Chap pastki aql tishi', ru: 'Левый нижний зуб мудрости' },
    condition: 'healthy'
  }
];

export const BEFORE_AFTER_CASES: BeforeAfterItem[] = [
  {
    id: 1,
    title: {
      uz: 'AirFlow + Lazerli Tish Oqartirish',
      ru: 'AirFlow + Лазерное Отбеливание Зубов'
    },
    category: {
      uz: 'Oqartirish',
      ru: 'Отбеливание'
    },
    // Authentic clinical macro close-up dental mouth photography
    beforeImg: '/images/whitening_before.jpg',
    afterImg: '/images/whitening_after.jpg',
    description: {
      uz: '1 seans (45 daqiqa) davomida kofe va choy dog\'lari tozalandi, emal 4 tonnaga oqartirildi.',
      ru: 'За 1 сеанс (45 минут) удален налет от кофе и чая, эмаль осветлена на 4 тона.'
    }
  },
  {
    id: 2,
    title: {
      uz: 'E-Max Keramik Vinirlar (Hollivud Tabassumi)',
      ru: 'Керамические Виниры E-Max (Голливудская Улыбка)'
    },
    category: {
      uz: 'Vinirlar',
      ru: 'Виниры'
    },
    beforeImg: '/images/veneers_before.jpg',
    afterImg: '/images/whitening_after.jpg',
    description: {
      uz: 'Oldingi tishlar orasidagi tirqish (diastema) yopildi va ultra-ingichka E-Max keramik vinirlar o\'rnatildi.',
      ru: 'Закрыта диастема между передними зубами и установлены ультратонкие виниры E-Max.'
    }
  },
  {
    id: 3,
    title: {
      uz: 'Ortodontik Tish Qatorini Tekislash',
      ru: 'Выравнивание Зубного Ряда'
    },
    category: {
      uz: 'Breketlar',
      ru: 'Брекеты'
    },
    beforeImg: '/images/veneers_before.jpg',
    afterImg: '/images/whitening_after.jpg',
    description: {
      uz: 'Tishlarning notekis o\'sishi va qator qiyshiqligi bartaraf etilib, mukammal simmetriya yaratildi.',
      ru: 'Устранена скученность и неровности, создана идеальная симметрия зубного ряда.'
    }
  }
];

export const TIME_SLOTS = [
  '09:00', '09:45', '10:30', '11:15', '12:00',
  '14:00', '14:45', '15:30', '16:15', '17:00'
];

export const INITIAL_RECEPTION_APPOINTMENTS: Appointment[] = [
  {
    id: 'MED-849201',
    pinCode: '8492',
    patientName: 'Jasur Rahimov',
    phone: '+998 90 123 45 67',
    doctor: DOCTORS[0], // Dr. Jamshid Rustamov
    service: {
      id: 101,
      department: 'stomatology',
      category: { uz: 'Terapevtik', ru: 'Терапия' },
      title: { uz: 'Estetik Plomba va Kariesni davolash', ru: 'Эстетическая пломба и лечение кариеса' },
      desc: { uz: 'Nemis kompozit materiallari bilan', ru: 'Немецкие композиты' },
      price: 350000,
      duration: 40
    },
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    status: 'waiting',
    selectedTeethNumbers: [14, 15],
    hasPromoUltrasonic: true,
    totalAmount: 550000,
    clinicId: 'nukus',
    notes: 'Yuqori o\'ng tishda sovuq suv ichganda kuchli og\'riq sezilmoqda',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-715302',
    pinCode: '7153',
    patientName: 'Madina Usmonova',
    phone: '+998 93 456 78 90',
    doctor: DOCTORS[1], // Dr. Shahlo Karimova
    service: {
      id: 104,
      department: 'stomatology',
      category: { uz: 'Ortodontiya', ru: 'Ортодонтия' },
      title: { uz: 'Ortodontik Diagnostika va Eylayner', ru: 'Ортодонтическая Диагностика' },
      desc: { uz: '3D skanerlash va breket tekshiruvi', ru: '3D сканирование' },
      price: 450000,
      duration: 30
    },
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    status: 'in_progress',
    selectedTeethNumbers: [21, 22],
    hasPromoUltrasonic: false,
    totalAmount: 450000,
    clinicId: 'chilonzor',
    notes: 'Breket rejalashtirish, yuqori tishlar qatori qiyshiqligi',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-632190',
    pinCode: '6321',
    patientName: 'Otabek Mirzayev',
    phone: '+998 97 789 01 23',
    doctor: DOCTORS[2], // Dr. Bobur Mahmudov
    service: {
      id: 200,
      department: 'lor',
      category: { uz: 'Diagnostika', ru: 'Диагностика' },
      title: { uz: 'Video-Endoskopik LOR Ko\'rik (HD)', ru: 'Видео-Эндоскопический ЛОР Осмотр (HD)' },
      desc: { uz: 'Nemis Karl Storz uskunasi', ru: 'Karl Storz' },
      price: 180000,
      duration: 25
    },
    date: new Date().toISOString().split('T')[0],
    time: '09:45',
    status: 'completed',
    hasPromoUltrasonic: false,
    totalAmount: 180000,
    clinicId: 'nukus',
    notes: 'Surunkali gaymorit, burundan nafas olish qiyinlashuvi',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'MED-551048',
    pinCode: '5510',
    patientName: 'Dilshod Normatov',
    phone: '+998 99 321 65 47',
    doctor: DOCTORS[0], // Dr. Jamshid Rustamov
    service: {
      id: 102,
      department: 'stomatology',
      category: { uz: 'Jarrohlik', ru: 'Хирургия' },
      title: { uz: 'Premium Shveysariya Implantatsiyasi (Straumann)', ru: 'Швейцарская Имплантация Straumann' },
      desc: { uz: 'Umrlik kafolatli titan implant', ru: 'Пожизненная гарантия' },
      price: 4500000,
      duration: 60
    },
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'no_show',
    selectedTeethNumbers: [46],
    hasPromoUltrasonic: false,
    totalAmount: 4500000,
    clinicId: 'nukus',
    notes: 'Telefon ko\'tarmadi, kelmadi',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

