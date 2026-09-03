// Frontend/src/components/CopyButton.jsx
import { useState } from "react";

export default function CopyButton({ text, showLabel = true, className = "" }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback for older browsers or non-secure contexts
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`copyBtn ${copied ? "copied" : ""} ${className}`}
            aria-label="Copy to clipboard"
            title={copied ? "Copied!" : "Copy to clipboard"}
        >
            <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
            {showLabel && <span>{copied ? "Copied!" : "Copy"}</span>}
        </button>
    );
}
