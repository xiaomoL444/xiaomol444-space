<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ src: string; name: string }>()
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>

<template>
  <div class="exhibit-cover" @dragstart.prevent>
    <img v-if="src && !failed" :src="src" :alt="name" draggable="false" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="failed = true" />
    <div v-else class="cover-fallback" role="img" :aria-label="`${name}，暂无封面`">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m12 3 9 9-9 9-9-9 9-9Z" stroke="currentColor" />
        <path d="m12 8 4 4-4 4-4-4 4-4Z" stroke="currentColor" />
      </svg>
      <span>暂无封面</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.exhibit-cover { position: relative; overflow: hidden; aspect-ratio: 16 / 9; background: #21121e; }
.exhibit-cover > img { display: block; width: 100%; height: 100%; object-fit: cover; -webkit-user-drag: none; -webkit-user-select: none; user-select: none; transition: transform 400ms ease; }
.exhibit-cover:hover > img { transform: scale(1.025); }
.cover-fallback { display: grid; place-content: center; justify-items: center; gap: 12px; height: 100%; color: var(--gold); background: radial-gradient(ellipse at center, #41212d, #21121e); font-size: .875rem; }
</style>
