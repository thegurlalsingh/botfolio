import os
import sys
from openai import OpenAI

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL = "baidu/cobuddy:free"

def ask_llm(prompt, temperature=0.2, max_tokens=1200):
    if not OPENROUTER_API_KEY:
        print("ERROR: OPENROUTER_API_KEY environment variable is not set", file=sys.stderr)
        sys.exit(1)

    # Initialize OpenRouter Client
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

    try:
        # Single-turn API call for resume parsing
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=float(temperature),
            max_tokens=int(max_tokens),
            # Optional: Enable reasoning if the model supports it
            # extra_body={"reasoning": {"enabled": True}} 
        )

        # Get the actual content
        mes = response.choices[0].message
        content = mes.content

        # 🔥 Handle different formats safely
        if isinstance(content, list):
            # Extract text from structured response
            content = "".join(
                part.get("text", "") for part in content if isinstance(part, dict)
            )

        elif content is None:
            if hasattr(mes, 'reasoning_details') and mes.reasoning_details:
                content = str(mes.reasoning_details)
            else:
                content = ""

        # Final safety
        if not isinstance(content, str):
            content = str(content)

        content = content.strip()

        # Print ONLY once
        print(content)
        sys.exit(0)

    except Exception as e:
        print(f"LLM Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python llm.py <prompt> [temperature] [max_tokens]", file=sys.stderr)
        sys.exit(1)

    prompt_arg = sys.argv[1]
    temp_arg = sys.argv[2] if len(sys.argv) > 2 else 0.2
    tokens_arg = sys.argv[3] if len(sys.argv) > 3 else 4096

    ask_llm(prompt_arg, temp_arg, tokens_arg)
