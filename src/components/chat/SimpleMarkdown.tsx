'use client';

// Minimalny renderer markdown dla odpowiedzi agenta.
// Obsługuje: pogrubienie **tekst**, kursywa *tekst*, inline code `x`,
// listy numerowane i nienumerowane, nagłówki (##, ###), nowe linie, linki [a](b).
// Bez żadnych zewnętrznych zależności — szybki, bezpieczny (escape HTML).

import { Fragment } from 'react';

interface Props {
  text: string;
  className?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // bold **text**, italic *text*, code `text`, link [a](b)
  // Wygodniej po kolei: code, bold, italic, link.
  let safe = escapeHtml(text);

  // inline code
  safe = safe.replace(
    /`([^`]+)`/g,
    (_m, c) => `__CODE_START__${c}__CODE_END__`,
  );
  // bold **x**
  safe = safe.replace(
    /\*\*([^*]+)\*\*/g,
    (_m, c) => `__BOLD_START__${c}__BOLD_END__`,
  );
  // italic *x* (but not remaining **)
  safe = safe.replace(
    /(^|[^*])\*([^*\n]+)\*(?!\*)/g,
    (_m, pre, c) => `${pre}__IT_START__${c}__IT_END__`,
  );
  // link [text](url)
  safe = safe.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, t, u) => `__LINK_START__${t}__LINK_MID__${u}__LINK_END__`,
  );

  // Now split by markers and build React nodes.
  const out: React.ReactNode[] = [];
  const tokens = safe
    .split(
      /(__CODE_START__|__CODE_END__|__BOLD_START__|__BOLD_END__|__IT_START__|__IT_END__|__LINK_START__|__LINK_MID__|__LINK_END__)/,
    )
    .filter((t) => t.length > 0);

  type Mode = 'plain' | 'code' | 'bold' | 'italic' | 'linkText' | 'linkUrl';
  let mode: Mode = 'plain';
  let buffer = '';
  let linkText = '';
  let key = 0;

  const flushPlain = () => {
    if (!buffer) return;
    // decode html entities (we escaped earlier — keep decoded for React)
    out.push(
      <Fragment key={`${keyPrefix}-t-${key++}`}>
        {decodeEntities(buffer)}
      </Fragment>,
    );
    buffer = '';
  };

  for (const tok of tokens) {
    switch (tok) {
      case '__CODE_START__':
        flushPlain();
        mode = 'code';
        break;
      case '__CODE_END__':
        out.push(
          <code
            key={`${keyPrefix}-c-${key++}`}
            className="rounded bg-gray-100 text-emerald-700 px-1 py-0.5 text-[0.9em] font-mono"
          >
            {decodeEntities(buffer)}
          </code>,
        );
        buffer = '';
        mode = 'plain';
        break;
      case '__BOLD_START__':
        flushPlain();
        mode = 'bold';
        break;
      case '__BOLD_END__':
        out.push(
          <strong key={`${keyPrefix}-b-${key++}`} className="font-semibold text-gray-900">
            {decodeEntities(buffer)}
          </strong>,
        );
        buffer = '';
        mode = 'plain';
        break;
      case '__IT_START__':
        flushPlain();
        mode = 'italic';
        break;
      case '__IT_END__':
        out.push(
          <em key={`${keyPrefix}-i-${key++}`} className="italic">
            {decodeEntities(buffer)}
          </em>,
        );
        buffer = '';
        mode = 'plain';
        break;
      case '__LINK_START__':
        flushPlain();
        mode = 'linkText';
        break;
      case '__LINK_MID__':
        linkText = buffer;
        buffer = '';
        mode = 'linkUrl';
        break;
      case '__LINK_END__':
        out.push(
          <a
            key={`${keyPrefix}-l-${key++}`}
            href={decodeEntities(buffer)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
          >
            {decodeEntities(linkText)}
          </a>,
        );
        buffer = '';
        linkText = '';
        mode = 'plain';
        break;
      default:
        buffer += tok;
        break;
    }
  }
  flushPlain();
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function SimpleMarkdown({ text, className }: Props) {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let listBuf: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!listBuf) return;
    const Tag = listBuf.ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={`list-${key++}`}
        className={
          listBuf.ordered
            ? 'list-decimal list-inside space-y-0.5 my-1.5'
            : 'list-disc list-inside space-y-0.5 my-1.5'
        }
      >
        {listBuf.items.map((li, i) => (
          <li key={i} className="marker:text-gray-400">
            {renderInline(li, `li-${i}`)}
          </li>
        ))}
      </Tag>,
    );
    listBuf = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    const mH3 = line.match(/^###\s+(.+)$/);
    const mH2 = line.match(/^##\s+(.+)$/);
    const mUl = line.match(/^[-*]\s+(.+)$/);
    const mOl = line.match(/^\d+\.\s+(.+)$/);
    if (mH3) {
      flushList();
      blocks.push(
        <h3 key={`h3-${key++}`} className="font-semibold text-gray-900 mt-2 text-[0.95em]">
          {renderInline(mH3[1], `h3-${key}`)}
        </h3>,
      );
    } else if (mH2) {
      flushList();
      blocks.push(
        <h2 key={`h2-${key++}`} className="font-semibold text-gray-900 mt-2 text-[1em]">
          {renderInline(mH2[1], `h2-${key}`)}
        </h2>,
      );
    } else if (mUl) {
      if (!listBuf || listBuf.ordered) {
        flushList();
        listBuf = { ordered: false, items: [] };
      }
      listBuf.items.push(mUl[1]);
    } else if (mOl) {
      if (!listBuf || !listBuf.ordered) {
        flushList();
        listBuf = { ordered: true, items: [] };
      }
      listBuf.items.push(mOl[1]);
    } else {
      flushList();
      blocks.push(
        <p key={`p-${key++}`} className="leading-relaxed">
          {renderInline(line, `p-${key}`)}
        </p>,
      );
    }
  }
  flushList();

  return <div className={className}>{blocks}</div>;
}
