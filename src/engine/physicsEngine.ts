import { CFG } from '../config/simConfig'
import { irrigationStep, fanStep, type Irrig } from './controlLoops'
export interface Sim {
  moisture: number; soilTemp: number; airTemp: number; humidity: number; lux: number
  waterLevel: number; battery: number; ambientRH: number; t: number
  pumpOn: boolean; fanOn: boolean; acLoss: boolean; sensorOff: boolean
  manualPump: boolean; luxOverride: number | null; trigger: number; dli: number; forceFanUntil: number; irrig: Irrig; waterlogT: number
}
export const initialSim = (): Sim => ({ ...CFG.defaults, t: 0, pumpOn: false, fanOn: false, acLoss: false, sensorOff: false,
  manualPump: false, luxOverride: null, trigger: CFG.moistureLow, dli: 0, forceFanUntil: 0, irrig: { phase: 'idle', timer: CFG.minIntervalSec, bursts: 0 }, waterlogT: 0 })
const cl = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v))
export const dayLux = (t: number) => Math.max(0, Math.sin(((t % 86400) / 86400) * 2 * Math.PI - Math.PI / 2)) * 25000
/** Pure: advance sim by dt sim-seconds. */
export function tick(s: Sim, dt: number): Sim {
  const n: Sim = { ...s, t: s.t + dt, irrig: { ...s.irrig } }
  const min = dt / 60
  n.lux = s.luxOverride ?? dayLux(n.t)
  n.waterlogT = n.moisture > CFG.moistureWaterlog ? s.waterlogT + dt : 0
  n.dli = Math.floor(n.t / 86400) > Math.floor(s.t / 86400) ? 0 : s.dli + n.lux * CFG.luxToPpfd * dt / 1e6
  const lowBat = n.acLoss && n.battery <= CFG.lowBattery
  n.fanOn = fanStep(n, lowBat)
  const p = irrigationStep(n, dt, lowBat)
  n.irrig = p.irrig; n.pumpOn = p.pumpOn
  if (n.waterLevel <= CFG.dryRun) n.pumpOn = false // dry-run cutout, even in manual
  const k = CFG.kBase * (1 + CFG.a * (n.airTemp - 20) / 10 + CFG.b * (1 - n.humidity / 100) + CFG.c * n.lux / 10000) * (n.fanOn ? CFG.fanDryBoost : 1)
  n.moisture = cl(n.moisture - k * (n.moisture / 100) * min)
  if (n.pumpOn) {
    n.moisture = cl(n.moisture + CFG.pumpGainPerSec * dt * Math.max(0, 1 - n.moisture / CFG.pumpGainCap))
    n.waterLevel = cl(n.waterLevel - (CFG.pumpMlPerSec / CFG.tankMl) * 100 * dt)
  }
  const d = n.ambientRH - n.humidity
  n.humidity = cl(n.humidity + d * Math.min(1, CFG.rhRelaxPerMin * min) + (n.fanOn ? Math.sign(d) * Math.min(Math.abs(d), CFG.fanRhPullPerMin * min) : 0), 10, 100)
  n.soilTemp += (n.airTemp - n.soilTemp) * (1 - Math.exp(-dt / CFG.soilTau))
  n.battery = n.acLoss ? cl(n.battery - CFG.batteryDrainPerMin * min * (1 + (n.pumpOn ? 1 : 0) + (n.fanOn ? 0.5 : 0))) : 100
  return n
}
export function systemState(s: Sim): 'NOMINAL' | 'IRRIGATING' | 'AERATING' | 'WARNING' | 'FAILSAFE' {
  if (s.sensorOff) return 'FAILSAFE'
  if (s.waterLevel < CFG.lowWater || (s.acLoss && s.battery <= CFG.lowBattery)) return 'WARNING'
  if (s.pumpOn) return 'IRRIGATING'
  return s.fanOn ? 'AERATING' : 'NOMINAL'
}
