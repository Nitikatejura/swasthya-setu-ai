import json
import httpx
from typing import Dict, List, Any, Optional
from app.core.config import settings
from app.ai.prompts import CLINICAL_CATEGORIES, get_system_prompt

LANGUAGE_MAP = {
    'gu': 'Gujarati',
    'gujarati': 'Gujarati',
    'hi': 'Hindi',
    'hindi': 'Hindi',
    'en': 'English',
    'english': 'English',
    'mr': 'Marathi',
    'marathi': 'Marathi',
    'ta': 'Tamil',
    'tamil': 'Tamil',
    'te': 'Telugu',
    'telugu': 'Telugu',
    'kn': 'Kannada',
    'kannada': 'Kannada',
    'ml': 'Malayalam',
    'malayalam': 'Malayalam',
    'pa': 'Punjabi',
    'punjabi': 'Punjabi',
    'bn': 'Bengali',
    'bengali': 'Bengali'
}

class AIManager:
    """
    Intelligent Clinical Triage Interview Assistant.
    Supports 19 medical knowledge categories, context memory, adaptive follow-ups,
    structured JSON extraction, missing info detection, and triage explanations.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.provider = settings.AI_PROVIDER

    async def chat(self, messages: List[Dict[str, str]], language: str = "gu") -> Dict[str, Any]:
        """
        Processes conversation and generates adaptive clinical follow-up questions.
        """
        target_lang = LANGUAGE_MAP.get(language.lower(), "Gujarati")
        if self.api_key and self.provider == "gemini":
            try:
                return await self._gemini_chat(messages, target_lang)
            except Exception:
                return self._offline_fallback_chat(messages, target_lang)
        else:
            return self._offline_fallback_chat(messages, target_lang)

    async def extract_symptoms_and_summary(self, conversation_text: str, language: str = "gu") -> Dict[str, Any]:
        """
        Extracts structured clinical JSON data including missing information detection.
        """
        target_lang = LANGUAGE_MAP.get(language.lower(), "Gujarati")
        if self.api_key and self.provider == "gemini":
            try:
                return await self._gemini_extract(conversation_text, target_lang)
            except Exception:
                return self._offline_fallback_extract(conversation_text, target_lang)
        else:
            return self._offline_fallback_extract(conversation_text, target_lang)

    def explain_triage_decision(self, priority: str, matched_rules: List[Dict[str, Any]], vitals: Dict[str, Any], language: str = "gu") -> str:
        """
        Generates a human-understandable clinical explanation for the deterministic triage priority.
        """
        target_lang = LANGUAGE_MAP.get(language.lower(), "Gujarati")
        rule_titles = [r.get("title", "") for r in matched_rules if r.get("title")]
        rules_summary = ", ".join(rule_titles) if rule_titles else "Vitals and reported symptoms"

        if target_lang == "Gujarati":
            if priority == "RED":
                return f"🔴 આ દર્દીનું મૂલ્યાંકન **કટોકટી (RED)** તરીકે થયું છે. મુખ્ય કારણ: {rules_summary}. દર્દીને તાત્કાલિક ઓક્સિજન, સ્થિરતા અને તબીબી સમીક્ષાની જરૂર છે."
            elif priority == "YELLOW":
                return f"🟡 આ દર્દીનું મૂલ્યાંકન **નિરીક્ષણ (YELLOW)** તરીકે થયું છે. મુખ્ય કારણ: {rules_summary}. દર્દીને ડૉક્ટર દ્વારા 30 મિનિટમાં તપાસવાની ભલામણ છે."
            else:
                return "🟢 આ દર્દીનું મૂલ્યાંકન **સામાન્ય (GREEN)** તરીકે થયું છે. વાઇટલ્સ સામાન્ય મર્યાદામાં છે અને કોઈ ઈમરજન્સી લક્ષણો નથી."
        elif target_lang == "Hindi":
            if priority == "RED":
                return f"🔴 मरीज को **आपातकालीन (RED)** प्राथमिकता दी गई है। मुख्य कारण: {rules_summary}। मरीज को तुरंत ऑक्सीजन और चिकित्सा ध्यान की आवश्यकता है।"
            elif priority == "YELLOW":
                return f"🟡 मरीज को **अवलोकन (YELLOW)** प्राथमिकता दी गई है। मुख्य कारण: {rules_summary}। डॉक्टर परामर्श आवश्यक है।"
            else:
                return "🟢 मरीज को **सामान्य (GREEN)** प्राथमिकता दी गई है। सभी वाइटल्स सामान्य हैं।"
        else:
            if priority == "RED":
                return f"🔴 Patient encounter classified as **RED Priority**. Key Findings: {rules_summary}. Requires immediate stabilization and urgent medical transfer."
            elif priority == "YELLOW":
                return f"🟡 Patient encounter classified as **YELLOW Priority**. Key Findings: {rules_summary}. Requires medical officer consultation within 30 minutes."
            else:
                return "🟢 Patient encounter classified as **GREEN Routine Care**. All recorded vitals and clinical signs are within normal limits."

    async def _gemini_chat(self, messages: List[Dict[str, str]], language: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        system_instruction = get_system_prompt(language)

        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 350}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            reply = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": reply, "language": language, "provider": "gemini"}

    async def _gemini_extract(self, conversation_text: str, language: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        prompt = (
            f"Extract structured clinical JSON from this patient conversation: '{conversation_text}'.\n"
            f"Return ONLY valid JSON with keys:\n"
            f"- chief_complaint (str)\n"
            f"- symptoms (list of dicts with keys: name, duration, severity, location, associated_symptoms)\n"
            f"- past_medical_history (str)\n"
            f"- current_medications (str)\n"
            f"- allergies (str)\n"
            f"- missing_clinical_info (list of str, e.g. ['SpO2 not recorded', 'Duration of fever missing'])\n"
            f"- emergency_warnings (list of str, e.g. ['Chest Pain - Suspected Cardiac Event'])\n"
            f"- clinical_summary (str in {language})"
        )

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned_text = raw_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_text)
            parsed["provider"] = "gemini"
            return parsed

    def _offline_fallback_chat(self, messages: List[Dict[str, str]], language: str) -> Dict[str, Any]:
        """
        Smart offline clinical interview assistant supporting adaptive, progressive multi-turn questions.
        """
        user_messages = [m["content"] for m in messages if m.get("role") == "user"]
        last_user_msg = user_messages[-1] if user_messages else ""
        full_text = " ".join(user_messages).lower()
        turn_count = len(user_messages)

        # Keyword Recognition
        has_fever = any(w in full_text for w in ["fever", "pyrexia", "તાવ", "તાપ", "बुखार", "ताप"])
        has_cough = any(w in full_text for w in ["cough", "ઉધરસ", "ખાંસી", "खांसी", "कफ"])
        has_chest_pain = any(w in full_text for w in ["chest", "heart", "છાતી", "સીને", "सीना", "दर्द"])
        has_breath = any(w in full_text for w in ["breath", "breathing", "dyspnea", "શ્વાસ", "સાંસ", "सांस"])
        has_pregnancy = any(w in full_text for w in ["preg", "pregnant", "ગર્ભ", "સગર્ભા", "गर्भवती", "गर्भ"])
        has_snake = any(w in full_text for w in ["snake", "bite", "સાપ", "સાંપ", "सांप", "डंक"])
        has_trauma = any(w in full_text for w in ["injury", "accident", "burn", "ઈજા", "ચોટ", "चोट", "जलन"])

        # Comprehensive Duration & Number Keyword Recognition
        duration_keywords = [
            "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
            "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯", "૧૦",
            "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
            "day", "days", "week", "weeks", "month", "months", "hour", "hours",
            "દિવસે", "દિવસ", "અઠવાડિયું", "મહિનો", "કલાક",
            "दिन", "हफ्ते", "महीने", "घंटे"
        ]
        has_duration = any(kw in full_text for kw in duration_keywords)

        is_gu = language == "Gujarati" or "gu" in language.lower() or "ગુજરાતી" in last_user_msg
        is_hi = language == "Hindi" or "hi" in language.lower() or "हिंदी" in last_user_msg

        # Progressive Multi-Turn Adaptive Question Routing
        if is_gu:
            if has_chest_pain or has_breath:
                reply = "🚨 ઇમરજન્સી ચેતવણી: છાતીમાં દુખાવો અથવા શ્વાસ લેવામાં તકલીફ ગંભીર હોઈ શકે છે! શું દુખાવો ડાબા હાથ કે જડબા તરફ જાય છે? કૃપા કરીને તાત્કાલિક SpO2 અને BP માપો."
            elif has_snake:
                reply = "🚨 સર્પદંશ (Snake Bite): દંશનો સમય શું હતો? શું દંશના સ્થાન પર સોજો કે લોહી નીકળે છે? દર્દીને ચાલવા ન દો અને તાત્કાલિક ડૉક્ટરનો સંપર્ક કરો."
            elif has_pregnancy:
                if not has_duration:
                    reply = "ગર્ભાવસ્થા તપાસ: ગર્ભાવસ્થાના કેટલા અઠવાડિયા થયા છે? શું બાળકનું હલનચલન અનુભવાય છે?"
                else:
                    reply = "આભાર. શું દર્દીને કોઈ લોહી નીકળવું (Bleeding), કમરનો દુખાવો કે માથાનો સખત દુખાવો છે?"
            elif has_fever:
                if not has_duration:
                    reply = "તાવના લક્ષણો નોંધાયા છે. તાવ કેટલા દિવસથી આવે છે? શું તાવ સાથે ઠંડી કે ધ્રુજારી અનુભવાય છે?"
                elif turn_count <= 2:
                    reply = "આભાર. તાવની મુદત નોંધાઈ ગઈ છે. શું દર્દીને ઉધરસ, માથાનો દુખાવો, ગળામાં દુખાવો કે ઝાડા-ઊલટી જેવી અન્ય તકલીફ છે?"
                else:
                    reply = "આભાર. દર્દીના તમામ લક્ષણો નોંધાઈ ગયા છે. શું દર્દીને ડાયાબિટીસ/બીપી જેવી કોઈ જૂની બીમારી છે? હવે કૃપા કરીને 'Next: Record Vital Signs' પર ક્લિક કરો."
            elif has_cough:
                if not has_duration:
                    reply = "ઉધરસના લક્ષણો નોંધાયા છે. ઉધરસ ક્યારથી છે? સુકી છે કે કફ સાથે?"
                else:
                    reply = "આભાર. શું ઉધરસ સાથે કફમાં લોહી, તાવ કે શ્વાસ ચડવાની તકલીફ છે?"
            elif has_trauma:
                reply = "ઈજા / બળતરા તપાસ: ઈજા કઈ રીતે થઈ? શું સક્રિય રક્તસ્રાવ છે? વાઇટલ્સ રેકોર્ડ કરવા વિનંતી."
            else:
                if turn_count == 1:
                    reply = "આભાર. દર્દીના જણાવેલ લક્ષણો નોંધાઈ ગયા છે. આ તકલીફ કેટલા સમયથી છે?"
                else:
                    reply = "આભાર. તમામ માહિતી નોંધાઈ ગઈ છે. શું દર્દીને કોઈ જૂની બીમારી (ડાયાબિટીસ/બીપી) છે કે દવાની એલર્જી છે? હવે કૃપા કરીને 'Next: Record Vital Signs' પર ક્લિક કરો."

        elif is_hi:
            if has_chest_pain or has_breath:
                reply = "🚨 आपातकालीन चेतावनी: सीने में दर्द या सांस लेने में तकलीफ गंभीर है! तुरंत SpO2 और BP रिकॉर्ड करें।"
            elif has_pregnancy:
                reply = "गर्भावस्था मूल्यांकन: कितने सप्ताह की गर्भावस्था है? क्या बच्चे की हलचल महसूस हो रही है? क्या सिरदर्द या ब्लीडिंग है?"
            elif has_fever:
                if not has_duration:
                    reply = "बुखार के लक्षण दर्ज हो गए हैं। मरीज को कितने दिनों से बुखार है? क्या ठंड या कंपकंपी महसूस होती है?"
                elif turn_count <= 2:
                    reply = "धन्यवाद। क्या मरीज को खांसी, सिरदर्द, गले में खराश या उल्टी जैसी अन्य परेशानी है?"
                else:
                    reply = "आपकी सभी जानकारी दर्ज कर ली गई है। क्या मरीज को कोई पुरानी बीमारी (डायबिटीज/बीपी) है? कृपया 'Next: Record Vital Signs' पर क्लिक करें।"
            else:
                if turn_count == 1:
                    reply = "आपकी जानकारी दर्ज कर ली गई है। यह समस्या कितने समय/दिनों से है?"
                else:
                    reply = "धन्यवाद। लक्षण दर्ज हो गए हैं। क्या मरीज को कोई पुरानी बीमारी या दवाई चल रही है? कृपया 'Next: Record Vital Signs' पर क्लिक करें।"

        else:
            # English Response Branch
            if has_chest_pain or has_breath:
                reply = "🚨 Emergency Warning: Severe chest pain or breathing difficulty detected! Immediately record SpO2, BP, and Pulse."
            elif has_pregnancy:
                if not has_duration:
                    reply = "Pregnancy Evaluation: How many weeks of pregnancy? Is fetal movement felt by the patient?"
                else:
                    reply = "Thank you. Is there any vaginal bleeding, severe headache, or swelling in feet?"
            elif has_fever:
                if not has_duration:
                    reply = "Fever recorded. How many days has the fever persisted? Are there chills or body aches?"
                elif turn_count <= 2:
                    reply = "Thank you. Duration recorded. Are there associated symptoms such as cough, headache, sore throat, or vomiting?"
                else:
                    reply = "Thank you. Complete symptom history recorded. Are there any past medical conditions (Diabetes/Hypertension)? Please proceed to 'Next: Record Vital Signs'."
            elif has_cough:
                if not has_duration:
                    reply = "Cough recorded. How many days has the cough persisted? Is it a dry cough or with phlegm?"
                else:
                    reply = "Thank you. Is there any blood in sputum, chest tightness, or fever?"
            else:
                if turn_count == 1:
                    reply = "Reported symptoms recorded. How long have these symptoms been present?"
                else:
                    reply = "Thank you. Information recorded. Does the patient have any chronic illness or current medications? Please proceed to 'Next: Record Vital Signs'."

        return {
            "reply": reply,
            "language": language,
            "provider": "clinical_interview_assistant",
            "is_offline": True
        }

    def _offline_fallback_extract(self, conversation_text: str, language: str) -> Dict[str, Any]:
        text_lower = conversation_text.lower()
        symptoms = []
        chief_complaint = "Clinical Symptom Consultation"
        emergency_warnings = []
        missing_info = []

        if "fever" in text_lower or "તાવ" in conversation_text or "बुखार" in text_lower:
            chief_complaint = "Fever / Pyrexia"
            symptoms.append({"name": "Fever (તાવ)", "duration": "Recorded", "severity": "Moderate"})
        if "cough" in text_lower or "ઉધરસ" in conversation_text or "खांसी" in text_lower:
            symptoms.append({"name": "Cough (ઉધરસ)", "duration": "Recorded", "severity": "Moderate"})
        if "chest" in text_lower or "છાતી" in conversation_text or "સીને" in text_lower:
            chief_complaint = "Chest Pain"
            symptoms.append({"name": "Chest Pain", "duration": "Acute", "severity": "Severe"})
            emergency_warnings.append("Acute Chest Pain - Suspected Cardiac Event")
        if "breath" in text_lower or "શ્વાસ" in conversation_text or "સાંસ" in text_lower:
            symptoms.append({"name": "Breathing Difficulty", "duration": "Acute", "severity": "Severe"})
            emergency_warnings.append("Respiratory Distress Sign")

        if not symptoms:
            symptoms.append({"name": "General Indisposition", "duration": "Recent", "severity": "Mild"})

        missing_info.append("Vital signs (SpO2, BP, Pulse) pending recording")

        summary = f"Patient presented with {chief_complaint}. Clinical findings: {', '.join([s['name'] for s in symptoms])}."

        return {
            "chief_complaint": chief_complaint,
            "symptoms": symptoms,
            "past_medical_history": "Not Reported",
            "current_medications": "None",
            "allergies": "None Reported",
            "missing_clinical_info": missing_info,
            "emergency_warnings": emergency_warnings,
            "clinical_summary": summary,
            "provider": "clinical_interview_assistant",
            "is_offline": True
        }

ai_manager = AIManager()
