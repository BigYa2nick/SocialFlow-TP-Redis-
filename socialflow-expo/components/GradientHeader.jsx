import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

// Simule un dégradé avec deux Views superposées
// Pour un vrai dégradé installe : npx expo install expo-linear-gradient
export default function GradientHeader({ title, right }) {
  return (
    <View style={styles.container}>
      <View style={styles.gradient} />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {right && <View>{right}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.primaryDark, paddingTop: 50, paddingBottom: 14 },
  gradient:  {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.3,
  },
  content:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title:    { color: COLORS.textWhite, fontSize: FONTS.title, fontWeight: 'bold' },
});
