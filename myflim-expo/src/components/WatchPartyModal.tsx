import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { Users, X, Send, Mic, MicOff, PhoneOff, CheckCircle2, User, AlertCircle, Copy, Share2 } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getColors } from '../theme/theme';

interface WatchPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendInvite: (friendUsername: string) => Promise<{ success: boolean; message?: string; shareUrl?: string }>;
  incomingInvite: any;
  onAcceptInvite: (invite: any) => void;
  onDeclineInvite: (inviteId: string) => void;
  activeParty: any;
  isHost: boolean;
  isMicOn: boolean;
  onToggleMic: () => void;
  onLeaveParty: () => void;
  partnerUsername: string;
  onNavigateToMovie?: (movieId: string | number) => void;
}

export default function WatchPartyModal({
  isOpen,
  onClose,
  onSendInvite,
  incomingInvite,
  onAcceptInvite,
  onDeclineInvite,
  activeParty,
  isHost,
  isMicOn,
  onToggleMic,
  onLeaveParty,
  partnerUsername,
  onNavigateToMovie,
}: WatchPartyModalProps) {
  const { theme, language } = useAppStore();
  const themeColors = getColors(theme);

  const [friendUsername, setFriendUsername] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdShareUrl, setCreatedShareUrl] = useState('');

  const handleSend = async () => {
    if (!friendUsername.trim()) return;

    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    setCreatedShareUrl('');

    const res = await onSendInvite(friendUsername.trim());
    setSending(false);

    if (res.success) {
      setSuccessMsg(language === 'ku' ? 'داوەتنامەکە بە سەرکەوتوویی نێردرا!' : 'Invite sent successfully!');
      if (res.shareUrl) setCreatedShareUrl(res.shareUrl);
      setFriendUsername('');
    } else {
      setErrorMsg(res.message || 'هەڵەیەک ڕوویدا');
    }
  };

  const shareLink = async () => {
    if (createdShareUrl) {
      try {
        await Share.share({ message: createdShareUrl });
      } catch (e) {}
    }
  };

  // 1. Incoming Invite Notification Modal
  if (incomingInvite && !activeParty) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: '#14151c', borderColor: 'rgba(204, 34, 47, 0.4)' }]}>
            <View style={styles.iconCircle}>
              <Users size={32} color="#CC222F" />
            </View>

            <Text style={styles.title}>
              {language === 'ku' ? 'داوەتنامەی سەیری فیلم پێکەوە! 🎬' : 'Watch Together Invite! 🎬'}
            </Text>

            <Text style={styles.subtitle}>
              <Text style={{ color: '#F87171', fontWeight: 'bold' }}>{incomingInvite.host_username}</Text>{' '}
              {language === 'ku' ? 'داوەتی کردووی بۆ سەیرکردنی فیلمی' : 'invited you to watch'}{' '}
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{incomingInvite.movie_title}</Text>{' '}
              {language === 'ku' ? 'پێکەوە' : 'together'}!
            </Text>

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                onPress={() => onDeclineInvite(incomingInvite.id)}
              >
                <Text style={styles.btnTxt}>{language === 'ku' ? 'ڕەتکردنەوە' : 'Decline'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#CC222F' }]}
                onPress={() => {
                  onAcceptInvite(incomingInvite);
                  if (onNavigateToMovie) onNavigateToMovie(incomingInvite.movie_id);
                }}
              >
                <CheckCircle2 size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={[styles.btnTxt, { color: '#FFF', fontWeight: 'bold' }]}>
                  {language === 'ku' ? 'قبوڵکردن' : 'Accept'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // 2. Active Party Control Panel Overlay (Floating Bar)
  if (activeParty) {
    return (
      <View style={styles.floatingBar}>
        <View style={styles.userRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarTxt}>{partnerUsername.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.partnerName}>{partnerUsername}</Text>
            <Text style={styles.roleTxt}>
              {isHost ? (language === 'ku' ? 'سەرپەرشتیار 👑' : 'Host 👑') : (language === 'ku' ? 'بەشداربوو 🎬' : 'Guest 🎬')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.iconActionBtn, isMicOn ? { backgroundColor: '#10B981' } : { backgroundColor: 'rgba(255,255,255,0.1)' }]}
          onPress={onToggleMic}
        >
          {isMicOn ? <Mic size={18} color="#FFF" /> : <MicOff size={18} color="rgba(255,255,255,0.6)" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.3)', borderWidth: 1 }]}
          onPress={onLeaveParty}
        >
          <PhoneOff size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  }

  if (!isOpen) return null;

  // 3. Send Invite Modal
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: '#14151c' }]} onPress={() => {}}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#CC222F" />
              <Text style={styles.title}>{language === 'ku' ? 'سەیری فیلم پێکەوە 👥' : 'Watch Together 👥'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={styles.label}>{language === 'ku' ? 'ناوی بەکارهێنەری هاوڕێکەت (Username)' : 'Friend\'s Username'}</Text>
            <TextInput
              style={styles.input}
              value={friendUsername}
              onChangeText={setFriendUsername}
              placeholder={language === 'ku' ? 'یوزەرنەیمەکەی بنووسە (نموونە: Hamais400)' : 'Type username...'}
              placeholderTextColor="#888"
              autoCapitalize="none"
            />

            {errorMsg ? (
              <View style={styles.alertErr}>
                <AlertCircle size={16} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: 'bold' }}>{errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.alertOk}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>{successMsg}</Text>
              </View>
            ) : null}

            {createdShareUrl ? (
              <TouchableOpacity style={styles.shareBtn} onPress={shareLink}>
                <Share2 size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
                  {language === 'ku' ? 'ناردنی لینکی داوەت لە واتسئەپ / تێلیگرام' : 'Share Direct Link'}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.sendBtn, (!friendUsername.trim() || sending) && { opacity: 0.5 }]}
              onPress={handleSend}
              disabled={!friendUsername.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Send size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.sendBtnTxt}>{language === 'ku' ? 'ناردنی داوەتنامە بە ناوی بەکارهێنەر' : 'Send Invite by Username'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.directShareBtn}
              onPress={async () => {
                const res = await onSendInvite('Friend');
                if (res.shareUrl) {
                  Alert.alert(
                    language === 'ku' ? 'داوەتنامەی سەیری فیلم پێکەوە 🎬' : 'Watch Together Link',
                    language === 'ku' ? 'لینکی داوەتنامەکە دروستکرا و ئامادەیە بۆ ناردن! دەتوانیت لە واتسئەپ، تێلیگرام یان فەیسبووک بنێریت.' : 'Watch Party link is ready to share!'
                  );
                  try {
                    await Share.share({
                      title: 'سەیری فیلم پێکەوە 🎬',
                      message: `وەرە بەیەکەوە سەیری ئەم فیلمە بکەین! 🎬\n${res.shareUrl}`,
                      url: res.shareUrl
                    });
                  } catch (e) {}
                }
              }}
            >
              <Share2 size={16} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 'bold' }}>
                {language === 'ku' ? 'بەشکردنی لینکی داوەت لە واتسئەپ / تێلیگرام 🔗' : 'Share Direct Watch Link 🔗'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(204, 34, 47, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginVertical: 12,
    lineHeight: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  btnTxt: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFF',
    fontSize: 13,
  },
  alertErr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  alertOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginTop: 10,
  },
  directShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 13,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 10,
  },
  sendBtn: {
    backgroundColor: '#CC222F',
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  sendBtnTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  floatingBar: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    left: 16,
    backgroundColor: 'rgba(20, 21, 28, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(204, 34, 47, 0.4)',
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(204, 34, 47, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: {
    color: '#CC222F',
    fontWeight: 'bold',
    fontSize: 13,
  },
  partnerName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  roleTxt: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
