import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './MarkdownRenderer.css';

/**
 * Reusable Markdown renderer supporting:
 * - Bold and italic text
 * - Numbered and bulleted lists
 * - Inline code and scrollable code blocks
 * - Mathematical expressions via KaTeX ($inline$ and $$display$$)
 * - Headings, paragraphs, blockquotes, and tables
 * - Safe rendering (no arbitrary HTML execution)
 * - Responsive layout with container overflow protection
 *
 * @param {object} props
 * @param {string} props.content - Markdown text to render
 * @param {string} [props.className] - Optional extra CSS class
 */
export const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`markdown-content-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          code: ({ node, className: codeClassName, children, ...props }) => {
            const isCodeBlock = codeClassName?.includes('language-') || String(children).includes('\n');
            if (isCodeBlock) {
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="markdown-inline-code" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
