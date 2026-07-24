import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Linking, StyleSheet, Animated } from 'react-native';
import { Send } from 'lucide-react-native';
import { supabase } from '../api/supabase';
import { COLORS } from '../theme/theme';

export default function FloatingSocialButton() {
  const [telegramLink, setTelegramLink] = useState('');
  const scale = new Animated.Value(1);

  useEffect(() => {
    async function fetchLink() {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'telegram_link')
        .single();
      if (data?.value) setTelegramLink(data.value);
    }
    fetchLink();
  }, []);

  if (!telegramLink) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.button}
      onPress={() => Linking.openURL(telegramLink)}
      onPressIn={() => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Send size={24} color="white" />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 130, // Adjusted further up to avoid bottom tab bar
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#24A1DE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24A1DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  }
});
