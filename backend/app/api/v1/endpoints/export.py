import io
import csv
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.api.deps import get_db, get_current_active_user
from app.models.models import Patient, Encounter, TriageRecord, Referral

router = APIRouter()

@router.get("/csv")
def export_csv(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    patients = db.query(Patient).filter(Patient.is_deleted == False).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Patient ID", "Full Name", "Age", "Gender", "Phone Number", "Blood Group", "Created At"])
    
    for p in patients:
        writer.writerow([p.patient_id, p.full_name, p.age, p.gender, p.phone_number or "", p.blood_group or "", p.created_at])
        
    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=swasthya_setu_patients.csv"}
    )

@router.get("/excel")
def export_excel(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    patients = db.query(Patient).filter(Patient.is_deleted == False).all()
    data = [
        {
            "Patient ID": p.patient_id,
            "Full Name": p.full_name,
            "Age": p.age,
            "Gender": p.gender,
            "Phone Number": p.phone_number,
            "Blood Group": p.blood_group,
            "Created At": str(p.created_at)
        } for p in patients
    ]
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Patients')
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=swasthya_setu_patients.xlsx"}
    )

@router.get("/pdf")
def export_pdf(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    patients = db.query(Patient).filter(Patient.is_deleted == False).limit(50).all()
    
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, 750, "SwasthyaSetu AI - Patient Registry Report")
    
    p.setFont("Helvetica", 10)
    y = 710
    p.drawString(100, y, "Patient ID | Name | Age | Gender | Phone")
    y -= 15
    p.line(100, y, 500, y)
    y -= 20
    
    for pat in patients:
        text = f"{pat.patient_id} | {pat.full_name[:20]} | {pat.age} | {pat.gender} | {pat.phone_number or 'N/A'}"
        p.drawString(100, y, text)
        y -= 18
        if y < 50:
            p.showPage()
            y = 750
            
    p.showPage()
    p.save()
    
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=swasthya_setu_report.pdf"}
    )
