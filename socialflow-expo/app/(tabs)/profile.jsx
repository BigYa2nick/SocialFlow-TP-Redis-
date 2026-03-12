import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/PostCard';
import SkeletonList from '../../components/SkeletonList';
import Toast, { useToast } from '../../components/Toast';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          axios.get(`${API_URL}/api/users/${user.id}`),
          axios.get(`${API_URL}/api/posts/user/${user.id}`),
        ]);
        setProfile(profileRes.data.user);
        setPosts(postsRes.data.posts || []);
      } catch (err) {
        if (err.response?.status !== 401) showToast('Impossible de charger le profil', 'error');
      } finally { setLoading(false); }
    };
    load();
  }, [user]);

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: async () => {
        router.replace('/auth/login');
        await logout();
      }}
    ]);
  };

  const handleDelete = (postId) => {
    setPosts(p => p.filter(x => x.id !== postId));
    showToast('Post supprimé', 'info');
  };

  const handleUpdate = (postId, c) => {
    setPosts(p => p.map(x => x.id === postId ? { ...x, content: c } : x));
    showToast('Post modifié', 'success');
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <Toast {...toast} onHide={hideToast} />

      {/* Carte profil */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{profile?.username?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>@{profile?.username}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        <View style={styles.stats}>
          {[
            { label: 'Posts',     value: profile?.post_count      ?? 0 },
            { label: 'Followers', value: profile?.followers_count  ?? 0 },
            { label: 'Following', value: profile?.following_count  ?? 0 },
          ].map(s => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statNum}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mes posts */}
      <Text style={styles.sectionTitle}> Mes posts</Text>
      {loading ? <SkeletonList count={3} /> : posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✏️</Text>
          <Text style={styles.emptyText}>Aucun post encore</Text>
        </View>
      ) : (
        posts.map(post => (
          <PostCard key={post.id} post={post} onDelete={handleDelete} onUpdate={handleUpdate} />
        ))
      )}

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  profileCard:   { backgroundColor: COLORS.background, alignItems: 'center', padding: 28, marginBottom: 8, ...SHADOWS.sm },
  avatarCircle:  { width: 80, height: 80, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:    { fontSize: 36, fontWeight: 'bold', color: COLORS.textWhite },
  username:      { fontSize: FONTS.heading, fontWeight: 'bold', color: COLORS.textWhite, marginBottom: 4 },
  email:         { fontSize: FONTS.body, color: COLORS.textSecondary, marginBottom: 20 },
  stats:         { flexDirection: 'row', gap: 32 },
  stat:          { alignItems: 'center' },
  statNum:       { fontSize: FONTS.heading, fontWeight: 'bold', color: COLORS.primary },
  statLabel:     { fontSize: FONTS.small, color: COLORS.textSecondary },
  sectionTitle:  { fontSize: FONTS.large, fontWeight: 'bold', color: COLORS.textWhite, paddingHorizontal: 16, paddingVertical: 12 },
  empty:         { alignItems: 'center', padding: 40 },
  emptyIcon:     { fontSize: 36, marginBottom: 8 },
  emptyText:     { fontSize: FONTS.medium, color: COLORS.textMuted },
  logoutBtn:     { margin: 16, padding: 16, backgroundColor: COLORS.errorFade, borderRadius: RADIUS.md, alignItems: 'center' },
  logoutText:    { color: COLORS.error, fontWeight: 'bold', fontSize: FONTS.large },
});
