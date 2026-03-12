const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/mysql');
const redis = require('../config/redis');

// ─── INSCRIPTION ──────────────────────────────────────────────────────────
// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Tous les champs sont requis' });

  try {
    // Hasher le mot de passe (jamais stocker en clair)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer en MySQL
    const [result] = await db.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      userId: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username ou email déjà utilisé' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── CONNEXION ────────────────────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    // Chercher l'utilisateur en MySQL
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const user = rows[0];

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    // Générer un token de session unique
    const token = uuidv4();

    // Stocker la session dans Redis (TTL 30 minutes)
    const sessionData = JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email
    });
    await redis.setex(`sess:${token}`, 1800, sessionData);

    // Index inversé : retrouver le token depuis l'user_id
    await redis.setex(`user:${user.id}:session`, 1800, token);

    res.json({
      message: 'Connexion réussie',
      token,  // Le frontend stocke ce token et l'envoie dans chaque requête
      user: { id: user.id, username: user.username, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── DÉCONNEXION ─────────────────────────────────────────────────────────
// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.headers['authorization'];

  if (token) {
    // Supprimer la session Redis immédiatement
    await redis.del(`sess:${token}`);
  }

  res.json({ message: 'Déconnecté avec succès' });
});

module.exports = router;
