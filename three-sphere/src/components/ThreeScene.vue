<template>
  <div ref="containerRef" class="three-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'

const containerRef = ref(null)
let scene, camera, renderer, sphere, animationId

onMounted(() => {
  // Scene setup
  scene = new THREE.Scene()
  
  // Camera setup
  camera = new THREE.PerspectiveCamera(
    75, // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    0.1, // near clipping plane
    1000 // far clipping plane
  )
  camera.position.z = 5
  
  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  containerRef.value.appendChild(renderer.domElement)
  
  // Create a sphere
  const geometry = new THREE.SphereGeometry(1, 32, 32)
  const material = new THREE.MeshStandardMaterial({ 
    color: 0x0077ff,
    roughness: 0.5,
    metalness: 0.5
  })
  sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)
  
  const pointLight = new THREE.PointLight(0xffffff, 1)
  pointLight.position.set(5, 5, 5)
  scene.add(pointLight)
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize)
  
  // Start animation loop
  animate()
})

const animate = () => {
  animationId = requestAnimationFrame(animate)
  
  // Rotate the sphere
  sphere.rotation.x += 0.01
  sphere.rotation.y += 0.01
  
  renderer.render(scene, camera)
}

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  cancelAnimationFrame(animationId)
  renderer.dispose()
})
</script>

<style scoped>
.three-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>