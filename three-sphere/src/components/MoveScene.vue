<template>
  <div></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import '../style.css'

// Mouse position (normalized to -1 to 1 range)
let mouseX = 0;
let mouseY = 0;

onMounted(() => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg') });

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.setZ(30);

  const geometry = new THREE.SphereGeometry(5, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: 0xFF6347, wireframe: true });
  const sphere = new THREE.Mesh(geometry, material);

  scene.add(sphere);

  // Mouse move event listener
  const onMouseMove = (event) => {
    // Normalize mouse position to -1 to 1 range
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  window.addEventListener('mousemove', onMouseMove);

  function animate() {
    requestAnimationFrame(animate);

    // Smoothly move sphere towards mouse position
    // Scale the normalized coordinates to match the scene
    const targetX = mouseX * 15; // Adjust multiplier for movement range
    const targetY = mouseY * 10;

    // Lerp (linear interpolation) for smooth following
    sphere.position.x += (targetX - sphere.position.x) * 0.05;
    sphere.position.y += (targetY - sphere.position.y) * 0.05;

    // Keep the rotation
    sphere.rotation.x += 0.01;
    sphere.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  animate();

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
  });
})
</script>