<script setup lang="ts">
// Detailed WebGL hero car (three.js) — physical car-paint with clearcoat +
// environment reflections, alloy wheels, mirrors, spoiler, LED lights.
// Auto-rotates, wheels spin, drag to orbit. Client-only.
withDefaults(defineProps<{ height?: string }>(), { height: '460px' })

const container = ref<HTMLElement | null>(null)
let cleanup: (() => void) | null = null

onMounted(async () => {
  const el = container.value
  if (!el) return

  try {
  const THREE: any = await import('three')
  const { OrbitControls }: any = await import('three/examples/jsm/controls/OrbitControls.js')
  const { RoundedBoxGeometry }: any = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js')
  const { RoomEnvironment }: any = await import('three/examples/jsm/environments/RoomEnvironment.js')

  let w = el.clientWidth || 480
  let h = el.clientHeight || 460

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100)
  camera.position.set(6.2, 3.2, 6.8)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  renderer.domElement.style.borderRadius = 'inherit'
  el.appendChild(renderer.domElement)

  // Studio reflections for glossy paint/glass
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  // ── Lights ──
  scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a2960, 0.7))
  const key = new THREE.DirectionalLight(0xffffff, 2.6)
  key.position.set(5, 9, 5)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0002
  Object.assign(key.shadow.camera, { near: 1, far: 30, left: -8, right: 8, top: 8, bottom: -8 })
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xec4899, 1.0); rim.position.set(-6, 3, -5); scene.add(rim)
  const fill = new THREE.DirectionalLight(0x38bdf8, 0.5); fill.position.set(2, 2, -6); scene.add(fill)

  // ── Shadow catcher ──
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.32 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.05
  ground.receiveShadow = true
  scene.add(ground)

  // ── Materials ──
  const M = THREE.MeshPhysicalMaterial
  const S = THREE.MeshStandardMaterial
  const paint = new M({ color: 0x4f46e5, metalness: 0.55, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.3 })
  const accent = new M({ color: 0xec4899, metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 })
  const trim = new S({ color: 0x0f1115, metalness: 0.4, roughness: 0.5 })
  const chrome = new S({ color: 0xe5e7eb, metalness: 1.0, roughness: 0.18, envMapIntensity: 1.6 })
  const glass = new M({ color: 0x0b1220, metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.55, envMapIntensity: 1.8 })
  const tireMat = new S({ color: 0x141417, metalness: 0.1, roughness: 0.9 })
  const headMat = new S({ color: 0xfff7d6, emissive: 0xfde68a, emissiveIntensity: 1.8 })
  const tailMat = new S({ color: 0xf43f5e, emissive: 0xfb1d3a, emissiveIntensity: 1.6 })

  const car = new THREE.Group()
  const wheels: any[] = []
  let camTargetY = 0.05

  // Real GLB model (public/models/car.glb) if present, else the procedural car below.
  const carModel = await loadCarModel(THREE, '/models/car.glb', 4.2)
  if (carModel) {
    carModel.position.y = -1.05 // sit on the shadow/ground plane
    car.add(carModel)
    const bb = new THREE.Box3().setFromObject(carModel)
    camTargetY = (bb.min.y + bb.max.y) / 2
  } else {

  // helper: build a mesh, position it (position is read-only on Object3D, so use .set), add to car
  const add = (geo: any, material: any, pos: number[], cast = true) => {
    const m = new THREE.Mesh(geo, material)
    m.position.set(pos[0], pos[1], pos[2])
    m.castShadow = cast
    car.add(m)
    return m
  }

  // sill / lower body (darker)
  add(new RoundedBoxGeometry(3.95, 0.42, 1.78, 5, 0.16), trim, [0, -0.42, 0])
  // main body
  add(new RoundedBoxGeometry(3.85, 0.7, 1.72, 6, 0.3), paint, [0, 0.02, 0])
  // hood + trunk accent line (thin)
  add(new RoundedBoxGeometry(3.6, 0.08, 1.5, 3, 0.04), accent, [0, 0.34, 0], false)
  // cabin (greenhouse)
  add(new RoundedBoxGeometry(1.95, 0.72, 1.5, 5, 0.26), paint, [-0.28, 0.66, 0])
  // window band (black frame) + glass
  add(new RoundedBoxGeometry(2.0, 0.5, 1.54, 4, 0.16), trim, [-0.28, 0.66, 0], false)
  add(new RoundedBoxGeometry(2.02, 0.42, 1.56, 4, 0.14), glass, [-0.28, 0.68, 0], false)

  // bumpers
  add(new RoundedBoxGeometry(0.4, 0.4, 1.74, 4, 0.14), trim, [1.78, -0.18, 0])
  add(new RoundedBoxGeometry(0.4, 0.4, 1.74, 4, 0.14), trim, [-1.78, -0.18, 0])
  // grille
  add(new THREE.BoxGeometry(0.06, 0.26, 0.9), chrome, [1.96, 0, 0], false)

  // headlights (front corners) + LED tail bar
  for (const z of [0.56, -0.56]) add(new RoundedBoxGeometry(0.14, 0.2, 0.36, 3, 0.06), headMat, [1.86, 0.14, z], false)
  add(new THREE.BoxGeometry(0.08, 0.14, 1.4), tailMat, [-1.9, 0.18, 0], false)

  // side mirrors
  for (const z of [0.82, -0.82]) {
    add(new THREE.BoxGeometry(0.16, 0.06, 0.08), trim, [0.55, 0.5, z], false)
    add(new RoundedBoxGeometry(0.1, 0.18, 0.22, 2, 0.05), chrome, [0.62, 0.52, z * 1.12], false)
  }
  // rear spoiler
  add(new RoundedBoxGeometry(0.5, 0.06, 1.5, 3, 0.03), trim, [-1.7, 0.5, 0], false)
  for (const z of [0.6, -0.6]) add(new THREE.BoxGeometry(0.18, 0.18, 0.07), trim, [-1.66, 0.4, z], false)

  // ── Alloy wheels (torus tire + metallic rim + spokes) ──
  const tireGeo = new THREE.TorusGeometry(0.42, 0.17, 18, 30)
  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 26)
  const spokeGeo = new THREE.BoxGeometry(0.52, 0.08, 0.09)
  const capGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.22, 16)
  for (const [x, z] of [[1.18, 0.86], [-1.18, 0.86], [1.18, -0.86], [-1.18, -0.86]]) {
    const g = new THREE.Group()
    const t = new THREE.Mesh(tireGeo, tireMat); t.castShadow = true; g.add(t)
    const r = new THREE.Mesh(rimGeo, chrome); r.rotation.x = Math.PI / 2; g.add(r)
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(spokeGeo, chrome); s.rotation.z = i * (Math.PI * 2 / 5); g.add(s) }
    const cap = new THREE.Mesh(capGeo, chrome); cap.rotation.x = Math.PI / 2; g.add(cap)
    g.position.set(x, -0.46, z)
    car.add(g); wheels.push(g)
  }
  }

  scene.add(car)

  // ── Controls ──
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableDamping = true
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.5
  controls.minPolarAngle = Math.PI / 3.6
  controls.maxPolarAngle = Math.PI / 2.05
  controls.target.set(0, camTargetY, 0)

  // ── Animate ──
  let raf = 0
  const clock = new THREE.Clock()
  const render = () => {
    raf = requestAnimationFrame(render)
    const t = clock.getElapsedTime()
    car.position.y = Math.sin(t * 2) * 0.05
    for (const g of wheels) g.rotation.z = -t * 6
    controls.update()
    renderer.render(scene, camera)
  }
  render()

  // ── Resize ──
  const ro = new ResizeObserver(() => {
    w = el.clientWidth; h = el.clientHeight
    if (!w || !h) return
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h)
  })
  ro.observe(el)

  cleanup = () => {
    cancelAnimationFrame(raf)
    ro.disconnect(); controls.dispose()
    scene.traverse((o: any) => {
      o.geometry?.dispose?.()
      const m = o.material
      if (m) (Array.isArray(m) ? m : [m]).forEach((x: any) => x.dispose?.())
    })
    pmrem.dispose(); renderer.dispose(); renderer.domElement.remove()
  }
  } catch (e) {
    console.error('[Car3D] init failed:', e)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="container" class="car3d" :style="{ height }"></div>
</template>

<style scoped>
.car3d {
  position: relative;
  width: 100%;
  border-radius: 1.5rem;
  overflow: hidden;
  background:
    radial-gradient(130% 90% at 28% 0%, rgba(255,255,255,0.22), transparent 55%),
    radial-gradient(80% 60% at 80% 100%, rgba(236,72,153,0.35), transparent 60%),
    linear-gradient(160deg, #1e1b4b 0%, #4c1d95 48%, #831843 100%);
  box-shadow: 0 40px 70px -22px rgba(15, 23, 42, 0.5), 0 8px 24px -8px rgba(99, 102, 241, 0.4);
  cursor: grab;
  touch-action: pan-y;
}
.car3d:active { cursor: grabbing; }
</style>
