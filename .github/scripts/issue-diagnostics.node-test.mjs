import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  assessIssue,
  collectReferences,
  generateReport,
  resolveReference,
} from './issue-diagnostics.mjs'

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'issue-diagnostics-'))
  await mkdir(path.join(root, 'lib'), { recursive: true })
  await writeFile(path.join(root, 'lib', 'client.js'), [
    'export function saveNote(content) {',
    '  return content.trim() + "\\n"',
    '}',
    '',
  ].join('\n'))
  return root
}

test('extracts bounded path:line references and rejects traversal', () => {
  const refs = collectReferences('See `lib/client.js:2`, client.js:3 and ../secret.txt:1')
  assert.deepEqual(refs, [
    { path: 'lib/client.js', line: 2 },
    { path: 'client.js', line: 3 },
  ])
})

test('resolves a unique shorthand path inside the repository', async (t) => {
  const root = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  const result = await resolveReference(root, { path: 'client.js', line: 2 })
  assert.equal(result.status, 'resolved')
  assert.equal(result.path, 'lib/client.js')
  assert.match(result.snippet, /content\.trim/)
})

test('scores environment, reproduction, expected result, and source evidence separately', () => {
  const result = assessIssue([
    '## 环境',
    'Node 22',
    '## 复现步骤',
    '1. open',
    '## 期望',
    'keep whitespace',
    '## 相关代码',
    '`lib/client.js:2`',
  ].join('\n'))
  assert.deepEqual(result, {
    environment: true,
    reproduction: true,
    expected: true,
    evidence: true,
  })
})

test('report includes resolved evidence, missing fields, and test outcome', async (t) => {
  const root = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  const event = {
    issue: {
      number: 12,
      title: 'saveNote removes whitespace',
      body: '## 复现\nCall `client.js:2`\n## 期望\nWhitespace remains',
      html_url: 'https://example.test/issues/12',
      user: { login: 'reporter' },
    },
    repository: { full_name: 'owner/repo' },
  }
  const report = await generateReport(event, root, { testOutcome: 'failure' })
  assert.match(report, /issue-diagnostics:v1/)
  assert.match(report, /lib\/client\.js:2/)
  assert.match(report, /content\.trim/)
  assert.match(report, /环境信息.*缺失/)
  assert.match(report, /仓库基线测试.*失败/)
})

test('issue text is never executed or copied as an unsafe code fence', async (t) => {
  const root = await fixture()
  t.after(() => rm(root, { recursive: true, force: true }))
  const event = {
    issue: {
      number: 13,
      title: '$(touch SHOULD_NOT_EXIST)',
      body: '```\n${{ secrets.GITHUB_TOKEN }}\n```\n`../secret.txt:1`',
      html_url: 'https://example.test/issues/13',
      user: { login: 'attacker' },
    },
    repository: { full_name: 'owner/repo' },
  }
  const report = await generateReport(event, root, { testOutcome: 'success' })
  assert.doesNotMatch(report, /GITHUB_TOKEN/)
  assert.doesNotMatch(report, /secret\.txt/)
})
