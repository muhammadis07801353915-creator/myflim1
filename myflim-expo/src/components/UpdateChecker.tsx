import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Download } from 'lucide-react-native';
import {
  AppUpdateInfo,
  checkForAvailableUpdate,
  downloadAndInstallUpdate,
} from '../utils/appUpdate';

export default function UpdateChecker() {
  const [showModal, setShowModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const data = await checkForAvailableUpdate();
      if (data) {
        setUpdateInfo(data);
        setShowModal(true);
      }
    } catch (e) {
      // Silently ignore update check errors
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo) return;

    try {
      setIsInstalling(true);
      await downloadAndInstallUpdate(updateInfo);
    } catch (e) {
      Alert.alert(
        'هەڵە',
        'داگرتن یان دامەزراندنی نوێکردنەوە سەرکەوتوو نەبوو. دڵنیابەوە کە ڕێگەدان بە "Install unknown apps" چالاکە.'
      );
    } finally {
      setIsInstalling(false);
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
            <Download size={36} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>نوێکردنەوەی بەردەستە!</Text>
          <Text style={styles.version}>وەشانی {updateInfo.version}</Text>

          {/* Release Notes */}
          <View style={styles.notesBox}>
            <Text style={styles.notes}>
              {updateInfo.releaseNotes || 'نوێکردنەوەی نوێ بەردەستە بۆ داگرتن و دامەزراندن.'}
            </Text>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.updateBtn, isInstalling && styles.updateBtnDisabled]}
            onPress={handleUpdate}
            disabled={isInstalling}
          >
            {isInstalling ? (
              <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Download size={18} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.updateBtnText}>
              {isInstalling ? 'دادەگیرێت...' : 'نوێکردنەوە'}
            </Text>
          </TouchableOpacity>

          {!updateInfo.mandatory && (
            <TouchableOpacity style={styles.laterBtn} onPress={handleLater} disabled={isInstalling}>
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
  updateBtnDisabled: {
    opacity: 0.7,
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
