import CopyButton from "./CopyButton.jsx";

function CodeBlock({ children, ...props }) {
  // Extract the text content from the code element inside <pre>
  const codeElement = children?.props ? children : null;
  const codeText = codeElement?.props?.children || "";
  const className = codeElement?.props?.className || "";
  const language = className.replace("hljs language-", "").replace("language-", "");

  return (
    <div className="codeBlockWrapper">
      <div className="codeBlockHeader">
        <span className="codeBlockLang">{language || "code"}</span>
        <CopyButton text={String(codeText).replace(/\n$/, "")} showLabel={true} />
      </div>
      <pre className="codeBlockPre" {...props}>{children}</pre>
    </div>
  );
}

export default CodeBlock;
