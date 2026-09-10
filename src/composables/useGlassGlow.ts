import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Shared pointer listeners light nearby glass surfaces for hover and touch. */
export function useGlassGlow(root: Ref<HTMLElement | null>) {
  const reach = 140
  let surfaces: HTMLElement[] = []
  let pointer: { x: number; y: number } | null = null
  let contact: { pointerId: number; surface: HTMLElement } | null = null
  let frame = 0
  let reducedMotion: MediaQueryList | undefined

  function reset() {
    pointer = null
    contact = null
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

    // Touch implicitly captures its target, so pointerout alone cannot detect sliding off.
    if (contact) {
      const rect = positions.find(({ surface }) => surface === contact?.surface)?.rect
      if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        reset()
        return
      }
    }

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

  function start(event: PointerEvent) {
    if (event.pointerType === 'mouse' || !event.isPrimary || contact || reducedMotion?.matches) return
    if (!(event.target instanceof Element)) return
    const surface = event.target.closest<HTMLElement>('[data-glass]')
    if (!surface || !surfaces.includes(surface) || surface.closest(':disabled, [aria-disabled="true"], [inert]')) return
    contact = { pointerId: event.pointerId, surface }
    pointer = { x: event.clientX, y: event.clientY }
    schedule()
  }

  function move(event: PointerEvent) {
    if (reducedMotion?.matches) {
      reset()
      return
    }
    if (event.pointerType === 'mouse' ? contact !== null : contact?.pointerId !== event.pointerId) return
    pointer = { x: event.clientX, y: event.clientY }
    schedule()
  }

  function end(event: PointerEvent) {
    if (contact?.pointerId === event.pointerId) reset()
  }

  function leave(event: PointerEvent) {
    if (!event.relatedTarget && (!contact || contact.pointerId === event.pointerId)) reset()
  }

  function onVisibilityChange() {
    if (document.hidden) reset()
  }

  function refresh() {
    reset()
    surfaces = Array.from(root.value?.querySelectorAll<HTMLElement>('[data-glass]') ?? [])
  }

  onMounted(() => {
    refresh()
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.addEventListener('change', reset)
    document.addEventListener('pointerdown', start, { passive: true })
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerup', end)
    document.addEventListener('pointercancel', end)
    document.addEventListener('lostpointercapture', end)
    document.addEventListener('pointerout', leave)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', reset)
    window.addEventListener('resize', schedule, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true, capture: true })
  })

  onBeforeUnmount(() => {
    reset()
    reducedMotion?.removeEventListener('change', reset)
    document.removeEventListener('pointerdown', start)
    document.removeEventListener('pointermove', move)
    document.removeEventListener('pointerup', end)
    document.removeEventListener('pointercancel', end)
    document.removeEventListener('lostpointercapture', end)
    document.removeEventListener('pointerout', leave)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('blur', reset)
    window.removeEventListener('resize', schedule)
    window.removeEventListener('scroll', schedule, true)
    surfaces = []
  })

  return { refresh, reset }
}
