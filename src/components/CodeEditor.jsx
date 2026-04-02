import React, { useCallback, useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { debounce } from "lodash";

/**
 * CodeEditor Component - Professional HTSL code editor with syntax highlighting
 * Unreal Blueprint-style design with two-way sync capability
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

  // Debounced handler
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
    alert("✓ Code copied to clipboard!");
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
    if (window.confirm("Are you sure you want to clear all code?")) {
      setDisplayCode("");
      onCodeChange("");
    }
  };

  const lineCount = displayCode.split("\n").length;
  const charCount = displayCode.length;

  return (
    <div className="h-full flex flex-col rounded-xl border border-indigo-500/30 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-b border-indigo-500/20 p-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-indigo-300 text-sm font-bold uppercase tracking-wider">
            📝 HTSL Code Editor
          </span>
          {isLoading && (
            <span className="inline-flex items-center gap-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded text-xs text-yellow-300 font-medium">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Syncing...
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSelectAll}
            className="px-3 py-2 text-xs font-medium bg-indigo-600/40 hover:bg-indigo-500/60 border border-indigo-500/40 hover:border-indigo-400/60 text-indigo-200 rounded-lg transition-all duration-200"
            title="Select all code"
          >
            Select All
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-2 text-xs font-medium bg-indigo-600/40 hover:bg-indigo-500/60 border border-indigo-500/40 hover:border-indigo-400/60 text-indigo-200 rounded-lg transition-all duration-200"
            title="Copy to clipboard"
          >
            📋 Copy
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 text-xs font-medium bg-emerald-600/40 hover:bg-emerald-500/60 border border-emerald-500/40 hover:border-emerald-400/60 text-emerald-200 rounded-lg transition-all duration-200"
            title="Download as .htsl file"
          >
            ⬇️ Download
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-2 text-xs font-medium bg-red-600/40 hover:bg-red-500/60 border border-red-500/40 hover:border-red-400/60 text-red-200 rounded-lg transition-all duration-200"
            title="Clear all code"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Textarea (actual input) */}
        <textarea
          ref={textAreaRef}
          value={displayCode}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-indigo-100 font-mono text-sm resize-none outline-none border-none focus:ring-0 z-10 opacity-60 hover:opacity-70 transition-opacity"
          spellCheck="false"
          placeholder="# HTSL Code Editor&#10;# Edit code to update visual nodes&#10;&#10;on_event &quot;join&quot; {&#10;  send_message &quot;Welcome!&quot;&#10;}"
        />

        {/* Syntax Highlighted Display (behind textarea) */}
        <div className="absolute inset-0 p-4 overflow-auto pointer-events-none bg-gradient-to-br from-slate-900/50 to-slate-950/50">
          <SyntaxHighlighter
            language="javascript"
            style={oneDark}
            customStyle={{
              margin: 0,
              padding: 0,
              background: "transparent",
              fontSize: "0.875rem",
              lineHeight: "1.6",
              fontFamily: "'Monaco', 'Courier New', monospace",
            }}
            wrapLongLines={true}
          >
            {displayCode || "# Ready to edit"}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Footer with Stats */}
      <div className="bg-gradient-to-r from-slate-900/40 to-slate-800/40 border-t border-indigo-500/20 px-4 py-3 text-xs text-indigo-300/70 font-mono flex justify-between items-center">
        <div className="space-x-4">
          <span>
            Lines: <span className="text-indigo-200 font-bold">{lineCount}</span>
          </span>
          <span>
            Characters: <span className="text-indigo-200 font-bold">{charCount}</span>
          </span>
        </div>
        <div className="text-xs text-indigo-400/50">
          {isFocused ? "Editing..." : "Ready"}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
