import { readFile, writeFile, readdir, stat, rename, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { spawn } from 'node:child_process'

export const name = 'dsh-sticky-note'

const CHANNEL = '/dsh-sticky-note'
const TYPES = ['点子', '感想', 'TODO']
const SUBDIRS = ['点子', '感想', 'TODO', '归档']
// 回收站：自动清除的便签先移入这里，超过 TRASH_KEEP_DAYS 天才真正删除
const TRASH_DIR = '已清除'
const TRASH_KEEP_DAYS = 30
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const CONFIG_PATH = join(DSH_HOME, 'sticky-note-config.json')
const RETAINED_PATH = join(DSH_HOME, 'sticky-note-retained.json')
// 默认存储路径：DSH 目录下插件专属文件夹（用户已配置的路径保留在配置文件中，优先于默认值）
const DEFAULT_ROOT = join(DSH_HOME, 'sticky-notes')
// 默认查看模式：inline = 便签内显示完整内容；file = 用系统默认程序打开文件
const DEFAULT_VIEW_MODE = 'inline'
// 自动保存间隔（秒）：10 秒 / 1 分钟 / 5 分钟 / 0 = 不自动保存
const DEFAULT_SAVE_INTERVAL = 10
// 自动清除（天）：1 / 3 / 7 / 0 = 永久不清除
const DEFAULT_CLEAR_AFTER = 7
// 默认类别
const DEFAULT_KIND = '点子'
// 发送模式：send = 直接发出；append = 添加到输入框末尾
const DEFAULT_SEND_MODE = 'send'

function defaultConfig() {
  return {
    root: DEFAULT_ROOT,
    viewMode: DEFAULT_VIEW_MODE,
    saveInterval: DEFAULT_SAVE_INTERVAL,
    clearAfter: DEFAULT_CLEAR_AFTER,
    defaultKind: DEFAULT_KIND,
    sendMode: DEFAULT_SEND_MODE,
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
    if (j && [0, 10, 60, 300].includes(j.saveInterval)) cfg.saveInterval = j.saveInterval
    if (j && [0, 1, 3, 7].includes(j.clearAfter)) cfg.clearAfter = j.clearAfter
    if (j && TYPES.includes(j.defaultKind)) cfg.defaultKind = j.defaultKind
    if (j && (j.sendMode === 'send' || j.sendMode === 'append')) cfg.sendMode = j.sendMode
    return cfg
  } catch (e) { /* fall through to default */ }
  return defaultConfig()
}

async function writeConfig(cfg) {
  const dir = CONFIG_PATH.slice(0, Math.max(CONFIG_PATH.lastIndexOf('\\'), CONFIG_PATH.lastIndexOf('/')))
  await mkdir(dir, { recursive: true })
  await writeFile(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
}

// ===== 保留标记（自动清除时豁免）=====
async function readRetained() {
  try {
    let raw = await readFile(RETAINED_PATH, 'utf8')
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
    const j = JSON.parse(raw)
    if (Array.isArray(j)) return j.filter((x) => typeof x === 'string')
  } catch (e) { /* fall through */ }
  return []
}
async function writeRetained(list) {
  const dir = RETAINED_PATH.slice(0, Math.max(RETAINED_PATH.lastIndexOf('\\'), RETAINED_PATH.lastIndexOf('/')))
  await mkdir(dir, { recursive: true })
  await writeFile(RETAINED_PATH, JSON.stringify(list, null, 2), 'utf8')
}
// 便签唯一键：kind/name
function noteKey(kind, name) { return kind + '/' + name }

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
    // 不走 cmd /c start：参数经 cmd 拼接时路径里的特殊字符（& 等）会被解释，
    // explorer 直接接收参数数组，天然规避注入与引号问题（文件用默认程序打开）
    cmd = 'explorer'
    args = [absPath]
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
  for (const sub of [...SUBDIRS, TRASH_DIR]) {
    await mkdir(join(root, sub), { recursive: true })
  }
}

// 自动清除：按文件修改时间计龄，超期且未保留的便签移入「已清除」回收站；
// 回收站内容超过 TRASH_KEEP_DAYS 天才真正删除；顺带清理 retained 中已不存在的脏键。
async function cleanupExpired(root, cfg, retained) {
  const now = Date.now()
  if (cfg.clearAfter > 0) {
    for (const sub of TYPES) {
      let entries = []
      try {
        entries = await readdir(join(root, sub), { withFileTypes: true })
      } catch (e) { continue }
      for (const ent of entries) {
        if (!ent.isFile() || ent.name.endsWith('.keep')) continue
        if (retained.includes(noteKey(sub, ent.name))) continue
        let mtimeMs = 0
        try { mtimeMs = (await stat(join(root, sub, ent.name))).mtimeMs } catch (e) { continue }
        if ((now - mtimeMs) / 86400000 <= cfg.clearAfter) continue
        // 目标重名时追加时间戳前缀，避免 Windows 上 rename 覆盖失败
        try {
          await rename(join(root, sub, ent.name), join(root, TRASH_DIR, ent.name))
        } catch (e) {
          try {
            await rename(join(root, sub, ent.name), join(root, TRASH_DIR, Date.now() + '-' + ent.name))
          } catch (e2) { /* ignore */ }
        }
      }
    }
  }
  let trash = []
  try {
    trash = await readdir(join(root, TRASH_DIR), { withFileTypes: true })
  } catch (e) { trash = [] }
  for (const ent of trash) {
    if (!ent.isFile()) continue
    try {
      const mtimeMs = (await stat(join(root, TRASH_DIR, ent.name))).mtimeMs
      if ((now - mtimeMs) / 86400000 > TRASH_KEEP_DAYS) {
        await rm(join(root, TRASH_DIR, ent.name), { force: true })
      }
    } catch (e) { /* ignore */ }
  }
  const existing = new Set()
  for (const sub of TYPES) {
    let names = []
    try { names = await readdir(join(root, sub)) } catch (e) { continue }
    for (const name of names) existing.add(noteKey(sub, name))
  }
  const pruned = retained.filter((k) => existing.has(k))
  if (pruned.length !== retained.length) await writeRetained(pruned)
}

async function listNotes() {
  const root = await rootOf()
  await ensureSubdirs(root)
  const cfg = await readConfig()
  let retained = await readRetained()
  await cleanupExpired(root, cfg, retained)
  retained = await readRetained()
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
        // 归档文件名带「类别-」前缀，解析时间前先剥掉
        timeText: timeTextOf(sub === '归档' ? ent.name.replace(/^(点子|感想|TODO)-/, '') : ent.name),
        retained: retained.includes(noteKey(sub, ent.name)),
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

// 当前草稿指针：{ kind, name }；null 表示下次保存时新建文件
let currentDraft = null

async function saveNote(args) {
  const kind = args && args.kind
  if (!TYPES.includes(kind)) return { ok: false, error: 'invalid kind' }
  const content = args && typeof args.content === 'string' ? args.content : ''
  if (!content.trim()) return { ok: false, error: 'empty' }
  const root = await rootOf()
  await ensureSubdirs(root)
  // 若当前草稿属于同一类别，覆盖同一文件；否则新建文件并记住指针
  let name
  if (currentDraft && currentDraft.kind === kind && currentDraft.name) {
    name = currentDraft.name
  } else {
    name = safeName(kind)
    currentDraft = { kind, name }
  }
  await writeFile(join(root, kind, name), content.trim() + '\n', 'utf8')
  return { ok: true, name, kind }
}

// 更新指定历史便签文件（查看/编辑后保存）
async function updateNote(args) {
  const kind = args && args.kind
  const name = args && args.name
  const content = args && typeof args.content === 'string' ? args.content : ''
  if (!TYPES.includes(kind) || !name) return { ok: false, error: 'invalid args' }
  if (/[\\/]|\.\./.test(name)) return { ok: false, error: 'bad name' }
  if (!content.trim()) return { ok: false, error: 'empty' }
  const root = await rootOf()
  await ensureSubdirs(root)
  await writeFile(join(root, kind, name), content.trim() + '\n', 'utf8')
  return { ok: true, name, kind }
}

// 显式新建：清空草稿指针，下次保存落到新文件
async function newNote() {
  currentDraft = null
  return { ok: true }
}

// 内容清空：删除当前草稿文件并重置指针（不再残留空/旧内容）
async function clearDraft() {
  if (!currentDraft || !currentDraft.name) return { ok: true }
  const { kind, name } = currentDraft
  currentDraft = null
  if (!TYPES.includes(kind)) return { ok: true }
  if (/[\\/]|\.\./.test(name)) return { ok: true }
  const root = await rootOf()
  try {
    await rm(join(root, kind, name), { force: true })
  } catch (e) { /* file already gone — fine */ }
  return { ok: true }
}

// 切换保留状态：保留 = 自动清除时豁免
async function toggleRetain(args) {
  const kind = args && args.kind
  const name = args && args.name
  const retain = args && args.retain === true
  if (!TYPES.includes(kind) || !name) return { ok: false, error: 'invalid args' }
  if (/[\\/]|\.\./.test(name)) return { ok: false, error: 'bad name' }
  const list = await readRetained()
  const key = noteKey(kind, name)
  const idx = list.indexOf(key)
  let retained = retain
  if (retain) {
    if (idx < 0) list.push(key)
  } else {
    if (idx >= 0) list.splice(idx, 1)
  }
  retained = retain
  await writeRetained(list)
  return { ok: true, retained }
}

// 读取某条历史便签的完整内容（归档条目也可读）
async function readNote(args) {
  const kind = args && args.kind
  const name = args && args.name
  if (![...TYPES, '归档'].includes(kind) || !name) return { ok: false, error: 'invalid args' }
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
      case 'update': {
        const r = await updateNote(payload)
        return r.ok ? { ok: true, value: { name: r.name, kind: r.kind } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'new': {
        const r = await newNote()
        return { ok: true, value: {} }
      }
      case 'clear': {
        const r = await clearDraft()
        return { ok: true, value: {} }
      }
      case 'read': {
        const r = await readNote(payload)
        return r.ok ? { ok: true, value: { content: r.content, name: r.name, kind: r.kind } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'archive': {
        const r = await archiveNote(payload)
        return r.ok ? { ok: true, value: { name: r.name, kind: r.kind } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'restore': {
        // 从归档恢复：归档文件名带「类别-」前缀，剥掉前缀移回原类别目录
        const name = payload && payload.name
        if (!name || /[\\/]|\.\./.test(name)) return { ok: false, error: { code: 'bad', details: 'bad name' } }
        const idx = name.indexOf('-')
        if (idx <= 0) return { ok: false, error: { code: 'bad', details: 'bad name' } }
        const kind = name.slice(0, idx)
        const orig = name.slice(idx + 1)
        if (!TYPES.includes(kind) || !orig) return { ok: false, error: { code: 'bad', details: 'bad name' } }
        const root = await rootOf()
        await ensureSubdirs(root)
        try {
          await rename(join(root, '归档', name), join(root, kind, orig))
        } catch (e) {
          return { ok: false, error: { code: 'bad', details: 'move failed: ' + (e && e.message) } }
        }
        return { ok: true, value: { name: orig, kind } }
      }
      case 'retain': {
        const r = await toggleRetain(payload)
        return r.ok ? { ok: true, value: { retained: r.retained } } : { ok: false, error: { code: 'bad', details: r.error } }
      }
      case 'config': {
        const current = await readConfig()
        const next = { ...current }
        if (payload && typeof payload.root === 'string' && payload.root.trim()) next.root = payload.root.trim()
        if (payload && payload.viewMode === 'file') next.viewMode = 'file'
        if (payload && payload.viewMode === 'inline') next.viewMode = 'inline'
        if (payload && [0, 10, 60, 300].includes(payload.saveInterval)) next.saveInterval = payload.saveInterval
        if (payload && [0, 1, 3, 7].includes(payload.clearAfter)) next.clearAfter = payload.clearAfter
        if (payload && TYPES.includes(payload.defaultKind)) next.defaultKind = payload.defaultKind
        if (payload && (payload.sendMode === 'send' || payload.sendMode === 'append')) next.sendMode = payload.sendMode
        if (payload && (payload.root !== undefined || payload.viewMode !== undefined || payload.saveInterval !== undefined || payload.clearAfter !== undefined || payload.defaultKind !== undefined || payload.sendMode !== undefined)) {
          await writeConfig(next)
        }
        return { ok: true, value: { ...next } }
      }
      case 'open': {
        // 用系统默认程序打开便签文件（跨平台；归档条目也可打开）
        const kind = payload && payload.kind
        const name = payload && payload.name
        if (![...TYPES, '归档'].includes(kind) || !name) return { ok: false, error: { code: 'bad', details: 'invalid args' } }
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

export { handler }

export function apply(ctx) {
  ctx.inject(['connection'], (connectionCtx) => {
    connectionCtx.effect(() => {
      return connectionCtx.connection.rpc.handle(CHANNEL, handler, { authority: 'loopback' })
    }, 'dsh-sticky-note: rpc')
  })
  // 定时自动清除（启动时一次 + 每小时一次），不再依赖用户打开历史列表才触发
  ctx.effect(() => {
    const run = () => {
      rootOf().then(async (root) => {
        await ensureSubdirs(root)
        const cfg = await readConfig()
        const retained = await readRetained()
        await cleanupExpired(root, cfg, retained)
      }).catch(() => {})
    }
    run()
    const timer = setInterval(run, 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, 'dsh-sticky-note: cleanup timer')
}
