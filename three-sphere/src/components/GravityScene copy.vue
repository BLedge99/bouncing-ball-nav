<template>
  <canvas ref="canvas" class="three-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import '../style.css'

// Mouse position (normalized to -1 to 1 range)
let mouseX = 0;
let mouseY = 0;

const canvas = ref(null)

let renderer = null
let onMouseMove = null

onMounted(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas:  canvas.value, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.setZ(30);

    const textureLoader = new THREE.TextureLoader();

    const backgroundTexture = textureLoader.load('/pic2.png');
    scene.background = backgroundTexture;

    const sphereTexture = textureLoader.load('/pic1.png');

    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial({map: sphereTexture, color: 0xFF6347, wireframe: false });
    const sphere = new THREE.Mesh(geometry, material);

    scene.add(sphere);

    const velocity = new THREE.Vector3(0, 0, 0);
    const gravity = -0.98;
    const damping = 0.9;
    const airResistance = 0.99;

    const fov = camera.fov * (Math.PI / 180);
    const height = 2 * Math.tan(fov / 2) * camera.position.z;
    const width = height * camera.aspect;

    const bounds = {
        top: height / 2 - 5,
        bottom: -height / 2 + 5,
        left: -width / 2 + 5,
        right: width / 2 - 5,
        front: 5,
        back:  -10
    };

    const ballRadius = 5;

    const mouse3D = new THREE.Vector3(0, 0, 0);
    const raycaster = new THREE.Raycaster();
    const mouseNormalized = new THREE.Vector2();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    onMouseMove = (event) => {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        mouseNormalized.x = mouseX;
        mouseNormalized.y = mouseY;

        raycaster.setFromCamera(mouseNormalized, camera);
        raycaster.ray.intersectPlane(planeZ, mouse3D);
    };

    function processCursorGravity() {
        const direction = new THREE.Vector3().subVectors(mouse3D, sphere.position);
        const distance = direction.length();
        
        const maxDistance = 20; // No effect beyond this
        const strength = 1; // How strong the pull is
        
        if (distance < maxDistance && distance > 0) {
            // Inverse square: strong when close, weak when far
            const forceMagnitude = strength / (distance * distance);
            const cursorForce = direction.normalize().multiplyScalar(forceMagnitude);
            velocity.add(cursorForce);
        }
    }

    function processBallBounce(){
        if (sphere.position.y - ballRadius <= bounds.bottom) {
            sphere.position.y = bounds.bottom + ballRadius;
            velocity.y = -velocity.y * damping;
            velocity.x *= damping;
            velocity.z *= damping;
        }
        if (sphere.position.y + ballRadius >= bounds.top) {
            sphere.position.y = bounds.top - ballRadius;
            velocity.y = -velocity.y * damping;
            velocity.x *= damping;
            velocity.z *= damping;
        }
        if (sphere.position.x - ballRadius <= bounds.left) {
            sphere.position.x = bounds.left + ballRadius;
            velocity.x = -velocity.x * damping;
            velocity.z *= damping;  
            velocity.y *= damping;
        }
        if (sphere.position.x + ballRadius >= bounds.right) {
            sphere.position.x = bounds.right - ballRadius;
            velocity.x = -velocity.x * damping;
            velocity.z *= damping;
            velocity.y *= damping;
        }
        if (sphere.position.z - ballRadius <= bounds.back) {
            sphere.position.z = bounds.back + ballRadius;
            velocity.z = -velocity.z * damping;
            velocity.x *= damping;
            velocity.y *= damping;
        }
        if (sphere.position.z + ballRadius >= bounds.front) {
            sphere.position.z = bounds.front - ballRadius;
            velocity.z = -velocity.z * damping;
            velocity.x *= damping;
            velocity.y *= damping;
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        // Apply gravity
        velocity.y += gravity * 0.01; // Scale gravity effect

        // Apply air resistance
        velocity.multiplyScalar(airResistance);

        // Update sphere position
        sphere.position.add(velocity);

        processCursorGravity();
        processBallBounce();

        // Keep the rotation
        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;

        renderer.render(scene, camera);
    }
    window.addEventListener('mousemove', onMouseMove);
    animate();
});

onUnmounted(() => {
    if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
    if (renderer) renderer.dispose();

});
</script>

<style scoped>
    .three-canvas{
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
        z-index: 0;
        pointer-events: none;
    }
</style>