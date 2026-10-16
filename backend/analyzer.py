"""
Core Resume & Job Description Matching Engine.
Calculates TF-IDF semantic similarity, extracts categorized skills,
computes candidate scores, identifies missing skills, and generates actionable advice.
"""

import re
from typing import Dict, Any, List, Set, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.taxonomy import SKILL_TAXONOMY, KEYWORD_TO_SKILL
from backend.parser import ResumeFeatureExtractor

class ResumeAnalyzer:
    @staticmethod
    def extract_skills(text: str) -> Dict[str, Any]:
        """Extracts skills from text matching against the skill taxonomy."""
        text_lower = " " + text.lower() + " "
        found_skills: Dict[str, Dict[str, Any]] = {}
        found_by_category: Dict[str, List[str]] = {}

        for keyword, (canonical_name, category) in KEYWORD_TO_SKILL.items():
            # Match whole word boundary to prevent partial matches like 'go' in 'good'
            # Escape regex special chars like +, ., #
            escaped_kw = re.escape(keyword)
            # Match boundary or surrounding punctuation / whitespace
            pattern = rf'(?:\b|[^\w]){escaped_kw}(?:\b|[^\w])'
            
            matches = list(re.finditer(pattern, text_lower))
            if matches:
                count = len(matches)
                if canonical_name not in found_skills:
                    found_skills[canonical_name] = {
                        "name": canonical_name,
                        "category": category,
                        "count": count
                    }
                    if category not in found_by_category:
                        found_by_category[category] = []
                    found_by_category[category].append(canonical_name)
                else:
                    found_skills[canonical_name]["count"] += count

        return {
            "all_skills": list(found_skills.values()),
            "skill_names": sorted(list(found_skills.keys())),
            "by_category": found_by_category,
            "total_count": len(found_skills)
        }

    @staticmethod
    def extract_experience_years(text: str) -> Dict[str, Any]:
        """Extracts years of experience mentioned in text or calculated from work dates."""
        # Matches patterns like "5+ years", "3-5 years", "minimum 4 years", "over 7 years"
        exp_patterns = [
            r'(\d+)\+?\s*(?:to|-)\s*(\d+)?\s*(?:years?|yrs?)(?:\s+of\s+experience)?',
            r'(?:at least|minimum|min|over)\s*(\d+)\s*(?:years?|yrs?)',
            r'(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?experience'
        ]
        
        extracted_nums = []
        for pat in exp_patterns:
            matches = re.findall(pat, text, re.IGNORECASE)
            for m in matches:
                if isinstance(m, tuple):
                    for part in m:
                        if part and part.isdigit():
                            extracted_nums.append(int(part))
                elif isinstance(m, str) and m.isdigit():
                    extracted_nums.append(int(m))
        
        # Estimate years from resume year dates (e.g. 2018 - 2024)
        year_matches = re.findall(r'\b(20[0-2][0-9]|199[0-9])\b', text)
        year_span = 0
        if year_matches:
            int_years = [int(y) for y in year_matches]
            if len(int_years) >= 2:
                # Approximate span between earliest professional year and latest year (capped at current year)
                span = max(int_years) - min(int_years)
                if 1 <= span <= 35:
                    year_span = span

        max_stated = max(extracted_nums) if extracted_nums else 0
        effective_years = max(max_stated, year_span)

        # Detect Seniority Level
        text_lower = text.lower()
        level = "Mid-Level"
        if any(w in text_lower for w in ["principal", "staff engineer", "director", "head of", "vp"]):
            level = "Staff / Principal / Director"
        elif any(w in text_lower for w in ["lead", "architect", "tech lead"]):
            level = "Lead / Architect"
        elif any(w in text_lower for w in ["senior", "sr.", "sr "]):
            level = "Senior"
        elif any(w in text_lower for w in ["junior", "jr.", "entry level", "associate", "intern", "trainee"]):
            level = "Junior / Entry-Level"

        return {
            "stated_years": max_stated,
            "calculated_years": effective_years,
            "seniority_level": level
        }

    @staticmethod
    def calculate_tfidf_similarity(resume_text: str, jd_text: str) -> float:
        """Computes calibrated TF-IDF Cosine Semantic Similarity between Resume and JD."""
        try:
            vectorizer = TfidfVectorizer(
                stop_words='english',
                ngram_range=(1, 2),
                max_features=5000,
                sublinear_tf=True
            )
            tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
            similarity = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
            # Raw cosine similarity between distinct document types typically spans 0.05 to 0.40.
            # We map this domain overlap onto a normalized 0-100 curve.
            normalized = max(0.0, (similarity - 0.04) / 0.36)
            scaled = min(100.0, round(normalized * 100.0, 1))
            return scaled
        except Exception:
            return 50.0

    @classmethod
    def match_resume_to_job(cls, resume_text: str, jd_text: str, filename: str = "Resume") -> Dict[str, Any]:
        """Performs full holistic matching, scoring, missing skills discovery, and advice generation."""
        # 1. Feature & Contact Extraction
        resume_readability = ResumeFeatureExtractor.analyze_ats_readability(resume_text)
        candidate_info = resume_readability["contact"]
        
        # 2. Skill Extraction
        resume_skills_data = cls.extract_skills(resume_text)
        jd_skills_data = cls.extract_skills(jd_text)

        resume_skill_set = set(resume_skills_data["skill_names"])
        jd_skill_set = set(jd_skills_data["skill_names"])

        matched_skills = sorted(list(resume_skill_set.intersection(jd_skill_set)))
        missing_skills = sorted(list(jd_skill_set.difference(resume_skill_set)))
        extra_skills = sorted(list(resume_skill_set.difference(jd_skill_set)))

        # Categorize missing skills
        missing_by_cat = {}
        for skill in missing_skills:
            cat = KEYWORD_TO_SKILL.get(skill.lower(), (skill, "Other"))[1]
            if cat not in missing_by_cat:
                missing_by_cat[cat] = []
            missing_by_cat[cat].append(skill)

        # Categorize matched skills
        matched_by_cat = {}
        for skill in matched_skills:
            cat = KEYWORD_TO_SKILL.get(skill.lower(), (skill, "Other"))[1]
            if cat not in matched_by_cat:
                matched_by_cat[cat] = []
            matched_by_cat[cat].append(skill)

        # 3. Experience & Seniority
        resume_exp = cls.extract_experience_years(resume_text)
        jd_exp = cls.extract_experience_years(jd_text)

        # Experience fit calculation
        req_years = jd_exp["calculated_years"] or 2
        cand_years = resume_exp["calculated_years"] or 1
        
        if cand_years >= req_years:
            exp_fit_score = 100.0
        else:
            exp_fit_score = max(30.0, round((cand_years / max(1, req_years)) * 100.0, 1))

        # 4. Semantic Similarity
        semantic_score = cls.calculate_tfidf_similarity(resume_text, jd_text)

        # 5. Skills Score
        if len(jd_skill_set) > 0:
            skills_match_ratio = len(matched_skills) / len(jd_skill_set)
            # Reward having a high percentage of skills
            raw_skills_score = min(100.0, skills_match_ratio * 100.0)
            skills_score = round(raw_skills_score, 1)
        else:
            # Fallback if JD has no detected taxonomy skills
            skills_score = semantic_score

        # 6. ATS Readability Score
        ats_score = resume_readability["ats_formatting_score"]

        # 7. Composite Overall Match Score
        # Formula: 45% Skills + 25% Semantic + 15% Experience + 15% ATS
        overall_score = round(
            (0.45 * skills_score) +
            (0.25 * semantic_score) +
            (0.15 * exp_fit_score) +
            (0.15 * ats_score),
            1
        )
        overall_score = min(100.0, max(0.0, overall_score))

        # 8. Tier & Fit Classification
        if overall_score >= 85:
            fit_tier = "Exceptional Match"
            tier_color = "emerald"
            recommendation_verdict = "Strong Yes - Immediate Interview"
        elif overall_score >= 70:
            fit_tier = "Strong Match"
            tier_color = "blue"
            recommendation_verdict = "Yes - Worth Reviewing"
        elif overall_score >= 50:
            fit_tier = "Moderate Match"
            tier_color = "amber"
            recommendation_verdict = "Borderline - Consider if skilled in key areas"
        else:
            fit_tier = "Low Match"
            tier_color = "rose"
            recommendation_verdict = "Skill & Experience Gap Detected"

        # 9. Top Critical Missing Skills (highest frequency in JD)
        jd_skill_counts = {s["name"]: s["count"] for s in jd_skills_data["all_skills"]}
        sorted_missing = sorted(missing_skills, key=lambda s: jd_skill_counts.get(s, 1), reverse=True)
        critical_missing = sorted_missing[:8]

        # 10. Generate Actionable Suggestions
        suggestions = cls.generate_actionable_suggestions(
            missing_skills=critical_missing,
            readability=resume_readability,
            cand_years=cand_years,
            req_years=req_years,
            matched_count=len(matched_skills),
            total_jd_count=len(jd_skill_set)
        )

        return {
            "candidate_name": candidate_info.get("name") or filename.rsplit(".", 1)[0].replace("_", " ").title(),
            "filename": filename,
            "overall_score": overall_score,
            "fit_tier": fit_tier,
            "tier_color": tier_color,
            "verdict": recommendation_verdict,
            "scores": {
                "overall": overall_score,
                "skills_score": skills_score,
                "semantic_score": semantic_score,
                "experience_score": exp_fit_score,
                "ats_formatting_score": ats_score
            },
            "skills_analysis": {
                "matched_skills": matched_skills,
                "matched_count": len(matched_skills),
                "missing_skills": missing_skills,
                "missing_count": len(missing_skills),
                "critical_missing_skills": critical_missing,
                "extra_skills": extra_skills[:12],
                "matched_by_category": matched_by_cat,
                "missing_by_category": missing_by_cat,
                "total_jd_skills": len(jd_skill_set),
                "total_resume_skills": len(resume_skill_set)
            },
            "experience_analysis": {
                "candidate_years": cand_years,
                "candidate_seniority": resume_exp["seniority_level"],
                "required_years": req_years,
                "required_seniority": jd_exp["seniority_level"]
            },
            "ats_metrics": {
                "formatting_score": ats_score,
                "word_count": resume_readability["word_count"],
                "action_verbs_count": resume_readability["action_verbs_count"],
                "unique_action_verbs": resume_readability["unique_action_verbs"],
                "metrics_count": resume_readability["metrics_count"],
                "sample_metrics": resume_readability["sample_metrics"],
                "bullet_count": resume_readability["bullet_count"],
                "detected_sections": resume_readability["detected_sections"],
                "detected_degrees": resume_readability["detected_degrees"],
                "contact": candidate_info
            },
            "suggestions": suggestions
        }

    @staticmethod
    def generate_actionable_suggestions(
        missing_skills: List[str],
        readability: Dict[str, Any],
        cand_years: int,
        req_years: int,
        matched_count: int,
        total_jd_count: int
    ) -> List[Dict[str, str]]:
        """Generates clear, prioritized suggestions to optimize resume."""
        suggestions = []

        # 1. Missing Critical Skills
        if missing_skills:
            skills_str = ", ".join(missing_skills[:5])
            suggestions.append({
                "type": "critical",
                "icon": "zap",
                "title": "Target Missing Core Skills",
                "message": f"Add the following high-priority skills found in the JD if you possess relevant project or work experience: {skills_str}."
            })

        # 2. Measurable Metrics / Quantification
        metrics_cnt = readability.get("metrics_count", 0)
        if metrics_cnt < 4:
            suggestions.append({
                "type": "warning",
                "icon": "trending-up",
                "title": "Quantify Your Impact",
                "message": f"Only {metrics_cnt} measurable numbers or percentage metrics detected. Boost your bullet points using the Google X-Y-Z formula: 'Accomplished [X], as measured by [Y]%, by doing [Z]'."
            })

        # 3. Action Verbs
        action_verb_cnt = readability.get("action_verbs_count", 0)
        if action_verb_cnt < 8:
            suggestions.append({
                "type": "warning",
                "icon": "sparkles",
                "title": "Strengthen Action Verbs",
                "message": "Replace passive verbs with impactful dynamic verbs like 'Spearheaded', 'Architected', 'Accelerated', 'Automated', or 'Streamlined'."
            })

        # 4. Experience Gap
        if cand_years < req_years:
            suggestions.append({
                "type": "info",
                "icon": "clock",
                "title": "Experience Alignment",
                "message": f"The job seeks ~{req_years} years of experience while ~{cand_years} years were detected. Emphasize senior-level project ownership, architectural leadership, and complex achievements to offset tenure."
            })

        # 5. Section headers
        detected_secs = readability.get("detected_sections", [])
        expected = ["skills", "experience", "education", "projects"]
        missing_secs = [s.title() for s in expected if s not in detected_secs]
        if missing_secs:
            suggestions.append({
                "type": "tip",
                "icon": "layout",
                "title": "Standardize Section Headers",
                "message": f"Consider adding standard headings for: {', '.join(missing_secs)}. Standard ATS parsers look specifically for these titles."
            })

        # 6. Contact info checks
        contact = readability.get("contact", {})
        if not contact.get("email") or not contact.get("phone"):
            missing_contact = []
            if not contact.get("email"): missing_contact.append("Email")
            if not contact.get("phone"): missing_contact.append("Phone Number")
            suggestions.append({
                "type": "critical",
                "icon": "alert-circle",
                "title": "Missing Contact Information",
                "message": f"Ensure your {', '.join(missing_contact)} is clearly visible at the top of your resume."
            })

        return suggestions
