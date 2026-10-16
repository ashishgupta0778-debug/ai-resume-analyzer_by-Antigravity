"""
PDF Report Generator using ReportLab.
Produces a professional Candidate Evaluation & Match Audit PDF Report.
"""

import io
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class PDFReportGenerator:
    @staticmethod
    def generate_report(analysis_result: Dict[str, Any]) -> bytes:
        """Generates a styled PDF report and returns bytes."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#1E293B'),
            fontName='Helvetica-Bold'
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=15,
            textColor=colors.HexColor('#64748B')
        )
        section_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold',
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13.5,
            textColor=colors.HexColor('#334155')
        )
        badge_style = ParagraphStyle(
            'ScoreBadge',
            parent=styles['Normal'],
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#2563EB'),
            fontName='Helvetica-Bold'
        )
        
        elements = []

        # Header Title
        cand_name = analysis_result.get("candidate_name", "Candidate")
        filename = analysis_result.get("filename", "Resume")
        overall = analysis_result.get("overall_score", 0)
        verdict = analysis_result.get("verdict", "")
        fit_tier = analysis_result.get("fit_tier", "")

        elements.append(Paragraph(f"AI Resume Evaluation Report", title_style))
        elements.append(Paragraph(f"Candidate: <b>{cand_name}</b> | Source: {filename}", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#E2E8F0'), spaceAfter=15))

        # Overall Score Summary Box
        score_data = [
            [
                Paragraph(f"<b>Overall Match Score:</b> <font color='#2563EB' size='16'><b>{overall}%</b></font><br/>Fit Tier: <b>{fit_tier}</b>", body_style),
                Paragraph(f"<b>Recommendation:</b><br/>{verdict}", body_style)
            ]
        ]
        score_table = Table(score_data, colWidths=[260, 260])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(score_table)
        elements.append(Spacer(1, 15))

        # Score Breakdown Table
        elements.append(Paragraph("Score Breakdown", section_style))
        scores = analysis_result.get("scores", {})
        breakdown_data = [
            ["Metric", "Score", "Benchmark / Status"],
            ["Skill Fit Alignment", f"{scores.get('skills_score', 0)}%", "Core tech stack match ratio"],
            ["Semantic Relevance (TF-IDF)", f"{scores.get('semantic_score', 0)}%", "Contextual & keyword alignment"],
            ["Experience & Tenure Fit", f"{scores.get('experience_score', 0)}%", "Years & seniority alignment"],
            ["ATS Formatting & Readability", f"{scores.get('ats_formatting_score', 0)}%", "Sections, metrics & action verbs"],
        ]
        breakdown_table = Table(breakdown_data, colWidths=[180, 90, 250])
        breakdown_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        elements.append(breakdown_table)
        elements.append(Spacer(1, 15))

        # Skills Comparison
        elements.append(Paragraph("Skills & Competencies Audit", section_style))
        skills_info = analysis_result.get("skills_analysis", {})
        matched = ", ".join(skills_info.get("matched_skills", [])) or "None identified"
        missing = ", ".join(skills_info.get("missing_skills", [])) or "None identified"
        critical = ", ".join(skills_info.get("critical_missing_skills", [])) or "None"

        skills_data = [
            [Paragraph("<b>Matched Skills:</b>", body_style), Paragraph(f"<font color='#059669'>{matched}</font>", body_style)],
            [Paragraph("<b>Critical Missing:</b>", body_style), Paragraph(f"<font color='#DC2626'><b>{critical}</b></font>", body_style)],
            [Paragraph("<b>All Missing Skills:</b>", body_style), Paragraph(f"<font color='#B91C1C'>{missing}</font>", body_style)],
        ]
        skills_table = Table(skills_data, colWidths=[130, 390])
        skills_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F1F5F9'))
        ]))
        elements.append(skills_table)
        elements.append(Spacer(1, 15))

        # Recommendations & Action Items
        elements.append(Paragraph("Actionable ATS Recommendations", section_style))
        suggestions = analysis_result.get("suggestions", [])
        for sug in suggestions:
            title = sug.get("title", "Recommendation")
            msg = sug.get("message", "")
            elements.append(Paragraph(f"• <b>{title}:</b> {msg}", body_style))
            elements.append(Spacer(1, 4))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()
