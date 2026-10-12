import { useTwin } from '../store/useTwinStore'
export default function Spark({ k, label }: { k: string; label: string }) {
  const d = useTwin(s => s.hist[k]) ?? []
  const ok = d.filter(x => !isNaN(x)); const lo = Math.min(...ok, 0), hi = Math.max(...ok, 1)
  const pts = d.map((v, i) => isNaN(v) ? null : `${(i / 119) * 100},${28 - ((v - lo) / (hi - lo || 1)) * 26}`)
  const segs: string[][] = [[]]; pts.forEach(p => p ? segs[segs.length - 1].push(p) : segs.push([]))
  const last = d[d.length - 1], prev = d[d.length - 6]
  return <div className="row"><small style={{ width: 70 }}>{label}</small><svg viewBox="0 0 100 30" style={{ flex: 1, height: 30 }} aria-label={`${label} trend`}>
    {segs.map((s, i) => <polyline key={i} points={s.join(' ')} fill="none" stroke="#22d3ee" strokeWidth="1" />)}</svg>
    <span className="mono">{isNaN(last) ? 'ERR' : last === undefined ? '' : last > prev + 0.05 ? '↑' : last < prev - 0.05 ? '↓' : '→'}</span></div>
}
