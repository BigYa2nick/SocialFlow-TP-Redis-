const redis = require('../config/redis');

// Middleware qui vérifie si l'utilisateur est connecté
// S'utilise sur toutes les routes protégées : router.get('/timeline', authMiddleware, ...)
const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Non authentifié — token manquant' });
  }

  try {
    // Chercher la session dans Redis
    const sessionData = await redis.get(`sess:${token}`);

    if (!sessionData) {
      return res.status(401).json({ error: 'Session expirée ou invalide' });
    }

    // Renouveler le TTL à chaque requête (session glissante 30 min)
    await redis.expire(`sess:${token}`, 1800);

    // Attacher les infos user à la requête
    req.user = JSON.parse(sessionData);
    next();

  } catch (err) {
    console.error('Erreur auth middleware :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = authMiddleware;
