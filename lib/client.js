window.__ModuleLoader__.load({
  id: 'dsh-sticky-note',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    let React = require('react')

    const CHANNEL = '/dsh-sticky-note'

    const CSS = `
.sn-fab {
  width: 28px;
  height: 28px;
  margin-left: -15px;
  color: var(--dsw-alias-label-primary, #2b2b33);
  cursor: pointer;
  border: none;
  border-radius: 999px;
  flex: none;
  place-items: center;
  display: grid;
  padding: 0;
  background: var(--dsw-specific-selector, rgba(0, 0, 0, 0.06));
  transition: background-color 0.12s ease;
}
.sn-fab:hover:not(:disabled) {
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
}
.sn-fab:active { transform: scale(0.94); }
.sn-fab svg { display: block; }
.sn-panel {
  position: fixed;
  z-index: 9999;
  min-width: 240px;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
  color: var(--dsw-alias-label-primary, #2b2b33);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.18),
    0 4px 14px rgba(0, 0, 0, 0.1);
  font-family: Inter, var(--dsw-font-family), system-ui, 'Segoe UI', sans-serif;
  font-size: 13px;
  animation: sn-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}
@keyframes sn-pop {
  from { opacity: 0; transform: scale(0.94) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.sn-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
  border-bottom: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.06));
  font-weight: 700;
  font-size: 13.5px;
  letter-spacing: 0.3px;
  color: var(--dsw-alias-label-primary, #2b2b33);
  flex: none;
}
.sn-head > span:first-child { display: flex; align-items: center; gap: 6px; min-width: 0; }
.sn-head-right { display: flex; align-items: center; gap: 6px; flex: none; }
.sn-mini {
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: var(--dsw-specific-selector, rgba(0, 0, 0, 0.05));
  color: var(--dsw-alias-label-primary, #2b2b33);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.12s ease;
}
.sn-mini:hover { border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-mini.sn-on {
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  border-color: transparent;
  color: #fff;
}
.sn-x {
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: #fff;
  color: var(--dsw-alias-label-secondary, #6b6b76);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.12s ease;
}
.sn-x:hover { border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-plus {
  border: none;
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.12s ease;
}
.sn-plus:hover { background: var(--dsw-alias-button-info-hover, #2563eb); transform: scale(1.06); }
.sn-hist {
  background: #fff;
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
}
.sn-hist:hover:not(.sn-active) { background: #f5f9ff; border-color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-hist.sn-active { background: var(--dsw-alias-button-info-fill, #3b82f6); border-color: transparent; color: #fff; }
.sn-back-text {
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: #fff;
  color: var(--dsw-alias-label-primary, #2b2b33);
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.12s ease;
}
.sn-back-text:hover {
  border-color: var(--dsw-alias-button-info-fill, #3b82f6);
  color: var(--dsw-alias-button-info-fill, #3b82f6);
  background: #f5f9ff;
}
.sn-body { display: flex; flex-direction: column; min-width: 0; min-height: 0; flex: 1; overflow: hidden; }
.sn-text {
  flex: 1;
  min-width: 0;
  min-height: 120px;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dsw-alias-label-primary, #2b2b33);
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.7;
  font-family: inherit;
  overflow-x: hidden;
  overflow-y: auto;
}
.sn-text::placeholder { color: var(--dsw-alias-label-tertiary, rgba(43, 43, 51, 0.32)); }
.sn-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
  border-top: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.06));
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.03));
}
.sn-group { display: flex; align-items: center; gap: 5px; }
.sn-iconbtn {
  border: none;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-label-secondary, #4a4a55);
  border-radius: 9px;
  cursor: pointer;
  padding: 5px 10px;
  font-size: 13px;
  transition: background 0.12s ease;
}
.sn-iconbtn:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(0, 0, 0, 0.12)); }
.sn-iconbtn.sn-active {
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  font-weight: 600;
}
.sn-badge-wrap { position: relative; }
.sn-badge {
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.14));
  background: var(--dsw-specific-selector, rgba(0, 0, 0, 0.05));
  color: var(--dsw-alias-label-primary, #2b2b33);
  border-radius: 999px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.12s ease;
}
.sn-badge:hover { border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-caret { font-size: 10px; opacity: 0.7; }
.sn-kind-pop {
  position: absolute;
  right: 0;
  bottom: calc(100% + 6px);
  z-index: 10;
  background: var(--dsw-specific-input-major, #fff);
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 72px;
}
.sn-kind-opt {
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #4a4a55);
  border-radius: 7px;
  cursor: pointer;
  padding: 5px 12px;
  font-size: 12.5px;
  text-align: left;
  transition: background 0.1s ease;
}
.sn-kind-opt:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06)); }
.sn-kind-opt.sn-on {
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  font-weight: 700;
}
.sn-headstatus {
  font-size: 11px;
  font-weight: 400;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.35));
  margin-left: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.sn-list { overflow-y: auto; padding: 6px 10px 12px; max-height: 300px; min-height: 0; }
.sn-cat { margin-top: 6px; }
.sn-cat-name { flex: 1; }
.sn-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  border-radius: 9px;
  cursor: default;
  transition: background 0.1s ease;
}
.sn-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.sn-prev {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--dsw-alias-label-secondary, #3d3d47);
}
.sn-time {
  flex: none;
  min-width: 38px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.35));
  font-variant-numeric: tabular-nums;
}
.sn-arch {
  opacity: 0;
  transition: opacity 0.12s ease;
  border: none;
  background: rgba(255, 80, 80, 0.12);
  color: #d54545;
  border-radius: 7px;
  cursor: pointer;
  padding: 3px 9px;
  font-size: 11px;
  flex-shrink: 0;
}
.sn-row:hover .sn-arch { opacity: 1; }
.sn-arch:hover { background: rgba(255, 80, 80, 0.22); color: #b03a3a; }
.sn-empty { color: var(--dsw-alias-label-tertiary, rgba(43, 43, 51, 0.4)); font-size: 12px; padding: 6px 8px; }
.sn-tip { font-size: 11px; color: var(--dsw-alias-label-tertiary, rgba(43, 43, 51, 0.45)); }
.sn-md {
  flex: 1;
  min-width: 0;
  min-height: 120px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--dsw-alias-label-primary, #2b2b33);
  word-break: break-word;
}
.sn-md h1, .sn-md h2, .sn-md h3, .sn-md h4 {
  margin: 0.6em 0 0.3em;
  line-height: 1.35;
  font-weight: 700;
}
.sn-md h1 { font-size: 18px; }
.sn-md h2 { font-size: 16px; }
.sn-md h3 { font-size: 14.5px; }
.sn-md h4 { font-size: 13.5px; }
.sn-md p { margin: 0.4em 0; }
.sn-md ul, .sn-md ol { margin: 0.4em 0; padding-left: 1.4em; }
.sn-md li { margin: 0.15em 0; }
.sn-md blockquote {
  margin: 0.4em 0;
  padding: 0.2em 0.9em;
  border-left: 3px solid var(--dsw-alias-button-info-fill, #3b82f6);
  color: var(--dsw-alias-label-secondary, #555);
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.03));
  border-radius: 0 6px 6px 0;
}
.sn-md code {
  font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
  font-size: 0.9em;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  border-radius: 4px;
  padding: 0.1em 0.35em;
}
.sn-md pre {
  margin: 0.4em 0;
  padding: 8px 10px;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
  border-radius: 8px;
  overflow-x: auto;
}
.sn-md pre code { background: transparent; padding: 0; }
.sn-md a {
  color: var(--dsw-alias-button-info-fill, #3b82f6);
  text-decoration: underline;
}
.sn-md hr {
  border: none;
  border-top: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  margin: 0.8em 0;
}
.sn-md strong { font-weight: 700; }
.sn-md em { font-style: italic; }
`

    function installStyles() {
      const id = 'dsh-sticky-note-css'
      if (document.getElementById(id)) return () => {}
      const style = document.createElement('style')
      style.id = id
      style.textContent = CSS
      document.head.appendChild(style)
      return () => { style.remove() }
    }

    function NoteIcon() {
      // 原生风格：16x16、1.3px 线性描边、currentColor（与 Full access 盾牌图标同风格）
      return React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', {
          d: 'M3.5 1.5H10.5L13.5 4.5V14.5H3.5V1.5Z',
          stroke: 'currentColor',
          strokeWidth: '1.31831',
          strokeLinejoin: 'round',
        }),
        React.createElement('path', { d: 'M10.5 1.5V4.5H13.5', stroke: 'currentColor', strokeWidth: '1.31831', strokeLinejoin: 'round' }),
        React.createElement('path', { d: 'M5.5 6.5H10.5M5.5 9H10.5M5.5 11.5H8.5', stroke: 'currentColor', strokeWidth: '1.31831', strokeLinecap: 'round' }),
      )
    }


    // ===== 轻量 Markdown 渲染（安全：先转义 HTML，再解析标记）=====
    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    }
    function inlineMd(s) {
      let r = esc(s)
      // 行内代码
      r = r.replace(/`([^`\n]+)`/g, '<code>$1</code>')
      // 粗体 **x**
      r = r.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      // 斜体 *x*
      r = r.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      // 链接 [text](url)
      r = r.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      return r
    }
    function renderMarkdown(src) {
      if (!src) return ''
      const lines = src.replace(/\r\n/g, '\n').split('\n')
      const out = []
      let i = 0
      let inCode = false
      let codeBuf = []
      let listType = null
      function closeList() {
        if (listType) { out.push('</' + listType + '>'); listType = null }
      }
      while (i < lines.length) {
        const line = lines[i]
        const trim = line.trim()
        // 代码块 ``` 
        if (trim.startsWith('```')) {
          if (!inCode) { closeList(); inCode = true; codeBuf = []; i++; continue }
          out.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>')
          inCode = false; codeBuf = []; i++; continue
        }
        if (inCode) { codeBuf.push(line); i++; continue }
        // 空行
        if (!trim) { closeList(); out.push(''); i++; continue }
        // 标题
        const h = /^(#{1,4})\s+(.+)$/.exec(trim)
        if (h) { closeList(); const n = h[1].length; out.push('<h' + n + '>' + inlineMd(h[2]) + '</h' + n + '>'); i++; continue }
        // 分割线
        if (/^([-*_])\1{2,}$/.test(trim)) { closeList(); out.push('<hr>'); i++; continue }
        // 引用
        if (trim.startsWith('>')) { closeList(); out.push('<blockquote>' + inlineMd(trim.slice(1).trim()) + '</blockquote>'); i++; continue }
        // 无序列表
        const ul = /^[-*+]\s+(.+)$/.exec(trim)
        if (ul) { if (listType !== 'ul') { closeList(); listType = 'ul'; out.push('<ul>') } out.push('<li>' + inlineMd(ul[1]) + '</li>'); i++; continue }
        // 有序列表
        const ol = /^\d+\.\s+(.+)$/.exec(trim)
        if (ol) { if (listType !== 'ol') { closeList(); listType = 'ol'; out.push('<ol>') } out.push('<li>' + inlineMd(ol[1]) + '</li>'); i++; continue }
        // 普通段落
        closeList()
        out.push('<p>' + inlineMd(line) + '</p>')
        i++
      }
      if (inCode) out.push('<pre><code>' + esc(codeBuf.join('\n')) + '</code></pre>')
      closeList()
      return out.join('\n')
    }

    function StickyNoteApp(props) {
      const rpc = props.rpc
      const inputActions = props.inputActions
      const useInput = props.useInput
      const [open, setOpen] = React.useState(false)
      const [view, setView] = React.useState('edit')
      const [preview, setPreview] = React.useState(false)
      const [kindOpen, setKindOpen] = React.useState(false)
      // 正在查看的历史便签 { kind, name, content }
      const [viewNote, setViewNote] = React.useState(null)
      const [kind, setKind] = React.useState('点子')
      const [text, setText] = React.useState('')
      const [status, setStatus] = React.useState('')
      const [list, setList] = React.useState(null)
      const fabRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const textareaRef = React.useRef(null)
      const textRef = React.useRef('')
      const kindRef = React.useRef('点子')






      // 点击面板/按钮以外的空白区域 → 关闭便签
      React.useEffect(() => {
        if (!open) return
        function onDocMouseDown(e) {
          const t = e.target
          if (panelRef.current && panelRef.current.contains(t)) return
          if (fabRef.current && fabRef.current.contains(t)) return
          setOpen(false)
        }
        document.addEventListener('mousedown', onDocMouseDown)
        return () => document.removeEventListener('mousedown', onDocMouseDown)
      }, [open])

      function saveNow() {
        const content = textRef.current
        if (!content.trim()) { setStatus('空，未保存'); return }
        rpc('save', { kind: kindRef.current, content }).then(() => {
          setStatus('✓ ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }) + ' (Ctrl+S)')
        }).catch(() => setStatus('保存失败'))
      }

      function onText(e) {
        const v = e.target.value
        setText(v)
        textRef.current = v
      }

      // 在选区前后包裹 Markdown 语法（无选区时插入占位并在中间放置光标）
      function wrapSelection(prefix, suffix, placeholder) {
        const el = textareaRef.current
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        const sel = textRef.current.slice(start, end)
        const content = sel || placeholder
        const before = textRef.current.slice(0, start)
        const after = textRef.current.slice(end)
        const next = before + prefix + content + suffix + after
        setText(next)
        textRef.current = next
        // 光标：选中刚包裹的内容（或占位词）
        const newStart = start + prefix.length
        const newEnd = newStart + content.length
        requestAnimationFrame(() => {
          el.focus()
          el.setSelectionRange(newStart, newEnd)
        })
      }
      // 在选区每行前加前缀（列表/引用/标题）
      function prefixLines(prefix, placeholder) {
        const el = textareaRef.current
        if (!el) return
        const start = el.selectionStart
        const end = el.selectionEnd
        let sel = textRef.current.slice(start, end)
        if (!sel.trim()) sel = placeholder
        const lines = sel.split('\n')
        const prefixed = lines.map((ln) => prefix + ln).join('\n')
        const before = textRef.current.slice(0, start)
        const after = textRef.current.slice(end)
        const next = before + prefixed + after
        setText(next)
        textRef.current = next
        const newStart = start + prefix.length
        const newEnd = newStart + prefixed.length
        requestAnimationFrame(() => {
          el.focus()
          el.setSelectionRange(newStart, newEnd)
        })
      }

      function onKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
          const key = e.key.toLowerCase()
          // 先判断 Shift 组合（避免被同名无 Shift 分支抢先）
          if (e.shiftKey) {
            // Ctrl+Shift+1/2/3 切换类别（点子/感想/TODO）
            if (e.code === 'Digit1' || e.code === 'Numpad1') { e.preventDefault(); setKindShortcut('点子'); return }
            if (e.code === 'Digit2' || e.code === 'Numpad2') { e.preventDefault(); setKindShortcut('感想'); return }
            if (e.code === 'Digit3' || e.code === 'Numpad3') { e.preventDefault(); setKindShortcut('TODO'); return }
            // Ctrl+Shift+V 预览切换
            if (key === 'v') {
              e.preventDefault()
              if (view !== 'list') {
                setPreview(!preview)
                setStatus(preview ? '编辑' : '预览')
              }
              return
            }
            // Ctrl+Shift+B 引用
            if (key === 'b') { e.preventDefault(); prefixLines('> ', '引用内容'); return }
            // Ctrl+Shift+L 无序列表
            if (key === 'l') { e.preventDefault(); prefixLines('- ', '列表项'); return }
            // Ctrl+Shift+N 有序列表
            if (key === 'n') { e.preventDefault(); prefixLines('1. ', '列表项'); return }
            // Ctrl+Shift+H 标题（##）
            if (key === 'h') { e.preventDefault(); prefixLines('## ', '标题'); return }
            // Ctrl+Shift+D 分割线
            if (key === 'd') { e.preventDefault(); wrapSelection('\n\n---\n\n', '', '分割线'); return }
            return
          }
          // Ctrl+S 保存
          if (key === 's') { e.preventDefault(); saveNow(); return }
          // Ctrl+B 粗体
          if (key === 'b') { e.preventDefault(); wrapSelection('**', '**', '加粗文本'); return }
          // Ctrl+I 斜体
          if (key === 'i') { e.preventDefault(); wrapSelection('*', '*', '斜体文本'); return }
          // Ctrl+K 链接
          if (key === 'k') { e.preventDefault(); wrapSelection('[', '](https://)', '链接文字'); return }
          // Ctrl+E 行内代码（E 便于输入）
          if (key === 'e') { e.preventDefault(); wrapSelection('`', '`', '代码'); return }
        }
      }
      function pickKind(k) {
        if (k !== kindRef.current) {
          setKind(k)
          kindRef.current = k
          // 切换类别：清空草稿，触发新建文件
          rpc('new', {}).then(() => {
            setText('')
            textRef.current = ''
            setStatus('已切换 ' + k)
          }).catch(() => {})
        }
      }
      // 快捷键切类别：同类别也给提示，不同类别走新建逻辑
      function setKindShortcut(k) {
        if (k === kindRef.current) {
          setStatus('当前类别：' + k)
          return
        }
        pickKind(k)
      }
      function openList() {
        if (view === 'list') {
          // 再点一次：关闭历史，回编辑
          setView('edit')
          return
        }
        rpc('list', {}).then((v) => setList(v || null)).catch(() => {})
        setView('list')
      }
      function doArchive(item) {
        rpc('archive', { kind: item.kind, name: item.name }).then(() => {
          rpc('list', {}).then((v) => setList(v || null)).catch(() => {})
        }).catch(() => {})
      }
      function openNote(item) {
        rpc('read', { kind: item.kind, name: item.name }).then((v) => {
          if (v) setViewNote({ kind: item.kind, name: item.name, content: v.content || '' })
        }).catch(() => setStatus('读取失败'))
      }
      function newNote() {
        rpc('new', {}).then(() => {
          setText('')
          textRef.current = ''
          setStatus('新便签')
        }).catch(() => {})
      }

      const fab = React.createElement('button', {
        ref: fabRef,
        className: 'sn-fab',
        title: '便签',
        onClick: () => setOpen(!open),
      }, React.createElement(NoteIcon, null))

      if (!open) return fab

      let body
      if (viewNote) {
        // 查看历史便签（只读）
        body = React.createElement('textarea', {
          className: 'sn-text',
          readOnly: true,
          value: viewNote.content,
        })
      } else if (view === 'list') {
        const cats = (list && list.categories) ? list.categories : null
        const rows = []
        if (cats) {
          for (const catName of ['点子', '感想', 'TODO']) {
            const items = cats[catName] || []
            rows.push(React.createElement('div', { key: catName, className: 'sn-cat' },
              React.createElement('div', { className: 'sn-cat-name' }, catName),
              items.length === 0
                ? React.createElement('div', { className: 'sn-empty' }, '暂无')
                : items.map((it) => React.createElement('div', {
                    key: it.name,
                    className: 'sn-row',
                    title: '点击查看',
                    onClick: () => openNote({ kind: catName, name: it.name }),
                  },
                    React.createElement('span', { className: 'sn-time', title: it.name }, it.timeText || ''),
                    React.createElement('span', { className: 'sn-prev', title: it.preview }, it.preview || '(空)'),
                    React.createElement('button', { className: 'sn-arch', onClick: (e) => { e.stopPropagation(); doArchive({ kind: catName, name: it.name }) } }, '归档'),
                  )),
            ))
          }
        }
        body = React.createElement('div', { className: 'sn-list' }, rows.length ? rows : React.createElement('div', { className: 'sn-empty' }, '加载中…'))
      } else if (preview) {
        // Markdown 预览：内容先转义再渲染，避免 XSS
        body = React.createElement('div', {
          className: 'sn-md',
          dangerouslySetInnerHTML: { __html: renderMarkdown(text) },
        })
      } else {
        body = React.createElement('textarea', {
          ref: textareaRef,
          className: 'sn-text',
          value: text,
          onChange: onText,
          onKeyDown: onKeyDown,
        })
      }

      const panel = React.createElement('div', {
        ref: panelRef,
        className: 'sn-panel',
        style: { right: '16px', bottom: '68px', width: '280px', height: '330px' },
      },
        // 头部：左 [+新建] [便签图标 标题 状态]，右 [👁预览] [✕]
        React.createElement('div', { className: 'sn-head' },
          React.createElement('span', null,
            viewNote ? null : React.createElement('button', { className: 'sn-plus', title: '新建便签', onClick: newNote }, '+'),
            React.createElement(NoteIcon, null),
            viewNote ? '查看' : (view === 'list' ? '历史便签' : '便签'),
            status ? React.createElement('span', { className: 'sn-headstatus' }, status) : null,
          ),
          React.createElement('span', { className: 'sn-head-right' },
            viewNote ? React.createElement('button', { className: 'sn-back-text', onClick: () => setViewNote(null) }, '← 返回列表')
              : (view === 'edit' ? React.createElement('button', {
                  className: 'sn-mini' + (preview ? ' sn-on' : ''),
                  title: preview ? '返回编辑' : 'Markdown 预览',
                  onClick: () => setPreview(!preview),
                }, preview ? '✏' : '👁') : null),
            view === 'list' && !viewNote
              ? React.createElement('button', { className: 'sn-back-text', onClick: () => setView('edit') }, '← 返回当前')
              : (viewNote ? null : React.createElement('button', { className: 'sn-x', title: '关闭', onClick: () => setOpen(false) }, '✕')),
          ),
        ),
        React.createElement('div', { className: 'sn-body' }, body),
        React.createElement('div', { className: 'sn-bar' },
          React.createElement('div', { className: 'sn-group' },
            React.createElement('button', {
              className: 'sn-iconbtn sn-hist' + (view === 'list' ? ' sn-active' : ''),
              title: '历史便签',
              onClick: openList,
            }, '历史便签'),
          ),
          React.createElement('div', { className: 'sn-group' },
            React.createElement('div', { className: 'sn-badge-wrap' },
              React.createElement('button', {
                className: 'sn-badge',
                onClick: () => setKindOpen(!kindOpen),
              },
                kind,
                React.createElement('span', { className: 'sn-caret' }, '▾'),
              ),
              kindOpen ? React.createElement('div', { className: 'sn-kind-pop' },
                ['点子', '感想', 'TODO'].map((k) => React.createElement('button', {
                  key: k,
                  className: 'sn-kind-opt' + (kind === k ? ' sn-on' : ''),
                  onClick: () => { pickKind(k); setKindOpen(false) },
                }, k)),
              ) : null,
            ),
          ),
        ),
      )

      return React.createElement(React.Fragment, null, fab, panel)
    }



    function apply(ctx) {
      const disposeStyle = installStyles()
      const connection = ctx.get('connection')
      if (connection === undefined) return
      const rpc = (endpoint, payload) => connection.rpc.call(CHANNEL, endpoint, payload || {}).then((result) => {
        if (!result.ok) throw new Error((result.error && (result.error.details || result.error.code)) || 'rpc failed')
        return result.value
      })
      const slots = ctx.get('slots')
      if (slots === undefined) return
      slots.inject('conversation.input.left', () => slots.register(
        { name: 'conversation.input.left', id: 'sticky-note', order: 20 },
        (zoneProps) => React.createElement(StickyNoteApp, {
          rpc,
          inputActions: (zoneProps && zoneProps.inputActions) || null,
          useInput: (zoneProps && zoneProps.useInput) || null,
        }),
      ))
      ctx.effect(() => disposeStyle, 'dsh-sticky-note: styles')
    }

    exports.apply = apply
    exports.StickyNoteApp = StickyNoteApp
    return module.exports
  },
})
