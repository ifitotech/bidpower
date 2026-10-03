import type { Block } from "@/lib/site-content";

/** Renders paragraphs; consecutive "- " lines become one bullet list and consecutive "1. " lines one numbered list. */
export function Prose({ blocks }: { blocks: Block[] }) {
  const out: React.ReactNode[] = [];
  let kind: "ul" | "ol" | null = null;
  let items: string[] = [];
  const flush = (key: number) => {
    if (kind && items.length) {
      const Tag = kind;
      out.push(<Tag key={`l${key}`} className={`my-2 space-y-1 pl-5 ${kind === "ul" ? "list-disc" : "list-decimal"}`}>{items.map((li, i) => <li key={i}>{li}</li>)}</Tag>);
    }
    kind = null; items = [];
  };
  blocks.forEach((b, i) => {
    const bullet = b.startsWith("- ");
    const step = /^\d+\.\s/.test(b);
    if (bullet || step) {
      const next = bullet ? "ul" : "ol";
      if (kind && kind !== next) flush(i);
      kind = next;
      items.push(bullet ? b.slice(2) : b.replace(/^\d+\.\s/, ""));
    } else { flush(i); out.push(<p key={i} className="my-2">{b}</p>); }
  });
  flush(blocks.length);
  return <div className="text-[15px] leading-relaxed text-slate-700">{out}</div>;
}
