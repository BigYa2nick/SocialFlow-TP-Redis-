const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ─── Middlewares globaux ──────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL,  // Autorise uniquement le frontend React
  methods: ['GET', 'POST', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Parse le body JSON automatiquement

// ─── Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',  require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

// ─── Route de test ───────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '🚀 SocialFlow API en ligne', version: '1.0.0' });
});

// ─── Démarrage ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur SocialFlow démarré sur http://localhost:${PORT}`);
  console.log(`📡 Frontend autorisé : ${process.env.CLIENT_URL}\n`);
});
