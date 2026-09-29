import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 用临时目录当 DSH_HOME，隔离本机真实配置与便签
const HOME = await mkdtemp(join(tmpdir(), 'sn-test-'))
process.env.DSH_HOME = HOME

const { handler, inject, Config, apply } = await import('../lib/index.js')

const ROOT = join(HOME, 'notes')

describe('DSH 0.2.0 插件声明', () => {
  it('顶层只硬依赖 connection，settings 在 apply 里可选接入', () => {
    expect(inject).toEqual(['connection'])
  })
  it('导出 0.2.0 表单识别的 Config：全部用户字段都是 volatile', () => {
    expect(Object.keys(Config.dict)).toEqual([
      'root', 'viewMode', 'saveInterval', 'clearAfter', 'defaultKind', 'sendMode', 'resumeDraft',
    ])
    for (const field of Object.values(Config.dict)) expect(field.meta.volatile).toBe(true)
    // Loader 解析后的字段是带 .get() 的引用，缺省时给出插件默认值
    const resolved = Config({})
    expect(resolved.root.get()).toBe(join(HOME, 'sticky-notes'))
    expect(resolved.viewMode.get()).toBe('inline')
    expect(resolved.resumeDraft.get()).toBe(false)
  })
  it('在浏览器包声明可见服务并使用新版目录选择服务', async () => {
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).toContain("exports.inject = ['connection', 'slots', 'uiWorkspace']")
    expect(source).toContain("ctx.get('uiWorkspace')")
    expect(source).toContain("slots.inject('plugins.bundle.config'")
    expect(source).toContain("key: 'dsh-sticky-note'")
    // 0.2.0 没有声明 settings.plugin.item，旧兜底注册不应再出现
    expect(source).not.toContain('settings.plugin.item')
    expect(source).not.toContain("ctx.get('workspaces')")
  })
})

// apply 需要一个最小的 Cordis 上下文：记录它注册的 RPC 接缝、设置的写入与页面策略
function fakeContext({ updates, policies }) {
  const fiber = { entry: { options: { id: 'dsh-sticky-note' } } }
  const disposers = []
  const routes = []
  const handles = []
  const settings = {
    async update(ns, patch) { updates.push([ns, patch]) },
    configure(policy, owner) { policies.push([policy, owner]); return () => {} },
  }
  const effect = (fn, label) => {
    // 定时清理是 Host 的整点任务，单测只关心它跟随 fiber 卸载，不在这里真的起线程
    if (label === 'dsh-sticky-note: cleanup timer') {
      disposers.push(() => {})
      return () => {}
    }
    const dispose = fn()
    disposers.push(dispose)
    return () => { if (typeof dispose === 'function') dispose() }
  }
  const ctx = {
    fiber,
    connection: {
      fetch: { register(route) { routes.push(route); return () => {} } },
      rpc: { handle(...args) { handles.push(args); return () => {} } },
    },
    inject(deps, callback) { callback({ settings, effect }); return () => {} },
    get() { return undefined },
    effect,
  }
  return { ctx, disposers, routes, handles }
}

function configRefs(overrides = {}) {
  const values = {
    root: ROOT, viewMode: 'inline', saveInterval: 10, clearAfter: 0,
    defaultKind: '点子', sendMode: 'send', resumeDraft: false,
    ...overrides,
  }
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, { get: () => value }]))
}

function disposeAll(disposers) {
  for (const dispose of disposers) if (typeof dispose === 'function') dispose()
}

