import { NextResponse } from "next/server";

const mockByLang: Record<string, string> = {
  "kn-IN":
    "ನಾಳೆ ಮಧ್ಯಾಹ್ನ ಮಳೆಯ ಸಾಧ್ಯತೆ ಹೆಚ್ಚು. ಇಂದೇ ಕೊಯ್ಲು ಮಾಡುವುದು ಸುರಕ್ಷಿತ. ಕ್ಷೇತ್ರದ ನೀರಿನ ನಿಷ್ಕಾಸವನ್ನು ಖಚಿತಪಡಿಸಿ.",
  "hi-IN":
    "कल दोपहर बाद बारिश की संभावना है। आज कटाई बेहतर है। खेत में पानी निकास सुनिश्चित करें।",
  default:
    "Rain is likely tomorrow afternoon — harvest today if your tomatoes are breaker+ stage. Keep drainage channels open.",
};

async function callOpenAI(message: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are SANJHA, a concise farming copilot for India. Give practical harvest and weather-risk advice in 2-4 short sentences. If the user language hint suggests Kannada/Hindi/etc., reply in that language.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callAnthropic(message: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 256,
      messages: [{ role: "user", content: message }],
      system:
        "You are SANJHA farming intelligence. Short, actionable answers for smallholder farmers in India.",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  return text?.trim() ?? null;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { message?: string; lang?: string };
  const message = body.message?.trim() || "Hello";
  const lang = body.lang || "en-US";

  const fromOpenAI = await callOpenAI(message);
  if (fromOpenAI) return NextResponse.json({ reply: fromOpenAI, source: "openai" });

  const fromClaude = await callAnthropic(message);
  if (fromClaude) return NextResponse.json({ reply: fromClaude, source: "anthropic" });

  const fallback = mockByLang[lang] ?? mockByLang.default;
  return NextResponse.json({ reply: fallback, source: "offline-demo" });
}
