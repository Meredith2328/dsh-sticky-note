const MARKER = '<!-- contribution-gate:v1 -->'
const READY_LABEL = 'contribution-ready'
const TRIAGE_LABEL = 'needs-triage'
const ACCEPTED_LABEL = 'accepted'
const TRUSTED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

const LABELS = {
  [ACCEPTED_LABEL]: {
    color: '0E8A16',
    description: 'Maintainer accepted the issue for implementation',
  },
  [TRIAGE_LABEL]: {
    color: 'D93F0B',
    description: 'Contribution requirements are not yet satisfied',
  },
  [READY_LABEL]: {
    color: '1D76DB',
    description: 'External contribution passed the metadata gate',
  },
}

export function closingIssueNumbers(body = '') {
  const numbers = new Set()
  const text = String(body).slice(0, 100_000)
  const closingLine = /(?:^|\n)\s*(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)[ \t]+([^\n]+)/gimu
  for (const match of text.matchAll(closingLine)) {
    for (const reference of match[1].matchAll(/(?:^|[\s,;])#(\d+)(?!\d)/gu)) {
      const number = Number(reference[1])
      if (Number.isSafeInteger(number) && number > 0) numbers.add(number)
    }
  }
  return [...numbers]
}

export function trustedAssociation(value) {
  return TRUSTED_ASSOCIATIONS.has(String(value || '').toUpperCase())
}

function labelNames(issue) {
  return new Set((issue?.labels || []).map((label) => typeof label === 'string' ? label : label?.name).filter(Boolean))
}

export async function evaluatePullRequest({ github, owner, repo, pull }) {
  if (trustedAssociation(pull.author_association)) {
    return { ready: true, trusted: true, reason: 'trusted-author', references: [] }
  }

  const references = closingIssueNumbers(pull.body)
  if (references.length === 0) {
    return { ready: false, trusted: false, reason: 'missing-reference', references: [] }
  }

  const inspected = []
  for (const issueNumber of references) {
    try {
      const response = await github.rest.issues.get({ owner, repo, issue_number: issueNumber })
      const issue = response.data
      const accepted = !issue.pull_request
        && issue.state === 'open'
        && labelNames(issue).has(ACCEPTED_LABEL)
      inspected.push({ number: issueNumber, accepted, state: issue.state, isPullRequest: Boolean(issue.pull_request) })
    } catch (error) {
      if (error?.status !== 404) throw error
      inspected.push({ number: issueNumber, accepted: false, state: 'missing', isPullRequest: false })
    }
  }

  return {
    ready: inspected.some((issue) => issue.accepted),
    trusted: false,
    reason: inspected.some((issue) => issue.accepted) ? 'accepted-issue' : 'issue-not-accepted',
    references: inspected,
  }
}

function gateComment(result, owner, repo) {
  const guide = `https://github.com/${owner}/${repo}/blob/main/CONTRIBUTING.md`
  if (result.ready) {
    return [
      MARKER,
      '## Contribution gate',
      '',
      '✅ 已关联开放且带有 `accepted` 标签的 Issue，可以进入维护者审查。',
      '',
      `提交前请继续遵守 [CONTRIBUTING.md](${guide}) 中的真实验收和脱敏要求。`,
    ].join('\n')
  }

  const detail = result.reason === 'missing-reference'
    ? 'PR 描述中没有找到 `Closes #N`、`Fixes #N` 或 `Resolves #N`。'
    : `关联项 ${result.references.map((issue) => `#${issue.number}`).join('、')} 尚无开放且带 \`accepted\` 标签的 Issue。`
  return [
    MARKER,
    '## Contribution gate',
    '',
    '⏸️ 该 PR 暂不进入人工代码审查。',
    '',
    `- ${detail}`,
    '- 请先提交包含真实复现和验收方式的 Issue，等待维护者确认并添加 `accepted` 标签。',
    '- 确认后更新 PR 描述；门禁会自动重新检查。',
    '',
    `完整规则见 [CONTRIBUTING.md](${guide})。门禁只检查元数据，不会执行本 PR 的代码。`,
  ].join('\n')
}

async function ensureLabels(github, owner, repo) {
  for (const [name, data] of Object.entries(LABELS)) {
    try {
      await github.rest.issues.getLabel({ owner, repo, name })
    } catch (error) {
      if (error?.status !== 404) throw error
      await github.rest.issues.createLabel({ owner, repo, name, ...data })
    }
  }
}

async function removeLabelIfPresent(github, owner, repo, issueNumber, labels, name) {
  if (!labels.has(name)) return
  try {
    await github.rest.issues.removeLabel({ owner, repo, issue_number: issueNumber, name })
  } catch (error) {
    if (error?.status !== 404) throw error
  }
}

async function upsertComment(github, owner, repo, issueNumber, body) {
  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  })
  const previous = comments.find((comment) => comment.body?.includes(MARKER) && comment.user?.type === 'Bot')
  if (previous) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: previous.id, body })
    return 'updated'
  }
  await github.rest.issues.createComment({ owner, repo, issue_number: issueNumber, body })
  return 'created'
}

export async function applyGateResult({ github, owner, repo, pull, result }) {
  const labels = labelNames(pull)
  if (result.ready) {
    await removeLabelIfPresent(github, owner, repo, pull.number, labels, TRIAGE_LABEL)
    if (!labels.has(READY_LABEL)) {
      await github.rest.issues.addLabels({ owner, repo, issue_number: pull.number, labels: [READY_LABEL] })
    }
  } else {
    await removeLabelIfPresent(github, owner, repo, pull.number, labels, READY_LABEL)
    if (!labels.has(TRIAGE_LABEL)) {
      await github.rest.issues.addLabels({ owner, repo, issue_number: pull.number, labels: [TRIAGE_LABEL] })
    }
  }

  if (!result.trusted) {
    await upsertComment(github, owner, repo, pull.number, gateComment(result, owner, repo))
  }
}

export async function pullTargets(github, context, owner, repo) {
  if (context.payload.pull_request) return [context.payload.pull_request]
  const pulls = await github.paginate(github.rest.pulls.list, {
    owner,
    repo,
    state: 'open',
    per_page: 100,
  })
  if (!context.payload.issue) return pulls
  const issueNumber = context.payload.issue.number
  return pulls.filter((pull) => closingIssueNumbers(pull.body).includes(issueNumber))
}

export async function runContributionGate({ github, context }) {
  const { owner, repo } = context.repo
  await ensureLabels(github, owner, repo)
  const pulls = await pullTargets(github, context, owner, repo)
  const outcomes = []
  for (const pull of pulls) {
    const result = await evaluatePullRequest({ github, owner, repo, pull })
    await applyGateResult({ github, owner, repo, pull, result })
    outcomes.push({ number: pull.number, ...result })
  }
  return outcomes
}
