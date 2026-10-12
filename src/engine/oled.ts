import { CFG } from '../config/simConfig'
import { systemState, type Sim } from './physicsEngine'
/** Single source of truth for OLED text (dashboard + 3D overlay). */
export function oledText(s: Sim): string {
  if (s.waterLevel < CFG.lowWater) return '!! LOW WATER !!\nREFILL TANK'
  if (s.sensorOff) return 'SENSOR ERR: MOIST\nIRRIGATION OFF'
  if (s.pumpOn) return 'IRRIGATING...'
  if (s.fanOn) return 'AERATING...'
  return `MOIST ${s.moisture.toFixed(0)}%  SOIL ${s.soilTemp.toFixed(1)}C\nAIR ${s.airTemp.toFixed(1)}C  RH ${s.humidity.toFixed(0)}%\nWATER ${s.waterLevel.toFixed(0)}%\nLUX ${(s.lux / 1000).toFixed(1)}k DLI ${s.dli.toFixed(1)}\nSTATE: ${systemState(s)}`
}
