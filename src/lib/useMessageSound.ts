import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Android channel for chat messages — low priority, no heads-up, only sound
async function ensureChatChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat_messages', {
      name: 'پیامی تازە',
      importance: Notifications.AndroidImportance.DEFAULT, // no heads-up banner, just sound
      enableVibrate: false,
      sound: 'default',
      showBadge: false,
    });
  }
}

/**
 * Play the soft in-app message notification sound.
 * Uses a local notification with sound only (no banner in foreground).
 */
export async function playMessageSound() {
  try {
    await ensureChatChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '',
        body: '',
        sound: 'default', // system default — short, soft ping
        badge: 0,
        data: { silent: true },
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    // Silently fail — notification sound is non-critical
    console.warn('playMessageSound error:', e);
  }
}

/**
 * Show a real visible notification when the app is in background/closed.
 * This is called from Supabase realtime subscriptions in _layout or background tasks.
 */
export async function showChatNotification(
  senderName: string,
  messageText: string,
  chatId?: string
) {
  try {
    await ensureChatChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: senderName || 'پیامی تازە',
        body: messageText || '...',
        sound: 'default',
        badge: 1,
        data: { chatId },
        channelId: 'chat_messages',
      },
      trigger: null,
    });
  } catch (e) {
    console.warn('showChatNotification error:', e);
  }
}
