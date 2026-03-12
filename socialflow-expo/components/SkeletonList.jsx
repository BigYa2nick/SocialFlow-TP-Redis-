import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { COLORS, RADIUS } from '../constants/theme';

function SkeletonItem() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.headerText}>
          <View style={styles.line} />
          <View style={[styles.line, { width: '40%', marginTop: 6 }]} />
        </View>
      </View>
      <View style={[styles.line, { width: '100%', height: 14, marginTop: 12 }]} />
      <View style={[styles.line, { width: '75%', height: 14, marginTop: 8 }]} />
    </Animated.View>
  );
}

export default function SkeletonList({ count = 4 }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => <SkeletonItem key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { backgroundColor: COLORS.surface, marginHorizontal: 12, marginVertical: 6, borderRadius: RADIUS.lg, padding: 16 },
  header:     { flexDirection: 'row', alignItems: 'center' },
  avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.border },
  headerText: { flex: 1, marginLeft: 10 },
  line:       { height: 12, backgroundColor: COLORS.border, borderRadius: RADIUS.sm, width: '60%' },
});
