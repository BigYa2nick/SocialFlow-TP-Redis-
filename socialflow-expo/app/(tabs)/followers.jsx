import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import Toast, { useToast } from '../../components/Toast';
import SkeletonList from '../../components/SkeletonList';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/theme';

function UserRow({ item, onFollow, currentUserId }) {
  const isMe = item.id === currentUserId;
  return (
    <View style={styles.userRow}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{item.username?.[0]?.toUpperCase()}</Text></View>
      <View style={styles.userInfo}>
        <Text style={styles.username}>@{item.username}</Text>
        {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
      </View>
      {!isMe && (
        <TouchableOpacity style={[styles.followBtn, item.is_following && styles.followingBtn]} onPress={() => onFollow(item.id, item.is_following)}>
          <Text style={[styles.followBtnText, item.is_following && styles.followingText]}>{item.is_following ? 'Suivi ✓' : 'Suivre'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function FollowersScreen() {
  const { user } = useAuth();
  const [query, setQuery]             = useState('');
  const [tab, setTab]                 = useState('followers'); // 'followers' | 'following' | 'search'
  const [followers, setFollowers]     = useState([]);
  const [following, setFollowing]     = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searching, setSearching]     = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchSocial = useCallback(async () => {
    try {
      const [follRes, followRes, suggestRes] = await Promise.all([
        axios.get(`${API_URL}/api/users/${user.id}/followers`),
        axios.get(`${API_URL}/api/users/${user.id}/following`),
        axios.get(`${API_URL}/api/users/${user.id}/suggestions`),
      ]);
      setFollowers(follRes.data.users || []);
      setFollowing(followRes.data.users || []);
      setSuggestions(suggestRes.data.suggestions || []);
    } catch { showToast('Erreur de chargement', 'error'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user.id]);

  useEffect(() => { fetchSocial(); }, []);

  const handleSearch = useCallback(async (text) => {
    setQuery(text);
    if (!text.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await axios.get(`${API_URL}/api/users/search?q=${text}`);
      setSearchResults(res.data.users || []);
    } catch {} finally { setSearching(false); }
  }, []);

  const handleFollow = async (targetId, isFollowing) => {
    try {
      if (isFollowing) {
        await axios.delete(`${API_URL}/api/users/${targetId}/follow`);
        showToast('Unfollow effectué', 'info');
      } else {
        await axios.post(`${API_URL}/api/users/${targetId}/follow`);
        showToast('Tu suis cet utilisateur !', 'success');
      }
      fetchSocial();
      if (query) handleSearch(query);
    } catch (err) { showToast(err.response?.data?.error || 'Erreur', 'error'); }
  };

  const activeData = tab === 'followers' ? followers : tab === 'following' ? following : searchResults;

  return (
    <View style={styles.container}>
      <Toast {...toast} onHide={hideToast} />

      {/* Barre de recherche */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={(t) => { handleSearch(t); if (t) setTab('search'); else setTab('followers'); }}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearchResults([]); setTab('followers'); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Onglets */}
      {!query && (
        <View style={styles.tabs}>
          {['followers', 'following', 'suggestions'].map(t => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'followers' ? `Followers (${followers.length})` : t === 'following' ? `Following (${following.length})` : 'Suggestions'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Liste */}
      {loading ? <SkeletonList count={4} /> : (
        <FlatList
          data={tab === 'suggestions' ? suggestions : activeData}
          keyExtractor={item => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSocial(); }} colors={[COLORS.primary]} />}
          renderItem={({ item }) => <UserRow item={item} onFollow={handleFollow} currentUserId={user.id} />}
          ListEmptyComponent={
            searching ? <ActivityIndicator style={{ marginTop: 30 }} color={COLORS.primary} /> : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>{tab === 'followers' ? '👥' : tab === 'following' ? '🔭' : '💡'}</Text>
                <Text style={styles.emptyText}>
                  {tab === 'followers' ? 'Personne ne te suit encore' : tab === 'following' ? 'Tu ne suis personne encore' : 'Aucune suggestion'}
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  searchBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, margin: 12, borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10, ...SHADOWS.sm },
  searchIcon:      { fontSize: 16, marginRight: 8 },
  searchInput:     { flex: 1, fontSize: FONTS.medium, color: COLORS.textPrimary },
  clearBtn:        { color: COLORS.textMuted, fontSize: 16, padding: 4 },
  tabs:            { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 8 },
  tab:             { flex: 1, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, alignItems: 'center' },
  tabActive:       { backgroundColor: COLORS.primary },
  tabText:         { fontSize: FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive:   { color: COLORS.textWhite },
  userRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, marginHorizontal: 12, marginVertical: 4, borderRadius: RADIUS.lg, padding: 14, ...SHADOWS.sm },
  avatar:          { width: 46, height: 46, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText:      { color: COLORS.textWhite, fontWeight: 'bold', fontSize: FONTS.large },
  userInfo:        { flex: 1 },
  username:        { fontWeight: 'bold', color: COLORS.textPrimary, fontSize: FONTS.medium },
  bio:             { color: COLORS.textSecondary, fontSize: FONTS.small, marginTop: 2 },
  followBtn:       { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full },
  followingBtn:    { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  followBtnText:   { color: COLORS.textWhite, fontWeight: 'bold', fontSize: FONTS.small },
  followingText:   { color: COLORS.textSecondary },
  empty:           { alignItems: 'center', paddingTop: 60 },
  emptyIcon:       { fontSize: 40, marginBottom: 10 },
  emptyText:       { fontSize: FONTS.medium, color: COLORS.textMuted },
});
