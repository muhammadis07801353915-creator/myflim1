import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CURRENT_VERSION = '1.0.1';
const VERSION_URL = 'https://myflim.com/version.json';

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const a = parts1[i] || 0;
    const b = parts2[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }
  return 0;
}

export default function UpdateChecker() {
  const [showModal, setShowModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    downloadUrl: string;
    releaseNotes: string;
    mandatory: boolean;
  } | null>(null);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      
      if (compareVersions(data.version, CURRENT_VERSION) > 0) {
        setUpdateInfo(data);
        setShowModal(true);
      }
    } catch (e) {
      // Silently ignore update check errors
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo?.downloadUrl) return;
    try {
      await Linking.openURL(updateInfo.downloadUrl);
    } catch (e) {
      Alert.alert('هەڵە', 'ناتوانرێت لینکەکە بکرێتەوە');
    }
  };

  const handleLater = () => {
    if (updateInfo?.mandatory) {
      Alert.alert(
        'پێویستی بە ئەپدەیت هەیە',
        'ئەپەکە پێویستی بە نوێکردنەوەی ئیلزامیەتی هەیە بۆ کارکردن',
        [{ text: 'ئەپدەیت', onPress: handleUpdate }]
      );
    } else {
      setShowModal(false);
    }
  };

  if (!showModal || !updateInfo) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={showModal}
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Ionicons name="download" size={36} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>نوێکردنەوەی بەردەستە!</Text>
          <Text style={styles.version}>وەشانی {updateInfo.version}</Text>

          {/* Release Notes */}
          <View style={styles.notesBox}>
            <Text style={styles.notes}>{updateInfo.releaseNotes}</Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
            <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.updateBtnText}>نوێکردنەوە</Text>
          </TouchableOpacity>

          {!updateInfo.mandatory && (
            <TouchableOpacity style={styles.laterBtn} onPress={handleLater}>
              <Text style={styles.laterBtnText}>دواتر</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1a1d24',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#e50914',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    fontSize: 13,
    color: '#e50914',
    fontWeight: '600',
    marginBottom: 16,
  },
  notesBox: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  notes: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e50914',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 10,
  },
  updateBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  laterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  laterBtnText: {
    color: '#666',
    fontSize: 14,
  },
});
