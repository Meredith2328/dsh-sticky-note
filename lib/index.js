import { readFile, writeFile, readdir, stat, rename, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

export const name = 'dsh-sticky-note'

const CHANNEL = '/dsh-sticky-note'
const TYPES = ['点子', '感想', 'TODO']
const SUBDIRS = ['点子', '感想', 'TODO', '归档']
const DSH_HOME = process.env.DSH_HOME || 'C:\\Users\\10pi\\.dsh'
const CONFIG_PATH = join(DSH_HOME, 'sticky-note-config.json')
// 默认存储路径：DSH 目录下插件专属文件夹（用户可在设置中修改）
const DEFAULT_ROOT = join(DSH_HOME, 'sticky-notes')
// 默认查看模式：inline = 便签内显示完整内容；file = 用系统默认程序打开文件
const DEFAULT_VIEW_MODE = 'inline'

function defaultConfig() {
  return {
    root: DEFAULT_ROOT,
    viewMode: DEFAULT_VIEW_MODE,
  }
}

async function readConfig() {
  try {
    let raw = await readFile(CONFIG_PATH, 'utf8')
    // 兼容带 BOM 的 UTF-8 文件（某些编辑器/Out-File 会写入 BOM）
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
    const j = JSON.parse(raw)
    const cfg = defaultConfig()
    if (j && typeof j.root === 'string' && j.root) cfg.root = j.root
    if (j && j.viewMode === 'file') cfg.viewMode = 'file'
    return cfg
  } catch (e) { /* fall through to default */ }
  return defaultConfig()
}

async function writeConfig(cfg) {
  const dir = CONFIG_PATH.slice(0, Math.max(CONFIG_PATH.lastIndexOf('\\'), CONFIG_PATH.lastIndexOf('/')))
  await mkdir(dir, { recursive: true })
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
}

async function rootOf() {
  const c = await readConfig()
  return c.root
}

// 用系统默认程序打开文件（跨平台：Windows / macOS / Linux）
function openFileWithSystem(absPath) {
  const platform = process.platform
  let cmd
  let args
  if (platform === 'win32') {
    cmd = 'cmd'
    args = ['/c', 'start', '', absPath]
  } else if (platform === 'darwin') {
    cmd = 'open'
    args = [absPath]
  } else {
    // linux / 其他 unix
    cmd = 'xdg-open'
    args = [absPath]
  }
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, { detached: true, stdio: 'ignore' })
      child.on('error', () => resolve({ ok: false }))
      child.on('spawn', () => resolve({ ok: true }))
    } catch (e) {
      resolve({ ok: false })
    }
  })
}

async function ensureSubdirs(root) {
  for (const sub of SUBDIRS) {
    await mkdir(join(root, sub), { recursive: true })
  }
}

async function listNotes() {
  const root = await rootOf()
  await ensureSubdirs(root)
  const result = { root, categories: {} }
  for (const sub of SUBDIRS) {
    const notes = []
    let entries = []
    try {
      entries = await readdir(join(root, sub), { withFileTypes: true })
    } catch (e) {
      entries = []
    }
    for (const ent of entries) {
      if (!ent.isFile()) continue
      if (ent.name.endsWith('.keep')) continue
      let preview = ''
      try {
        const content = await readFile(join(root, sub, ent.name), 'utf8')
        preview = content.replace(/\s+/g, ' ').trim().slice(0, 60)
      } catch (e) {
        preview = '(不可读)'
      }
      notes.push({
        name: ent.name,
        preview,
        timeText: timeTextOf(ent.name),
      })
    }
    notes.sort((a, b) => (a.name < b.name ? 1 : -1))
    result.categories[sub] = notes
  }
  return result
}

function safeName(kind) {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const ts = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
  return ts + (kind === 'TODO' ? '-todo' : '') + '.md'
}

// 从文件名时间戳（YYYYMMDD-HHMMSS.md）生成紧凑显示文本：
// 今天 → "14:03"；昨天 → "昨天"；今年 → "8/12"；更早 → "24/5/1"
function timeTextOf(name) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/.exec(name)
  if (!m) return ''
  const [, y, mo, d, h, mi] = m.map(Number)
  const now = new Date()
  const date = new Date(y, mo - 1, d)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((today - date) / 86400000)
  if (diffDays === 0) return String(h).padStart(2, '0') + ':' + String(mi).padStart(2, '0')
  if (diffDays === 1) return '昨天'
  if (y === now.getFullYear()) return mo + '/' + d
  return String(y % 100) + '/' + mo + '/' + d
}

