import json
from typing import Dict, List, Any, Tuple
from enum import Enum

class TriagePriority(str, Enum):
    RED = "RED"
    YELLOW = "YELLOW"
    GREEN = "GREEN"

class ClinicalRuleEvaluator:
    """
    Evidence-based deterministic clinical triage evaluator for WHO and India NHM guidelines.
    Combines vitals and symptoms to compute priority (RED, YELLOW, GREEN).
    """

    @staticmethod
    def evaluate(vitals: Dict[str, Any], symptoms: List[Dict[str, Any]], chief_complaint: str = "", guideline: str = "india_nhm") -> Dict[str, Any]:
        matched_rules = []
        priority = TriagePriority.GREEN
        reasons = []
        actions = []

        chief_complaint_lower = chief_complaint.lower() if chief_complaint else ""
        all_symptom_names = [s.get("symptom_name", "").lower() for s in symptoms]
        combined_symptom_text = chief_complaint_lower + " " + " ".join(all_symptom_names)

        # -------------------------------------------------------------------
        # 1. EVALUATE RED (EMERGENCY) RULES
        # -------------------------------------------------------------------
        
        # SpO2 Check (< 90% is RED)
        spo2 = vitals.get("spo2")
        if spo2 is not None and spo2 < 90.0:
            priority = TriagePriority.RED
            matched_rules.append({
                "code": "RED_VITAL_SPO2_SEVERE",
                "title": "Severe Hypoxia (SpO2 < 90%)",
                "description": f"SpO2 recorded as {spo2}%. Indicates critical respiratory failure."
            })
            reasons.append(f"Severe Hypoxia (SpO2: {spo2}%)")
            actions.append("Administer oxygen immediately. Position patient upright and transfer urgently to nearest hospital.")

        # Respiratory Rate Check (> 30 or < 10 breaths/min is RED)
        rr = vitals.get("respiratory_rate")
        if rr is not None and (rr > 30 or rr < 10):
            priority = TriagePriority.RED
            matched_rules.append({
                "code": "RED_VITAL_RR_EXTREME",
                "title": "Severe Respiratory Distress (RR > 30 or < 10)",
                "description": f"Respiratory rate recorded as {rr} breaths/min."
            })
            reasons.append(f"Abnormal Respiratory Rate ({rr} breaths/min)")
            actions.append("Monitor airway and breathing. Prepare emergency transport.")

        # Blood Pressure Hypertensive Crisis (Systolic >= 180 or Diastolic >= 120) or Severe Shock (Systolic < 80)
        sys_bp = vitals.get("systolic_bp")
        dia_bp = vitals.get("diastolic_bp")
        if sys_bp is not None and sys_bp >= 180:
            priority = TriagePriority.RED
            matched_rules.append({
                "code": "RED_VITAL_BP_CRISIS",
                "title": "Hypertensive Crisis (Systolic BP >= 180 mmHg)",
                "description": f"Systolic BP recorded as {sys_bp} mmHg."
            })
            reasons.append(f"Hypertensive Emergency (BP: {sys_bp}/{dia_bp or '-'})")
            actions.append("Keep patient calm. Do not give oral medication without doctor guidance. Urgent referral.")

        if sys_bp is not None and sys_bp < 80:
            priority = TriagePriority.RED
            matched_rules.append({
                "code": "RED_VITAL_BP_SHOCK",
                "title": "Hypotensive Shock (Systolic BP < 80 mmHg)",
                "description": f"Systolic BP recorded as {sys_bp} mmHg."
            })
            reasons.append(f"Decompensated Shock (Systolic BP: {sys_bp} mmHg)")
            actions.append("Elevate legs, maintain warmth, establish IV access if trained, urgent referral.")

        # Severe Hypoglycemia (Blood sugar < 50 mg/dL) or Extreme Hyperglycemia (> 350 mg/dL)
        bs = vitals.get("blood_sugar")
        if bs is not None and bs < 50:
            priority = TriagePriority.RED
            matched_rules.append({
                "code": "RED_VITAL_GLUCOSE_LOW",
                "title": "Severe Hypoglycemia (Blood Sugar < 50 mg/dL)",
                "description": f"Blood sugar recorded as {bs} mg/dL."
            })
            reasons.append(f"Critical Hypoglycemia ({bs} mg/dL)")
            actions.append("Administer oral glucose/sugar if conscious, or IV dextrose under medical supervision.")

        # High Fever (Temperature > 39.5 °C or > 103.1 °F)
        temp = vitals.get("temperature")
        if temp is not None and temp > 39.5:
            priority = TriagePriority.RED
            matched_rules.append({
                "code": "RED_VITAL_HYPERPYREXIA",
                "title": "Hyperpyrexia (Temp > 39.5 °C)",
                "description": f"Body temperature recorded as {temp} °C."
            })
            reasons.append(f"High Fever ({temp} °C)")
            actions.append("Tepid sponging, administer antipyretic as per standing orders, urgent doctor review.")

        # Symptom Red Flags
        red_symptom_keywords = [
            ("chest pain", "RED_SYMPTOM_CHEST_PAIN", "Acute Chest Pain / Suspected Cardiac Event", "Immediate ECG and urgent doctor evaluation."),
            ("breathing difficulty", "RED_SYMPTOM_DYSPNEA", "Severe Shortness of Breath", "Provide oxygen support and prepare for immediate transfer."),
            ("unconscious", "RED_SYMPTOM_ALTERED_LOC", "Altered Level of Consciousness", "Check ABC (Airway, Breathing, Circulation) and position in recovery position."),
            ("seizure", "RED_SYMPTOM_SEIZURE", "Active / Recent Seizure Episode", "Ensure airway safety, protect from trauma, urgent referral."),
            ("bleed", "RED_SYMPTOM_BLEEDING", "Active Uncontrolled Bleeding", "Apply direct pressure, elevate bleeding limb, urgent transfer."),
            ("stroke", "RED_SYMPTOM_STROKE", "Suspected Stroke / Facial Droop / Weakness", "Note time of symptom onset, immediate ambulance dispatch."),
            ("pregnancy pain", "RED_SYMPTOM_PREG_RED", "Obstetric Emergency Sign", "Immediate referral to FRU (First Referral Unit) / Gynecologist.")
        ]

        for kw, code, title, act in red_symptom_keywords:
            if kw in combined_symptom_text:
                priority = TriagePriority.RED
                matched_rules.append({
                    "code": code,
                    "title": title,
                    "description": f"Red flag symptom keyword matched: '{kw}'."
                })
                reasons.append(title)
                if act not in actions:
                    actions.append(act)

        # -------------------------------------------------------------------
        # 2. EVALUATE YELLOW (OBSERVATION) RULES (If not already RED)
        # -------------------------------------------------------------------
        if priority != TriagePriority.RED:
            # SpO2 between 90% and 94%
            if spo2 is not None and 90.0 <= spo2 <= 94.0:
                priority = TriagePriority.YELLOW
                matched_rules.append({
                    "code": "YELLOW_VITAL_SPO2_MILD",
                    "title": "Moderate Hypoxia (SpO2 90-94%)",
                    "description": f"SpO2 recorded as {spo2}%."
                })
                reasons.append(f"Moderate Hypoxia (SpO2: {spo2}%)")
                actions.append("Monitor SpO2 continuously. Keep patient sitting up. Re-assess in 15 minutes.")

            # Systolic BP 140-179 or Diastolic 90-119
            if sys_bp is not None and (140 <= sys_bp < 180):
                priority = TriagePriority.YELLOW
                matched_rules.append({
                    "code": "YELLOW_VITAL_HYPERTENSION_STAGE2",
                    "title": "Stage 2 Hypertension (Systolic 140-179 mmHg)",
                    "description": f"Systolic BP recorded as {sys_bp} mmHg."
                })
                reasons.append(f"Elevated Blood Pressure ({sys_bp} mmHg)")
                actions.append("Rest patient for 10 minutes and repeat BP. Doctor consultation required.")

            # Temperature 38.0 - 39.5 °C
            if temp is not None and 38.0 <= temp <= 39.5:
                priority = TriagePriority.YELLOW
                matched_rules.append({
                    "code": "YELLOW_VITAL_FEVER",
                    "title": "Moderate Fever (38.0 - 39.5 °C)",
                    "description": f"Body temperature recorded as {temp} °C."
                })
                reasons.append(f"Moderate Fever ({temp} °C)")
                actions.append("Hydrate patient, administer paracetamol if indicated, observe for 30 minutes.")

            # Pulse Rate > 110 or < 50
            pulse = vitals.get("pulse_rate")
            if pulse is not None and (pulse > 110 or pulse < 50):
                priority = TriagePriority.YELLOW
                matched_rules.append({
                    "code": "YELLOW_VITAL_PULSE_ABNORMAL",
                    "title": "Tachycardia / Bradycardia (Pulse > 110 or < 50)",
                    "description": f"Pulse rate recorded as {pulse} bpm."
                })
                reasons.append(f"Abnormal Pulse Rate ({pulse} bpm)")
                actions.append("Recheck pulse manually for 1 full minute. Record 12-lead ECG if available.")

            # Yellow Symptom Keywords
            yellow_symptom_keywords = [
                ("vomiting", "YELLOW_SYMPTOM_VOMITING", "Persistent Vomiting / Risk of Dehydration", "Oral rehydration solution (ORS), monitor vitals."),
                ("diarrhea", "YELLOW_SYMPTOM_DIARRHEA", "Acute Diarrhea", "Start ORS and Zinc supplementation as per NHM protocol."),
                ("headache", "YELLOW_SYMPTOM_HEADACHE", "Severe Persistent Headache", "Assess neurological signs, monitor BP."),
                ("abdominal pain", "YELLOW_SYMPTOM_ABD_PAIN", "Moderate Abdominal Pain", "Palpate abdomen gently, withhold oral fluids until doctor review.")
            ]

            for kw, code, title, act in yellow_symptom_keywords:
                if kw in combined_symptom_text:
                    if priority != TriagePriority.RED:
                        priority = TriagePriority.YELLOW
                    matched_rules.append({
                        "code": code,
                        "title": title,
                        "description": f"Observation symptom keyword matched: '{kw}'."
                    })
                    reasons.append(title)
                    if act not in actions:
                        actions.append(act)

        # -------------------------------------------------------------------
        # 3. ROUTINE CARE (GREEN) DEFAULT
        # -------------------------------------------------------------------
        if priority == TriagePriority.GREEN:
            matched_rules.append({
                "code": "GREEN_ROUTINE",
                "title": "Routine Consultation / Minor Symptoms",
                "description": "Vitals within normal limits and no emergency red flag symptoms present."
            })
            reasons.append("Vitals within normal thresholds and no acute distress signs.")
            actions.append("Provide routine clinical assessment, lifestyle advice, prescribed medications, and home care instructions.")

        disclaimer = (
            "DISCLAIMER: SwasthyaSetu AI is an offline-first Clinical Decision Support System (CDSS). "
            "Triage results are deterministic recommendations based on WHO/NHM evidence guidelines and must not replace qualified medical judgment."
        )

        return {
            "priority": priority.value,
            "matched_rules": matched_rules,
            "clinical_reason": "; ".join(reasons),
            "recommended_actions": " ".join(actions),
            "guideline_used": guideline,
            "disclaimer": disclaimer
        }
