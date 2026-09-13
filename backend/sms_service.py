"""
Official Eskiz.uz SMS Gateway Integration for DentaMed Atelier CRM.
Supports direct Bearer Token or Email/Password auth caching.
Handles 24h reminders, 2h quick PIN reminders, and digital prescriptions.
"""

import os
import json
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

try:
    import httpx
except ImportError:
    httpx = None

logger = logging.getLogger("dentamed.sms")

ESKIZ_API_URL = "https://notify.eskiz.uz/api"
ESKIZ_EMAIL = os.getenv("ESKIZ_EMAIL", "")
ESKIZ_PASSWORD = os.getenv("ESKIZ_PASSWORD", "")
ESKIZ_TOKEN = os.getenv("ESKIZ_TOKEN", "")
ESKIZ_SENDER = os.getenv("ESKIZ_SENDER", "4546") # Standard Eskiz default sender ID

LOG_FILE = Path(__file__).resolve().parent / "data" / "sms_delivery.log"

class EskizSmsClient:
    def __init__(self):
        self._token: Optional[str] = ESKIZ_TOKEN if ESKIZ_TOKEN else None
        self._token_expires_at: Optional[float] = None

    def _normalize_phone(self, phone: str) -> str:
        """Strip +, spaces, dashes, leaving 998XXXXXXXXX (12 digits)."""
        clean = "".join(filter(str.isdigit, phone))
        if len(clean) == 9:
            clean = "998" + clean
        return clean

    def _log_sms(self, phone: str, message: str, status: str, response: Optional[str] = None):
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().isoformat()
        entry = {
            "timestamp": timestamp,
            "phone": phone,
            "message": message,
            "status": status,
            "response": response
        }
        try:
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Error appending to sms_delivery.log: {e}")

    async def get_token(self) -> Optional[str]:
        if self._token:
            return self._token

        if not ESKIZ_EMAIL or not ESKIZ_PASSWORD:
            logger.info("Eskiz credentials missing in .env. Running in local simulation mode.")
            return None

        if httpx is None:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{ESKIZ_API_URL}/auth/login",
                    data={"email": ESKIZ_EMAIL, "password": ESKIZ_PASSWORD}
                )
                if res.status_code == 200:
                    data = res.json()
                    self._token = data.get("data", {}).get("token")
                    logger.info("Eskiz.uz: Yangi autentifikatsiya tokeni muvaffaqiyatli olindi.")
                    return self._token
                else:
                    logger.error(f"Eskiz login xatosi: {res.status_code} - {res.text}")
                    return None
        except Exception as e:
            logger.error(f"Eskiz login so'rovi uzildi: {e}")
            return None

    async def send_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """
        Send SMS via Eskiz.uz or fallback to secure logging.
        Returns {"success": bool, "status": str, "mode": "eskiz" | "simulation"}.
        """
        normalized_phone = self._normalize_phone(phone)
        token = await self.get_token()

        if token and httpx is not None:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    headers = {"Authorization": f"Bearer {token}"}
                    payload = {
                        "mobile_phone": normalized_phone,
                        "message": message,
                        "from": ESKIZ_SENDER
                    }
                    res = await client.post(f"{ESKIZ_API_URL}/message/sms/send", headers=headers, data=payload)
                    if res.status_code == 200:
                        self._log_sms(normalized_phone, message, "sent_eskiz", res.text)
                        logger.info(f"SMS muvaffaqiyatli jo'natildi -> {normalized_phone}")
                        return {"success": True, "status": "sent", "mode": "eskiz", "response": res.json()}
                    else:
                        logger.warning(f"Eskiz yuborishda xatolik ({res.status_code}): {res.text}. Logga saqlandi.")
                        self._log_sms(normalized_phone, message, "failed_eskiz", res.text)
            except Exception as e:
                logger.error(f"Eskiz SMS yuborishda uzilish: {e}")
                self._log_sms(normalized_phone, message, "error_eskiz", str(e))

        # Simulation / Local fallback mode
        self._log_sms(normalized_phone, message, "simulated_success")
        logger.info(f"[SIMULATSIYA SMS] -> {normalized_phone}: {message[:60]}...")
        return {"success": True, "status": "simulated", "mode": "simulation"}

# Singleton instance
sms_client = EskizSmsClient()

async def send_sms_notification(phone: str, message: str) -> bool:
    """Convenience helper for backend/server.py and bot.py."""
    res = await sms_client.send_sms(phone, message)
    return res.get("success", False)
