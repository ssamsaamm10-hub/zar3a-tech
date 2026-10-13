import { useEffect } from 'react'
import { useTwin } from './store/useTwinStore'
import { systemState } from './engine/physicsEngine'
import type { Sim } from './engine/physicsEngine'
import { CFG } from './config/simConfig'
import Scene from './components/Scene'
import { oledText } from './engine/oled'
import { RiskGauge, TankGlyph, Wiring, AnchorEditor, Tour, noisy, downloadCsv } from './components/Panels'
import Spark from './components/Spark'
type K = 'moisture' | 'airTemp' | 'humidity' | 'waterLevel'
const Slider = ({ label, k, min, max, thr }: { label: string; k: K; min: number; max: number; thr: number }) => {
  const v = useTwin(s => s.sim[k]); const patch = useTwin(s => s.patch)
  const bad = k === 'moisture' || k === 'waterLevel' ? v < thr : v > thr
  return <div className="row"><label style={{ width: 'clamp(80px,28%,120px)' }}>{label}</label>
    <input type="range" aria-label={label} min={min} max={max} value={v} onChange={e => patch({ [k]: +e.target.value })} />
    <span className="mono" style={{ width: 70, color: bad ? '#f87171' : '#34d399' }}>{v.toFixed(1)} {bad ? '▲!' : '✓'}</span></div>
}
export default function App() {
  const { step, speed, setSpeed, paused, setPaused, model, setModel, reset, patch, log } = useTwin()
  const s = useTwin(x => x.sim)
  useEffect(() => { const id = setInterval(step, CFG.stepMs); return () => clearInterval(id) }, [step])
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === '1') setModel('assembled'); if (e.key === '2') setModel('cutaway') }; addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [setModel])
  return <div className="app">
    <div className="vp"><div className="ov">
      <div className="card sw"><span className="ttl"><b>ZAR3A-TECH</b> · {model.toUpperCase()}<br /></span>
        <button onClick={() => setModel('assembled')}>ASSEMBLED (1)</button><button onClick={() => setModel('cutaway')}>CUTAWAY (2)</button></div>
      <div className="oled">{oledText(s)}</div></div><Scene /></div>
    <div className="panel">
      <Tour /><div className="oled oled-panel">{oledText(s)}</div>
      <div className="card">State: <b>{systemState(s)}</b> · Pump CH1 {s.pumpOn ? 'ON' : 'OFF'} · Fan CH2 {s.fanOn ? 'ON' : 'OFF'} · {s.acLoss ? `BATTERY ${s.battery.toFixed(0)}%` : 'DC ADAPTER'}<br />
        <button onClick={() => setPaused(!paused)}>{paused ? 'Resume' : 'Pause'}</button>
        {([1, 5, 20, 60] as const).map(x => <button key={x} style={{ opacity: speed === x ? 1 : 0.5 }} onClick={() => setSpeed(x)}>{x}×</button>)}
        <button onClick={reset}>Reset</button><button onClick={() => useTwin.getState().demo()}>▶ Demo</button><button onClick={() => useTwin.getState().setTour(0)}>Tour</button><button onClick={downloadCsv}>CSV</button></div>
      {s.sensorOff && <div className="card" style={{ borderColor: '#f87171' }}>Irrigation suspended — soil sensor offline</div>}
      <div className="card mono">Moisture {s.sensorOff ? 'ERR' : noisy(s.moisture).toFixed(1)}% · Soil {noisy(s.soilTemp).toFixed(1)}°C · Air {noisy(s.airTemp).toFixed(1)}°C · RH {noisy(s.humidity).toFixed(0)}% · Lux {s.lux.toFixed(0)} · DLI {s.dli.toFixed(2)} · Water {s.waterLevel.toFixed(0)}% ({(s.waterLevel * 15).toFixed(0)} mL)</div>
      <div className="card"><Slider label="Soil Moisture %" k="moisture" min={0} max={100} thr={30} /><Slider label="Air Temp °C" k="airTemp" min={5} max={45} thr={32} />
        <Slider label="Humidity %" k="humidity" min={10} max={100} thr={75} /><Slider label="Water Level %" k="waterLevel" min={0} max={100} thr={10} />
        <button onClick={() => patch({ moisture: 70 })}>Fresh Watered</button><button onClick={() => patch({ airTemp: 38, humidity: 35 })}>Heat Wave</button>
        <button onClick={() => patch({ humidity: 90, ambientRH: 90 })}>Humid Spike</button><button onClick={() => patch({ moisture: 22 })}>Dry Spell</button></div>
      <div className="card"><b>Faults</b><br />
        <label><input type="checkbox" checked={s.sensorOff} onChange={e => patch({ sensorOff: e.target.checked })} /> Moisture sensor disconnect</label><br />
        <label><input type="checkbox" checked={s.acLoss} onChange={e => patch({ acLoss: e.target.checked })} /> Mains power loss</label><br />
        <button onClick={() => patch({ waterLevel: 8 })}>Force low water</button><button onClick={() => useTwin.getState().refill()}>Refill Tank</button>
        <button onPointerDown={() => patch({ manualPump: true })} onPointerUp={() => patch({ manualPump: false })} onPointerLeave={() => patch({ manualPump: false })}>Hold: manual pump</button></div>
      <div className="card"><Spark k="moisture" label="Moisture" /><Spark k="humidity" label="Humidity" /><Spark k="airTemp" label="Air °C" /><Spark k="soilTemp" label="Soil °C" /><Spark k="waterLevel" label="Water %" /></div>
      <TankGlyph /><RiskGauge /><Wiring /><AnchorEditor />
      <div className="card mono" style={{ maxHeight: 160, overflow: 'auto', fontSize: 12 }}><button onClick={() => useTwin.setState({ log: [] })}>Clear log</button>{log.map((l, i) => <div key={i}>{l}</div>)}</div>
    </div></div>
}