async function saveNote(args) {
  const kind = args && args.kind
  if (!TYPES.includes(kind)) return { ok: false, error: 'invalid kind' }
  const content = args && typeof args.content === 'string' ? args.content : ''
  if (!content.trim()) return { ok: false, error: 'empty' }
  const root = await rootOf()
  await ensureSubdirs(root)
  // 每次保存都新建一个带时间戳的文件
  const name = safeName(kind)
  await writeFile(join(root, kind, name), content.trim() + '\n', 'utf8')
  return { ok: true, name, kind }
}

// 读取某条历史便签的完整内容
async function readNote(args) {
  const kind = args && args.kind
  const name = args && args.name
  if (!TYPES.includes(kind) || !name) return { ok: false, error: 'invalid args' }
  if (/[\\/]|\.\./.test(name)) return { ok: false, error: 'bad name' }
  const root = await rootOf()
  try {
    const content = await readFile(join(root, kind, name), 'utf8')
    return { ok: true, content, name, kind }
  } catch (e) {
    return { ok: false, error: 'read failed: ' + (e && e.message) }
  }
}

async function archiveNote(args) {
  const kind = args && args.kind
  const name = args && args.name
  if (!TYPES.includes(kind) || !name) return { ok: false, error: 'invalid args' }
  if (/[\\/]|\.\./.test(name)) return { ok: false, error: 'bad name' }
  const root = await rootOf()
  await ensureSubdirs(root)
  const src = join(root, kind, name)
  const dst = join(root, '归档', kind + '-' + name)
  try {
    await rename(src, dst)
  } catch (e) {
    return { ok: false, error: 'move failed: ' + (e && e.message) }
  }
  return { ok: true, name, kind }
}

async function handler(endpoint, payload) {
  try {
    switch (endpoint) {
      case 'list': {
        const data = await listNotes()
        return { ok: true, value: data }
      }
      case 'save': {
        const r = await saveNote(payload)
        return r.ok ? { ok: true, value: { name: r.name, kind: r.kind } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'read': {
        const r = await readNote(payload)
        return r.ok ? { ok: true, value: { content: r.content, name: r.name, kind: r.kind } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'archive': {
        const r = await archiveNote(payload)
        return r.ok ? { ok: true, value: { name: r.name, kind: r.kind } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'config': {
        const current = await readConfig()
        const next = { ...current }
        if (payload && typeof payload.root === 'string' && payload.root.trim()) next.root = payload.root.trim()
        if (payload && payload.viewMode === 'file') next.viewMode = 'file'
        if (payload && payload.viewMode === 'inline') next.viewMode = 'inline'
        if (payload && (payload.root !== undefined || payload.viewMode !== undefined)) {
          await writeConfig(next)
        }
        return { ok: true, value: { ...next } }
      }
      case 'open': {
        // 用系统默认程序打开便签文件（跨平台）
        const kind = payload && payload.kind
        const name = payload && payload.name
        if (!TYPES.includes(kind) || !name) return { ok: false, error: { code: 'bad', details: 'invalid args' } }
        if (/[\\/]|\.\./.test(name)) return { ok: false, error: { code: 'bad', details: 'bad name' } }
        const root = await rootOf()
        const absPath = join(root, kind, name)
        const r = await openFileWithSystem(absPath)
        return r.ok ? { ok: true, value: {} } : { ok: false, error: { code: 'open-failed', details: '无法打开文件（系统命令不可用）' } }
      }
      case 'openRoot': {
        // 用系统默认程序打开存储根目录（Windows 资源管理器 / macOS Finder / Linux 文件管理器）
        const root = await rootOf()
        await ensureSubdirs(root)
        const r = await openFileWithSystem(root)
        return r.ok ? { ok: true, value: { root } } : { ok: false, error: { code: 'open-failed', details: '无法打开目录（系统命令不可用）' } }
      }
      default:
        return { ok: false, error: { code: 'unknown', details: endpoint } }
    }
  } catch (e) {
    return { ok: false, error: { code: 'error', details: String(e && e.message || e) } }
  }
}

export function apply(ctx) {
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      return connectionCtx.connection.rpc.handle(CHANNEL, handler, { authority: 'loopback' })
    }, 'dsh-sticky-note: rpc')
  })
}
