"""
FastAPI Server for AI Resume Analyzer.
Exposes REST endpoints for single resume analysis, batch recruiter ranking,
PDF report generation, AI bullet enhancement, and sample data loading.
"""

import os
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, Response, JSONResponse
from pydantic import BaseModel

from backend.parser import DocumentParser
from backend.analyzer import ResumeAnalyzer
from backend.llm_copilot import AICopilot
from backend.pdf_generator import PDFReportGenerator

BASE_DIR = Path(__file__).resolve().parent
SAMPLE_DIR = BASE_DIR / "sample_data"
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="AI Resume Analyzer API",
    description="Intelligent ATS resume matching, candidate scoring, and missing skills discovery",
    version="2.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class BulletEnhanceRequest(BaseModel):
    bullet: str
    target_skill: Optional[str] = None
    api_key: Optional[str] = None

class InterviewPrepRequest(BaseModel):
    matched_skills: List[str]
    missing_skills: List[str]
    candidate_name: Optional[str] = "Candidate"

class AnalysisDataModel(BaseModel):
    analysis: dict

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AI Resume Analyzer"}

@app.get("/api/samples")
def get_sample_library():
    """Returns available sample resumes and job descriptions for 1-click loading."""
    samples = {
        "job_descriptions": {},
        "resumes": {}
    }
    
    jd_dir = SAMPLE_DIR / "job_descriptions"
    if jd_dir.exists():
        for f in jd_dir.glob("*.txt"):
            key = f.stem
            samples["job_descriptions"][key] = {
                "title": key.replace("_", " ").title(),
                "content": f.read_text(encoding="utf-8", errors="ignore")
            }

    resume_dir = SAMPLE_DIR / "resumes"
    if resume_dir.exists():
        for f in resume_dir.glob("*.txt"):
            key = f.stem
            samples["resumes"][key] = {
                "title": key.replace("_", " ").title(),
                "content": f.read_text(encoding="utf-8", errors="ignore")
            }

    return samples

@app.post("/api/analyze")
async def analyze_single_resume(
    resume_file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None)
):
    """Analyzes a single resume against a job description."""
    # 1. Parse Resume
    clean_resume_text = ""
    filename = "Pasted Resume"
    
    if resume_file:
        filename = resume_file.filename
        content = await resume_file.read()
        clean_resume_text = DocumentParser.parse_file(content, filename)
    elif resume_text and resume_text.strip():
        clean_resume_text = resume_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please upload a resume file or paste resume text.")

    # 2. Parse Job Description
    clean_jd_text = ""
    if jd_file:
        jd_content = await jd_file.read()
        clean_jd_text = DocumentParser.parse_file(jd_content, jd_file.filename)
    elif jd_text and jd_text.strip():
        clean_jd_text = jd_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please provide a job description (file or text).")

    if len(clean_resume_text) < 50:
        raise HTTPException(status_code=400, detail="Extracted resume text is too short or empty. Please check the file.")
    if len(clean_jd_text) < 50:
        raise HTTPException(status_code=400, detail="Extracted job description is too short or empty.")

    # 3. Analyze
    result = ResumeAnalyzer.match_resume_to_job(clean_resume_text, clean_jd_text, filename=filename)
    return result

@app.post("/api/batch-analyze")
async def analyze_batch_resumes(
    resumes: List[UploadFile] = File(...),
    jd_file: Optional[UploadFile] = File(None),
    jd_text: Optional[str] = Form(None)
):
    """Analyzes multiple resumes against a single job description for recruiter ranking."""
    clean_jd_text = ""
    if jd_file:
        jd_content = await jd_file.read()
        clean_jd_text = DocumentParser.parse_file(jd_content, jd_file.filename)
    elif jd_text and jd_text.strip():
        clean_jd_text = jd_text.strip()
    else:
        raise HTTPException(status_code=400, detail="Please provide a job description.")

    if not resumes:
        raise HTTPException(status_code=400, detail="No resume files uploaded.")

    results = []
    for r_file in resumes:
        try:
            content = await r_file.read()
            r_text = DocumentParser.parse_file(content, r_file.filename)
            if len(r_text) >= 50:
                analysis = ResumeAnalyzer.match_resume_to_job(r_text, clean_jd_text, filename=r_file.filename)
                results.append(analysis)
        except Exception as e:
            # Continue on individual file failure
            results.append({
                "candidate_name": r_file.filename,
                "filename": r_file.filename,
                "overall_score": 0.0,
                "fit_tier": "Error",
                "tier_color": "rose",
                "verdict": f"Parsing Error: {str(e)}",
                "scores": {"overall": 0, "skills_score": 0, "semantic_score": 0, "experience_score": 0, "ats_formatting_score": 0},
                "skills_analysis": {"matched_skills": [], "missing_skills": [], "critical_missing_skills": []},
                "suggestions": []
            })

    # Sort leaderboard by overall score descending
    results.sort(key=lambda x: x.get("overall_score", 0), reverse=True)
    return {"candidates": results, "total": len(results)}

@app.post("/api/export-pdf")
def export_pdf_report(payload: AnalysisDataModel):
    """Generates and returns an audit evaluation PDF report."""
    analysis = payload.analysis
    if not analysis:
        raise HTTPException(status_code=400, detail="Missing analysis payload.")
    
    pdf_bytes = PDFReportGenerator.generate_report(analysis)
    cand_name = analysis.get("candidate_name", "candidate").replace(" ", "_")
    filename = f"Resume_Analysis_{cand_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.post("/api/ai/enhance-bullet")
def enhance_bullet(req: BulletEnhanceRequest):
    """Rewrites a resume bullet point into high-impact Google XYZ format."""
    if not req.bullet.strip():
        raise HTTPException(status_code=400, detail="Bullet text cannot be empty.")
    result = AICopilot.enhance_bullet_point(req.bullet, req.target_skill, req.api_key)
    return result

@app.post("/api/ai/interview-prep")
def interview_prep(req: InterviewPrepRequest):
    """Generates customized interview questions tailored to matched & missing skills."""
    questions = AICopilot.generate_interview_prep(req.matched_skills, req.missing_skills, req.candidate_name)
    return {"questions": questions}

# Mount static frontend files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/", response_class=HTMLResponse)
    def serve_index():
        index_file = FRONTEND_DIR / "index.html"
        if index_file.exists():
            return index_file.read_text(encoding="utf-8")
        return "Frontend under construction."

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app:app", host=host, port=port, reload=False)
