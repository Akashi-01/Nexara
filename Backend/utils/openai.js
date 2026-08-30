import "dotenv/config";

const getOpenAIRespense = async (message) => {
    const model = "qwen/qwen3.8-27b";

    const options = {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "user", content: message }
            ]
        })
    };

    try {
        const result = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            options
        );
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

export default getOpenAIRespense;