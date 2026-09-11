import { Doctor, Service, ToothData, BeforeAfterItem, Clinic, ClinicId, Appointment, Tenant } from '../types';

export const TENANTS: Tenant[] = [
  {
    id: 'dentamed',
    name: 'DentaMed Atelier',
    tagline: {
      uz: "Luks Stomatologiya & LOR Markazi (5 ta filial)",
      ru: 'Люкс Стоматология и ЛОР Центр (5 филиалов)'
    },
    badge: '5 ta Filial',
    defaultBranchId: 'nukus'
  },
  {
    id: 'grandmed',
    name: 'GrandMed International',
    tagline: {
      uz: "Ko'p Tarmoqli Xalqaro Tibbiyot Markazi (2 ta filial)",
      ru: 'Многопрофильный Международный Медцентр (2 филиала)'
    },
    badge: '2 ta Filial',
    defaultBranchId: 'grandmed-markaziy'
  }
];

export const CLINICS: Clinic[] = [
  {
    id: 'nukus',
    tenantId: 'dentamed',
    name: 'DentaMed Atelier (Nukus - Bosh filial)',
    branchName: {
      uz: 'Nukus Bosh filial',
      ru: 'Нукусский Головной филиал'
    },
    city: {
      uz: 'Toshkent',
      ru: 'Ташкент'
    },
    address: {
      uz: "Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy (Sirk ro'parasi)",
      ru: 'г. Ташкент, Мирабадский р-н, ул. Нукусская, 24'
    },
    landmark: {
      uz: "Rossiya elchixonasi ro'parasi, 204-kabinet",
      ru: 'Напротив посольства РФ, каб. 204'
    },
    phone: '+998 (71) 200-00-00',
    workingHours: {
      uz: '24/7 (Kechasi ham shoshilinch qabul)',
      ru: 'Круглосуточно 24/7 (Экстренный прием)'
    },
    badge: 'Atelier Flagship',
    isMain: true,
    staffPin: '1001',
    managerName: 'Malika Yusupova'
  },
  {
    id: 'chilonzor',
    tenantId: 'dentamed',
    name: 'DentaMed Elite (Chilonzor filiali)',
    branchName: {
      uz: 'Chilonzor filiali',
      ru: 'Чиланзарский филиал'
    },
    city: {
      uz: 'Toshkent',
      ru: 'Ташкент'
    },
    address: {
      uz: "Toshkent shahar, Chilonzor tumani, Bunyodkor shoh ko'chasi, 42-uy (Metro Mirzo Ulug'bek)",
      ru: 'г. Ташкент, Чиланзарский р-н, пр-т Бунёдкор, 42 (м. Мирзо Улугбек)'
    },
    landmark: {
      uz: 'Novza metro bekati, Korzinka yonida',
      ru: 'м. Новза, рядом с Корзинкой'
    },
    phone: '+998 (71) 200-03-03',
    workingHours: {
      uz: 'Dush-Yak: 08:00 - 21:00 (Dam olishsiz)',
      ru: 'Пн-Вс: 08:00 - 21:00 (Без выходных)'
    },
    badge: 'Elite Center',
    staffPin: '1002',
    managerName: 'Otabek Soliyev'
  },
  {
    id: 'yunusobod',
    tenantId: 'dentamed',
    name: 'DentaMed Premium (Yunusobod filiali)',
    branchName: {
      uz: 'Yunusobod filiali',
      ru: 'Юнусабадский филиал'
    },
    city: {
      uz: 'Toshkent',
      ru: 'Ташкент'
    },
    address: {
      uz: "Toshkent shahar, Yunusobod tumani, Amir Temur shox ko'chasi, 88-uy",
      ru: 'г. Ташкент, Юнусабадский р-н, пр-т Амира Темура, 88'
    },
    landmark: {
      uz: 'Shahriston metro bekati ro\'parasi',
      ru: 'Напротив м. Шахристан'
    },
    phone: '+998 (71) 200-04-04',
    workingHours: {
      uz: 'Dush-Shan: 08:30 - 20:30 • Yak: 09:00 - 18:00',
      ru: 'Пн-Сб: 08:30 - 20:30 • Вс: 09:00 - 18:00'
    },
    badge: 'Premium Clinic',
    staffPin: '1003',
    managerName: 'Gulruh Abdullayeva'
  },
  {
    id: 'samarqand',
    tenantId: 'dentamed',
    name: 'DentaMed Samarqand filiali',
    branchName: {
      uz: 'Samarqand filiali',
      ru: 'Самаркандский филиал'
    },
    city: {
      uz: 'Samarqand',
      ru: 'Самарканд'
    },
    address: {
      uz: "Samarqand shahar, Registon ko'chasi, 15-uy",
      ru: 'г. Самарканд, ул. Регистан, 15'
    },
    landmark: {
      uz: 'Registon maydoni yaqinida',
      ru: 'Около площади Регистан'
    },
    phone: '+998 (66) 230-00-00',
    workingHours: {
      uz: 'Dush-Yak: 08:00 - 20:00 (Har kuni)',
      ru: 'Пн-Вс: 08:00 - 20:00 (Ежедневно)'
    },
    badge: 'Regional Flagship',
    staffPin: '1004',
    managerName: 'Sherzod Rahimov'
  },
  {
    id: 'buxoro',
    tenantId: 'dentamed',
    name: 'DentaMed Buxoro filiali',
    branchName: {
      uz: 'Buxoro filiali',
      ru: 'Бухарский филиал'
    },
    city: {
      uz: 'Buxoro',
      ru: 'Бухара'
    },
    address: {
      uz: "Buxoro shahar, Bahouddin Naqshbandiy ko'chasi, 33-uy",
      ru: 'г. Бухара, ул. Бахоуддина Накшбанди, 33'
    },
    landmark: {
      uz: 'Labihovuz majmuasi yaqinida',
      ru: 'Рядом с ансамблем Ляби-хауз'
    },
    phone: '+998 (65) 220-00-00',
    workingHours: {
      uz: 'Dush-Shan: 08:30 - 20:00 • Yak: 09:00 - 17:00',
      ru: 'Пн-Сб: 08:30 - 20:00 • Вс: 09:00 - 17:00'
    },
    badge: 'Boutique Clinic',
    staffPin: '1005',
    managerName: 'Ziyoda Qodirova'
  },
  {
    id: 'grandmed-markaziy',
    tenantId: 'grandmed',
    name: 'GrandMed International (Markaziy filial)',
    branchName: {
      uz: 'Markaziy filial (Navoiy)',
      ru: 'Центральный филиал (Навои)'
    },
    city: {
      uz: 'Toshkent',
      ru: 'Ташкент'
    },
    address: {
      uz: "Toshkent shahar, Shayxontohur tumani, Navoiy ko'chasi, 11-uy",
      ru: 'г. Ташкент, Шайхантахурский р-н, ул. Навои, 11'
    },
    landmark: {
      uz: 'Alisher Navoiy metro bekati yonida',
      ru: 'Возле м. Алишера Навои'
    },
    phone: '+998 (71) 200-99-99',
    workingHours: {
      uz: 'Dush-Yak: 08:00 - 22:00 (Dam olishsiz)',
      ru: 'Пн-Вс: 08:00 - 22:00 (Без выходных)'
    },
    badge: 'Multispecialty Hub',
    isMain: true,
    staffPin: '2001',
    managerName: 'Farruh Ismoilov'
  },
  {
    id: 'grandmed-sergeli',
    tenantId: 'grandmed',
    name: 'GrandMed Sergeli filiali',
    branchName: {
      uz: 'Sergeli filiali',
      ru: 'Сергелийский филиал'
    },
    city: {
      uz: 'Toshkent',
      ru: 'Ташкент'
    },
    address: {
      uz: "Toshkent shahar, Sergeli tumani, Yangi Sergeli ko'chasi, 25-uy",
      ru: 'г. Ташкент, Сергелийский р-н, ул. Янги Сергели, 25'
    },
    landmark: {
      uz: 'Sergeli 4-bekat yonida',
      ru: 'Возле 4-й станции Сергели'
    },
    phone: '+998 (71) 200-88-88',
    workingHours: {
      uz: 'Dush-Shan: 08:30 - 21:00 • Yak: 09:00 - 18:00',
      ru: 'Пн-Сб: 08:30 - 21:00 • Вс: 09:00 - 18:00'
    },
    badge: 'Family Health',
    staffPin: '2002',
    managerName: 'Dilshod Bekmirzayev'
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
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'samarqand']
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
    clinicIds: ['chilonzor', 'yunusobod', 'nukus']
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
    clinicIds: ['nukus', 'samarqand']
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
    clinicIds: ['nukus', 'chilonzor', 'buxoro']
  },
  {
    id: 5,
    name: 'Dr. Aziz Karimov',
    specialty: {
      uz: 'Implantolog-Ortoped & Jarroh',
      ru: 'Имплантолог-Ортопед и Хирург'
    },
    department: 'stomatology',
    experience: 11,
    rating: 4.93,
    reviewsCount: 260,
    photo: '/images/doctors/dr_jamshid.jpg',
    availableDays: ['Dush', 'Sesh', 'Pay', 'Shan'],
    clinicIds: ['samarqand', 'buxoro', 'yunusobod']
  },
  {
    id: 6,
    name: 'Dr. Nilufar Saidova',
    specialty: {
      uz: 'Estetik Stomatolog (Vinirlar)',
      ru: 'Эстетический стоматолог (Виниры)'
    },
    department: 'stomatology',
    experience: 7,
    rating: 4.91,
    reviewsCount: 215,
    photo: '/images/doctors/dr_shahlo.jpg',
    availableDays: ['Sesh', 'Chor', 'Jum', 'Yak'],
    clinicIds: ['buxoro', 'samarqand', 'nukus']
  },
  {
    id: 7,
    name: 'Dr. Alisher Vohidov',
    specialty: {
      uz: 'Bosh Jarroh-Implantolog (GrandMed)',
      ru: 'Главный Хирург-Имплантолог (GrandMed)'
    },
    department: 'stomatology',
    experience: 16,
    rating: 4.97,
    reviewsCount: 380,
    photo: '/images/doctors/dr_jamshid.jpg',
    availableDays: ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum'],
    clinicIds: ['grandmed-markaziy', 'grandmed-sergeli']
  },
  {
    id: 8,
    name: 'Dr. Kamola Rasulova',
    specialty: {
      uz: 'LOR-Mutaxassis & Foniator',
      ru: 'ЛОР-Специалист и Фониатр'
    },
    department: 'lor',
    experience: 10,
    rating: 4.89,
    reviewsCount: 220,
    photo: '/images/doctors/dr_dilnoza.jpg',
    availableDays: ['Dush', 'Chor', 'Jum', 'Shan'],
    clinicIds: ['grandmed-markaziy', 'grandmed-sergeli']
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
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'samarqand', 'buxoro', 'grandmed-markaziy', 'grandmed-sergeli']
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
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'samarqand', 'buxoro', 'grandmed-markaziy', 'grandmed-sergeli']
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
    clinicIds: ['nukus', 'chilonzor', 'samarqand', 'buxoro', 'grandmed-markaziy']
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
    clinicIds: ['chilonzor', 'yunusobod', 'buxoro', 'grandmed-markaziy', 'grandmed-sergeli']
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
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'samarqand', 'buxoro', 'grandmed-markaziy', 'grandmed-sergeli']
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
    clinicIds: ['nukus', 'samarqand', 'grandmed-markaziy']
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
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'buxoro', 'grandmed-markaziy', 'grandmed-sergeli']
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
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'samarqand', 'grandmed-markaziy']
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
    isPopular: true,
    clinicIds: ['nukus', 'chilonzor', 'yunusobod', 'buxoro', 'grandmed-markaziy', 'grandmed-sergeli']
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
  // NUKUS BOSH FILIAL (12 ta bemor)
  {
    id: 'MED-849201',
    pinCode: '8492',
    patientName: 'Jasur Rahimov',
    phone: '+998 90 123 45 67',
    doctor: DOCTORS[0], // Dr. Jamshid Rustamov
    service: SERVICES[1], // Estetik Plomba
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
    id: 'MED-632190',
    pinCode: '6321',
    patientName: 'Otabek Mirzayev',
    phone: '+998 97 789 01 23',
    doctor: DOCTORS[2], // Dr. Bobur Mahmudov
    service: SERVICES[5], // LOR Video-Endoskopiya
    date: new Date().toISOString().split('T')[0],
    time: '09:45',
    status: 'completed',
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
    doctor: DOCTORS[0],
    service: SERVICES[2], // Implantatsiya
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'no_show',
    selectedTeethNumbers: [46],
    totalAmount: 3200000,
    clinicId: 'nukus',
    notes: 'Telefon ko\'tarmadi, kelmadi',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'MED-110293',
    pinCode: '1102',
    patientName: 'Zulayho Karimova',
    phone: '+998 90 911 22 33',
    doctor: DOCTORS[1], // Dr. Shahlo Karimova
    service: SERVICES[3], // Breket
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    status: 'in_progress',
    totalAmount: 4500000,
    clinicId: 'nukus',
    notes: 'Breket yoyini almashtirish va nazorat',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-224401',
    pinCode: '2244',
    patientName: 'Anvar Qodirov',
    phone: '+998 93 555 44 33',
    doctor: DOCTORS[0],
    service: SERVICES[4], // Gigiyena AirFlow
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    status: 'waiting',
    totalAmount: 400000,
    clinicId: 'nukus',
    notes: 'Tozalash va tabiiy oqartirish',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-335512',
    pinCode: '3355',
    patientName: 'Nodira Salimova',
    phone: '+998 94 222 11 00',
    doctor: DOCTORS[3], // Dr. Dilnoza Alimova
    service: SERVICES[6], // Gaymorit Kukushka
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    status: 'waiting',
    totalAmount: 150000,
    clinicId: 'nukus',
    notes: 'Kukushka muolajasi (3-kun)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-446623',
    pinCode: '4466',
    patientName: 'Rustam Ahmedov',
    phone: '+998 91 777 88 99',
    doctor: DOCTORS[2],
    service: SERVICES[7], // Tonzillorni yuvish
    date: new Date().toISOString().split('T')[0],
    time: '14:45',
    status: 'in_progress',
    totalAmount: 120000,
    clinicId: 'nukus',
    notes: 'Surunkali tonzillit, og\'iz hidlanishi',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'MED-557734',
    pinCode: '5577',
    patientName: 'Nilufar Ergasheva',
    phone: '+998 98 123 00 11',
    doctor: DOCTORS[0],
    service: SERVICES[2],
    date: new Date().toISOString().split('T')[0],
    time: '15:30',
    status: 'waiting',
    totalAmount: 3200000,
    clinicId: 'nukus',
    notes: 'Straumann implantini o\'rnatish',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-668845',
    pinCode: '6688',
    patientName: 'Bobur Toirov',
    phone: '+998 90 333 44 55',
    doctor: DOCTORS[5], // Dr. Nilufar Saidova
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '16:15',
    status: 'completed',
    totalAmount: 350000,
    clinicId: 'nukus',
    notes: 'Estetik plomba va polirovka',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'MED-779956',
    pinCode: '7799',
    patientName: 'Kamila Saidova',
    phone: '+998 93 888 99 00',
    doctor: DOCTORS[0],
    service: SERVICES[0], // Ko'rik 3D Rentgen
    date: new Date().toISOString().split('T')[0],
    time: '17:00',
    status: 'completed',
    totalAmount: 0,
    clinicId: 'nukus',
    notes: 'Birlamchi konsultatsiya',
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString()
  },
  {
    id: 'MED-880067',
    pinCode: '8800',
    patientName: 'Sardor Mansurov',
    phone: '+998 99 444 33 22',
    doctor: DOCTORS[2],
    service: SERVICES[5],
    date: new Date().toISOString().split('T')[0],
    time: '17:30',
    status: 'waiting',
    totalAmount: 180000,
    clinicId: 'nukus',
    notes: 'Burun to\'sig\'i qiyshiqligi tekshiruvi',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-991178',
    pinCode: '9911',
    patientName: 'Farida Yusupova',
    phone: '+998 97 555 66 77',
    doctor: DOCTORS[1],
    service: SERVICES[3],
    date: new Date().toISOString().split('T')[0],
    time: '18:15',
    status: 'completed',
    totalAmount: 1200000,
    clinicId: 'nukus',
    notes: 'Keramik vinir o\'lchami',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },

  // CHILONZOR FILIALI (8 ta bemor)
  {
    id: 'MED-715302',
    pinCode: '7153',
    patientName: 'Madina Usmonova',
    phone: '+998 93 456 78 90',
    doctor: DOCTORS[1],
    service: SERVICES[3],
    date: new Date().toISOString().split('T')[0],
    time: '11:15',
    status: 'in_progress',
    selectedTeethNumbers: [21, 22],
    totalAmount: 450000,
    clinicId: 'chilonzor',
    notes: 'Breket rejalashtirish, yuqori tishlar qatori qiyshiqligi',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-725413',
    pinCode: '7254',
    patientName: 'Jamoliddin Zokirov',
    phone: '+998 90 222 33 44',
    doctor: DOCTORS[3],
    service: SERVICES[6],
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'completed',
    totalAmount: 150000,
    clinicId: 'chilonzor',
    notes: 'Gaymorit muolajasi',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'MED-735524',
    pinCode: '7355',
    patientName: 'Gulbahor Aliyeva',
    phone: '+998 94 888 77 66',
    doctor: DOCTORS[0],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '12:30',
    status: 'waiting',
    totalAmount: 350000,
    clinicId: 'chilonzor',
    notes: 'Karies plomba',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-745635',
    pinCode: '7456',
    patientName: 'Sherali Nazarov',
    phone: '+998 91 111 22 33',
    doctor: DOCTORS[1],
    service: SERVICES[4],
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    status: 'waiting',
    totalAmount: 400000,
    clinicId: 'chilonzor',
    notes: 'AirFlow tozalash',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-755746',
    pinCode: '7557',
    patientName: 'Dildora Rashidova',
    phone: '+998 97 999 00 11',
    doctor: DOCTORS[3],
    service: SERVICES[8],
    date: new Date().toISOString().split('T')[0],
    time: '15:15',
    status: 'in_progress',
    totalAmount: 220000,
    clinicId: 'chilonzor',
    notes: 'Bolalar adenoid tekshiruvi',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-765857',
    pinCode: '7658',
    patientName: 'Botir Mirzayev',
    phone: '+998 99 777 66 55',
    doctor: DOCTORS[0],
    service: SERVICES[2],
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'waiting',
    totalAmount: 3200000,
    clinicId: 'chilonzor',
    notes: 'Implantatsiya konsultatsiyasi',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-775968',
    pinCode: '7759',
    patientName: 'Shahzoda Olimova',
    phone: '+998 90 666 55 44',
    doctor: DOCTORS[1],
    service: SERVICES[3],
    date: new Date().toISOString().split('T')[0],
    time: '17:00',
    status: 'completed',
    totalAmount: 4500000,
    clinicId: 'chilonzor',
    notes: 'Eylayner topshirildi',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'MED-785079',
    pinCode: '7850',
    patientName: 'Ulugbek Temirov',
    phone: '+998 93 333 22 11',
    doctor: DOCTORS[0],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'no_show',
    totalAmount: 350000,
    clinicId: 'chilonzor',
    notes: 'Kelmadi',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },

  // YUNUSOBOD FILIALI (5 ta bemor)
  {
    id: 'MED-810101',
    pinCode: '8101',
    patientName: 'Ravshan Haydarov',
    phone: '+998 90 555 12 34',
    doctor: DOCTORS[4], // Dr. Aziz Karimov
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'waiting',
    totalAmount: 350000,
    clinicId: 'yunusobod',
    notes: 'Old tish kariesi',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-820202',
    pinCode: '8202',
    patientName: 'Go\'zal Xalilova',
    phone: '+998 93 777 43 21',
    doctor: DOCTORS[1],
    service: SERVICES[3],
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    status: 'in_progress',
    totalAmount: 4500000,
    clinicId: 'yunusobod',
    notes: 'Breket korreksiyasi',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-830303',
    pinCode: '8303',
    patientName: 'Jahongir Po\'latov',
    phone: '+998 97 123 88 99',
    doctor: DOCTORS[0],
    service: SERVICES[4],
    date: new Date().toISOString().split('T')[0],
    time: '12:15',
    status: 'completed',
    totalAmount: 400000,
    clinicId: 'yunusobod',
    notes: 'Profilaktik tozalash',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'MED-840404',
    pinCode: '8404',
    patientName: 'Muxlisa Vohidova',
    phone: '+998 99 888 11 22',
    doctor: DOCTORS[4],
    service: SERVICES[2],
    date: new Date().toISOString().split('T')[0],
    time: '15:00',
    status: 'waiting',
    totalAmount: 3200000,
    clinicId: 'yunusobod',
    notes: 'Pastki molyar implantatsiyasi',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-850505',
    pinCode: '8505',
    patientName: 'Shuhrat Hasanov',
    phone: '+998 91 333 77 88',
    doctor: DOCTORS[0],
    service: SERVICES[0],
    date: new Date().toISOString().split('T')[0],
    time: '16:30',
    status: 'completed',
    totalAmount: 0,
    clinicId: 'yunusobod',
    notes: 'Rentgen tekshiruv',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },

  // SAMARQAND FILIALI (6 ta bemor)
  {
    id: 'MED-910111',
    pinCode: '9101',
    patientName: 'Temur Mirsaidov',
    phone: '+998 66 233 11 22',
    doctor: DOCTORS[4],
    service: SERVICES[2],
    date: new Date().toISOString().split('T')[0],
    time: '10:30',
    status: 'in_progress',
    totalAmount: 3200000,
    clinicId: 'samarqand',
    notes: 'Osstem implant o\'rnatish',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-920222',
    pinCode: '9202',
    patientName: 'Zebo Narziyeva',
    phone: '+998 66 555 44 33',
    doctor: DOCTORS[5],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '11:45',
    status: 'waiting',
    totalAmount: 350000,
    clinicId: 'samarqand',
    notes: 'Estetik plomba',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-930333',
    pinCode: '9303',
    patientName: 'Sanjar Ergashev',
    phone: '+998 90 777 00 11',
    doctor: DOCTORS[2],
    service: SERVICES[5],
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    status: 'waiting',
    totalAmount: 180000,
    clinicId: 'samarqand',
    notes: 'LOR endoskopiya',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-940444',
    pinCode: '9404',
    patientName: 'Nargiza Shodiyeva',
    phone: '+998 93 222 99 88',
    doctor: DOCTORS[5],
    service: SERVICES[4],
    date: new Date().toISOString().split('T')[0],
    time: '15:15',
    status: 'completed',
    totalAmount: 400000,
    clinicId: 'samarqand',
    notes: 'Toshlardan tozalash',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'MED-950555',
    pinCode: '9505',
    patientName: 'Elyor Boboyev',
    phone: '+998 97 444 88 77',
    doctor: DOCTORS[4],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'completed',
    totalAmount: 350000,
    clinicId: 'samarqand',
    notes: 'Plomba nazorati',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'MED-960666',
    pinCode: '9606',
    patientName: 'Gulnoza Hakimova',
    phone: '+998 99 111 66 55',
    doctor: DOCTORS[0],
    service: SERVICES[0],
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    status: 'no_show',
    totalAmount: 0,
    clinicId: 'samarqand',
    notes: 'Kelmadi',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },

  // BUXORO FILIALI (4 ta bemor)
  {
    id: 'MED-970777',
    pinCode: '9707',
    patientName: 'Mansur Ochilov',
    phone: '+998 65 221 33 44',
    doctor: DOCTORS[5],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'in_progress',
    totalAmount: 350000,
    clinicId: 'buxoro',
    notes: 'Tish kariesini tozalash',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-980888',
    pinCode: '9808',
    patientName: 'Dilorom Yo\'ldosheva',
    phone: '+998 65 333 88 99',
    doctor: DOCTORS[3],
    service: SERVICES[6],
    date: new Date().toISOString().split('T')[0],
    time: '11:30',
    status: 'waiting',
    totalAmount: 150000,
    clinicId: 'buxoro',
    notes: 'Kukushka muolajasi',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-990999',
    pinCode: '9909',
    patientName: 'Asadbek Nurillayev',
    phone: '+998 91 444 11 22',
    doctor: DOCTORS[4],
    service: SERVICES[2],
    date: new Date().toISOString().split('T')[0],
    time: '14:30',
    status: 'waiting',
    totalAmount: 3200000,
    clinicId: 'buxoro',
    notes: 'Implantatsiya',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-995511',
    pinCode: '9955',
    patientName: 'Saida Halimova',
    phone: '+998 90 123 99 88',
    doctor: DOCTORS[5],
    service: SERVICES[4],
    date: new Date().toISOString().split('T')[0],
    time: '16:00',
    status: 'completed',
    totalAmount: 400000,
    clinicId: 'buxoro',
    notes: 'AirFlow gigiyena',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },

  // GRANDMED MARKAZIY (7 ta bemor)
  {
    id: 'MED-501101',
    pinCode: '5011',
    patientName: 'Akmal Karimov',
    phone: '+998 71 200 99 01',
    doctor: DOCTORS[6], // Dr. Alisher Vohidov
    service: SERVICES[2],
    date: new Date().toISOString().split('T')[0],
    time: '09:30',
    status: 'in_progress',
    totalAmount: 3200000,
    clinicId: 'grandmed-markaziy',
    notes: 'Murakkab implantatsiya',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-502202',
    pinCode: '5022',
    patientName: 'Barno Umarova',
    phone: '+998 71 200 99 02',
    doctor: DOCTORS[7], // Dr. Kamola Rasulova
    service: SERVICES[5],
    date: new Date().toISOString().split('T')[0],
    time: '10:45',
    status: 'waiting',
    totalAmount: 180000,
    clinicId: 'grandmed-markaziy',
    notes: 'Endoskopiya ko\'rigi',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-503303',
    pinCode: '5033',
    patientName: 'Sherzod Tursunov',
    phone: '+998 71 200 99 03',
    doctor: DOCTORS[6],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '12:00',
    status: 'completed',
    totalAmount: 350000,
    clinicId: 'grandmed-markaziy',
    notes: 'Estetik plomba',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'MED-504404',
    pinCode: '5044',
    patientName: 'Gulinur Ismoilova',
    phone: '+998 71 200 99 04',
    doctor: DOCTORS[7],
    service: SERVICES[6],
    date: new Date().toISOString().split('T')[0],
    time: '14:15',
    status: 'waiting',
    totalAmount: 150000,
    clinicId: 'grandmed-markaziy',
    notes: 'Kukushka',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-505505',
    pinCode: '5055',
    patientName: 'Jasur Mirzayev',
    phone: '+998 71 200 99 05',
    doctor: DOCTORS[6],
    service: SERVICES[3],
    date: new Date().toISOString().split('T')[0],
    time: '15:30',
    status: 'in_progress',
    totalAmount: 4500000,
    clinicId: 'grandmed-markaziy',
    notes: 'Breket o\'rnatish',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'MED-506606',
    pinCode: '5066',
    patientName: 'Mavluda Rahimova',
    phone: '+998 71 200 99 06',
    doctor: DOCTORS[6],
    service: SERVICES[4],
    date: new Date().toISOString().split('T')[0],
    time: '16:45',
    status: 'completed',
    totalAmount: 400000,
    clinicId: 'grandmed-markaziy',
    notes: 'AirFlow',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 'MED-507707',
    pinCode: '5077',
    patientName: 'Otabek G\'aniyev',
    phone: '+998 71 200 99 07',
    doctor: DOCTORS[7],
    service: SERVICES[7],
    date: new Date().toISOString().split('T')[0],
    time: '17:30',
    status: 'completed',
    totalAmount: 120000,
    clinicId: 'grandmed-markaziy',
    notes: 'Tonzillor',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },

  // GRANDMED SERGELI (3 ta bemor)
  {
    id: 'MED-601101',
    pinCode: '6011',
    patientName: 'Farhod Yusupov',
    phone: '+998 71 200 88 01',
    doctor: DOCTORS[6],
    service: SERVICES[1],
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    status: 'waiting',
    totalAmount: 350000,
    clinicId: 'grandmed-sergeli',
    notes: 'Plomba',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'MED-602202',
    pinCode: '6022',
    patientName: 'Gulchehra Qosimova',
    phone: '+998 71 200 88 02',
    doctor: DOCTORS[7],
    service: SERVICES[6],
    date: new Date().toISOString().split('T')[0],
    time: '11:30',
    status: 'in_progress',
    totalAmount: 150000,
    clinicId: 'grandmed-sergeli',
    notes: 'Kukushka',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'MED-603303',
    pinCode: '6033',
    patientName: 'Mansur Shokirov',
    phone: '+998 71 200 88 03',
    doctor: DOCTORS[6],
    service: SERVICES[4],
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    status: 'completed',
    totalAmount: 400000,
    clinicId: 'grandmed-sergeli',
    notes: 'Gigiyena tozalash',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

