// Frontend/src/components/CodeBlock.jsx
import CopyButton from "./CopyButton.jsx";

// Helper function to extract plain text from React nodes
function extractText(node) {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node?.props?.children) return extractText(node.props.children);
    return "";
}

export default function CodeBlock({ children, ...props }) {
    // Identify language from code element className if present (e.g., "hljs language-javascript")
    const codeElement = children;
    const className = codeElement?.props?.className || "";
    const langMatch = /language-(\w+)/.exec(className);
    const language = langMatch ? langMatch[1] : "code";

    const rawCode = extractText(children).replace(/\n$/, "");

    return (
        <div className="codeBlockWrapper">
            <div className="codeBlockHeader">
                <span className="codeBlockLang">{language}</span>
                <CopyButton text={rawCode} showLabel={true} className="codeCopyBtn" />
            </div>
            <pre {...props} className="codeBlockPre">
                {children}
            </pre>
        </div>
    );
}
