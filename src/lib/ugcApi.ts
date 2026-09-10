const API_BASE = 'https://ugc-data.xiaomol444.xyz/v1'
const REQUEST_TIMEOUT_MS = 15_000

type JsonObject = Record<string, unknown>

export interface UgcCollection<T> {
  items: T[]
  total: number
  /** The time the API cached this collection, when supplied. */
  updatedAt?: string
}

export interface UgcMedia {
  images: string[]
  videoUrl?: string
  videoPosterUrl?: string
}

export interface Stage extends UgcMedia {
  id: string
  name: string
  coverUrl: string
  description: string
  tags: string[]
  playerCount?: string
  hotScore?: number
  /** Percentage points: 98.52 means 98.52%. */
  goodRate?: number
  averagePlaySeconds?: number
  updatedAt?: string
}

export interface Asset extends UgcMedia {
  id: string
  name: string
  coverUrl: string
  description: string
  tags: string[]
  fileType?: string
  fileName?: string
  fileUrl?: string
  downloads?: number
  likes?: number
  favorites?: number
  updatedAt?: string
}

function object(value: unknown): JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function requiredText(value: unknown): string {
  const result = text(value)
  if (!result) throw new Error('数据格式异常，请稍后重试。')
  return result
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function nonNegativeNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined
  if (typeof value === 'string' && !/^\d+(?:\.\d+)?$/.test(value.trim())) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function timestamp(value: unknown): string | undefined {
  const seconds = nonNegativeNumber(value)
  if (!seconds) return undefined
  const date = new Date(seconds * 1000)
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}

function isoDate(value: unknown): string | undefined {
  const source = text(value)
  const date = source ? new Date(source) : undefined
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}

/** Only allow fully qualified HTTPS URLs from remote JSON into links and media. */
function httpsUrl(value: unknown): string {
  const source = text(value)
  if (!source) return ''
  try {
    const url = new URL(source)
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''
  } catch {
    return ''
  }
}

function uniqueText(values: unknown[]): string[] {
  return [...new Set(values.map(text).filter(Boolean))]
}

function imageUrls(values: unknown[]): string[] {
  return [...new Set(values.map(httpsUrl).filter(Boolean))]
}

function stageMetric(summary: JsonObject, metricType: string): number | undefined {
  const metric = list(summary.today_stats).map(object).find(item => item.metric_type === metricType)
  // Missing/invalid measurements stay absent, rather than being represented as zero.
  return metric?.cur_invalid === false ? nonNegativeNumber(metric.cur) : undefined
}

function parseStage(value: unknown): Stage {
  const item = object(value)
  const summary = object(item.summary)
  const base = object(summary.base_info)
  const responses = object(object(item.detail).resp_map)
  const levelResponse = object(responses.level_detail)
  // A failed optional detail request must not discard a valid summary card.
  const detail = levelResponse.retcode === 0
    ? object(object(object(levelResponse.data).level_detail_response).level_info)
    : {}
  const goodRate = stageMetric(summary, 'METRIC_STAGE_TYPE_GOOD_RATE')

  return {
    id: requiredText(item.id),
    name: requiredText(base.stage_name),
    coverUrl: httpsUrl(base.cover_url) || httpsUrl(object(detail.cover_img).url),
    images: imageUrls(list(detail.images).map(image => object(image).url)),
    videoUrl: httpsUrl(object(detail.video_info).video_url) || undefined,
    videoPosterUrl: httpsUrl(object(detail.video_info).video_cover) || undefined,
    description: uniqueText([detail.level_intro, detail.desc]).join('\n\n'),
    tags: uniqueText([detail.play_type, ...list(detail.play_tags)]),
    playerCount: text(detail.show_limit_play_num_str) || undefined,
    hotScore: stageMetric(summary, 'METRIC_STAGE_TYPE_STAGE_HOT_SCORE'),
    goodRate: goodRate !== undefined && goodRate <= 10_000 ? goodRate / 100 : undefined,
    averagePlaySeconds: stageMetric(summary, 'METRIC_STAGE_TYPE_AVG_TIME'),
    updatedAt: timestamp(base.latest_online_time),
  }
}

function parseAsset(value: unknown): Asset {
  const item = object(value)
  const summary = object(item.summary)
  const brief = object(summary.component_brief)
  const file = object(brief.file_info)
  const stats = object(summary.interact_data)
  return {
    id: requiredText(item.id),
    name: requiredText(brief.title),
    coverUrl: httpsUrl(brief.cover_image),
    images: imageUrls(list(brief.image_info_list).map(image => object(image).image_url)),
    videoUrl: list(object(brief.video_info).resolutions).map(resolution => httpsUrl(object(resolution).video_url)).find(Boolean),
    videoPosterUrl: httpsUrl(brief.cover_image) || undefined,
    description: text(brief.description),
    tags: uniqueText(list(brief.label_item).map(item => object(item).label_name)),
    fileType: text(file.file_ext) || undefined,
    fileName: text(file.file_name) || undefined,
    fileUrl: httpsUrl(file.file_url) || undefined,
    downloads: nonNegativeNumber(stats.download_cnt),
    likes: nonNegativeNumber(stats.like_cnt),
    favorites: nonNegativeNumber(stats.fav_cnt),
    updatedAt: timestamp(summary.edit_published_sec) || timestamp(summary.published_sec),
  }
}

async function fetchCollection<T>(
  endpoint: 'stages' | 'assets',
  parseItem: (item: unknown) => T,
  signal?: AbortSignal,
): Promise<UgcCollection<T>> {
  if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError')
  const controller = new AbortController()
  let timedOut = false
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      credentials: 'omit',
    })
    if (!response.ok) {
      throw new Error(response.status === 429
        ? '请求较频繁，请稍后再试。'
        : `数据读取失败（HTTP ${response.status}），请稍后重试。`)
    }
    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      if (controller.signal.aborted) throw error
      throw new Error('数据格式异常，请稍后重试。')
    }
    const envelope = object(body)
    if (envelope.ok === false) throw new Error('数据服务暂时不可用，请稍后重试。')
    const data = object(envelope.data)
    const total = nonNegativeNumber(data.total)
    if (envelope.ok !== true || !Array.isArray(data.items) || total === undefined || !Number.isInteger(total)) {
      throw new Error('数据格式异常，请稍后重试。')
    }
    // These endpoints return complete collections; their responses have no cursor/page fields.
    return {
      items: data.items.map(parseItem),
      total,
      updatedAt: isoDate(object(envelope.cache).storedAt),
    }
  } catch (error) {
    if (signal?.aborted) throw new DOMException('请求已取消', 'AbortError')
    if (timedOut) throw new Error('读取超时，请稍后重试。')
    if (error instanceof TypeError) throw new Error('暂时无法连接数据服务，请检查网络后重试。')
    throw error
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

export function fetchStages(signal?: AbortSignal): Promise<UgcCollection<Stage>> {
  return fetchCollection('stages', parseStage, signal)
}

export function fetchAssets(signal?: AbortSignal): Promise<UgcCollection<Asset>> {
  return fetchCollection('assets', parseAsset, signal)
}
