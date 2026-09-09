import { BAT_INSTANCE_STRIDE, BatRenderer } from './batRenderer'

const DIRECTION = { x: .8, y: -.6 }
const CROSS = { x: -DIRECTION.y, y: DIRECTION.x }
const FLIGHT_ANGLE = Math.atan2(DIRECTION.y, DIRECTION.x)
const CUT_AT = 1750
const COVER_UNTIL = CUT_AT + 400
const ENTER_AT = 2300
const FINISH_AT = 3700
const MAX_FRAME_STEP = 32

type Bat = { x: number; y: number; offset: number; timeOffset: number; size: number; speed: number; depth: number; phase: number; frequency: number; tilt: number; drift: number; cover?: boolean; leadStretch?: number; tailStretch?: number }

export function getFlightLayout(width: number, height: number) {
  const screenScale = Math.max(1, Math.sqrt(width * height / (1920 * 1080)))
  const size = Math.min(width * .32, Math.max(86, Math.min(310 * screenScale, Math.sqrt(width * height) * .22)))
  const along = width * DIRECTION.x - height * DIRECTION.y
  const across = width * CROSS.x + height * CROSS.y
  return { size, travel: along + size * 3.4, bandDepth: along + size * .8, bandLength: across + size * 2 }
}

export function getBatPose(bat: Bat, time: number, width: number, height: number, layout = getFlightLayout(width, height), cull = true) {
  const centerAt = CUT_AT + bat.timeOffset
  const lead = Math.max(0, CUT_AT - time), tail = Math.max(0, time - COVER_UNTIL)
  // Spread arrivals and departures with a monotone flight clock. It rejoins
  // the original path smoothly throughout the fully covered page change.
  const motionTime = time + (bat.leadStretch ?? 0) * lead * lead / (lead + 400)
    - (bat.tailStretch ?? 0) * tail * tail / (tail + 400)
  const progress = (motionTime - centerAt) / CUT_AT
  const motion = bat.cover ? progress * (.48 + .52 * progress * progress) : progress
  const travel = motion * layout.travel * bat.speed + bat.offset * layout.size
  const sway = (Math.sin(time * .003 + bat.phase) - Math.sin(centerAt * .003 + bat.phase)) * bat.drift * layout.size
  const x = bat.x * width + DIRECTION.x * travel + CROSS.x * sway
  const y = bat.y * height + DIRECTION.y * travel + CROSS.y * sway
  const size = Math.min(width * .44, layout.size * bat.size)
  if (cull && (x + size * .7 < 0 || x - size * .7 > width || y + size * .7 < 0 || y - size * .7 > height)) return null
  // Keep wing animation on the global clock even for delayed flight paths.
  return { x, y, size, angle: bat.tilt + Math.sin(time * .004 + bat.phase) * .15, frame: ((Math.floor((time * bat.frequency / 1000 + bat.phase) * 20) % 20) + 20) % 20 }
}

export class BatFlight {
  private renderer: BatRenderer
  private bats: Bat[] = []
  private instances = new Float32Array(0)
  private width = 1
  private height = 1
  private raf = 0
  private previousTime = 0
  private elapsed = 0
  private completeAt = FINISH_AT
  private revealRequested = false
  private revealReady = false
  private entered = false
  private started = false
  private stopped = false

  constructor(
    private canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    private onPeak: () => Promise<void>,
    private onEntered: () => void,
    private onComplete: () => void,
  ) {
    this.renderer = new BatRenderer(canvas, image)
    this.resize()
  }

