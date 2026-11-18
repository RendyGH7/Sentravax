import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Sanitize URLs to prevent XSS (only allows safe protocols).
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}

/**
 * Render inline markdown elements (bold, italic, code, link) safely.
 */
function renderInline(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={match.index} className="font-semibold text-slate-900 dark:text-slate-100">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('[') && token.includes('](')) {
      const closeBracket = token.indexOf('](');
      const label = token.slice(1, closeBracket);
      const url = token.slice(closeBracket + 2, -1);
      const safeHref = sanitizeUrl(url);

      elements.push(
        <a
          key={match.index}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-600 dark:text-teal-400 hover:underline font-medium inline-flex items-center gap-0.5"
        >
          {label}
        </a>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];

  let inList: 'ul' | 'ol' | null = null;
  let listItems: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      const ListTag = inList;
      nodes.push(
        <ListTag
          key={`list-${nodes.length}`}
          className={`my-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-300 ${
            inList === 'ul' ? 'list-disc list-inside' : 'list-decimal list-inside'
          }`}
        >
          {listItems}
        </ListTag>
      );
      listItems = [];
      inList = null;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const header = tableRows[0];
      const rows = tableRows.slice(1);

      nodes.push(
        <div key={`table-${nodes.length}`} className="my-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold">
              <tr>
                {header.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                    {col.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
              {rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {row.map((col, cIdx) => (
                    <td key={cIdx} className="px-3 py-2">
                      {renderInline(col.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      if (/^\|[\s-:]+\|$/.test(trimmed.replace(/\|/g, '|').trim()) || trimmed.replace(/[|\s-:]/g, '') === '') {
        continue;
      }
      const cols = trimmed.slice(1, -1).split('|');
      tableRows.push(cols);
      inTable = true;
      continue;
    } else {
      flushTable();
    }

    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      flushList();
      nodes.push(
        <h4 key={`h4-${i}`} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushList();
      nodes.push(
        <h3 key={`h3-${i}`} className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2.5">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      nodes.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 pb-1 border-b border-slate-200 dark:border-slate-800">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      nodes.push(
        <h1 key={`h1-${i}`} className="text-2xl font-extrabold text-slate-900 dark:text-white mt-6 mb-3">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Callout / Quote
    if (trimmed.startsWith('>')) {
      flushList();
      nodes.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 pl-4 border-l-4 border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 py-2 pr-3 rounded-r text-sm text-slate-700 dark:text-slate-300 italic"
        >
          {renderInline(trimmed.slice(1).trim())}
        </blockquote>
      );
      continue;
    }

    // Bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inList !== 'ul') {
        flushList();
        inList = 'ul';
      }
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {renderInline(trimmed.slice(2))}
        </li>
      );
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (inList !== 'ol') {
        flushList();
        inList = 'ol';
      }
      listItems.push(
        <li key={`li-${i}`} className="leading-relaxed">
          {renderInline(numMatch[2])}
        </li>
      );
      continue;
    }

    // Paragraph
    flushList();
    nodes.push(
      <p key={`p-${i}`} className="my-2.5 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`safe-markdown leading-relaxed ${className}`}>{nodes}</div>;
};

export default SafeMarkdown;

