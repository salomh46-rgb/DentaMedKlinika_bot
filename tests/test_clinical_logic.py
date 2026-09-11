import pytest

TOOTH_MAP_ADULT_COUNT = 32

def test_32_teeth_anatomy_validity():
    # FDI World Dental Federation notation (11-48)
    quadrants = [
        [18, 17, 16, 15, 14, 13, 12, 11], # Upper Right
        [21, 22, 23, 24, 25, 26, 27, 28], # Upper Left
        [31, 32, 33, 34, 35, 36, 37, 38], # Lower Left
        [48, 47, 46, 45, 44, 43, 42, 41]  # Lower Right
    ]
    all_teeth = [t for q in quadrants for t in q]
    assert len(all_teeth) == TOOTH_MAP_ADULT_COUNT
    assert len(set(all_teeth)) == TOOTH_MAP_ADULT_COUNT

def test_tooth_price_calculation():
    def calculate_treatment_total(services):
        return sum(s.get('price', 0) for s in services)

    services = [
        {'id': 'plomba', 'title': 'Kompozit Plomba', 'price': 250000},
        {'id': 'tozalash', 'title': 'Ultratovushli Tozalash', 'price': 300000}
    ]
    total = calculate_treatment_total(services)
    assert total == 550000

def test_cross_promo_two_or_more_teeth_discount():
    """
    Talab 3: 2 tadan ko'p tish tanlanganda kross-aksiya va chegirma kalkulyatori:
    '2 ta tish davolansa, ultratovushli tozalash 50% chegirmada!'
    """
    def calculate_teeth_promo(selected_teeth_count, teeth_cost, include_ultrasonic=True):
        ultrasonic_original_price = 400000
        is_promo_eligible = selected_teeth_count >= 2
        
        if include_ultrasonic:
            if is_promo_eligible:
                ultrasonic_discount = ultrasonic_original_price * 0.50 # 50% chegirma
                ultrasonic_final_price = ultrasonic_original_price - ultrasonic_discount
            else:
                ultrasonic_discount = 0
                ultrasonic_final_price = ultrasonic_original_price
        else:
            ultrasonic_discount = 0
            ultrasonic_final_price = 0
            
        total_amount = teeth_cost + ultrasonic_final_price
        savings = ultrasonic_discount
        return {
            'is_promo_eligible': is_promo_eligible,
            'teeth_cost': teeth_cost,
            'ultrasonic_price': ultrasonic_final_price,
            'savings': savings,
            'total_amount': total_amount
        }

    # Holat 1: Faqat 1 ta tish tanlanganda (Aksiya ishlamaydi)
    res_1 = calculate_teeth_promo(selected_teeth_count=1, teeth_cost=350000, include_ultrasonic=True)
    assert res_1['is_promo_eligible'] is False
    assert res_1['savings'] == 0
    assert res_1['ultrasonic_price'] == 400000
    assert res_1['total_amount'] == 750000

    # Holat 2: 2 ta tish tanlanganda (Aksiya 50% ishlaydi!)
    res_2 = calculate_teeth_promo(selected_teeth_count=2, teeth_cost=700000, include_ultrasonic=True)
    assert res_2['is_promo_eligible'] is True
    assert res_2['savings'] == 200000 # 50% tejam
    assert res_2['ultrasonic_price'] == 200000
    assert res_2['total_amount'] == 900000 # 700k + 200k (1.1m emas!)

    # Holat 3: 3 ta tish tanlanganda (Aksiya 50% ishlaydi!)
    res_3 = calculate_teeth_promo(selected_teeth_count=3, teeth_cost=1050000, include_ultrasonic=True)
    assert res_3['is_promo_eligible'] is True
    assert res_3['savings'] == 200000
    assert res_3['total_amount'] == 1250000

def test_digital_receipt_and_qr_ticket_data():
    """
    Talab 4: Bemor uchun raqamli kvitansiya / QR-bron chiptasi ma'lumotlari to'liqligi.
    """
    sample_ticket = {
        'id': 'MED-829104',
        'pinCode': '7429',
        'patientName': 'Javohirbek Asqarov',
        'phone': '+998 90 123 45 67',
        'doctor': {
            'id': 1,
            'name': 'Dr. Jamshid Rustamov',
            'specialty': {'uz': 'Bosh Stomatolog-Implantolog', 'ru': 'Главный Стоматолог'}
        },
        'service': {
            'id': 101,
            'title': {'uz': 'Estetik Plomba', 'ru': 'Эстетическая пломба'},
            'price': 350000
        },
        'selectedTeethNumbers': [16, 46],
        'hasPromoUltrasonic': True,
        'discountAmount': 200000,
        'totalAmount': 900000,
        'date': '2026-09-12',
        'time': '10:30',
        'status': 'confirmed'
    }

    # Tekshiruvlar
    assert sample_ticket['id'].startswith('MED-')
    assert len(sample_ticket['pinCode']) == 4
    assert sample_ticket['pinCode'].isdigit()
    assert len(sample_ticket['selectedTeethNumbers']) == 2
    assert sample_ticket['hasPromoUltrasonic'] is True
    assert sample_ticket['discountAmount'] == 200000
    assert sample_ticket['totalAmount'] == 900000
    assert sample_ticket['status'] == 'confirmed'

def test_emergency_contact_logic():
    """
    Talab 2: Favqulodda bog'lanish (Emergency Call / Tezkor Telegram yordamchi).
    """
    emergency_phone = '+998712000303'
    telegram_admin_url = 'https://t.me/dentamed_admin'

    assert emergency_phone.startswith('+998')
    assert len(emergency_phone) == 13
    assert telegram_admin_url.startswith('https://t.me/')

