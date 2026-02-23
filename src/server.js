import express from 'express';
import { fileURLToPath } from 'url';
import logsRouter from './routes/logs.js';

const app = express();

app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', logsRouter);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`promptlog listening on port ${PORT}`);
  });
}

export default app;
