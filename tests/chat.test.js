import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @anthropic-ai/sdk
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockResolvedValue((async function* () {
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Ciao' } };
        yield { type: 'content_block_delta', delta: { type: 'text_delta', text: '!' } };
      })()),
    },
  })),
}));

// Mock fs
vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue('Sei un assistente.'),
}));

// Mock path
vi.mock('path', () => ({
  join: vi.fn().mockReturnValue('/mocked/path/system.txt'),
}));

function makeReqRes(body = {}, ip = '1.2.3.4') {
  const chunks = [];
  const req = {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
    body,
  };
  const res = {
    _status: 200,
    _headers: {},
    _chunks: chunks,
    _ended: false,
    status(code) { this._status = code; return this; },
    json(data) { this._chunks.push(JSON.stringify(data)); this._ended = true; return this; },
    setHeader(k, v) { this._headers[k] = v; },
    write(chunk) { chunks.push(chunk); },
    end() { this._ended = true; },
  };
  return { req, res };
}

describe('POST /api/chat', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 405 for non-POST requests', async () => {
    const { default: handler } = await import('../api/chat.js');
    const { req, res } = makeReqRes();
    req.method = 'GET';
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('returns 400 if messages is missing', async () => {
    const { default: handler } = await import('../api/chat.js');
    const { req, res } = makeReqRes({ messages: [] });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('streams SSE events for valid request', async () => {
    const { default: handler } = await import('../api/chat.js');
    const { req, res } = makeReqRes({
      messages: [{ role: 'user', content: 'Ciao' }],
    });
    await handler(req, res);
    expect(res._headers['Content-Type']).toBe('text/event-stream');
    expect(res._chunks.some(c => c.includes('"text":"Ciao"'))).toBe(true);
    expect(res._chunks.some(c => c.includes('[DONE]'))).toBe(true);
  });

  it('returns 429 after 10 requests from same IP', async () => {
    vi.resetModules();
    const { default: handler } = await import('../api/chat.js');
    const body = { messages: [{ role: 'user', content: 'test' }] };
    const ip = '5.5.5.5';

    for (let i = 0; i < 10; i++) {
      const { req, res } = makeReqRes(body, ip);
      await handler(req, res);
    }

    const { req, res } = makeReqRes(body, ip);
    await handler(req, res);
    expect(res._status).toBe(429);
  });
});
