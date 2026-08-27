"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
}

/**
 * Clean, lightweight renderer for AI responses.
 * Formats markdown elements like bold text, headers, lists, tables,
 * inline code, and block quotes cleanly within the AutoLog theme.
 */
export function FormattedMessage({ content }: FormattedMessageProps) {
  if (!content) return null;

  // Split content into blocks by double newlines or single newlines with table/header signals
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];
  let blockKey = 0;

  const renderTable = (header: string[], rows: string[][], key: number) => (
    <div key={`table-${key}`} className="my-3 w-full overflow-x-auto rounded-lg border border-border/70 bg-card/60 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border/80 bg-muted/40 font-semibold text-foreground">
          <tr>
            {header.map((cell, idx) => (
              <th key={idx} className="px-3 py-2 whitespace-nowrap">
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40 text-muted-foreground">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3 py-2 whitespace-nowrap">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for markdown table line
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());

      // Divider line like |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
        tableRows = [];
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Flush table
      elements.push(renderTable(tableHeader, tableRows, blockKey++));
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }

    if (!trimmed) {
      elements.push(<div key={`space-${blockKey++}`} className="h-1.5" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h3-${blockKey++}`} className="mt-3 mb-1 text-sm font-bold text-foreground">
          {parseInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h2-${blockKey++}`} className="mt-4 mb-1.5 text-base font-bold text-foreground">
          {parseInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={`h1-${blockKey++}`} className="mt-4 mb-2 text-lg font-bold text-foreground">
          {parseInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`li-${blockKey++}`} className="flex items-start gap-2 my-0.5 text-xs text-foreground/90 leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span>{parseInline(trimmed.slice(2))}</span>
        </div>
      );
      continue;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={`num-${blockKey++}`} className="flex items-start gap-2 my-0.5 text-xs text-foreground/90 leading-relaxed">
          <span className="font-semibold text-primary text-[11px] min-w-[16px] shrink-0">
            {numMatch[1]}.
          </span>
          <span>{parseInline(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${blockKey++}`} className="text-xs text-foreground/90 leading-relaxed my-1">
        {parseInline(line)}
      </p>
    );
  }

  if (inTable) {
    elements.push(renderTable(tableHeader, tableRows, blockKey++));
  }

  return <div className="space-y-1 text-xs">{elements}</div>;
}

/**
 * Parses inline formatting like **bold**, `code`, and currency highlights
 */
function parseInline(text: string): React.ReactNode {
  // Regex for **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-primary">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
