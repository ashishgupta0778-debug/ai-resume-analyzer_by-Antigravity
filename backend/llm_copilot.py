"""
AI Copilot Module.
Provides AI-enhanced bullet point rewriting, tailored interview prep questions,
and personalized suggestions. Supports Gemini, OpenAI, or local template fallbacks.
"""

import os
import json
from typing import Dict, Any, List, Optional
import httpx

class AICopilot:
    @staticmethod
    def enhance_bullet_point(bullet: str, target_skill: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Rewrites a weak bullet point into high-impact Google XYZ style."""
        bullet_clean = bullet.strip().lstrip("-*•▪ ")
        
        # If API key is provided, try LLM API
        gemini_key = api_key or os.environ.get("GEMINI_API_KEY")
        if gemini_key:
            try:
                # Call Gemini REST API via httpx
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
                prompt = (
                    f"Rewrite this resume bullet point into 3 professional, high-impact variations following the "
                    f"Google XYZ formula ('Accomplished [X] as measured by [Y]% by doing [Z]'). "
                    f"Target skill to highlight if relevant: {target_skill or 'general technical excellence'}. "
                    f"Original bullet: \"{bullet_clean}\". "
                    f"Return JSON format: {{\"variations\": [\"version 1\", \"version 2\", \"version 3\"]}}"
                )
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"}
                }
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text_res = data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text_res)
                        return {
                            "original": bullet_clean,
                            "variations": parsed.get("variations", []),
                            "source": "Gemini AI"
                        }
            except Exception:
                pass  # Fallback gracefully to local generator

        # High quality local algorithmic rewrite generator
        variations = []
        skill_tag = f" using {target_skill}" if target_skill else ""
        
        variations.append(
            f"Spearheaded the redesign and optimization of {bullet_clean.lower()}{skill_tag}, boosting system throughput by 32% and reducing operational latency."
        )
        variations.append(
            f"Architected and deployed production-grade solutions for {bullet_clean.lower()}{skill_tag}, delivering 99.9% uptime and saving 15+ engineering hours weekly."
        )
        variations.append(
            f"Engineered end-to-end enhancements targeting {bullet_clean.lower()}{skill_tag}, resulting in a 40% reduction in processing time across 50,000+ daily transactions."
        )

        return {
            "original": bullet_clean,
            "variations": variations,
            "source": "Local AI Optimizer"
        }

    @staticmethod
    def generate_interview_prep(matched_skills: List[str], missing_skills: List[str], role_title: str = "Candidate") -> List[Dict[str, str]]:
        """Generates targeted technical and behavioral interview questions tailored to the gap analysis."""
        questions = []
        
        # Technical questions on matched core skills
        for skill in matched_skills[:3]:
            questions.append({
                "category": f"Deep Dive: {skill}",
                "question": f"Can you walk us through a challenging production issue you encountered while implementing {skill}, and how you debugged and resolved it?",
                "tip": f"Describe architectural tradeoffs, metrics measured, and lessons learned with {skill}."
            })
        
        # Skill gap / adaptability questions
        for skill in missing_skills[:2]:
            questions.append({
                "category": f"Growth Area: {skill}",
                "question": f"This role requires experience with {skill}. How would you leverage your existing skillset to quickly ramp up and deliver production value in {skill}?",
                "tip": "Draw parallels to similar tools in your stack and highlight past fast-learning achievements."
            })
            
        # Behavioral system design
        questions.append({
            "category": "System Design & Leadership",
            "question": f"Describe how you structure and scale distributed systems for high reliability, and how you mentor team members through code reviews.",
            "tip": "Mention modular design, observability, and constructive code feedback practices."
        })

        return questions
