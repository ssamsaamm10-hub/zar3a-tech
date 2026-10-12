import { create } from 'zustand'
import { tick, initialSim, systemState, type Sim } from '../engine/physicsEngine'
import { CFG } from '../config/simConfig'
type Speed = 1 | 5 | 20 | 60
const HK = ['moisture', 'soilTemp', 'airTemp', 'humidity', 'waterLevel'] as const
type Anch = Record<string, number[]>
interface Store { refilling: boolean; refill: () => void; anchors: Record<'assembled' | 'cutaway', Anch>; showAnchors: boolean; showLabels: boolean; tour: number
  setAnchor: (m: 'assembled' | 'cutaway', n: string, i: number, v: number) => void; setFlag: (k: 'showAnchors' | 'showLabels', v: boolean) => void; setTour: (n: number) => void; demo: () => void; sim: Sim; speed: Speed; paused: boolean; model: 'assembled' | 'cutaway'; log: string[]; hist: Record<string, number[]>
  step: () => void; patch: (p: Partial<Sim>) => void; setSpeed: (s: Speed) => void; setPaused: (p: boolean) => void
  setModel: (m: 'assembled' | 'cutaway') => void; reset: () => void
  addLog: (m: string) => void }
let manualT = 0, n10 = 0
export const useTwin = create<Store>((set, get) => ({
  anchors: JSON.parse(JSON.stringify(CFG.anchors)), showAnchors: false, showLabels: true, tour: 0,
  setAnchor: (m, n, i, v) => { const a = JSON.parse(JSON.stringify(get().anchors)); a[m][n][i] = v; set({ anchors: a }) },
  setFlag: (k, v) => set({ [k]: v } as Partial<Store>), setTour: tour => set({ tour }),
  demo: () => { const g = get(); g.reset(); g.setSpeed(20); g.setPaused(false)
    const T: [number, () => void][] = [[1, () => get().patch({ moisture: 24 })], [14, () => get().patch({ humidity: 88, ambientRH: 88 })], [28, () => get().patch({ waterLevel: 8 })],
      [38, () => get().patch({ waterLevel: 100, ambientRH: 55 })]]
    get().addLog('Demo scenario started'); T.forEach(([t, f]) => setTimeout(f, t * 1000)) },
  refilling: false, refill: () => { set({ refilling: true }); get().addLog('Refill started') },
  sim: initialSim(), speed: 5, paused: false, model: 'cutaway', log: [], hist: {},
  addLog: m => set({ log: [`[${Math.round(get().sim.t)}s] ${m}`, ...get().log].slice(0, 100) }),
  step: () => { const { sim, speed, paused, log } = get(); if (paused) return
    const ev: string[] = []
    let cur = sim
    if (get().refilling) { const lv = Math.min(100, cur.waterLevel + 1.5 * 0.1 * speed); cur = { ...cur, waterLevel: lv }; if (lv >= 100) { set({ refilling: false }); ev.push('Refill complete') } }
    if (cur.manualPump && cur.waterLevel > CFG.dryRun) { manualT += 0.1 * speed; if (manualT > CFG.manualMaxSec) { cur = { ...cur, manualPump: false }; manualT = 0; ev.push('Manual pump watchdog: auto-cut at 10 s') } } else if (!cur.manualPump) manualT = 0
    if (cur.manualPump && cur.moisture > 70) ev.push('Overwatering risk — root rot')
    if (cur.manualPump && cur.waterLevel <= CFG.dryRun) ev.push('DRY-RUN PROTECTION: pump forced off')
    const n = tick(cur, 0.1 * speed)
    if (n.pumpOn !== sim.pumpOn) ev.push(`Pump ${n.pumpOn ? 'ON' : 'OFF'}`)
    if (n.fanOn !== sim.fanOn) ev.push(`Fan ${n.fanOn ? 'ON' : 'OFF'}`)
    if (systemState(n) !== systemState(sim)) ev.push(`State -> ${systemState(n)}`)
    let hist = get().hist
    if (++n10 % 10 === 0) { hist = { ...hist }; for (const k of HK) hist[k] = [...(hist[k] ?? []), n.sensorOff && k === 'moisture' ? NaN : n[k]].slice(-120) }
    set({ sim: n, hist, log: ev.length ? [...ev.map(e => `[${Math.round(n.t)}s] ${e}`), ...log].slice(0, 100) : log }) },
  patch: p => set({ sim: { ...get().sim, ...p } }),
  setSpeed: speed => set({ speed }), setPaused: paused => set({ paused }), setModel: model => set({ model }),
  reset: () => set({ sim: initialSim(), log: [], hist: {} }),
}))
