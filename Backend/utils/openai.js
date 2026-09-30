import "dotenv/config";

const MODEL = "qwen/qwen3.8-27b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// OLD: non-streaming version (kept for now, no longer used by /chat)
const getOpenAIRespense = async (message) => {
    const options = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: "user", content: message }
            ]
        })
    };

    try {
        const result = await fetch(GROQ_URL, options);
        const data = await result.json();

        if (!result.ok) {
            console.log("Groq API Error:", data);
            throw new Error(data.error?.message || "Groq API error");
        }

        const reply = data.choices?.[0]?.message?.content;
        return reply;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

// NEW: streaming version. Takes the full messages array, yields tokens one by one.

// Retry wrapper for fetch to handle 429 errors
async function fetchWithRetry(url, options, retries = 2) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const detail = await res.text();
      if (res.status === 429 && retries > 0) {
        console.warn("Rate limit hit. Retrying...");
        await new Promise(r => setTimeout(r, 20000)); // wait 20s
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`Groq API error ${res.status}: ${detail}`);
    }
    return res;
  } catch (err) {
    throw err;
  }
}

export async function* streamOpenAIResponse(messages, signal) {
  const result = await fetchWithRetry(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      max_tokens: 500
    }),
    signal,
  });

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of result.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const token = JSON.parse(data).choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {
        /* ignore partial JSON */
      }
    }
  }
}

export default getOpenAIRespense;