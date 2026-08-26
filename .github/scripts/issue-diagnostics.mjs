import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX_REFERENCES = 12
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'coverage', 'vendor'])
const SOURCE_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.css', '.go', '.h', '.hpp', '.html', '.java', '.js',
  '.jsx', '.json', '.md', '.mjs', '.py', '.rs', '.sh', '.ts', '.tsx', '.vue',
  '.yaml', '.yml',
])

function normalizeRelative(value) {
  return value.replaceAll('\\', '/').replace(/^\.\//, '')
}

function isSafeRelative(value) {
  const normalized = normalizeRelative(value)
  return normalized.length > 0
    && normalized.length <= 240
    && !path.posix.isAbsolute(normalized)
    && !normalized.split('/').includes('..')
    && !normalized.includes('\0')
}

export function collectReferences(text = '') {
  const refs = []
  const seen = new Set()
  const input = String(text).slice(0, 100_000)
  const pattern = /(?:^|[\s(`'"，、（])((?:[\w.@+-]+[\\/])*[\w.@+-]+\.[A-Za-z0-9]+):(\d{1,7})(?!\d)/gmu
  for (const match of input.matchAll(pattern)) {
    const filePath = normalizeRelative(match[1])
    const line = Number(match[2])
    const key = `${filePath}:${line}`
    if (!isSafeRelative(filePath) || !Number.isSafeInteger(line) || line < 1 || seen.has(key)) continue
    refs.push({ path: filePath, line })
    seen.add(key)
    if (refs.length >= MAX_REFERENCES) break
  }
  return refs
}

async function listFiles(root, current = '') {
  const absolute = path.join(root, current)
  const entries = await readdir(absolute, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.github') continue
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue
    const relative = normalizeRelative(path.join(current, entry.name))
    if (entry.isDirectory()) files.push(...await listFiles(root, relative))
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(relative)
  }
  return files
}

function cleanCodeLine(value) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
}

export async function resolveReference(root, reference, knownFiles) {
  const files = knownFiles ?? await listFiles(root)
  const wanted = normalizeRelative(reference.path)
  let candidates = files.filter((file) => file === wanted)
  if (candidates.length === 0) {
    candidates = files.filter((file) => file === wanted || file.endsWith(`/${wanted}`))
  }
  if (candidates.length === 0) return { ...reference, status: 'missing' }
  if (candidates.length > 1) return { ...reference, status: 'ambiguous', candidates: candidates.slice(0, 5) }

  const relative = candidates[0]
  const absolute = path.resolve(root, relative)
  const resolvedRoot = path.resolve(root) + path.sep
  if (!absolute.startsWith(resolvedRoot)) return { ...reference, status: 'missing' }
  const info = await stat(absolute)
  if (!info.isFile() || info.size > 2_000_000) return { ...reference, status: 'unreadable', path: relative }

  const lines = (await readFile(absolute, 'utf8')).split(/\r?\n/u)
  if (reference.line > lines.length) {
    return { ...reference, path: relative, status: 'line-missing', lineCount: lines.length }
  }
  const from = Math.max(1, reference.line - 2)
  const to = Math.min(lines.length, reference.line + 2)
  const snippet = []
  for (let number = from; number <= to; number += 1) {
    snippet.push(`${String(number).padStart(5)} | ${cleanCodeLine(lines[number - 1])}`)
  }
  return { ...reference, path: relative, status: 'resolved', snippet: snippet.join('\n') }
}

export function assessIssue(body = '') {
  const text = String(body).slice(0, 100_000)
  return {
    environment: /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?(?:环境|environment)(?=\s|[:：]|$)/imu.test(text),
    reproduction: /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?(?:现状与复现|复现(?:步骤)?|steps? to reproduce|reproduction)(?=\s|[:：]|$)/imu.test(text),
    expected: /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?(?:期望|预期|expected(?: behavior)?)(?=\s|[:：]|$)/imu.test(text),
    evidence: /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?(?:相关代码|源码|日志|证据|relevant code|logs?|evidence)(?=\s|[:：]|$)/imu.test(text),
  }
}

function checklistLine(label, present) {
  return `- ${present ? '✅' : '⚠️'} ${label}：${present ? '已提供' : '缺失'}`
}

function baselineText(outcome) {
  if (outcome === 'success') return '✅ 通过'
  if (outcome === 'failure') return '❌ 失败（这不等于 Issue 由本次变更引起，请打开本次 Actions 日志确认）'
  return '⚪ 未运行或无可用测试命令'
}

export async function generateReport(event, root, options = {}) {
  const issue = event?.issue ?? {}
  const body = typeof issue.body === 'string' ? issue.body : ''
  const assessment = assessIssue(body)
  const references = collectReferences(body)
  const files = await listFiles(root)
  const resolved = []
  for (const reference of references) resolved.push(await resolveReference(root, reference, files))

  const lines = [
    '<!-- issue-diagnostics:v1 -->',
    '## 自动排查结果',
    '',
    `针对 Issue #${Number.isSafeInteger(issue.number) ? issue.number : '?'}，已在当前提交上完成只读排查。报告不会执行 Issue 中的命令或代码。`,
    '',
    '### 1. 报告完整度',
    '',
    checklistLine('环境信息', assessment.environment),
    checklistLine('复现步骤', assessment.reproduction),
    checklistLine('期望结果', assessment.expected),
    checklistLine('代码位置 / 日志证据', assessment.evidence),
    '',
    '### 2. 仓库基线',
    '',
    `- 仓库基线测试：${baselineText(options.testOutcome)}`,
    options.runUrl ? `- [查看本次 Actions 运行](${options.runUrl})` : '- Actions 运行链接：本地生成时不可用',
    options.commit ? `- 排查提交：\`${String(options.commit).slice(0, 40)}\`` : '- 排查提交：未提供',
    '',
    '### 3. 源码引用核对',
    '',
  ]

  if (resolved.length === 0) {
    lines.push('- ⚠️ Issue 中没有识别到 `文件:行号` 引用；建议补充至少一个可核对位置。')
  } else {
    for (const item of resolved) {
      if (item.status === 'resolved') {
        lines.push(`- ✅ \`${item.path}:${item.line}\` 存在，附近代码：`, '', ...item.snippet.split('\n').map((line) => `      ${line}`), '')
      } else if (item.status === 'line-missing') {
        lines.push(`- ⚠️ \`${item.path}:${item.line}\` 文件存在，但当前文件只有 ${item.lineCount} 行。`)
      } else if (item.status === 'ambiguous') {
        lines.push(`- ⚠️ \`${item.path}:${item.line}\` 对应多个文件：${item.candidates.map((itemPath) => `\`${itemPath}\``).join('、')}。`)
      } else {
        lines.push(`- ⚠️ \`${item.path}:${item.line}\` 在当前提交中未找到。`)
      }
    }
  }

  const missing = Object.values(assessment).filter((value) => !value).length
  const invalid = resolved.filter((item) => item.status !== 'resolved').length
  lines.push(
    '',
    '### 4. 下一步',
    '',
    missing === 0 && invalid === 0
      ? '- 资料和引用均可核对，可以进入人工价值判断与修复设计。'
      : '- 先补齐上面的缺失资料或失效引用，再做实现判断，避免按错误上下文修复。',
    '- 本报告只提供证据，不自动承诺实现，也不把“测试通过”当作 Issue 已证实。',
  )
  return lines.join('\n').slice(0, 60_000)
}

async function main() {
  const [eventPath, root = process.cwd()] = process.argv.slice(2)
  if (!eventPath) throw new Error('usage: node issue-diagnostics.mjs <event.json> [repo-root]')
  const event = JSON.parse(await readFile(eventPath, 'utf8'))
  const report = await generateReport(event, root, {
    testOutcome: process.env.TEST_OUTCOME,
    runUrl: process.env.RUN_URL,
    commit: process.env.GITHUB_SHA,
  })
  process.stdout.write(report)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
