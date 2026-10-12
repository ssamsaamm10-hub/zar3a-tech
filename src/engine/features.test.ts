import { it, expect } from 'vitest'
import { initialSim, tick } from './physicsEngine'
import { riskIndex } from './risk'
import { oledText } from './oled'
import { useTwin } from '../store/useTwinStore'
it('risk rises with wet humid hot soil', () => { const lo = riskIndex(initialSim()).score; const hi = riskIndex({ ...initialSim(), moisture: 90, humidity: 95, soilTemp: 34, waterlogT: 400 }); expect(hi.score).toBeGreaterThan(lo); expect(hi.label).toBe('Critical') })
it('never waters saturated humid soil (root-rot priority)', () => { const s = { ...initialSim(), moisture: 65, humidity: 80, trigger: 99 }; s.irrig.timer = 0; expect(tick(s, 0.1).pumpOn).toBe(false) })
it('low battery disables fan and pump', () => { const s = { ...initialSim(), acLoss: true, battery: 10, humidity: 90, moisture: 10 }; s.irrig.timer = 0; const n = tick(s, 0.1); expect(n.fanOn).toBe(false); expect(n.pumpOn).toBe(false) })
it('waterlogging >60 s forces fan', () => { const s = { ...initialSim(), moisture: 85, waterlogT: 61 }; expect(tick(s, 0.1).fanOn).toBe(true) })
it('DLI integrates and resets at midnight', () => { const a = tick({ ...initialSim(), luxOverride: 10000 }, 100); expect(a.dli).toBeGreaterThan(0); expect(tick({ ...a, t: 86399.9, luxOverride: 10000 }, 1).dli).toBe(0) })
it('OLED alarm preempts pages', () => { expect(oledText({ ...initialSim(), waterLevel: 5 })).toContain('LOW WATER'); expect(oledText({ ...initialSim(), sensorOff: true })).toContain('SENSOR ERR') })
it('manual pump watchdog cuts at 10 s', () => { const st = useTwin.getState(); st.reset(); st.setSpeed(1); st.patch({ manualPump: true }); for (let i = 0; i < 110; i++) useTwin.getState().step(); expect(useTwin.getState().sim.manualPump).toBe(false) })
it('refill raises level to 100', () => { const st = useTwin.getState(); st.reset(); st.setSpeed(60); st.patch({ waterLevel: 10 }); st.refill(); for (let i = 0; i < 40; i++) useTwin.getState().step(); expect(useTwin.getState().sim.waterLevel).toBe(100) })
