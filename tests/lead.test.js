import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSet = vi.fn().mockResolvedValue(undefined);
const mockSend = vi.fn().mockResolvedValue({ id: 'email-123' });

vi.mock('@vercel/kv', () => ({
  kv: { set: mockSet },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

function makeReqRes(body = {}) {
  const req = { method: 'POST', body };
  const res = {
    _status: 200,
    _body: null,
    setHeader() { return this; },
    end() { return this; },
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
  };
  return { req, res };
}

describe('POST /api/lead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 405 for non-POST requests', async () => {
    const { default: handler } = await import('../api/lead.js');
    const { req, res } = makeReqRes();
    req.method = 'GET';
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it('returns 400 if name or email is missing', async () => {
    const { default: handler } = await import('../api/lead.js');
    const { req, res } = makeReqRes({ name: 'Mario' });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it('sends email and returns 200', async () => {
    const { default: handler } = await import('../api/lead.js');
    const { req, res } = makeReqRes({
      name: 'Mario Rossi',
      email: 'mario@example.com',
      summary: 'Interessato a divani in pelle',
    });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockSend.mock.calls[0][0].subject).toContain('Mario Rossi');
  });

  it('returns ok:true on success', async () => {
    const { default: handler } = await import('../api/lead.js');
    const { req, res } = makeReqRes({ name: 'Anna', email: 'anna@example.com' });
    await handler(req, res);
    expect(res._body).toEqual({ ok: true });
  });
});
