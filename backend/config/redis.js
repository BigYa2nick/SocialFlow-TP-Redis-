const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  // Si ton Redis Docker a un mot de passe : password: 'ton_mdp'
});

redis.on('connect', () => console.log('✅ Redis connecté'));
redis.on('error', (err) => console.error('❌ Redis erreur :', err.message));

module.exports = redis;
