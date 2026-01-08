<template>
  <div id="app" class="app-root">
    <ThreeScene />
    <HelloWorld msg="Hello from overlay" />
  </div>
</template>

<script setup>
import ThreeScene from './components/GravityScene.vue'
import HelloWorld from './components/HelloWorld.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app, .app-root {
  height: 100%;
  width: 100%;
}

body {
  overflow: hidden;
}

.app-root {
  position: relative;
}

</style>