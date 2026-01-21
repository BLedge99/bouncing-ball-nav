<template>
  <div>
    <canvas ref="canvas" class="three-canvas"></canvas>
    <div class="health-display">Health: {{ health }}/{{ maxHealth }}</div>
    <button class="reset-button" @click="resetBallPosition">Reset Ball Position</button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import '../style.css'
import { getUserId, getPosition, savePosition, getHealth, updateHealth } from '../services/api'

const userId = getUserId();
const currentLevel = 1;

// Health state
const health = ref(100);
const maxHealth = ref(100);

const canvas = ref(null)

let renderer = null
let camera = null
let scene = null
let onMouseMove = null
let onKeyDown = null
let onKeyUp = null
let saveInterval = null
let sphere = null
let cameraActionHandler = null
let onWindowResize = null
let animationId = null

// Physics / room constants moved to module scope so template can access reset
const roomSize = 120;
const ballRadius = 5;
const half = roomSize / 2;

// Shared physics vector so resetBallPosition can access it
let velocity = new THREE.Vector3(0, 0, 0);
const gravity = -0.5;
const damping = 0.85;
const airResistance = 0.98;
const restingThreshold = 0.3;
const groundFriction = 0.95;
const movementForce = 0.4;
let isOnGround = false;
let lastSpikeHit = 0;
const spikeHitCooldown = 1000;
const spikeDamage = 5;

function resetBallPosition() {
    if (sphere) {
        sphere.position.set(half - ballRadius, 0, 0);
        velocity.set(0, 0, 0);
        isOnGround = false;
    }
}

