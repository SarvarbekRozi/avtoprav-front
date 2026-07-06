// Loads a GLB/GLTF car model and auto-fits it so ANY model "just works":
// centers it on XZ, scales the longest horizontal axis to `targetLen`, drops it
// onto the ground (local y = 0), and aligns its length to +X (driving forward).
// Returns a THREE.Group, or null if the model is missing/fails — callers then
// fall back to the built-in procedural car.
//
// To use your own car (e.g. a Cobalt), just drop `car.glb` into public/models/.
export async function loadCarModel(THREE: any, url: string, targetLen = 3.8, bodyColor: number | null = 0xffffff): Promise<any | null> {
  try {
    const { GLTFLoader }: any = await import('three/examples/jsm/loaders/GLTFLoader.js')
    const loader = new GLTFLoader()
    const gltf: any = await loader.loadAsync(url)
    const model = gltf.scene

    model.traverse((o: any) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      // recolor the painted body panels to `bodyColor` (default white), while
      // leaving dark parts (tires, trim) and glass alone — luminance heuristic.
      if (bodyColor === null) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m || !m.color) continue
        const isGlass = m.transparent && (m.opacity ?? 1) < 0.9
        const lum = 0.299 * m.color.r + 0.587 * m.color.g + 0.114 * m.color.b
        if (!isGlass && lum > 0.22) {
          m.color.setHex(bodyColor)
          if (m.map) m.map = null
          // matte/satin paint (no env map in the scene, so keep metalness low or it looks grey)
          if ('metalness' in m) { m.metalness = 0; if (m.metalnessMap) m.metalnessMap = null }
          if ('roughness' in m) { m.roughness = 0.5; if (m.roughnessMap) m.roughnessMap = null }
          m.needsUpdate = true
        }
      }
    })

    // scale to target length
    let box = new THREE.Box3().setFromObject(model)
    const size = new THREE.Vector3()
    box.getSize(size)
    const longest = Math.max(size.x, size.z) || 1
    model.scale.setScalar(targetLen / longest)

    // align the longer horizontal axis to X, then face forward (+X)
    model.rotation.y = (size.z > size.x ? Math.PI / 2 : 0) + Math.PI

    // re-measure, then center on XZ and sit on the ground (y = 0)
    box = new THREE.Box3().setFromObject(model)
    const center = new THREE.Vector3()
    box.getCenter(center)
    model.position.x -= center.x
    model.position.z -= center.z
    model.position.y -= box.min.y

    const group = new THREE.Group()
    group.add(model)
    return group
  }
  catch (e) {
    console.warn('[useGltfCar] model load failed → procedural fallback:', e)
    return null
  }
}
