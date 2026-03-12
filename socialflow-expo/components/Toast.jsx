import { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';

export default function Toast({ message, type = 'success', visible, onHide }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const bgColor = { success: COLORS.success, error: COLORS.error, info: COLORS.primary }[type];
  const icon = { success: '✅', error: '❌', info: 'ℹ️' }[type];

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgColor, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

export function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => setToast({ visible: true, message, type });
  const hideToast = () => setToast(t => ({ ...t, visible: false }));
  return { toast, showToast, hideToast };
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: RADIUS.lg, zIndex: 9999, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  icon:    { fontSize: 16 },
  message: { color: '#fff', fontSize: FONTS.medium, fontWeight: '600', flex: 1 },
});
