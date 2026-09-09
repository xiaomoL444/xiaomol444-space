import { onBeforeUnmount, onMounted, ref } from 'vue'

type LoadResult = 'ready' | 'unavailable' | 'aborted'

/** Settle each real resource once, including cached, failed, and stalled loads. */
export function waitForResource(
  resource: HTMLImageElement | HTMLMediaElement,
  signal: AbortSignal,
  timeout = 8000,
): Promise<LoadResult> {
  return new Promise((resolve) => {
    const isImage = resource instanceof HTMLImageElement
    const readyEvent = isImage ? 'load' : 'loadeddata'
    let finished = false
    let timer: ReturnType<typeof setTimeout> | undefined

    function finish(result: LoadResult) {
      if (finished) return
      finished = true
      clearTimeout(timer)
      resource.removeEventListener(readyEvent, ready)
      resource.removeEventListener('error', failed)
      signal.removeEventListener('abort', aborted)
      resolve(result)
    }

    function ready() { finish('ready') }
    function failed() { finish('unavailable') }
    function aborted() { finish('aborted') }

    resource.addEventListener(readyEvent, ready)
    resource.addEventListener('error', failed)
    signal.addEventListener('abort', aborted, { once: true })
    timer = setTimeout(failed, timeout)

    if (signal.aborted) aborted()
    else if (isImage && resource.complete) {
      if (resource.naturalWidth > 0) ready()
      else if (resource.src) failed()
    } else if (!isImage) {
      if (resource.error) failed()
      else if (resource.readyState >= 2) ready()
    }
  })
}

export function useEntranceLoading(
  imageUrls: string[],
  getMedia: () => (HTMLMediaElement | null)[],
) {
  const progress = ref(0)
  const ready = ref(false)
  const unavailable = ref(0)
  const controller = new AbortController()
  let disposed = false

  onMounted(() => {
    const images = imageUrls.map((url) => {
      const image = new Image()
      image.src = url
      return image
    })
    const resources = [...images, ...getMedia().filter((item): item is HTMLMediaElement => !!item)]
    let completed = 0

    void Promise.all(resources.map(async (resource) => {
      const result = await waitForResource(resource, controller.signal)
      if (disposed) return
      if (result === 'unavailable') unavailable.value++
      completed++
      progress.value = Math.round(completed / resources.length * 100)
    })).then(() => {
      if (disposed) return
      progress.value = 100
      ready.value = true
    })
  })

  onBeforeUnmount(() => {
    disposed = true
    controller.abort()
  })

  return { progress, ready, unavailable }
}
