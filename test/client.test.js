import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'

let client
let previousWindow

beforeAll(async () => {
  previousWindow = globalThis.window
  let definition
  globalThis.window = {
    __ModuleLoader__: {
      load(value) { definition = value },
    },
  }
  await import('../lib/client.js')
  client = definition.factory(() => ({}))
})

afterAll(() => {
  globalThis.window = previousWindow
})

describe('Markdown 空行预览', () => {
  it('为每个连续空行生成独立占位', () => {
    const html = client.renderMarkdown('第一行\n\n\n第二行')
    expect(html.match(/class="sn-md-blank"/g)).toHaveLength(2)
  })

  it('保留开头和结尾的空行结构', () => {
    const html = client.renderMarkdown('\n正文\n\n')
    expect(html.match(/class="sn-md-blank"/g)).toHaveLength(3)
  })
})

describe('面板布局', () => {
  it('把位置和尺寸夹紧在视口内', () => {
    expect(client.clampPanelLayout(
      { x: 900, y: -20, width: 500, height: 700 },
      { width: 1024, height: 768 },
    )).toEqual({ x: 520, y: 4, width: 500, height: 700 })
  })

  it('小视口优先保证整个面板可见', () => {
    expect(client.clampPanelLayout(
      { x: 20, y: 20, width: 500, height: 700 },
      { width: 220, height: 160 },
    )).toEqual({ x: 4, y: 4, width: 212, height: 152 })
  })

  it('损坏或越界的持久化数据回退到安全默认值', () => {
    expect(client.parsePanelLayout('{bad json')).toEqual({ x: null, y: null, width: 280, height: 330 })
    expect(client.parsePanelLayout('{"x":"bad","y":9,"width":0,"height":99999}')).toEqual({ x: null, y: null, width: 280, height: 330 })
  })

  it('固定模式把面板吸附到最近的左右边缘', () => {
    expect(client.snapPanelLayout(
      { x: 100, y: 60, width: 280, height: 330 },
      { width: 1200, height: 800 },
    )).toEqual({ x: 4, y: 60, width: 280, height: 330 })
    expect(client.snapPanelLayout(
      { x: 850, y: 60, width: 280, height: 330 },
      { width: 1200, height: 800 },
    )).toEqual({ x: 916, y: 60, width: 280, height: 330 })
  })

  it('默认未固定，固定状态从本地持久化恢复', async () => {
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).toContain("localStorage.getItem(PANEL_PINNED_KEY) === 'true'")
    expect(source).toContain('if (!open || pinned) return')
    expect(source).toContain("'aria-label': pinned ? '取消固定便签' : '固定便签'")
  })
})

describe('标题栏操作', () => {
  it('标题禁止换行，操作默认收起并以浮层展开', async () => {
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).toContain('.sn-head-title { flex: none; white-space: nowrap; }')
    expect(source).toContain("const [headActionsOpen, setHeadActionsOpen] = React.useState(false)")
    expect(source).toContain("className: 'sn-head-actions-pop'")
    expect(source).toContain("'aria-label': '展开标题栏操作'")
    expect(source).toContain('if (headActionsOpen) { setHeadActionsOpen(false); return }')
  })
})
