import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Modal, Animated } from 'react-native';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/theme';

export default function PostCard({ post, onDelete, onUpdate, onLike }) {
  const { user } = useAuth();
  const [editing, setEditing]         = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [liked, setLiked]             = useState(post.user_liked === 1);
  const [likesCount, setLikesCount]   = useState(post.likes_count);
  const isOwner = user?.id === post.user_id;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.5, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,   duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const handleLike = async () => {
    animateLike();
    try {
      const res = await axios.post(`${API_URL}/api/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
      onLike?.();
    } catch { Alert.alert('Erreur', 'Impossible de liker'); }
  };

  const handleDelete = () => {
    Alert.alert('Supprimer', 'Supprimer ce post ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        try {
          await axios.delete(`${API_URL}/api/posts/${post.id}`);
          onDelete?.(post.id);
        } catch { Alert.alert('Erreur', 'Impossible de supprimer'); }
      }}
    ]);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await axios.put(`${API_URL}/api/posts/${post.id}`, { content: editContent });
      setEditing(false);
      onUpdate?.(post.id, editContent);
    } catch { Alert.alert('Erreur', 'Impossible de modifier'); }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.username?.[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>@{post.username}</Text>
          <Text style={styles.date}>
            {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isOwner && (
          <View style={styles.ownerActions}>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn}><Text>✏️</Text></TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}><Text>🗑️</Text></TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLike} style={styles.likeBtn}>
          <Animated.Text style={[styles.likeIcon, { transform: [{ scale: scaleAnim }] }]}>
            {liked ? '❤️' : '🤍'}
          </Animated.Text>
          <Text style={[styles.likeCount, liked && { color: COLORS.liked }]}>{likesCount}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Modifier le post</Text>
            <TextInput style={styles.modalInput} value={editContent} onChangeText={setEditContent} multiline maxLength={280} />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEdit}>
                <Text style={styles.saveText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card:           { backgroundColor: COLORS.surface, marginHorizontal: 12, marginVertical: 6, borderRadius: RADIUS.lg, padding: 16, ...SHADOWS.sm },
  header:         { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar:         { width: 42, height: 42, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText:     { color: COLORS.textWhite, fontWeight: 'bold', fontSize: FONTS.large },
  headerInfo:     { flex: 1 },
  username:       { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: FONTS.medium },
  date:           { color: COLORS.textMuted, fontSize: FONTS.small, marginTop: 2 },
  ownerActions:   { flexDirection: 'row', gap: 4 },
  iconBtn:        { padding: 6 },
  content:        { fontSize: FONTS.medium, color: COLORS.textPrimary, lineHeight: 22, marginBottom: 12 },
  footer:         { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 10 },
  likeBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  likeIcon:       { fontSize: 20 },
  likeCount:      { fontSize: FONTS.body, color: COLORS.textMuted, fontWeight: '500' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: 20 },
  modalTitle:     { fontSize: FONTS.title, fontWeight: 'bold', marginBottom: 16, color: COLORS.textPrimary },
  modalInput:     { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: 12, minHeight: 80, fontSize: FONTS.medium, marginBottom: 16 },
  modalBtns:      { flexDirection: 'row', gap: 10 },
  cancelBtn:      { flex: 1, padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText:     { color: COLORS.textSecondary, fontWeight: 'bold' },
  saveBtn:        { flex: 1, padding: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText:       { color: COLORS.textWhite, fontWeight: 'bold' },
});
