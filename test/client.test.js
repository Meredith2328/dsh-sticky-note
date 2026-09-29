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
  // 只需要能构造 React 元素（{ type, props }），不渲染
  client = definition.factory((name) => name === 'react'
    ? { createElement: (type, props) => ({ type, props }), Fragment: 'Fragment' }
    : {})
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

  it('按实际缩放尺寸夹紧位置并保持边缘吸附', () => {
    expect(client.clampPanelLayout(
      { x: 900, y: 4, width: 280, height: 330 },
      { width: 1024, height: 768 },
      150,
    )).toEqual({ x: 600, y: 4, width: 280, height: 330 })
    expect(client.snapPanelLayout(
      { x: 850, y: 60, width: 280, height: 330 },
      { width: 1200, height: 800 },
      150,
    )).toEqual({ x: 776, y: 60, width: 280, height: 330 })
  })

  it('缩放档位、边界和重置保持稳定', () => {
    expect(client.parsePanelZoom(null)).toBe(100)
    expect(client.parsePanelZoom('bad')).toBe(100)
    expect(client.parsePanelZoom('116')).toBe(120)
    expect(client.parsePanelZoom('200')).toBe(100)
    expect(client.nextPanelZoom(100, 'in')).toBe(110)
    expect(client.nextPanelZoom(80, 'out')).toBe(80)
    expect(client.nextPanelZoom(150, 'in')).toBe(150)
    expect(client.nextPanelZoom(130, 'reset')).toBe(100)
  })

  it('识别 macOS 与 Windows/Linux 缩放快捷键', () => {
    expect(client.panelZoomCommand({ metaKey: true, ctrlKey: false, altKey: false, key: '+', code: 'Equal' })).toBe('in')
    expect(client.panelZoomCommand({ metaKey: false, ctrlKey: true, altKey: false, key: '-', code: 'Minus' })).toBe('out')
    expect(client.panelZoomCommand({ metaKey: false, ctrlKey: true, altKey: false, key: '0', code: 'Digit0' })).toBe('reset')
    expect(client.panelZoomCommand({ metaKey: false, ctrlKey: false, altKey: false, key: '+', code: 'Equal' })).toBeNull()
    expect(client.panelZoomCommand({ metaKey: true, ctrlKey: false, altKey: true, key: '+', code: 'Equal' })).toBeNull()
  })

  it('默认未固定，固定状态从本地持久化恢复', async () => {
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).toContain("localStorage.getItem(PANEL_PINNED_KEY) === 'true'")
    expect(source).toContain('if (!open || pinned) return')
    expect(source).toContain("'aria-label': pinned ? '取消固定便签' : '固定便签'")
  })

  it('续写选项默认关闭，仅开启时请求当前草稿', async () => {
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).toContain("const [resumeDraft, setResumeDraft] = React.useState(false)")
    expect(source).toContain("rpc('draft', {})")
    expect(source).toContain("{ value: true, label: '继续上次草稿' }")
  })

  it('缩放默认 100%，只绑定在便签面板内部并持久化', async () => {
    const source = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
    expect(source).toContain("localStorage.getItem(PANEL_ZOOM_KEY)")
    expect(source).toContain('onKeyDownCapture: onPanelZoomKeyDown')
    expect(source).toContain("localStorage.setItem(PANEL_ZOOM_KEY, String(next))")
    expect(source).toContain("'aria-label': '重置便签缩放，当前 ' + zoom + '%'")
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
    // 标题栏不再显示拖动图标，拖动仍由标题栏本身的 onPointerDown 承接
    expect(source).not.toContain('sn-drag-grip')
    expect(source).toContain("className: 'sn-head', title: '拖动便签'")
  })
})

describe('DSH 0.2.0 客户端接缝', () => {
  // 用一个最小的 Cordis 客户端上下文跑 apply：只记录它注册到 slots/connection 的形状
  function fakeCtx(calls) {
    const injected = []
    const registrations = []
    const styles = []
    const rpc = {
      call: (...args) => {
        calls.push(args)
        return calls.length === 1
          ? Promise.reject(new Error('no /api fetch route'))
          : Promise.resolve({ ok: true, value: { ok: true } })
      },
    }
    const ctx = {
      get: (name) => ({ connection: { rpc }, slots: {
        inject: (key, callback) => { injected.push(key); callback(); return () => {} },
        register: (options, component) => { registrations.push([options, component]); return () => {} },
      }, uiWorkspace: { pickDirectory: () => Promise.resolve('') } })[name],
      effect: (fn) => { const dispose = fn(); styles.push(dispose); return () => { if (typeof dispose === 'function') dispose() } },
    }
    return { ctx, injected, registrations, styles }
  }

  it('注册输入栏与插件详情页两个插槽', () => {
    const previousDocument = globalThis.document
    globalThis.document = {
      getElementById: () => null,
      createElement: () => ({ id: '', textContent: '', remove() {} }),
      head: { appendChild() {} },
    }
    const calls = []
    const { ctx, injected, registrations, styles } = fakeCtx(calls)
    try {
      client.apply(ctx)
      expect(injected).toEqual(['conversation.input.left', 'plugins.bundle.config'])
      expect(registrations[0][0]).toEqual({ name: 'conversation.input.left', id: 'sticky-note', order: 20 })
      // 详情页 keyed slot 的 key 必须是包名，插件管理器按 entryKey 派发
      expect(registrations[1][0]).toEqual({ name: 'plugins.bundle.config', key: 'dsh-sticky-note' })
      // 只有 page 视图返回设置卡片，行内视图不占位
      expect(registrations[1][1]({ view: 'row' })).toBeNull()
      expect(registrations[1][1]({ view: 'page' })).toBeTruthy()
      expect(typeof styles[0]).toBe('function')
    } finally {
      globalThis.document = previousDocument
    }
  })

  it('配置读写优先走 /api 精确路由，失败退回独立 RPC channel', async () => {
    const previousDocument = globalThis.document
    globalThis.document = {
      getElementById: () => null,
      createElement: () => ({ id: '', textContent: '', remove() {} }),
      head: { appendChild() {} },
    }
    const calls = []
    const { ctx, registrations } = fakeCtx(calls)
    try {
      client.apply(ctx)
      const zone = registrations[0][1]({ inputActions: {}, useInput: () => '' })
      await zone.props.rpc('config', { saveInterval: 60 })
      expect(calls[0]).toEqual(['/api', 'dsh-sticky-note/call', { endpoint: 'config', payload: { saveInterval: 60 } }])
      expect(calls[1]).toEqual(['/dsh-sticky-note', 'config', { saveInterval: 60 }])
      await zone.props.rpc('list', {})
      expect(calls[2]).toEqual(['/api', 'dsh-sticky-note/call', { endpoint: 'list', payload: {} }])
    } finally {
      globalThis.document = previousDocument
    }
  })
})
