# Symptom Extraction Prompt

Extract structured symptom JSON from the conversation history.

Return ONLY a valid JSON object matching this exact schema:
{
  "chief_complaint": "Primary complaint expressed by the patient",
  "symptoms": [
    {
      "name": "Symptom Name",
      "duration": "Duration (e.g., 3 days)",
      "severity": "Mild/Moderate/Severe",
      "notes": "Additional contextual details"
    }
  ],
  "pregnancy_status": "Not Pregnant / Pregnant (Trimester) / Postpartum / Unknown",
  "risk_factors": ["High blood pressure", "Diabetes", etc.]
}