describe('settings 接缝', () => {
  it('读配置看 Config 引用，写配置走 settings.update(条目 id, patch)', async () => {
    const updates = []
    const policies = []
    const { ctx, disposers, routes } = fakeContext({ updates, policies })
    try {
      apply(ctx, configRefs({ viewMode: 'file' }))
      // 精确 Fetch route 是 0.2.0 的 /api 分流入口
      expect(routes).toHaveLength(1)
      expect(routes[0]).toMatchObject({ path: '/api/dsh-sticky-note/call', methods: ['POST'], requestBody: 'buffered' })
      // 设置页由插件自己的卡片渲染，不让 DSH 自动生成表单
      expect(policies).toEqual([[{ auto: false }, ctx.fiber]])
      // 读：直接投影 Config 引用
      expect((await handler('config', {})).value.viewMode).toBe('file')
      // 写：整份配置交给 settings.update
      const written = await handler('config', { saveInterval: 60 })
      expect(written.value.saveInterval).toBe(60)
      expect(updates).toEqual([['dsh-sticky-note', {
        root: ROOT, viewMode: 'file', saveInterval: 60, clearAfter: 0,
        defaultKind: '点子', sendMode: 'send', resumeDraft: false,
      }]])
    } finally {
      disposeAll(disposers)
    }
    // 卸载后回到 JSON 回退路径
    expect((await handler('config', {})).value.viewMode).toBe('inline')
  })

  it('没有 /api 分流接缝时回退到 (channel, handler) 两参数的 RPC channel', () => {
    const updates = []
    const policies = []
    const { ctx, disposers, handles } = fakeContext({ updates, policies })
    delete ctx.connection.fetch
    try {
      apply(ctx, configRefs())
      expect(handles).toEqual([['/dsh-sticky-note', handler]])
    } finally {
      disposeAll(disposers)
    }
  })

  it('精确 Fetch route 的返回信封满足 0.2.0 客户端的强校验', async () => {
    const updates = []
    const policies = []
    const { ctx, disposers, routes } = fakeContext({ updates, policies })
    const call = (payload) => routes[0].fetch(new Request('http://127.0.0.1/api/dsh-sticky-note/call', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId: 'r1', method: 'dsh-sticky-note/call', payload }),
    })).then((response) => response.json())
    try {
      apply(ctx, configRefs())
      const ok = await call({ endpoint: 'config', payload: {} })
      expect(ok).toMatchObject({ type: 'server-response', rpcId: 'r1', result: { ok: true } })
      // 失败信封必须有字符串 message 与对象 details，否则客户端只会拿到一个 TypeError
      const bad = await call({ endpoint: '不存在', payload: {} })
      expect(bad.type).toBe('server-response')
      expect(typeof bad.result.error.code).toBe('string')
      expect(typeof bad.result.error.message).toBe('string')
      expect(bad.result.error.details).toBeTypeOf('object')
    } finally {
      disposeAll(disposers)
    }
  })
})

async function writeNote(kind, name, content, mtimeDaysAgo = 0) {
  await mkdir(join(ROOT, kind), { recursive: true })
  const p = join(ROOT, kind, name)
  await writeFile(p, content)
  if (mtimeDaysAgo > 0) {
    const old = new Date(Date.now() - mtimeDaysAgo * 86400000)
    const { utimes } = await import('node:fs/promises')
    await utimes(p, old, old)
  }
}

beforeEach(async () => {
  await rm(ROOT, { recursive: true, force: true })
  await handler('config', { root: ROOT, clearAfter: 0 }) // 默认永久保留，单测里显式改
})

afterEach(async () => {
  await rm(ROOT, { recursive: true, force: true })
})

describe('config', () => {
  it('返回默认配置并接受合法修改', async () => {
    const r = await handler('config', { saveInterval: 60, defaultKind: 'TODO' })
    expect(r.ok).toBe(true)
    expect(r.value.saveInterval).toBe(60)
    expect(r.value.defaultKind).toBe('TODO')
    expect(r.value.resumeDraft).toBe(false)
  })
  it('拒绝非法值并保留原值', async () => {
    await handler('config', { saveInterval: 60 })
    const r = await handler('config', { saveInterval: 999 })
    expect(r.value.saveInterval).toBe(60)
  })
})

