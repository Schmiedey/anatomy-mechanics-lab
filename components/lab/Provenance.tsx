'use client';

export type ProvenanceKind = 'calculated' | 'estimated' | 'assumed';

export const PROVENANCE: Record<
  ProvenanceKind,
  { label: string; short: string; detail: string }
> = {
  calculated: {
    label: 'Calculated',
    short: 'calc.',
    detail:
      'From the load, lever, and angle you set, using r × F. This is the most physically grounded output.',
  },
  estimated: {
    label: 'Estimated',
    short: 'est.',
    detail:
      'Derived by this model from simplified geometry or assumed parameters. Internally consistent, not measured.',
  },
  assumed: {
    label: 'Assumed',
    short: 'asm.',
    detail:
      'A hand-authored parameter. Not measured from the displayed anatomy or from a person.',
  },
};

export function Mark({
  kind,
  compact = false,
}: {
  kind: ProvenanceKind;
  compact?: boolean;
}) {
  const meta = PROVENANCE[kind];
  return (
    <abbr className={`mark mark-${kind}`} title={meta.detail}>
      {compact ? meta.short : meta.label}
    </abbr>
  );
}

export function ProvenanceLegend() {
  return (
    <div className="provenance-banner">
      <p className="provenance-note">
        Interactive mechanics model, not a validated human simulator. Bone
        meshes are visual only.
      </p>
      <ul className="provenance-legend" aria-label="How to read these numbers">
        {(Object.keys(PROVENANCE) as ProvenanceKind[]).map((kind) => (
          <li key={kind}>
            <Mark kind={kind} />
            <span>{legendCopy[kind]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const legendCopy: Record<ProvenanceKind, string> = {
  calculated: 'from the scenario you set',
  estimated: 'model-derived, not measured',
  assumed: 'hand-authored parameter',
};
