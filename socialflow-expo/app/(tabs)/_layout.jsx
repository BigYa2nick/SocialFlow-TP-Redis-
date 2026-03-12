import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: { paddingBottom: 6, height: 62, borderTopColor: COLORS.border, backgroundColor: COLORS.surface },
      headerStyle: { backgroundColor: COLORS.primaryDark },
      headerTintColor: COLORS.textWhite,
      headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
    }}>
      <Tabs.Screen name="home"      options={{ headerTitle: 'SocialFlow', tabBarLabel: 'Accueil',   tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🏠</Text> }} />
      <Tabs.Screen name="followers" options={{ headerTitle: 'Communauté',   tabBarLabel: 'Communauté', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👥</Text> }} />
      <Tabs.Screen name="trending"  options={{ headerTitle: '🔥 Tendances', tabBarLabel: 'Tendances',  tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>🔥</Text> }} />
      <Tabs.Screen name="profile"   options={{ headerTitle: 'Mon Profil',   tabBarLabel: 'Profil',     tabBarIcon: ({ color }) => <Text style={{ fontSize: 22 }}>👤</Text> }} />
    </Tabs>
  );
}
