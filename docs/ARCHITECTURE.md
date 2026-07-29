# SwasthyaSetu AI - System Architecture

SwasthyaSetu AI is an offline-first Clinical Decision Support System (CDSS) designed for rural healthcare settings in India.

## High-Level System Architecture

```[ERD.md](ERD.md)
                                  ┌───────────────────────────┐
                                  │   Web Speech API STT/TTS  │
                                  └─────────────┬─────────────┘
                                                │
┌───────────────────────────────────────────────▼───────────────────────────────────────────────┐
│                                FRONTEND (Next.js 15 + TypeScript)                              │
│                                                                                               │
│  ┌───────────────────────┐   ┌───────────────────────────────┐   ┌─────────────────────────┐  │
│  │   UI Components       │   │  Dexie.js (IndexedDB Store)   │   │  Sync Queue Service     │  │
│  │  (Tailwind + Lucide)  │   │  Patients / Encounters        │   │  Conflict Resolution    │  │
│  └───────────────────────┘   └───────────────────────────────┘   └────────────┬────────────┘  │
└───────────────────────────────────────────────────────────────────────────────┼───────────────┘
                                                                                │
                                                            HTTP / JSON (REST)  │ (When Online)
                                                                                │
┌───────────────────────────────────────────────────────────────────────────────▼───────────────┐
│                                BACKEND (FastAPI + Python 3.11)                                │
│                                                                                               │
│  ┌───────────────────────┐   ┌───────────────────────────────┐   ┌─────────────────────────┐  │
│  │  Argon2id + JWT Auth  │   │  Rule-Based Triage Engine     │   │  Multilingual AI Provider│  │
│  │  Role-Based Access    │   │  (WHO & NHM Guidelines)       │   │  (Gemini + Offline Mock)│  │
│  └───────────────────────┘   └───────────────────────────────┘   └─────────────────────────┘  │
└───────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                                │
                                  ┌─────────────▼─────────────┐
                                  │   SQLAlchemy 2.0 ORM      │
                                  │  (SQLite / PostgreSQL)    │
                                  └───────────────────────────┘
```

## Core Modules & Data Flow

1. **Multilingual AI Assistant**: Collects symptoms conversationally in Gujarati (Primary), Hindi, or English via Web Speech API (STT/TTS). Extracted symptoms are converted into structured JSON without diagnosing diseases or overriding rule-based priority.
2. **Deterministic Rule Engine**: Combines recorded vital signs (SpO2, Blood Pressure, Temp, Pulse, Resp Rate) and symptoms against evidence-based WHO & India National Health Mission (NHM) rules to classify cases into 🔴 RED (Emergency), 🟡 YELLOW (Observation), and 🟢 GREEN (Routine).
3. **Doctor Emergency Alerts**: When a 🔴 RED triage is generated, an instant full-screen alert modal is triggered on the Doctor Dashboard.
4. **Offline Synchronization**: All operations are saved locally to Dexie.js IndexedDB. The background sync worker queues operations chronologically, retries uploads when internet returns, and prompts conflict resolution if needed.
5. **Printable QR Referrals**: Generates digital QR referral documents for emergency transfers to higher facilities (First Referral Units / District Hospitals).
