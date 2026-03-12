const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de connexions MySQL — réutilise les connexions au lieu d'en créer une à chaque requête
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,   // Max 10 connexions simultanées
  queueLimit: 0
});

// Test de connexion au démarrage
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connecté');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL erreur de connexion :', err.message);
  });

module.exports = pool;
