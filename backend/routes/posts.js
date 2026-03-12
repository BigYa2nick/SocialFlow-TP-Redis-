const express = require('express');
const router = express.Router();
const db = require('../config/mysql');
const redis = require('../config/redis');
const authMiddleware = require('../middleware/auth');

// ─── CRÉER UN POST ────────────────────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  if (!content?.trim()) return res.status(400).json({ error: 'Contenu vide' });

  try {
    const [result] = await db.execute(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [userId, content]
    );
    const postId = result.insertId;
    const ts = Math.floor(Date.now() / 1000);

    await redis.zadd('trending:posts:today', ts, postId.toString());

    const followers = await redis.smembers(`user:${userId}:followers`);
    const pipe = redis.pipeline();
    [...followers, userId.toString()].forEach(fid => {
      pipe.lpush(`timeline:${fid}`, postId.toString());
      pipe.ltrim(`timeline:${fid}`, 0, 999);
    });
    pipe.hincrby(`user:${userId}`, 'post_count', 1);
    await pipe.exec();
    await redis.del(`cache:user:${userId}`);

    res.status(201).json({ message: 'Post publié', postId, content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── TOUS LES POSTS (accueil global) ─────────────────────────────────────
// GET /api/posts/all — du plus récent au plus ancien
router.get('/all', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
       const [posts] = await db.execute(
      `SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      [userId]
    );
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── TIMELINE (posts des gens suivis) ────────────────────────────────────
router.get('/timeline', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const postIds = await redis.lrange(`timeline:${userId}`, 0, 29);
    if (!postIds.length) return res.json({ posts: [] });

    const placeholders = postIds.map(() => '?').join(',');
    const [posts] = await db.execute(
      `SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id IN (${placeholders})
       ORDER BY p.created_at DESC`,
      [userId, ...postIds]
    );
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── TOP POSTS DU JOUR ────────────────────────────────────────────────────
router.get('/trending', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const topPostIds = await redis.zrevrange('trending:posts:today', 0, 9);
    if (!topPostIds.length) return res.json({ posts: [] });

    const placeholders = topPostIds.map(() => '?').join(',');
    const [posts] = await db.execute(
      `SELECT p.*, u.username,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id IN (${placeholders})
       ORDER BY p.likes_count DESC`,
      [userId, ...topPostIds]
    );
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── POSTS D'UN UTILISATEUR ───────────────────────────────────────────────
router.get('/user/:id', authMiddleware, async (req, res) => {
  const targetId = req.params.id;
  const userId = req.user.id;
  try {
    const [posts] = await db.execute(
      `SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as user_liked
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC LIMIT 30`,
      [userId, targetId]
    );
    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// ─── LIKER / UNLIKER ──────────────────────────────────────────────────────
router.post('/:id/like', authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const [existing] = await db.execute(
      'SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]
    );
    if (existing.length > 0) {
      await db.execute('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      await db.execute('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', [postId]);
      await redis.zincrby('trending:posts:today', -1, postId.toString());
      return res.json({ liked: false });
    }
    await db.execute('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
    await db.execute('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
    await redis.zincrby('trending:posts:today', 1, postId.toString());
    res.json({ liked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── SUPPRIMER UN POST ────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, userId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Non autorisé' });

    await db.execute('DELETE FROM posts WHERE id = ?', [postId]);
    const pipe = redis.pipeline();
    pipe.zrem('trending:posts:today', postId.toString());
    pipe.hincrby(`user:${userId}`, 'post_count', -1);
    pipe.del(`cache:user:${userId}`);
    await pipe.exec();

    res.json({ message: 'Post supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ─── MODIFIER UN POST ─────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Contenu vide' });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, userId]
    );
    if (!rows.length) return res.status(403).json({ error: 'Non autorisé' });

    await db.execute('UPDATE posts SET content = ? WHERE id = ?', [content, postId]);
    res.json({ message: 'Post modifié', content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
