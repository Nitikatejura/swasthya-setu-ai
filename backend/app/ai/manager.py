import json
import httpx
from typing import Dict, List, Any, Optional
from app.core.config import settings

class AIManager:
    """
    Multilingual AI Assistant Manager.
    Uses Google Gemini API when available, and falls back to a structured offline mock provider.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.provider = settings.AI_PROVIDER

    async def chat(self, messages: List[Dict[str, str]], language: str = "English") -> Dict[str, Any]:
        """
        Processes a chat conversation and generates follow-up question or structured response.
        """
        if self.api_key and self.provider == "gemini":
            try:
                return await self._gemini_chat(messages, language)
            except Exception as e:
                # Graceful fallback to offline structured provider if API fails or offline
                return self._offline_fallback_chat(messages, language)
        else:
            return self._offline_fallback_chat(messages, language)

    async def extract_symptoms_and_summary(self, conversation_text: str, language: str = "English") -> Dict[str, Any]:
        """
        Extracts structured JSON symptom data and clinical summary.
        """
        if self.api_key and self.provider == "gemini":
            try:
                return await self._gemini_extract(conversation_text, language)
            except Exception:
                return self._offline_fallback_extract(conversation_text, language)
        else:
            return self._offline_fallback_extract(conversation_text, language)

    async def _gemini_chat(self, messages: List[Dict[str, str]], language: str) -> Dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
        
        system_instruction = (
            f"You are SwasthyaSetu AI Assistant, supporting healthcare workers in rural clinics. "
            f"Respond in {language}. Ask concise follow-up symptom questions. Do NOT diagnose or prescribe."
        )

        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        payload = {
            "contents": contents,
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 300}
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
            f"pregnancy_status (str), and clinical_summary (str)."
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
        Offline fallback questionnaire responses in Gujarati, Hindi, and English.
        """
        last_user_msg = messages[-1]["content"] if messages else ""
        
        # Gujarati translations fallback
        if language.lower() == "gujarati" or "ગુજરાતી" in last_user_msg:
            reply = (
                "તમારી માહિતી નોંધાઈ ગઈ છે. દર્દીને કેટલા દિવસથી તકલીફ છે? "
                "અને શું દર્દીને તાવ, શ્વાસ લેવામાં તકલીફ કે છાતીમાં દુખાવો છે?"
            )
        elif language.lower() == "hindi" or "हिंदी" in last_user_msg:
            reply = (
                "आपकी जानकारी दर्ज कर ली गई है। मरीज को यह समस्या कितने दिनों से है? "
                "क्या मरीज को बुखार, सांस लेने में तकलीफ या सीने में दर्द है?"
            )
        else:
            reply = (
                "Thank you for providing the details. How many days has the patient had these symptoms? "
                "Are they experiencing fever, difficulty breathing, or chest pain?"
            )

        return {
            "reply": reply,
            "language": language,
            "provider": "offline_fallback",
            "is_offline": True
        }

    def _offline_fallback_extract(self, conversation_text: str, language: str) -> Dict[str, Any]:
        text_lower = conversation_text.lower()
        
        symptoms = []
        chief_complaint = "Reported indisposition / symptom consultation"
        
        if "fever" in text_lower or "તાવ" in text_lower or "बुखार" in text_lower:
            chief_complaint = "Fever"
            symptoms.append({"name": "Fever", "duration": "2-3 days", "severity": "Moderate"})
        if "cough" in text_lower or "ઉધરસ" in text_lower or "खांसी" in text_lower:
            symptoms.append({"name": "Cough", "duration": "3 days", "severity": "Moderate"})
        if "chest pain" in text_lower or "છાતીમાં દુખાવો" in text_lower:
            chief_complaint = "Chest Pain"
            symptoms.append({"name": "Chest Pain", "duration": "Acute", "severity": "Severe"})
        if "breathing" in text_lower or "શ્વાસ" in text_lower:
            symptoms.append({"name": "Shortness of breath", "duration": "Acute", "severity": "Severe"})

        if not symptoms:
            symptoms.append({"name": "General Malaise", "duration": "Recent", "severity": "Mild"})

        summary = f"Patient presented with {chief_complaint}. Recorded symptoms include {', '.join([s['name'] for s in symptoms])}."

        return {
            "chief_complaint": chief_complaint,
            "symptoms": symptoms,
            "pregnancy_status": "Unknown",
            "clinical_summary": summary,
            "provider": "offline_fallback",
            "is_offline": True
        }

ai_manager = AIManager()
