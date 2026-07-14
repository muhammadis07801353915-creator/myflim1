import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home, BarChart2, Settings, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ShowroomTabsLayout() {
  const insets = useSafeAreaInsets();

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
            fontFamily: 'NRT-Regular',
            fontSize: 11,
            fontWeight: '700',
            marginBottom: 8,
          }
        }}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'ماڵەوە',
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="data"
            options={{
              title: 'داتاکان',
              tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="chats"
            options={{
              title: 'نامەکان',
              tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'پرۆفایل',
              tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}
