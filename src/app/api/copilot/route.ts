// AI4Bharat translation via Hugging Face
async function translateWithAI4Bharat(text: string, srcLang: string, tgtLang: string): Promise<string> {
  const langMap: Record<string, string> = {
    kn: "kan_Knda",
    hi: "hin_Deva",
    te: "tel_Telu",
    ta: "tam_Taml",
    mr: "mar_Deva",
    pa: "pan_Guru",
    en: "eng_Latn",
  };

  const sourceLang = langMap[srcLang] || "eng_Latn";
  const targetLang = langMap[tgtLang] || "kan_Knda";

  const modelId =
    srcLang === "en" ? "ai4bharat/indictrans2-en-indic-1B" : "ai4bharat/indictrans2-indic-en-1B";

  const hfKey = process.env.HUGGINGFACE_API_KEY?.trim();
  if (!hfKey) return text;

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: { src_lang: sourceLang, tgt_lang: targetLang },
      }),
    });

    if (!res.ok) throw new Error("Translation failed");
    const data = (await res.json()) as { translation_text?: string }[];
    const first = Array.isArray(data) ? data[0] : undefined;
    return first?.translation_text || text;
  } catch (err) {
    console.error("Translation error:", err);
    return text;
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    text?: string;
    lang?: string;
    farmContext?: { crop?: string; soil?: string; district?: string; weather?: string };
  };
  const text = body.text?.trim() || "";
  const lang = body.lang || "en";
  const farmContext = body.farmContext ?? {};

  let englishText = text;
  if (lang && lang !== "en") {
    englishText = await translateWithAI4Bharat(text, lang, "en");
  }

  const prompt = `You are a farming advisor for small farmers in India. 
Answer in 1-2 short, practical sentences. Be direct.
Farm context: Crop: ${farmContext.crop || "unknown"}, 
Soil: ${farmContext.soil || "unknown"}, 
District: ${farmContext.district || "unknown"},
Weather: ${farmContext.weather || "unknown"}.
Question: ${englishText}`;

  let englishReply = "";

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error("Gemini API error:", errBody);
        throw new Error("Gemini failed");
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      englishReply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("AI error, using fallback:", msg);
      englishReply = "";
    }
  }

  if (!englishReply) {
    const query = englishText.toLowerCase();
    const crop = farmContext.crop || "your crop";
    const district = farmContext.district || "your area";

    if (query.includes("rain") || query.includes("weather")) {
      englishReply = `Check the Weather tab for ${district}. If rain is expected in the next 2 days, delay harvesting ${crop}.`;
    } else if (query.includes("harvest")) {
      englishReply = `For ${crop}: Check your DRI score on the dashboard. Score below 30 means harvest now.`;
    } else if (query.includes("price") || query.includes("market")) {
      englishReply =
        "Check Market tab for current mandi prices. You can list your produce to get direct bids from buyers.";
    } else if (query.includes("pest") || query.includes("disease")) {
      englishReply = `Search Community Hub for ${crop} pest solutions from farmers in ${district}.`;
    } else {
      englishReply =
        "I can help with weather, harvest timing, market prices, pests, and soil health. What do you need?";
    }
  }

  let localReply = englishReply;
  if (lang && lang !== "en") {
    localReply = await translateWithAI4Bharat(englishReply, "en", lang);
  }

  return Response.json({ reply: localReply, replyEn: englishReply });
}
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  const data = await res.json();

  return Response.json(data);
} 