import './style/main.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * GUI Controls
 */
import * as dat from 'dat.gui'
const gui = new dat.GUI()
const settings = {
  speed: 0.7,
  density: 0.6,
  strength: 0.2,
  frequency: 0.6,
  amplitude: 8.5,
  intensity: 5.0,
}
const folder1 = gui.addFolder('Noise')
const folder2 = gui.addFolder('Rotation')
const folder3 = gui.addFolder('Color')
folder1.add(settings, 'speed', 0.1, 1, 0.01)
folder1.add(settings, 'density', 0, 10, 0.01)
folder1.add(settings, 'strength', 0, 2, 0.01)
folder2.add(settings, 'frequency', 0, 10, 0.1)
folder2.add(settings, 'amplitude', 0, 10, 0.1)
folder3.add(settings, 'intensity', 0, 10, 0.1)

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Object
 */

const loader = new GLTFLoader()
loader.load('mesh/flower.glb', function (gltf) {
  const geometry = gltf.scene.children[0].geometry
  geometry.computeVertexNormals(false)

  let mesh = new THREE.Mesh(geometry, buildTwistMaterial(100))
  mesh.position.x = 0
  mesh.position.y = 0
  scene.add(mesh)
})

/**
 * MATERIAL
 */

function buildTwistMaterial(amount) {
  const material = new THREE.MeshNormalMaterial()
  material.onBeforeCompile = function (shader) {
    shader.uniforms.time = { value: 0 }

    shader.vertexShader = 'uniform float time;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      [
        `float theta = sin( time + position.y ) / ${amount.toFixed(1)};`,
        'float c = cos( theta );',
        'float s = sin( theta );',
        'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
        'vec3 transformed = vec3( position ) * m;',
        'vNormal = vNormal * m;',
      ].join('\n')
    )

    material.userData.shader = shader
  }

  // Make sure WebGLRenderer doesnt reuse a single program

  material.customProgramCacheKey = function () {
    return amount
  }

  return material
}

/**Cover Blob */
const randomgeometry = new THREE.PlaneGeometry(50, 50, 50)
const randomaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
// Material Props.
randomaterial.wireframe = true
// Create Mesh & Add To Scene
const randomblob = new THREE.Mesh(randomgeometry, randomaterial)
randomblob.rotation.x = 1.5708
randomblob.position.y = -1.1
scene.add(randomblob)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.001,
  5000
)
camera.position.x = 5
camera.position.y = 0
camera.position.z = 0
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.autoRotate = true
// controls.enableZoom = false
controls.enablePan = false
controls.dampingFactor = 0.05
controls.maxDistance = 1000
controls.minDistance = 2
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
}
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  scene.traverse(function (child) {
    if (child.isMesh) {
      const shader = child.material.userData.shader

      if (shader) {
        shader.uniforms.time.value = performance.now() / 1000
      }
    }
  })
  //randomblob.rotation.y -= 0.01 * Math.sin(1)
  //mesh.rotation.y += 0.01 * Math.sin(1)
  // mesh.rotation.z += 0.01 * Math.sin(1)

  // Update controls
  controls.update()
  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
