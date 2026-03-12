import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/api';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Erreur', 'Remplis tous les champs');
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password);
      Alert.alert('Succès', 'Compte créé ! Connecte-toi.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') }
      ]);
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.error || 'Inscription impossible');
      console.error('Erreur inscription :', err);
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
      <Text style={styles.subtitle}>Crée ton compte</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
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

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>S'inscrire</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/login')}>
        <Text style={styles.link}>Déjà un compte ? Connecte-toi</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#000000' },
  logo:       { fontSize: 36, fontWeight: 'bold', color: '#1d4ed8', textAlign: 'center', marginBottom: 8 },
  subtitle:   { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  input:      { borderWidth: 1, borderColor: '#cbd5e1',color:'#ffffff', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 16 },
  btn:        { backgroundColor: '#1d4ed8', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 16 },
  btnText:    { color: '#000000', fontWeight: 'bold', fontSize: 16 },
  link:       { textAlign: 'center', color: '#1d4ed8', fontSize: 14 },
});