onMounted(async () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: true });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    camera.position.setZ(100);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 30, 10);
    pointLight.castShadow = true;
    scene.add(pointLight);

    const textureLoader = new THREE.TextureLoader();

    const backgroundTexture = textureLoader.load('/pic2.png');
    scene.background = backgroundTexture;

    const sphereTexture = textureLoader.load('/pic1.png');

    const roomMats = [];
    for (let i = 0; i < 6; i++) {
        roomMats.push(new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.BackSide }));
    }
    roomMats[3] = new THREE.MeshStandardMaterial({ map: backgroundTexture, side: THREE.BackSide });

    const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
    const room = new THREE.Mesh(roomGeometry, roomMats);
    room.receiveShadow = true;
    scene.add(room);

    const geometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const material = new THREE.MeshStandardMaterial({ map: sphereTexture, color: 0xFF6347, metalness: 0.2, roughness: 0.5 });
    sphere = new THREE.Mesh(geometry, material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    //Add Spikes 
    const spikes = [];
    const spikeCount = 15;
    const spikeHeight = 15;
    const spikeRadius = 2;
    const spikeGeometry = new THREE.ConeGeometry(spikeRadius, spikeHeight, 8);
    const spikeMaterial = new THREE.MeshStandardMaterial({ color: 0xff6347, metalness: 1.0, roughness: 0.2 });
    const floorY = -half; 
    for (let i = 0; i < spikeCount; i++) {
        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        const margin = 8;
        const x = THREE.MathUtils.randFloat(-half + margin, half - margin);
        const z = THREE.MathUtils.randFloat(-half + margin, half - margin);
        spike.position.set(x, floorY + spikeHeight / 2, z);
        spike.castShadow = true;
        spike.receiveShadow = true;
        scene.add(spike);
        spikes.push(spike);
    }

    // Load initial position and health from backend
    try {
        const savedPosition = await getPosition(userId, currentLevel);
        sphere.position.set(
            savedPosition.position.x,
            savedPosition.position.y,
            savedPosition.position.z
        );
        console.log('Loaded position:', savedPosition.position);

        const healthData = await getHealth(userId);
        health.value = healthData.health;
        maxHealth.value = healthData.maxHealth;
        console.log('Loaded health:', healthData);
    } catch (error) {
        console.error('Error loading game state:', error);
        sphere.position.set(half - ballRadius, 0, 0);
    }

    const bounds = {
        top: half,
        bottom: -half,
        left: -half,
        right: half,
        front: half,
        back: -half,
    };

    const keysPressed = {
        w: false,
        a: false,
        s: false,
        d: false,
        space: false,
    };

    const mouse3D = new THREE.Vector3(0, 0, 0);
    const raycaster = new THREE.Raycaster();
    const mouseNormalized = new THREE.Vector2();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    // Resize handler keeps camera and renderer correct when entering fullscreen or resizing
    onWindowResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', onWindowResize);

    onMouseMove = (event) => {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        mouseNormalized.x = mouseX;
        mouseNormalized.y = mouseY;

        // Update plane to sphere's Z position so cursor tracking works at any depth
        planeZ.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, sphere.position.z)
        );

        raycaster.setFromCamera(mouseNormalized, camera);
        raycaster.ray.intersectPlane(planeZ, mouse3D);
    };

    onKeyDown = (event) => {
        if (event.key === 'w') keysPressed.w = true;
        if (event.key === 'a') keysPressed.a = true;
        if (event.key === 's') keysPressed.s = true;
        if (event.key === 'd') keysPressed.d = true;
        if (event.key === ' ') {
            keysPressed.space = true;
            event.preventDefault();
        }
    };
    window.addEventListener('keydown', onKeyDown);

    onKeyUp = (event) => {
        if (event.key === 'w') keysPressed.w = false;
        if (event.key === 'a') keysPressed.a = false;
        if (event.key === 's') keysPressed.s = false;
        if (event.key === 'd') keysPressed.d = false;
        if (event.key === ' ') keysPressed.space = false;
    };
    window.addEventListener('keyup', onKeyUp);

    function processCursorGravity() {
        const direction = new THREE.Vector3().subVectors(mouse3D, sphere.position);
        const distance = direction.length();
        
        const maxDistance = 20;
        const strength = 1;
        
        if (distance < maxDistance && distance > 0) {
            const forceMagnitude = strength / (distance * distance);
            const cursorForce = direction.normalize().multiplyScalar(forceMagnitude);
            velocity.add(cursorForce);
        }
    }

    function processBallBounce(){
        let touchedGround = false;

        // Bottom wall (floor in Y coordinate system)
        if (sphere.position.y - ballRadius <= bounds.bottom) {
            sphere.position.y = bounds.bottom + ballRadius;
            
            if (Math.abs(velocity.y) < restingThreshold) {
                velocity.y = 0;
                isOnGround = true;
                touchedGround = true;
                velocity.x *= groundFriction;
                velocity.z *= groundFriction;
            } else {
                velocity.y = -velocity.y * damping;
                velocity.x *= damping;
                velocity.z *= damping;
            }
        }
        
        // Top wall
        if (sphere.position.y + ballRadius >= bounds.top) {
            sphere.position.y = bounds.top - ballRadius;
            velocity.y = -velocity.y * damping;
            velocity.x *= damping;
            velocity.z *= damping;
        }
        
        // Left wall
        if (sphere.position.x - ballRadius <= bounds.left) {
            sphere.position.x = bounds.left + ballRadius;
            velocity.x = -velocity.x * damping;
            velocity.z *= damping;  
            velocity.y *= damping;
        }
        
        // Right wall
        if (sphere.position.x + ballRadius >= bounds.right) {
            sphere.position.x = bounds.right - ballRadius;
            velocity.x = -velocity.x * damping;
            velocity.z *= damping;
            velocity.y *= damping;
        }
        
        // Back wall (Z)
        if (sphere.position.z - ballRadius <= bounds.back) {
            sphere.position.z = bounds.back + ballRadius;
            velocity.z = -velocity.z * damping;
            velocity.x *= damping;
            velocity.y *= damping;
        }
        
        // Front wall (Z)
        if (sphere.position.z + ballRadius >= bounds.front) {
            sphere.position.z = bounds.front - ballRadius;
            velocity.z = -velocity.z * damping;
            velocity.x *= damping;
            velocity.y *= damping;
        }

        if (!touchedGround) {
            isOnGround = false;
        }
    }

    function processSpikeCollisions(){
        const now = Date.now();
        for (let i = 0; i < spikes.length; i++) {
            const spike = spikes[i];
            const tip = new THREE.Vector3(spike.position.x, spike.position.y + spikeHeight / 2, spike.position.z);
            const dist = tip.distanceTo(sphere.position);
            
            if (dist <= ballRadius + 1.2) {
                if (now - lastSpikeHit > spikeHitCooldown && health.value > 0) {
                    lastSpikeHit = now;
                    health.value = Math.max(0, health.value - spikeDamage);
                    updateHealth(userId, health.value, maxHealth.value).catch(console.error);
                }
            }
        }
    }

    function processMovement(){
        if (keysPressed.w) velocity.z -= movementForce;
        if (keysPressed.s) velocity.z += movementForce;
        if (keysPressed.a) velocity.x -= movementForce;
        if (keysPressed.d) velocity.x += movementForce;
        if (keysPressed.space) velocity.y += movementForce;
    }
    
    function cameraToTop() {
        gsap.to(camera.position, {
            duration: 3,
            x: 0,
            y: 10,
            z: 10,
            onUpdate: () => camera.lookAt(0, 0, 0)
        });
    }

    function cameraToSide() {
        gsap.to(camera.position, {
            duration: 3,
            x: 0,
            y: 0,
            z: 100,
            onUpdate: () => {
                camera.lookAt(0, 0, 0);
            }
        });
    }

    cameraActionHandler = (e) => {
        const action = e?.detail?.action;
        if (action === 'top') cameraToTop();
        else if (action === 'side') cameraToSide();
    };
    window.addEventListener('camera-action', cameraActionHandler);

    function animate() {
        animationId = requestAnimationFrame(animate);

        // Apply gravity only when not on ground
        if (!isOnGround) {
            velocity.y += gravity * 0.016;
        }

        velocity.multiplyScalar(airResistance);

        sphere.position.add(velocity);

        processCursorGravity();
        processBallBounce();
        processSpikeCollisions();
        processMovement();

        sphere.rotation.x += 0.01;
        sphere.rotation.y += 0.01;

        renderer.render(scene, camera);
    }

    window.addEventListener('mousemove', onMouseMove);
    animate();

    // Auto-save position every 5 seconds
    saveInterval = setInterval(async () => {
        if (sphere) {
            try {
                await savePosition(userId, currentLevel, {
                    x: sphere.position.x,
                    y: sphere.position.y,
                    z: sphere.position.z
                });
                console.log('Position saved:', sphere.position);
            } catch (error) {
                console.error('Error saving position:', error);
            }
        }
    }, 5000);
});

