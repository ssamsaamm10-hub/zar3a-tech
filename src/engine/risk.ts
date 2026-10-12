import { CFG } from '../config/simConfig'
import type { Sim } from './physicsEngine'
const c = (v: number) => Math.min(1, Math.max(0, v))
export function riskIndex(s: Sim): { score: number; label: string } {
  const w = CFG.risk.w
  const score = w[0] * c((s.moisture - 40) / 50) + w[1] * c((s.humidity - 60) / 40) + w[2] * c((s.soilTemp - 22) / 12) + w[3] * c(s.waterlogT / 300)
  const i = CFG.risk.bands.filter(b => score >= b).length
  return { score, label: CFG.risk.labels[i] }
}
