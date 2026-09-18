# 贡献指南

感谢你愿意改进 dsh-sticky-note。这个项目采用 **先 Issue、后 PR** 的流程：先确认问题值得解决、验收方式可靠，再投入实现和审查时间。

## 提交流程

1. 先创建 Issue，写清环境、真实复现步骤、期望结果和可核对证据。
2. 等待维护者确认范围，并为 Issue 添加 `accepted` 标签。
3. 再提交 PR，在描述中使用 `Closes #<Issue 编号>` 关联仍处于开放状态的 accepted Issue。
4. 按 PR 模板提供测试命令、结果和真实用户路径验收。

未经确认直接提交的外部 PR 会被标记为 `needs-triage`，暂不进入代码审查；不满足本指南的 PR 可能直接关闭。

## 什么是有效证据

- Bug：提供从正常入口触发问题的最小复现、实际结果和期望结果。
- 安全问题：说明真实可达的攻击路径、信任边界和影响。扫描器告警本身不等于漏洞，也不要先提交自动生成的修复。
- 用户可见变化：按用户实际使用方式验收；界面变化附真实运行截图。
- 测试：应验证生产代码或真实集成边界。不要在测试里重写一套模拟实现，再用它证明同一套模拟实现正确。

请勿在 Issue、PR、日志或截图中提交令牌、账号信息、本机绝对路径或其他敏感数据。

## AI 辅助贡献

可以使用 AI 辅助，但提交者仍须：

- 在 PR 模板中如实说明 AI 参与范围；
- 理解并人工检查每一处变更；
- 实际运行所声明的测试和验收；
- 对代码、证据和后续维护负责。

“由 AI 生成”不是拒绝理由；无法解释、无法复现或缺少可靠证据才是。

## 自动门禁

外部 PR 只有在满足以下条件后才会标记为 `contribution-ready`：

- PR 描述使用 `Closes #N`、`Fixes #N` 或 `Resolves #N` 关联本仓库 Issue；
- 至少一个关联 Issue 仍开放，并带有维护者添加的 `accepted` 标签。

仓库所有者、成员和已有协作者的 PR 自动通过此元数据门禁。门禁只读取 PR/Issue 元数据，不检出或执行外部 PR 代码。

通过或未通过元数据门禁都不会触发昂贵任务；仓库只运行一组快速检查：自动化脚本单测、产品单测和 `npm pack --dry-run`。常规 CI 与 Issue 基线复用 `npm run check`，避免不同工作流维护不同测试清单。

---

## English summary

External contributions are issue-first. Open an Issue with a real reproduction and acceptance criteria, wait for the maintainer to add the `accepted` label, then open a PR containing `Closes #N`. AI assistance is allowed but must be disclosed, understood, tested, and owned by the submitter. Unsupported scanner-only findings, self-validating mocks, and PRs without an accepted Issue may be closed without code review.
