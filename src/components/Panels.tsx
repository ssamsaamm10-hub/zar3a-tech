import { useState } from 'react'
import { useTwin } from '../store/useTwinStore'
import { riskIndex } from '../engine/risk'
import { CFG } from '../config/simConfig'
export function RiskGauge() {
  const s = useTwin(x => x.sim); const r = riskIndex(s); const col = r.score < 25 ? '#10b981' : r.score < 50 ? '#f59e0b' : '#ef4444'
  return <div className="card"><b>Root-Rot Risk Index</b> <span className="mono" style={{ color: col }}>{r.score.toFixed(0)} · {r.label}{r.score >= 50 ? ' ⚠' : ' ✓'}</span>
    <div style={{ height: 8, background: '#1f2937', borderRadius: 4 }}><div style={{ height: 8, width: `${r.score}%`, background: col, borderRadius: 4 }} /></div></div>
}
export function Wiring() {
  const s = useTwin(x => x.sim); const [open, setOpen] = useState(false)
  const ch = [['CH1 Pump R385', s.pumpOn], ['CH2 Fan 12V', s.fanOn], ['CH3 N/A', false], ['CH4 N/A', false]] as const
  return <div className="card"><button onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'} wiring</button>
    {open && <svg viewBox="0 0 320 170" style={{ width: '100%' }} role="img" aria-label="Wiring schematic">
      <rect x="5" y="55" width="70" height="60" fill="none" stroke="#10b981" /><text x="12" y="80" fill="#d1fae5" fontSize="9">ESP32</text>
      <text x="8" y="95" fill="#94a3b8" fontSize="7">GPIO/ADC: soil,DS18B20,DHT22,LDR</text>
      <rect x="110" y="10" width="90" height="150" fill="none" stroke="#22d3ee" /><text x="115" y="22" fill="#d1fae5" fontSize="8">4-CH opto relay</text>
      {ch.map(([n, on], i) => <g key={n}><line x1="75" y1="85" x2="110" y2={35 + i * 32} stroke="#10b981" /><rect x="120" y={28 + i * 32} width="70" height="16" fill={on ? '#10b981' : '#111'} stroke="#22d3ee" /><text x="123" y={39 + i * 32} fill={on ? '#000' : '#d1fae5'} fontSize="8">{n} {on ? 'ON' : ''}</text>
        {i < 2 && <line x1="190" y1={36 + i * 32} x2="250" y2={36 + i * 32} stroke={on ? '#34d399' : '#475569'} strokeWidth="2" />}</g>)}
      <text x="252" y="39" fill="#d1fae5" fontSize="8">Pump</text><text x="252" y="71" fill="#d1fae5" fontSize="8">Fan</text>
      <text x="215" y="130" fill="#fbbf24" fontSize="8">12V adapter {s.acLoss ? '(lost)' : '(ok)'}</text><text x="215" y="145" fill="#fbbf24" fontSize="8">Li-Ion 3.7V {s.battery.toFixed(0)}%</text></svg>}</div>
}
export function AnchorEditor() {
  const { model, anchors, showAnchors, showLabels, setAnchor, setFlag } = useTwin(); const [k, setK] = useState('pump'); const A = anchors[model]
  return <div className="card"><b>3D tools</b><br />
    <label><input type="checkbox" checked={showLabels} onChange={e => setFlag('showLabels', e.target.checked)} /> Labels</label>{' '}
    <label><input type="checkbox" checked={showAnchors} onChange={e => setFlag('showAnchors', e.target.checked)} /> Show Anchors (debug)</label>
    {showAnchors && <div><select value={k} onChange={e => setK(e.target.value)}>{Object.keys(A).map(n => <option key={n}>{n}</option>)}</select>
      {[0, 1, 2].map(i => <input key={i} type="number" step={0.02} value={A[k][i]} aria-label={`${k} ${'xyz'[i]}`} style={{ width: 60 }} onChange={e => setAnchor(model, k, i, +e.target.value)} />)}
      <button onClick={() => navigator.clipboard?.writeText(JSON.stringify({ [model]: A }, null, 1))}>Copy JSON</button></div>}</div>
}
const STEPS = ['Orbit the 3D twin; press 1 / 2 to switch models.', 'Drag sliders: moisture < 30 starts the pump, RH > 75 starts the fan.', 'Use Faults to test low water, sensor loss and mains loss.', 'Press Demo for a scripted story of dry soil, humidity spike, low water and refill.']
export function Tour() {
  const { tour, setTour } = useTwin(); if (tour >= STEPS.length) return null
  return <div className="card tour" >Tour {tour + 1}/{STEPS.length}: {STEPS[tour]}{' '}
    <button onClick={() => setTour(tour + 1)}>Next</button><button onClick={() => setTour(99)}>Skip</button></div>
}
const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2 * CFG.noise / 1.5
export const noisy = (v: number) => v + g()
export function downloadCsv() {
  const h = useTwin.getState().hist; const ks = Object.keys(h); const n = Math.max(0, ...ks.map(k => h[k].length))
  const rows = [['sample', ...ks].join(',')]; for (let i = 0; i < n; i++) rows.push([i, ...ks.map(k => h[k][i] ?? '')].join(','))
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'zar3a_telemetry.csv'; a.click()
}
export function TankGlyph() {
  const w = useTwin(x => x.sim.waterLevel); const col = w < 10 ? '#ef4444' : '#22d3ee'
  return <div className="card row"><svg viewBox="0 0 30 40" width="30" height="40" aria-hidden="true"><rect x="2" y="2" width="26" height="36" fill="none" stroke="#94a3b8" />
    <rect x="3" y={38 - 35 * w / 100} width="24" height={35 * w / 100} fill={col} style={{ transition: 'all .3s' }} /></svg>
    <span className="mono">Water Tank {w.toFixed(0)}% · {(w * CFG.tankMl / 100).toFixed(0)} / {CFG.tankMl} mL {w < 10 ? '⚠ LOW' : '✓'}</span></div>
}
