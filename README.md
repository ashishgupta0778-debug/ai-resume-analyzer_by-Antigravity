# AI Resume Analyzer & Smart ATS Scoring System 🎯

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ashishgupta0778-debug/ai-resume-analyzer_by-Antigravity)

An intelligent, production-ready AI Resume Analyzer that parses resumes, matches them against job descriptions, computes weighted ATS candidate scores, identifies missing critical skills, and provides actionable resume optimization recommendations.

---

## ✨ Key Features

1. **Multi-Format Resume & JD Ingestion**
   - Supports **PDF** (`.pdf`), Microsoft Word (`.docx`), Plain Text (`.txt`), and Markdown (`.md`).
   - Resilient section segmentation (Summary, Work Experience, Technical Skills, Education, Projects, Certifications).
   - Automated contact detection (Candidate Name, Email, Phone, LinkedIn, GitHub).

2. **Dual-Engine ATS Matching & Scoring**
   - **45% Technical Skills Alignment**: Matches against a 1,000+ categorized skill taxonomy across Languages, Frontend, Backend, Databases, Cloud/DevOps, AI/ML, and Methodologies.
   - **25% Semantic Relevance (TF-IDF & Cosine Similarity)**: Measures textual and contextual synergy between candidate accomplishments and job responsibilities.
   - **15% Experience & Seniority Fit**: Evaluates required tenure vs detected professional years and role seniority level.
   - **15% ATS Formatting & Impact Metrics**: Scans for quantifiable metrics (`%`, `$`, numbers), strong active action verbs (e.g., *Spearheaded, Architected, Automated*), and section completeness.

3. **Critical Missing Skills Discovery**
   - **Critical Missing Skills**: Highlights high-frequency keywords and must-have tools present in the JD that are missing from the resume.
   - **Matched Skills**: Visualizes matched competencies.
   - **One-Click Copy**: Instantly copy missing skills to candidate notes or resume drafts.

4. **Recruiter Batch Ranking Leaderboard**
   - Upload 2 to 50+ resumes simultaneously.
   - Compare and rank candidates against a single job description.
   - Filter and search by candidate name, score, or specific skills.
   - Inspect individual candidate audits with one click.

5. **AI Interactive Enhancer Tools**
   - **Google XYZ Bullet Point Enhancer**: Rewrites weak bullet points into high-impact accomplishment statements (*"Accomplished [X], as measured by [Y]%, by doing [Z]"*).
   - **Tailored Interview Prep Copilot**: Generates custom technical and behavioral interview questions targeted at candidate strengths and identified skill gaps.

6. **Exportable PDF Audit Reports**
   - Generates professional, styled candidate evaluation PDF summary reports via ReportLab.

7. **Zero-Setup Local Operation & Optional Cloud AI**
   - Operates 100% offline out-of-the-box with local NLP and vector similarity without requiring any external paid API keys.
   - Seamlessly upgrades to Gemini / OpenAI if an API key is provided.

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 2. Start the Web Application
```bash
python app.py
```
Open your browser at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

---

## 💻 Command-Line Interface (CLI)

You can also run the analyzer directly in your terminal for automation or CI/CD pipelines.

### Single Resume Analysis:
```bash
python cli.py --resume ./sample_data/resumes/alex_turner_fullstack.txt --jd ./sample_data/job_descriptions/senior_fullstack_engineer.txt
```

### Export Single Analysis to PDF:
```bash
python cli.py --resume ./sample_data/resumes/alex_turner_fullstack.txt --jd ./sample_data/job_descriptions/senior_fullstack_engineer.txt --export-pdf report.pdf
```

### Batch Recruiter Ranking:
```bash
python cli.py --batch-dir ./sample_data/resumes --jd ./sample_data/job_descriptions/senior_fullstack_engineer.txt
```

---

## 📂 Project Structure

```
├── app.py                     # FastAPI application entrypoint with REST endpoints
├── cli.py                     # Terminal CLI tool for single/batch analysis
├── requirements.txt           # Project dependencies
├── backend/
│   ├── parser.py              # PDF/DOCX document parser & ATS feature extractor
│   ├── taxonomy.py            # 1,000+ skill taxonomy & ATS keyword database
│   ├── analyzer.py            # Core matching engine, scoring algorithm & recommendations
│   ├── llm_copilot.py         # Google XYZ bullet rewriter & interview question generator
│   └── pdf_generator.py       # ReportLab PDF audit report generator
├── frontend/
│   ├── index.html             # Single-Page UI with Tailwind CSS & Lucide icons
│   ├── css/style.css          # Glassmorphic styles & print stylesheets
│   └── js/app.js              # Client state, Chart.js radar charts & batch leaderboard
└── sample_data/
    ├── resumes/               # Pre-configured test resumes (Alex, Sarah, Marcus, Jordan)
    └── job_descriptions/      # Pre-configured job descriptions (Fullstack, AI, DevOps)
```

---

## 🧪 Pre-Configured Test Scenarios

Use the sample dropdown in the web UI or the sample data folder:
- **Full Stack Benchmark**: Senior Full Stack JD vs Alex Turner (`alex_turner_fullstack.txt`) -> **Strong Match (76%)**
- **AI & Data Science Benchmark**: Lead Data Scientist JD vs Sarah Chen (`sarah_chen_datascience.txt`) -> **Strong Match (72%)**
- **Cloud DevOps Benchmark**: DevOps Architect JD vs Marcus Vance (`marcus_vance_devops.txt`) -> **Strong Match (77%)**
- **Junior Gap Benchmark**: Senior Full Stack JD vs Jordan Lee (`jordan_lee_junior_dev.txt`) -> **Low Match (18%)** (Clear demonstration of missing skill identification)
