# llm_bridge.py
import os
import sys
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
from typing import Optional
import uvicorn

app = FastAPI(title="Simple LLM Bridge")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    print("ERROR: OPENROUTER_API_KEY environment variable is not set", file=sys.stderr)
    sys.exit(1)

MODEL = "qwen/qwen3-vl-235b-a22b-thinking"   

class PromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    max_tokens: Optional[int] = 2048
    temperature: Optional[float] = 0.7


@app.post("/generate")
async def generate_text(req: PromptRequest):
    client = httpx.AsyncClient(http2=True, timeout=90.0)

    payload = {
        "model": req.model or MODEL,
        "messages": [{"role": "user", "content": req.prompt}],
        "temperature": req.temperature,
        "max_tokens": req.max_tokens,
        "stream": False,           
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost",           
        "X-Title": "LLM Bridge",
        "Content-Type": "application/json",
    }

    try:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )
        r.raise_for_status()
        data = r.json()

        content = data["choices"][0]["message"]["content"]
        return {"response": content.strip()}

    except httpx.HTTPStatusError as e:
        error_detail = e.response.json() if e.response else str(e)
        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("Starting LLM bridge server...")
    print(f"Using model: {MODEL}")
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8700,
        log_level="info",
    )