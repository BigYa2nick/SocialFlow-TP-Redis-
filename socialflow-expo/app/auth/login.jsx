import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/api';
import { COLORS } from '../../constants/theme';


export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    setLoading(true);
    try {

      console.log('URL:', `${API_URL}/api/auth/login`);
      console.log('Body:', { email, password });
      
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'Connexion impossible, verifiez vos identifiants');
      console.error('Erreur connexion :', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>SocialFlow</Text>
      <Text style={styles.subtitle}>Connecte-toi pour continuer</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Se connecter</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/auth/register')}>
        <Text style={styles.link}>Pas de compte ? Inscris-toi</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: COLORS.background },
  logo:       { fontSize: 36, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  input:      { borderWidth: 1, borderColor: COLORS.border, color: COLORS.textWhite, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16},
  btn:        { backgroundColor: COLORS.primary, padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnText:    { color: COLORS.textWhite, fontWeight: 'bold', fontSize: 16 },
  link:       { textAlign: 'center', color: COLORS.primary, fontSize: 14 },
});