describe('save / new / clear / read', () => {
  it('保存后可读取，同类别覆盖同一文件', async () => {
    const s = await handler('save', { kind: '点子', content: '第一条' })
    expect(s.ok).toBe(true)
    const s2 = await handler('save', { kind: '点子', content: '第二条' })
    expect(s2.value.name).toBe(s.value.name)
    const r = await handler('read', { kind: '点子', name: s.value.name })
    expect(r.value.content.trim()).toBe('第二条')
  })
  it('new 之后保存落到新文件', async () => {
    const s1 = await handler('save', { kind: '感想', content: 'a' })
    await new Promise((r) => setTimeout(r, 1100)) // 文件名精确到秒，跨秒才有不同名字
    await handler('new', {})
    const s2 = await handler('save', { kind: '感想', content: 'b' })
    expect(s2.value.name).not.toBe(s1.value.name)
  })
  it('clear 删除当前草稿文件', async () => {
    const s = await handler('save', { kind: 'TODO', content: '待办' })
    await handler('clear', {})
    const r = await handler('read', { kind: 'TODO', name: s.value.name })
    expect(r.ok).toBe(false)
  })
  it('拒绝非法类别与路径穿越', async () => {
    expect((await handler('save', { kind: '其他', content: 'x' })).ok).toBe(false)
    expect((await handler('read', { kind: '点子', name: '../config.json' })).ok).toBe(false)
    expect((await handler('read', { kind: '点子', name: 'a/b.md' })).ok).toBe(false)
  })
  it('保存时逐字节保留首尾空行', async () => {
    await handler('new', {})
    const content = '\n正文\n\n'
    const s = await handler('save', { kind: '点子', content })
    const r = await handler('read', { kind: '点子', name: s.value.name })
    expect(r.value.content).toBe(content)
  })
  it('内容未变化时不重复写盘', async () => {
    await handler('new', {})
    const first = await handler('save', { kind: '点子', content: '不变' })
    const second = await handler('save', { kind: '点子', content: '不变' })
    expect(first.value.changed).toBe(true)
    expect(second.value.changed).toBe(false)
  })
  it('只恢复当前草稿，显式新建后不再返回旧内容', async () => {
    await handler('new', {})
    const saved = await handler('save', { kind: '感想', content: '下次继续写这一条' })
    expect(saved.ok).toBe(true)
    expect(JSON.parse(await readFile(join(HOME, 'sticky-note-draft.json'), 'utf8'))).toEqual({ kind: '感想', name: saved.value.name })
    const draft = await handler('draft', {})
    expect(draft.value).toMatchObject({ kind: '感想', name: saved.value.name, content: '下次继续写这一条' })
    await handler('new', {})
    expect((await handler('draft', {})).value).toBeNull()
  })
  it('当前草稿文件不存在时安全回到空白并清理失效指针', async () => {
    await handler('new', {})
    const saved = await handler('save', { kind: '点子', content: '稍后会移动' })
    await rm(join(ROOT, '点子', saved.value.name), { force: true })
    expect((await handler('draft', {})).value).toBeNull()
    await expect(readFile(join(HOME, 'sticky-note-draft.json'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })
  it('并发保存后清空不会让旧草稿复活', async () => {
    await handler('new', {})
    const first = await handler('save', { kind: '点子', content: '旧内容' })
    await Promise.all([
      handler('save', { kind: '点子', content: '排队中的新内容' }),
      handler('clear', {}),
    ])
    const read = await handler('read', { kind: '点子', name: first.value.name })
    expect(read.ok).toBe(false)
  })
})

describe('archive / restore', () => {
  it('归档后移入归档目录，restore 恢复原位', async () => {
    const s = await handler('save', { kind: '点子', content: '要归档的' })
    const a = await handler('archive', { kind: '点子', name: s.value.name })
    expect(a.ok).toBe(true)
    const archived = await handler('read', { kind: '归档', name: '点子-' + s.value.name })
    expect(archived.ok).toBe(true)
    const r = await handler('restore', { name: '点子-' + s.value.name })
    expect(r.ok).toBe(true)
    expect(r.value.kind).toBe('点子')
    expect(r.value.name).toBe(s.value.name)
    const back = await handler('read', { kind: '点子', name: s.value.name })
    expect(back.ok).toBe(true)
  })
  it('restore 拒绝非法文件名', async () => {
    expect((await handler('restore', { name: '../x' })).ok).toBe(false)
    expect((await handler('restore', { name: '点子-' })).ok).toBe(false)
  })
})

describe('list 与自动清除', () => {
  it('list 返回四类分组（含归档）', async () => {
    const s = await handler('save', { kind: '点子', content: '预览内容' })
    await handler('archive', { kind: '点子', name: s.value.name })
    const r = await handler('list', {})
    expect(r.ok).toBe(true)
    // sort() 按码元排序的中文顺序不直观，两边同样排序后比较即可
    expect(Object.keys(r.value.categories).sort().join(',')).toBe(['TODO', '归档', '点子', '感想'].sort().join(','))
    expect(r.value.categories['归档'][0].preview).toContain('预览内容')
  })
  it('超期未保留的便签移入回收站而非直接删除；保留的豁免', async () => {
    await handler('config', { clearAfter: 7 })
    await writeNote('点子', '20260801-100000.md', '旧的', 10)
    await writeNote('点子', '20260810-100000.md', '新的', 1)
    await writeNote('感想', '20260801-100000.md', '保留的', 10)
    await handler('retain', { kind: '感想', name: '20260801-100000.md', retain: true })
    const r = await handler('list', {})
    const names = r.value.categories['点子'].map((x) => x.name)
    expect(names).toContain('20260810-100000.md')
    expect(names).not.toContain('20260801-100000.md')
    // 回收站里能找回
    const trash = await readdir(join(ROOT, '已清除'))
    expect(trash).toContain('20260801-100000.md')
    // 保留的未被清除
    expect(r.value.categories['感想'].map((x) => x.name)).toContain('20260801-100000.md')
  })
  it('retained 脏键被清理', async () => {
    await handler('retain', { kind: '点子', name: '不存在的.md', retain: true })
    await writeNote('点子', '20260810-100000.md', 'x', 0)
    await handler('list', {})
    const raw = JSON.parse(await readFile(join(HOME, 'sticky-note-retained.json'), 'utf8'))
    expect(raw).toEqual([])
  })
  it('保留标记在 归档→清理→恢复 往返后依然豁免（回归）', async () => {
    await handler('config', { clearAfter: 7 })
    await writeNote('点子', '20260801-100000.md', '重要内容', 10)
    await handler('retain', { kind: '点子', name: '20260801-100000.md', retain: true })
    await handler('archive', { kind: '点子', name: '20260801-100000.md' })
    // 归档期间清理跑了（list 触发 prune）：标记不能被当脏键删掉
    await handler('list', {})
    const raw = JSON.parse(await readFile(join(HOME, 'sticky-note-retained.json'), 'utf8'))
    expect(raw).toContain('点子/20260801-100000.md')
    // 恢复后 mtime 仍是 10 天前，但保留豁免 → 不进回收站，标记仍在
    await handler('restore', { name: '点子-20260801-100000.md' })
    const r = await handler('list', {})
    const back = r.value.categories['点子'].find((x) => x.name === '20260801-100000.md')
    expect(back).toBeTruthy()
    expect(back.retained).toBe(true)
    const trash = await readdir(join(ROOT, '已清除'))
    expect(trash).not.toContain('20260801-100000.md')
  })
})

describe('update', () => {
  it('更新历史便签内容', async () => {
    const s = await handler('save', { kind: 'TODO', content: '旧' })
    await handler('new', {})
    const u = await handler('update', { kind: 'TODO', name: s.value.name, content: '新' })
    expect(u.ok).toBe(true)
    const r = await handler('read', { kind: 'TODO', name: s.value.name })
    expect(r.value.content.trim()).toBe('新')
  })
  it('更新时逐字节保留首尾空行', async () => {
    await handler('new', {})
    const s = await handler('save', { kind: 'TODO', content: '旧' })
    const content = '\n新内容\n\n'
    await handler('update', { kind: 'TODO', name: s.value.name, content })
    const r = await handler('read', { kind: 'TODO', name: s.value.name })
    expect(r.value.content).toBe(content)
  })
})
