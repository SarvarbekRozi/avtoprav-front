<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'

type RobotState = 'idle' | 'thinking' | 'happy' | 'studying' | 'success' | 'warning'

const props = withDefaults(defineProps<{ state?: RobotState }>(), { state: 'idle' })
const canvas = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera
let raf = 0, robot: THREE.Group
// THREE.Clock 0.185 da eskirgan (har yuklanishda konsolga ogohlantirish yozadi).
// Bizga faqat o`tgan vaqt kerak — performance.now() ayni shuni beradi.
let t0 = 0
let head: THREE.Group, body: THREE.Group, leftArm: THREE.Group, rightArm: THREE.Group
let antenna: THREE.Group, leftEye: THREE.Mesh, rightEye: THREE.Mesh, chestLight: THREE.Mesh
let eyeMat: THREE.MeshStandardMaterial, chestMat: THREE.MeshStandardMaterial, shadow: THREE.Mesh
let state: RobotState = props.state

function roundedBox(w:number,h:number,d:number,r:number,m:THREE.Material) {
  const s = new THREE.Shape(), x=-w/2, y=-h/2
  r=Math.min(r,w/2,h/2)
  s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r)
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h)
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r)
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y)
  const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSegments:4,bevelSize:r*.35,bevelThickness:r*.25,curveSegments:8})
  g.center(); return new THREE.Mesh(g,m)
}

function arm(side:number,m:THREE.Material) {
  const g=new THREE.Group()
  const upper=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.42,8,18),m)
  upper.rotation.z=side*.12; g.add(upper)
  const elbow=new THREE.Mesh(new THREE.SphereGeometry(.17,20,16),m)
  elbow.position.y=-.25; g.add(elbow)
  const fore=new THREE.Mesh(new THREE.CapsuleGeometry(.145,.34,8,18),m)
  fore.position.y=-.47; fore.rotation.z=side*-.08; g.add(fore)
  const hand=new THREE.Mesh(new THREE.SphereGeometry(.19,20,16),m)
  hand.scale.set(.85,1,.75); hand.position.y=-.72; g.add(hand)
  return g
}

function createRobot() {
  const white=new THREE.MeshPhysicalMaterial({color:0xf5f8ff,roughness:.25,metalness:.04,clearcoat:.7,clearcoatRoughness:.18})
  const light=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.2,metalness:.02,clearcoat:.8})
  const dark=new THREE.MeshPhysicalMaterial({color:0x07152e,roughness:.2,metalness:.15,clearcoat:.6})
  eyeMat=new THREE.MeshStandardMaterial({color:0x55dfff,emissive:0x29bfff,emissiveIntensity:3.2,roughness:.15})
  chestMat=new THREE.MeshStandardMaterial({color:0x6677ff,emissive:0x5268ff,emissiveIntensity:2.5})
  robot=new THREE.Group(); scene.add(robot)

  body=new THREE.Group(); body.position.y=-.42; robot.add(body)
  const bm=new THREE.Mesh(new THREE.CapsuleGeometry(.63,.78,8,24),white); bm.scale.set(.88,1,.58); body.add(bm)
  const panel=roundedBox(.48,.55,.055,.09,light); panel.position.set(0,-.03,.34); body.add(panel)
  chestLight=new THREE.Mesh(new THREE.SphereGeometry(.065,20,20),chestMat); chestLight.position.set(0,-.06,.385); body.add(chestLight)

  head=new THREE.Group(); head.position.y=.75; robot.add(head)
  const shell=new THREE.Mesh(new THREE.SphereGeometry(.9,40,32),white); shell.scale.set(1.05,.77,.72); head.add(shell)
  const face=roundedBox(1.42,.72,.09,.22,dark); face.position.set(0,-.03,.64); head.add(face)
  leftEye=new THREE.Mesh(new THREE.SphereGeometry(.105,24,18),eyeMat)
  rightEye=leftEye.clone(); leftEye.position.set(-.34,-.02,.705); rightEye.position.set(.34,-.02,.705); head.add(leftEye,rightEye)

  antenna=new THREE.Group(); antenna.position.y=1.52; robot.add(antenna)
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.25,16),white); antenna.add(stem)
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.075,20,20),chestMat); ball.position.y=.17; antenna.add(ball)

  leftArm=arm(1,white); rightArm=arm(-1,white)
  leftArm.position.set(-.72,-.38,0); rightArm.position.set(.72,-.38,0); robot.add(leftArm,rightArm)

  for(const side of [-1,1]) {
    const leg=new THREE.Group(); leg.position.set(side*.27,-1.24,0)
    const lm=new THREE.Mesh(new THREE.CapsuleGeometry(.16,.28,6,16),white); lm.scale.z=.82; leg.add(lm)
    const foot=new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),light); foot.scale.set(1.2,.65,1.25); foot.position.set(0,-.2,.08); leg.add(foot)
    robot.add(leg)
  }

  shadow=new THREE.Mesh(new THREE.CircleGeometry(.82,64),new THREE.MeshBasicMaterial({color:0x5967c7,transparent:true,opacity:.16,depthWrite:false}))
  shadow.rotation.x=-Math.PI/2; shadow.position.y=-1.5; scene.add(shadow)
  robot.scale.setScalar(1.05); robot.position.y=.05
}

