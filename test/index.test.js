import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 用临时目录当 DSH_HOME，隔离本机真实配置与便签
const HOME = await mkdtemp(join(tmpdir(), 'sn-test-'))
process.env.DSH_HOME = HOME

const { handler } = await import('../lib/index.js')

const ROOT = join(HOME, 'notes')

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
})
