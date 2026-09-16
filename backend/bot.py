import os
import sys
import json
import logging
import tempfile
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
from aiogram.filters import CommandStart, Command, CommandObject
from aiogram.types import (
    ReplyKeyboardMarkup,
    KeyboardButton,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    MenuButtonWebApp
)
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

# Reliable .env loading
env_file = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_file)
load_dotenv()

# Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
ADMIN_CHAT_ID = os.getenv("ADMIN_CHAT_ID", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://dentamed-hospital-crm.vercel.app")
DEFAULT_TENANT_ID = os.getenv("DEFAULT_TENANT_ID", "dentamed")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

dp = Dispatcher()

DATA_DIR = Path(__file__).resolve().parent / "data"

def get_all_tenants() -> dict:
    fpath = DATA_DIR / "tenants.json"
    if fpath.exists():
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {t["id"]: t for t in data if "id" in t}
        except Exception as e:
            logging.error(f"Error loading tenants: {e}")
    return {}

def get_all_clinics() -> list:
    fpath = DATA_DIR / "clinics.json"
    if fpath.exists():
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading clinics: {e}")
    return []

def get_all_doctors() -> list:
    fpath = DATA_DIR / "doctors.json"
    if fpath.exists():
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading doctors: {e}")
    return []

def save_json_atomic(filepath: Path, data: any):
    filepath = Path(filepath)
    temp_dir = filepath.parent
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_file = tempfile.NamedTemporaryFile("w", dir=temp_dir, delete=False, encoding="utf-8")
    try:
        json.dump(data, temp_file, ensure_ascii=False, indent=2)
        temp_file.flush()
        temp_file.close()
        os.replace(temp_file.name, filepath)
    except Exception as e:
        if os.path.exists(temp_file.name):
            try:
                os.remove(temp_file.name)
            except Exception:
                pass
        raise e

# User preferences persistence: user_id -> {"tenantId": str, "clinicId": str, "updatedAt": str}
PREF_FILE = DATA_DIR / "user_preferences.json"

def load_user_preferences() -> dict:
    if PREF_FILE.exists():
        try:
            with open(PREF_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Error loading user_preferences: {e}")
    return {}

def save_user_preference(user_id: int, tenant_id: str, clinic_id: str):
    prefs = load_user_preferences()
    prefs[str(user_id)] = {
        "tenantId": tenant_id,
        "clinicId": clinic_id,
        "updatedAt": datetime.now().isoformat()
    }
    try:
        save_json_atomic(PREF_FILE, prefs)
    except Exception as e:
        logging.error(f"Error saving user preference: {e}")

def get_user_preference(user_id: int) -> dict | None:
    prefs = load_user_preferences()
    return prefs.get(str(user_id))

# User context map in memory
user_context_map: dict[int, dict] = {}

# Active preview message tracking: user_id -> [location_message_id, card_message_id]
preview_tracker: dict[int, list[int]] = {}

async def cleanup_user_preview(chat_id: int, user_id: int, bot: Bot):
    """Deletes temporary map pin and preview card messages from the chat"""
    msg_ids = preview_tracker.get(user_id, [])
    if msg_ids:
        for mid in msg_ids:
            try:
                await bot.delete_message(chat_id=chat_id, message_id=mid)
            except Exception:
                pass
        preview_tracker[user_id] = []

def get_branch_selection_keyboard(clinics: list) -> InlineKeyboardMarkup:
    """List of branches as neat clickable options (2-rasm uslubida toza tanlov)"""
    buttons = []
    for c in clinics:
        c_id = c.get("id")
        c_name = c.get("name", "Filial")
        buttons.append([
            InlineKeyboardButton(
                text=f"📍 {c_name}",
                callback_data=f"preview_branch_{c_id}"
            )
        ])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_main_keyboard(webapp_url: str, clinic_name: str = "") -> ReplyKeyboardMarkup:
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
                KeyboardButton(text="📋 Mening Qabullarim"),
                KeyboardButton(text="📍 Filial Xaritasi")
            ],
            [
                KeyboardButton(text="🔄 Filialni O'zgartirish"),
                KeyboardButton(text="📞 Aloqa Markazi")
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
async def cmd_start(message: types.Message, command: CommandObject = None):
    user_id = message.from_user.id
    user_name = message.from_user.first_name or "Hurmatli mijoz"
    
    tenants = get_all_tenants()
    clinics = get_all_clinics()

    tenant_id = DEFAULT_TENANT_ID
    clinic_id = None

    args = command.args if command else None
    if args:
        args_clean = args.strip().lower()
        found_clinic = None
        for c in clinics:
            c_id = c.get("id", "").lower()
            if args_clean in [c_id, f"branch_{c_id}", f"clinic_{c_id}", c_id.replace("dentamed-", "").replace("grandmed-", "")]:
                found_clinic = c
                break
        
        if found_clinic:
            clinic_id = found_clinic["id"]
            tenant_id = found_clinic.get("tenantId", DEFAULT_TENANT_ID)
            save_user_preference(user_id, tenant_id, clinic_id)
        elif args_clean in tenants or args_clean.replace("c_", "") in tenants:
            tenant_id = args_clean if args_clean in tenants else args_clean.replace("c_", "")

    # Check saved preference if not specified via deep link
    if not clinic_id:
        pref = get_user_preference(user_id)
        if pref and pref.get("clinicId"):
            clinic_id = pref["clinicId"]
            tenant_id = pref.get("tenantId", DEFAULT_TENANT_ID)

    user_context_map[user_id] = {"tenantId": tenant_id, "clinicId": clinic_id}

    # If clinic is chosen, show personalized welcome
    if clinic_id:
        clinic = next((c for c in clinics if c["id"] == clinic_id), None)
        if clinic:
            patient_webapp_url = f"{WEBAPP_URL}?view=patient&tenant={tenant_id}&clinic={clinic_id}"
            welcome_text = (
                f"🌿 <b>Assalomu alaykum, {user_name}!</b>\n\n"
                f"Sizning biriktirilgan filialingiz:\n"
                f"🏥 <b>{clinic.get('name')}</b>\n"
                f"🏢 <b>Manzil:</b> {clinic.get('address')}\n"
                f"🕒 <b>Ish vaqti:</b> {clinic.get('workingHours')}\n"
                f"📞 <b>Tel:</b> {clinic.get('phone')}\n\n"
                f"Pastdagi <b>«🦷 Qabulga Yozilish»</b> tugmasi orqali to'g'ridan-to'g'ri ushbu filial shifokorlariga yozilishingiz mumkin."
            )
            ikb = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="✨ 3D Jag' & Tish Xaritasi (Mini App)",
                            web_app=WebAppInfo(url=patient_webapp_url)
                        )
                    ],
                    [
                        InlineKeyboardButton(text="📍 Xaritada ko'rish", callback_data=f"show_my_map_{clinic_id}"),
                        InlineKeyboardButton(text="🔄 Filialni almashtirish", callback_data="show_branch_list")
                    ]
                ]
            )
            await message.answer(
                text=welcome_text,
                parse_mode=ParseMode.HTML,
                reply_markup=get_main_keyboard(patient_webapp_url, clinic.get('name'))
            )
            await message.answer("👇 <b>Qabulga yozilish yoki filialni o'zgartirish:</b>", reply_markup=ikb)
            return

    # If NO clinic is chosen yet: present clean branch selection list
    welcome_text = (
        f"🌿 <b>Assalomu alaykum, {user_name}!</b>\n\n"
        f"Klinikamiz rasmiy qabul botiga xush kelibsiz.\n\n"
        f"🏥 <b>Qabulga yozilish uchun o'zingizga yaqin filialni tanlang:</b>\n"
        f"<i>(Har bir filialni bosib xaritasini ko'rishingiz va o'zingizga qulayini tasdiqlashingiz mumkin)</i>"
    )
    await message.answer(
        text=welcome_text,
        parse_mode=ParseMode.HTML,
        reply_markup=get_branch_selection_keyboard(clinics)
    )

