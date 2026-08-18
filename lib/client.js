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
  /* 不带任何 margin：slot 容器是 display:contents，本按钮直接成为宿主输入栏
     .tools flex 容器的子项，间距由宿主 gap:16px 统一分配——与其他插件图标
     （如语音按钮）天然等距，插件增删都自动适配 */
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
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.08));
  border-radius: 18px;
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.18),
    0 4px 14px rgba(0, 0, 0, 0.1);
  font-family: Inter, var(--dsw-font-family), system-ui, 'Segoe UI', sans-serif;
  font-size: 13px;
  animation: sn-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}
/* 深色模式：玻璃面板换深色底，阴影加深（半透明底没有现成 alias token） */
body[data-ds-dark-theme] .sn-panel {
  background: rgba(27, 27, 28, 0.92);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.55),
    0 4px 14px rgba(0, 0, 0, 0.45);
}
/* 自定义伸缩手柄：左边缘、上边缘、左上角 */
.sn-rz-left {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 20;
}
.sn-rz-top {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  z-index: 20;
}
.sn-rz-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 21;
}
.sn-rz-corner::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 7px;
  height: 7px;
  border-top: 2px solid var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.35));
  border-left: 2px solid var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.35));
  border-top-left-radius: 3px;
  opacity: 0;
  transition: opacity 0.12s ease;
}
.sn-panel:hover .sn-rz-corner::after { opacity: 0.7; }
.sn-rz-corner:hover::after { opacity: 1 !important; }
.sn-rz-left:hover, .sn-rz-top:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(0, 0, 0, 0.06)); border-radius: 3px; }
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
  background: var(--dsw-specific-input-major, #fff);
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
  background: var(--dsw-specific-input-major, #fff);
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
}
.sn-hist:hover:not(.sn-active) { background: var(--dsw-alias-interactive-bg-hover-accent, #f5f9ff); border-color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-hist.sn-active { background: var(--dsw-alias-button-info-fill, #3b82f6); border-color: transparent; color: #fff; }
.sn-openfolder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--dsw-specific-input-major, #fff);
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  color: var(--dsw-alias-label-secondary, #4a4a55);
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s ease;
}
.sn-openfolder:hover { background: var(--dsw-alias-interactive-bg-hover-accent, #f5f9ff); border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-openfolder svg { flex: none; }
.sn-back-text {
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: var(--dsw-specific-input-major, #fff);
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
  background: var(--dsw-alias-interactive-bg-hover-accent, #f5f9ff);
}
.sn-help {
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: var(--dsw-specific-input-major, #fff);
  color: var(--dsw-alias-label-secondary, #6b6b76);
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.12s ease;
}
.sn-help:hover { border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-help-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--dsw-alias-label-primary, #2b2b33);
}
.sn-help-body p { margin: 0.45em 0; }
.sn-help-strong {
  font-weight: 700;
  color: var(--dsw-alias-label-primary, #2b2b33);
  word-break: break-all;
}
.sn-help-dim { color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45)); font-size: 12px; }
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
.sn-bar-3col { position: relative; }
.sn-bar-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
.sn-send {
  border: none;
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  border-radius: 999px;
  cursor: pointer;
  padding: 5px 22px;
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.5px;
  transition: background 0.12s ease, transform 0.1s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.sn-send:hover { background: var(--dsw-alias-button-info-hover, #2563eb); transform: translateY(-1px); }
.sn-send:active { transform: translateY(0) scale(0.97); }
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
.sn-list-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 2px 6px;
  border-bottom: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.06));
  margin-bottom: 4px;
}
.sn-list-tip {
  flex: 1;
  text-align: left;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.35));
  letter-spacing: 0.3px;
}
.sn-toggle-all {
  border: none;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
  color: var(--dsw-alias-label-secondary, #4a4a55);
  border-radius: 7px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 11.5px;
  transition: all 0.12s ease;
}
.sn-toggle-all:hover { background: var(--dsw-alias-button-info-fill, #3b82f6); color: #fff; }
.sn-toggle-all.sn-on { background: var(--dsw-alias-button-info-fill, #3b82f6); color: #fff; font-weight: 600; }
.sn-list-actions { display: flex; align-items: center; gap: 6px; flex: none; }
.sn-pin {
  flex: none;
  display: flex;
  align-items: center;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.25));
}
.sn-pin.sn-on { color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-retain-row { cursor: pointer; }
.sn-retain-row:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.sn-retained {
  background: var(--dsw-alias-interactive-bg-hover, rgba(59, 130, 246, 0.08)) !important;
  outline: 1px solid var(--dsw-alias-button-info-fill, #3b82f6);
  outline-offset: -1px;
}
.sn-retain-tag {
  flex: none;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--dsw-alias-button-info-fill, #3b82f6);
  border: 1px solid var(--dsw-alias-button-info-fill, #3b82f6);
  border-radius: 999px;
  padding: 1px 7px;
  opacity: 0;
  transition: opacity 0.12s ease;
}
.sn-retained .sn-retain-tag { opacity: 1; }
.sn-cat { margin-top: 6px; }
.sn-cat-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  border: none;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
  color: var(--dsw-alias-label-primary, #2b2b33);
  border-radius: 8px;
  cursor: pointer;
  padding: 6px 10px;
  font-size: 12.5px;
  font-weight: 700;
  text-align: left;
  transition: background 0.12s ease;
}
.sn-cat-head:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(0, 0, 0, 0.09)); }
.sn-cat-caret {
  font-size: 10px;
  color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.4));
  transition: transform 0.15s ease;
  display: inline-block;
}
.sn-cat-caret.sn-open { transform: rotate(90deg); }
.sn-cat-name { flex: 1; }
.sn-cat-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--dsw-alias-label-tertiary, #888);
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  border-radius: 999px;
  padding: 1px 8px;
}
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
  background: var(--dsw-alias-interactive-bg-hover-danger, rgba(255, 80, 80, 0.12));
  color: var(--dsw-alias-state-error-primary, #d54545);
  border-radius: 7px;
  cursor: pointer;
  padding: 3px 9px;
  font-size: 11px;
  flex-shrink: 0;
}
.sn-row:hover .sn-arch { opacity: 1; }
.sn-arch:hover { background: rgba(223, 82, 82, 0.22); color: var(--dsw-alias-state-error-secondary, #b03a3a); }
.sn-restore {
  opacity: 0;
  transition: opacity 0.12s ease;
  border: none;
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06));
  color: var(--dsw-alias-button-info-fill, #3b82f6);
  border-radius: 7px;
  cursor: pointer;
  padding: 3px 9px;
  font-size: 11px;
  flex-shrink: 0;
}
.sn-row:hover .sn-restore { opacity: 1; }
.sn-restore:hover { background: var(--dsw-alias-interactive-bg-hover-accent, rgba(59, 130, 246, 0.14)); }
/* 单击记录后：归档 → 发送 的切换动画 */
.sn-row.sn-pending { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05)); }
.sn-sendrow {
  opacity: 1;
  border: none;
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  border-radius: 7px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  animation: sn-send-in 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.35);
}
.sn-sendrow:hover { background: var(--dsw-alias-button-info-hover, #2563eb); transform: translateY(-1px); }
@keyframes sn-send-in {
  0% { opacity: 0; transform: scale(0.6) translateY(4px); }
  60% { transform: scale(1.08) translateY(-1px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.sn-empty { color: var(--dsw-alias-label-tertiary, rgba(43, 43, 51, 0.4)); font-size: 12px; padding: 6px 8px; }
.sn-set-card {
  list-style: none;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  overflow: hidden;
}
.sn-set-header {
  width: 100%;
  border: 0;
  background: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  font: inherit;
  border-radius: 12px;
}
.sn-set-headtext {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sn-set-title {
  font-size: 15px;
  line-height: 1.4;
  font-weight: 600;
}
.sn-set-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.sn-set-badge {
  flex: none;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
  border-radius: 999px;
  padding: 2px 10px;
}
.sn-set-caret {
  flex: none;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
.sn-set-body {
  border-top: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.08));
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sn-set-label {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary);
}
.sn-set-row { display: flex; gap: 8px; }
.sn-set-inputwrap {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.sn-set-inputwrap .sn-set-input { flex: 1; padding-right: 34px; }
.sn-set-pick {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  transition: all 0.12s ease;
}
.sn-set-pick:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(0, 0, 0, 0.08)); color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-set-pick:active { transform: translateY(-50%) scale(0.92); }
.sn-set-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.16));
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
  color: var(--dsw-alias-label-primary);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 12.5px;
  outline: none;
}
.sn-set-input:focus { border-color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-set-save {
  border: none;
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  padding: 7px 16px;
  font-size: 12.5px;
  font-weight: 600;
  flex: none;
  transition: background 0.12s ease;
}
.sn-set-save:hover { background: var(--dsw-alias-button-info-hover, #2563eb); }
.sn-set-tip { font-size: 11.5px; color: var(--dsw-alias-label-tertiary); line-height: 1.6; }
.sn-set-modes { display: flex; gap: 8px; }
.sn-set-mode {
  flex: 1;
  border: 1px solid var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.14));
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  border-radius: 8px;
  cursor: pointer;
  padding: 8px 10px;
  font-size: 12.5px;
  text-align: center;
  transition: all 0.12s ease;
}
.sn-set-mode:hover { border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-label-primary); }
.sn-set-mode.sn-on {
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
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
.sn-md li.sn-task { list-style: none; margin-left: -1.2em; display: flex; align-items: baseline; gap: 6px; }
.sn-md li.sn-task > input { accent-color: var(--dsw-alias-button-info-fill, #3b82f6); }
.sn-md table { border-collapse: collapse; margin: 0.5em 0; width: 100%; font-size: 0.95em; }
.sn-md th, .sn-md td { border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12)); padding: 4px 9px; text-align: left; }
.sn-md th { background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04)); font-weight: 700; }
.sn-md img { max-width: 100%; border-radius: 6px; }
.sn-md del { opacity: 0.7; }
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
.sn-note-wrap { display: flex; flex-direction: column; min-height: 0; flex: 1; overflow: hidden; }
.sn-note-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.06));
  background: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.03));
  flex: none;
}
.sn-note-kind {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  border-radius: 999px;
  padding: 2px 10px;
  flex: none;
}
.sn-note-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #555);
}
.sn-send-btn {
  flex: none;
  border: none;
  background: var(--dsw-alias-button-info-fill, #3b82f6);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.12s ease;
}
.sn-send-btn:hover { background: var(--dsw-alias-button-info-hover, #2563eb); }
.sn-note-actions { display: flex; align-items: center; gap: 6px; flex: none; }
.sn-note-edit {
  flex: none;
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: var(--dsw-specific-input-major, #fff);
  color: var(--dsw-alias-label-secondary, #6b6b76);
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.12s ease;
}
.sn-note-edit:hover { border-color: var(--dsw-alias-button-info-fill, #3b82f6); color: var(--dsw-alias-button-info-fill, #3b82f6); background: var(--dsw-alias-interactive-bg-hover-accent, #f5f9ff); }
.sn-note-cancel {
  flex: none;
  border: 1px solid var(--dsw-alias-border-l2-darkmode-thin, rgba(0, 0, 0, 0.12));
  background: var(--dsw-specific-input-major, #fff);
  color: var(--dsw-alias-label-secondary, #6b6b76);
  border-radius: 8px;
  cursor: pointer;
  padding: 4px 12px;
  font-size: 12px;
  transition: all 0.12s ease;
}
.sn-note-cancel:hover { border-color: rgba(223, 82, 82, 0.5); color: var(--dsw-alias-state-error-primary, #d54545); }
.sn-note-textarea { min-height: 120px; }
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

    // 固定（保留）图标：斜插的针
    function PinIcon() {
      return React.createElement('svg', { width: '12', height: '12', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', {
          d: 'M9.5 2.5L13.5 6.5L12 7.5L13 9.5L11 11.5L9 10.5L8 12L6.5 10.5L3 14L2 13L5.5 9.5L4 8L5.5 7L4.5 5L6.5 3L8.5 4L9.5 2.5Z',
          stroke: 'currentColor',
          strokeWidth: '1.1',
          strokeLinejoin: 'round',
        }),
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
      // 图片 ![alt](url)（先于链接处理）
      r = r.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      // 链接 [text](url)
      r = r.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
      // 粗体 **x**
      r = r.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      // 斜体 *x*
      r = r.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      // 删除线 ~~x~~
      r = r.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
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
        // 表格：当前行是 |a|b| 且下一行是 |---|---| 分隔行
        const isTableRow = (l) => /^\|.*\|$/.test(l.trim())
        const isTableSep = (l) => /^\|[\s:|-]+\|$/.test(l.trim())
        if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
          closeList()
          const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => inlineMd(c.trim()))
          const head = cells(line)
          let j = i + 2
          const bodyRows = []
          while (j < lines.length && isTableRow(lines[j])) {
            bodyRows.push(cells(lines[j]))
            j++
          }
          let t = '<table><thead><tr>' + head.map((c) => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'
          for (const r of bodyRows) t += '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>'
          t += '</tbody></table>'
          out.push(t)
          i = j
          continue
        }
        // 标题
        const h = /^(#{1,4})\s+(.+)$/.exec(trim)
        if (h) { closeList(); const n = h[1].length; out.push('<h' + n + '>' + inlineMd(h[2]) + '</h' + n + '>'); i++; continue }
        // 分割线
        if (/^([-*_])\1{2,}$/.test(trim)) { closeList(); out.push('<hr>'); i++; continue }
        // 引用
        if (trim.startsWith('>')) { closeList(); out.push('<blockquote>' + inlineMd(trim.slice(1).trim()) + '</blockquote>'); i++; continue }
        // 无序列表（含任务列表 [x] / [ ]）
        const ul = /^[-*+]\s+(.+)$/.exec(trim)
        if (ul) {
          if (listType !== 'ul') { closeList(); listType = 'ul'; out.push('<ul>') }
          const task = /^\[( |x|X)\]\s+(.*)$/.exec(ul[1])
          if (task) {
            out.push('<li class="sn-task"><input type="checkbox" disabled' + (task[1] !== ' ' ? ' checked' : '') + '><span>' + inlineMd(task[2]) + '</span></li>')
          } else {
            out.push('<li>' + inlineMd(ul[1]) + '</li>')
          }
          i++; continue
        }
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
      // 读当前输入框草稿（append 模式用）
      const inputDraft = useInput ? useInput((s) => (s && s.draft) || '') : ''
      const [open, setOpen] = React.useState(false)
      const [view, setView] = React.useState('edit')
      const [preview, setPreview] = React.useState(false)
      const [kindOpen, setKindOpen] = React.useState(false)
      // 历史便签：各类别展开状态（默认第一类「点子」展开）
      const [openCats, setOpenCats] = React.useState({ '点子': true, '感想': false, 'TODO': false, '归档': false })
      // 查看模式：'inline' 便签内查看 / 'file' 打开文件
      const [viewMode, setViewMode] = React.useState('inline')
      // 自动保存间隔（秒，0=不自动保存）
      const [saveInterval, setSaveInterval] = React.useState(10)
      // 自动清除（天，0=永久）
      const [clearAfter, setClearAfter] = React.useState(7)
      // 默认类别
      const [defaultKind, setDefaultKind] = React.useState('点子')
      // 发送模式：send / append
      const [sendMode, setSendMode] = React.useState('send')
      // 保留视图（选择哪些便签不被自动清除）
      const [retainMode, setRetainMode] = React.useState(false)
      // 帮助弹窗
      const [helpOpen, setHelpOpen] = React.useState(false)
      // 帮助视图使用的实时配置（打开时拉取，保证显示最新设置）
      const [helpCfg, setHelpCfg] = React.useState(null)
      // 正在查看的历史便签 { kind, name, content }
      const [viewNote, setViewNote] = React.useState(null)
      // 查看视图是否处于编辑态
      const [viewNoteEditing, setViewNoteEditing] = React.useState(false)
      const viewNoteTextRef = React.useRef('')
      // 待发送条目：单击记录后，该行归档按钮临时变成发送按钮（3 秒后恢复）
      const [pendingSend, setPendingSend] = React.useState(null)
      const pendingTimerRef = React.useRef(null)
      const [kind, setKind] = React.useState('点子')
      const [text, setText] = React.useState('')
      const [status, setStatus] = React.useState('')
      const [list, setList] = React.useState(null)
      const [root, setRoot] = React.useState('')
      const [pos, setPos] = React.useState({ right: 16, bottom: 68 })
      const [size, setSize] = React.useState(() => {
        try {
          const raw = localStorage.getItem('sn-panel-size')
          if (raw) {
            const j = JSON.parse(raw)
            if (j && typeof j.width === 'number' && typeof j.height === 'number') return { width: j.width, height: j.height }
          }
        } catch (e) { /* ignore */ }
        return { width: 280, height: 330 }
      })
      const fabRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const textareaRef = React.useRef(null)
      const textRef = React.useRef('')
      const kindRef = React.useRef('点子')
      const timerRef = React.useRef(null)
      const saveTimerRef = React.useRef(null)
      const sizeTimerRef = React.useRef(null)
      const dragRef = React.useRef(null)

      function measurePanel() {
        if (!fabRef.current) return
        const r = fabRef.current.getBoundingClientRect()
        const vw = window.innerWidth
        // 面板右下角对齐按钮右下角，向上弹出
        const right = Math.max(4, vw - r.right + 4)
        const bottom = Math.max(4, (window.innerHeight - r.top) + 8)
        setPos({ right, bottom })
      }

      // 保存面板尺寸到 localStorage（防抖）
      function persistSize(w, h) {
        if (sizeTimerRef.current) clearTimeout(sizeTimerRef.current)
        sizeTimerRef.current = setTimeout(() => {
          try {
            localStorage.setItem('sn-panel-size', JSON.stringify({ width: w, height: h }))
          } catch (e) { /* ignore */ }
        }, 400)
      }

      // 自定义伸缩：手柄在 左边缘/上边缘/左上角，面板右下角锚定
      // 向左拖 → 宽度增加；向上拖 → 高度增加
      function onDragStart(e, mode) {
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = {
          mode, // 'left' | 'top' | 'corner'
          startX: e.clientX,
          startY: e.clientY,
          startW: size.width,
          startH: size.height,
        }
      }
      React.useEffect(() => {
        function onMove(e) {
          const d = dragRef.current
          if (!d) return
          const dx = d.startX - e.clientX // 向左为正 → 变宽
          const dy = d.startY - e.clientY // 向上为正 → 变高
          let w = d.startW
          let h = d.startH
          if (d.mode === 'left' || d.mode === 'corner') w = Math.max(240, d.startW + dx)
          if (d.mode === 'top' || d.mode === 'corner') h = Math.max(180, d.startH + dy)
          setSize({ width: w, height: h })
          persistSize(w, h)
        }
        function onUp() {
          dragRef.current = null
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
        }
      }, [])

      React.useEffect(() => {
        rpc('config', {}).then((v) => {
          if (!v) return
          if (v.root) setRoot(v.root)
          if (v.viewMode) setViewMode(v.viewMode)
          if (typeof v.saveInterval === 'number') setSaveInterval(v.saveInterval)
          if (typeof v.clearAfter === 'number') setClearAfter(v.clearAfter)
          if (v.defaultKind && ['点子', '感想', 'TODO'].includes(v.defaultKind)) {
            setKind(v.defaultKind)
            kindRef.current = v.defaultKind
          }
          if (v.sendMode) setSendMode(v.sendMode)
        }).catch(() => {})
        return () => {
          if (timerRef.current) clearTimeout(timerRef.current)
          if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
          if (saveTimerRef.current) clearInterval(saveTimerRef.current)
        }
      }, [])

      // 帮助视图打开时实时拉取最新配置（设置改动后立即反映）
      React.useEffect(() => {
        if (!helpOpen) return
        rpc('config', {}).then((v) => {
          if (v) setHelpCfg(v)
        }).catch(() => {})
      }, [helpOpen])

      // 查看视图打开期间轮询文件内容（5 秒），外部编辑器改了文件后视图自动跟上
      React.useEffect(() => {
        if (!viewNote || viewNoteEditing) return
        const timer = setInterval(() => {
          rpc('read', { kind: viewNote.kind, name: viewNote.name }).then((v) => {
            if (v && typeof v.content === 'string' && v.content !== viewNote.content) {
              setViewNote((prev) => (prev && prev.kind === viewNote.kind && prev.name === viewNote.name ? { ...prev, content: v.content } : prev))
            }
          }).catch(() => {})
        }, 5000)
        return () => clearInterval(timer)
      }, [viewNote, viewNoteEditing])

      // 自动保存定时器：按配置间隔定时保存当前内容（面板关闭或间隔 0 = 不跑，避免后台常驻写盘）
      React.useEffect(() => {
        if (!open || saveInterval <= 0) {
          if (saveTimerRef.current) clearInterval(saveTimerRef.current)
          return
        }
        if (saveTimerRef.current) clearInterval(saveTimerRef.current)
        saveTimerRef.current = setInterval(() => {
          const content = textRef.current
          if (content && content.trim()) {
            rpc('save', { kind: kindRef.current, content }).catch(() => {})
          }
        }, saveInterval * 1000)
        return () => {
          if (saveTimerRef.current) clearInterval(saveTimerRef.current)
        }
      }, [open, saveInterval])

      React.useEffect(() => {
        if (!open) return
        measurePanel()
        const t = setTimeout(measurePanel, 60)
        return () => clearTimeout(t)
      }, [open, view])

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

      function scheduleSave(payload) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          rpc('save', payload).then(() => {
            setStatus('✓ ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }))
          }).catch(() => setStatus('保存失败'))
        }, 700)
      }

      // 内容被清空：删除当前草稿文件（避免残留旧内容）
      function scheduleClear() {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
          rpc('clear', {}).catch(() => {})
        }, 700)
      }

      function saveNow() {
        if (timerRef.current) clearTimeout(timerRef.current)
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
        if (v.trim()) {
          scheduleSave({ kind: kindRef.current, content: v })
        } else {
          // 全部清空：删除草稿文件，之后重新输入会新建
          scheduleClear()
        }
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
        if (next.trim()) scheduleSave({ kind: kindRef.current, content: next })
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
        if (next.trim()) scheduleSave({ kind: kindRef.current, content: next })
      }

      function onKeyDown(e) {
        // Esc 层层退出：编辑帮助/查看 → 历史 → 编辑 → 关闭面板
        if (e.key === 'Escape') {
          e.preventDefault()
          if (helpOpen) { setHelpOpen(false); return }
          if (viewNote) { setViewNote(null); return }
          if (view === 'list') { setView('edit'); return }
          if (kindOpen) { setKindOpen(false); return }
          if (preview) { setPreview(false); return }
          setOpen(false)
          return
        }
        // Tab / Shift+Tab：选区每行缩进/反缩进（编辑态文本框内）
        if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey && view === 'edit' && !preview) {
          e.preventDefault()
          const el = textareaRef.current
          if (!el) return
          const start = el.selectionStart
          const end = el.selectionEnd
          const before = textRef.current.slice(0, start)
          const sel = textRef.current.slice(start, end)
          const after = textRef.current.slice(end)
          let next, newStart, newEnd
          if (e.shiftKey) {
            // 每行去掉至多一个两格缩进
            const dedented = sel.replace(/^ {1,2}/gm, '')
            next = before + dedented + after
            newStart = start
            newEnd = start + dedented.length
          } else {
            next = before + '  ' + sel + after
            newStart = start + 2
            newEnd = end + 2
          }
          setText(next)
          textRef.current = next
          requestAnimationFrame(() => { el.focus(); el.setSelectionRange(newStart, newEnd) })
          if (next.trim()) scheduleSave({ kind: kindRef.current, content: next })
          return
        }
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
            // Ctrl+Shift+X 删除线
            if (key === 'x') { e.preventDefault(); wrapSelection('~~', '~~', '删除文本'); return }
            // Ctrl+Shift+T 任务列表项
            if (key === 't') { e.preventDefault(); prefixLines('- [ ] ', '任务'); return }
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
          // Ctrl+T 表格骨架（Ctrl+Shift+T 已被任务列表占用）
          if (key === 't') {
            e.preventDefault()
            wrapSelection('\n\n| 列1 | 列2 |\n| --- | --- |\n| 内容 | 内容 |\n\n', '', '表格')
            return
          }
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
      // 从归档恢复到原类别
      function doRestore(item) {
        rpc('restore', { name: item.name }).then(() => {
          setStatus('已恢复')
          rpc('list', {}).then((v) => setList(v || null)).catch(() => {})
        }).catch(() => setStatus('恢复失败'))
      }
      // 切换保留状态（保留 = 自动清除时豁免）；乐观更新本地列表，视觉立即反馈
      function toggleRetainNote(item) {
        const nextRetained = !item.retained
        // 立即更新本地列表（不等 host 返回）
        if (list) {
          const next = { ...list, categories: { ...list.categories } }
          for (const c of ['点子', '感想', 'TODO']) {
            if (next.categories[c]) {
              next.categories[c] = next.categories[c].map((x) =>
                x.name === item.name && c === item.kind ? { ...x, retained: nextRetained } : x,
              )
            }
          }
          setList(next)
        }
        rpc('retain', { kind: item.kind, name: item.name, retain: nextRetained }).then(() => {
          // 以 host 为准刷新（保持和磁盘一致）
          rpc('list', {}).then((v) => setList(v || null)).catch(() => {})
          setStatus(nextRetained ? '已保留' : '已取消保留')
        }).catch(() => {
          // 失败回滚 + 提示
          rpc('list', {}).then((v) => setList(v || null)).catch(() => {})
          setStatus('保留操作失败（可能需重启 DSH）')
        })
      }
      // 单击历史条目：该行「归档」按钮临时变成「发送」（3 秒后恢复）
      function armSend(item) {
        if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
        setPendingSend({ kind: item.kind, name: item.name })
        pendingTimerRef.current = setTimeout(() => {
          setPendingSend(null)
        }, 3000)
      }
      // 点击历史条目：按查看模式处理（inline = 便签内查看；file = 打开文件）
      function openNote(item) {
        if (viewMode === 'file') {
          rpc('open', { kind: item.kind, name: item.name }).then(() => {
            setStatus('已打开文件')
          }).catch(() => setStatus('打开失败'))
          return
        }
        rpc('read', { kind: item.kind, name: item.name }).then((v) => {
          if (v) setViewNote({ kind: item.kind, name: item.name, content: v.content || '' })
        }).catch(() => setStatus('读取失败'))
      }
      // 把便签内容发送给当前对话（按发送模式：send = 直接发出；append = 追加到输入框末尾）
      function sendToChat(content) {
        if (!inputActions || !content || !content.trim()) {
          setStatus('无法发送')
          return
        }
        if (sendMode === 'append') {
          const cur = (inputDraft || '').trim()
          inputActions.setDraft(cur ? cur + '\n\n' + content.trim() : content.trim())
          setStatus('已追加到输入框')
          setOpen(false)
          return
        }
        inputActions.setDraft(content.trim())
        inputActions.submit()
        setOpen(false)
      }
      // 双击历史条目：读取内容后发送
      function sendNoteItem(item) {
        rpc('read', { kind: item.kind, name: item.name }).then((v) => {
          if (v && v.content) sendToChat(v.content)
          else setStatus('读取失败')
        }).catch(() => setStatus('读取失败'))
      }
      function newNote() {
        rpc('new', {}).then(() => {
          setText('')
          textRef.current = ''
          setStatus('新便签')
        }).catch(() => {})
      }
      // 保存查看视图的编辑内容（覆盖该历史便签文件）
      function saveViewNoteEdit() {
        if (!viewNote) return
        const content = viewNoteTextRef.current
        if (!content.trim()) { setStatus('内容为空'); return }
        rpc('update', { kind: viewNote.kind, name: viewNote.name, content }).then(() => {
          setStatus('✓ 已保存')
          setViewNote({ ...viewNote, content })
          setViewNoteEditing(false)
        }).catch(() => setStatus('保存失败'))
      }

      const fab = React.createElement('button', {
        ref: fabRef,
        className: 'sn-fab',
        title: '便签',
        'aria-label': '打开便签',
        onClick: () => setOpen(!open),
      }, React.createElement(NoteIcon, null))

      if (!open) return fab

      let body
      if (helpOpen) {
        // 帮助视图：使用实时拉取的配置（helpCfg），保证设置改动后立即反映
        const hSave = helpCfg ? helpCfg.saveInterval : saveInterval
        const hClear = helpCfg ? helpCfg.clearAfter : clearAfter
        const hRoot = helpCfg && helpCfg.root ? helpCfg.root : root
        const saveLabel = hSave === 0 ? '不自动保存' : (hSave === 10 ? '10 秒' : (hSave === 60 ? '1 分钟' : '5 分钟'))
        const clearLabel = hClear === 0 ? '永久保留' : (hClear === 1 ? '1 天' : (hClear === 3 ? '3 天' : '7 天'))
        const lines = []
        if (view === 'list') {
          lines.push(
            ['单击便签条目，显示发送按钮。', ''],
            ['双击便签条目，显示便签内容。', ''],
            ['当前设置了创建后 ' + clearLabel + ' 自动清除未标记为保留且已经过期的文件。', ''],
            ['（可在 设置 → 插件 → 便签 中配置）', 'dim'],
          )
        } else {
          lines.push(
            ['便签可以用来临时记录「点子 / 感想 / TODO」。', ''],
            ['点击发送按钮，发送给当前对话框。', ''],
            ['便签内容会每隔 ' + saveLabel + ' 自动保存为 Markdown 文件。', ''],
            ['当前便签会在 ' + clearLabel + ' 后清除（可设置）。', ''],
            ['当前设置的文件保存路径是：', ''],
            [hRoot === '' ? '…' : hRoot, 'strong'],
            ['（可在 设置 → 插件 → 便签 中配置）', 'dim'],
          )
        }
        body = React.createElement('div', { className: 'sn-help-body' },
          lines.map((item, i) => React.createElement('p', {
            key: i,
            className: item[1] === 'strong' ? 'sn-help-strong' : (item[1] === 'dim' ? 'sn-help-dim' : ''),
          }, item[0])),
        )
      } else if (viewNote) {
        // 查看历史便签：支持编辑（非只读）
        const noteHead = React.createElement('div', { className: 'sn-note-head' },
          React.createElement('span', { className: 'sn-note-kind' }, viewNote.kind),
          React.createElement('span', { className: 'sn-note-name' }, viewNote.name.replace(/\.md$/, '')),
          viewNoteEditing
            ? React.createElement('span', { className: 'sn-note-actions' },
                React.createElement('button', {
                  className: 'sn-send-btn',
                  onClick: saveViewNoteEdit,
                }, '保存'),
                React.createElement('button', {
                  className: 'sn-note-cancel',
                  onClick: () => { setViewNoteEditing(false) },
                }, '取消'),
              )
            : React.createElement('span', { className: 'sn-note-actions' },
                React.createElement('button', {
                  className: 'sn-send-btn',
                  title: '发送到对话',
                  onClick: () => sendToChat(viewNote.content),
                }, '发送'),
                React.createElement('button', {
                  className: 'sn-note-edit',
                  onClick: () => {
                    viewNoteTextRef.current = viewNote.content
                    setViewNoteEditing(true)
                  },
                }, '编辑'),
              ),
        )
        let noteBody
        if (viewNoteEditing) {
          noteBody = React.createElement('textarea', {
            className: 'sn-text sn-note-textarea',
            defaultValue: viewNote.content,
            ref: (el) => { if (el) viewNoteTextRef.current = el.value },
            onChange: (e) => { viewNoteTextRef.current = e.target.value },
          })
        } else {
          noteBody = React.createElement('div', {
            className: 'sn-md',
            dangerouslySetInnerHTML: { __html: renderMarkdown(viewNote.content) },
          })
        }
        body = React.createElement('div', { className: 'sn-note-wrap' },
          noteHead,
          noteBody,
        )
      } else if (view === 'list') {
        const cats = (list && list.categories) ? list.categories : null
        const allOpen = Object.values(openCats).every(Boolean)
        const headerRow = React.createElement('div', { className: 'sn-list-tools' },
          React.createElement('span', { className: 'sn-list-tip' }, retainMode ? '点击条目切换保留' : '双击查看便签'),
          React.createElement('span', { className: 'sn-list-actions' },
            React.createElement('button', {
              className: 'sn-toggle-all' + (retainMode ? ' sn-on' : ''),
              onClick: () => setRetainMode(!retainMode),
            }, '选择保留'),
            React.createElement('button', {
              className: 'sn-toggle-all',
              onClick: () => {
                const next = {}
                for (const c of ['点子', '感想', 'TODO', '归档']) next[c] = !allOpen
                setOpenCats(next)
              },
            }, allOpen ? '全部收起' : '全部展开'),
          ),
        )
        const rows = [headerRow]
        if (cats) {
          for (const catName of ['点子', '感想', 'TODO', '归档']) {
            const isArchive = catName === '归档'
            const items = cats[catName] || []
            const isOpen = !!openCats[catName]
            rows.push(React.createElement('div', { key: catName, className: 'sn-cat' },
              React.createElement('button', {
                className: 'sn-cat-head',
                onClick: () => setOpenCats((prev) => ({ ...prev, [catName]: !prev[catName] })),
              },
                React.createElement('span', { className: 'sn-cat-caret' + (isOpen ? ' sn-open' : '') }, '▸'),
                React.createElement('span', { className: 'sn-cat-name' }, catName),
                React.createElement('span', { className: 'sn-cat-count' }, items.length),
              ),
              isOpen ? (items.length === 0
                ? React.createElement('div', { className: 'sn-empty' }, '暂无')
                : items.map((it) => {
                    const isPending = pendingSend && pendingSend.kind === catName && pendingSend.name === it.name
                    if (retainMode) {
                      // 保留视图：点击条目切换保留状态，保留的变色 + 针图标
                      return React.createElement('div', {
                        key: it.name,
                        className: 'sn-row sn-retain-row' + (it.retained ? ' sn-retained' : ''),
                        title: it.retained ? '已保留（点击取消保留）' : '未保留（点击设为保留）',
                        onClick: () => toggleRetainNote({ kind: catName, name: it.name, retained: it.retained }),
                      },
                        React.createElement('span', { className: 'sn-time', title: it.name }, it.timeText || ''),
                        React.createElement('span', { className: 'sn-pin' + (it.retained ? ' sn-on' : '') },
                          React.createElement(PinIcon, null),
                        ),
                        React.createElement('span', { className: 'sn-prev', title: it.preview }, it.preview || '(空)'),
                        React.createElement('span', { className: 'sn-retain-tag' }, it.retained ? '保留' : ''),
                      )
                    }
                    return React.createElement('div', {
                      key: it.name,
                      className: 'sn-row' + (isPending ? ' sn-pending' : ''),
                      title: isArchive ? '双击查看 · 可恢复到原类别' : '单击 = 预备发送 · 双击 = 查看',
                      onClick: () => { if (!isArchive) armSend({ kind: catName, name: it.name }) },
                      onDoubleClick: () => openNote({ kind: catName, name: it.name }),
                    },
                      React.createElement('span', { className: 'sn-time', title: it.name }, it.timeText || ''),
                      it.retained ? React.createElement('span', { className: 'sn-pin sn-on' }, React.createElement(PinIcon, null)) : null,
                      React.createElement('span', { className: 'sn-prev', title: it.preview }, (isArchive ? it.name.replace(/^(点子|感想|TODO)-/, '').replace(/\.md$/, '') + ' · ' : '') + (it.preview || '(空)')),
                      isArchive
                        ? React.createElement('button', {
                            className: 'sn-restore',
                            title: '恢复到原类别',
                            onClick: (e) => { e.stopPropagation(); doRestore({ kind: catName, name: it.name }) },
                          }, '恢复')
                        : isPending
                          ? React.createElement('button', {
                              className: 'sn-sendrow',
                              onClick: (e) => { e.stopPropagation(); setPendingSend(null); sendNoteItem({ kind: catName, name: it.name }) },
                            }, '发送')
                          : React.createElement('button', { className: 'sn-arch', onClick: (e) => { e.stopPropagation(); doArchive({ kind: catName, name: it.name }) } }, '归档'),
                    )
                  })) : null,
            ))
          }
        }
        body = React.createElement('div', { className: 'sn-list' }, rows.length ? rows : React.createElement('div', { className: 'sn-empty' }, '加载中…'))
      } else if (preview) {
        // Markdown 预览：渲染后的内容（内容源自用户自己的便签，渲染前已做 HTML 转义）
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
        style: { right: pos.right + 'px', bottom: pos.bottom + 'px', width: size.width + 'px', height: size.height + 'px' },
      },
        // 自定义伸缩手柄：左边缘 / 上边缘 / 左上角
        React.createElement('div', { className: 'sn-rz-left', onMouseDown: (e) => onDragStart(e, 'left') }),
        React.createElement('div', { className: 'sn-rz-top', onMouseDown: (e) => onDragStart(e, 'top') }),
        React.createElement('div', { className: 'sn-rz-corner', onMouseDown: (e) => onDragStart(e, 'corner') }),
        // 头部：左 [+新建] [便签图标 标题 状态]，右 [👁预览] [✕]
        React.createElement('div', { className: 'sn-head' },
          React.createElement('span', null,
            viewNote ? null : React.createElement('button', { className: 'sn-plus', title: '新建便签', 'aria-label': '新建便签', onClick: newNote }, '+'),
            React.createElement(NoteIcon, null),
            viewNote ? '查看' : (view === 'list' ? '历史便签' : '便签'),
            status ? React.createElement('span', { className: 'sn-headstatus' }, status) : null,
          ),
          React.createElement('span', { className: 'sn-head-right' },
            viewNote ? React.createElement('button', { className: 'sn-back-text', onClick: () => setViewNote(null) }, '← 返回列表')
              : (view === 'edit' ? React.createElement('button', {
                  className: 'sn-mini' + (preview ? ' sn-on' : ''),
                  title: preview ? '返回编辑' : 'Markdown 预览', 'aria-label': '切换 Markdown 预览',
                  onClick: () => setPreview(!preview),
                }, preview ? '✏' : '👁') : null),
            view === 'list' && !viewNote
              ? React.createElement('button', { className: 'sn-back-text', onClick: () => setView('edit') }, '← 返回当前')
              : (viewNote ? null : React.createElement('button', { className: 'sn-x', title: '关闭', 'aria-label': '关闭便签', onClick: () => setOpen(false) }, '✕')),
            React.createElement('button', { className: 'sn-help', title: '帮助', 'aria-label': '帮助', onClick: () => setHelpOpen(!helpOpen) }, '?'),
          ),
        ),
        React.createElement('div', { className: 'sn-body' }, body),
        // 底部：左 [历史便签/返回清单]，中 [发送/文件夹]，右 [类别徽章（可展开）]
        React.createElement('div', { className: 'sn-bar sn-bar-3col' },
          React.createElement('div', { className: 'sn-group' },
            viewNote
              ? React.createElement('button', {
                  className: 'sn-iconbtn sn-hist',
                  title: '返回历史便签清单',
                  onClick: () => setViewNote(null),
                }, '返回清单')
              : React.createElement('button', {
                  className: 'sn-iconbtn sn-hist' + (view === 'list' ? ' sn-active' : ''),
                  title: '历史便签',
                  onClick: openList,
                }, '历史便签'),
          ),
          React.createElement('div', { className: 'sn-group sn-bar-center' },
            view === 'edit'
              ? React.createElement('button', {
                  className: 'sn-send',
                  title: '发送到对话',
                  onClick: () => sendToChat(textRef.current),
                }, '发送')
              : (view === 'list' && !viewNote
                  ? React.createElement('button', {
                      className: 'sn-openfolder',
                      title: '打开便签文件夹',
                      onClick: () => {
                        rpc('openRoot', {}).then(() => {
                          setStatus('已打开文件夹')
                        }).catch(() => setStatus('打开失败'))
                      },
                    },
                    React.createElement(FolderIcon, null),
                  )
                  : null),
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

    // 设置页 → 插件 → 便签 卡片：遵循 DSH 插件卡片规范（可折叠 li 卡片）
    function SettingsCard(props) {
      const rpc = props.rpc
      const workspaces = props.workspaces
      const [open, setOpen] = React.useState(false)
      const [root, setRoot] = React.useState('')
      const [viewMode, setViewMode] = React.useState('inline')
      const [saveInterval, setSaveInterval] = React.useState(10)
      const [clearAfter, setClearAfter] = React.useState(7)
      const [defaultKind, setDefaultKind] = React.useState('点子')
      const [sendMode, setSendMode] = React.useState('send')
      const [saved, setSaved] = React.useState('')
      const [loaded, setLoaded] = React.useState(false)

      React.useEffect(() => {
        rpc('config', {}).then((v) => {
          if (!v) return
          if (v.root) setRoot(v.root)
          if (v.viewMode) setViewMode(v.viewMode)
          if (typeof v.saveInterval === 'number') setSaveInterval(v.saveInterval)
          if (typeof v.clearAfter === 'number') setClearAfter(v.clearAfter)
          if (v.defaultKind) setDefaultKind(v.defaultKind)
          if (v.sendMode) setSendMode(v.sendMode)
          setLoaded(true)
        }).catch(() => setLoaded(true))
      }, [])

      // 单个字段改动即保存（查看方式/保存间隔/清除/默认类别/发送方式）
      function saveField(patch) {
        rpc('config', patch).then(() => {
          setSaved('✓ 已保存')
          setTimeout(() => setSaved(''), 2000)
        }).catch(() => setSaved('保存失败'))
      }

      // 保存按钮：只负责存储路径
      function save() {
        if (!root.trim()) { setSaved('路径不能为空'); return }
        rpc('config', { root: root.trim() }).then(() => {
          setSaved('✓ 已保存')
          setTimeout(() => setSaved(''), 2000)
        }).catch(() => setSaved('保存失败'))
      }

      // 打开原生目录选择器，把选中的路径填入输入框
      function pickDir() {
        if (!workspaces || typeof workspaces.pickDirectory !== 'function') {
          setSaved('目录选择不可用')
          return
        }
        workspaces.pickDirectory().then((p) => {
          if (p) setRoot(p)
        }).catch(() => setSaved('选择失败'))
      }

      // 通用选项组：label + 一组互斥按钮
      function OptionGroup(label, options, current, onChange) {
        return React.createElement(React.Fragment, null,
          React.createElement('label', { className: 'sn-set-label' }, label),
          React.createElement('div', { className: 'sn-set-modes' },
            options.map((opt) => React.createElement('button', {
              key: opt.value,
              type: 'button',
              className: 'sn-set-mode' + (current === opt.value ? ' sn-on' : ''),
              onClick: () => onChange(opt.value),
            }, opt.label)),
          ),
        )
      }

      return React.createElement('li', { className: 'sn-set-card' },
        React.createElement('button', {
          type: 'button',
          className: 'sn-set-header',
          'aria-expanded': open,
          onClick: () => setOpen(!open),
        },
          React.createElement('span', { className: 'sn-set-headtext' },
            React.createElement('span', { className: 'sn-set-title' }, '便签'),
            React.createElement('span', { className: 'sn-set-desc' }, '存储路径与各项行为'),
          ),
          React.createElement('span', { className: 'sn-set-badge' }, root ? root.split(/[\\/]/).pop() : ''),
          React.createElement('span', { className: 'sn-set-caret', 'aria-hidden': 'true' }, open ? '▴' : '▾'),
        ),
        open ? React.createElement('div', { className: 'sn-set-body' },
          React.createElement('label', { className: 'sn-set-label' }, '存储路径'),
          React.createElement('div', { className: 'sn-set-row' },
            React.createElement('div', { className: 'sn-set-inputwrap' },
              React.createElement('input', {
                className: 'sn-set-input',
                value: root,
                placeholder: loaded ? '如 D:\\归档\\便签' : '加载中…',
                onChange: (e) => setRoot(e.target.value),
                onKeyDown: (e) => { if (e.key === 'Enter') save() },
              }),
              React.createElement('button', {
                type: 'button',
                className: 'sn-set-pick',
                title: '选择目录',
                onClick: pickDir,
              }, React.createElement(FolderIcon, null)),
            ),
            React.createElement('button', { className: 'sn-set-save', onClick: save }, '保存'),
          ),
          OptionGroup('点击历史便签时', [
            { value: 'inline', label: '便签内查看' },
            { value: 'file', label: '打开文件' },
          ], viewMode, (v) => { setViewMode(v); saveField({ viewMode: v }) }),
          OptionGroup('自动保存时间', [
            { value: 10, label: '每10秒' },
            { value: 60, label: '1分钟' },
            { value: 300, label: '5分钟' },
            { value: 0, label: '不自动保存' },
          ], saveInterval, (v) => { setSaveInterval(v); saveField({ saveInterval: v }) }),
          OptionGroup('自动清除历史', [
            { value: 1, label: '1天' },
            { value: 3, label: '3天' },
            { value: 7, label: '7天' },
            { value: 0, label: '永久保留' },
          ], clearAfter, (v) => { setClearAfter(v); saveField({ clearAfter: v }) }),
          OptionGroup('默认类别', [
            { value: '点子', label: '点子' },
            { value: '感想', label: '感想' },
            { value: 'TODO', label: 'TODO' },
          ], defaultKind, (v) => { setDefaultKind(v); saveField({ defaultKind: v }) }),
          OptionGroup('发送方式', [
            { value: 'send', label: '直接发出' },
            { value: 'append', label: '追加到输入框' },
          ], sendMode, (v) => { setSendMode(v); saveField({ sendMode: v }) }),
          React.createElement('div', { className: 'sn-set-tip' },
            '便签按 点子 / 感想 / TODO / 归档 四个子目录存放。标记为保留的便签不会被自动清除。' + (saved ? ' ' + saved : ''),
          ),
        ) : null,
      )
    }

    // 编辑框工具栏右侧：打开便签存储目录按钮（SVG 文件夹图标）
    function FolderIcon() {
      return React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true, xmlns: 'http://www.w3.org/2000/svg' },
        React.createElement('path', {
          d: 'M1.5 3.5C1.5 2.94772 1.94772 2.5 2.5 2.5H5.5C5.77614 2.5 6.03934 2.6122 6.22804 2.80775L7.20711 3.82322C7.39581 4.01877 7.65901 4.13097 7.93515 4.13097H13.5C14.0523 4.13097 14.5 4.57869 14.5 5.13097V12.5C14.5 13.0523 14.0523 13.5 13.5 13.5H2.5C1.94772 13.5 1.5 13.0523 1.5 12.5V3.5Z',
          stroke: 'currentColor',
          strokeWidth: '1.2',
          strokeLinejoin: 'round',
        }),
      )
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
      slots.inject('settings.plugin.item', () => slots.register(
        // rc7 起 settings.plugin.item 为 keyed slot：key 即卡片命名空间（宿主按 key 分发）
        { name: 'settings.plugin.item', id: 'dsh-sticky-note', key: 'dsh-sticky-note', order: 40 },
        () => React.createElement(SettingsCard, { rpc, workspaces: ctx.get('workspaces') }),
      ))
      ctx.effect(() => disposeStyle, 'dsh-sticky-note: styles')
    }

    exports.apply = apply
    exports.StickyNoteApp = StickyNoteApp
    return module.exports
  },
})
