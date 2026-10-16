"""
Automated Test Suite for AI Resume Analyzer.
Verifies parsing, matching engine, ATS scoring, missing skills detection,
AI copilot features, PDF generation, and FastAPI endpoints.
"""

import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from starlette.testclient import TestClient
from backend.parser import DocumentParser, ResumeFeatureExtractor
from backend.analyzer import ResumeAnalyzer
from backend.llm_copilot import AICopilot
from backend.pdf_generator import PDFReportGenerator
from app import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_samples_endpoint():
    res = client.get("/api/samples")
    assert res.status_code == 200
    data = res.json()
    assert "job_descriptions" in data
    assert "resumes" in data
    assert "senior_fullstack_engineer" in data["job_descriptions"]
    assert "alex_turner_fullstack" in data["resumes"]

def test_single_analysis():
    jd_path = Path("sample_data/job_descriptions/senior_fullstack_engineer.txt")
    res_path = Path("sample_data/resumes/alex_turner_fullstack.txt")
    
    jd_text = jd_path.read_text(encoding="utf-8")
    res_text = res_path.read_text(encoding="utf-8")

    response = client.post(
        "/api/analyze",
        data={
            "resume_text": res_text,
            "jd_text": jd_text
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["overall_score"] > 60
    assert "scores" in data
    assert "skills_analysis" in data
    assert len(data["skills_analysis"]["matched_skills"]) > 10
    assert len(data["skills_analysis"]["missing_skills"]) > 0
    assert "critical_missing_skills" in data["skills_analysis"]

def test_bullet_enhancer():
    res = client.post(
        "/api/ai/enhance-bullet",
        json={
            "bullet": "built backend with fastapi and postgresql",
            "target_skill": "FastAPI"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["variations"]) >= 3

def test_interview_prep():
    res = client.post(
        "/api/ai/interview-prep",
        json={
            "matched_skills": ["Python", "FastAPI"],
            "missing_skills": ["Kubernetes"],
            "candidate_name": "Alex"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert len(data["questions"]) >= 3

def test_pdf_report_generation():
    jd_text = Path("sample_data/job_descriptions/senior_fullstack_engineer.txt").read_text(encoding="utf-8")
    res_text = Path("sample_data/resumes/alex_turner_fullstack.txt").read_text(encoding="utf-8")
    analysis = ResumeAnalyzer.match_resume_to_job(res_text, jd_text, filename="alex.txt")
    
    pdf_bytes = PDFReportGenerator.generate_report(analysis)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print("Running tests...")
    test_health_endpoint()
    print("[PASS] Health endpoint passed")
    test_samples_endpoint()
    print("[PASS] Samples endpoint passed")
    test_single_analysis()
    print("[PASS] Single analysis passed")
    test_bullet_enhancer()
    print("[PASS] Bullet enhancer passed")
    test_interview_prep()
    print("[PASS] Interview prep passed")
    test_pdf_report_generation()
    print("[PASS] PDF report generation passed")
    print("\nAll automated tests passed successfully!")