@dp.message(F.text == "📋 Mening Qabullarim")
@dp.message(Command("my_appointments"))
async def handle_my_appointments(message: types.Message):
    user_id = message.from_user.id
    db_file = Path(__file__).parent / "data" / "appointments.json"
    appts = []
    if db_file.exists():
        try:
            with open(db_file, "r", encoding="utf-8") as f:
                all_appts = json.load(f)
                appts = [
                    a for a in all_appts
                    if a.get("telegramUserId") == user_id and a.get("status") not in ["cancelled", "completed"]
                ]
        except Exception as e:
            logging.error(f"Error loading appointments: {e}")
            appts = []

    if not appts:
        empty_text = (
            "📋 <b>Sizda hozirda faol qabullar mavjud emas.</b>\n\n"
            "Yangi qabulga yozilish uchun pastdagi <b>«🦷 Qabulga Yozilish»</b> tugmasini bosing."
        )
        await message.answer(empty_text, parse_mode=ParseMode.HTML)
        return

    await message.answer(f"📋 <b>Sizning faol qabullaringiz ({len(appts)} ta):</b>", parse_mode=ParseMode.HTML)

    clinics = get_all_clinics()
    clinic_map = {c.get("id"): c.get("name", "Filial") for c in clinics}

    for a in appts:
        appt_id = a.get("id", "MED-000")
        pin = a.get("pinCode", "0000")
        doc_name = a.get("doctor", {}).get("name", "Shifokor")
        srv_title = a.get("service", {}).get("title", {}).get("uz", "Tibbiy xizmat")
        date = a.get("date", "")
        time = a.get("time", "")
        clinic_id = a.get("clinicId", "dentamed-nukus")
        clinic_label = clinic_map.get(clinic_id, "DentaMed Filiali")

        card = (
            f"🎫 <b>QABUL TALONI:</b> <code>#{appt_id}</code>\n"
            f"────────────────────────\n"
            f"🔑 <b>Retsepshnda aytiladigan kod:</b> <code>{pin}</code>\n"
            f"👨‍⚕️ <b>Shifokor:</b> {doc_name}\n"
            f"🦷 <b>Xizmat:</b> {srv_title}\n"
            f"📅 <b>Sana & Vaqt:</b> {date} soat {time}\n"
            f"🏥 <b>Filial:</b> {clinic_label}\n"
            f"────────────────────────\n"
            f"ℹ️ <i>Klinikaga kelganingizda retsepshn xodimiga <b>{pin}</b> kodini aytsangiz, sizni navbatsiz shifokor xonasiga yo'naltirishadi.</i>"
        )
        action_kb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="❌ Qabulni Bekor Qilish", callback_data=f"rem_cancel_{appt_id}"),
                    InlineKeyboardButton(text="🔄 Vaqtni Ko'chirish", callback_data=f"rem_resched_{appt_id}")
                ]
            ]
        )
        await message.answer(card, parse_mode=ParseMode.HTML, reply_markup=action_kb)

