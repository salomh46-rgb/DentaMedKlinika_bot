import os
import sys
import json
import logging
from datetime import datetime
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo
)
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

load_dotenv()

# Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_BOT_TOKEN_HERE")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "http://localhost:5173/")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

dp = Dispatcher()

def get_main_keyboard(webapp_url: str) -> ReplyKeyboardMarkup:
    """Bottom persistent menu with WebApp button"""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="🦷 Qabulga Yozilish (Mini App)",
                    web_app=WebAppInfo(url=webapp_url)
                )
            ],
            [
                KeyboardButton(text="📍 Lokatsiya & Manzil"),
                KeyboardButton(text="📞 24/7 Konsultatsiya")
            ]
        ],
        resize_keyboard=True,
        is_persistent=True
    )

def get_inline_menu(webapp_url: str) -> InlineKeyboardMarkup:
    """Inline greeting banner with quick webapp launch"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✨ 3D Jag' & Tish Xaritasi (Mini App)",
                    web_app=WebAppInfo(url=webapp_url)
                )
            ],
            [
                InlineKeyboardButton(text="👨‍⚕️ Shifokorlarimiz", callback_data="view_doctors"),
                InlineKeyboardButton(text="🎁 50% Kross-Aksiya", callback_data="view_promo")
            ]
        ]
    )

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_name = message.from_user.first_name or "Hurmatli mijoz"
    
    welcome_text = (
        f"🌿 <b>Assalomu alaykum, {user_name}!</b>\n\n"
        f"<b>DentaMed Atelier</b> — Shveysariya standartidagi Stomatologiya va LOR markazining rasmiy botiga xush kelibsiz.\n\n"
        f"💎 <b>Bizning imkoniyatlar:</b>\n"
        f"• Interaktiv 32-tishli 3D va anatomik jag' xaritasi\n"
        f"• Shifokor va bo'sh qabul vaqtini 30 soniyada tanlash\n"
        f"• Stomatologiya ko'rigidan o'tganga LOR ko'rigi uchun 50% imtiyoz\n"
        f"• Retsepshn uchun maxsus navbatsiz 4 xonali PIN-kod\n\n"
        f"Pastdagi <b>«🦷 Qabulga Yozilish»</b> tugmasini bosib, qabulga yozilishingiz mumkin."
    )
    
    await message.answer(
        text=welcome_text,
        parse_mode=ParseMode.HTML,
        reply_markup=get_main_keyboard(WEBAPP_URL)
    )
    
    # Inline launch card
    await message.answer(
        text="👇 <b>Qabulga yozilish uchun Mini Appni oching:</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=get_inline_menu(WEBAPP_URL)
    )

@dp.message(F.text == "📍 Lokatsiya & Manzil")
async def handle_location(message: types.Message):
    loc_text = (
        "📍 <b>DentaMed Shveysariya Klinikasi Manzili:</b>\n\n"
        "🏢 Toshkent shahar, Mirobod tumani, Nukus ko'chasi, 24-uy\n"
        "🕒 <b>Ish vaqti:</b> 24/7 (Kechasi ham shoshilinch qabul mavjud)\n"
        "🚇 <b>Mo'ljal:</b> Rossiya elchixonasi yonida\n"
        "📞 <b>Telefon:</b> +998 (71) 200-00-00"
    )
    await message.answer(loc_text, parse_mode=ParseMode.HTML)
    await message.answer_location(latitude=41.2995, longitude=69.2401)

@dp.message(F.text == "📞 24/7 Konsultatsiya")
async def handle_contact(message: types.Message):
    contact_text = (
        "📞 <b>24/7 Tezkor Aloqa Markazi:</b>\n\n"
        "Bemorlarimiz uchun kechayu-kunduz navbatchi stomatolog va LOR-shifokor xizmat ko'rsatadi.\n\n"
        "☎️ <b>Qo'ng'iroq uchun:</b> +998 (71) 200-00-00\n"
        "💬 <b>Telegram Admin:</b> @dentamed_admin\n"
        "🌐 <b>Veb-sayt:</b> https://dentamed.uz"
    )
    await message.answer(contact_text, parse_mode=ParseMode.HTML)

# Handle Data received from Telegram Mini App (sendData)
@dp.message(F.web_app_data)
async def handle_webapp_data(message: types.Message, bot: Bot):
    try:
        raw_data = message.web_app_data.data
        data = json.loads(raw_data)
        
        appointment_id = data.get("id", "MED-000000")
        pin_code = data.get("pinCode", "0000")
        patient_name = data.get("patientName", "Noma'lum")
        phone = data.get("phone", "+998")
        doctor = data.get("doctor", {})
        doc_name = doctor.get("name", "Shifokor")
        doc_spec = doctor.get("specialty", {}).get("uz", "Mutaxassis")
        service = data.get("service", {})
        service_title = service.get("title", {}).get("uz", "Tibbiy xizmat")
        service_price = service.get("price", 0)
        date = data.get("date", "")
        time = data.get("time", "")
        notes = data.get("notes", "Yo'q")
        
        # 1. Send confirmation ticket to the patient
        patient_receipt = (
            f"🎉 <b>QABULINGIZ MUVAFFAQIYATLI TASDIQLANDI!</b>\n"
            f"────────────────────────\n"
            f"🎫 <b>Qabul Taloni:</b> #{appointment_id}\n"
            f"🔑 <b>Retsepshnda aytiladigan kod:</b> <code>{pin_code}</code>\n\n"
            f"👨‍⚕️ <b>Shifokor:</b> {doc_name} ({doc_spec})\n"
            f"🦷 <b>Xizmat:</b> {service_title}\n"
            f"📅 <b>Sana & Vaqt:</b> {date} soat {time}\n"
            f"💰 <b>Narxi:</b> {service_price:,} so'm\n"
            f"────────────────────────\n"
            f"ℹ️ <i>Klinikamizga kelganingizda retsepshn xodimiga <b>{pin_code}</b> kodini aytsangiz, sizni navbatsiz shifokor xonasiga yo'naltirishadi.</i>"
        )
        
        await message.answer(patient_receipt, parse_mode=ParseMode.HTML)
        
        # 2. Forward to Clinic Admin / Doctors Group if ADMIN_CHAT_ID is set
        if ADMIN_CHAT_ID:
            admin_card = (
                f"🚨 <b>YANGI BEMOR QABULGA YOZILDI!</b>\n"
                f"────────────────────────\n"
                f"🆔 <b>Talon:</b> #{appointment_id}\n"
                f"👤 <b>Bemor:</b> {patient_name}\n"
                f"📞 <b>Telefon:</b> {phone}\n"
                f"👨‍⚕️ <b>Shifokor:</b> {doc_name}\n"
                f"🦷 <b>Xizmat:</b> {service_title}\n"
                f"📅 <b>Vaqti:</b> {date} • {time}\n"
                f"🔑 <b>PIN-kod:</b> {pin_code}\n"
                f"💬 <b>Bemor shikoyati:</b> {notes}\n"
                f"────────────────────────"
            )
            
            admin_kb = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(text="✅ Qabul qilindi", callback_data=f"adm_ok_{appointment_id}"),
                        InlineKeyboardButton(text="📞 Qo'ng'iroq qilindi", callback_data=f"adm_call_{appointment_id}")
                    ]
                ]
            )
            
            await bot.send_message(
                chat_id=ADMIN_CHAT_ID,
                text=admin_card,
                parse_mode=ParseMode.HTML,
                reply_markup=admin_kb
            )
            
    except Exception as e:
        logging.error(f"Error handling web_app_data: {e}")
        await message.answer("⚠️ Qabul ma'lumotlarini qayta ishlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.")

@dp.callback_query(F.data == "view_doctors")
async def handle_view_doctors(callback: types.CallbackQuery):
    await callback.answer()
    doctors_msg = (
        "👨‍⚕️ <b>DentaMed Yetakchi Shifokorlari:</b>\n\n"
        "1. <b>Dr. Jamshid Rustamov</b>\n"
        "   • Bosh Stomatolog-Implantolog (12 yil tajriba)\n"
        "   • Shveysariya Straumann va Janubiy Koreya Osstem implantlari\n\n"
        "2. <b>Dr. Shahlo Karimova</b>\n"
        "   • Ortodont — Breket & Invisalign eylayner (9 yil tajriba)\n\n"
        "3. <b>Dr. Bobur Mahmudov</b>\n"
        "   • Oliy toifali LOR-Jarroh (15 yil tajriba)\n"
        "   • Gaymorit va burun bitishini endoskopik davolash\n\n"
        "4. <b>Dr. Dilnoza Alimova</b>\n"
        "   • Bolalar LOR shifokori & Audiolog (8 yil tajriba)\n\n"
        "👇 <i>Qabulga yozilish uchun pastdagi tugmani bosing:</i>"
    )
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🦷 Shifokorga Yozilish (Mini App)",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )
    await callback.message.answer(doctors_msg, parse_mode=ParseMode.HTML, reply_markup=kb)

@dp.callback_query(F.data == "view_promo")
async def handle_view_promo(callback: types.CallbackQuery):
    await callback.answer()
    promo_msg = (
        "🎁 <b>Eksklyuziv Kross-Imtiyoz: 50% Chegirma!</b>\n\n"
        "🌿 <b>Shveysariya tibbiy protokoli:</b> Gaymorit va tish kanallari o'zaro bevosita bog'langan.\n\n"
        "DentaMed'da <b>stomatolog ko'rigidan o'tgan har bir bemorga</b> LOR shifokorining to'liq endoskopik tekshiruvi uchun <b>50% imtiyoz</b> taqdim etiladi!\n\n"
        "💡 <i>Ushbu aksiya orqali ikkala muammoni bitta klinikada kompleks hal qilishingiz mumkin.</i>"
    )
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✨ Imtiyoz Bilan Yozilish (Mini App)",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )
    await callback.message.answer(promo_msg, parse_mode=ParseMode.HTML, reply_markup=kb)

@dp.callback_query(F.data.startswith("adm_"))
async def handle_admin_action(callback: types.CallbackQuery):
    action = callback.data
    if action.startswith("adm_ok_"):
        await callback.answer("✅ Qabul tasdiqlandi!")
        await callback.message.edit_reply_markup(
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [InlineKeyboardButton(text="🟢 Shifokor kutmoqda", callback_data="none")]
                ]
            )
        )
    elif action.startswith("adm_call_"):
        await callback.answer("📞 Bemor bilan bog'lanildi deb belgilandi!")

async def main():
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE" or not BOT_TOKEN:
        print("\n" + "="*60)
        print("ℹ️  DIQQAT: backend/.env faylida BOT_TOKEN kiritilishi kerak.")
        print("Telegram @BotFather dan yangi bot ochib, tokenini yozasiz.")
        print("="*60 + "\n")
        return
        
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    print(f"🚀 DentaMed Telegram Boti ishga tushmoqda...")
    print(f"🔗 Ulangan WebApp URL: {WEBAPP_URL}")
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
