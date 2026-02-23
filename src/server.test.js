import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import os from 'os';
import path from 'path';
import fs from 'fs';

// Set DB_PATH to a unique temp file before importing the app
const tmpDb = path.join(os.tmpdir(), `promptlog-test-${crypto.randomUUID()}.json`);
process.env.DB_PATH = tmpDb;

// Import app after setting DB_PATH
const { default: app } = await import('./server.js');

afterAll(() => {
  if (fs.existsSync(tmpDb)) {
    fs.unlinkSync(tmpDb);
  }
});

describe('GET /healthz', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/logs', () => {
  it('creates a log and returns 201 with id, prompt, response, createdAt', async () => {
    const res = await request(app).post('/api/logs').send({
      prompt: 'Hello world',
      response: 'Hi there',
      engine: 'gpt-4',
      tags: ['test'],
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      prompt: 'Hello world',
      response: 'Hi there',
      engine: 'gpt-4',
      tags: ['test'],
    });
    expect(res.body.id).toBeTruthy();
    expect(res.body.createdAt).toBeTruthy();
  });

  it('returns 400 when prompt is missing', async () => {
    const res = await request(app).post('/api/logs').send({ response: 'Hi' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('returns 400 when response is missing', async () => {
    const res = await request(app).post('/api/logs').send({ prompt: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});

describe('GET /api/logs', () => {
  let createdId;

  beforeAll(async () => {
    // Create a few logs with different engines and tags
    const res = await request(app).post('/api/logs').send({
      prompt: 'Filter test prompt',
      response: 'Filter test response',
      engine: 'chatgpt',
      tags: ['test', 'filter'],
    });
    createdId = res.body.id;

    await request(app).post('/api/logs').send({
      prompt: 'Another prompt',
      response: 'Another response',
      engine: 'claude',
      tags: ['other'],
    });
  });

  it('returns an array of logs with total', async () => {
    const res = await request(app).get('/api/logs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.logs)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('filters by engine=chatgpt', async () => {
    const res = await request(app).get('/api/logs?engine=chatgpt');
    expect(res.status).toBe(200);
    expect(res.body.logs.every((l) => l.engine === 'chatgpt')).toBe(true);
    expect(res.body.logs.length).toBeGreaterThan(0);
  });

  it('filters by tag=test', async () => {
    const res = await request(app).get('/api/logs?tag=test');
    expect(res.status).toBe(200);
    expect(res.body.logs.every((l) => l.tags.includes('test'))).toBe(true);
    expect(res.body.logs.length).toBeGreaterThan(0);
  });
});

describe('GET /api/logs/:id', () => {
  let createdLog;

  beforeAll(async () => {
    const res = await request(app).post('/api/logs').send({
      prompt: 'Specific prompt',
      response: 'Specific response',
    });
    createdLog = res.body;
  });

  it('returns the log by id', async () => {
    const res = await request(app).get(`/api/logs/${createdLog.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdLog.id);
    expect(res.body.prompt).toBe('Specific prompt');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/logs/nonexistent-id-12345');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});

describe('DELETE /api/logs/:id', () => {
  let createdLog;

  beforeAll(async () => {
    const res = await request(app).post('/api/logs').send({
      prompt: 'To be deleted',
      response: 'Goodbye',
    });
    createdLog = res.body;
  });

  it('returns 204 and log is gone after delete', async () => {
    const del = await request(app).delete(`/api/logs/${createdLog.id}`);
    expect(del.status).toBe(204);

    const get = await request(app).get(`/api/logs/${createdLog.id}`);
    expect(get.status).toBe(404);
  });
});
