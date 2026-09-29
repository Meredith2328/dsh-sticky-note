import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import manifest from '../package.json' with { type: 'json' }

// 只看代码行：注释里会提到这些已被移除的 API 名字，断言不该被注释误伤
async function hostSource() {
  const raw = await readFile(new URL('../lib/index.js', import.meta.url), 'utf8')
  return raw.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n')
}

describe('DSH 0.2.0-rc.2 manifest', () => {
  it('只注入 0.2.0 里仍存在的动态客户端包', () => {
    expect(manifest.dsh.client.inject).toEqual([
      '@deepseek-ai/dsh-client-connection',
      '@deepseek-ai/dsh-client-ui-conversation',
      '@deepseek-ai/dsh-client-ui-plugin-manager',
      '@deepseek-ai/dsh-client-ui-workspace',
    ])
    expect(manifest.dsh.client.inject).not.toContain('@deepseek-ai/dsh-client-runtime')
    expect(manifest.dsh.client.inject).not.toContain('@deepseek-ai/dsh-client-ui-settings-plugins')
    expect(manifest.dsh.client.platform).toBe('web')
  })

  it('注入包都靠在 peerDependencies 的键上，并标成可选', () => {
    for (const dep of manifest.dsh.client.inject) {
      expect(Object.keys(manifest.peerDependencies)).toContain(dep)
      expect(manifest.peerDependenciesMeta[dep]).toEqual({ optional: true })
    }
  })

  it('peer 范围只放行已适配的运行时，基线文件跟着走', async () => {
    const baseline = (await readFile(new URL('../.dsh-baseline', import.meta.url), 'utf8')).trim()
    expect(baseline).toBe('0.2.0-rc.2')
    // 插件管理器按运行时版本校验 @deepseek-ai/dsh-* 的 peer 范围，范围不合会直接挡安装
    expect(manifest.peerDependencies['@deepseek-ai/dsh-settings']).toBe('^0.2.0-rc.2')
  })

  it('bundle patch 的条目 id 就是 settings 表单定位配置用的 id', async () => {
    const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
    expect(manifest.dsh.bundle.patch).toBe('./cordis.patch.yml')
    expect(patch).toContain('id: dsh-sticky-note')
    expect(await hostSource()).toMatch(/const SETTINGS_NS = 'dsh-sticky-note'/)
  })

  it('用户配置走插件的 Config，不再用已移除的 settings.register', async () => {
    const code = await hostSource()
    expect(code).toMatch(/export const Config = z\.object\(\{/)
    expect(code).not.toMatch(/settings\.register/)
    expect(code).not.toMatch(/settingsNamespace/)
    expect(code).toMatch(/child\.settings\.update\(entryId, patch\)/)
    expect(code).toMatch(/configure\(\{ auto: false \}, ctx\.fiber\)/)
  })

  it('connection.rpc.handle 只传 (channel, handler)', async () => {
    const code = await hostSource()
    expect(code).toMatch(/connection\.rpc\.handle\(CHANNEL, handler\)/)
    expect(code).not.toMatch(/authority/)
  })

  it('失败信封在出口统一补 message 与对象 details', async () => {
    const code = await hostSource()
    // 路由出口只有一个：一律过 normalizeRpcResult，客户端才拿得到可读的失败原因
    expect(code).toMatch(/result: normalizeRpcResult\(result\)/)
    expect(code).toMatch(/details: rawDetails && typeof rawDetails === 'object' \? rawDetails : \{ reason: message \}/)
  })
})
