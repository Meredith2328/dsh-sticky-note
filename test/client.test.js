import { afterAll, beforeAll, describe, expect, it } from 'vitest'

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
})