onUnmounted(async () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (onMouseMove) window.removeEventListener('mousemove', onMouseMove);
    if (onKeyDown) window.removeEventListener('keydown', onKeyDown);
    if (onKeyUp) window.removeEventListener('keyup', onKeyUp);
    if (saveInterval) clearInterval(saveInterval);
    if (cameraActionHandler) window.removeEventListener('camera-action', cameraActionHandler);
    if (onWindowResize) window.removeEventListener('resize', onWindowResize);
    if (renderer) renderer.dispose();

    // Final save on unmount
    if (sphere) {
        try {
            await savePosition(userId, currentLevel, {
                x: sphere.position.x,
                y: sphere.position.y,
                z: sphere.position.z
            });
            await updateHealth(userId, health.value, maxHealth.value);
            console.log('Final state saved');
        } catch (error) {
            console.error('Error saving final state:', error);
        }
    }
});
</script>

<style scoped>
.three-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 0;
    pointer-events: none;
}

.health-display {
    position: fixed;
    top: 20px;
    left: 20px;
    color: white;
    font-size: 24px;
    font-weight: bold;
    background: rgba(0, 0, 0, 0.7);
    padding: 10px 20px;
    border-radius: 8px;
    z-index: 1000;
    pointer-events: none;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

.reset-button {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    padding: 10px 20px;
    font-size: 16px;
    border: none;
    border-radius: 5px;
    background-color: #ff6347;
    color: white;
    cursor: pointer;
}
</style>