  private createBats() {
    const { size, bandDepth, bandLength } = getFlightLayout(this.width, this.height)
    const count = Math.ceil(bandDepth * bandLength / (size * size) * 68)
    const columns = Math.ceil(Math.sqrt(count * bandDepth / bandLength))
    const rows = Math.ceil(count / columns)
    const makeBat = (along: number, across: number, offset = 0, timeOffset = 0): Bat => {
      const depth = Math.random()
      const u = (along - .5) * bandDepth, v = (across - .5) * bandLength
      return {
        x: .5 + (DIRECTION.x * u + CROSS.x * v) / this.width,
        y: .5 + (DIRECTION.y * u + CROSS.y * v) / this.height,
        offset, timeOffset, depth,
        size: .7 + depth * .65,
        speed: .95 + Math.random() * .32,
        phase: Math.random() * Math.PI * 2,
        frequency: 3.7 + Math.random() * 1.8,
        tilt: -.3 + Math.random() * .6,
        drift: .09 + Math.random() * .22,
      }
    }
    // Lay out the flock along a NW–SE band, perpendicular to its flight.
    // Both edges cross the viewport diagonally instead of exposing a corner.
    this.bats = Array.from({ length: columns * rows }, (_, index) => {
      const wave = (index * .61803398875) % 1
      const timeOffset = wave < .2 ? -280 + Math.random() * 160 : wave > .8 ? 160 + Math.random() * 200 : -120 + Math.random() * 240
      return makeBat(
        (index % columns + Math.random()) / columns,
        (Math.floor(index / columns) + Math.random()) / rows,
        0,
        timeOffset,
      )
    })
    for (let i = 0; i < 32; i++) {
      const bat = makeBat(Math.random(), Math.random(), 1.9 + Math.random() * 1.6)
      bat.size = .45 + Math.random() * .45
      bat.speed = 1.18 + Math.random() * .25
      this.bats.push(bat)
    }
    for (let i = 0; i < 48; i++) {
      const bat = makeBat(Math.random(), Math.random(), -1.6 - Math.random() * 1.6, Math.random() * 180)
      bat.size = .5 + Math.random() * .4
      bat.speed = 1.08 + Math.random() * .16
      this.bats.push(bat)
    }
    this.coverTransition()
    for (const bat of this.bats) {
      bat.leadStretch = .34 * Math.random() ** 2
      bat.tailStretch = .38 * Math.random() ** 2
    }
    // Give the opaque core a long spatial falloff on both flight-axis edges.
    // Cubic density leaves only 1/16 of each ramp's bats in its outer half.
    // Add these after coverage repair so their gaps remain deliberately open.
    const rampDepth = bandDepth * .65
    const rampCount = Math.ceil(rampDepth * bandLength / (size * size) * 18)
    for (const side of [-1, 1]) {
      for (let i = 0; i < rampCount; i++) {
        const quantile = (i + Math.random()) / rampCount
        const distance = (1 - Math.pow(1 - quantile, .25)) * rampDepth
        const along = .5 + side * (.5 + distance / bandDepth)
        const across = (i * .61803398875 + Math.random() * .25) % 1
        // At 1900 ms this origin is the real position: travel and sway are zero.
        const bat = makeBat(along, across, 0, 150)
        bat.cover = true
        bat.leadStretch = .34 * Math.random() ** 2
        bat.tailStretch = .38 * Math.random() ** 2
        this.bats.push(bat)
      }
    }
    this.bats.sort((a, b) => a.depth - b.depth)
    this.instances = new Float32Array(this.bats.length * BAT_INSTANCE_STRIDE)
    const layout = getFlightLayout(this.width, this.height)
    this.completeAt = Math.max(FINISH_AT, this.elapsed)
    while (this.bats.some((bat) => getBatPose(bat, this.completeAt, this.width, this.height, layout))) this.completeAt += 32
    if (!this.revealRequested && this.elapsed === 0) {
      // Start with every bat beyond the viewport instead of fading early ones in.
      while (this.bats.some((bat) => getBatPose(bat, this.elapsed, this.width, this.height, layout))) this.elapsed -= 32
    }
  }

  private coverTransition() {
    const layout = getFlightLayout(this.width, this.height)
    const { bandDepth, bandLength } = layout
    const targetsPerPass = Math.max(64, Math.ceil(bandDepth * bandLength / (this.width * this.height) * 64))
    const toBandPose = (pose: NonNullable<ReturnType<typeof getBatPose>>) => {
      const dx = pose.x - this.width / 2, dy = pose.y - this.height / 2
      return {
        ...pose,
        x: dx * DIRECTION.x + dy * DIRECTION.y + bandDepth / 2,
        y: dx * CROSS.x + dy * CROSS.y + bandLength / 2,
        angle: pose.angle - FLIGHT_ANGLE,
      }
    }
    // Keep a moving, opaque overlap before and after the page changes.
    for (const time of [CUT_AT, CUT_AT + 200, COVER_UNTIL]) {
      // Probe the same rotated band, including its offscreen ends. Filling a
      // screen-aligned rectangle here would bring the old square front back.
      const probe = this.renderer.createCoverageProbe(bandDepth, bandLength)
      for (const bat of this.bats) {
        const pose = getBatPose(bat, time, this.width, this.height, layout, false)!
        probe.add(toBandPose(pose))
      }
      // Reinforce holes with ordinary bats, each following its own flight and
      // wing rhythm. The back layer crosses the center more slowly.
      for (let pass = 0; pass < 32; pass++) {
        const gaps = probe.gaps()
        if (!gaps.length) break
        const targets: { x: number; y: number }[] = []
        const spacingSquared = (layout.size * .55) ** 2
        for (const gap of gaps) {
          if (targets.some((target) => (gap.x - target.x) ** 2 + (gap.y - target.y) ** 2 < spacingSquared)) continue
          targets.push(gap)
          if (targets.length === targetsPerPass) break
        }
        for (const gap of targets) {
          const bat: Bat = {
            x: .5, y: .5, cover: true,
            offset: 0, timeOffset: 150, size: 1.05 + Math.random() * .25,
            depth: Math.random(), speed: 1.1 + Math.random() * .18,
            phase: Math.random() * Math.PI * 2, frequency: 3.7 + Math.random() * 1.8,
            tilt: -.3 + Math.random() * .6, drift: .09 + Math.random() * .12,
          }
          let pose = toBandPose(getBatPose(bat, time, this.width, this.height, layout, false)!)
          const anchor = probe.anchor(pose)
          const du = gap.x - pose.x - anchor.x, dv = gap.y - pose.y - anchor.y
          bat.x += (DIRECTION.x * du + CROSS.x * dv) / this.width
          bat.y += (DIRECTION.y * du + CROSS.y * dv) / this.height
          pose = toBandPose(getBatPose(bat, time, this.width, this.height, layout, false)!)
          this.bats.push(bat)
          probe.add(pose)
        }
      }
    }
  }