# =========================================================================
# BRANCH PREVIEW, CLEANUP, SELECTION & LOCKING WORKFLOW (Single-Bot White-Label)
# =========================================================================

@dp.callback_query(F.data.startswith("preview_branch_"))
async def handle_preview_branch(callback: types.CallbackQuery, bot: Bot):
    user_id = callback.from_user.id
    chat_id = callback.message.chat.id
    clinic_id = callback.data.replace("preview_branch_", "")

    clinics = get_all_clinics()
    clinic = next((c for c in clinics if c["id"] == clinic_id), None)
    if not clinic:
        await callback.answer("Filial ma'lumotlari topilmadi", show_alert=True)
        return

    # 1. Clean up any previous temporary map pin and card (never pollute the chat!)
    await cleanup_user_preview(chat_id, user_id, bot)

    # 2. Send Telegram Location (GPS Map Pin)
    loc = clinic.get("location", {"lat": 41.2995, "lng": 69.2401})
    loc_msg = await bot.send_location(
        chat_id=chat_id,
        latitude=loc.get("lat", 41.2995),
        longitude=loc.get("lng", 69.2401)
    )

    # 3. Send detail card with Action Buttons right below the map
    card_text = (
        f"🏥 <b>{clinic.get('name')}</b>\n"
        f"🏢 <b>Manzil:</b> {clinic.get('address')}\n"
        f"🚇 <b>Mo'ljal:</b> {clinic.get('landmark', '-')}\n"
        f"🕒 <b>Ish vaqti:</b> {clinic.get('workingHours', 'Har kuni')}\n"
        f"📞 <b>Aloqa:</b> {clinic.get('phone', '+998')}\n\n"
        f"📍 <i>Ushbu filial sizga yaqin va qulaymi?</i>"
    )
    action_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Shu yer menga yaqin (Tasdiqlash)",
                    callback_data=f"confirm_branch_{clinic_id}"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🔙 Boshqa filialni ko'rish",
                    callback_data="back_to_branches"
                ),
                InlineKeyboardButton(
                    text="❌ Bekor qilish",
                    callback_data="cancel_preview"
                )
            ]
        ]
    )
    card_msg = await callback.message.answer(card_text, parse_mode=ParseMode.HTML, reply_markup=action_kb)

    # Track message IDs to delete if user clicks Back or Cancel
    preview_tracker[user_id] = [loc_msg.message_id, card_msg.message_id]
    await callback.answer()

