import { describe, it, expect, afterAll } from 'vitest'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// 用临时目录当 DSH_HOME，隔离本机真实配置与便签
const HOME = await mkdtemp(join(tmpdir(), 'sn-auth-test-'))
process.env.DSH_HOME = HOME

const { apply } = await import('../lib/index.js')

// 与 lib/index.js 中的 RPC_PATH / RPC_ENDPOINT 保持一致
const RPC_PATH = '/api/dsh-sticky-note/call'
const RPC_ENDPOINT = 'dsh-sticky-note/call'
const NOTES_ROOT = join(HOME, 'sticky-notes')

// 复刻 @deepseek-ai/dsh-client-connection 对 /api 的真实鉴权契约：
// isTrustedApiRequest（Host/Origin/sec-fetch-site 围栏）+ BrowserAuth（会话 cookie）。
// 见 PR #20 review：这层围栏由宿主实现，插件自身的 fetch route 不做任何鉴权。
function requestRejection(request, { authenticated } = {}) {
  const host = request.headers.get('host')
  if (!host) return 403
  const hostname = host.split(':')[0]
  const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  if (!loopback) return 403
  if (request.headers.get('sec-fetch-site') === 'cross-site') return 403
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== host) return 403
  return authenticated ? undefined : 401
}

function makeFakeConnection() {
  const routes = new Map()
  return {
    fetch: {
      register(route) {
        routes.set(route.path, route)
        return () => routes.delete(route.path)
      },
    },
    rpc: { handle() { return () => {} } },
    routes,
    async dispatch(request, authState) {
      const rejection = requestRejection(request, authState)
      if (rejection !== undefined) return new Response(null, { status: rejection })
      const route = routes.get(new URL(request.url).pathname)
      if (!route) return new Response(null, { status: 404 })
      return route.fetch(request)
    },
  }
}

function makeFakeCtx(connection) {
  const disposers = []
  const ctx = {
    settings: { register: () => ({ get: () => null, update: async () => {} }) },
    connection,
    effect(fn) {
      const dispose = fn()
      if (typeof dispose === 'function') disposers.push(dispose)
    },
  }
  return { ctx, dispose: () => disposers.forEach((d) => d()) }
}

function rpcRequest(payload, headers) {
  return new Request('http://localhost' + RPC_PATH, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'client-request',
      rpcId: 't1',
      method: RPC_ENDPOINT,
      payload,
    }),
  })
}

const connection = makeFakeConnection()
const { ctx, dispose } = makeFakeCtx(connection)
apply(ctx)

afterAll(async () => {
  dispose()
  await rm(HOME, { recursive: true, force: true })
})

async function savedNoteCount() {
  try {
    return (await readdir(join(NOTES_ROOT, '点子'))).length
  } catch (e) {
    return 0
  }
}

describe('RPC 契约：只声明宿主认识的字段', () => {
  it('注册的 fetch route 不包含无效的 authority 字段（回归 PR #20）', () => {
    const route = connection.routes.get(RPC_PATH)
    expect(route).toBeTruthy()
    expect(Object.keys(route).sort()).toEqual(['fetch', 'methods', 'path', 'requestBody'])
    expect(route.methods).toEqual(['POST'])
  })
})

describe('RPC 鉴权边界（回归：PR #20 review 意见）', () => {
  it('缺少 Host 头 → 403，不触达 handler', async () => {
    const res = await connection.dispatch(
      rpcRequest({ endpoint: 'save', payload: { kind: '点子', content: '不该写入-1' } }, {}),
      { authenticated: true },
    )
    expect(res.status).toBe(403)
    expect(await savedNoteCount()).toBe(0)
  })

  it('cross-site 请求 → 403，不触达 handler', async () => {
    const res = await connection.dispatch(
      rpcRequest(
        { endpoint: 'save', payload: { kind: '点子', content: '不该写入-2' } },
        { host: 'localhost', 'sec-fetch-site': 'cross-site' },
      ),
      { authenticated: true },
    )
    expect(res.status).toBe(403)
    expect(await savedNoteCount()).toBe(0)
  })

  it('受信 Host 但未认证 → 401，不触达 handler', async () => {
    const res = await connection.dispatch(
      rpcRequest({ endpoint: 'save', payload: { kind: '点子', content: '不该写入-3' } }, { host: 'localhost' }),
      { authenticated: false },
    )
    expect(res.status).toBe(401)
    expect(await savedNoteCount()).toBe(0)
  })

  it('受信 Host 且已认证 → 正常写入便签', async () => {
    const res = await connection.dispatch(
      rpcRequest({ endpoint: 'save', payload: { kind: '点子', content: '认证后写入' } }, { host: 'localhost' }),
      { authenticated: true },
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.result.ok).toBe(true)
    expect(await savedNoteCount()).toBe(1)
  })
})
