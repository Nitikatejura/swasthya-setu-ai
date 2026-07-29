import json
import httpx
from typing import Dict, List, Any, Optional
from app.core.config import settings

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
    Multilingual AI Assistant Manager.
    Uses Google Gemini API when available, and falls back to a smart offline provider.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.provider = settings.AI_PROVIDER

    async def chat(self, messages: List[Dict[str, str]], language: str = "gu") -> Dict[str, Any]:
        """
        Processes a chat conversation and generates follow-up question or structured response.
        """
        target_lang = LANGUAGE_MAP.get(language.lower(), "Gujarati")
        if self.api_key and self.provider == "gemini":
            try:
                return await self._gemini_chat(messages, target_lang)
            except Exception as e:
                return self._offline_fallback_chat(messages, target_lang)
        else:
            return self._offline_fallback_chat(messages, target_lang)

    async def extract_symptoms_and_summary(self, conversation_text: str, language: str = "gu") -> Dict[str, Any]:
        """
        Extracts structured JSON symptom data and clinical summary.
        """
        target_lang = LANGUAGE_MAP.get(language.lower(), "Gujarati")
        if self.api_key and self.provider == "gemini":
            try:
                return await self._gemini_extract(conversation_text, target_lang)
            except Exception:
                return self._offline_fallback_extract(conversation_text, target_lang)
        else:
            return self._offline_fallback_extract(conversation_text, target_lang)

    async def _gemini_chat(self, messages: List[Dict[str, str]], language: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        
        system_instruction = (
            f"You are SwasthyaSetu AI Assistant, supporting healthcare workers in rural clinics. "
            f"ALWAYS respond strictly in {language} using native script. "
            f"Acknowledge reported symptoms intelligently without repeating questions already answered. "
            f"Ask concise clinical follow-up questions (e.g. fever, cough, chest pain, breathing difficulty, vomiting, weakness). "
            f"Do NOT diagnose or prescribe medicines."
        )

        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
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
            f"Extract structured symptom JSON from this patient conversation: '{conversation_text}'.\n"
            f"Return ONLY JSON with keys: chief_complaint (str), symptoms (list of dicts with name, duration, severity), "
            f"pregnancy_status (str), and clinical_summary (str in {language})."
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
        Smart, context-aware symptom analyzer in Gujarati, Hindi, and English.
        """
        last_user_msg = messages[-1]["content"] if messages else ""
        msg_lower = last_user_msg.lower()

        # Parse reported symptoms
        has_fever = "તાવ" in last_user_msg or "बुखार" in msg_lower or "fever" in msg_lower
        has_cough = "ઉધરસ" in last_user_msg or "ખાંસી" in last_user_msg or "खांसी" in msg_lower or "cough" in msg_lower
        has_chest_pain = "છાતી" in last_user_msg or "સીને" in msg_lower or "chest" in msg_lower
        has_breath = "શ્વાસ" in last_user_msg or "સાંસ" in msg_lower or "breath" in msg_lower
        has_days = any(num in last_user_msg for num in ["૧", "૨", "૩", "૪", "૫", "૬", "૭", "1", "2", "3", "4", "5", "6", "7", "દિવસ", "દિવસે"])

        if language == "Gujarati" or "gu" in language.lower() or "ગુજરાતી" in last_user_msg or "તાવ" in last_user_msg:
            if has_fever and has_days:
                reply = "તમારો આભાર. દર્દીને તાવની તકલીફ નોંધાઈ છે. શું દર્દીને શરદી, ઉધરસ, છાતીમાં દુખાવો કે શ્વાસ લેવામાં તકલીફ અનુભવાય છે?"
            elif has_fever:
                reply = "આભાર. દર્દીને તાવ રહે છે તે નોંધાયું છે. તાવ કેટલા દિવસથી આવે છે? અને શું દર્દીને કફ કે ઝાડા-ઊલટી છે?"
            elif has_cough:
                reply = "ઉધરસના લક્ષણો નોંધાઈ ગયા છે. ઉધરસ સુકી છે કે કફ વાળી? દર્દીને તાવ કે શ્વાસ ચડવાની તકલીફ છે?"
            elif has_chest_pain or has_breath:
                reply = "🚨 મહત્વપૂર્ણ: છાતીમાં દુખાવો અને શ્વાસની તકલીફ એ તાત્કાલિક લક્ષણો છે! શું દર્દીને પરસેવો થવો કે ચક્કર આવે છે?"
            else:
                reply = "આભાર. દર્દીના જણાવેલ લક્ષણો નોંધાઈ ગયા છે. કૃપા કરીને દર્દીને અન્ય કોઈ શારીરિક તકલીફ કે બીમારી વિશે જણાવો."

        elif language == "Hindi" or "hi" in language.lower() or "हिंदी" in last_user_msg:
            if has_fever and has_days:
                reply = "धन्यवाद। मरीज को बुखार होने की जानकारी दर्ज कर ली गई है। क्या मरीज को खांसी, सीने में दर्द या सांस लेने में परेशानी है?"
            elif has_fever:
                reply = "बुखार के लक्षण दर्ज कर लिए गए हैं। मरीज को कितने दिनों से बुखार है? क्या मरीज को सर्दी या उल्टी भी है?"
            elif has_cough:
                reply = "खांसी के लक्षण दर्ज हो गए हैं। क्या खांसी के साथ बुखार या सांस फूलने की समस्या है?"
            elif has_chest_pain or has_breath:
                reply = "🚨 महत्वपूर्ण: सीने में दर्द या सांस लेने में तकलीफ गंभीर लक्षण हैं! क्या मरीज को पसीना या चक्कर आ रहा है?"
            else:
                reply = "आपकी जानकारी दर्ज कर ली गई है। क्या मरीज को कोई अन्य लक्षण या शारीरिक परेशानी है?"

        else:
            if has_fever and has_days:
                reply = "Thank you. Fever details have been recorded. Is the patient experiencing cough, chest pain, or shortness of breath?"
            elif has_fever:
                reply = "Fever symptoms recorded. How many days has the fever persisted? Does the patient have chills or vomiting?"
            elif has_cough:
                reply = "Cough symptoms recorded. Is it a dry cough or with phlegm? Does the patient have a fever?"
            elif has_chest_pain or has_breath:
                reply = "🚨 Urgent: Chest pain and breathing difficulty require immediate assessment. Is the patient experiencing sweating or dizziness?"
            else:
                reply = "Thank you. The reported details are recorded. Are there any other symptoms or medical conditions to report?"

        return {
            "reply": reply,
            "language": language,
            "provider": "smart_offline_assistant",
            "is_offline": True
        }

    def _offline_fallback_extract(self, conversation_text: str, language: str) -> Dict[str, Any]:
        text_lower = conversation_text.lower()
        
        symptoms = []
        chief_complaint = "Reported indisposition / symptom consultation"
        
        if "fever" in text_lower or "તાવ" in conversation_text or "बुखार" in text_lower:
            chief_complaint = "Fever"
            symptoms.append({"name": "Fever (તાવ)", "duration": "Recorded", "severity": "Moderate"})
        if "cough" in text_lower or "ઉધરસ" in conversation_text or "ખાંસી" in conversation_text or "खांसी" in text_lower:
            symptoms.append({"name": "Cough (ઉધરસ)", "duration": "Recorded", "severity": "Moderate"})
        if "chest pain" in text_lower or "છાતી" in conversation_text or "સીને" in text_lower:
            chief_complaint = "Chest Pain"
            symptoms.append({"name": "Chest Pain (છાતીમાં દુખાવો)", "duration": "Acute", "severity": "Severe"})
        if "breathing" in text_lower or "શ્વાસ" in conversation_text or "સાંસ" in text_lower:
            symptoms.append({"name": "Shortness of breath (શ્વાસ લેવામાં તકલીફ)", "duration": "Acute", "severity": "Severe"})

        if not symptoms:
            symptoms.append({"name": "General Symptoms", "duration": "Recent", "severity": "Mild"})

        summary = f"Patient presented with {chief_complaint}. Symptoms include {', '.join([s['name'] for s in symptoms])}."

        return {
            "chief_complaint": chief_complaint,
            "symptoms": symptoms,
            "pregnancy_status": "Not Applicable",
            "clinical_summary": summary,
            "provider": "smart_offline_assistant",
            "is_offline": True
        }

ai_manager = AIManager()
