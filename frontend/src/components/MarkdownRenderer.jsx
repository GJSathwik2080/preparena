import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`max-w-none text-zinc-900 dark:text-gray-200 text-sm md:text-base leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n') || codeString.length > 40)) {
              return <CodeBlock language={match ? match[1] : 'code'} code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.08] text-zinc-900 dark:text-cyan-300 font-mono text-[0.9em] border border-zinc-200 dark:border-white/[0.08] inline-block font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed text-zinc-900 dark:text-gray-200">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 space-y-1.5 mb-3 text-zinc-800 dark:text-gray-300">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 space-y-1.5 mb-3 text-zinc-800 dark:text-gray-300">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed text-zinc-800 dark:text-gray-300">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-zinc-900 dark:border-cyan-500/60 pl-4 py-1 my-3 text-zinc-700 dark:text-gray-300 italic bg-zinc-100 dark:bg-white/[0.02] rounded-r-lg">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-zinc-200 dark:border-white/10">
                <table className="w-full text-left border-collapse text-xs md:text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-zinc-100 dark:bg-white/[0.06] p-3 font-semibold text-zinc-900 dark:text-cyan-300 border-b border-zinc-200 dark:border-white/10">{children}</th>;
          },
          td({ children }) {
            return <td className="p-3 border-b border-zinc-200 dark:border-white/5 text-zinc-800 dark:text-gray-300">{children}</td>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-800 dark:border-white/10 bg-zinc-900 dark:bg-[#080b14] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 dark:border-white/[0.06] bg-zinc-950 dark:bg-white/[0.03] text-xs font-mono text-zinc-400 dark:text-gray-400">
        <span className="uppercase font-bold tracking-wider text-[11px] text-cyan-400">{language || 'snippet'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-zinc-400 hover:text-white transition px-2 py-1 rounded-md hover:bg-white/10 text-[11px]"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 font-mono text-xs md:text-sm text-gray-200 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    </div>
  );
}
