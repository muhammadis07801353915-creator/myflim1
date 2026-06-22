import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home, Search, LayoutGrid, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../src/i18n/LanguageContext';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1 }}>
      {/* Main Content Area */}
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <Tabs screenOptions={{ 
          headerShown: false,
          tabBarActiveTintColor: '#CC222F',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            position: 'absolute',
            bottom: Platform.OS === 'web' ? 20 : Math.max(insets.bottom, 16),
            left: 20,
            right: 20,
            backgroundColor: '#ffffff',
            borderRadius: 30,
            height: 70,
            paddingBottom: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.15,
            shadowRadius: 15,
            borderTopWidth: 0,
            ...(Platform.OS === 'web' && { maxWidth: 500, alignSelf: 'center', left: 'auto', right: 'auto', width: '90%' })
          },
          tabBarItemStyle: {
            height: 70,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 8,
          }
        }}>
          <Tabs.Screen
            name="index"
            options={{
              title: t('tabs.home') || 'Home',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="companies"
            options={{
              title: t('tabs.companies') || 'Companies',
              tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: t('tabs.search') || 'Search',
              tabBarIcon: ({ focused, color, size }) => (
                <View className={focused ? "bg-[#CC222F]/10 p-1.5 rounded-full" : ""}>
                  <View className="relative">
                    <Search color={focused ? "#CC222F" : color} size={size} />
                    {focused && <View className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />}
                  </View>
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t('tabs.settings') || 'Settings',
              tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
