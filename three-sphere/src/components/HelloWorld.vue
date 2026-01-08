<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <div class="overlay">
    <h1>{{ msg }}</h1>
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 20;
  padding: 1rem 1.25rem;
  background: rgba(0,0,0,0.5);
  color: #fff;
  pointer-events: auto;
  border-radius: 8px;
  text-align: center;
  max-width: 90%;
  min-width: 180px;
}

.overlay h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}
</style>