@dp.callback_query(F.data == "back_to_branches")
async def handle_back_to_branches(callback: types.CallbackQuery, bot: Bot):
    user_id = callback.from_user.id
    chat_id = callback.message.chat.id
    clinics = get_all_clinics()

    # Clean up map pin and card so chat remains completely clean
    await cleanup_user_preview(chat_id, user_id, bot)

    await callback.message.answer(
        text="🏥 <b>O'zingizga qulay boshqa filialni tanlang:</b>",
        parse_mode=ParseMode.HTML,
        reply_markup=get_branch_selection_keyboard(clinics)
    )
    await callback.answer()

@dp.callback_query(F.data == "cancel_preview")
async def handle_cancel_preview(callback: types.CallbackQuery, bot: Bot):
    user_id = callback.from_user.id
    chat_id = callback.message.chat.id

    # Clean up map pin and card
    await cleanup_user_preview(chat_id, user_id, bot)

    await callback.message.answer(
        text="❌ Filial tanlash bekor qilindi.\nQayta tanlash uchun pastdagi <b>«🔄 Filialni O'zgartirish»</b> tugmasini bosing.",
        parse_mode=ParseMode.HTML
    )
    await callback.answer()

@dp.callback_query(F.data.startswith("confirm_branch_"))
async def handle_confirm_branch(callback: types.CallbackQuery, bot: Bot):
    user_id = callback.from_user.id
    chat_id = callback.message.chat.id
    clinic_id = callback.data.replace("confirm_branch_", "")

    clinics = get_all_clinics()
    clinic = next((c for c in clinics if c["id"] == clinic_id), None)
    if not clinic:
        await callback.answer("Filial topilmadi", show_alert=True)
        return

    # Clean up temporary preview map & card
    await cleanup_user_preview(chat_id, user_id, bot)

    tenant_id = clinic.get("tenantId", DEFAULT_TENANT_ID)
    save_user_preference(user_id, tenant_id, clinic_id)
    user_context_map[user_id] = {"tenantId": tenant_id, "clinicId": clinic_id}

    patient_webapp_url = f"{WEBAPP_URL}?view=patient&tenant={tenant_id}&clinic={clinic_id}"

    success_text = (
        f"🎉 <b>Ajoyib tanlov! Filial muvaffaqiyatli biriktirildi.</b>\n\n"
        f"🏥 <b>Tanlangan filial:</b> {clinic.get('name')}\n"
        f"🏢 <b>Manzil:</b> {clinic.get('address')}\n"
        f"🕒 <b>Ish vaqti:</b> {clinic.get('workingHours')}\n"
        f"📞 <b>Tel:</b> {clinic.get('phone')}\n\n"
        f"✨ Endi qabulga yozilganingizda barcha xizmatlar va shifokorlar aynan shu filialga tegishli bo'ladi.\n\n"
        f"👇 <b>Qabulga yozilish uchun quyidagi tugmani bosing:</b>"
    )
    confirm_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🦷 Qabulga Yozilish (Mini App)",
                    web_app=WebAppInfo(url=patient_webapp_url)
                )
            ],
            [
                InlineKeyboardButton(
                    text="📍 Xaritada ko'rish",
                    callback_data=f"show_my_map_{clinic_id}"
                ),
                InlineKeyboardButton(
                    text="🔄 Filialni almashtirish",
                    callback_data="show_branch_list"
                )
            ]
        ]
    )

    await callback.message.answer(success_text, parse_mode=ParseMode.HTML, reply_markup=confirm_kb)
    await callback.message.answer(
        "👇 <i>Qulay menyu sizning filialingizga moslashtirildi:</i>",
        reply_markup=get_main_keyboard(patient_webapp_url, clinic.get('name'))
    )

    # Update chat menu button for this user
    try:
        await bot.set_chat_menu_button(
            chat_id=chat_id,
            menu_button=MenuButtonWebApp(
                text="🦷 Qabulga Yozilish",
                web_app=WebAppInfo(url=patient_webapp_url)
            )
        )
    except Exception as e:
        logging.warning(f"Could not update menu button: {e}")

    await callback.answer("Filial muvaffaqiyatli biriktirildi!")

