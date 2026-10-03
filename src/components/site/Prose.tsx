import type { Block } from "@/lib/site-content";

/** Renders paragraphs; consecutive "- " lines become one list. */
export function Prose({ blocks }: { blocks: Block[] }) {
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (list.length) out.push(<ul key={`l${key}`} className="my-2 list-disc space-y-1 pl-5">{list.map((li, i) => <li key={i}>{li}</li>)}</ul>);
    list = [];
  };
  blocks.forEach((b, i) => {
    if (b.startsWith("- ")) list.push(b.slice(2));
    else { flush(i); out.push(<p key={i} className="my-2">{b}</p>); }
  });
  flush(blocks.length);
  return <div className="text-[15px] leading-relaxed text-slate-700">{out}</div>;
}
