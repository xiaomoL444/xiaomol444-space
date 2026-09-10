<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue'

const props = withDefaults(defineProps<{ text: string; previewLength?: number }>(), { previewLength: 24 })
const expanded = ref(false)
const toggleButton = ref<HTMLButtonElement | null>(null)
const descriptionId = useId()
const compactText = computed(() => props.text.replace(/\s+/g, ' ').trim())
const isLong = computed(() => compactText.value.length > props.previewLength || props.text.split('\n').length > 3)
watch(() => props.text, () => { expanded.value = false })

async function toggleDescription() {
  const collapsing = expanded.value
  expanded.value = !expanded.value
  await nextTick()
  // Keep the same control in reach when a long paragraph collapses above it.
  if (collapsing && toggleButton.value) {
    const bounds = toggleButton.value.getBoundingClientRect()
    if (bounds.top < 0 || bounds.bottom > window.innerHeight) toggleButton.value.scrollIntoView({ block: 'nearest' })
  }
}
</script>

<template>
  <div class="exhibit-description" @click.stop>
    <p :id="descriptionId">{{ expanded ? text : compactText.slice(0, previewLength) || '暂无介绍' }}{{ !expanded && compactText.length > previewLength ? '…' : '' }}</p>
    <button v-if="isLong" ref="toggleButton" class="description-toggle" type="button" :aria-expanded="expanded" :aria-controls="descriptionId" @click="toggleDescription">
      {{ expanded ? '收起简介' : '展开简介' }}
    </button>
  </div>
</template>

<style scoped>
.exhibit-description { margin: 0; color: #d5c6c3; font-size: .875rem; line-height: 1.7; overflow-wrap: anywhere; }
.exhibit-description p { margin: 0; white-space: pre-line; }
.description-toggle { display: block; width: fit-content; min-height: 28px; margin-top: 4px; padding: 2px 0; border: 0; background: transparent; color: var(--gold-light); font-size: .875rem; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
</style>
