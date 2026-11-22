import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VERSION = '2025-03-26'
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
const error = (id: unknown, code: number, message: string, status = 200) => json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, status)

/** Public, read-only MCP bootstrap. Does not expose student data or offer enrollment. */
export async function POST(request: NextRequest) {
  if (!request.headers.get('content-type')?.includes('application/json')) return error(null, -32600, 'Expected application/json', 415)
  const size = Number(request.headers.get('content-length') || 0)
  if (size > 32768) return error(null, -32600, 'Request too large', 413)
  // Enforce the limit on actual bytes, not only the client-controlled Content-Length.
  const reader = request.body?.getReader()
  if (!reader) return error(null, -32700, 'Parse error', 400)
  const chunks: Uint8Array[] = []
  let received = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > 32768) {
        await reader.cancel().catch(() => undefined)
        return error(null, -32600, 'Request too large', 413)
      }
      chunks.push(value)
    }
  } catch { return error(null, -32700, 'Parse error', 400) }
  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  let body: unknown
  try { body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) } catch { return error(null, -32700, 'Parse error', 400) }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return error(null, -32600, 'Invalid Request', 400)
  const req = body as Record<string, unknown>
  if (req.jsonrpc !== '2.0' || typeof req.method !== 'string') return error(req.id, -32600, 'Invalid Request', 400)
  if (req.id === undefined) return new Response(null, { status: 202 })
  if (req.method === 'initialize') return json({ jsonrpc: '2.0', id: req.id, result: { protocolVersion: VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'xpex-academy-everywhere', version: '0.1.0-preview' } } })
  if (req.method === 'ping') return json({ jsonrpc: '2.0', id: req.id, result: {} })
  if (req.method === 'tools/list') return json({ jsonrpc: '2.0', id: req.id, result: { tools: [{ name: 'academy_get_capabilities', description: 'Read the current public rollout state of XPeX Academy Everywhere. Does not return learner data.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } }] } })
  if (req.method === 'tools/call') {
    const params = req.params
    if (!params || typeof params !== 'object' || Array.isArray(params) || (params as Record<string, unknown>).name !== 'academy_get_capabilities') return error(req.id, -32602, 'Unknown tool')
    const capabilities = {
      product: 'XPeX Academy Everywhere — Learning OS',
      status: 'integration-preview',
      channels: { web: 'preview', chatgpt: 'not-published', android: 'not-published' },
      course_catalog: 'pending-backend',
      enrollment: 'pending-authenticated-backend',
      progress: 'pending-authenticated-backend',
      certificates: 'pending-authenticated-backend',
    }
    return json({ jsonrpc: '2.0', id: req.id, result: { content: [{ type: 'text', text: JSON.stringify(capabilities) }], structuredContent: capabilities } })
  }
  return error(req.id, -32601, 'Method not found')
}

export async function GET() { return json({ status: 'preview', name: 'xpex-academy-everywhere-mcp', protocolVersion: VERSION, note: 'MCP JSON-RPC POST endpoint; not a published ChatGPT app' }) }
