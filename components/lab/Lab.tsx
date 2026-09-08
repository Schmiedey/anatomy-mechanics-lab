'use client';
import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Field as BaseField } from '@base-ui/react/field';
import {
  ArrowUpRight,
  ChevronDown,
  RotateCcw,
  Maximize2,
  Play,
  Pause,
  Check,
  Info,
  X,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DEFAULT_STATE, muscles, flexors, extensors, type ModelState } from '@/anatomy/model';
import { solve, sweep } from '@/biomechanics/inverseDynamics';
import type { Overlays } from './ArmScene';
import { Mark, ProvenanceLegend, type ProvenanceKind } from './Provenance';
import { skeleton } from '@/anatomy/skeleton';
const ArmScene = dynamic(() => import('./ArmScene'), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">Preparing anatomical model…</div>
  ),
});
const Chart = dynamic(
  () => import('./Chart').then((m) => ({ default: m.Chart })),
  { ssr: false },
);
const ValidationPanel = dynamic(
  () => import('./Validation').then((m) => ({ default: m.ValidationPanel })),
  { ssr: false },
);
const fmt = (v: number, d = 1) => v.toFixed(d);
function Range({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <BaseField.Root className="range-field">
      <div className="field-label">
        <BaseField.Label>{label}</BaseField.Label>
        <div className="number-wrap">
          <input
            aria-label={label}
            type="number"
            min={min}
            max={max}
            step={step}
            value={editing ? draft : Number(value.toFixed(2))}
            onFocus={() => {
              setDraft(String(Number(value.toFixed(2))));
              setEditing(true);
            }}
            onBlur={() => {
              const n = Number(draft);
              if (draft.trim() && Number.isFinite(n))
                onChange(Math.max(min, Math.min(max, n)));
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n) && n >= min && n <= max) onChange(n);
            }}
          />
          <span>{unit}</span>
        </div>
      </div>
      <Slider
        aria-label={`${label} slider`}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </BaseField.Root>
  );
}
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle-label">
      <span>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </label>
  );
}
export default function Lab() {
  const [state, setState] = useState<ModelState>(
    structuredClone(DEFAULT_STATE),
  );
  const [selected, setSelected] = useState('bicepsLong');
  const [overlays, setOverlays] = useState<Overlays>({
    muscles: false,
    external: true,
    arms: false,
    attachments: false,
    labels: true,
    paths: true,
  });
  const [view, setView] = useState<'anatomy' | 'skeleton'>('anatomy');
  const [resetKey, setResetKey] = useState(0);
  const [focusJoint, setFocusJoint] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [modal, setModal] = useState<'model' | 'debug' | 'experiments' | null>(
    null,
  );
  const [tab, setTab] = useState<
    'simulation' | 'comparison' | 'validation'
  >('simulation');
  const [snapshots, setSnapshots] = useState<{
    A: ModelState | null;
    B: ModelState | null;
  }>({ A: null, B: null });
  const result = useMemo(() => solve(state), [state]);
  const {
    forearm,
    upperArm,
    loadLb,
    loadPosition,
    strengths,
    bicepsInsertion,
    selfWeight,
    hill,
    velocity,
    pronation,
    coContraction,
  } = state;
  const samples = useMemo(
    () =>
      sweep({
        angle: 0,
        forearm,
        upperArm,
        loadLb,
        loadPosition,
        strengths,
        bicepsInsertion,
        selfWeight,
        hill,
        velocity,
        pronation,
        coContraction,
      }),
    [
      forearm,
      upperArm,
      loadLb,
      loadPosition,
      strengths,
      bicepsInsertion,
      selfWeight,
      hill,
      velocity,
      pronation,
      coContraction,
    ],
  );
  const change = <K extends keyof ModelState>(key: K, v: ModelState[K]) =>
    setState((s) => ({ ...s, [key]: v }));
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = 0;
    let direction = 1;
    const tick = (t: number) => {
      if (last) {
        const dt = Math.min(0.05, (t - last) / 1000);
        setState((s) => {
          let next = s.angle + direction * dt * 20;
          if (next >= 140) {
            direction = -1;
            next = 140;
          }
          if (next <= 0) {
            direction = 1;
            next = 0;
          }
          return { ...s, angle: next };
        });
      }
      last = t;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);
  const selectedMuscle = result.muscles.find((m) => m.id === selected);
  const setAngle = (v: number) => {
    setPlaying(false);
    change('angle', v);
  };
  const reset = () => {
    setState(structuredClone(DEFAULT_STATE));
    setPlaying(false);
    setAdvanced(false);
    setSelected('bicepsLong');
    setFocusJoint(false);
    setView('anatomy');
    setOverlays({
      muscles: false,
      external: true,
      arms: false,
      attachments: false,
      labels: true,
      paths: true,
    });
    setResetKey((k) => k + 1);
  };
  const experiment = (id: number) => {
    setState((s) =>
      id === 0
        ? { ...s, forearm: 0.36 }
        : id === 1
          ? { ...s, bicepsInsertion: 0.065 }
          : id === 2
            ? {
                ...s,
                strengths: { ...s.strengths, bicepsLong: 0, bicepsShort: 0 },
              }
            : id === 3
              ? { ...s, pronation: 180 }
              : { ...s, coContraction: 0.35 },
    );
    setModal(null);
  };
  return (
    <main>
      <header className="app-header">
        <Link href="/" className="brand">
          <em>Anatomy</em>
          <strong>Mechanics Lab</strong>
        </Link>
        <div className="header-right">
          <span className="version">Preview 0.2</span>
          <button className="quiet" onClick={() => setModal('model')}>
            Model notes
          </button>
        </div>
      </header>
      <div className="lab-heading">
        <div>
          <h1>
            Elbow Flexion <span>Mechanics Lab</span>
            <span className="model-badge">2 DOF · wrap paths</span>
          </h1>
        </div>
        <button
          className="experiment-button"
          onClick={() => setModal('experiments')}
        >
          Run an experiment
        </button>
      </div>
      <div className="workspace-tabs">
        <div className="tabs">
          <button
            className={tab === 'simulation' ? 'active' : ''}
            onClick={() => setTab('simulation')}
          >
            Simulation
          </button>
          <button
            className={tab === 'comparison' ? 'active' : ''}
            onClick={() => setTab('comparison')}
          >
            Compare configurations{' '}
            {snapshots.A && <span className="tiny-dot" />}
          </button>
          <button
            className={tab === 'validation' ? 'active' : ''}
            onClick={() => setTab('validation')}
          >
            Validation
          </button>
        </div>
        <div className="local-status">
          {state.hill ? 'Hill-type capacity' : 'Static equilibrium'}
          <span>·</span> on-device solver
        </div>
      </div>
      {tab === 'comparison' ? (
        <Comparison
          snapshots={snapshots}
          state={state}
          save={(slot) =>
            setSnapshots((s) => ({ ...s, [slot]: structuredClone(state) }))
          }
          load={(slot) => {
            if (snapshots[slot]) {
              setState(structuredClone(snapshots[slot]!));
              setTab('simulation');
            }
          }}
        />
      ) : tab === 'validation' ? (
        <ValidationPanel />
      ) : (
        <div className="workspace">
          <aside className="controls">
            <div className="panel-title">
              <span>Controls</span>
              <button
                aria-label="Reset all controls"
                title="Reset all controls"
                onClick={reset}
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <section className="control-section angle-control">
              <div className="section-label">Joint</div>
              <div className="angle-readout">
                <span>
                  {fmt(state.angle, 0)}
                  <sup>°</sup>
                </span>
                <span>Elbow flexion</span>
              </div>
              <BaseField.Root>
                <BaseField.Label className="sr-only">
                  Elbow angle
                </BaseField.Label>
                <Slider
                  aria-label="Elbow angle"
                  min={0}
                  max={140}
                  value={[state.angle]}
                  onValueChange={(v) => setAngle(Array.isArray(v) ? v[0] : v)}
                />
              </BaseField.Root>
              <div className="range-ends">
                <span>0° Extension</span>
                <span>140° Flexion</span>
              </div>
              <div className="preset-angles">
                {[0, 45, 90, 140].map((a) => (
                  <button
                    className={Math.round(state.angle) === a ? 'chosen' : ''}
                    key={a}
                    onClick={() => setAngle(a)}
                  >
                    {a}°
                  </button>
                ))}{' '}
              </div>
              <div className="angle-readout forearm-readout">
                <span>
                  {fmt(state.pronation, 0)}
                  <sup>°</sup>
                </span>
                <span>Forearm rotation</span>
              </div>
              <BaseField.Root>
                <BaseField.Label className="sr-only">
                  Forearm rotation
                </BaseField.Label>
                <Slider
                  aria-label="Forearm rotation"
                  min={0}
                  max={180}
                  value={[state.pronation]}
                  onValueChange={(v) =>
                    change('pronation', Array.isArray(v) ? v[0] : v)
                  }
                />
              </BaseField.Root>
              <div className="range-ends">
                <span>0° Supinated</span>
                <span>180° Pronated</span>
              </div>
              <div className="preset-angles">
                {[
                  [0, 'Sup.'],
                  [90, 'Ntrl'],
                  [180, 'Pro.'],
                ].map(([a, label]) => (
                  <button
                    className={Math.round(state.pronation) === a ? 'chosen' : ''}
                    key={a}
                    onClick={() => change('pronation', a as number)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
            <section className="control-section">
              <div className="section-label">Load</div>
              <Range
                label="Dumbbell weight"
                value={state.loadLb}
                min={0}
                max={100}
                unit="lb"
                onChange={(v) => change('loadLb', v)}
              />
              <div className="range-ends">
                <span>0 lb</span>
                <span>100 lb</span>
              </div>
              <Toggle
                label="Include arm self-weight"
                value={state.selfWeight}
                onChange={(v) => change('selfWeight', v)}
              />
            </section>
            <section className="control-section">
              <div className="section-label">Anthropometry</div>
              <Range
                label="Upper arm length"
                value={state.upperArm * 100}
                min={24}
                max={42}
                step={0.5}
                unit="cm"
                onChange={(v) => change('upperArm', v / 100)}
              />
              <Range
                label="Forearm length"
                value={state.forearm * 100}
                min={22}
                max={40}
                step={0.5}
                unit="cm"
                onChange={(v) => change('forearm', v / 100)}
              />
            </section>
            <section className="control-section">
              <div className="section-label">Strength</div>
              {(['flexor', 'extensor'] as const).map((group) => (
                <div key={group}>
                  <div className="muscle-group-label">
                    {group === 'flexor' ? 'Flexors' : 'Extensors'}
                  </div>
                  {(group === 'flexor' ? flexors : extensors).map((m) => (
                    <div
                      className="muscle-range"
                      key={m.id}
                      style={{ '--muscle': m.color } as React.CSSProperties}
                    >
                      <Range
                        label={m.name}
                        value={state.strengths[m.id] * 100}
                        min={0}
                        max={200}
                        step={5}
                        unit="%"
                        onChange={(v) =>
                          change('strengths', {
                            ...state.strengths,
                            [m.id]: v / 100,
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              ))}
              <button
                className="advanced-button"
                onClick={() => setAdvanced(!advanced)}
              >
                Advanced parameters{' '}
                <ChevronDown size={14} className={advanced ? 'rotate' : ''} />
              </button>
              {advanced && (
                <div className="advanced-fields">
                  <Range
                    label="Biceps insertion distance"
                    value={state.bicepsInsertion * 100}
                    min={2}
                    max={8}
                    step={0.1}
                    unit="cm"
                    onChange={(v) => change('bicepsInsertion', v / 100)}
                  />
                  <Range
                    label="Load distance / forearm"
                    value={state.loadPosition}
                    min={0.5}
                    max={1.4}
                    step={0.01}
                    unit="×"
                    onChange={(v) => change('loadPosition', v)}
                  />
                  <Toggle
                    label="Hill-type muscle capacity"
                    value={state.hill}
                    onChange={(v) => change('hill', v)}
                  />
                  {state.hill && (
                    <Range
                      label="Prescribed flexion velocity"
                      value={state.velocity}
                      min={-120}
                      max={120}
                      step={5}
                      unit="°/s"
                      onChange={(v) => change('velocity', v)}
                    />
                  )}
                  {state.hill && (
                    <p className="small-note">
                      Velocity adjusts capacity only. No inertial torque or
                      tendon compliance.
                    </p>
                  )}
                  <Range
                    label="Co-contraction"
                    value={state.coContraction * 100}
                    min={0}
                    max={80}
                    step={5}
                    unit="%"
                    onChange={(v) => change('coContraction', v / 100)}
                  />
                  <p className="small-note">
                    Adds antagonist force, then re-solves agonists so net
                    flexion torque is preserved.
                  </p>
                </div>
              )}
            </section>
            <div className="controls-footer">BodyParts3D atlas · SI units</div>
          </aside>
          <section className="viewport" aria-label="Interactive 3D arm">
            <div className="viewport-top">
              <div className="view-segment">
                <button
                  className={view === 'anatomy' ? 'active' : ''}
                  onClick={() => setView('anatomy')}
                >
                  Anatomy
                </button>
                <button
                  className={view === 'skeleton' ? 'active' : ''}
                  onClick={() => setView('skeleton')}
                >
                  Skeleton
                </button>
              </div>
              <span className="view-caption">
                Right arm ·{' '}
                {state.pronation < 45
                  ? 'supinated'
                  : state.pronation > 135
                    ? 'pronated'
                    : 'neutral'}
              </span>
            </div>
            <div className="scene">
              <ArmScene
                state={state}
                result={result}
                selected={selected}
                onSelect={setSelected}
                overlays={overlays}
                view={view}
                resetKey={resetKey}
                focusJoint={focusJoint}
              />
            </div>
            <div className="viewport-description">
              Elbow complex
              <small>BodyParts3D surfaces · visual only</small>
            </div>
            <button
              className="joint-focus-button"
              onClick={() => {
                setFocusJoint((v) => !v);
                if (!focusJoint) {
                  setView('skeleton');
                  setSelected('ulna');
                }
              }}
            >
              {focusJoint ? 'Show full arm' : 'Inspect elbow joint'}
            </button>
            <div className="camera-tools">
              <button
                title="Reset camera"
                aria-label="Reset camera"
                onClick={() => {
                  setFocusJoint(false);
                  setResetKey((k) => k + 1);
                }}
              >
                <RotateCcw size={17} />
              </button>
              <button
                title="Fullscreen visualization"
                aria-label="Fullscreen visualization"
                onClick={(e) => {
                  const el = e.currentTarget.closest('.viewport');
                  if (document.fullscreenElement)
                    void document.exitFullscreen();
                  else void el?.requestFullscreen();
                }}
              >
                <Maximize2 size={17} />
              </button>
            </div>
            <div className="view-overlays">
              {(['muscles', 'external', 'arms', 'attachments', 'paths'] as const).map(
                (key, i) => (
                  <button
                    key={key}
                    className={overlays[key] ? 'enabled' : ''}
                    aria-pressed={overlays[key]}
                    onClick={() =>
                      setOverlays((o) => ({ ...o, [key]: !o[key] }))
                    }
                  >
                    {
                      [
                        'Muscle forces',
                        'External forces',
                        'Moment arms',
                        'Attachments',
                        'Muscle paths',
                      ][i]
                    }
                  </button>
                ),
              )}
            </div>
            <div className="viewport-bottom">
              <span>Drag to orbit · scroll to zoom</span>
              <button
                onClick={() =>
                  setOverlays((o) => ({ ...o, labels: !o.labels }))
                }
              >
                {overlays.labels ? 'Hide' : 'Show'} labels
              </button>
            </div>
            <div className="playback">
              <button
                aria-label={playing ? 'Pause motion' : 'Play motion'}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </button>
              <div>
                <strong>
                  {playing
                    ? 'Sweeping range of motion'
                    : 'Explore the range of motion'}
                </strong>
                <span>
                  0–140° <i>·</i> Quasi-static angle sweep
                </span>
              </div>
              <span className="playback-angle">{fmt(state.angle, 0)}°</span>
            </div>
          </section>
          <aside className="metrics">
            <div className="panel-title">
              <span>Mechanics</span>
            </div>
            <ProvenanceLegend />
            <div className="torque-summary">
              <div className="torque-heading">
                <span className="eyebrow">Required flexion torque</span>
                <Mark kind="calculated" />
              </div>
              <div className="torque-number">
                {fmt(result.external.requiredTorque)}
                <span>N·m</span>
              </div>
              <div className="summary-row">
                <span>
                  External load <Mark kind="calculated" compact />
                </span>
                <b>{fmt(result.external.loadTorque)} N·m</b>
              </div>
              <div className="summary-row">
                <span>
                  Arm self-weight <Mark kind="estimated" compact />
                </span>
                <b>{fmt(result.external.selfTorque)} N·m</b>
              </div>
              <div className="summary-row">
                <span>
                  Flexor torque <Mark kind="estimated" compact />
                </span>
                <b>{fmt(result.flexorTorque)} N·m</b>
              </div>
              <div className="summary-row">
                <span>
                  Extensor torque <Mark kind="estimated" compact />
                </span>
                <b>{fmt(result.extensorTorque)} N·m</b>
              </div>
              <div
                className={`equilibrium ${!result.recruitment.feasible ? 'warning' : ''}`}
              >
                {result.recruitment.feasible ? (
                  <Check size={13} />
                ) : (
                  <Info size={13} />
                )}{' '}
                {result.recruitment.feasible
                  ? 'Torque equilibrium satisfied in this model'
                  : `${fmt(result.recruitment.residual)} N·m torque deficit`}
              </div>
            </div>
            <div className="muscle-metrics-title">
              Recruitment <span>min Σ aᵢ²</span>
            </div>
            {(['flexor', 'extensor'] as const).map((group) => (
              <div key={group}>
                <div className="muscle-group-label panel-group">
                  {group === 'flexor' ? 'Flexors' : 'Extensors'}
                </div>
                {result.muscles
                  .filter((m) => m.group === group)
                  .map((m) => (
                    <button
                      className={`muscle-card compact ${selected === m.id ? 'selected' : ''}`}
                      key={m.id}
                      onClick={() => setSelected(m.id)}
                      style={{ '--muscle': m.color } as React.CSSProperties}
                    >
                      <div className="muscle-card-heading">
                        <span>
                          <i />
                          {m.shortName}
                        </span>
                      </div>
                      <div className="muscle-force">
                        {fmt(m.force, 0)} <span>N</span>
                        <Mark kind="estimated" compact />
                        <small>
                          {fmt(m.activation * 100, 0)}% · {fmt(m.torque, 1)} N·m
                        </small>
                      </div>
                      <div className="capacity-track">
                        <span style={{ width: `${m.activation * 100}%` }} />
                      </div>
                    </button>
                  ))}
              </div>
            ))}
            <div className="selection-details">
              <div className="eyebrow">Selected</div>
              <strong>
                {selectedMuscle?.name ??
                  ({
                    humerus: 'Humerus',
                    radius: 'Radius',
                    ulna: 'Ulna',
                    hand: 'Hand',
                  }[selected] ||
                    selected)}
              </strong>
              {selectedMuscle ? (
                <>
                  <div className="summary-row">
                    <span>
                      Flexion moment arm <Mark kind="estimated" compact />
                    </span>
                    <b>{fmt(selectedMuscle.momentArm * 100, 2)} cm</b>
                  </div>
                  <div className="summary-row">
                    <span>
                      Supination moment arm <Mark kind="estimated" compact />
                    </span>
                    <b>
                      {fmt(-selectedMuscle.pronationMomentArm * 100, 2)} cm
                    </b>
                  </div>
                  <div className="summary-row">
                    <span>
                      Path length <Mark kind="estimated" compact />
                    </span>
                    <b>{fmt(selectedMuscle.length * 100)} cm</b>
                  </div>
                  <div className="summary-row">
                    <span>
                      Mechanical advantage <Mark kind="estimated" compact />
                    </span>
                    <b>
                      {selectedMuscle.mechanicalAdvantage === null
                        ? '—'
                        : fmt(selectedMuscle.mechanicalAdvantage, 3)}
                    </b>
                  </div>
                  <div className="summary-row">
                    <span>
                      Available force <Mark kind="estimated" compact />
                    </span>
                    <b>{fmt(selectedMuscle.capacity, 0)} N</b>
                  </div>
                  <div className="summary-row">
                    <span>
                      Maximum isometric force <Mark kind="assumed" compact />
                    </span>
                    <b>
                      {fmt(
                        selectedMuscle.maxIsometricForce *
                          state.strengths[selectedMuscle.id],
                        0,
                      )}{' '}
                      N
                    </b>
                  </div>
                </>
              ) : (
                <p className="small-note">
                  {skeleton.bones
                    .find((b) => b.id === selected)
                    ?.features.join(' · ') ??
                    'Schematic hand, rigidly attached to the forearm.'}
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
      <section className="graphs">
        <div className="graphs-header">
          <div>
            <h2>Mechanics across motion</h2>
            <span>
              Model outputs versus elbow angle. Stamps mark calculated versus
              estimated values.
            </span>
          </div>
          <div className="legend">
            {muscles.map((m) => (
              <span key={m.id}>
                <i style={{ background: m.color }} />
                {m.shortName}
              </span>
            ))}
          </div>
          <span className="graph-range">0° — 140°</span>
        </div>
        <div className="plots">
          {(['torque', 'arm', 'force', 'length'] as const).map((kind) => (
            <Chart
              key={kind}
              kind={kind}
              samples={samples}
              angle={state.angle}
              onAngle={setAngle}
              result={result}
            />
          ))}
        </div>
      </section>
      <footer className="app-footer">
        <span>Deterministic solver · runs on this device</span>
        <button onClick={() => setModal('debug')}>Inspect calculations</button>
        <span>
          Atlas anatomy · labeled mechanics{' '}
          <button
            onClick={() => setModal('model')}
            aria-label="Model limitations"
          >
            Notes
          </button>
        </span>
      </footer>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open) setModal(null);
        }}
      >
        <DialogContent className="modal" showCloseButton={false}>
          <DialogTitle className="sr-only">
            {modal === 'debug'
              ? 'Raw calculations'
              : modal === 'model'
                ? 'Model notes'
                : 'Experiments'}
          </DialogTitle>
          <button
            className="modal-close"
            aria-label="Close dialog"
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>
          {modal === 'experiments' ? (
            <>
              <span className="eyebrow">CHANGE ONE VARIABLE</span>
              <h2>Your next experiment</h2>
              <p>
                Modify the current configuration and observe the solver
                recalculate.
              </p>
              {[
                'Lengthen the forearm',
                'Move the biceps insertion',
                'Disable the biceps',
                'Pronate the forearm',
                'Add co-contraction',
              ].map((title, i) => (
                <button
                  className="experiment-option"
                  key={title}
                  onClick={() => experiment(i)}
                >
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>
                      {
                        [
                          'Set forearm length to 36 cm. Explore the increase in external torque.',
                          'Set insertion distance to 6.5 cm. Compare leverage and recruitment.',
                          'Set both biceps heads to 0%. Observe force redistribution or a torque deficit.',
                          'Set forearm rotation to full pronation. Watch biceps path, length and moment arms change.',
                          'Set co-contraction to 35%. Extensors fire; flexors increase to keep net torque.',
                        ][i]
                      }
                    </p>
                  </div>
                  <ArrowUpRight size={20} />
                </button>
              ))}
              <p className="small-note">
                Tip: save configuration A in Compare before running an
                experiment.
              </p>
            </>
          ) : modal === 'debug' ? (
            <>
              <span className="eyebrow">ENGINE INSPECTOR · SI UNITS</span>
              <h2>Every number, inspectable.</h2>
              <pre>
                {JSON.stringify(
                  {
                    angleRad: result.kinematics.q,
                    pronationRad: result.kinematics.pronation,
                    pathPoints: result.muscles.map((m) => ({
                      id: m.id,
                      points: m.points,
                    })),
                    forearmCOM: result.kinematics.forearmCOM,
                    loadPosition: result.kinematics.load,
                    gravity: result.external.gravity,
                    loadForce: result.external.loadForce,
                    loadTorqueVector: result.external.torqueVector,
                    requiredTorque: result.external.requiredTorque,
                    achievedTorque: result.recruitment.achievedTorque,
                    torqueEquilibriumError: result.recruitment.residual,
                    maximumTorque: result.recruitment.maximumTorque,
                    feasible: result.recruitment.feasible,
                    objective: result.recruitment.objective,
                    muscles: result.muscles.map((m) => ({
                      name: m.name,
                      origin: m.origin,
                      insertion: m.insertion,
                      length: m.length,
                      momentArm: m.momentArm,
                      force: m.force,
                      capacity: m.capacity,
                      activation: m.activation,
                      fiberLength: m.fiberLength,
                      forceLength: m.forceLength,
                      forceVelocity: m.forceVelocity,
                    })),
                  },
                  null,
                  2,
                )}
              </pre>
              <p className="small-note">
                This engine solves joint torque equilibrium only. Translational
                force equilibrium and joint reaction forces are not implemented.
              </p>
            </>
          ) : (
            <ModelNotes />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Comparison({
  snapshots,
  state,
  save,
  load,
}: {
  snapshots: { A: ModelState | null; B: ModelState | null };
  state: ModelState;
  save: (s: 'A' | 'B') => void;
  load: (s: 'A' | 'B') => void;
}) {
  const a = snapshots.A ? solve(snapshots.A) : null,
    b = snapshots.B ? solve(snapshots.B) : null;
  const rows: Array<
    [string, ProvenanceKind, number | null, number | null, string]
  > = [
    [
      'External torque',
      'calculated',
      a?.external.loadTorque ?? null,
      b?.external.loadTorque ?? null,
      'N·m',
    ],
    [
      'Required torque',
      'calculated',
      a?.external.requiredTorque ?? null,
      b?.external.requiredTorque ?? null,
      'N·m',
    ],
  ];
  muscles.forEach((m, i) => {
    rows.push(
      [
        `${m.name} · force`,
        'estimated',
        a?.muscles[i].force ?? null,
        b?.muscles[i].force ?? null,
        'N',
      ],
      [
        `${m.name} · moment arm`,
        'estimated',
        a ? a.muscles[i].momentArm * 100 : null,
        b ? b.muscles[i].momentArm * 100 : null,
        'cm',
      ],
      [
        `${m.name} · mechanical advantage`,
        'estimated',
        a?.muscles[i].mechanicalAdvantage ?? null,
        b?.muscles[i].mechanicalAdvantage ?? null,
        '',
      ],
    );
  });
  return (
    <section className="comparison">
      <div className="comparison-intro">
        <h2>One change. Model consequences.</h2>
        <p>
          Save the current settings into a slot, change the model, then save a
          second configuration. Differences are model outputs, not measurements.
        </p>
      </div>
      <div className="snapshot-row">
        {(['A', 'B'] as const).map((slot) => (
          <div key={slot} className="snapshot">
            <span className="slot-letter">{slot}</span>
            <div>
              <h3>Configuration {slot}</h3>
              <p>
                  {snapshots[slot]
                  ? `${fmt(snapshots[slot]!.angle, 0)}° flexion · ${fmt(snapshots[slot]!.pronation, 0)}° forearm · ${snapshots[slot]!.loadLb} lb · ${fmt(snapshots[slot]!.forearm * 100)} cm forearm`
                  : 'No configuration saved yet'}
              </p>
            </div>
            <button onClick={() => save(slot)}>Save {slot}</button>
            {snapshots[slot] && (
              <button className="quiet" onClick={() => load(slot)}>
                Load
              </button>
            )}
          </div>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Configuration A</th>
            <th>Configuration B</th>
            <th>Difference B − A</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, kind, va, vb, unit]) => (
            <tr key={label}>
              <td>
                {label} <Mark kind={kind} compact />
              </td>
              <td>{va === null ? '—' : `${fmt(va, unit ? 2 : 3)} ${unit}`}</td>
              <td>{vb === null ? '—' : `${fmt(vb, unit ? 2 : 3)} ${unit}`}</td>
              <td>
                {va === null || vb === null
                  ? '—'
                  : `${vb - va > 0 ? '+' : ''}${fmt(vb - va, unit ? 2 : 3)} ${unit}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small-note">
        Snapshots retain their own angle, load, anatomy and physiology. Graphs
        below show the current working configuration ({fmt(state.angle, 0)}°).
        Calculated rows use the scenario lever; estimated rows use this model’s
        attachments and recruitment solver.
      </p>
    </section>
  );
}
function ModelNotes() {
  return (
    <>
      <span className="eyebrow">MODEL NOTES · VERSION 0.2</span>
      <h2>A transparent mechanical model.</h2>
      <p>
        This educational model represents a fixed humerus, an ulna that flexes
        about a hinge, and a radius that both flexes and pronates around the
        forearm axis. The humerus, radius, ulna and flexor muscle surfaces come
        from the BodyParts3D anatomical atlas. Extensor paths are mechanical
        polylines only; there is no triceps atlas mesh yet. Bone registration
        and muscle deformation are approximate.
      </p>
      <h3>How to read the numbers</h3>
      <p>
        Every live value is stamped as calculated, estimated, or assumed. Treat
        torque from the external load as the strongest output. Individual muscle
        forces and activation percentages are one possible solution of this
        solver, not EMG or a clinical prediction.
      </p>
      <table>
        <thead>
          <tr>
            <th>Stamp</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Mark kind="calculated" />
            </td>
            <td>
              Lever physics from the load, distance, and angle you set. Example:
              external load torque.
            </td>
          </tr>
          <tr>
            <td>
              <Mark kind="estimated" />
            </td>
            <td>
              Derived by this model from simplified paths, generic
              anthropometry, or assumed strengths. Examples: self-weight, moment
              arms, recruited force.
            </td>
          </tr>
          <tr>
            <td>
              <Mark kind="assumed" />
            </td>
            <td>
              Hand-authored parameters. Examples: maximum isometric force,
              attachment points, forearm mass.
            </td>
          </tr>
        </tbody>
      </table>
      <h3>Anatomical assets</h3>
      <p>
        BodyParts3D, © The Database Center for Life Science licensed under CC
        Attribution-Share Alike 2.1 Japan. Source meshes are converted to the
        lab coordinate frame, scaled and, for muscles, stretched along the
        calculated path. These adapted assets retain the same license.
      </p>
      <a
        className="source-link"
        href={skeleton.source.url}
        target="_blank"
        rel="noreferrer"
      >
        BodyParts3D source atlas ↗
      </a>
      <span> · </span>
      <a
        className="source-link"
        href={skeleton.source.licenseUrl}
        target="_blank"
        rel="noreferrer"
      >
        Asset license ↗
      </a>
      <h3>Geometry & gravity</h3>
      <p>
        At 0°, the arm hangs vertically. Flexion rotates the forearm toward the
        upper arm. Gravity acts along −Y. External torque is the Z component of
        r × F. Optional self-weight uses a 1.2 kg forearm with its center of
        mass at 43% of length, plus a 0.45 kg hand.
      </p>
      <h3>Muscle paths & recruitment</h3>
      <p>
        Each muscle is a polyline: origin, optional via points (some
        conditional on joint angle), wrapping on cylinders or spheres, then
        insertion. Attachments live on the humerus, ulna or radius. Moment arms
        are −dL/dθ from path length, including wrap geometry. The solver
        minimizes Σ(Fᵢ / capacityᵢ)² subject to signed torque equilibrium and
        force bounds. Extensors have negative flexion moment arms. Optional
        co-contraction forces antagonists, then re-solves agonists so net
        torque is preserved when feasible.
      </p>
      <h3>Simplified Hill-type physiology</h3>
      <p>
        Optional active force capacity uses a Gaussian force–length curve and a
        bounded Hill-like force–velocity curve, fixed pennation and a rigid
        tendon. Prescribed velocity changes capacity without inertial dynamics.
        The animation is a quasi-static sweep. Recruitment is a model estimate,
        not measured neural activation.
      </p>
      <h3>Editable reference parameters</h3>
      <table>
        <thead>
          <tr>
            <th>Muscle</th>
            <th>Fmax</th>
            <th>Fiber / tendon</th>
            <th>Pennation</th>
          </tr>
        </thead>
        <tbody>
          {muscles.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>{m.maxIsometricForce} N</td>
              <td>
                {fmt(m.optimalFiberLength * 100)} /{' '}
                {fmt(m.tendonSlackLength * 100)} cm
              </td>
              <td>{fmt((m.pennationAngle * 180) / Math.PI, 0)}°</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        These reference values and attachment points are illustrative
        engineering assumptions, partly inspired by Holzbaur-type upper-extremity
        models. Biceps long and short heads originate on proximal humerus
        stand-ins for the supraglenoid tubercle and coracoid; the scapula is not
        in this scene. Validation compares simulated moment arms with
        characteristic curves reconstructed from Murray, Delp and Buchanan
        (1995, 2002). That comparison does not make the model a validated
        clinical simulator. Paths have no ligament or contact forces; joint
        reaction estimates are absent. Mechanical advantage is muscle moment
        arm divided by the load’s perpendicular moment arm and is undefined at
        zero load moment arm.
      </p>
      <a
        className="source-link"
        href="https://opensimconfluence.atlassian.net/wiki/spaces/OpenSim/pages/53089619/How+Static+Optimization+Works"
        target="_blank"
        rel="noreferrer"
      >
        Method reference: OpenSim static optimization <ArrowUpRight size={14} />
      </a>
    </>
  );
}
