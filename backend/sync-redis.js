// ─────────────────────────────────────────────────────────────
// sync-redis.js — Script de synchronisation MySQL → Redis
// Lance une seule fois : node sync-redis.js
// ─────────────────────────────────────────────────────────────

require('dotenv').config();
const db    = require('./config/mysql');
const redis = require('./config/redis');

async function syncRedis() {
  console.log('\n🔄 Synchronisation MySQL → Redis...\n');

  try {
    // ─── 1. TRENDING — tous les posts avec leur score de likes ───
    console.log('📊 Peuplement trending:posts:today...');
    const [posts] = await db.execute(
      'SELECT id, likes_count, created_at FROM posts'
    );

    const pipe = redis.pipeline();

    // Vider l'ancien trending
    pipe.del('trending:posts:today');

    posts.forEach(post => {
      // Score = likes_count + timestamp pour départager les égalités
      const ts = Math.floor(new Date(post.created_at).getTime() / 1000);
      const score = post.likes_count
      pipe.zadd('trending:posts:today', score, post.id.toString());
    });

    await pipe.exec();
    console.log(`   ✅ ${posts.length} posts ajoutés au trending\n`);

    // ─── 2. FOLLOWERS / FOLLOWING — Sets Redis ────────────────────
    console.log('👥 Peuplement followers/following...');
    const [follows] = await db.execute(
      'SELECT follower_id, following_id FROM follows'
    );

    const pipe2 = redis.pipeline();
    follows.forEach(({ follower_id, following_id }) => {
      pipe2.sadd(`user:${following_id}:followers`, follower_id.toString());
      pipe2.sadd(`user:${follower_id}:following`,  following_id.toString());
    });
    await pipe2.exec();
    console.log(`   ✅ ${follows.length} relations follow synchronisées\n`);

    // ─── 3. TIMELINES — 20 derniers posts par follower ────────────
    console.log('📰 Peuplement timelines...');
    const [users] = await db.execute('SELECT id FROM users');

    for (const user of users) {
      // Récupérer les IDs des gens que cet user suit
      const followingIds = await redis.smembers(`user:${user.id}:following`);

      if (!followingIds.length) continue;

      // Récupérer les 20 derniers posts de ces users
      const placeholders = followingIds.map(() => '?').join(',');
      const [userPosts] = await db.execute(
        `SELECT id FROM posts
         WHERE user_id IN (${placeholders})
         ORDER BY created_at DESC LIMIT 20`,
        followingIds
      );

      if (userPosts.length) {
        const pipe3 = redis.pipeline();
        pipe3.del(`timeline:${user.id}`);
        userPosts.forEach(p => pipe3.lpush(`timeline:${user.id}`, p.id.toString()));
        pipe3.ltrim(`timeline:${user.id}`, 0, 999);
        await pipe3.exec();
      }
    }
    console.log(`   ✅ Timelines synchronisées pour ${users.length} users\n`);

    console.log('🎉 Synchronisation terminée avec succès !\n');

  } catch (err) {
    console.error('❌ Erreur :', err.message);
  } finally {
    await redis.quit();
    process.exit(0);
  }
}

syncRedis();