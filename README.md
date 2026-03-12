# 🚀 SocialFlow — Réseau Social Redis + MySQL + React

## Stack technique
- **Frontend** : React (Create React App)
- **Backend** : Node.js + Express
- **Base de données** : MySQL (XAMPP)
- **Cache / Temps réel** : Redis (Docker)

---

## 📁 Structure du projet

```
socialflow/
├── backend/
│   ├── config/
│   │   ├── mysql.js        → Connexion MySQL (pool)
│   │   ├── redis.js        → Connexion Redis (ioredis)
│   │   └── schema.sql      → Tables MySQL à créer
│   ├── middleware/
│   │   └── auth.js         → Vérifie la session Redis
│   ├── routes/
│   │   ├── auth.js         → /api/auth (register, login, logout)
│   │   ├── posts.js        → /api/posts (créer, timeline, like, trending)
│   │   └── users.js        → /api/users (profil, follow, unfollow)
│   ├── .env                → Variables d'environnement
│   └── server.js           → Point d'entrée Express
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.jsx  → Gestion auth globale
        ├── pages/               → Login, Register, Home, Profile
        └── components/          → Navbar, PostCard, etc.
```

---

## ⚙️ Installation & Démarrage

### 1. Prérequis
- XAMPP lancé (Apache + MySQL)
- Docker avec Redis : `docker run -d --name redis-socialflow -p 6379:6379 redis:7-alpine`
- Node.js installé

### 2. Base de données MySQL
1. Ouvre **phpMyAdmin** → http://localhost/phpmyadmin
2. Crée une base `socialflow`
3. Importe le fichier `backend/config/schema.sql`

### 3. Backend
```bash
cd backend
npm install
# Modifier .env si besoin (mot de passe MySQL, etc.)
npm run dev
# → Serveur sur http://localhost:5000
```

### 4. Frontend
```bash
cd frontend
npm install
npm start
# → App sur http://localhost:3000
```

---

## 🔌 API Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Inscription |
| POST | /api/auth/login | ❌ | Connexion → retourne token |
| POST | /api/auth/logout | ✅ | Déconnexion |
| POST | /api/posts | ✅ | Créer un post |
| GET | /api/posts/timeline | ✅ | Timeline (depuis Redis) |
| POST | /api/posts/:id/like | ✅ | Liker/unliker |
| GET | /api/posts/trending | ✅ | Top posts du jour |
| GET | /api/users/:id | ✅ | Profil utilisateur |
| POST | /api/users/:id/follow | ✅ | Suivre |
| DELETE | /api/users/:id/follow | ✅ | Ne plus suivre |
| GET | /api/users/:id/suggestions | ✅ | Suggestions |

---

## 🗃️ Rôle de Redis dans l'app

| Clé Redis | Type | Contenu | TTL |
|-----------|------|---------|-----|
| `sess:{token}` | String JSON | Données de session | 30 min |
| `user:{id}:session` | String | Token actif de l'user | 30 min |
| `cache:user:{id}` | String JSON | Profil en cache | 5 min |
| `user:{id}:followers` | Set | IDs des followers | Permanent |
| `user:{id}:following` | Set | IDs des following | Permanent |
| `timeline:{id}` | List | IDs des posts récents | Permanent |
| `trending:posts:today` | Sorted Set | Posts triés par likes | Permanent |
