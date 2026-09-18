import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyGateResult,
  closingIssueNumbers,
  evaluatePullRequest,
  pullTargets,
  trustedAssociation,
} from './contribution-gate.mjs'

function fakeGithub(issues = {}) {
  const state = { labels: new Set(), comments: [], created: 0, updated: 0 }
  const github = {
    paginate: async () => state.comments,
    rest: {
      issues: {
        get: async ({ issue_number }) => {
          if (!issues[issue_number]) throw Object.assign(new Error('missing'), { status: 404 })
          return { data: issues[issue_number] }
        },
        addLabels: async ({ labels }) => labels.forEach((label) => state.labels.add(label)),
        removeLabel: async ({ name }) => state.labels.delete(name),
        listComments: async () => ({ data: state.comments }),
        createComment: async ({ body }) => {
          state.created += 1
          state.comments.push({ id: state.comments.length + 1, body, user: { type: 'Bot' } })
        },
        updateComment: async ({ comment_id, body }) => {
          state.updated += 1
          state.comments.find((comment) => comment.id === comment_id).body = body
        },
      },
    },
  }
  return { github, state }
}

test('extracts only explicit closing-keyword issue references', () => {
  assert.deepEqual(closingIssueNumbers('See #1\nCloses #12, #13\nFixes #12\nResolves #14'), [12, 13, 14])
  assert.deepEqual(closingIssueNumbers('Fixes: #12'), [])
  assert.deepEqual(closingIssueNumbers('Related to #22'), [])
})

test('recognizes repository maintainers and collaborators', () => {
  assert.equal(trustedAssociation('OWNER'), true)
  assert.equal(trustedAssociation('collaborator'), true)
  assert.equal(trustedAssociation('CONTRIBUTOR'), false)
  assert.equal(trustedAssociation('NONE'), false)
})

test('external PR passes only with an open accepted issue', async () => {
  const { github } = fakeGithub({
    7: { state: 'open', labels: [{ name: 'accepted' }] },
    8: { state: 'closed', labels: [{ name: 'accepted' }] },
  })
  const accepted = await evaluatePullRequest({
    github,
    owner: 'o',
    repo: 'r',
    pull: { body: 'Closes #7', author_association: 'CONTRIBUTOR' },
  })
  const closed = await evaluatePullRequest({
    github,
    owner: 'o',
    repo: 'r',
    pull: { body: 'Closes #8', author_association: 'CONTRIBUTOR' },
  })
  assert.equal(accepted.ready, true)
  assert.equal(accepted.reason, 'accepted-issue')
  assert.equal(closed.ready, false)
  assert.equal(closed.reason, 'issue-not-accepted')
})

test('missing reference is rejected without querying issues', async () => {
  const { github } = fakeGithub()
  const result = await evaluatePullRequest({
    github,
    owner: 'o',
    repo: 'r',
    pull: { body: 'Improves #7', author_association: 'NONE' },
  })
  assert.deepEqual(result, {
    ready: false,
    trusted: false,
    reason: 'missing-reference',
    references: [],
  })
})

test('repeated gate runs update one bot comment instead of creating noise', async () => {
  const { github, state } = fakeGithub()
  const pull = { number: 21, labels: [] }
  const result = { ready: false, trusted: false, reason: 'missing-reference', references: [] }
  await applyGateResult({ github, owner: 'o', repo: 'r', pull, result })
  pull.labels = [...state.labels].map((name) => ({ name }))
  await applyGateResult({ github, owner: 'o', repo: 'r', pull, result })
  assert.equal(state.created, 1)
  assert.equal(state.updated, 1)
  assert.equal(state.comments.length, 1)
  assert.deepEqual([...state.labels], ['needs-triage'])
})

test('trusted maintainer PR passes without a gate comment', async () => {
  const { github, state } = fakeGithub()
  const pull = { number: 22, body: '', author_association: 'OWNER', labels: [] }
  const result = await evaluatePullRequest({ github, owner: 'o', repo: 'r', pull })
  await applyGateResult({ github, owner: 'o', repo: 'r', pull, result })
  assert.equal(result.ready, true)
  assert.equal(result.trusted, true)
  assert.equal(state.comments.length, 0)
  assert.deepEqual([...state.labels], ['contribution-ready'])
})

test('issue label events re-evaluate only PRs that close that issue', async () => {
  const pulls = [
    { number: 30, body: 'Closes #7' },
    { number: 31, body: 'Closes #8' },
    { number: 32, body: 'Related to #7' },
  ]
  const github = {
    paginate: async () => pulls,
    rest: { pulls: { list: async () => ({ data: pulls }) } },
  }
  const targets = await pullTargets(github, { payload: { issue: { number: 7 } } }, 'o', 'r')
  assert.deepEqual(targets.map((pull) => pull.number), [30])
})