@dp.message(F.text == "🔄 Filialni O'zgartirish")
@dp.message(Command("filial"))
@dp.callback_query(F.data == "show_branch_list")
async def handle_change_branch(event: types.Message | types.CallbackQuery, bot: Bot):
    chat_id = event.chat.id if isinstance(event, types.Message) else event.message.chat.id
    user_id = event.from_user.id
    clinics = get_all_clinics()

    await cleanup_user_preview(chat_id, user_id, bot)

    text = (
        "🏥 <b>Qabulga yozilish uchun o'zingizga qulay filialni tanlang:</b>\n"
        "<i>(Xaritasini ko'rish uchun filial ustiga bosing)</i>"
    )
    kb = get_branch_selection_keyboard(clinics)

    if isinstance(event, types.CallbackQuery):
        await event.message.answer(text, parse_mode=ParseMode.HTML, reply_markup=kb)
        await event.answer()
    else:
        await event.answer(text, parse_mode=ParseMode.HTML, reply_markup=kb)

@dp.message(F.text.in_(["📍 Filial Xaritasi", "📍 Lokatsiya & Manzil"]))
@dp.message(Command("location"))
async def handle_location(message: types.Message, bot: Bot):
    user_id = message.from_user.id
    pref = get_user_preference(user_id)
    clinics = get_all_clinics()

    clinic = None
    if pref and pref.get("clinicId"):
        clinic = next((c for c in clinics if c["id"] == pref["clinicId"]), None)

    if clinic:
        loc = clinic.get("location", {"lat": 41.2995, "lng": 69.2401})
        await message.answer(
            f"📍 <b>Sizning biriktirilgan filialingiz:</b>\n\n"
            f"🏥 <b>{clinic.get('name')}</b>\n"
            f"🏢 <b>Manzil:</b> {clinic.get('address')}\n"
            f"🕒 <b>Ish vaqti:</b> {clinic.get('workingHours')}\n"
            f"📞 <b>Aloqa:</b> {clinic.get('phone')}",
            parse_mode=ParseMode.HTML
        )
        await bot.send_location(
            chat_id=message.chat.id,
            latitude=loc.get("lat", 41.2995),
            longitude=loc.get("lng", 69.2401)
        )
        ikb = InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(text="🔄 Boshqa filialni tanlash", callback_data="show_branch_list")
                ]
            ]
        )
        await message.answer("Boshqa filialga o'tishni istaysizmi?", reply_markup=ikb)
    else:
        await message.answer(
            "🏥 <b>Qabulga yozilish uchun filialni tanlang:</b>",
            parse_mode=ParseMode.HTML,
            reply_markup=get_branch_selection_keyboard(clinics)
        )

@dp.callback_query(F.data.startswith("show_my_map_"))
async def callback_show_my_map(callback: types.CallbackQuery, bot: Bot):
    clinic_id = callback.data.replace("show_my_map_", "")
    clinics = get_all_clinics()
    clinic = next((c for c in clinics if c["id"] == clinic_id), None)
    if clinic and clinic.get("location"):
        loc = clinic["location"]
        await bot.send_location(
            chat_id=callback.message.chat.id,
            latitude=loc.get("lat", 41.2995),
            longitude=loc.get("lng", 69.2401)
        )
        await callback.answer()
    else:
        await callback.answer("Lokatsiya topilmadi", show_alert=True)

@dp.message(F.text.in_(["📞 Aloqa Markazi", "📞 24/7 Konsultatsiya"]))
async def handle_contact(message: types.Message):
    user_id = message.from_user.id
    ctx = user_context_map.get(user_id, {"tenantId": DEFAULT_TENANT_ID, "clinicId": None})
    tenant_id = ctx.get("tenantId", DEFAULT_TENANT_ID)

    tenants = get_all_tenants()
    clinics = get_all_clinics()
    tenant = tenants.get(tenant_id) or {"name": "Klinika", "phone": "+998 (71) 200-00-00"}
    branches = [c for c in clinics if c.get("tenantId") == tenant_id]

    contact_text = (
        f"📞 <b>{tenant.get('name')} — Tezkor Aloqa Markazi:</b>\n\n"
        "Bemorlarimiz uchun malakali shifokorlar va retsepshn xizmat ko'rsatadi.\n\n"
    )
    for b in branches:
        contact_text += f"☎️ <b>{b.get('name')}:</b> {b.get('phone', '+998')}\n"

    if tenant.get("email"):
        contact_text += f"✉️ <b>Email:</b> {tenant.get('email')}\n"
    if tenant.get("phone") and not branches:
        contact_text += f"☎️ <b>Asosiy raqam:</b> {tenant.get('phone')}\n"

    await message.answer(contact_text, parse_mode=ParseMode.HTML)

