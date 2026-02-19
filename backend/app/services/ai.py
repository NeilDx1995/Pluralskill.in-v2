import json
import logging

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini client (lazy - only on first AI call)
_gemini_configured = False


def _configure_gemini():
    global _gemini_configured
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "Gemini API key not configured. Get one free at https://aistudio.google.com/apikey"
        )
    if not _gemini_configured:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _gemini_configured = True


async def generate_learning_path(
    skill_name: str, current_level: str, industry: str, goal: str
):
    _configure_gemini()

    prompt = f"""You are an expert technical curriculum designer. You provide curated, high-quality open source learning resources.

Create a detailed 4-week learning path to learn {skill_name} for the {industry} industry.
Current Level: {current_level}
Goal: {goal}

Return ONLY a JSON object with this exact structure:
{{
  "skill_name": "{skill_name}",
  "industry": "{industry}",
  "description": "Brief description of the learning path",
  "difficulty": "{current_level}",
  "estimated_weeks": 4,
  "steps": [
    {{
      "week": 1,
      "title": "Week 1 Focus Area",
      "description": "What to learn this week",
      "skills_covered": ["Skill 1", "Skill 2"],
      "resources": [
         {{ "title": "Resource Title", "url": "https://real-url.com", "type": "article", "description": "Brief description" }}
      ]
    }},
    {{
      "week": 2,
      "title": "Week 2 Focus Area",
      "description": "What to learn this week",
      "skills_covered": ["Skill 3", "Skill 4"],
      "resources": [
         {{ "title": "Resource Title", "url": "https://real-url.com", "type": "video", "description": "Brief description" }}
      ]
    }},
    {{
      "week": 3,
      "title": "Week 3 Focus Area",
      "description": "What to learn this week",
      "skills_covered": ["Skill 5"],
      "resources": [
         {{ "title": "Resource Title", "url": "https://real-url.com", "type": "tutorial", "description": "Brief description" }}
      ]
    }},
    {{
      "week": 4,
      "title": "Week 4 Focus Area",
      "description": "What to learn this week",
      "skills_covered": ["Skill 6"],
      "resources": [
         {{ "title": "Resource Title", "url": "https://real-url.com", "type": "project", "description": "Brief description" }}
      ]
    }}
  ]
}}

IMPORTANT: Include real, working URLs to free resources (official docs, YouTube, freeCodeCamp, MDN, etc.). Each week should have 2-4 resources."""

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7,
            ),
        )

        content = response.text
        result = json.loads(content)
        result["generated_by"] = "gemini"
        logger.info(f"Learning path generated for '{skill_name}' via Gemini")
        return result

    except Exception as e:
        logger.error(f"Gemini API Error: {str(e)}")
        # Fallback template
        return {
            "skill_name": skill_name,
            "industry": industry,
            "description": f"Standard learning path for {skill_name}. (AI Generation Failed - Using Template)",
            "difficulty": current_level,
            "estimated_weeks": 4,
            "steps": [
                {
                    "week": 1,
                    "title": f"Introduction to {skill_name}",
                    "description": "Core concepts and fundamentals",
                    "skills_covered": ["Basics", "Setup"],
                    "resources": [
                        {
                            "title": "Official Documentation",
                            "url": f"https://google.com/search?q={skill_name}+documentation",
                            "type": "article",
                            "description": "Official docs",
                        }
                    ],
                },
                {
                    "week": 2,
                    "title": f"Intermediate {skill_name}",
                    "description": "Building on the fundamentals",
                    "skills_covered": ["Practice", "Projects"],
                    "resources": [
                        {
                            "title": "YouTube Tutorials",
                            "url": f"https://youtube.com/results?search_query={skill_name}+tutorial",
                            "type": "video",
                            "description": "Video tutorials",
                        }
                    ],
                },
            ],
            "generated_by": "fallback",
        }
