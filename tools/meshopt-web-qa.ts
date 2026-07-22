import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'


const width = 1600
const height = 1200
const root = '/@fs/Users/hansol/Documents/01%20%E1%84%91%E1%85%B3%E1%84%85%E1%85%A9%E1%84%8C%E1%85%A6%E1%86%A8%E1%84%90%E1%85%B3/Personal%20Works/OSG/OSG%20Homepage/'
const sourceUrl = `${root}artifacts/robinson/optimization/robinson-exterior-uncompressed.glb`
const candidateSpec = new URLSearchParams(location.search).get('candidate') ?? 'p14-n12'
const candidateUrl = `${root}artifacts/robinson/optimization/meshopt-candidates/robinson-meshopt-${candidateSpec}.glb`
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const [source, candidate] = await Promise.all([loader.loadAsync(sourceUrl), loader.loadAsync(candidateUrl)])

const prepare = (gltf: typeof source) => {
  gltf.scene.traverse((node) => {
    if (node.userData.name) node.name = node.userData.name
    if (node.name.startsWith('Interaction_Collider_')) node.visible = false
  })
  const mixer = new THREE.AnimationMixer(gltf.scene)
  const action = mixer.clipAction(gltf.animations[0])
  action.setLoop(THREE.LoopOnce, 1)
  action.clampWhenFinished = true
  action.play()
  mixer.setTime(gltf.animations[0].duration * 0.5)
  gltf.scene.updateMatrixWorld(true)
}
prepare(source)
prepare(candidate)

const bounds = new THREE.Box3()
source.scene.traverse((node) => {
  if (!(node as THREE.Mesh).isMesh || !node.visible) return
  bounds.expandByObject(node, true)
})
const center = bounds.getCenter(new THREE.Vector3())
const radius = bounds.getSize(new THREE.Vector3()).length() * 0.5
const camera = new THREE.PerspectiveCamera(36, width / height, 0.001, 10)
camera.position.copy(center).add(new THREE.Vector3(1.05, 1, 1.3).normalize().multiplyScalar(radius * 2.7))
camera.lookAt(center)

const decorate = (scene: THREE.Scene) => {
  scene.background = new THREE.Color(0x171621)
  scene.add(new THREE.HemisphereLight(0xffd6f5, 0x30364f, 2.2))
  const key = new THREE.DirectionalLight(0xffd0ef, 4.5)
  key.position.copy(center).add(new THREE.Vector3(-1, 2, 2).multiplyScalar(radius * 2))
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xaac7ff, 2.5)
  fill.position.copy(center).add(new THREE.Vector3(2, 0.5, 1).multiplyScalar(radius * 2))
  scene.add(fill)
}
decorate(source.scene)
decorate(candidate.scene)

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' })
renderer.setSize(width, height, false)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
const target = new THREE.WebGLRenderTarget(width, height, { type: THREE.UnsignedByteType, format: THREE.RGBAFormat })
target.samples = 4

const renderPixels = (scene: THREE.Scene) => {
  const pixels = new Uint8Array(width * height * 4)
  renderer.setRenderTarget(target)
  renderer.render(scene, camera)
  renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels)
  return pixels
}
const sourcePixels = renderPixels(source.scene)
const candidatePixels = renderPixels(candidate.scene)

let squaredError = 0
let changedOnePercent = 0
let maxChannelDifference = 0
for (let index = 0; index < sourcePixels.length; index += 4) {
  let pixelChanged = false
  for (let channel = 0; channel < 3; channel += 1) {
    const difference = Math.abs(sourcePixels[index + channel] - candidatePixels[index + channel])
    squaredError += difference * difference
    maxChannelDifference = Math.max(maxChannelDifference, difference)
    if (difference >= 3) pixelChanged = true
  }
  if (pixelChanged) changedOnePercent += 1
}
const rmse = Math.sqrt(squaredError / (width * height * 3))

const makeCanvas = (pixels: Uint8Array, label: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const image = context.createImageData(width, height)
  for (let y = 0; y < height; y += 1) {
    const sourceStart = y * width * 4
    const destinationStart = (height - y - 1) * width * 4
    image.data.set(pixels.subarray(sourceStart, sourceStart + width * 4), destinationStart)
  }
  for (let index = 3; index < image.data.length; index += 4) image.data[index] = 255
  context.putImageData(image, 0, 0)
  const renderedImage = new Image()
  renderedImage.src = canvas.toDataURL('image/png')
  const figure = document.createElement('figure')
  const caption = document.createElement('figcaption')
  caption.textContent = label
  figure.append(caption, renderedImage)
  document.querySelector('#renders')!.append(figure)
}
makeCanvas(sourcePixels, 'Source GLB')
makeCanvas(candidatePixels, `Meshopt ${candidateSpec}`)

const result = { width, height, rmse, changedOnePercent, maxChannelDifference }
const status = document.querySelector<HTMLDivElement>('#status')!
status.textContent = JSON.stringify(result)
status.dataset.ready = 'true'
Object.assign(window, { robinsonQa: result })
