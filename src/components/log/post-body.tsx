import { Fragment, type ReactNode } from "react";

// Minimal, safe markdown: paragraphs, "- " bullets, **bold**, `code` and [text](https://link).
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) out.push(<strong key={i++} className="font-semibold text-fg">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`"))
      out.push(
        <code key={i++} className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.9em] text-accent">
          {token.slice(1, -1)}
        </code>,
      );
    else {
      const label = token.slice(1, token.indexOf("]"));
      const href = token.slice(token.indexOf("(") + 1, -1);
      const external = href.startsWith("http");
      out.push(
        <a
          key={i++}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer" : undefined}
          className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
        >
          {label}
        </a>,
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function PostBody({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-6 text-[17px] leading-[1.75] text-fg/80">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i} className="list-disc space-y-2 pl-6 marker:text-accent">
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="pt-4 text-2xl font-semibold tracking-tight text-fg">
              {inline(block.slice(3))}
            </h2>
          );
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
