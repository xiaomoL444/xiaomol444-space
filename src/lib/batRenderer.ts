const FRAME_COUNT = 20
const WIDTH = 256
const HEIGHT = 192
const COLUMNS = 5
const ROWS = 4
export const BAT_INSTANCE_STRIDE = 8
type Pose = { x: number; y: number; size: number; angle: number; frame: number }

const vertexSource = `#version 300 es
precision highp float;
layout(location = 0) in vec2 corner;
layout(location = 1) in vec4 pose;
layout(location = 2) in float frame;
layout(location = 3) in vec3 tint;
uniform vec2 resolution;
uniform vec4 bounds[20];
out vec2 uv;
out vec3 color;
void main() {
  int index = int(frame);
  vec2 point = bounds[index].xy + corner * bounds[index].zw;
  vec2 local = (point - .5) * vec2(1., .75) * pose.z;
  float c = cos(pose.w), s = sin(pose.w);
  vec2 position = pose.xy + mat2(c, s, -s, c) * local;
  gl_Position = vec4(position / resolution * vec2(2., -2.) + vec2(-1., 1.), 0., 1.);
  uv = (vec2(float(index % 5), float(index / 5)) + point) / vec2(5., 4.);
  color = tint;
}`
const fragmentSource = `#version 300 es
precision highp float;
uniform sampler2D atlas;
in vec2 uv;
in vec3 color;
out vec4 outputColor;
void main() {
  float alpha = texture(atlas, uv).a;
  if (alpha < .005) discard;
  outputColor = vec4(color, alpha);
}`

/** Only single-bat wing poses are cached. Every bat moves independently. */
export class BatRenderer {
  private atlas: HTMLCanvasElement
  private bounds = new Float32Array(FRAME_COUNT * 4)
  private anchors = new Float32Array(FRAME_COUNT * 2)
  private masks: Uint8Array[] = []
  private gl: WebGL2RenderingContext | null
  private context: CanvasRenderingContext2D | null = null
  private program: WebGLProgram | null = null
  private texture: WebGLTexture | null = null
  private vertices: WebGLBuffer | null = null
  private instances: WebGLBuffer | null = null
  private vao: WebGLVertexArrayObject | null = null
  private resolution: WebGLUniformLocation | null = null
  private coloredFrames: HTMLCanvasElement[][] = []

  constructor(private canvas: HTMLCanvasElement, image: HTMLImageElement) {
    this.atlas = this.prepareAtlas(image)
    this.gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' })
    if (this.gl) this.prepareGpu()
    else {
      this.context = canvas.getContext('2d', { alpha: true })
      if (!this.context) throw new Error('Canvas is unavailable')
      this.coloredFrames = ['#160f1e', '#271a33', '#392647'].map((color) => {
        const atlas = document.createElement('canvas')
        atlas.width = this.atlas.width; atlas.height = this.atlas.height
        const ctx = atlas.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(this.atlas, 0, 0)
        ctx.globalCompositeOperation = 'source-in'
        ctx.fillStyle = color; ctx.fillRect(0, 0, atlas.width, atlas.height)
        return Array.from({ length: FRAME_COUNT }, (_, frame) => {
          const tile = document.createElement('canvas')
          tile.width = WIDTH; tile.height = HEIGHT
          tile.getContext('2d')!.putImageData(ctx.getImageData(frame % COLUMNS * WIDTH, Math.floor(frame / COLUMNS) * HEIGHT, WIDTH, HEIGHT), 0, 0)
          return tile
        })
      })
    }
  }

