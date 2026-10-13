import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useTwin } from '../store/useTwinStore'
import { oledText } from '../engine/oled'
const NAMES: Record<string, string> = { tank: 'Water Tank', bay: 'Dry Bay (ESP32+Relays)', pump: 'R385 Pump', fan: 'Exhaust Fan', soil: 'Soil Layer', probe: 'Moisture Probe', ds18: 'DS18B20', dht: 'DHT22', ldr: 'LDR' }
const at = (m: 'assembled' | 'cutaway', k: string) => useTwin.getState().anchors[m][k].map(v => v * 2) as [number, number, number]
function Alarm() {
  const model = useTwin(s => s.model); const low = useTwin(s => s.sim.waterLevel < 10); const m = useRef<THREE.Mesh>(null)
  useFrame(() => { const mat = m.current?.material as THREE.MeshBasicMaterial | undefined; if (mat) mat.opacity = useTwin.getState().sim.waterLevel < 10 ? 0.3 + 0.25 * Math.sin(performance.now() / 150) : 0 })
  return <group position={at(model, 'tank')}><mesh ref={m}><boxGeometry args={[0.5, 0.8, 0.5]} /><meshBasicMaterial color="#ef4444" transparent opacity={0} depthWrite={false} /></mesh>
    {low && <Html center position={[0, 0.6, 0]}><div className="buzz">🔔 LOW WATER</div></Html>}</group>
}
function Pour() {
  const ref = useRef<THREE.Points>(null); const k = useRef(0); const N = 80; const pos = useMemo(() => new Float32Array(N * 3), [])
  useFrame((_, d) => { const st = useTwin.getState(); k.current += ((st.refilling ? 1 : 0) - k.current) * Math.min(1, d * 4)
    const p = at(st.model, 'refill'); const t = performance.now() / 1000
    for (let i = 0; i < N; i++) { const u = (i / N + t * 1.2) % 1; pos[i * 3] = p[0] + Math.sin(i) * 0.03; pos[i * 3 + 1] = p[1] - u * 0.8; pos[i * 3 + 2] = p[2] + Math.cos(i) * 0.03 }
    const o = ref.current; if (o) { o.geometry.attributes.position.needsUpdate = true; (o.material as THREE.PointsMaterial).opacity = 0.9 * k.current } })
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry><pointsMaterial color="#38bdf8" size={0.05} transparent depthWrite={false} /></points>
}
export default function Overlay3D() {
  const { model, anchors, showAnchors, showLabels, sim } = useTwin()
  const A = anchors[model]
  const active = (k: string) => (k === 'pump' && sim.pumpOn) || (k === 'fan' && sim.fanOn) || (k === 'tank' && sim.waterLevel < 10) || (k === 'probe' && sim.sensorOff)
  const pos = (k: string) => A[k].map(v => v * 2) as [number, number, number]
  return <group><Alarm /><Pour />
    {showLabels && Object.keys(NAMES).map(k => <Html key={k} position={pos(k)} center style={{ pointerEvents: 'none' }}>
      <div style={{ fontSize: 10, whiteSpace: 'nowrap', padding: '1px 5px', borderRadius: 6, color: active(k) ? '#04130d' : '#d1fae5', background: active(k) ? (k === 'tank' || k === 'probe' ? '#f87171' : '#34d399') : 'rgba(11,18,16,.7)', border: '1px solid #10b981' }}>{NAMES[k]}</div></Html>)}
    {model === 'assembled' && <Html position={pos('oled')} center><pre className="oled oled3d" style={{ margin: 0, fontSize: 9, transform: 'scale(.8)' }}>{oledText(sim)}</pre></Html>}
    {showAnchors && Object.keys(A).map(k => <mesh key={k} position={pos(k)}><sphereGeometry args={[0.04]} /><meshBasicMaterial color="#f0abfc" depthTest={false} />
      <Html distanceFactor={8}><small style={{ color: '#f0abfc', fontSize: 9 }}>{k}</small></Html></mesh>)}
  </group>
}
