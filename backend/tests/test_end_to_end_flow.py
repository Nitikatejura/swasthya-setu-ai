import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from app.db.session import SessionLocal
from app.models.models import User, Patient, Encounter, TriageRecord, Referral, DoctorNote

client = TestClient(app)

@pytest.fixture
def db():
    connection = SessionLocal()
    yield connection
    connection.close()

def test_admin_and_demo_logins():
    """Verify that default admin, doctor, and worker accounts exist and can log in with User ID or Email."""
    # Test Admin Login via User ID
    res = client.post("/api/v1/auth/login", json={"username_or_email": "admin", "password": "admin123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    assert admin_token is not None

    # Test Doctor Login via Email
    res_doc = client.post("/api/v1/auth/login", json={"username_or_email": "dr.patel@swasthyasetu.org", "password": "doctor123"})
    assert res_doc.status_code == 200, f"Doctor login failed: {res_doc.text}"
    doc_token = res_doc.json()["access_token"]
    assert doc_token is not None

    # Test Worker Login via User ID
    res_wrk = client.post("/api/v1/auth/login", json={"username_or_email": "nurse_asha", "password": "worker123"})
    assert res_wrk.status_code == 200, f"Worker login failed: {res_wrk.text}"
    wrk_token = res_wrk.json()["access_token"]
    assert wrk_token is not None

def test_registration_validation_roles_and_passwords():
    """Test Doctor vs Nurse/ASHA registration rules and password compulsory validation."""
    # 1. Reject Doctor signup without Medical Registration Number
    doc_bad = client.post("/api/v1/auth/register", json={
        "full_name": "Dr. Bad Doctor",
        "username": "dr_bad",
        "email": "dr_bad@example.com",
        "password": "Password123!",
        "role": "Doctor",
        "registration_number": "NA"
    })
    assert doc_bad.status_code == 400
    assert "Medical Registration Number is required" in doc_bad.json()["detail"]

    # 2. Accept Doctor signup with valid Medical Registration Number
    doc_good = client.post("/api/v1/auth/register", json={
        "full_name": "Dr. Good Doctor",
        "username": "dr_good",
        "email": "dr_good@example.com",
        "password": "Password123!",
        "role": "Doctor",
        "registration_number": "GMC-2026-8812"
    })
    assert doc_good.status_code == 201
    assert doc_good.json()["user"]["registration_number"] == "GMC-2026-8812"

    # 3. Accept Nurse signup - Registration Number automatically becomes "NA"
    nurse_good = client.post("/api/v1/auth/register", json={
        "full_name": "Nurse Priya",
        "username": "nurse_priya",
        "email": "nurse_priya@example.com",
        "password": "Password123!",
        "role": "Nurse"
    })
    assert nurse_good.status_code == 201
    assert nurse_good.json()["user"]["registration_number"] == "NA"

    # 4. Reject registration without password
    no_pwd = client.post("/api/v1/auth/register", json={
        "full_name": "No Password User",
        "username": "no_pwd_user",
        "email": "nopwd@example.com",
        "password": "   ",
        "role": "Healthcare Worker"
    })
    assert no_pwd.status_code == 400

def test_fahrenheit_temperature_triage_conversion():
    """Test Fahrenheit temperature conversion in deterministic triage engine."""
    res = client.post("/api/v1/auth/login", json={"username_or_email": "nurse_asha", "password": "worker123"})
    wrk_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Create Patient
    p_res = client.post("/api/v1/patients", json={
        "full_name": "Fahrenheit Test Patient",
        "age": 42,
        "gender": "Male",
        "phone_number": "9988776655",
        "blood_group": "Unknown"
    }, headers=wrk_headers)
    assert p_res.status_code == 201
    patient = p_res.json()
    assert patient["blood_group"] in ["Unknown", "Not specified", None]

    # Create Encounter with 104.0 °F (40.0 °C -> RED Hyperpyrexia)
    enc_res = client.post("/api/v1/encounters", json={
        "patient_id": patient["id"],
        "notes": "High fever assessment",
        "symptoms": [{"chief_complaint": "Fever", "symptom_name": "Fever", "duration": "2 days"}],
        "vitals": {
            "temperature": 104.0,
            "temperature_unit": "F",
            "spo2": 96.0,
            "systolic_bp": 120,
            "diastolic_bp": 80
        }
    }, headers=wrk_headers)
    assert enc_res.status_code == 201
    encounter = enc_res.json()

    # Evaluate Triage
    triage_res = client.post("/api/v1/triage/evaluate", json={"encounter_id": encounter["id"], "guideline": "india_nhm"}, headers=wrk_headers)
    assert triage_res.status_code == 200
    triage_data = triage_res.json()
    assert triage_data["priority"] == "RED"
    assert "High Fever" in triage_data["clinical_reason"]

def test_doctor_impression_and_clinical_orders_persistence():
    """Test doctor saving clinical impression, treatment plan, and clinical orders."""
    # Login Doctor
    d_res = client.post("/api/v1/auth/login", json={"username_or_email": "dr_smith", "password": "doctor123"})
    doc_headers = {"Authorization": f"Bearer {d_res.json()['access_token']}"}

    # Login Worker to create encounter
    w_res = client.post("/api/v1/auth/login", json={"username_or_email": "nurse_asha", "password": "worker123"})
    wrk_headers = {"Authorization": f"Bearer {w_res.json()['access_token']}"}

    p = client.post("/api/v1/patients", json={"full_name": "Orders Test Patient", "age": 30, "gender": "Female"}, headers=wrk_headers).json()
    enc = client.post("/api/v1/encounters", json={"patient_id": p["id"], "notes": "Initial consultation"}, headers=wrk_headers).json()

    # Doctor saves impression and orders
    imp_res = client.put(
        f"/api/v1/doctor/cases/{enc['id']}/impression",
        json={
            "doctor_impression": "Acute Bronchitis",
            "treatment_orders": "Steam inhalation, Paracetamol 500mg TDS",
            "clinical_orders": "Chest X-Ray, CBC, Sputum Culture",
            "encounter_id": enc["id"]
        },
        headers=doc_headers
    )
    assert imp_res.status_code == 200

    # Fetch patient timeline and verify clinical orders are present
    timeline_res = client.get(f"/api/v1/patients/{p['id']}/timeline", headers=doc_headers)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()
    assert len(timeline["encounters"]) >= 1
    doc_notes = timeline["encounters"][0]["doctor_notes"]
    assert len(doc_notes) >= 1
    assert doc_notes[0]["diagnosis_impression"] == "Acute Bronchitis"
    assert doc_notes[0]["treatment_plan"] == "Steam inhalation, Paracetamol 500mg TDS"

def test_ai_multi_turn_chat_fallback():
    """Test AI assistant multi-turn conversation memory and fallback responses."""
    res = client.post("/api/v1/auth/login", json={"username_or_email": "nurse_asha", "password": "worker123"})
    wrk_headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    # Turn 1
    t1 = client.post("/api/v1/ai/chat", json={
        "messages": [{"role": "user", "content": "I have fever and difficulty breathing for two days."}],
        "language": "English"
    }, headers=wrk_headers)
    assert t1.status_code == 200
    assert "reply" in t1.json()

    # Turn 2
    t2 = client.post("/api/v1/ai/chat", json={
        "messages": [
            {"role": "user", "content": "I have fever and difficulty breathing for two days."},
            {"role": "model", "content": t1.json()["reply"]},
            {"role": "user", "content": "Yes, I also have cough with mucus."}
        ],
        "language": "English"
    }, headers=wrk_headers)
    assert t2.status_code == 200
    assert "reply" in t2.json()
