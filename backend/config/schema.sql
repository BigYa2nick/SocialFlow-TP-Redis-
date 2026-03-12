-- ─────────────────────────────────────────────────
-- SocialFlow — Schéma MySQL
-- À exécuter dans phpMyAdmin ou MySQL CLI
-- ─────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS socialflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE socialflow;

-- Table utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(50)  UNIQUE NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,          -- hashé avec bcrypt
  bio         TEXT,
  avatar      VARCHAR(255) DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table posts
CREATE TABLE IF NOT EXISTS posts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  content     TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table relations followers (qui suit qui)
CREATE TABLE IF NOT EXISTS follows (
  follower_id INT NOT NULL,   -- celui qui suit
  following_id INT NOT NULL,  -- celui qui est suivi
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table likes
CREATE TABLE IF NOT EXISTS likes (
  user_id  INT NOT NULL,
  post_id  INT NOT NULL,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);
