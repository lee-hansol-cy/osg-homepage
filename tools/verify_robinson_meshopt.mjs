import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { AnimationMixer, LoopOnce, Quaternion, Vector3 } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'meshoptimizer'


const asset = resolve(process.argv[2])
const bytes = await readFile(asset)
await MeshoptDecoder.ready
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const gltf = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')

const requiredNames = new Set([
  'Robinson_Device_Root',
  'Hinge_Control_0_170deg',
  '상판',
  '하판',
  '상판 소속 화면',
  '상판 소속 화면 베젤',
  '좌 힌지',
  '우 힌지',
  '좌 힌지막대',
  '우 힌지막대',
  'Plasticity_Group__완충 고무',
  '카메라 렌즈',
  '카메라 중앙유리',
  '카메라 유리 검은색 베젤',
  '조도 센서',
  '마이크',
])
const nodes = []
gltf.scene.traverse((node) => nodes.push(node))
const byName = new Map(nodes.map((node) => [node.userData.name || node.name, node]))
const missing = [...requiredNames].filter((name) => !byName.has(name))
if (missing.length) throw new Error(`missing required nodes: ${missing.join(', ')}`)

const groups = nodes.filter((node) => node.userData.web_role === 'plasticity_group')
if (groups.length !== 15) throw new Error(`expected 15 Plasticity groups, got ${groups.length}`)
const internalNodes = nodes.filter((node) => node.userData.web_role === 'internal_component')
if (internalNodes.length) throw new Error(`exterior asset contains ${internalNodes.length} internal nodes`)

const hinge = byName.get('Hinge_Control_0_170deg')
if (hinge.userData.axis !== 'X' || Math.abs(hinge.userData.max_angle_deg - 170) > 0.001) {
  throw new Error('hinge metadata is invalid')
}
const screen = byName.get('상판 소속 화면')
if (screen.userData.web_role !== 'screen_upper_ui' || !screen.userData.touch_enabled) {
  throw new Error('upper screen UI metadata is invalid')
}
if (gltf.animations.length !== 1) throw new Error(`expected one animation, got ${gltf.animations.length}`)

const clip = gltf.animations[0]
const mixer = new AnimationMixer(gltf.scene)
const action = mixer.clipAction(clip)
action.setLoop(LoopOnce, 1)
action.clampWhenFinished = true
action.play()
const centerAt = (node, time) => {
  mixer.setTime(time)
  gltf.scene.updateMatrixWorld(true)
  const mesh = node.isMesh ? node : node.getObjectByProperty('isMesh', true)
  mesh.geometry.computeBoundingBox()
  return mesh.geometry.boundingBox.getCenter(new Vector3()).applyMatrix4(mesh.matrixWorld)
}
const upper = byName.get('상판')
const upperCenters = [0, clip.duration / 3, clip.duration * 2 / 3, clip.duration].map((time) => centerAt(upper, time))
const hingeCenter = hinge.getWorldPosition(new Vector3())
const radii = upperCenters.map((center) => center.distanceTo(hingeCenter))
const radiusError = Math.max(...radii) - Math.min(...radii)
if (radiusError > 0.00005) throw new Error(`upper panel hinge radius error is ${radiusError}`)

const rods = ['좌 힌지막대', '우 힌지막대'].map((name) => byName.get(name))
const rodClosed = rods.map((rod) => centerAt(rod, 0))
const rodOpen = rods.map((rod) => centerAt(rod, clip.duration))
const rodDrift = Math.max(...rodClosed.map((center, index) => center.distanceTo(rodOpen[index])))
if (rodDrift > 0.00005) throw new Error(`hinge rod axis drift is ${rodDrift}`)

const hingeTrack = clip.tracks.find((track) => track.name === 'Hinge_Control_0_170deg.quaternion')
if (!hingeTrack) throw new Error('hinge quaternion animation track is missing')
const closedRotation = new Quaternion().fromArray(hingeTrack.values, 0)
const openRotation = new Quaternion().fromArray(hingeTrack.values, hingeTrack.values.length - 4)
const hingeDegrees = closedRotation.angleTo(openRotation) * 180 / Math.PI
if (Math.abs(hingeDegrees - 170) > 0.05) throw new Error(`hinge range is ${hingeDegrees}`)

let meshes = 0
let vertices = 0
let triangles = 0
for (const node of nodes) {
  if (!node.isMesh) continue
  meshes += 1
  vertices += node.geometry.attributes.position.count
  triangles += node.geometry.index ? node.geometry.index.count / 3 : node.geometry.attributes.position.count / 3
}

console.log(
  `ROBINSON_MESHOPT_VERIFY_OK asset=${asset} nodes=${nodes.length} groups=${groups.length} ` +
  `meshes=${meshes} vertices=${vertices} triangles=${triangles} hinge_degrees=${hingeDegrees.toFixed(3)} ` +
  `radius_error_m=${radiusError.toFixed(8)} rod_drift_m=${rodDrift.toFixed(8)} ` +
  `screen_role=${screen.userData.web_role} internal_nodes=${internalNodes.length} duration=${clip.duration.toFixed(3)}`,
)
