export async function streamChat({ threadId, message, truncateTo, onToken, signal }) {
    const res = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, message, truncateTo }),
        signal,
    });

    if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop(); // incomplete event stays buffered

        for (const ev of events) {
            if (!ev.startsWith("data:")) continue;
            const payload = JSON.parse(ev.slice(5));
            if (payload.error) throw new Error(payload.error);
            if (payload.token) onToken(payload.token);
        }
    }
}