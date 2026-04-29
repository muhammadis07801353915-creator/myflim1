import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Linking, Dimensions, Animated } from 'react-native';
import { Send, X, Facebook, Instagram, Music2, ExternalLink } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { supabase } from '../api/supabase';

const { width } = Dimensions.get('window');

export default function FloatingSocialButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState({
    telegram: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  });

  useEffect(() => {
    async function fetchLinks() {
      const { data } = await supabase.from('settings').select('*').in('key', ['telegram_link', 'facebook_link', 'instagram_link', 'tiktok_link']);
      if (data) {
        const newLinks = { telegram: '', facebook: '', instagram: '', tiktok: '' };
        data.forEach(item => {
          if (item.key === 'telegram_link') newLinks.telegram = item.value;
          if (item.key === 'facebook_link') newLinks.facebook = item.value;
          if (item.key === 'instagram_link') newLinks.instagram = item.value;
          if (item.key === 'tiktok_link') newLinks.tiktok = item.value;
        });
        setLinks(newLinks);
      }
    }
    fetchLinks();
  }, []);

  const openLink = (url: string) => {
    if (url) Linking.openURL(url);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
      >
        <Send size={28} color="white" style={styles.sendIcon} />
        <View style={styles.badge} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setIsOpen(false)}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} />
          </TouchableOpacity>

          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>سۆشیاڵ میدیا</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X color="#888" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.buttonGrid}>
              <SocialItem 
                icon={<Send size={20} color="white" />} 
                label="تێلیگرام" 
                color="#24A1DE" 
                onPress={() => openLink(links.telegram)}
                visible={!!links.telegram}
              />
              <SocialItem 
                icon={<Facebook size={20} color="white" />} 
                label="فەیسبووک" 
                color="#1877F2" 
                onPress={() => openLink(links.facebook)}
                visible={!!links.facebook}
              />
              <SocialItem 
                icon={<Instagram size={20} color="white" />} 
                label="ئینستاگرام" 
                color="#E1306C" 
                onPress={() => openLink(links.instagram)}
                visible={!!links.instagram}
              />
              <SocialItem 
                icon={<Music2 size={20} color="white" />} 
                label="تیک تۆک" 
                color="#000000" 
                onPress={() => openLink(links.tiktok)}
                visible={!!links.tiktok}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SocialItem({ icon, label, color, onPress, visible }: any) {
  if (!visible) return null;
  return (
    <TouchableOpacity 
      style={[styles.socialButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <View style={styles.socialLeft}>
        {icon}
        <Text style={styles.socialLabel}>{label}</Text>
      </View>
      <ExternalLink size={16} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#24A1DE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#24A1DE',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 999,
  },
  sendIcon: {
    transform: [{ rotate: '-15deg' }, { translateX: -2 }, { translateY: -2 }],
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    borderWidth: 2,
    borderColor: '#24A1DE',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A22',
    width: '100%',
    maxWidth: 320,
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonGrid: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
  },
  socialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
