"""
Command-Line Interface (CLI) for AI Resume Analyzer.
Supports single resume analysis, batch recruiter ranking, and report export.
"""

import os
import sys
import argparse
import json
from pathlib import Path

from backend.parser import DocumentParser
from backend.analyzer import ResumeAnalyzer
from backend.pdf_generator import PDFReportGenerator

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def format_terminal_output(result: dict) -> None:
    """Prints a clean, beautiful report to terminal."""
    cand = result.get("candidate_name", "Candidate")
    fname = result.get("filename", "Resume")
    overall = result.get("overall_score", 0)
    tier = result.get("fit_tier", "")
    verdict = result.get("verdict", "")
    scores = result.get("scores", {})
    skills = result.get("skills_analysis", {})

    divider = "=" * 70
    subdivider = "-" * 70

    print("\n" + divider)
    print(f"  AI RESUME ANALYZER REPORT: {cand.upper()}")
    print(f"  Source File: {fname}")
    print(divider)
    print(f"  OVERALL MATCH SCORE : {overall}% [{tier}]")
    print(f"  RECRUITER VERDICT   : {verdict}")
    print(subdivider)
    print("  SCORE BREAKDOWN:")
    print(f"    * Technical Skills Match : {scores.get('skills_score', 0)}%")
    print(f"    * Semantic Similarity    : {scores.get('semantic_score', 0)}%")
    print(f"    * Experience Alignment   : {scores.get('experience_score', 0)}%")
    print(f"    * ATS Format & Metrics   : {scores.get('ats_formatting_score', 0)}%")
    print(subdivider)
    print(f"  MATCHED SKILLS ({skills.get('matched_count', 0)}):")
    matched = ", ".join(skills.get("matched_skills", []))
    print(f"    \033[92m{matched if matched else 'None'}\033[0m")
    print()
    print(f"  CRITICAL MISSING SKILLS ({len(skills.get('critical_missing_skills', []))}):")
    crit = ", ".join(skills.get("critical_missing_skills", []))
    print(f"    \033[91m{crit if crit else 'None - Great coverage!'}\033[0m")
    print()
    print(f"  ALL MISSING SKILLS ({skills.get('missing_count', 0)}):")
    all_miss = ", ".join(skills.get("missing_skills", []))
    print(f"    {all_miss if all_miss else 'None'}")
    print(subdivider)
    print("  ACTIONABLE RECOMMENDATIONS:")
    for s in result.get("suggestions", []):
        print(f"    [{s.get('type', 'tip').upper()}] {s.get('title')}:")
        print(f"      {s.get('message')}")
    print(divider + "\n")

def main():
    parser = argparse.ArgumentParser(description="AI Resume Analyzer CLI")
    parser.add_argument("--resume", type=str, help="Path to single resume file (PDF, DOCX, TXT)")
    parser.add_argument("--jd", type=str, required=True, help="Path to Job Description file (TXT)")
    parser.add_argument("--batch-dir", type=str, help="Directory containing multiple resumes to rank")
    parser.add_argument("--json", action="store_true", help="Output results in JSON format")
    parser.add_argument("--export-pdf", type=str, help="Output path for PDF report (single resume mode)")

    args = parser.parse_args()

    # Load Job Description
    jd_path = Path(args.jd)
    if not jd_path.exists():
        print(f"Error: Job description file not found at {args.jd}", file=sys.stderr)
        sys.exit(1)

    with open(jd_path, "r", encoding="utf-8", errors="ignore") as f:
        jd_text = f.read()

    # Batch Mode
    if args.batch_dir:
        batch_path = Path(args.batch_dir)
        if not batch_path.is_dir():
            print(f"Error: Directory not found at {args.batch_dir}", file=sys.stderr)
            sys.exit(1)

        resume_files = [f for f in batch_path.iterdir() if f.suffix.lower() in [".pdf", ".docx", ".txt", ".md"]]
        if not resume_files:
            print(f"No supported resume files found in {args.batch_dir}", file=sys.stderr)
            sys.exit(1)

        print(f"\nAnalyzing {len(resume_files)} resumes against Job Description: {jd_path.name}...\n")
        results = []
        for rf in resume_files:
            with open(rf, "rb") as f:
                content = f.read()
            text = DocumentParser.parse_file(content, rf.name)
            res = ResumeAnalyzer.match_resume_to_job(text, jd_text, filename=rf.name)
            results.append(res)

        # Sort leaderboard by overall score descending
        results.sort(key=lambda x: x["overall_score"], reverse=True)

        if args.json:
            print(json.dumps(results, indent=2))
            return

        print("=" * 85)
        print(f"{'RANK':<5} | {'CANDIDATE NAME':<24} | {'OVERALL':<8} | {'SKILLS':<8} | {'ATS':<8} | {'TIER':<18}")
        print("=" * 85)
        for idx, r in enumerate(results, start=1):
            cand = r.get("candidate_name", "Unknown")[:24]
            overall = f"{r['overall_score']}%"
            sk = f"{r['scores']['skills_score']}%"
            ats = f"{r['scores']['ats_formatting_score']}%"
            tier = r['fit_tier']
            print(f"{idx:<5} | {cand:<24} | {overall:<8} | {sk:<8} | {ats:<8} | {tier:<18}")
        print("=" * 85 + "\n")
        return

    # Single Mode
    if not args.resume:
        print("Error: Please provide --resume <path> or --batch-dir <path>", file=sys.stderr)
        sys.exit(1)

    rf_path = Path(args.resume)
    if not rf_path.exists():
        print(f"Error: Resume file not found at {args.resume}", file=sys.stderr)
        sys.exit(1)

    with open(rf_path, "rb") as f:
        file_bytes = f.read()
    resume_text = DocumentParser.parse_file(file_bytes, rf_path.name)
    analysis = ResumeAnalyzer.match_resume_to_job(resume_text, jd_text, filename=rf_path.name)

    if args.json:
        print(json.dumps(analysis, indent=2))
    else:
        format_terminal_output(analysis)

    if args.export_pdf:
        pdf_bytes = PDFReportGenerator.generate_report(analysis)
        with open(args.export_pdf, "wb") as pf:
            pf.write(pdf_bytes)
        print(f"✓ PDF report successfully saved to: {args.export_pdf}")

if __name__ == "__main__":
    main()
