import pytest
import shutil
import sys
from pathlib import Path
import httpx

backend_dir = Path(__file__).parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import server
import routers.clinics as r_clinics
import routers.doctors as r_doctors
import routers.appointments as r_appts
import routers.prescriptions as r_prescriptions
import routers.shifts as r_shifts

@pytest.fixture(autouse=True)
def isolate_all_data(tmp_path, monkeypatch):
    data_dir = server.DATA_DIR
    temp_data = tmp_path / "data"
    temp_data.mkdir(parents=True, exist_ok=True)

    for item in data_dir.glob("*.json"):
        shutil.copy2(item, temp_data / item.name)

    files = {
        "DB_FILE": temp_data / "appointments.json",
        "CLINICS_FILE": temp_data / "clinics.json",
        "PRESCRIPTIONS_FILE": temp_data / "prescriptions.json",
        "TENANTS_FILE": temp_data / "tenants.json",
        "DOCTOR_SCHEDULES_FILE": temp_data / "doctor_schedules.json",
        "DOCTORS_FILE": temp_data / "doctors.json",
        "SERVICES_FILE": temp_data / "services.json",
        "SHIFTS_FILE": temp_data / "shifts.json",
        "EXPENSES_FILE": temp_data / "expenses.json",
        "DEBTS_FILE": temp_data / "debts.json",
    }

    for name, path in files.items():
        if hasattr(server, name):
            monkeypatch.setattr(server, name, path)
        for mod in [r_clinics, r_doctors, r_appts, r_prescriptions, r_shifts]:
            if hasattr(mod, name):
                monkeypatch.setattr(mod, name, path)

    # Intercept outbound Telegram bot HTTP requests without breaking internal SMS logic
    orig_post = httpx.AsyncClient.post
    async def mock_http_post(self, url, *args, **kwargs):
        if "api.telegram.org" in str(url):
            class DummyResp:
                status_code = 400
                text = '{"ok": false}'
                def json(self): return {"ok": False}
            return DummyResp()
        return await orig_post(self, url, *args, **kwargs)

    monkeypatch.setattr(httpx.AsyncClient, "post", mock_http_post)
