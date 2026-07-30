"""
SwasthyaSetu AI - Clinical Triage Prompt Templates & Category Guidelines
Provides structured prompt templates for common rural medical scenarios.
"""

CLINICAL_CATEGORIES = {
    "fever": {
        "title": "Fever Assessment",
        "key_questions": ["Duration of fever", "Highest recorded temp", "Chills or rigor", "Body pain / headache", "Cough / cold", "Recent travel history", "Medications taken"],
        "red_flags": ["Temperature > 39.5°C", "Altered consciousness", "Severe headache with neck stiffness", "Petechial rash"]
    },
    "chest_pain": {
        "title": "Chest Pain Assessment",
        "key_questions": ["Onset and duration", "Pain severity (1-10)", "Radiation to arm/jaw/back", "Shortness of breath", "Profuse sweating", "History of heart disease"],
        "red_flags": ["Severe crushing chest pain", "Radiation to left arm/jaw", "Diaphoresis", "Hypotension"]
    },
    "pregnancy": {
        "title": "Obstetric & Pregnancy Assessment",
        "key_questions": ["Gestational age (weeks)", "Fetal movement presence", "Vaginal bleeding or fluid leak", "Severe headache / blurry vision", "Facial or limb swelling"],
        "red_flags": ["Vaginal bleeding", "Eclampsia signs (convulsions/headache)", "Absent fetal movement"]
    },
    "breathing_difficulty": {
        "title": "Respiratory Distress Assessment",
        "key_questions": ["Onset (acute or gradual)", "Stridor or wheezing", "Inability to speak full sentences", "Cyanosis (bluish lips)", "History of asthma/COPD"],
        "red_flags": ["SpO2 < 90%", "Respiratory rate > 30", "Cyanosis", "Inability to speak"]
    },
    "diarrhea_vomiting": {
        "title": "Gastroenteritis & Dehydration",
        "key_questions": ["Frequency of stools/vomiting", "Presence of blood or mucus", "Sunken eyes / dry mouth", "Urine output in last 8 hours", "Ability to drink fluids"],
        "red_flags": ["Severe dehydration", "Rice-water stools", "Blood in stool (dysentery)", "No urine output > 8 hours"]
    },
    "abdominal_pain": {
        "title": "Abdominal Pain Assessment",
        "key_questions": ["Exact location of pain", "Pain type (cramping, sharp, dull)", "Relation to meals", "Fever or vomiting", "Last bowel movement"],
        "red_flags": ["Rigid board-like abdomen", "Severe localized right lower quadrant pain", "High fever"]
    },
    "child_illness": {
        "title": "Pediatric Assessment (IMNCI Protocol)",
        "key_questions": ["Child age", "Ability to drink/breastfeed", "Vomiting everything", "Lethargy or unconsciousness", "Chest in-drawing"],
        "red_flags": ["Inability to drink", "Vomiting everything", "Convulsions", "Lethargic / unconscious"]
    },
    "snake_bite": {
        "title": "Envenomation / Snake Bite",
        "key_questions": ["Time of bite", "Location of bite mark", "Fang marks visible", "Local swelling or bleeding", "Ptosis (drooping eyelids) or difficulty swallowing"],
        "red_flags": ["Rapidly spreading swelling", "Ptosis / neurotoxicity", "Active bleeding from bite site"]
    },
    "trauma_burns": {
        "title": "Trauma & Burns",
        "key_questions": ["Mechanism of injury", "Percentage of body surface burned", "Location of burn (face/hands/perineum)", "Active bleeding", "Deformity or bone exposure"],
        "red_flags": ["Burns > 20% surface area", "Inhalation injury (facial burns)", "Severe uncontrolled hemorrhage"]
    },
    "stroke_warning": {
        "title": "Acute Stroke Assessment (FAST)",
        "key_questions": ["Facial droop", "Arm weakness / numbness", "Speech difficulty (slurred speech)", "Time of onset"],
        "red_flags": ["Sudden hemiparesis", "Slurred speech", "Sudden severe headache"]
    },
    "mental_health": {
        "title": "Mental Health & Distress Screening",
        "key_questions": ["Duration of low mood / anxiety", "Sleep disturbances", "Loss of interest in daily tasks", "Self-harm or suicidal thoughts"],
        "red_flags": ["Active suicidal ideation", "Acute psychotic agitation"]
    }
}

def get_system_prompt(language_name: str) -> str:
    return f"""You are SwasthyaSetu AI Assistant, an expert, empathetic Clinical Triage Assistant for rural healthcare workers (ASHA/ANM/Nurse).

STRICT MANDATES & SAFETY GUARDRAILS:
1. ALWAYS respond in {language_name} using its native script (Gujarati for Gujarati, Hindi for Hindi, English for English).
2. ADAPTIVE CONVERSATION: Dynamically ask relevant clinical follow-up questions based on the patient's reported symptoms.
3. CONTEXT MEMORY: Remember all details provided earlier in the conversation. NEVER ask questions that have already been answered.
4. DO NOT DIAGNOSE DISEASES: Never declare a definitive medical diagnosis.
5. DO NOT PRESCRIBE MEDICINES: Never prescribe drugs, antibiotics, or dosages.
6. DO NOT ASSIGN TRIAGE COLOR: Never tell the user "This is RED/YELLOW/GREEN priority". Triage priority is calculated 100% deterministically by the clinical rule engine.
7. EMERGENCY RECOGNITION: If the patient presents red flag emergency symptoms (chest pain, stroke, unconsciousness, severe breathing difficulty, profuse bleeding), immediately urge the healthcare worker to record vital signs (SpO2, BP, Pulse) and run the triage engine.
8. ALWAYS maintain a simple, supportive tone suitable for rural healthcare workers.
"""