function setState(s:RobotState) {
  state=s
  if(s==='warning'){eyeMat?.color.setHex(0xffa14d);eyeMat?.emissive.setHex(0xff6a22)}
  else {eyeMat?.color.setHex(0x55dfff);eyeMat?.emissive.setHex(0x29bfff)}
}

function blink() {
  if(!leftEye||!rightEye)return
  const start=performance.now()
  const f=(now:number)=>{
    const p=Math.min(1,(now-start)/140), v=p<.5?THREE.MathUtils.lerp(1,.08,p*2):THREE.MathUtils.lerp(.08,1,(p-.5)*2)
    leftEye.scale.y=v; rightEye.scale.y=v
    if(p<1)requestAnimationFrame(f)
  }
  requestAnimationFrame(f)
}

let nextBlink=2500
function animate() {
  raf=requestAnimationFrame(animate)
  // Tab ko`rinmasa kadr chizmaymiz: WebGL sikli fonda batareyani behuda yeydi
  if(document.hidden) return
  const t=(performance.now()-t0)/1000
  if(t*1000>nextBlink){blink();nextBlink+=2600+Math.random()*3500}
  const bob=Math.sin(t*Math.PI*2/3.6)*.055
  robot.position.y=.05+bob
  body.scale.setScalar(1+Math.sin(t*2.1)*.012)
  antenna.rotation.z=Math.sin(t*1.8)*.045
  eyeMat.emissiveIntensity=2.6+Math.sin(t*2.5)*.65
  chestMat.emissiveIntensity=2.2+Math.sin(t*2.8)*.65
  chestLight.scale.setScalar(1+Math.sin(t*2.8)*.06)
  leftArm.rotation.z=-.12+Math.sin(t*1.25)*.035
  rightArm.rotation.z=.12-Math.sin(t*1.25)*.035
  head.rotation.z=Math.sin(t*.8)*.018

  if(state==='thinking'){head.rotation.z=-.12;leftArm.rotation.z=-.38}
  if(state==='happy'||state==='success'){
    robot.position.y=.05+Math.abs(Math.sin(t*3.5))*.08
    leftArm.rotation.z=-.48;rightArm.rotation.z=.48
  }
  if(state==='studying'){head.rotation.x=.08;leftArm.rotation.z=-.28;rightArm.rotation.z=.28}
  if(state==='warning'){head.rotation.z=Math.sin(t*2.2)*.1;leftArm.rotation.z=-.28}

  const sm=(1-bob*1.8); shadow.scale.setScalar(Math.max(.82,sm))
  ;(shadow.material as THREE.MeshBasicMaterial).opacity=.16-Math.max(0,bob)*.55
  renderer.render(scene,camera)
}

function resize(){
  if(!canvas.value)return
  const w=canvas.value.clientWidth||320,h=canvas.value.clientHeight||280
  renderer.setSize(w,h,false); renderer.setPixelRatio(Math.min(devicePixelRatio||1,2))
  camera.aspect=w/h;camera.updateProjectionMatrix()
}

onMounted(()=>{
  if(!canvas.value)return
  scene=new THREE.Scene()
  // Masofa 5.2 emas 7.2: fov 32 da 5.2 masofa jami 2.98 birlik balandlikni
  // ko'rsatadi, robot esa (antennadan oyoqqacha) ~3.5 birlik — yuqori va past
  // kesilib qolardi. 7.2 da ko'rinish 4.13 birlik, ikki tomonda zaxira bor.
  camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.set(0,.05,7.2);camera.lookAt(0,0,0)
  renderer=new THREE.WebGLRenderer({canvas:canvas.value,antialias:true,alpha:true,powerPreference:'high-performance'})
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true
  scene.add(new THREE.HemisphereLight(0xf5f8ff,0x7380aa,2.1))
  const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-3,5,5);key.castShadow=true;scene.add(key)
  const blue=new THREE.PointLight(0x5b7cff,2.3,5);blue.position.set(2,1,2);scene.add(blue)
  const purple=new THREE.PointLight(0x8667ff,1.6,4);purple.position.set(-2,-.5,1.5);scene.add(purple)
  t0=performance.now();createRobot();setState(props.state);resize()
  window.addEventListener('resize',resize);animate()
})

watch(()=>props.state,setState)
onBeforeUnmount(()=>{
  cancelAnimationFrame(raf);window.removeEventListener('resize',resize)
  scene?.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(x=>x.dispose())})
  renderer?.dispose()
})
</script>

<template>
  <div class="ai-robot-3d"><canvas ref="canvas" /></div>
</template>

<style scoped>
.ai-robot-3d{position:relative;width:100%;height:100%;min-height:220px;overflow:visible;pointer-events:none}
.ai-robot-3d::before{content:"";position:absolute;left:50%;bottom:5%;width:55%;height:24%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(92,105,255,.24),rgba(92,105,255,.09) 35%,transparent 72%);filter:blur(10px);animation:glow 3.6s ease-in-out infinite}
.ai-robot-3d canvas{position:relative;display:block;width:100%;height:100%}
@keyframes glow{0%,100%{opacity:.65;transform:translateX(-50%) scale(.92)}50%{opacity:1;transform:translateX(-50%) scale(1.08)}}
@media(prefers-reduced-motion:reduce){.ai-robot-3d::before{animation:none}}
</style>
