"""
Resume and Document Parser.
Handles PDF, DOCX, TXT formats, extracts structured metadata, contact info,
sections, action verbs, and quantifiable metrics.
"""

import io
import re
from typing import Dict, Any, List, Optional
import pypdf
import docx
from backend.taxonomy import STRONG_ACTION_VERBS, DEGREE_LEVELS

class DocumentParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extracts text from a PDF file with page-by-page formatting preservation."""
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_pages.append(text)
        return "\n".join(extracted_pages).strip()

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        """Extracts text from a DOCX file, including tables and paragraphs."""
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    full_text.append(" | ".join(row_cells))
        return "\n".join(full_text).strip()

    @staticmethod
    def parse_file(file_bytes: bytes, filename: str) -> str:
        """Parses any supported file type based on extension."""
        fname_lower = filename.lower()
        if fname_lower.endswith(".pdf"):
            return DocumentParser.extract_text_from_pdf(file_bytes)
        elif fname_lower.endswith(".docx"):
            return DocumentParser.extract_text_from_docx(file_bytes)
        else:
            # Fallback to text decoding
            try:
                return file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                return file_bytes.decode("latin-1", errors="ignore")

class ResumeFeatureExtractor:
    """Extracts contact info, sections, metrics, and ATS formatting markers from resume text."""

    EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
    PHONE_REGEX = re.compile(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}')
    LINKEDIN_REGEX = re.compile(r'linkedin\.com/in/([a-zA-Z0-9_-]+)', re.IGNORECASE)
    GITHUB_REGEX = re.compile(r'github\.com/([a-zA-Z0-9_-]+)', re.IGNORECASE)
    METRIC_REGEX = re.compile(r'(\b\d+(\.\d+)?%|\$\s?\d+([,\.]\d+)?\s?[kKmMbB]?|\b\d+\s?(?:ms|users|clients|engineers|people|times|x|years|projects)\b)', re.IGNORECASE)

    # Standard section identifiers
    SECTION_HEADERS = {
        "summary": ["summary", "professional summary", "career profile", "about me", "objective", "executive summary"],
        "experience": ["experience", "work experience", "employment history", "professional experience", "work history"],
        "education": ["education", "academic background", "qualifications", "academics", "educational qualifications"],
        "skills": ["skills", "technical skills", "core competencies", "skills & tools", "technologies", "tech stack"],
        "projects": ["projects", "personal projects", "key projects", "notable projects"],
        "certifications": ["certifications", "licenses", "certificates", "credentials"]
    }

    @classmethod
    def extract_contact_info(cls, text: str) -> Dict[str, Any]:
        """Extracts email, phone, links, and candidate name heuristic."""
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        
        # Candidate name heuristic: usually in the first 3 non-empty lines
        candidate_name = "Candidate"
        for line in lines[:3]:
            # If line is short, doesn't contain @, http, or phone digits
            if 3 < len(line) < 40 and not re.search(r'[@0-9:/|]', line):
                candidate_name = line.strip()
                break

        emails = cls.EMAIL_REGEX.findall(text)
        phones = cls.PHONE_REGEX.findall(text)
        linkedin = cls.LINKEDIN_REGEX.findall(text)
        github = cls.GITHUB_REGEX.findall(text)

        # Reconstruct full phone if matched
        phone_match = re.search(cls.PHONE_REGEX, text)
        clean_phone = phone_match.group(0).strip() if phone_match else None

        return {
            "name": candidate_name,
            "email": emails[0] if emails else None,
            "phone": clean_phone,
            "linkedin": f"https://linkedin.com/in/{linkedin[0]}" if linkedin else None,
            "github": f"https://github.com/{github[0]}" if github else None,
        }

    @classmethod
    def detect_sections(cls, text: str) -> Dict[str, str]:
        """Segments text into sections based on detected headers."""
        lines = text.split("\n")
        sections = {sec: "" for sec in cls.SECTION_HEADERS}
        current_section = "summary"
        
        # Compile list of header matches
        header_map = {}
        for sec, keywords in cls.SECTION_HEADERS.items():
            for kw in keywords:
                header_map[kw] = sec

        for line in lines:
            line_clean = line.strip().lower()
            # Clean punctuation from header line
            line_clean_stripped = re.sub(r'[:#*_-]', '', line_clean).strip()
            
            matched_sec = None
            if len(line_clean_stripped) < 45:
                for kw, sec_name in header_map.items():
                    if line_clean_stripped == kw or line_clean_stripped.startswith(kw + " "):
                        matched_sec = sec_name
                        break
            
            if matched_sec:
                current_section = matched_sec
            else:
                sections[current_section] += line + "\n"

        return sections

    @classmethod
    def analyze_ats_readability(cls, text: str) -> Dict[str, Any]:
        """Evaluates ATS formatting, structure, impact metrics, and action verbs."""
        words = re.findall(r'\b[A-Za-z]+\b', text.lower())
        total_words = len(words)
        
        # Action verbs
        action_verbs_found = [w for w in words if w in STRONG_ACTION_VERBS]
        unique_action_verbs = sorted(list(set(action_verbs_found)))
        
        # Quantifiable metrics
        metrics_found = [m[0] for m in cls.METRIC_REGEX.findall(text) if m[0]]
        
        # Bullet points detection
        bullets = re.findall(r'^[•\-\*■▪]\s*(.+)$', text, re.MULTILINE)
        if not bullets:
            # Check lines indented or starting with bullet-like spaces
            bullets = [l.strip() for l in text.split("\n") if l.strip().startswith(("-", "*", "•", "–"))]

        # Degree detection
        detected_degrees = []
        for degree_cat, aliases in DEGREE_LEVELS.items():
            for alias in aliases:
                pattern = r'\b' + re.escape(alias) + r'\b'
                if re.search(pattern, text, re.IGNORECASE):
                    detected_degrees.append(degree_cat)
                    break

        sections = cls.detect_sections(text)
        present_sections = [sec for sec, content in sections.items() if len(content.strip()) > 30]

        # Calculate ATS score components (0 to 100)
        # 1. Section completeness (max 30 pts)
        sec_score = min(30, len(present_sections) * 6)
        
        # 2. Action verbs (max 25 pts)
        verb_score = min(25, len(unique_action_verbs) * 3)
        
        # 3. Quantifiable impact / metrics (max 25 pts)
        metric_score = min(25, len(metrics_found) * 5)
        
        # 4. Length and contact info (max 20 pts)
        contact = cls.extract_contact_info(text)
        contact_pts = 0
        if contact.get("email"): contact_pts += 7
        if contact.get("phone"): contact_pts += 7
        if 200 <= total_words <= 1200: contact_pts += 6
        elif total_words > 100: contact_pts += 3
        
        ats_formatting_score = min(100, sec_score + verb_score + metric_score + contact_pts)

        return {
            "ats_formatting_score": ats_formatting_score,
            "word_count": total_words,
            "action_verbs_count": len(action_verbs_found),
            "unique_action_verbs": unique_action_verbs[:15],
            "metrics_count": len(metrics_found),
            "sample_metrics": metrics_found[:6],
            "bullet_count": len(bullets),
            "detected_sections": present_sections,
            "detected_degrees": list(set(detected_degrees)),
            "contact": contact
        }
