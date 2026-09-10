<template>
  <div class="spear-divider" aria-hidden="true">
    <svg class="spear-divider__tip" viewBox="0 0 48 64" fill="none" focusable="false">
      <path class="spear-divider__stroke" d="M16 32h32M38 27v10" />
      <path class="spear-divider__gold" d="m4 32 10-3v6Z" />
    </svg>
    <span class="spear-divider__line" />
    <svg class="spear-divider__center" viewBox="204 0 312 64" fill="none" focusable="false">
      <g class="spear-divider__stroke">
        <path d="m204 32 18-8h76m124 0h76l18 8" />
        <path d="M204 32h50l13 8h49m88 0h49l13-8h50" opacity=".55" />
        <path d="m284 24 18-9 30 17-30 17-18-9m152-16-18-9-30 17 30 17 18-9" />
        <path d="m342 32 18-24 18 24-18 24Z" />
      </g>
      <path class="spear-divider__ruby" d="m360 20 5 12-5 12-5-12Z" />
    </svg>
    <span class="spear-divider__line spear-divider__line--right" />
    <svg class="spear-divider__tip spear-divider__tip--right" viewBox="0 0 48 64" fill="none" focusable="false">
      <path class="spear-divider__stroke" d="M16 32h32M38 27v10" />
      <path class="spear-divider__gold" d="m4 32 10-3v6Z" />
    </svg>
  </div>
</template>

<style scoped>
.spear-divider {
  display: flex;
  align-items: center;
  min-width: 0;
  padding-block: var(--divider-space, 4px);
  color: var(--gold, #bba988);
  opacity: .9;
  pointer-events: none;
}

.spear-divider svg {
  display: block;
  height: var(--divider-height, 24px);
}

.spear-divider__tip {
  flex: 0 0 auto;
  width: calc(var(--divider-height, 24px) * .75);
}

.spear-divider__tip--right { transform: scaleX(-1); }

.spear-divider__center {
  /* The motif keeps its aspect ratio; only the plain horizontal lines grow. */
  flex: 0 1 auto;
  min-width: 0;
  width: calc(var(--divider-height, 24px) * 4.875);
}

.spear-divider__stroke { stroke: currentColor; stroke-width: 1; }
.spear-divider__stroke, .spear-divider__stroke path { vector-effect: non-scaling-stroke; }
.spear-divider__gold { fill: currentColor; }
.spear-divider__ruby { fill: #a51d32; }

.spear-divider__line {
  display: flex;
  flex: 1 1 0;
  min-width: calc(var(--divider-height, 24px) * .375);
  gap: calc(var(--divider-height, 24px) * .1875);
}

.spear-divider__line::before, .spear-divider__line::after {
  content: '';
  flex: 13;
  height: 1px;
  background: currentColor;
}

.spear-divider__line::after { flex: 11; }
.spear-divider__line--right { flex-direction: row-reverse; }
</style>
