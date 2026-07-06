<script setup lang="ts">
// Driving-School exam course built from the user's exact described route (right-hand
// traffic, START on the right). The road is a continuous RIBBON along a polyline, so
// every 90° turn is a real bent road. Route: START → pedestrian crossing (stop before
// the line) → estakada (stop before the slope) → 90° turns → central traffic light →
// straight → snake (ilon izi) → reverse parking → finish. Scoring: penalty points,
// 100 = fail; touching a stop line = 5. Views: isometric OVERVIEW + DRIVE (3 cameras).
definePageMeta({ layout: false, middleware: ['auth', 'premium'] })

const i18n = useI18n()

const mode = ref<'overview' | 'drive'>('overview')
const camView = ref<'follow' | 'iso' | 'top'>('follow')
const finished = ref(false)
const passed = ref(false)
const penalty = ref(0)
const MAX_PENALTY = 100
const speedKmh = ref(0)
const gear = ref('N')
const overLimit = ref(false)
const taskText = ref('')
const lastMistake = ref('')
const stepLabel = ref('')
const progress = ref('')
const isTouch = ref(false)
const muted = ref(false)

let driveApi: { start: () => void, toOverview: () => void, cycleCam: () => void } | null = null
function startDrive() { finished.value = false; passed.value = false; penalty.value = 0; lastMistake.value = ''; driveApi?.start() }
function backToOverview() { finished.value = false; driveApi?.toOverview() }
function cycleCam() { driveApi?.cycleCam() }
function speak(text: string) {
  if (muted.value || typeof window === 'undefined' || !window.speechSynthesis) return
  try { const s = window.speechSynthesis; s.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ru-RU'; s.speak(u) } catch { /* */ }
}

let disposed = false
let cleanup = () => {}
onBeforeUnmount(() => { disposed = true; cleanup(); try { window.speechSynthesis?.cancel() } catch { /* */ } })

onMounted(async () => {
  isTouch.value = matchMedia('(pointer: coarse)').matches
  const el = document.getElementById('poligon-canvas')
  if (!el) return
  const THREE: any = await import('three')
  if (disposed) return
  const { OrbitControls }: any = await import('three/examples/jsm/controls/OrbitControls.js')
  const { RoomEnvironment }: any = await import('three/examples/jsm/environments/RoomEnvironment.js')
  if (disposed) return

  let Wd = el.clientWidth || innerWidth
  let Hd = el.clientHeight || innerHeight

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x9ec5e8)
  scene.fog = new THREE.Fog(0x9ec5e8, 320, 640)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(Wd, Hd); renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
  el.appendChild(renderer.domElement)
  cleanup = () => { renderer.dispose(); renderer.domElement.remove() }

  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  scene.add(new THREE.HemisphereLight(0xdfefff, 0x4a5a38, 0.9))
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.4)
  sun.position.set(80, 160, -60); sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { near: 1, far: 460, left: -150, right: 150, top: 120, bottom: -120 })
  sun.shadow.bias = -0.0003
  scene.add(sun)

  function noiseTex(base: [number, number, number], spread: number, rep: number) {
    const c = document.createElement('canvas'); c.width = c.height = 256
    const ctx = c.getContext('2d')!; const img = ctx.createImageData(256, 256); const d = img.data
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random() - 0.5) * spread; d[i] = base[0] + v; d[i + 1] = base[1] + v; d[i + 2] = base[2] + v; d[i + 3] = 255 }
    ctx.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace
    return t
  }
  const asphaltMat = new THREE.MeshStandardMaterial({ map: noiseTex([54, 59, 67], 16, 8), roughness: 0.92 })
  const padMat = new THREE.MeshStandardMaterial({ map: noiseTex([150, 152, 150], 14, 6), roughness: 0.95 }) // concrete maneuvering islands
  const grassMat = new THREE.MeshStandardMaterial({ map: noiseTex([86, 142, 64], 26, 60), roughness: 1 })
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.5, roughness: 0.5 })

  const grass = new THREE.Mesh(new THREE.PlaneGeometry(560, 420), grassMat)
  grass.rotation.x = -Math.PI / 2; grass.position.y = -0.05; grass.receiveShadow = true; scene.add(grass)

  // ── Route (continuous centre-line; the road is a ribbon of width W) ──
  const W = 11
  // X mirrored (negated) so START renders on the screen-RIGHT with the current camera
  const PATH: [number, number][] = [
    [-80, 50],  // 0 START (top-right on screen)
    [-44, 50],  // 1 pedestrian crossing
    [-8, 50],   // 2 estakada
    [52, 50],   // 3 straight on, top of the 90° hairpin
    [52, 18],   // 4 90° turn DOWN  (around the concrete block)
    [10, 18],   // 5 90° turn (along the bottom of the block)
    [10, 0],    // 6 90° turn DOWN toward centre
    [0, 0],     // 7 CENTRE traffic light
    [-80, 0],   // 8 west end
    [-80, -52], // 9 corner
    [-52, -52], // 10
    [-38, -34], // 11 snake
    [-24, -52], // 12 snake
    [-10, -34], // 13 snake
    [4, -52],   // 14 snake end
    [44, -52],  // 15 bottom (reverse parking here)
    [80, -52],  // 16 corner
    [80, -22],  // 17 FINISH
  ]
  // estakada slope sits on segment 2→3 around x∈[EX0,EX1] at z≈50
  const EX0 = -16, EX1 = 8, ETOP = 2.4 // estakada slope x-range (z≈50), X mirrored
  const PED_X = -44, PED_STOP = -52    // pedestrian crossing + stop line (top road, car travels +X)
  const EST_STOP = -22                 // estakada slope-entrance stop line
  const SV = { x: 0, z: 0 }            // central light
  const PARK = { x: 44, z: -66 }       // reverse-parking bay (south of the bottom road)

  function groundHeight(x: number, z: number) {
    if (x < EX0 || x > EX1 || Math.abs(z - 50) > 7) return 0
    const t = (x - EX0) / (EX1 - EX0)
    if (t < 0.34) return ETOP * (t / 0.34)
    if (t < 0.66) return ETOP
    return ETOP * (1 - (t - 0.66) / 0.34)
  }
  function segDist(px: number, pz: number, ax: number, az: number, bx: number, bz: number) {
    const dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz || 1
    let t = ((px - ax) * dx + (pz - az) * dz) / len2; t = Math.max(0, Math.min(1, t))
    return Math.hypot(px - (ax + t * dx), pz - (az + t * dz))
  }
  // central crossroad arms (vertical) + reverse-parking bay, as rects
  const RECTS = [
    { x: 0, z: 0, w: W, d: 70 },           // vertical arm through the centre → 4-way
    { x: PARK.x, z: -60, w: W, d: 24 },    // reverse-parking access bay
  ]
  function onRoad(x: number, z: number) {
    for (let i = 0; i < PATH.length - 1; i++) if (segDist(x, z, PATH[i][0], PATH[i][1], PATH[i + 1][0], PATH[i + 1][1]) <= W / 2) return true
    for (const r of RECTS) if (Math.abs(x - r.x) <= r.w / 2 && Math.abs(z - r.z) <= r.d / 2) return true
    return false
  }

  // ── Render road ribbon + caps + rects ──
  for (let i = 0; i < PATH.length - 1; i++) {
    const [ax, az] = PATH[i], [bx, bz] = PATH[i + 1]
    const len = Math.hypot(bx - ax, bz - az)
    const g = new THREE.PlaneGeometry(len + W, W); g.rotateX(-Math.PI / 2)
    const m = new THREE.Mesh(g, asphaltMat); m.rotation.y = -Math.atan2(bz - az, bx - ax)
    m.position.set((ax + bx) / 2, 0.001 * (i % 6), (az + bz) / 2); m.receiveShadow = true; scene.add(m)
  }
  for (let i = 1; i < PATH.length - 1; i++) { const g = new THREE.PlaneGeometry(W, W); g.rotateX(-Math.PI / 2); const cap = new THREE.Mesh(g, asphaltMat); cap.position.set(PATH[i][0], 0.005, PATH[i][1]); cap.receiveShadow = true; scene.add(cap) }
  RECTS.forEach((r, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), asphaltMat); m.rotation.x = -Math.PI / 2; m.position.set(r.x, 0.004 + 0.001 * i, r.z); m.receiveShadow = true; scene.add(m) })
  // concrete maneuvering island inside the 90°-turn hairpin (the road wraps around it)
  {
    const island = new THREE.Mesh(new THREE.BoxGeometry(30, 0.35, 22), padMat)
    island.position.set(31, 0.17, 34); island.castShadow = true; island.receiveShadow = true; scene.add(island)
  }
  // estakada ramp (solid extruded hump)
  {
    const shape = new THREE.Shape(); shape.moveTo(EX0, 0)
    for (let k = 1; k <= 26; k++) { const rx = EX0 + (EX1 - EX0) * k / 26; shape.lineTo(rx, groundHeight(rx, 50)) }
    shape.lineTo(EX0, 0)
    const g = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false }); g.computeVertexNormals()
    const ramp = new THREE.Mesh(g, asphaltMat); ramp.position.set(0, 0.02, 50 - W / 2); ramp.castShadow = true; ramp.receiveShadow = true; scene.add(ramp)
  }

  // ── Markings ──
  const white = new THREE.MeshStandardMaterial({ color: 0xeef2f6, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf2c43d, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
  function paint(w: number, d: number, x: number, z: number, mat: any = white, y = 0.05) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
    m.rotation.x = -Math.PI / 2; m.position.set(x, groundHeight(x, z) + y, z); scene.add(m); return m
  }
  // pedestrian crossing (top road travels along X → stripes along Z) + stop line
  for (let xx = PED_X - 4; xx <= PED_X + 4; xx += 1.6) paint(1, W - 2, xx, 50, white, 0.06)
  paint(0.7, W - 1, PED_STOP, 50, white, 0.06)
  // estakada slope-entrance stop line
  paint(0.7, W - 1, EST_STOP, 50, yellow, 0.06)
  // central crossroad: zebra on all four arms + stop lines
  for (let k = -4; k <= 4; k += 1.5) { paint(1, W - 2, -10 + k, 0, white, 0.06); paint(1, W - 2, 10 + k, 0, white, 0.06); paint(W - 2, 1, 0, -10 + k, white, 0.06); paint(W - 2, 1, 0, 10 + k, white, 0.06) }
  paint(0.7, W - 1, 14, 0, white, 0.06) // east approach stop line (the route enters the centre from the east)
  // reverse-parking bay outline
  paint(0.3, 16, PARK.x - W / 2, -64, white, 0.05); paint(0.3, 16, PARK.x + W / 2, -64, white, 0.05); paint(W, 0.3, PARK.x, -72, white, 0.05)
  // start line
  for (let zz = 44; zz <= 56; zz += 2) paint(1.2, 0.5, -80, zz, white, 0.05)
  // finish line
  for (let xx = 74; xx <= 86; xx += 2) paint(0.5, 1.2, xx, -22, white, 0.05)
  // lane-centre dashes along the main straights
  for (let x = -74; x <= 74; x += 9) paint(3, 0.35, x, 0, white, 0.04)

  // direction arrows
  const arrowTexC = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; x.fillStyle = '#eef2f6'; x.beginPath(); x.moveTo(64, 14); x.lineTo(106, 60); x.lineTo(82, 60); x.lineTo(82, 116); x.lineTo(46, 116); x.lineTo(46, 60); x.lineTo(22, 60); x.closePath(); x.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t })()
  const arrowMat = new THREE.MeshBasicMaterial({ map: arrowTexC, transparent: true, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })
  function arrow(x: number, z: number, rotY: number) { const g = new THREE.PlaneGeometry(3.5, 5); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, arrowMat); m.rotation.y = rotY; m.position.set(x, 0.05, z); scene.add(m) }
  arrow(-62, 50, -Math.PI / 2); arrow(-28, 50, -Math.PI / 2); arrow(40, 0, Math.PI / 2); arrow(-40, 0, Math.PI / 2)

  // ── Traffic light at the centre ──
  function trafficLight(x: number, z: number) {
    const g = new THREE.Group()
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6.5, 10), new THREE.MeshStandardMaterial({ color: 0x2b2f36 })); pole.position.y = 3.25; pole.castShadow = true; g.add(pole)
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x14171c }))).position.set(0, 6, 0.2)
    const mk = (cy: number, col: number) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 14), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: col, emissiveIntensity: 0 })); s.position.set(0, cy, 0.5); g.add(s); return s }
    const red = mk(6.65, 0xff2222); mk(6.0, 0xf5c542); const grn = mk(5.35, 0x22ff22)
    g.position.set(x, 0, z); scene.add(g)
    return { red, grn }
  }
  const tl = trafficLight(-8, 8)
  let lightGreen = true, lightTimer = 0
  function setLights() { tl.red.material.emissiveIntensity = lightGreen ? 0 : 1.6; tl.grn.material.emissiveIntensity = lightGreen ? 1.6 : 0 }
  setLights()

  // STOP sign on the estakada shoulder
  {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x52525b })); post.position.set(EST_STOP, 1.3, 50 - W / 2 - 1.5); post.castShadow = true; scene.add(post)
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 8), new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0x991b1b, emissiveIntensity: 0.5, side: THREE.DoubleSide })); face.position.set(EST_STOP, 2.7, 50 - W / 2 - 1.5); face.rotation.y = Math.PI / 2; scene.add(face)
  }

  // ── Fence ──
  {
    const X0 = -110, X1 = 110, Z0 = -82, Z1 = 72, step = 6, pts: [number, number][] = []
    for (let x = X0; x <= X1; x += step) { pts.push([x, Z0]); pts.push([x, Z1]) }
    for (let z = Z0 + step; z < Z1; z += step) { pts.push([X0, z]); pts.push([X1, z]) }
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 3.2, 0.28), fenceMat, pts.length); const m4 = new THREE.Matrix4()
    pts.forEach((p, i) => { m4.makeTranslation(p[0], 1.6, p[1]); inst.setMatrixAt(i, m4) })
    inst.instanceMatrix.needsUpdate = true; inst.castShadow = true; scene.add(inst)
    const rail = (x: number, z: number, len: number, horiz: boolean, y: number) => { const r = new THREE.Mesh(new THREE.BoxGeometry(horiz ? len : 0.12, 0.1, horiz ? 0.12 : len), fenceMat); r.position.set(x, y, z); scene.add(r) }
    for (const y of [1, 2.4]) { rail(0, Z0, X1 - X0, true, y); rail(0, Z1, X1 - X0, true, y); rail(X0, 0, Z1 - Z0, false, y); rail(X1, 0, Z1 - Z0, false, y) }
  }

  // ── Beacon ──
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.2, transparent: true, opacity: 0.5 }))
  marker.position.y = 0.12; scene.add(marker); marker.visible = false
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 9, 12), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.3, transparent: true, opacity: 0.32 }))
  beacon.position.y = 4.5; marker.add(beacon)

  const disposeScene = () => {
    pmrem.dispose()
    scene.traverse((o: any) => {
      o.geometry?.dispose?.(); if (o.isInstancedMesh) o.dispose?.()
      const mats = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : [])
      for (const m of mats) { for (const v of Object.values(m)) { if ((v as any)?.isTexture) (v as any).dispose() } m.dispose?.() }
    })
  }
  cleanup = () => { disposeScene(); renderer.dispose(); renderer.domElement.remove() }

  // ── Car ──
  const car = new THREE.Group(); car.rotation.order = 'YXZ'
  const carModel = await loadCarModel(THREE, '/models/car.glb', 6.5)
  if (carModel) car.add(carModel)
  else { const m = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.7, 2.9), new THREE.MeshStandardMaterial({ color: 0xffffff })); m.position.y = 0.85; m.castShadow = true; car.add(m) }
  scene.add(car)
  if (disposed) return

  // ── Cameras ──
  const driveCam = new THREE.PerspectiveCamera(55, Wd / Hd, 0.5, 640)
  let ortho = 120
  const isoCam = new THREE.OrthographicCamera(-ortho * Wd / Hd, ortho * Wd / Hd, ortho, -ortho, 1, 1000)
  isoCam.position.set(170, 200, -170); isoCam.lookAt(0, 0, 0) // +X,−Z corner → START (top-right) reads top-right
  const controls = new OrbitControls(isoCam, renderer.domElement)
  controls.enableDamping = true; controls.dampingFactor = 0.08
  controls.minPolarAngle = 0.2; controls.maxPolarAngle = 1.35; controls.minZoom = 0.4; controls.maxZoom = 4; controls.target.set(0, -5, 0)

  // ── State / physics ──
  let speed = 0, heading = 0, running = false, off = false, overTimer = 0, redArmed = true
  let estMaxX = -999, estRolled = false
  const camPos = new THREE.Vector3(), fwd = new THREE.Vector3()
  const input = { up: false, down: false, left: false, right: false }
  const MAX_SPEED = 35, ACCEL = 16, BRAKE = 26, FRICTION = 4.5, TURN = 1.9, GRAVITY = 14 // speed cap raised for testing
  const LIMIT = 20, KMH = 3.6
  const P_LINE = 5, P_OFF = 5, P_SPEED = 3, P_NOSTOP = 5, P_ROLL = 5, P_RED = 5, P_CONE = 5
  const START = { x: -80, z: 50 }

  function addPenalty(n: number, reason: string) { penalty.value += n; lastMistake.value = reason; speak(reason); if (penalty.value >= MAX_PENALTY) end(false) }
  function end(win: boolean) { running = false; finished.value = true; passed.value = win; marker.visible = false; speak(win ? 'Imtihondan otdingiz' : 'Imtihondan otmadingiz') }

  // stop-at-line state machines (axis 'x' travel -X for the top road; 'xpos' +X for the centre)
  const ped = { result: '', done: false }, sv = { result: '', done: false }
  function stopLineMX(lineX: number, crossX: number, st: { result: string, done: boolean }) { // car travels -X (front = pos - 1.7)
    if (st.done) return
    const front = car.position.x - 3.2
    if (Math.abs(speed) < 0.15 && car.position.x > crossX) {
      if (front >= lineX) { st.result = 'good'; subOk() } else if (st.result !== 'good' && car.position.x >= lineX - 0.6) st.result = 'touch'
    }
    if (car.position.x < crossX) { st.done = true; if (st.result === 'touch') addPenalty(P_LINE, lineMsg()); else if (st.result !== 'good') addPenalty(P_NOSTOP, nostopMsg()) }
  }
  function stopLinePX(lineX: number, crossX: number, st: { result: string, done: boolean }) { // car travels +X (front = pos + 3.2)
    if (st.done) return
    const front = car.position.x + 3.2
    if (Math.abs(speed) < 0.15 && car.position.x < crossX) {
      if (front <= lineX) { st.result = 'good'; subOk() } else if (st.result !== 'good' && car.position.x <= lineX + 0.6) st.result = 'touch'
    }
    if (car.position.x > crossX) { st.done = true; if (st.result === 'touch') addPenalty(P_LINE, lineMsg()); else if (st.result !== 'good') addPenalty(P_NOSTOP, nostopMsg()) }
  }
  const lineMsg = () => i18n.t({ uz: 'Oq chiziqni bosib to\'xtadingiz', kr: 'Оқ чизиқни босиб тўхтадингиз' })
  const nostopMsg = () => i18n.t({ uz: 'Belgili joyda to\'xtamadingiz', kr: 'Белгили жойда тўхтамадингиз' })
  const subOk = () => { lastMistake.value = '' }

  type Step = { id: string, label: string, x: number, z: number, task: { uz: string, kr: string }, voice: string }
  const STEPS: Step[] = [
    { id: 'start', label: 'Start', x: START.x, z: START.z, task: { uz: 'Harakatni boshlang', kr: 'Ҳаракатни бошланг' }, voice: 'Harakatni boshlang' },
    { id: 'pedestrian', label: 'Piyoda o\'tish', x: PED_X, z: 50, task: { uz: 'Oq chiziqqa TEGMASDAN to\'xtang, so\'ng yuring', kr: 'Оқ чизиққа ТЕГМАСДАН тўхтанг' }, voice: 'Piyodalar otish joyi, toxtang' },
    { id: 'estakada', label: 'Estakada', x: -4, z: 50, task: { uz: 'Qiyalik oldidagi chiziqда to\'xtang, orqaga ketmang', kr: 'Қиялик олдида тўхтанг' }, voice: 'Estakada, qiyalik oldida toxtang' },
    { id: 'turns', label: '90° burilishlar', x: 52, z: 34, task: { uz: 'Beton blok atrofida 90° burilishlarni bajaring', kr: '90° бурилишлар' }, voice: 'Toqson gradus burilishlar' },
    { id: 'svetofor', label: 'Svetofor', x: SV.x, z: SV.z, task: { uz: 'Markazda: oq chiziqда to\'xtang, yashil chiroqда yuring', kr: 'Марказда тўхтанг' }, voice: 'Svetofor, oq chiziqda toxtang' },
    { id: 'snake', label: 'Ilon izi', x: -24, z: -43, task: { uz: 'Ilon izi: yo\'ldan chiqmay o\'ting', kr: 'Илон изи' }, voice: 'Ilon izi, ehtiyot boling' },
    { id: 'parking', label: 'Orqaga parkovka', x: PARK.x, z: PARK.z, task: { uz: 'Orqaga yurib slotga parkovka qiling', kr: 'Орқага парковка' }, voice: 'Orqaga parkovka qiling' },
    { id: 'finish', label: 'Finish', x: 80, z: -22, task: { uz: 'Mashinani to\'liq to\'xtating', kr: 'Финишда тўхтанг' }, voice: 'Finish, toxtang' },
  ]
  let step = 0
  function setStep(i: number) {
    step = i; const s = STEPS[i]; if (!s) return
    stepLabel.value = s.label; taskText.value = i18n.t(s.task); progress.value = `${i + 1}/${STEPS.length}`; lastMistake.value = ''
    marker.position.set(s.x, groundHeight(s.x, s.z) + 0.12, s.z)
    estMaxX = -999; estRolled = false
    speak(s.voice)
  }

  driveApi = {
    start() {
      mode.value = 'drive'; controls.enabled = false; marker.visible = true
      input.up = input.down = input.left = input.right = false
      speed = 0; heading = 0; off = false; overTimer = 0; redArmed = true // face +X (drive right from START)
      ped.result = ''; ped.done = false; sv.result = ''; sv.done = false
      car.position.set(START.x, 0, START.z); car.rotation.set(0, heading, 0)
      fwd.set(Math.cos(heading), 0, -Math.sin(heading))
      driveCam.position.set(START.x - fwd.x * 16, 13, START.z - fwd.z * 16); driveCam.lookAt(START.x, 1.5, START.z)
      setStep(0); running = true
    },
    toOverview() { mode.value = 'overview'; running = false; controls.enabled = true; marker.visible = false; input.up = input.down = input.left = input.right = false },
    cycleCam() { camView.value = camView.value === 'follow' ? 'iso' : camView.value === 'iso' ? 'top' : 'follow' },
  }

  const keymap: Record<string, keyof typeof input> = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }
  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    if (e.code === 'KeyC' && down && mode.value === 'drive') { driveApi?.cycleCam(); return }
    const k = keymap[e.code]; if (k && mode.value === 'drive') { input[k] = down; e.preventDefault() }
  }
  const kd = onKey(true), ku = onKey(false)
  addEventListener('keydown', kd); addEventListener('keyup', ku)
  ;(window as any).__poligonInput = input

  // minimap
  const mm = document.getElementById('minimap-canvas') as HTMLCanvasElement | null
  const mmx = mm?.getContext('2d') || null
  const MMW = 188, MMH = 132, MM_S = MMW / 240
  function w2m(x: number, z: number): [number, number] { return [(120 - x) * MM_S, (z + 100) * (MMH / 200)] }
  function drawMinimap() {
    if (!mmx) return
    mmx.fillStyle = '#5f7d46'; mmx.fillRect(0, 0, MMW, MMH)
    mmx.strokeStyle = '#3a3f47'; mmx.lineWidth = W * MM_S; mmx.lineJoin = 'round'; mmx.beginPath()
    PATH.forEach((p, i) => { const [x, z] = w2m(p[0], p[1]); i ? mmx.lineTo(x, z) : mmx.moveTo(x, z) }); mmx.stroke()
    const s = STEPS[step]; if (s) { const [bx, bz] = w2m(s.x, s.z); mmx.fillStyle = '#38bdf8'; mmx.beginPath(); mmx.arc(bx, bz, 3.5, 0, 7); mmx.fill() }
    const [cx, cz] = w2m(car.position.x, car.position.z); mmx.fillStyle = '#f43f5e'; mmx.beginPath(); mmx.arc(cx, cz, 3, 0, 7); mmx.fill()
  }

  let raf = 0
  const clock = new THREE.Clock()
  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = Math.min(0.05, clock.getDelta())
    lightTimer += dt
    if (lightTimer > (lightGreen ? 7 : 5)) { lightGreen = !lightGreen; lightTimer = 0; setLights() }

    if (mode.value === 'drive' && running) {
      marker.rotation.y += dt * 1.4
      if (input.up) speed += ACCEL * dt
      else if (input.down) speed -= BRAKE * dt
      else speed -= Math.sign(speed) * FRICTION * dt
      if (Math.abs(speed) < 0.04 && !input.up && !input.down) speed = 0

      fwd.set(Math.cos(heading), 0, -Math.sin(heading))
      const hA = groundHeight(car.position.x + fwd.x * 2, car.position.z + fwd.z * 2)
      const hB = groundHeight(car.position.x - fwd.x * 2, car.position.z - fwd.z * 2)
      speed -= GRAVITY * ((hA - hB) / 4) * dt
      speed = Math.max(-MAX_SPEED * 0.5, Math.min(MAX_SPEED, speed))

      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0)
      heading += steer * TURN * dt * Math.min(1, Math.abs(speed) / 2.5) * Math.sign(speed || 1)

      fwd.set(Math.cos(heading), 0, -Math.sin(heading))
      car.position.addScaledVector(fwd, speed * dt)
      car.position.y = groundHeight(car.position.x, car.position.z)
      car.rotation.y = heading
      car.rotation.z = Math.atan2(hA - hB, 4)

      speedKmh.value = Math.round(Math.abs(speed) * KMH)
      gear.value = speed < -0.1 ? 'R' : speedKmh.value < 1 ? 'N' : speedKmh.value < 13 ? '1' : speedKmh.value < 26 ? '2' : '3'
      overLimit.value = false // TODO: re-enable speed limit + penalty later — disabled for testing
      // if (speedKmh.value > LIMIT) { overTimer += dt; if (overTimer > 1.5) { overTimer = 0; addPenalty(P_SPEED, ...) } } else overTimer = 0

      const out = !onRoad(car.position.x, car.position.z)
      if (out && !off) { off = true; addPenalty(P_OFF, i18n.t({ uz: 'Yo\'ldan chiqdingiz', kr: 'Йўлдан чиқдингиз' })) }
      if (!out) off = false

      // red-light at the centre
      const inBox = Math.abs(car.position.x) < 14 && Math.abs(car.position.z) < 14
      if (inBox && !lightGreen && redArmed && Math.abs(speed) > 0.6) { redArmed = false; addPenalty(P_RED, i18n.t({ uz: 'Qizil chiroqda yurdingiz', kr: 'Қизил чироқда юрдингиз' })) }
      if (!inBox) redArmed = true

      const s = STEPS[step]
      const id = s?.id
      const dist = s ? Math.hypot(car.position.x - s.x, car.position.z - s.z) : 999
      if (id === 'pedestrian') stopLinePX(PED_STOP, PED_X + 4, ped)
      if (id === 'estakada' && car.position.y > 0.3) { if (car.position.x > estMaxX) estMaxX = car.position.x; else if (car.position.x < estMaxX - 2 && !estRolled) { estRolled = true; addPenalty(P_ROLL, i18n.t({ uz: 'Qiyalikda orqaga ketdingiz', kr: 'Орқага кетдингиз' })) } }
      if (id === 'svetofor') stopLineMX(14, SV.x - 2, sv)

      if (s && dist < 9) {
        let okToAdvance = true
        if (id === 'start' && Math.abs(speed) < 0.1) okToAdvance = false
        if ((id === 'parking' || id === 'finish') && Math.abs(speed) > 0.25) okToAdvance = false
        if (okToAdvance) { if (step >= STEPS.length - 1) end(true); else setStep(step + 1) }
      }

      if (camView.value === 'follow') { camPos.set(car.position.x - fwd.x * 16, car.position.y + 8, car.position.z - fwd.z * 16); driveCam.position.lerp(camPos, 0.08); driveCam.lookAt(car.position.x + fwd.x * 6, car.position.y + 1.5, car.position.z + fwd.z * 6) }
      else if (camView.value === 'iso') { camPos.set(car.position.x + 20, car.position.y + 24, car.position.z - 20); driveCam.position.lerp(camPos, 0.1); driveCam.lookAt(car.position.x, car.position.y, car.position.z) }
      else { camPos.set(car.position.x, car.position.y + 42, car.position.z + 0.01); driveCam.position.lerp(camPos, 0.12); driveCam.lookAt(car.position.x, car.position.y, car.position.z) }

      drawMinimap()
    }

    if (mode.value === 'overview') controls.update()
    renderer.render(scene, mode.value === 'drive' ? driveCam : isoCam)
  }
  loop()

  const onResize = () => {
    Wd = el.clientWidth || innerWidth; Hd = el.clientHeight || innerHeight; if (!Hd) return
    driveCam.aspect = Wd / Hd; driveCam.updateProjectionMatrix()
    isoCam.left = -ortho * Wd / Hd; isoCam.right = ortho * Wd / Hd; isoCam.top = ortho; isoCam.bottom = -ortho; isoCam.updateProjectionMatrix()
    renderer.setSize(Wd, Hd)
  }
  addEventListener('resize', onResize)
  cleanup = () => {
    cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', onResize)
    controls.dispose(); disposeScene(); renderer.dispose(); renderer.domElement.remove(); delete (window as any).__poligonInput
  }
})