  resize = () => {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const pixelWidth = Math.round(width * dpr), pixelHeight = Math.round(height * dpr)
    const layoutChanged = !this.bats.length || (!this.started && (this.width !== width || this.height !== height))
    if (!layoutChanged && this.canvas.width === pixelWidth && this.canvas.height === pixelHeight) return
    this.canvas.width = pixelWidth
    this.canvas.height = pixelHeight
    // Keep the same flock in motion when browser chrome or orientation changes.
    // The renderer scales its logical viewport instead of spawning a new swarm.
    if (layoutChanged) {
      this.width = width; this.height = height
      if (!this.started) this.elapsed = 0
      this.createBats()
    }
    this.resetFrameClock()
  }

  start() {
    if (this.started || this.stopped) return
    this.started = true
    this.resetFrameClock()
    this.drawSwarm(this.elapsed)
    window.addEventListener('resize', this.resize, { passive: true })
    document.addEventListener('visibilitychange', this.resetFrameClock)
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    if (this.stopped) return
    this.stopped = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    document.removeEventListener('visibilitychange', this.resetFrameClock)
    this.renderer.dispose()
  }

  private resetFrameClock = () => { this.previousTime = 0 }

  private drawSwarm(time: number) {
    const layout = getFlightLayout(this.width, this.height)
    let count = 0
    for (const bat of this.bats) {
      const pose = getBatPose(bat, time, this.width, this.height, layout)
      if (!pose) continue
      const at = count++ * BAT_INSTANCE_STRIDE
      this.instances[at] = pose.x; this.instances[at + 1] = pose.y
      this.instances[at + 2] = pose.size; this.instances[at + 3] = pose.angle
      this.instances[at + 4] = pose.frame
      this.instances[at + 5] = (.07 + bat.depth * .15)
      this.instances[at + 6] = (.045 + bat.depth * .10)
      this.instances[at + 7] = (.095 + bat.depth * .18)
    }
    this.renderer.draw(this.instances, count, this.width, this.height)
  }

  private frame = (time: number) => {
    if (this.stopped) return
    if (document.hidden) {
      this.resetFrameClock()
      this.raf = requestAnimationFrame(this.frame)
      return
    }
    // A shader compile or a slow frame must not skip the visible entrance.
    const delta = this.previousTime ? Math.min(MAX_FRAME_STEP, Math.max(0, time - this.previousTime)) : 0
    if (!this.revealRequested || this.revealReady) this.elapsed += delta
    this.previousTime = time
    const shouldReveal = !this.revealRequested && this.elapsed >= CUT_AT
    if (shouldReveal || (this.revealRequested && !this.revealReady)) this.elapsed = CUT_AT
    this.drawSwarm(this.elapsed)
    if (shouldReveal) {
      this.revealRequested = true
      void this.onPeak().then(() => { this.revealReady = true })
    }
    if (!this.entered && this.revealReady && this.elapsed >= ENTER_AT) {
      this.entered = true
      this.onEntered()
    }
    if (this.entered && this.elapsed >= this.completeAt) {
      this.stop()
      this.onComplete()
      return
    }
    this.raf = requestAnimationFrame(this.frame)
  }
}
