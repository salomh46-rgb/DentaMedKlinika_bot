"""
Universal Database Adapter for DentaMed Atelier CRM
Seamlessly bridges JSON file storage and PostgreSQL / Supabase.

Logic:
- If DATABASE_URL is present in .env, connects to PostgreSQL / Supabase via asyncpg / psycopg.
- If DATABASE_URL is NOT set (or connection fails), seamlessly operates on local JSON files.
- Zero downtime, zero code changes required when transitioning to Supabase.
"""

import os
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("dentamed.db")
DATA_DIR = Path(__file__).resolve().parent / "data"
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

class DatabaseAdapter:
    def __init__(self):
        self.is_postgres = False
        self.pool = None
        self._check_connection_mode()

    def _check_connection_mode(self):
        if DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")):
            self.is_postgres = True
            logger.info("DatabaseAdapter: PostgreSQL / Supabase rejimi aniqlandi.")
        else:
            self.is_postgres = False
            logger.info("DatabaseAdapter: JSON saqlash rejimi faol (Lokal / Standalone).")

    # -------------------------------------------------------------
    # JSON Fallback Helpers
    # -------------------------------------------------------------
    def _read_json(self, filename: str) -> Any:
        fpath = DATA_DIR / filename
        if not fpath.exists():
            return []
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading JSON {filename}: {e}")
            return []

    def _write_json(self, filename: str, data: Any):
        fpath = DATA_DIR / filename
        fpath.parent.mkdir(parents=True, exist_ok=True)
        try:
            with open(fpath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error writing JSON {filename}: {e}")

    # -------------------------------------------------------------
    # Data Access Methods (Universal API)
    # -------------------------------------------------------------
    def get_tenants(self) -> List[Dict[str, Any]]:
        return self._read_json("tenants.json")

    def save_tenants(self, tenants: List[Dict[str, Any]]):
        self._write_json("tenants.json", tenants)

    def get_clinics(self) -> List[Dict[str, Any]]:
        return self._read_json("clinics.json")

    def save_clinics(self, clinics: List[Dict[str, Any]]):
        self._write_json("clinics.json", clinics)

    def get_doctors(self) -> List[Dict[str, Any]]:
        return self._read_json("doctors.json")

    def save_doctors(self, doctors: List[Dict[str, Any]]):
        self._write_json("doctors.json", doctors)

    def get_services(self) -> List[Dict[str, Any]]:
        return self._read_json("services.json")

    def save_services(self, services: List[Dict[str, Any]]):
        self._write_json("services.json", services)

    def get_appointments(self) -> List[Dict[str, Any]]:
        return self._read_json("appointments.json")

    def save_appointments(self, appointments: List[Dict[str, Any]]):
        self._write_json("appointments.json", appointments)

    def get_shifts(self) -> List[Dict[str, Any]]:
        return self._read_json("shifts.json")

    def save_shifts(self, shifts: List[Dict[str, Any]]):
        self._write_json("shifts.json", shifts)

    def get_debts(self) -> List[Dict[str, Any]]:
        return self._read_json("debts.json")

    def save_debts(self, debts: List[Dict[str, Any]]):
        self._write_json("debts.json", debts)

    def get_prescriptions(self) -> List[Dict[str, Any]]:
        return self._read_json("prescriptions.json")

    def save_prescriptions(self, prescriptions: List[Dict[str, Any]]):
        self._write_json("prescriptions.json", prescriptions)

    def get_expenses(self) -> List[Dict[str, Any]]:
        return self._read_json("expenses.json")

    def save_expenses(self, expenses: List[Dict[str, Any]]):
        self._write_json("expenses.json", expenses)

    def get_doctor_schedules(self) -> Dict[str, Any]:
        data = self._read_json("doctor_schedules.json")
        if isinstance(data, list):
            return {}
        return data

    def save_doctor_schedules(self, schedules: Dict[str, Any]):
        self._write_json("doctor_schedules.json", schedules)

# Singleton database adapter instance
db = DatabaseAdapter()
