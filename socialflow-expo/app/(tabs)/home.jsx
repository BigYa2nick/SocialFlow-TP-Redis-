import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/PostCard';
import SkeletonList from '../../components/SkeletonList';
import Toast, { useToast } from '../../components/Toast';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/theme';

export default function HomeScreen() {
  const { user } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [content, setContent]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting]       = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts/all`);
      setPosts(res.data.posts || []);
    } catch { showToast('Impossible de charger les posts', 'error'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, []);

  const handlePost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await axios.post(`${API_URL}/api/posts`, { content });
      setContent('');
      showToast('Post publié !', 'success');
      fetchPosts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Impossible de publier', 'error');
    } finally { setPosting(false); }
  };

  const handleDelete = (postId) => { setPosts(p => p.filter(x => x.id !== postId)); showToast('Post supprimé', 'info'); };
  const handleUpdate = (postId, c) => { setPosts(p => p.map(x => x.id === postId ? { ...x, content: c } : x)); showToast('Post modifié', 'success'); };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast {...toast} onHide={hideToast} />
      <FlatList
        data={posts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <PostCard post={item} onDelete={handleDelete} onUpdate={handleUpdate} onLike={fetchPosts} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          <View style={styles.composer}>
            <View style={styles.composerRow}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase()}</Text></View>
              <TextInput style={styles.composerInput} placeholder="Quoi de neuf ?" placeholderTextColor={COLORS.textMuted} value={content} onChangeText={setContent} multiline maxLength={280} />
            </View>
            <View style={styles.composerFooter}>
              <Text style={[styles.charCount, content.length > 250 && { color: COLORS.error }]}>{content.length}/280</Text>
              <TouchableOpacity style={[styles.postBtn, (!content.trim() || posting) && styles.postBtnDisabled]} onPress={handlePost} disabled={posting || !content.trim()}>
                <Text style={styles.postBtnText}>{posting ? '...' : 'Publier'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={loading ? <SkeletonList count={5} /> : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Aucun post pour l'instant</Text>
            <Text style={styles.emptySubtext}>Sois le premier à publier !</Text>
          </View>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  composer:        { backgroundColor: COLORS.background, padding: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  composerRow:     { flexDirection: 'row', gap: 10, marginBottom: 10 },
  avatar:          { width: 42, height: 42, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText:      { color: COLORS.textWhite, fontWeight: 'bold', fontSize: FONTS.large },
  composerInput:   { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 10, fontSize: FONTS.medium, minHeight: 60, color: COLORS.textWhite },
  composerFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  charCount:       { color: COLORS.textMuted, fontSize: FONTS.small },
  postBtn:         { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.full },
  postBtnDisabled: { backgroundColor: COLORS.primaryLight, opacity: 0.5 },
  postBtnText:     { color: COLORS.textWhite, fontWeight: 'bold', fontSize: FONTS.body },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyText:       { fontSize: FONTS.title, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtext:    { fontSize: FONTS.body, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});
