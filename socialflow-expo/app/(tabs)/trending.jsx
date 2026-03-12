import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import axios from 'axios';
import { API_URL } from '../../constants/api';
import PostCard from '../../components/PostCard';
import SkeletonList from '../../components/SkeletonList';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function TrendingScreen() {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrending = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts/trending`);
      setPosts(res.data.posts || []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchTrending(); }, []);

  return (
    <FlatList
      style={styles.container}
      data={posts}
      keyExtractor={item => item.id.toString()}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrending(); }} colors={[COLORS.primary]} />}
      renderItem={({ item, index }) => (
        <View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index < 3 ? MEDALS[index] : `#${index + 1}`}</Text>
          </View>
          <PostCard post={item} />
        </View>
      )}
      ListHeaderComponent={<Text style={styles.header}> Top posts 🔥</Text>}
      ListEmptyComponent={loading ? <SkeletonList count={4} /> : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Aucun post aujourd'hui</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  header:     { fontSize: FONTS.title, fontWeight: 'bold', color: COLORS.textWhite, padding: 16, paddingBottom: 8 },
  rankBadge:  { paddingHorizontal: 20, paddingTop: 8 },
  rankText:   { fontSize: FONTS.title, fontWeight: 'bold',color: COLORS.textWhite },
  empty:      { alignItems: 'center', paddingTop: 80 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyText:  { fontSize: FONTS.large, color: COLORS.textMuted },
});
