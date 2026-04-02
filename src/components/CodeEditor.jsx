import React, { useCallback, useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { debounce } from "lodash";

/**
 * CodeEditor Component - Editable HTSL code with syntax highlighting
 * Two-way sync with visual editor
 */
export const CodeEditor = ({ code, onCodeChange, isLoading = false }) => {
  const [displayCode, setDisplayCode] = useState(code);
  const [isFocused, setIsFocused] = useState(false);
  const textAreaRef = React.useRef(null);

  // Update display when code prop changes (from visual editor)
  useEffect(() => {
    if (!isFocused) {
      setDisplayCode(code);
    }
  }, [code, isFocused]);

  // Debounced handler to prevent excessive updates
  const debouncedOnChange = useCallback(
    debounce((newCode) => {
      onCodeChange(newCode);
    }, 500),
    [onCodeChange]
  );

  const handleChange = (e) => {
    const newCode = e.target.value;
    setDisplayCode(newCode);
    debouncedOnChange(newCode);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(displayCode);
    alert("Code copied to clipboard!");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([displayCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "housing.htsl";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSelectAll = () => {
    textAreaRef.current?.select();
  };

  const handleClear = () => {
    if (window.confirm("Clear all code?")) {
      setDisplayCode("");
      onCodeChange("");
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-3 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-sm font-mono">📄 HTSL Code</span>
          {isLoading && <span className="text-xs text-slate-400">(syncing...)</span>}
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={handleSelectAll}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
            title="Select all code"
          >
            Select All
          </button>
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
            title="Copy to clipboard"
          >
            📋 Copy
          </button>
          <button
            onClick={handleDownload}
            className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
            title="Download as file"
          >
            ⬇️ Download
          </button>
          <button
            onClick={handleClear}
            className="px-2 py-1 text-xs bg-red-700 hover:bg-red-600 text-slate-300 rounded transition"
            title="Clear all code"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-hidden relative">
        {/* Textarea (actual input) */}
        <textarea
          ref={textAreaRef}
          value={displayCode}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full h-full p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none outline-none border-none focus:ring-0 z-10 opacity-50"
          spellCheck="false"
          placeholder="// HTSL code appears here&#10;// Edit here to update the visual editor!"
        />

        {/* Syntax Highlighted Display (behind textarea) */}
        <div className="absolute inset-0 p-4 overflow-auto pointer-events-none">
          <SyntaxHighlighter
            language="javascript"
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: 0,
              background: "transparent",
              fontSize: "0.875rem",
              lineHeight: "1.5",
            }}
            wrapLongLines={true}
          >
            {displayCode || "// Edit code here"}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 border-t border-slate-700 px-3 py-2 text-xs text-slate-400 font-mono">
        Lines: <span className="text-slate-300">{displayCode.split("\n").length}</span> | Chars:{" "}
        <span className="text-slate-300">{displayCode.length}</span>
      </div>
    </div>
  );
};

export default CodeEditor;
