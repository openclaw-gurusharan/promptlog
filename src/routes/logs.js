import { Router } from 'express';
import { getDb } from '../db.js';

const router = Router();

// POST /logs
router.post('/logs', (req, res) => {
  const { prompt, response, engine, tags } = req.body;

  if (typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'prompt is required and must be a non-empty string' });
  }
  if (typeof response !== 'string' || response.trim() === '') {
    return res.status(400).json({ error: 'response is required and must be a non-empty string' });
  }

  const db = getDb();

  const log = {
    id: crypto.randomUUID(),
    prompt,
    response,
    engine: engine || null,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
  };

  db.data.logs.push(log);
  db.write();

  return res.status(201).json(log);
});

// GET /logs
router.get('/logs', (req, res) => {
  const { engine, tag } = req.query;
  let limit = parseInt(req.query.limit, 10);
  if (isNaN(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;

  const db = getDb();
  let logs = db.data.logs;

  if (engine) {
    logs = logs.filter((l) => l.engine === engine);
  }

  if (tag) {
    logs = logs.filter((l) => Array.isArray(l.tags) && l.tags.includes(tag));
  }

  const total = logs.length;
  logs = logs.slice(0, limit);

  return res.json({ logs, total });
});

// GET /logs/:id
router.get('/logs/:id', (req, res) => {
  const db = getDb();
  const log = db.data.logs.find((l) => l.id === req.params.id);
  if (!log) {
    return res.status(404).json({ error: 'Not found' });
  }
  return res.json(log);
});

// DELETE /logs/:id
router.delete('/logs/:id', (req, res) => {
  const db = getDb();
  const index = db.data.logs.findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Not found' });
  }
  db.data.logs.splice(index, 1);
  db.write();
  return res.status(204).send();
});

export default router;
