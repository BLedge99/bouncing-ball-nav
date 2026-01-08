<template>
  <div ref="containerRef" class="three-container"></div>
</template>


<script setup>

    import * as THREE from 'three'
    import '../style.css'

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({canvas: document.getElementById('bg')});

    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.setZ(30);

    renderer.render(scene, camera);

    const geometry = new THREE.SphereGeometry(5, 32, 32);
    const material = new THREE.MeshBasicMaterial( { color: 0x0077ff, wireframe: true } );
    const sphere = new THREE.Mesh( geometry, material );

    scene.add(sphere);

    function animate() {
      requestAnimationFrame( animate );

      sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.01;

      renderer.render( scene, camera );
    }

    animate();

</script>

