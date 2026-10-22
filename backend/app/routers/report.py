import io
from fastapi import APIRouter, Body
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from app.ml.report_generator import generate_report

router = APIRouter(prefix="/api/report", tags=["Automated Intelligence Report"])


@router.post("/generate")
async def generate(payload: dict = Body(...)):
    """
    Accepts a combined JSON body of already-fetched module results, e.g.:
    {
      "target": "example.com",
      "domain": { ...response from /api/domain/{domain}... },
      "ip": { ...response from /api/ip/{ip}... },
      "vehicle": { ...response from /api/vehicle/{plate}... },
      "username": { ...response from /api/username/{username}... }
    }
    Any of the module keys may be omitted.
    """
    return generate_report(payload)


@router.post("/pdf")
async def generate_pdf(payload: dict = Body(...)):
    report = generate_report(payload)

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 2 * cm
    y = height - margin

    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin, y, "OSINT-X Investigation Report")
    y -= 1 * cm

    c.setFont("Helvetica", 10)
    for line in report["narrative_summary"].split("\n"):
        if y < margin:
            c.showPage()
            y = height - margin
            c.setFont("Helvetica", 10)
        c.drawString(margin, y, line[:110])
        y -= 0.55 * cm

    c.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=osint_x_report.pdf"},
    )
