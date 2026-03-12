import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/api';

const AuthContext = createContext(null);

// Intercepteur axios — ajoute le token automatiquement sur CHAQUE requête
// C'est plus fiable que axios.defaults.headers sur mobile
axios.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('sf_token');
  if (token) {
    config.headers['Authorization'] = token;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Au démarrage : récupérer session depuis AsyncStorage
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('sf_token');
        const savedUser  = await AsyncStorage.getItem('sf_user');
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error('Erreur chargement session :', e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { token: newToken, user: userData } = res.data;

    await AsyncStorage.setItem('sf_token', newToken);
    await AsyncStorage.setItem('sf_user', JSON.stringify(userData));

    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password) => {
    await axios.post(`${API_URL}/api/auth/register`, { username, email, password });
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (e) {}
    await AsyncStorage.removeItem('sf_token');
    await AsyncStorage.removeItem('sf_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);