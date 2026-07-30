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
            parsed = json.loads(raw_text)
            parsed["provider"] = "gemini"
            return parsed

    def _offline_fallback_chat(self, messages: List[Dict[str, str]], language: str) -> Dict[str, Any]:
        """
        Smart offline clinical interview assistant supporting adaptive questions.
        """
        last_user_msg = messages[-1]["content"] if messages else ""
        msg_lower = last_user_msg.lower()

        # Context detection across conversation history
        full_text = " ".join([m["content"] for m in messages]).lower()
        
        has_fever = "તાવ" in full_text or "बुखार" in full_text or "fever" in full_text
        has_cough = "ઉધરસ" in full_text or "ખાંસી" in full_text or "खांसी" in full_text or "cough" in full_text
        has_chest_pain = "છાતી" in full_text or "સીને" in full_text or "chest" in full_text
        has_breath = "શ્વાસ" in full_text or "સાંસ" in full_text or "breath" in full_text
        has_pregnancy = "ગર્ભ" in full_text or "गर्भवती" in full_text or "pregnant" in full_text
        has_snake = "સાપ" in full_text or "સાંપ" in full_text or "snake" in full_text
        has_trauma = "ઈજા" in full_text or "ચોટ" in full_text or "accident" in full_text or "burn" in full_text
        has_days = any(num in last_user_msg for num in ["૧", "૨", "૩", "૪", "૫", "૬", "૭", "1", "2", "3", "4", "5", "6", "7", "દિવસ", "દિવસે"])

        if language == "Gujarati" or "gu" in language.lower() or "ગુજરાતી" in last_user_msg:
            if has_chest_pain or has_breath:
                reply = "🚨 ઇમરજન્સી ચેતવણી: છાતીમાં દુખાવો અથવા શ્વાસ લેવામાં તકલીફ ગંભીર હોઈ શકે છે! શું દુખાવો ડાબા હાથ કે જડબા તરફ જાય છે? કૃપા કરીને તાત્કાલિક SpO2 અને BP માપો."
            elif has_snake:
                reply = "🚨 સર્પદંશ (Snake Bite): દંશનો સમય શું હતો? શું દંશના સ્થાન પર સોજો કે લોહી નીકળે છે? દર્દીને ચાલવા ન દો અને તાત્કાલિક ડૉક્ટરનો સંપર્ક કરો."
            elif has_pregnancy:
                reply = "ગર્ભાવસ્થા તપાસ: ગર્ભાવસ્થાના કેટલા અઠવાડિયા થયા છે? શું બાળકનું હલનચલન અનુભવાય છે? શું બ્લીડિંગ, કમરનો દુખાવો કે માથાનો સખત દુખાવો છે?"
            elif has_fever and not has_days:
                reply = "તાવના લક્ષણો નોંધાયા છે. તાવ કેટલા દિવસથી આવે છે? શું તાવ સાથે ઠંડી કે ધ્રુજારી અનુભવાય છે?"
            elif has_fever and has_days:
                reply = "આભાર. દર્દીને તાવની માહિતી નોંધાઈ છે. શું દર્દીને શરદી, ઉધરસ, માથાનો દુખાવો કે ઝાડા-ઊલટી જેવી અન્ય તકલીફ છે?"
            elif has_cough:
                reply = "ઉધરસના લક્ષણો નોંધાયા છે. ઉધરસ ક્યારથી છે? સુકી છે કે કફ સાથે? શું કફમાં લોહી દેખાય છે?"
            elif has_trauma:
                reply = "ઈજા / બળતરા તપાસ: ઈજા કઈ રીતે થઈ? શું સક્રિય રક્તસ્રાવ છે? વાઇટલ્સ રેકોર્ડ કરવા વિનંતી."
            else:
                reply = "આભાર. દર્દીના જણાવેલ લક્ષણો નોંધાઈ ગયા છે. શું દર્દીને કોઈ જૂની બીમારી (ડાયાબિટીસ/બીપી) છે કે કોઈ દવાઓ ચાલુ છે?"

        elif language == "Hindi" or "hi" in language.lower() or "हिंदी" in last_user_msg:
            if has_chest_pain or has_breath:
                reply = "🚨 आपातकालीन चेतावनी: सीने में दर्द या सांस लेने में तकलीफ गंभीर है! तुरंत SpO2 और BP रिकॉर्ड करें।"
            elif has_pregnancy:
                reply = "गर्भावस्था मूल्यांकन: कितने सप्ताह की गर्भावस्था है? क्या बच्चे की हलचल महसूस हो रही है? क्या सिरदर्द या ब्लीडिंग है?"
            elif has_fever:
                reply = "बुखार के लक्षण दर्ज हो गए हैं। मरीज को कितने दिनों से बुखार है? क्या ठंड या कंपकंपी महसूस होती है?"
            else:
                reply = "आपकी जानकारी दर्ज कर ली गई है। क्या मरीज को कोई पुरानी बीमारी (डायबिटीज/बीपी) या अन्य लक्षण हैं?"

        else:
            if has_chest_pain or has_breath:
                reply = "🚨 Emergency Warning: Chest pain or breathing difficulty detected. Immediately record SpO2, BP, and Pulse."
            elif has_pregnancy:
                reply = "Pregnancy Evaluation: How many weeks of pregnancy? Is fetal movement present? Any bleeding or severe headache?"
            elif has_fever:
                reply = "Fever recorded. How many days has the fever persisted? Are there chills, cough, or body aches?"
            else:
                reply = "Thank you. Reported details recorded. Are there any past medical conditions (Diabetes/Hypertension) or current medications?"

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
