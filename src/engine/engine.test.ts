import { it, expect } from 'vitest'
import { initialSim, tick } from './physicsEngine'
const dry = (o = {}) => { const s = { ...initialSim(), moisture: 20, ...o }; s.irrig.timer = 0; return tick(s, 0.1) }
it('irrigates when dry', () => expect(dry().pumpOn).toBe(true))
it('locks out at low water', () => expect(dry({ waterLevel: 8 }).pumpOn).toBe(false))
it('locks out on sensor disconnect', () => expect(dry({ sensorOff: true }).pumpOn).toBe(false))
it('fan hysteresis', () => { const s = tick({ ...initialSim(), humidity: 80 }, 0.1); expect(s.fanOn).toBe(true); expect(tick({ ...s, humidity: 70 }, 0.1).fanOn).toBe(true); expect(tick({ ...s, humidity: 60, ambientRH: 60 }, 0.1).fanOn).toBe(false) })
it('dry-run beats manual', () => expect(tick({ ...initialSim(), manualPump: true, waterLevel: 2 }, 0.1).pumpOn).toBe(false))
