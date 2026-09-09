import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** One shared pointer listener lights every nearby glass surface, including nested ones. */
export function useGlassGlow(root: Ref<HTMLElement | null>) {
  const reach = 140
  let surfaces: HTMLElement[] = []
  let pointer: { x: number; y: number } | null = null
  let frame = 0
  let reducedMotion: MediaQueryList | undefined

  function reset() {
    pointer = null
    cancelAnimationFrame(frame)
    frame = 0
    for (const surface of surfaces) surface.style.setProperty('--glow-opacity', '0')
  }

  function update() {
    frame = 0
    if (!pointer) return
    const { x, y } = pointer
    // Complete layout reads before writing styles to avoid repeated layout work.
    const positions = surfaces.map((surface) => ({ surface, rect: surface.getBoundingClientRect() }))

    for (const { surface, rect } of positions) {
      const dx = Math.max(rect.left - x, 0, x - rect.right)
      const dy = Math.max(rect.top - y, 0, y - rect.bottom)
      const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / reach)
      const strength = proximity * proximity * (3 - 2 * proximity)
      surface.style.setProperty('--glow-x', `${x - rect.left}px`)
      surface.style.setProperty('--glow-y', `${y - rect.top}px`)
      surface.style.setProperty('--glow-opacity', strength.toFixed(3))
    }
  }

  function schedule() {
    if (pointer && !frame) frame = requestAnimationFrame(update)
  }

  function move(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || reducedMotion?.matches) {
      reset()
      return
    }
    pointer = { x: event.clientX, y: event.clientY }
    schedule()
  }

  function leave(event: PointerEvent) {
    if (!event.relatedTarget) reset()
  }

  function onVisibilityChange() {
    if (document.hidden) reset()
  }

  onMounted(() => {
    surfaces = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-glass]') ?? [])
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.addEventListener('change', reset)
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerout', leave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', reset)
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
  })

  onBeforeUnmount(() => {
    reset()
    reducedMotion?.removeEventListener('change', reset)
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerout', leave)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('blur', reset)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('scroll', schedule, true)
    surfaces = []
  })
}
