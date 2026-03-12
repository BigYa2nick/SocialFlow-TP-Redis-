const express = require('express');
const router = express.Router();
const db = require('../config/mysql');
const redis = require('../config/redis');
const authMiddleware = require('../middleware/auth');

// ─── RECHERCHE ────────────────────────────────────────────────────────────
router.get('/search', authMiddleware, async (req, res) => {
  const query = req.query.q;
  if (!query?.trim()) return res.json({ users: [] });

  try {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.bio,
        CASE WHEN f.follower_id IS NOT NULL THEN 1 ELSE 0 END as is_following
       FROM users u
       LEFT JOIN follows f ON f.follower_id = ? AND f.following_id = u.id
       WHERE u.username LIKE ? AND u.id != ?
       LIMIT 10`,
      [req.user.id, `%${query}%`, req.user.id]
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── PROFIL UTILISATEUR ───────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  const targetId = req.params.id;
  try {
    const cached = await redis.get(`cache:user:${targetId}`);
    if (cached) return res.json({ user: JSON.parse(cached), fromCache: true });

    const [rows] = await db.execute(
      'SELECT id, username, email, bio, avatar, created_at FROM users WHERE id = ?',
      [targetId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const user = rows[0];
    user.followers_count = await redis.scard(`user:${targetId}:followers`).catch(() => 0) || 0;
    user.following_count = await redis.scard(`user:${targetId}:following`).catch(() => 0) || 0;

    const [postCount] = await db.execute(
      'SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [targetId]
    );
    user.post_count = postCount[0].count || 0;

    await redis.setex(`cache:user:${targetId}`, 300, JSON.stringify(user));
    res.json({ user, fromCache: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── FOLLOWERS D'UN USER ──────────────────────────────────────────────────
router.get('/:id/followers', authMiddleware, async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user.id;
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.bio,
        CASE WHEN f2.follower_id IS NOT NULL THEN 1 ELSE 0 END as is_following
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       LEFT JOIN follows f2 ON f2.follower_id = ? AND f2.following_id = u.id
       WHERE f.following_id = ?`,
      [currentUserId, targetId]
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── FOLLOWING D'UN USER ──────────────────────────────────────────────────
router.get('/:id/following', authMiddleware, async (req, res) => {
  const targetId = req.params.id;
  const currentUserId = req.user.id;
  try {
    const [users] = await db.execute(
      `SELECT u.id, u.username, u.bio,
        CASE WHEN f2.follower_id IS NOT NULL THEN 1 ELSE 0 END as is_following
       FROM follows f
       JOIN users u ON u.id = f.following_id
       LEFT JOIN follows f2 ON f2.follower_id = ? AND f2.following_id = u.id
       WHERE f.follower_id = ?`,
      [currentUserId, targetId]
    );
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── SUGGESTIONS ──────────────────────────────────────────────────────────
router.get('/:id/suggestions', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [suggestions] = await db.execute(
      `SELECT id, username, bio FROM users
       WHERE id != ?
       AND id NOT IN (SELECT following_id FROM follows WHERE follower_id = ?)
       ORDER BY RAND() LIMIT 5`,
      [userId, userId]
    );
    res.json({ suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── FOLLOW avec ajout rétroactif ─────────────────────────────────────────
router.post('/:id/follow', authMiddleware, async (req, res) => {
  const followerId  = req.user.id;
  const followingId = parseInt(req.params.id);

  if (followerId === followingId)
    return res.status(400).json({ error: 'Tu ne peux pas te suivre toi-même' });

  try {
    const [existing] = await db.execute(
      'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    if (existing.length > 0)
      return res.status(409).json({ error: 'Déjà suivi' });

    await db.execute(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );

    const pipe = redis.pipeline();
    pipe.sadd(`user:${followingId}:followers`, followerId.toString());
    pipe.sadd(`user:${followerId}:following`, followingId.toString());
    pipe.del(`cache:user:${followingId}`);
    pipe.del(`cache:user:${followerId}`);

    // ─── Ajout rétroactif ────────────────────────────────────────────────
    // Récupérer les 20 derniers posts de la personne suivie
    // et les pousser dans la timeline du follower
    const [recentPosts] = await db.execute(
      'SELECT id FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [followingId]
    );
    recentPosts.forEach(post => {
      pipe.lpush(`timeline:${followerId}`, post.id.toString());
    });
    if (recentPosts.length > 0) {
      pipe.ltrim(`timeline:${followerId}`, 0, 999);
    }
    // ─────────────────────────────────────────────────────────────────────

    await pipe.exec();
    res.json({ message: 'Tu suis maintenant cet utilisateur', following: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── UNFOLLOW ─────────────────────────────────────────────────────────────
router.delete('/:id/follow', authMiddleware, async (req, res) => {
  const followerId  = req.user.id;
  const followingId = parseInt(req.params.id);

  try {
    await db.execute(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );
    const pipe = redis.pipeline();
    pipe.srem(`user:${followingId}:followers`, followerId.toString());
    pipe.srem(`user:${followerId}:following`, followingId.toString());
    pipe.del(`cache:user:${followingId}`);
    pipe.del(`cache:user:${followerId}`);
    await pipe.exec();

    res.json({ message: 'Unfollow effectué', following: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
