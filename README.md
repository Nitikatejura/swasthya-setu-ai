# SwasthyaSetu AI - Rural Healthcare Clinical Decision Support System (CDSS)

> **"AI-Powered Rural Healthcare Triage for Every Village."**

SwasthyaSetu AI is an offline-first, AI-assisted Clinical Decision Support System designed for rural clinics, ASHA workers, nurses, and medical officers across India.

---

## Key Features

- **Offline-First Architecture**: Functions completely without internet using Dexie.js (IndexedDB). Data automatically synchronizes with central PostgreSQL when connectivity is restored.
- **Multilingual Gujarati Voice AI Assistant**: Voice-guided symptom collection supporting Gujarati (Primary), Hindi, English, and 7 regional languages via Web Speech STT/TTS and Gemini AI API with offline fallback.
- **Evidence-Based Rule Engine**: Deterministic clinical triage evaluating WHO & India National Health Mission (NHM) guidelines to classify patients into 🔴 RED (Emergency), 🟡 YELLOW (Observation), and 🟢 GREEN (Routine).
- **Doctor Emergency Alerts**: Real-time popup alerts and audio notifications for RED triage cases on the Doctor Dashboard.
- **Digital QR Referrals**: Generates printable A4 referral forms with embedded QR codes for emergency transfer to First Referral Units (FRUs).
- **Administrative Analytics & Reports**: Interactive Recharts dashboards with downloadable PDF, CSV, and Excel reports.
- **Enterprise Security & Compliance**: Argon2id password hashing, short-lived JWTs, AES sensitive field protection, and immutable audit logs.

---

## Quick Start & Running Locally

### Option A: Running with Docker Compose (Recommended)

```bash
docker-compose up --build
```

Access services:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Reverse Proxy**: [http://localhost](http://localhost)

---

### Option B: Running Development Servers Locally

#### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
Backend will start on [http://localhost:8000](http://localhost:8000).

#### 2. Frontend Setup (Next.js 15)
```bash
cd frontend
npm install
npm run dev
```
Frontend will start on [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

| Role | Username | Password | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | User creation, role management, hospital setup, analytics export |
| **Doctor** | `dr_smith` | `doctor123` | Emergency RED alert popup, case timeline review, clinical notes |
| **Healthcare Worker** | `nurse_asha` | `worker123` | Patient registration, Gujarati voice symptom chat, vitals entry, triage |

---

## System Architecture & Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Dexie.js (IndexedDB), Web Speech API, Recharts, PWA Service Worker.
- **Backend**: FastAPI, Python 3.11, SQLAlchemy 2.0, Alembic, Pydantic v2, Argon2id, PyJWT, ReportLab, Pandas, OpenPyXL.
- **Deployment**: Docker, Docker Compose, Nginx, PostgreSQL, GitHub Actions.

---

## Hackathon Submission Assets & Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Database ER Diagram](docs/ERD.md)
- [API Documentation](http://localhost:8000/docs)

*Developed for Rural Healthcare Empowerment in India.*
