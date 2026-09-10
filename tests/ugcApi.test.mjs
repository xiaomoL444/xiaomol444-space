import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchAssets, fetchStages } from '../src/lib/ugcApi.ts'

const envelope = (items) => ({
  ok: true,
  cache: { storedAt: '2026-09-10T20:35:03.867Z' },
  data: { total: items.length, items },
})
const metric = (metric_type, cur, cur_invalid = false) => ({ metric_type, cur, cur_invalid })
const stage = () => ({
  id: '45910676296',
  summary: {
    base_info: { stage_name: '示例奇域', cover_url: 'https://example.com/stage.png', latest_online_time: 1781431741 },
    today_stats: [
      metric('METRIC_STAGE_TYPE_STAGE_HOT_SCORE', '1526'),
      metric('METRIC_STAGE_TYPE_GOOD_RATE', '9852'),
      metric('METRIC_STAGE_TYPE_AVG_TIME', '308'),
    ],
  },
  detail: { resp_map: { level_detail: { retcode: 0, data: { level_detail_response: { level_info: {
    level_intro: '玩法说明', desc: '完整介绍', hot_score: '1459', good_rate: '98.5%',
    play_type: '角色扮演', play_tags: ['休闲', '休闲'], show_limit_play_num_str: '1',
  } } } } } },
})

test('奇域读取真实嵌套字段，以有效摘要统计为准，正确换算好评率', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://ugc-data.xiaomol444.xyz/v1/stages')
    assert.equal(options.credentials, 'omit')
    return Response.json(envelope([stage()]))
  })
  const result = await fetchStages()
  assert.equal(result.total, 1)
  assert.equal(result.updatedAt, '2026-09-10T20:35:03.867Z')
  assert.deepEqual(result.items[0], {
    id: '45910676296', name: '示例奇域', coverUrl: 'https://example.com/stage.png',
    images: [], videoUrl: undefined, videoPosterUrl: undefined,
    description: '玩法说明\n\n完整介绍', tags: ['角色扮演', '休闲'], playerCount: '1',
    hotScore: 1526, goodRate: 98.52, averagePlaySeconds: 308,
    updatedAt: new Date(1781431741 * 1000).toISOString(),
  })
})

test('详情失败保留奇域摘要，无效或缺失指标与真实零值区分', async (t) => {
  const item = stage()
  item.detail.resp_map.level_detail.retcode = -1
  item.summary.today_stats = [
    metric('METRIC_STAGE_TYPE_STAGE_HOT_SCORE', '0'),
    metric('METRIC_STAGE_TYPE_GOOD_RATE', '9852', true),
  ]
  t.mock.method(globalThis, 'fetch', async () => Response.json(envelope([item])))
  const { items: [result] } = await fetchStages()
  assert.equal(result.name, '示例奇域')
  assert.equal(result.description, '')
  assert.equal(result.hotScore, 0)
  assert.equal(result.goodRate, undefined)
  assert.equal(result.averagePlaySeconds, undefined)
})

test('资产保留大整数 ID 精度，映射统计、分类与文件字段，拒绝不安全链接', async (t) => {
  const item = {
    id: '2067169644346630144',
    summary: {
      component_brief: { title: '示例资产', cover_image: 'javascript:alert(1)', description: '资产介绍',
        label_item: [{ label_name: '基础系统' }],
        file_info: { file_ext: 'gia', file_name: '示例资产', file_url: 'https://example.com/asset.gia' } },
      interact_data: { download_cnt: 131, like_cnt: 48, fav_cnt: 75 },
      published_sec: '1781431741', edit_published_sec: '0',
    },
  }
  t.mock.method(globalThis, 'fetch', async () => Response.json(envelope([item])))
  const { items: [result] } = await fetchAssets()
  assert.equal(result.id, item.id)
  assert.equal(result.coverUrl, '')
  assert.equal(result.fileType, 'gia')
  assert.equal(result.fileUrl, 'https://example.com/asset.gia')
  assert.deepEqual([result.downloads, result.likes, result.favorites], [131, 48, 75])
  assert.deepEqual(result.tags, ['基础系统'])
  assert.equal(result.updatedAt, new Date(1781431741 * 1000).toISOString())
})

test('空集合有效，缺失缓存时间不会伪装为当前更新时间', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ ok: true, data: { items: [], total: 0 } }))
  assert.deepEqual(await fetchAssets(), { items: [], total: 0, updatedAt: undefined })
})

test('预览读取奇域和资产各自的图片及视频字段，过滤无效链接并去重', async (t) => {
  const item = stage()
  Object.assign(item.detail.resp_map.level_detail.data.level_detail_response.level_info, {
    images: [{ url: 'https://example.com/scene.png' }, { url: 'https://example.com/scene.png' }, { url: 'javascript:alert(1)' }],
    video_info: { video_url: 'https://example.com/stage.mp4', video_cover: 'https://example.com/poster.jpg' },
  })
  const assetItem = { id: '2067169644346630144', summary: { component_brief: {
    title: '预览资产', cover_image: 'https://example.com/asset.png',
    image_info_list: [{ image_url: 'https://example.com/detail.png' }, { image_url: 'http://example.com/insecure.png' }],
    video_info: { resolutions: [{ video_url: '' }, { video_url: 'https://example.com/asset-hd.mp4' }, { video_url: 'https://example.com/asset-sd.mp4' }] },
  } } }
  t.mock.method(globalThis, 'fetch', async url => Response.json(envelope([url.endsWith('/stages') ? item : assetItem])))
  const { items: [world] } = await fetchStages()
  assert.deepEqual(world.images, ['https://example.com/scene.png'])
  assert.equal(world.videoUrl, 'https://example.com/stage.mp4')
  assert.equal(world.videoPosterUrl, 'https://example.com/poster.jpg')
  const { items: [asset] } = await fetchAssets()
  assert.deepEqual(asset.images, ['https://example.com/detail.png'])
  assert.equal(asset.videoUrl, 'https://example.com/asset-hd.mp4')
  assert.equal(asset.videoPosterUrl, 'https://example.com/asset.png')
})

test('HTTP、业务、格式和连接错误均提供可读的重试信息', async (t) => {
  const cases = [
    [() => new Response('', { status: 503 }), /503/],
    [() => new Response('', { status: 429 }), /频繁/],
    [() => Response.json({ ok: false }), /暂时不可用/],
    [() => Response.json({ ok: true, data: { total: 1, items: null } }), /格式异常/],
    [() => new Response('<html>error</html>'), /格式异常/],
    [() => { throw new TypeError('Failed to fetch') }, /检查网络/],
  ]
  for (const [response, expected] of cases) {
    const mock = t.mock.method(globalThis, 'fetch', async () => response())
    await assert.rejects(fetchStages(), expected)
    mock.mock.restore()
  }
})

test('支持已取消和进行中的请求取消，15 秒超时可重试', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
  }))
  const cancelled = new AbortController()
  cancelled.abort()
  await assert.rejects(fetchStages(cancelled.signal), { name: 'AbortError' })
  const pending = new AbortController()
  const request = fetchAssets(pending.signal)
  pending.abort()
  await assert.rejects(request, { name: 'AbortError' })
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const timedRequest = fetchStages()
  t.mock.timers.tick(15_000)
  await assert.rejects(timedRequest, /读取超时/)
})