function touch(key: 'up' | 'down' | 'left' | 'right', down: boolean) {
  if (mode.value !== 'drive') return
  const inp = (window as any).__poligonInput
  if (inp) inp[key] = down
}
</script>

<template>
  <div class="fixed inset-0 overflow-hidden select-none" style="background:#9ec5e8;">
    <div id="poligon-canvas" class="absolute inset-0"></div>

    <div v-if="mode === 'overview' && !finished" class="absolute inset-x-0 top-0 p-4 pointer-events-none">
      <div class="flex items-start justify-between gap-3">
        <div class="px-4 py-3 rounded-2xl bg-black/55 text-white backdrop-blur max-w-sm">
          <div class="text-lg font-semibold">{{ i18n.t({ uz: 'Avtodrom — B toifa imtihon', kr: 'Автодром — B тоифа имтиҳон' }) }}</div>
          <div class="text-xs text-white/70 mt-1">{{ i18n.t({ uz: 'Aylantiring / zoom. 100 ball = yiqilish; oq chiziqni bossangiz 5 ball.', kr: 'Айлантиринг / зум. 100 балл = йиқилиш.' }) }}</div>
        </div>
        <NuxtLink to="/" class="pointer-events-auto px-3 py-2 rounded-xl bg-black/55 text-white text-sm backdrop-blur hover:bg-black/70">✕ {{ i18n.t({ uz: 'Chiqish', kr: 'Чиқиш' }) }}</NuxtLink>
      </div>
    </div>
    <div v-if="mode === 'overview' && !finished" class="absolute inset-x-0 bottom-6 flex justify-center px-4 pointer-events-none">
      <button @click="startDrive" class="pointer-events-auto btn-gradient btn-lg shadow-lift">🚗 {{ i18n.t({ uz: 'Imtihonni boshlash', kr: 'Имтиҳонни бошлаш' }) }}</button>
    </div>

    <div v-if="mode === 'drive' && !finished" class="absolute top-0 inset-x-0 p-3 sm:p-4 flex items-start justify-between gap-3 pointer-events-none">
      <div class="flex gap-2">
        <div class="px-3 py-2 rounded-xl bg-black/55 text-white backdrop-blur">
          <div class="text-2xs uppercase tracking-wider text-white/60">{{ i18n.t({ uz: 'Jarima', kr: 'Жарима' }) }}</div>
          <div class="text-xl font-bold tabular-nums" :class="penalty > 0 ? 'text-rose-400' : 'text-emerald-400'">{{ penalty }} / {{ MAX_PENALTY }}</div>
        </div>
        <div class="px-3 py-2 rounded-xl backdrop-blur" :class="overLimit ? 'bg-rose-600/80 text-white' : 'bg-black/55 text-white'">
          <div class="text-2xs uppercase tracking-wider text-white/60">{{ i18n.t({ uz: 'Tezlik', kr: 'Тезлик' }) }}</div>
          <div class="text-xl font-bold tabular-nums">{{ speedKmh }}<span class="text-xs"> km/h</span> <span class="ml-1 text-amber-300">{{ gear }}</span></div>
        </div>
        <div class="px-3 py-2 rounded-xl bg-black/55 text-white backdrop-blur hidden sm:block">
          <div class="text-2xs uppercase tracking-wider text-white/60">{{ i18n.t({ uz: 'Mashq', kr: 'Машқ' }) }} {{ progress }}</div>
          <div class="text-sm font-bold">{{ stepLabel }}</div>
        </div>
      </div>
      <div class="flex gap-2 pointer-events-auto">
        <button @click="muted = !muted" class="px-3 py-2 rounded-xl bg-black/55 text-white text-sm backdrop-blur hover:bg-black/70">{{ muted ? '🔇' : '🔊' }}</button>
        <button @click="cycleCam" class="px-3 py-2 rounded-xl bg-black/55 text-white text-sm backdrop-blur hover:bg-black/70">🎥 {{ camView }}</button>
        <button @click="backToOverview" class="px-3 py-2 rounded-xl bg-black/55 text-white text-sm backdrop-blur hover:bg-black/70">🗺</button>
      </div>
    </div>

    <div v-if="mode === 'drive' && !finished" class="absolute top-20 sm:top-4 inset-x-0 flex justify-center px-4 pointer-events-none">
      <div class="px-4 py-2 rounded-full bg-white/90 backdrop-blur text-sm font-medium text-ink-900 shadow-lift text-center max-w-[92%]">
        🎯 {{ taskText }}
        <span v-if="lastMistake" class="text-rose-600">· {{ lastMistake }}</span>
      </div>
    </div>

    <canvas id="minimap-canvas" width="188" height="132" v-show="mode === 'drive' && !finished" class="absolute bottom-4 right-4 rounded-lg border border-white/30 shadow-lift" style="width:188px;height:132px;"></canvas>

    <div v-if="mode === 'drive' && !finished && isTouch" class="absolute bottom-5 left-5 flex gap-3 pointer-events-auto">
      <button class="ctrl" @touchstart.prevent="touch('left', true)" @touchend.prevent="touch('left', false)">◀</button>
      <button class="ctrl" @touchstart.prevent="touch('right', true)" @touchend.prevent="touch('right', false)">▶</button>
    </div>
    <div v-if="mode === 'drive' && !finished && isTouch" class="absolute bottom-44 right-4 flex flex-col gap-3 pointer-events-auto">
      <button class="ctrl" @touchstart.prevent="touch('up', true)" @touchend.prevent="touch('up', false)">▲</button>
      <button class="ctrl" @touchstart.prevent="touch('down', true)" @touchend.prevent="touch('down', false)">▼</button>
    </div>

    <div v-if="finished" class="absolute inset-0 grid place-items-center p-4" style="background: rgba(10,12,20,0.6);">
      <div class="card max-w-md w-full p-7 text-center">
        <div class="text-5xl mb-3">{{ passed ? '🏆' : '❌' }}</div>
        <h1 class="text-2xl font-semibold" :class="passed ? 'text-emerald-600' : 'text-rose-600'">
          {{ passed ? i18n.t({ uz: 'Imtihondan o\'tdingiz!', kr: 'Имтиҳондан ўтдингиз!' }) : i18n.t({ uz: 'Imtihondan o\'tmadingiz', kr: 'Имтиҳондан ўтмадингиз' }) }}
        </h1>
        <div class="mt-4 text-ink-700"><span class="text-2xs uppercase text-ink-400 block">{{ i18n.t({ uz: 'Jarima ball', kr: 'Жарима балл' }) }}</span><span class="text-3xl font-bold tabular-nums">{{ penalty }} / {{ MAX_PENALTY }}</span></div>
        <button @click="startDrive" class="btn-gradient btn-lg w-full mt-6">{{ i18n.t({ uz: 'Qayta urinish', kr: 'Қайта уриниш' }) }}</button>
        <button @click="backToOverview" class="block w-full mt-3 text-sm text-ink-500 hover:text-ink-900">🗺 {{ i18n.t({ uz: 'Xaritaga qaytish', kr: 'Харитага қайтиш' }) }}</button>
      </div>
    </div>kyngisi
  </div>
</template>

<style scoped>
.ctrl { width: 64px; height: 64px; border-radius: 9999px; background: rgba(0,0,0,0.5); color: #fff; font-size: 26px; backdrop-filter: blur(6px); display: grid; place-items: center; user-select: none; touch-action: none; }
.ctrl:active { background: rgba(0,0,0,0.75); }
</style>