  private prepareAtlas(image: HTMLImageElement) {
    const source = document.createElement('canvas')
    source.width = 768
    source.height = Math.round(source.width * image.naturalHeight / image.naturalWidth)
    const sourceContext = source.getContext('2d', { willReadFrequently: true })!
    sourceContext.drawImage(image, 0, 0, source.width, source.height)
    const pixels = sourceContext.getImageData(0, 0, source.width, source.height).data
    let left = source.width, top = source.height, right = 0, bottom = 0
    for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
      if (pixels[(y * source.width + x) * 4 + 3]! < 32) continue
      left = Math.min(left, x); right = Math.max(right, x)
      top = Math.min(top, y); bottom = Math.max(bottom, y)
    }
    if (right <= left || bottom <= top) throw new Error('Empty bat image')
    const shape = document.createElement('canvas')
    shape.width = 512
    shape.height = Math.ceil(512 * (bottom - top + 1) / (right - left + 1))
    const shapeContext = shape.getContext('2d')!
    for (let pass = 0; pass < 2; pass++) shapeContext.drawImage(source, left, top, right - left + 1, bottom - top + 1, 0, 0, shape.width, shape.height)
    const atlas = document.createElement('canvas')
    atlas.width = WIDTH * COLUMNS; atlas.height = HEIGHT * ROWS
    const atlasContext = atlas.getContext('2d')!
    for (let index = 0; index < FRAME_COUNT; index++) {
      const frame = document.createElement('canvas')
      frame.width = WIDTH; frame.height = HEIGHT
      const ctx = frame.getContext('2d', { willReadFrequently: true })!
      const phase = index / FRAME_COUNT * Math.PI * 2
      const stretch = .77 + .23 * Math.cos(phase), lift = Math.sin(phase) * .48
      const hingeLeft = Math.floor(shape.width * .46), hingeRight = Math.ceil(shape.width * .54)
      ctx.save(); ctx.translate(WIDTH / 2, HEIGHT / 2)
      ctx.scale(WIDTH / shape.width * .94, WIDTH / shape.width * 1.4)
      ctx.save(); ctx.translate(hingeLeft - shape.width / 2, 0); ctx.transform(stretch, -lift, 0, 1, 0, 0)
      ctx.drawImage(shape, 0, 0, hingeLeft + 2, shape.height, -hingeLeft, -shape.height / 2, hingeLeft + 2, shape.height)
      ctx.restore()
      ctx.save(); ctx.translate(hingeRight - shape.width / 2, 0); ctx.transform(stretch, lift, 0, 1, 0, 0)
      ctx.drawImage(shape, hingeRight - 2, 0, shape.width - hingeRight + 2, shape.height, -2, -shape.height / 2, shape.width - hingeRight + 2, shape.height)
      ctx.restore()
      ctx.drawImage(shape, hingeLeft - 3, 0, hingeRight - hingeLeft + 6, shape.height, hingeLeft - 3 - shape.width / 2, -shape.height / 2, hingeRight - hingeLeft + 6, shape.height)
      ctx.restore()
      ctx.globalCompositeOperation = 'source-in'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, WIDTH, HEIGHT)
      atlasContext.drawImage(frame, index % COLUMNS * WIDTH, Math.floor(index / COLUMNS) * HEIGHT)
      const bitmap = ctx.getImageData(0, 0, WIDTH, HEIGHT)
      const { data } = bitmap
      // Inset the probe silhouette only, so downsampling cannot overlook tiny
      // gaps. The visible sprite atlas keeps its original outline and alpha.
      const stride = WIDTH + 1
      const integral = new Uint32Array(stride * (HEIGHT + 1))
      for (let y = 1; y <= HEIGHT; y++) {
        let row = 0
        for (let x = 1; x <= WIDTH; x++) {
          row += data[((y - 1) * WIDTH + x - 1) * 4 + 3]! >= 250 ? 0 : 1
          integral[y * stride + x] = integral[(y - 1) * stride + x]! + row
        }
      }
      const coverage = ctx.createImageData(WIDTH, HEIGHT)
      coverage.data.fill(255)
      for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
        const left = x - 4, right = x + 5, top = y - 4, bottom = y + 5
        const solid = left >= 0 && top >= 0 && right <= WIDTH && bottom <= HEIGHT
          && integral[bottom * stride + right]! - integral[top * stride + right]! - integral[bottom * stride + left]! + integral[top * stride + left]! === 0
        coverage.data[(y * WIDTH + x) * 4 + 3] = solid ? 255 : 0
      }
      const mask = new Uint8Array(WIDTH * HEIGHT)
      for (let i = 0; i < mask.length; i++) mask[i] = coverage.data[i * 4 + 3]! === 255 ? 1 : 0
      this.masks.push(mask)
      let x0 = WIDTH, y0 = HEIGHT, x1 = 0, y1 = 0
      let anchorDistance = Infinity
      for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
        if (!data[(y * WIDTH + x) * 4 + 3]) continue
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
        const distance = (x - WIDTH / 2) ** 2 + (y - HEIGHT / 2) ** 2
        if (coverage.data[(y * WIDTH + x) * 4 + 3] === 255 && distance < anchorDistance) {
          anchorDistance = distance
          this.anchors.set([(x + .5) / WIDTH - .5, ((y + .5) / HEIGHT - .5) * .75], index * 2)
        }
      }
      this.bounds.set([x0 / WIDTH, y0 / HEIGHT, (x1 - x0 + 1) / WIDTH, (y1 - y0 + 1) / HEIGHT], index * 4)
    }
    return atlas
  }

  createCoverageProbe(width: number, height: number) {
    const scale = Math.min(1, 480 / width, 320 / height)
    const columns = Math.ceil(width * scale), rows = Math.ceil(height * scale)
    const stepX = width / columns, stepY = height / rows
    const covered = new Uint8Array(columns * rows)
    return {
      add: (pose: Pose) => {
        const { x, y, size, angle, frame } = pose
        const mask = this.masks[frame]!
        const bx = this.bounds[frame * 4]! - .5, by = this.bounds[frame * 4 + 1]! - .5
        const bw = this.bounds[frame * 4 + 2]!, bh = this.bounds[frame * 4 + 3]!
        const c = Math.cos(angle), s = Math.sin(angle)
        const centerX = x + (bx + bw / 2) * size * c - (by + bh / 2) * size * .75 * s
        const centerY = y + (bx + bw / 2) * size * s + (by + bh / 2) * size * .75 * c
        const radiusX = (Math.abs(bw * c) + Math.abs(bh * .75 * s)) * size / 2
        const radiusY = (Math.abs(bw * s) + Math.abs(bh * .75 * c)) * size / 2
        const x0 = Math.max(0, Math.floor((centerX - radiusX) / stepX)), x1 = Math.min(columns - 1, Math.ceil((centerX + radiusX) / stepX))
        const y0 = Math.max(0, Math.floor((centerY - radiusY) / stepY)), y1 = Math.min(rows - 1, Math.ceil((centerY + radiusY) / stepY))
        const checkCorners = Math.max(Math.abs(c) * stepX + Math.abs(s) * stepY, Math.abs(s) * stepX + Math.abs(c) * stepY) * WIDTH / (2 * size) > 3
        // A binary silhouette union avoids repeatedly scaling and reading an
        // offscreen canvas. Inset masks leave a margin around sampled cells.
        for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
          const at = py * columns + px
          if (covered[at]) continue
          const dx = (px + .5) * stepX - x, dy = (py + .5) * stepY - y
          const mx = Math.floor(((dx * c + dy * s) / size + .5) * WIDTH)
          const my = Math.floor(((-dx * s + dy * c) / (size * .75) + .5) * HEIGHT)
          if (mx < 0 || mx >= WIDTH || my < 0 || my >= HEIGHT || !mask[my * WIDTH + mx]) continue
          let solid = true
          if (checkCorners) {
            for (let corner = 0; corner < 4; corner++) {
              const cx = dx + (corner & 1 ? .5 : -.5) * stepX, cy = dy + (corner & 2 ? .5 : -.5) * stepY
              const sx = Math.floor(((cx * c + cy * s) / size + .5) * WIDTH)
              const sy = Math.floor(((-cx * s + cy * c) / (size * .75) + .5) * HEIGHT)
              if (sx < 0 || sx >= WIDTH || sy < 0 || sy >= HEIGHT || !mask[sy * WIDTH + sx]) { solid = false; break }
            }
          }
          if (solid) covered[at] = 1
        }
      },
      anchor: (pose: Pose) => {
        const x = this.anchors[pose.frame * 2]! * pose.size, y = this.anchors[pose.frame * 2 + 1]! * pose.size
        return { x: x * Math.cos(pose.angle) - y * Math.sin(pose.angle), y: x * Math.sin(pose.angle) + y * Math.cos(pose.angle) }
      },
      gaps: () => {
        const gaps: { x: number; y: number }[] = []
        for (let by = 0; by < rows; by += 8) for (let bx = 0; bx < columns; bx += 8) {
          let found = false
          for (let y = by; y < Math.min(by + 8, rows) && !found; y++) for (let x = bx; x < Math.min(bx + 8, columns); x++) {
            if (covered[y * columns + x]) continue
            gaps.push({ x: (x + .5) * stepX, y: (y + .5) * stepY })
            found = true
            break
          }
        }
        return gaps
      },
    }
  }

  private prepareGpu() {
    const gl = this.gl!
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source); gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed')
      return shader
    }
    const vertex = compile(gl.VERTEX_SHADER, vertexSource), fragment = compile(gl.FRAGMENT_SHADER, fragmentSource)
    this.program = gl.createProgram()!
    gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment); gl.linkProgram(this.program)
    gl.deleteShader(vertex); gl.deleteShader(fragment)
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error('Shader linking failed')
    gl.useProgram(this.program)
    this.resolution = gl.getUniformLocation(this.program, 'resolution')
    gl.uniform4fv(gl.getUniformLocation(this.program, 'bounds[0]'), this.bounds)
    this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao)
    this.vertices = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.vertices)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
    this.instances = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.instances)
    for (const [location, components, offset] of [[1, 4, 0], [2, 1, 16], [3, 3, 20]] as const) {
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, components, gl.FLOAT, false, BAT_INSTANCE_STRIDE * 4, offset); gl.vertexAttribDivisor(location, 1)
    }
    this.texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlas)
    gl.uniform1i(gl.getUniformLocation(this.program, 'atlas'), 0)
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0, 0, 0, 0)
  }

  draw(data: Float32Array, count: number, width: number, height: number) {
    const gl = this.gl
    if (gl) {
      gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT); gl.useProgram(this.program); gl.bindVertexArray(this.vao)
      gl.uniform2f(this.resolution, width, height)
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instances); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * BAT_INSTANCE_STRIDE), gl.DYNAMIC_DRAW)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
      return
    }
    const ctx = this.context!
    ctx.setTransform(this.canvas.width / width, 0, 0, this.canvas.height / height, 0, 0); ctx.clearRect(0, 0, width, height)
    for (let i = 0; i < count * BAT_INSTANCE_STRIDE; i += BAT_INSTANCE_STRIDE) {
      const frame = data[i + 4]!, size = data[i + 2]!
      const x = this.bounds[frame * 4]!, y = this.bounds[frame * 4 + 1]!, w = this.bounds[frame * 4 + 2]!, h = this.bounds[frame * 4 + 3]!
      const tile = this.coloredFrames[data[i + 5]! < .1 ? 0 : data[i + 5]! < .18 ? 1 : 2]![frame]!
      ctx.save(); ctx.translate(data[i]!, data[i + 1]!); ctx.rotate(data[i + 3]!)
      ctx.drawImage(tile, x * WIDTH, y * HEIGHT, w * WIDTH, h * HEIGHT, (x - .5) * size, (y - .5) * size * .75, w * size, h * size * .75)
      ctx.restore()
    }
  }

  dispose() {
    const gl = this.gl
    if (!gl) return
    gl.deleteTexture(this.texture); gl.deleteBuffer(this.vertices); gl.deleteBuffer(this.instances)
    gl.deleteVertexArray(this.vao); gl.deleteProgram(this.program)
  }
}