# ==========================================
# STAFF PIN RECOVERY VIA TELEGRAM
# ==========================================
@dp.message(Command("pin"))
@dp.message(F.text.in_(["🔑 Xodim PIN-kodi", "🔑 PIN-kodni olish", "PIN"]))
async def handle_request_staff_pin(message: types.Message):
    contact_kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Telefon raqamimni yuborish", request_contact=True)],
            [KeyboardButton(text="🔙 Bosh menyuga qaytish")]
        ],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    prompt_text = (
        "🔐 <b>XODIM / SHIFOKOR PIN-KODINI TIKLASH</b>\n\n"
        "Klinika CRM tizimiga kirish PIN-kodingizni olish uchun "
        "pastdagi <b>«📱 Telefon raqamimni yuborish»</b> tugmasini bosing yoki telefon raqamingizni yozib yuboring:\n\n"
        "<i>(Tizim sizning raqamingizni klinika xodimlari ro'yxatidan tekshirib, shaxsiy PIN-kodingizni taqdim etadi)</i>"
    )
    await message.answer(prompt_text, parse_mode=ParseMode.HTML, reply_markup=contact_kb)

@dp.message(F.contact)
async def handle_staff_contact_pin(message: types.Message, bot: Bot):
    user_id = message.from_user.id
    phone = message.contact.phone_number
    clean_digits = re.sub(r"\D", "", phone)

    tenants = get_all_tenants()
    clinics = get_all_clinics()

    found_info = None

    # Check Tenants (Owners)
    for t_id, t in tenants.items():
        t_digits = re.sub(r"\D", "", str(t.get("phone", "")))
        if t_digits and (clean_digits.endswith(t_digits[-9:]) or t_digits.endswith(clean_digits[-9:])):
            found_info = {
                "name": t.get("ownerName", "Klinika Rahbari"),
                "role": "👑 Klinika Rahbari (CEO)",
                "facility": t.get("name", "DentaMed"),
                "pin": t.get("ownerPin", "Mavjud")
            }
            break

    # Check Clinics (Managers / Reception)
    if not found_info:
        for c in clinics:
            c_digits = re.sub(r"\D", "", str(c.get("phone", "")))
            if c_digits and (clean_digits.endswith(c_digits[-9:]) or c_digits.endswith(clean_digits[-9:])):
                found_info = {
                    "name": c.get("managerName", "Filial Retsepshni"),
                    "role": "📍 Filial Retsepshn Xodimi",
                    "facility": c.get("name", "Filial"),
                    "pin": c.get("staffPin", "Mavjud")
                }
                break

    pref = get_user_preference(user_id)
    tenant_id = pref.get("tenantId", DEFAULT_TENANT_ID) if pref else DEFAULT_TENANT_ID
    clinic_id = pref.get("clinicId") if pref else (clinics[0]["id"] if clinics else "dentamed-nukus")
    patient_webapp_url = f"{WEBAPP_URL}?view=patient&tenant={tenant_id}&clinic={clinic_id}"
    restore_kb = get_main_keyboard(patient_webapp_url)

    if found_info:
        msg = (
            f"🎉 <b>Xush kelibsiz, {found_info['name']}!</b>\n"
            f"────────────────────────\n"
            f"💼 <b>Lavozim:</b> {found_info['role']}\n"
            f"🏥 <b>Klinika/Filial:</b> {found_info['facility']}\n\n"
            f"🔑 <b>SIZNING KIRISH PIN-KODINGIZ:</b> <code>{found_info['pin']}</code>\n"
            f"────────────────────────\n"
            f"ℹ️ <i>Ushbu PIN-kodni Web CRM portali yoki Mini App kirish oynasiga kiritishingiz mumkin. "
            f"Xavfsizlik maqsadida kodni begonalarga bermang.</i>"
        )
        await message.answer(msg, parse_mode=ParseMode.HTML, reply_markup=restore_kb)

        # Notify admin group for security audit
        if ADMIN_CHAT_ID:
            try:
                await bot.send_message(
                    chat_id=ADMIN_CHAT_ID,
                    text=f"🔔 <b>XODIM TELEGRAM ORQALI PIN-KODINI OLDIB OLDI:</b>\n👤 {found_info['name']} ({found_info['facility']})\n📞 Tel: +{clean_digits}\n🔑 PIN: {found_info['pin']}",
                    parse_mode=ParseMode.HTML
                )
            except Exception:
                pass
    else:
        msg = (
            f"⚠️ <b>Telefon raqami topilmadi (+{clean_digits})</b>\n\n"
            f"Hurmatli xodim, ushbu telefon raqami klinika xodimlari ro'yxatida mavjud emas. "
            f"Iltimos, klinika bosh shifokori yoki ma'muri bilan bog'laning:\n\n"
            f"📞 <b>Ma'muriyat:</b> +998 (71) 200-00-00\n"
            f"💬 <b>Telegram:</b> @dentamed_admin"
        )
        await message.answer(msg, parse_mode=ParseMode.HTML, reply_markup=restore_kb)

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
    user_id = callback.from_user.id
    pref = get_user_preference(user_id)
    user_clinic_id = pref.get("clinicId") if pref else None

    docs = get_all_doctors()
    clinics = get_all_clinics()
    clinic_map = {c.get("id"): c.get("name", "Filial") for c in clinics}

    if not docs:
        doctors_msg = "👨‍⚕️ Hozirda shifokorlar ro'yxati yangilanmoqda. Iltimos, Mini App orqali ko'ring."
    else:
        lines = ["👨‍⚕️ <b>Klinikamiz Yetakchi Shifokorlari:</b>\n"]
        filtered_docs = docs
        if user_clinic_id:
            matched = [
                d for d in docs
                if not d.get("clinicIds")
                or user_clinic_id in d.get("clinicIds", [])
                or d.get("clinicId") == user_clinic_id
                or d.get("branch") == user_clinic_id.replace("dentamed-", "").replace("grandmed-", "")
            ]
            if matched:
                filtered_docs = matched

        for idx, doc in enumerate(filtered_docs[:6], 1):
            name = doc.get("name", "Shifokor")
            spec_obj = doc.get("specialty", {})
            spec = spec_obj.get("uz") if isinstance(spec_obj, dict) else (spec_obj or "Mutaxassis")
            exp = doc.get("experience", 5)
            c_id = doc.get("clinicId") or (doc.get("clinicIds", [""])[0] if doc.get("clinicIds") else "")
            c_name = clinic_map.get(c_id, "")
            c_str = f" <i>({c_name})</i>" if c_name else ""
            lines.append(f"{idx}. <b>{name}</b>{c_str}\n   • {spec} • {exp} yil tajriba")

        lines.append("\n👇 <i>Qabulga yozilish uchun pastdagi tugmani bosing:</i>")
        doctors_msg = "\n".join(lines)

    patient_url = WEBAPP_URL
    if user_clinic_id and pref:
        patient_url = f"{WEBAPP_URL}?view=patient&tenant={pref.get('tenantId', DEFAULT_TENANT_ID)}&clinic={user_clinic_id}"

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🦷 Shifokorga Yozilish (Mini App)",
                    web_app=WebAppInfo(url=patient_url)
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
                save_json_atomic(appointments_file, data)
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
            save_json_atomic(appointments_file, data)
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
    user_id = callback.from_user.id
    pref = get_user_preference(user_id)
    user_clinic_id = pref.get("clinicId") if pref else None
    patient_url = WEBAPP_URL
    if user_clinic_id and pref:
        patient_url = f"{WEBAPP_URL}?view=patient&tenant={pref.get('tenantId', DEFAULT_TENANT_ID)}&clinic={user_clinic_id}"

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
                    web_app=WebAppInfo(url=patient_url)
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
    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="🦷 Qabulga Yozilish",
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        )
        print(f"✅ Telegram Chat Menu Button o'rnatildi: {WEBAPP_URL}")
    except Exception as e:
        print(f"⚠️ Chat Menu Button xatolik: {e}")

    print(f"🚀 DentaMed Telegram Boti ishga tushmoqda...")
    print(f"🔗 Ulangan WebApp URL: {WEBAPP_URL}")
    await dp.start_polling(bot)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())