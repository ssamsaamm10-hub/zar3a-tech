import { Component, Suspense, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, ContactShadows, Bounds, Html, useProgress } from '@react-three/drei'
import * as THREE from 'three'
import { useTwin } from '../store/useTwinStore'
import Overlay3D from './Overlay3D'
const URLS = { assembled: '/models/zar3a_assembled.glb', cutaway: '/models/zar3a_cutaway.glb' }
class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}
function Fallback() { return <group>
  <mesh><cylinderGeometry args={[0.6, 0.45, 1, 32]} /><meshStandardMaterial color="#334155" /></mesh>
  <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.58, 0.58, 0.04, 32]} /><meshStandardMaterial color="#3b2a1a" /></mesh>
  <mesh position={[-0.9, 0, 0]}><boxGeometry args={[0.3, 0.8, 0.5]} /><meshStandardMaterial color="#22d3ee" transparent opacity={0.5} /></mesh>
  <mesh position={[0.9, 0, 0]}><boxGeometry args={[0.3, 0.6, 0.5]} /><meshStandardMaterial color="#10b981" /></mesh></group> }
function Model({ url, name }: { url: string; name: 'assembled' | 'cutaway' }) {
  const { scene } = useGLTF(url)
  const k = useRef(name === useTwin.getState().model ? 1 : 0); const base = useRef(1)
  const obj = useMemo(() => { const c = scene.clone(true); const b = new THREE.Box3().setFromObject(c)
    const sz = b.getSize(new THREE.Vector3()); c.position.sub(b.getCenter(new THREE.Vector3()))
    c.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) m.material = Array.isArray(m.material) ? m.material.map(x => x.clone()) : m.material.clone() })
    const g = new THREE.Group(); g.add(c); base.current = 2 / Math.max(sz.x, sz.y, sz.z); g.scale.setScalar(base.current)
    const names: string[] = []; c.traverse(o => names.push(o.name)); console.table(names); return g }, [scene])
  useEffect(() => () => obj.traverse(o => { const m = (o as THREE.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()) }), [obj])
  useFrame((_, d) => { // ~400 ms cross-fade
    k.current += ((useTwin.getState().model === name ? 1 : 0) - k.current) * Math.min(1, d / 0.13)
    obj.visible = k.current > 0.01; obj.scale.setScalar(base.current * (0.96 + 0.04 * k.current))
    obj.traverse(o => { const m = (o as THREE.Mesh).material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => { x.transparent = k.current < 0.99; x.opacity = k.current }) }) })
  return <primitive object={obj} />
}
Object.values(URLS).forEach(u => useGLTF.preload(u))
function Stream({ kind }: { kind: 'water' | 'air' }) {
  const ref = useRef<THREE.Points>(null); const k = useRef(0); const N = kind === 'water' ? 300 : 200
  const pos = useMemo(() => new Float32Array(N * 3), [N])
  useFrame((_, d) => {
    const s = useTwin.getState(); const on = kind === 'water' ? s.sim.pumpOn : s.sim.fanOn
    k.current += ((on ? 1 : 0) - k.current) * Math.min(1, d * 3); const t = performance.now() / 1000
    const A = s.anchors[s.model]
    for (let i = 0; i < N; i++) { const u = (i / N + t * 0.4) % 1
      if (kind === 'water') { pos[i*3] = (A.pump[0] + (A.soil[0] - A.pump[0]) * u) * 2 + Math.sin(i) * 0.02
        pos[i*3+1] = (A.pump[1] + (A.soil[1] - A.pump[1]) * u) * 2 + Math.sin(u * Math.PI) * 0.3; pos[i*3+2] = Math.cos(i) * 0.02 }
      else { const r = 0.5 * (1 - u) + 0.1; pos[i*3] = Math.cos(u * 12 + i) * r; pos[i*3+1] = -0.8 + u * 1.8; pos[i*3+2] = Math.sin(u * 12 + i) * r } }
    const p = ref.current; if (p) { p.geometry.attributes.position.needsUpdate = true; (p.material as THREE.PointsMaterial).opacity = (kind === 'water' ? 0.9 : 0.35) * k.current }
  })
  return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[pos, 3]} /></bufferGeometry>
    <pointsMaterial color={kind === 'water' ? '#38bdf8' : '#a5f3fc'} size={0.04} transparent blending={THREE.AdditiveBlending} depthWrite={false} /></points>
}
function Loader() { const { progress } = useProgress(); return <Html center><div className="card mono">ZAR3A loading {progress.toFixed(0)}%</div></Html> }
export default function Scene() {
  const model = useTwin(s => s.model)
  return <Canvas dpr={[1, 2]} camera={{ position: [3, 2, 4], fov: 40 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
    <color attach="background" args={['#0b1210']} />
    <Environment preset="studio" /><directionalLight position={[3, 5, 2]} intensity={1.2} />
    <Suspense fallback={<Loader />}>
      <Bounds fit clip observe margin={1.3}>{(['assembled', 'cutaway'] as const).map(m => <Boundary key={m} fallback={<group visible={m === model}><Fallback /></group>}><Model url={URLS[m]} name={m} /></Boundary>)}</Bounds>
    </Suspense>
    <Overlay3D /><Stream kind="water" /><Stream kind="air" />
    <ContactShadows position={[0, -1.1, 0]} opacity={0.5} blur={2.5} />
    <OrbitControls makeDefault enableDamping maxPolarAngle={Math.PI / 2 - 0.05} minDistance={1.5} maxDistance={12} />
  </Canvas>
}
