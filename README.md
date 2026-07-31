# SwasthyaSetu AI: Edge-Native Hybrid AI Clinical Decision Support System (CDSS) 🩺⚡

> **"Standardized, Multilingual AI-Powered Medical Triage for Every Rural Village."**

SwasthyaSetu AI is an offline-first, edge-native Clinical Decision Support System (CDSS) engineered specifically for frontline healthcare workers (ASHA workers, ANMs, Nurses, and Medical Officers) operating in low-resource, network-constrained rural Primary Health Centers across India.

---

## 🌟 Key Capabilities & Features

* **Vernacular Voice AI Assistant**: Voice-guided symptom intake supporting **Gujarati, Hindi, and English** with dynamic multi-turn conversation context memory and a **120-second live voice recording countdown timer** (`00:45 / 02:00`).
* **Deterministic Evidence-Based Triage**: Evaluates patient vitals and chief complaints against **World Health Organization (WHO) ETAT** and **Government of India National Health Mission (NHM)** guidelines to classify urgency into 🔴 **RED (Emergency)**, 🟡 **YELLOW (Observation)**, and 🟢 **GREEN (Routine)** with **zero AI hallucinations**.
* **Body Temperature Normalization**: Accepts temperature input in Fahrenheit (°F) with explicit unit tracking (`temperature_unit: "F"`) and automatically converts $C = (F - 32) \times 5 / 9$ before clinical rule comparison.
* **100% Offline-Native Resilience**: Built on **Dexie.js (IndexedDB)** client-side storage. Full patient registration, intake, search, and triage run without internet connection.
* **Priority Micro-JSON Sync Protocol**: When internet is restored, the sync engine prioritizes 🔴 **RED Emergency Cases** first over compressed payloads ($< 2\text{ KB}$).
* **Dual-Mode Patient Search**: Instant patient lookup operating seamlessly both **Online** (backend REST API) and **Offline** (IndexedDB querying by Patient ID, Name, Phone, or Village).
* **Doctor Review Queue & Clinical Orders**: Instant emergency alert popups on the Doctor Dashboard. Physicians enter structured Diagnosis Impressions, Treatment Plans, and **Clinical Orders** directly into patient digital timelines.
* **QR-Coded Emergency Referral Passes**: Generates printable referral passes with embedded QR codes for emergency transfer to tertiary hospitals.

---

## 🏗️ System Architecture

```
                                SWASTHYASETU AI ARCHITECTURE
                                
       FRONT-LINE MOBILE EDGE DEVICE                    CENTRALIZED CLOUD BACKEND
+------------------------------------------+    +------------------------------------------+
|  Next.js 14 Responsive PWA Interface     |    |  FastAPI Microservices (Python 3.11)     |
|  AI4Bharat IndicWhisper Vernacular STT   |    |  Google Gemini 1.5 Flash REST API        |
|  Quantized Gemma 3 1B SLM (MediaPipe)    |    |  SQLAlchemy ORM + PostgreSQL / SQLite    |
|  Deterministic WHO & NHM Triage Engine   |    |  Real-Time Doctor Alert Queue & Alarms   |
|  Dexie IndexedDB Client Storage          |    |  Alembic Schema Evolution Control        |
+------------------------------------------+    +------------------------------------------+
                    │                                                ▲
                    │        Micro-JSON Sync (< 2 KB)               │
                    └────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Frameworks

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI Framework** | Next.js 14 (App Router, React 18, TypeScript) |
| **Styling & Motion** | TailwindCSS, Framer Motion, Lucide Icons |
| **Client Storage & Offline Sync** | Dexie.js (IndexedDB), Custom Sync Queue Hook |
| **Backend API Framework** | FastAPI (Python 3.11), Uvicorn |
| **Database & ORM** | SQLite / PostgreSQL, SQLAlchemy 2.0 |
| **Database Migrations** | Alembic Revision Control |
| **Edge AI Engine** | Quantized Google Gemma 3 1B SLM (MediaPipe LLM Inference) |
| **Cloud AI Integration** | Google Gemini 1.5 Flash REST API |
| **Speech-to-Text (STT)** | Web Speech API + AI4Bharat IndicWhisper |
| **Testing Suite** | Pytest Automated End-to-End Test Suite |

---

## 🚀 Quick Start & Local Installation

### Prerequisites
* **Node.js**: v18.0 or higher
* **Python**: v3.11 or higher
* **Git**

---

### 1. Clone Repository & Setup Backend

```bash
# Clone the repository
git clone https://github.com/YourRepo/SwasthyaSetu.git
cd SwasthyaSetu/swasthya-setu-ai/backend

# Create and activate Python Virtual Environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install Backend Dependencies
pip install -r requirements.txt

# Run Database Migrations
alembic upgrade head

# Start FastAPI Backend Server
python main.py
```
Backend API will be live on: `http://localhost:8000` (Swagger UI: `http://localhost:8000/docs`)

---

### 2. Setup & Run Frontend

Open a new terminal window:

```bash
cd SwasthyaSetu/swasthya-setu-ai/frontend

# Install Frontend Dependencies
npm install

# Start Next.js Development Server
npm run dev
```
Frontend Web App will be live on: `http://localhost:3000`

---

## 🧪 Running Automated End-to-End Tests

The repository includes a comprehensive 5-suite Pytest suite validating registration rules, dual login, Fahrenheit triage conversion, clinical order persistence, and AI multi-turn memory:

```bash
# Run test suite from the backend directory
venv\Scripts\python.exe -m pytest backend/tests/test_end_to_end_flow.py -v
```

---

## 🔐 Default Demo Credentials

| Role | User ID or Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | User approvals, role management, facility configuration, CSV export |
| **Doctor** | `dr_smith` / `dr.patel@swasthyasetu.org` | `doctor123` | Emergency RED alert queue, patient timeline review, clinical orders entry |
| **Healthcare Worker / ASHA** | `nurse_asha` | `worker123` | Patient registration, vernacular voice intake, vitals entry, triage |

---

## 👥 Project Team & Credits

Developed for the **Maverick Effect AI Challenge** by:
* **Mayank Rajput** (Computer Engineering)
* **Nitika Tejura** (Computer Engineering)
* **Jahanvi Yadav** (Information Technology)
* **Rutvi Khunt** (Computer Engineering)
* **Sneha Patel** (Computer Engineering)

*Saffrony Institute of Technology | Gujarat Technological University (GTU)*

---
*SwasthyaSetu AI © 2026. Empowering Rural Healthcare via Intelligent Technology.*
