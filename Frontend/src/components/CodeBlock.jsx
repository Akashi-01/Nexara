import CopyButton from "./CopyButton.jsx";

// Recursively pull plain text out of highlighted (nested span) children
const extractText = (node) => {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node.props) return extractText(node.props.children);
  return "";
};

function CodeBlock({ children, node, ...props }) {
  const codeElement = children?.props ? children : null;
  const codeText = extractText(codeElement?.props?.children);
  const className = codeElement?.props?.className || "";
  const language = className.replace("hljs language-", "").replace("language-", "");

  return (
    <div className="codeBlockWrapper">
      <div className="codeBlockHeader">
        <span className="codeBlockLang">{language || "code"}</span>
        <CopyButton text={codeText.replace(/\n$/, "")} showLabel={true} />
      </div>
      <pre className="codeBlockPre" {...props}>{children}</pre>
    </div>
  );
}

export default CodeBlock;