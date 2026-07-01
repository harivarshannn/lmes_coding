from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI(
    title="DevArena AI Service",
    description="Microservice for generating coding feedback and progressive hints using AI models.",
    version="1.0.0"
)

class FeedbackRequest(BaseModel):
    code: str
    language: str
    problem_title: str
    problem_description: str
    verdict: str

class HintRequest(BaseModel):
    attempt_number: int
    submitted_code: str
    problem_title: str

@app.post("/ai/feedback")
def generate_feedback(req: FeedbackRequest):
    # Simulated advanced AI Code review feedback
    # In a real setup, this would invoke Vertex AI, Gemini, or OpenAI APIs.
    feedback_text = (
        f"### AI Code Quality Review for '{req.problem_title}' ({req.language.capitalize()})\n\n"
        f"**Verdict Analyzed:** {req.verdict}\n\n"
        "**Observation & Insights:**\n"
        "- The syntax structure looks syntactically valid.\n"
        "- Time Complexity: The loop structure runs efficiently.\n"
        "- Potential Bugs: Check if the variables are initialized properly. If the array is empty, your code might raise an index error. "
        "Make sure to add a defensive check `if not nums: return` at the beginning.\n\n"
        "**Recommendation:**\n"
        "Consider using a HashMap to reduce lookup time from O(N) to O(1) if you haven't already."
    )
    return {"feedback": feedback_text}

@app.post("/ai/hint")
def suggest_hint(req: HintRequest):
    if req.attempt_number == 1:
        hint_text = "Stage 1 Hint: Try visualizing the problem with a small example. What is the brute force way to find the answer?"
    elif req.attempt_number == 2:
        hint_text = "Stage 2 Hint: You can trade space for time. Can a dictionary or set store values you have already scanned?"
    elif req.attempt_number == 3:
        hint_text = "Stage 3 (Approach): Loop through the elements once. Check if the complement (target - current) has been stored in your map."
    else:
        hint_text = "Stage 4 (Solution Unlocked): The optimal solution is to use a Single-Pass Hash Map. Refer to the solutions tab for the verified code."
        
    return {
        "attempt_number": req.attempt_number,
        "hint": hint_text
    }
