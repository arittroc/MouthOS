import type { ImageSearchResponse } from "@/lib/types";

export function PhotoAssessment({ data }: { data: ImageSearchResponse }) {
  const { assessment: a } = data;
  return <section aria-label="Photo assessment" className="mb-8 rounded-3xl border border-indigo-300/20 bg-indigo-500/[0.06] p-5 sm:p-7">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold text-white">Photo assessment</h2>
      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-indigo-100">{a.assessable ? `${a.urgency} · suggested care urgency` : "Photo cannot be assessed"}</span>
    </div>
    <p className="mt-4 leading-7 text-slate-200">{a.summary}</p>
    <p className="mt-2 text-xs text-slate-400">AI observations and possibilities, not a confirmed diagnosis.</p>
    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      {([ ["Visible findings", a.findings], ["Possible causes and why", a.possibleCauses], ["What to do next", a.nextSteps] ] as const).map(([title, items]) => items.length ? <div key={title}>
        <h3 className="text-sm font-medium text-indigo-200">{title}</h3>
        <ul className="mt-2 list-disc space-y-2 pl-4 text-sm leading-6 text-slate-300">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
      </div> : null)}
      <div><h3 className="text-sm font-medium text-indigo-200">What a photo cannot tell us</h3><p className="mt-2 text-sm leading-6 text-slate-400">{a.limitations}</p></div>
    </div>
    <p className="mt-6 rounded-xl border border-amber-300/20 bg-amber-500/10 p-3 text-xs leading-6 text-amber-100">If you have trouble breathing or swallowing, rapidly spreading facial or neck swelling, or uncontrolled bleeding, seek emergency care now. Do not wait for an AI result. <a href="https://www.nhs.uk/conditions/dental-abscess/" target="_blank" rel="noreferrer" className="underline">Emergency signs</a></p>
    {data.retrievalWarning ? <p role="status" className="mt-4 text-sm text-amber-200">{data.retrievalWarning}</p> : null}
    {data.retrieval ? <p className="mt-4 text-xs leading-5 text-slate-500">Atlas passages below relate to the search “{data.retrieval.query}”. They are reference material, not proof of a diagnosis or verification of this assessment.</p> : null}
  </section>;
}
