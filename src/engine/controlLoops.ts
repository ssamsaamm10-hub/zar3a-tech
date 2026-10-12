import { CFG } from '../config/simConfig'
import type { Sim } from './physicsEngine'
export interface Irrig { phase: 'idle' | 'burst' | 'soak'; timer: number; bursts: number }
/** Fan FSM with hysteresis (uses previous fanOn as state). */
export function fanStep(s: Sim, lowBat: boolean): boolean {
  if (lowBat) return false
  const hot = s.airTemp > CFG.tempOn || s.soilTemp > CFG.tempOn - 2 || (s.fanOn && (s.airTemp > CFG.tempOff || s.soilTemp > CFG.tempOff - 2))
  const humid = s.humidity > CFG.rhOn || (s.fanOn && s.humidity >= CFG.rhOff)
  const wet = !s.sensorOff && (s.waterlogT > 60 || (s.fanOn && s.moisture > CFG.moistureWaterlogRelease))
  return hot || humid || wet || s.t < s.forceFanUntil
}
/** Irrigation FSM: burst/soak pulses, 30->45 hysteresis, cooldown, watchdog, lockouts. */
export function irrigationStep(s: Sim, dt: number, lowBat: boolean): { pumpOn: boolean; irrig: Irrig } {
  const i = { ...s.irrig }
  if (s.manualPump) return { pumpOn: s.waterLevel > CFG.dryRun, irrig: { phase: 'idle', timer: i.timer, bursts: 0 } }
  const locked = s.sensorOff || s.waterLevel < CFG.lowWater || lowBat || (s.humidity > CFG.rhOn && s.moisture > CFG.moistureSaturated)
  if (locked) return { pumpOn: false, irrig: { phase: 'idle', timer: i.timer, bursts: 0 } }
  i.timer -= dt
  if (i.phase === 'idle') {
    if (s.moisture < s.trigger && i.timer <= 0) { i.phase = 'burst'; i.timer = CFG.burstSec; i.bursts = 1 }
  } else if (i.timer <= 0) {
    if (i.phase === 'burst') { i.phase = 'soak'; i.timer = CFG.soakSec }
    else if (s.moisture < CFG.moistureStop && i.bursts < CFG.maxBursts) { i.phase = 'burst'; i.timer = CFG.burstSec; i.bursts++ }
    else { i.phase = 'idle'; i.timer = CFG.minIntervalSec; i.bursts = 0 }
  }
  return { pumpOn: i.phase === 'burst', irrig: i }
}
