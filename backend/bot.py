import os
import sys
import json
import logging
from pathlib import Path
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
        f"• Ko'p filialli qulay qabul (Nukus Bosh filiali & Chilonzor filiali)\n"
        f"• Interaktiv 32-tishli 3D va anatomik jag' xaritasi\n"
        f"• Real-vaqtda bo'sh vaqtlarni band qilish (Double-booking himoyasi)\n"
        f"• Shveysariya standarti bo'yicha Raqamli Retsept (e-Prescription)\n"
        f"• Retsepshn uchun navbatsiz 4 xonali PIN-kod\n\n"
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
        "📍 <b>DentaMed Filiallari:</b>\n\n"
        "🏥 <b>1. Nukus Bosh filiali:</b>\n"
        "🏢 Toshkent sh., Mirobod t., Nukus ko'chasi, 24-uy\n"
        "🚇 Mo'ljal: Rossiya elchixonasi yonida, 204-kabinet\n"
        "🕒 Ish vaqti: 24/7 Kechayu-kunduz\n"
        "📞 Tel: +998 (71) 200-00-00\n\n"
        "🏥 <b>2. Chilonzor filiali:</b>\n"
        "🏢 Toshkent sh., Chilonzor t., Bunyodkor shox ko'chasi, 42-uy\n"
        "🚇 Mo'ljal: Novza metro bekati, Korzinka yonida\n"
        "🕒 Ish vaqti: 08:00 - 21:00 (Har kuni)\n"
        "📞 Tel: +998 (71) 200-03-03"
    )
    await message.answer(loc_text, parse_mode=ParseMode.HTML)
    await message.answer_location(latitude=41.2995, longitude=69.2401)

@dp.message(F.text == "📞 24/7 Konsultatsiya")
async def handle_contact(message: types.Message):
    contact_text = (
        "📞 <b>24/7 Tezkor Aloqa Markazi:</b>\n\n"
        "Bemorlarimiz uchun kechayu-kunduz navbatchi stomatolog va LOR-shifokor xizmat ko'rsatadi.\n\n"
        "☎️ <b>Nukus Bosh filiali:</b> +998 (71) 200-00-00\n"
        "☎️ <b>Chilonzor filiali:</b> +998 (71) 200-03-03\n"
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
        "🏥 <b>Nukus Bosh Filiali:</b>\n"
        "1. <b>Dr. Jamshid Rustamov</b>\n"
        "   • Bosh Stomatolog-Implantolog (12 yil tajriba)\n"
        "   • Shveysariya Straumann va Osstem implantlari\n\n"
        "2. <b>Dr. Shahlo Karimova</b>\n"
        "   • Ortodont — Breket & Invisalign eylayner (9 yil tajriba)\n\n"
        "🏥 <b>Chilonzor Filiali:</b>\n"
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

# ==========================================
# 3. AUTOMATED 24H & 2H REMINDER CALLBACKS
# ==========================================
@dp.callback_query(F.data.startswith("rem_confirm_"))
async def handle_reminder_confirm(callback: types.CallbackQuery):
    await callback.answer("✅ Qabulga kelishingiz tasdiqlandi!")
    appt_id = callback.data.replace("rem_confirm_", "")
    appointments_file = Path(__file__).parent / "data" / "appointments.json"
    
    updated = False
    pin_code = ""
    try:
        if appointments_file.exists():
            with open(appointments_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            for a in data:
                if a.get("id") == appt_id:
                    a["status"] = "confirmed"
                    pin_code = a.get("pinCode", "")
                    updated = True
                    break
            if updated:
                with open(appointments_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Error updating appointment status to confirmed: {e}")

    confirm_text = (
        f"✅ <b>QABULINGIZ TASDIQLANDI!</b>\n\n"
        f"Hurmatli bemor, tashrifingiz klinikamiz ro'yxatida tasdiqlandi. "
        f"Sizni belgilangan vaqtda kutamiz!\n\n"
        f"🔑 <b>Retsepshn PIN-kodingiz:</b> <code>{pin_code or 'Mavjud'}</code>\n"
        f"📍 <i>Iltimos, navbatsiz qabul uchun 5-10 daqiqa oldinroq kelishingizni so'raymiz.</i>"
    )
    try:
        await callback.message.edit_text(confirm_text, parse_mode=ParseMode.HTML)
    except Exception as e:
        logging.warning(f"Could not edit reminder message: {e}")

@dp.callback_query(F.data.startswith("rem_cancel_"))
async def handle_reminder_cancel(callback: types.CallbackQuery):
    await callback.answer("❌ Qabul bekor qilindi.")
    bot = callback.bot
    appt_id = callback.data.replace("rem_cancel_", "")
    appointments_file = Path(__file__).parent / "data" / "appointments.json"
    
    patient_name = ""
    phone = ""
    try:
        if appointments_file.exists():
            with open(appointments_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            for a in data:
                if a.get("id") == appt_id:
                    a["status"] = "cancelled"
                    patient_name = a.get("patientName", "")
                    phone = a.get("phone", "")
                    break
            with open(appointments_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logging.error(f"Error cancelling appointment: {e}")

    cancel_text = (
        f"❌ <b>QABUL BEKOR QILINDI</b>\n\n"
        f"Talon <code>#{appt_id}</code> bo'yicha qabulingiz bekor qilindi.\n\n"
        f"Agar boshqa vaqtda tashrif buyurmoqchi bo'lsangiz, quyidagi tugma orqali yangi qulay vaqtni tanlashingiz mumkin."
    )
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🔄 Yangi Qabulga Yozilish (Mini App)",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )
    try:
        await callback.message.edit_text(cancel_text, parse_mode=ParseMode.HTML, reply_markup=kb)
    except Exception as e:
        logging.warning(f"Could not edit cancel message: {e}")

    # Alert admin of cancellation
    if ADMIN_CHAT_ID and bot:
        try:
            await bot.send_message(
                chat_id=ADMIN_CHAT_ID,
                text=f"⚠️ <b>BEMOR QABULNI BEKOR QILDI!</b>\n🆔 Talon: #{appt_id}\n👤 Bemor: {patient_name}\n📞 Tel: {phone}",
                parse_mode=ParseMode.HTML
            )
        except Exception as e:
            logging.error(f"Error notifying admin of cancellation: {e}")

@dp.callback_query(F.data.startswith("rem_resched_"))
async def handle_reminder_reschedule(callback: types.CallbackQuery):
    await callback.answer("🔄 Yangi vaqt tanlash")
    appt_id = callback.data.replace("rem_resched_", "")
    resched_text = (
        f"🔄 <b>QABUL VAQTINI KO'CHIRISH</b>\n\n"
        f"Talon <code>#{appt_id}</code> bo'yicha vaqtni o'zgartirish uchun pastdagi <b>«Yangi Vaqtni Tanlash»</b> "
        f"tugmasini bosing yoki klinikamiz bilan bevosita bog'laning:\n\n"
        f"📞 <b>Aloqa:</b> +998 (71) 200-00-00\n"
        f"💬 <b>Administrator:</b> @dentamed_admin"
    )
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📅 Yangi Vaqtni Tanlash (Mini App)",
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )
    try:
        await callback.message.answer(resched_text, parse_mode=ParseMode.HTML, reply_markup=kb)
    except Exception as e:
        logging.warning(f"Could not send reschedule message: {e}")

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