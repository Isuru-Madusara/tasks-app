const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const { validateTitle } = require('./validate');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://app:app@localhost:5432/tasks',
});

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  });

async function initDb(retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(
        'CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, done BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now())'
      );
      return;
    } catch (e) {
      console.log('Database not ready, retrying...');
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Database unavailable');
}

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// READ all
app.get('/api/tasks', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
  res.json(rows);
}));

// READ one
app.get('/api/tasks/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

// CREATE
app.post('/api/tasks', wrap(async (req, res) => {
  if (!validateTitle(req.body.title)) return res.status(400).json({ error: 'Invalid title' });
  const { rows } = await pool.query('INSERT INTO tasks (title) VALUES ($1) RETURNING *', [req.body.title.trim()]);
  res.status(201).json(rows[0]);
}));

// UPDATE
app.put('/api/tasks/:id', wrap(async (req, res) => {
  const { title, done } = req.body;
  if (title !== undefined && !validateTitle(title)) return res.status(400).json({ error: 'Invalid title' });
  const { rows } = await pool.query(
    'UPDATE tasks SET title = COALESCE($1, title), done = COALESCE($2, done) WHERE id = $3 RETURNING *',
    [title === undefined ? null : title.trim(), done === undefined ? null : done, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

// DELETE
app.delete('/api/tasks/:id', wrap(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
}));

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log('Listening on ' + PORT)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
