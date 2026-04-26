import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, getColors } from '../theme/theme';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { 
  Crown, 
  Bell, 
  Shield, 
  ChevronRight,
  Sun,
  Languages,
  LayoutGrid,
  Download,
  ScrollText,
  Camera,
  Pencil,
  X,
  CheckCircle2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, theme, updateUser, toggleTheme, language, setLanguage } = useAppStore();
  const t = translations[language];
  const themeColors = getColors(theme);
  
  const [showProModal, setShowProModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [newName, setNewName] = useState(user.name);

  // Default web admin code

  const handleAdminSubmit = () => {
    if (adminCode === '400500') {
      setShowAdminModal(false);
      setAdminCode('');
      // You can navigate to a specific admin webview or native screen here later
      Alert.alert('Admin Access Granted', 'Redirecting to Admin Panel...');
    } else {
      Alert.alert('Error', 'Invalid Admin Code!');
    }
  };

  const handleUpdateName = () => {
    if (newName.trim()) {
      updateUser({ name: newName });
      setShowNameModal(false);
    }
  };

  const renderMenuItem = (icon: any, title: string, rightElement?: any, onPress?: () => void) => (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: themeColors.surface }]} onPress={onPress}>
      <View style={styles.menuLeft}>
        {icon}
        <Text style={[styles.menuTitle, { color: themeColors.text }]}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {rightElement}
        <ChevronRight size={18} color={themeColors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: user?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.cameraButton} onPress={() => Alert.alert('Coming Soon', 'Image upload will be available in the next update.')}>
              <Camera size={14} color="white" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.nameContainer} onPress={() => setShowNameModal(true)}>
            <Text style={[styles.userName, { color: themeColors.text }]}>{user?.name || 'User Name'}</Text>
            <Pencil size={14} color={themeColors.textSecondary} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          {user?.isPro && (
             <View style={styles.proBadgeMini}>
               <Crown size={10} color="#fbbf24" fill="#fbbf24" />
               <Text style={styles.proBadgeMiniText}>PRO USER</Text>
             </View>
          )}
        </View>

        {/* Pro Banner */}
        <TouchableOpacity style={styles.proBanner} onPress={() => setShowProModal(true)}>
          <View style={styles.proLeft}>
            <View style={styles.crownIconCircle}>
               <Crown size={24} color="#E53935" fill="#E53935" />
            </View>
            <View style={styles.proTextContainer}>
              <Text style={styles.proTitle}>{user?.isPro ? 'PRO Activated' : 'Become a PRO'}</Text>
              <Text style={[styles.proSubtitle, { color: themeColors.textSecondary }]}>{user?.isPro ? 'You have access to all premium features' : 'Unlock all premium features'}</Text>
            </View>
          </View>
          {!user?.isPro && <ChevronRight size={24} color="#E53935" />}
        </TouchableOpacity>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {renderMenuItem(
            theme === 'dark' ? <Sun size={22} color="#fbbf24" /> : <Sun size={22} color="#fbbf24" />, 
            theme === 'dark' ? t.lightMode : t.darkMode, 
            <Switch 
              value={theme === 'light'} 
              onValueChange={() => toggleTheme()} 
              trackColor={{ false: '#555', true: '#E53935' }}
            />
          )}

          {renderMenuItem(<Languages size={22} color="#4ade80" />, t.language, 
            <Text style={[styles.menuValueText, { color: themeColors.textSecondary }]}>{language.toUpperCase()}</Text>,
            () => setShowLangModal(true)
          )}

          
          {renderMenuItem(<Bell size={22} color="#f87171" />, t.notifications)}

          {renderMenuItem(<Download size={22} color="#d1d5db" />, t.downloads)}

          {renderMenuItem(<Shield size={22} color="#94a3b8" />, t.privacyPolicy)}

          {renderMenuItem(<ScrollText size={22} color="#94a3b8" />, t.termsConditions)}
        </View>

      </ScrollView>

      {/* Become a PRO Modal (Matching Web) */}
      <Modal
        visible={showProModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProModal(false)}
      >
        <View style={styles.proModalOverlay}>
          <View style={[styles.proModalContent, { backgroundColor: themeColors.surface }]}>
            <View style={styles.proModalHeader}>
              <View style={styles.proModalHeaderLeft}>
                <Shield size={20} color="#E53935" />
                <Text style={[styles.proModalTitle, { color: themeColors.text }]}>Become a PRO</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProModal(false)}>
                <X color={themeColors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.proMainBox}>
                <View style={styles.proBrandBox}>
                   <Text style={[styles.proBrandText, { fontWeight: '900' }]}>MY FLIM+</Text>
                </View>
                
                <Text style={[styles.proSubscribeTitle, { color: themeColors.text }]}>Subscribe to <Text style={{ color: '#E53935' }}>PRO</Text></Text>
                <Text style={[styles.proSubscribeSubtitle, { color: themeColors.textSecondary }]}>Subscribe to PRO version and enjoy exclusive benefits listed below</Text>

                <View style={styles.proWhyBox}>
                  <Text style={[styles.proWhyTitle, { color: themeColors.text }]}>Why go with <Text style={{ color: '#E53935' }}>PRO</Text>?</Text>
                  
                  {[
                    'Fully Ad free experience',
                    'Access to all the premium tracks',
                    'Technical support',
                    'Cancel anytime'
                  ].map((benefit, i) => (
                    <View key={i} style={styles.proBenefitItem}>
                      <CheckCircle2 size={18} color={themeColors.text} />
                      <Text style={[styles.proBenefitText, { color: themeColors.textSecondary }]}>{benefit}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.proPlanBox, { backgroundColor: themeColors.surfaceLight }]}>
                  <View>
                    <Text style={[styles.proPlanTitle, { color: themeColors.text }]}>Monthly</Text>
                    <Text style={[styles.proPlanSubtitle, { color: themeColors.textSecondary }]}>Access to premium content & ad-free experience for month</Text>
                  </View>
                  <Text style={styles.proPlanPrice}>3,000 IQD</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.proPlanBox, styles.proPlanBoxActive, { backgroundColor: theme === 'light' ? '#ffebee' : 'rgba(255,255,255,0.02)' }]}>
                  <View>
                    <Text style={[styles.proPlanTitle, { color: themeColors.text }]}>Yearly</Text>
                    <Text style={[styles.proPlanSubtitle, { color: themeColors.textSecondary }]}>Enjoy all premium features for a full year and best price</Text>
                  </View>
                  <Text style={styles.proPlanPrice}>30,000 IQD</Text>
                </TouchableOpacity>

                <Text style={[styles.proFootnote, { color: themeColors.textMuted }]}>
                   After 3 day free trial, this subscription automatically renews as per the plan. Subscription will automatically renew unless cancelled within 24 hours before the end of the current period.
                </Text>

                <TouchableOpacity 
                   style={styles.proSubscribeButton}
                   onPress={() => {
                     updateUser({ isPro: true });
                     setShowProModal(false);
                     Alert.alert('Success', 'Welcome to My Flim PRO!');
                   }}
                >
                  <Text style={styles.proSubscribeButtonText}>Subscribe (Enter Code)</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowNameModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>Edit User Name</Text>
            <TextInput
              style={[styles.nameInput, { color: themeColors.text, backgroundColor: themeColors.surfaceLight, borderColor: themeColors.textMuted }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor={themeColors.textSecondary}
              autoFocus
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNameModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateName}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
      {/* Language Modal */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="fade"
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>{t.language}</Text>
            
            <TouchableOpacity 
              style={[styles.langOption, language === 'ku' && styles.langOptionActive]} 
              onPress={() => { setLanguage('ku'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>☀️</Text>
              <Text style={[styles.langText, { color: themeColors.text }]}>Kurdish (کوردی)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, language === 'ar' && styles.langOptionActive]} 
              onPress={() => { setLanguage('ar'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>🇮🇶</Text>
              <Text style={[styles.langText, { color: themeColors.text }]}>Arabic (عربي)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.langOption, language === 'en' && styles.langOptionActive]} 
              onPress={() => { setLanguage('en'); setShowLangModal(false); }}
            >
              <Text style={styles.langFlag}>🇬🇧</Text>
              <Text style={[styles.langText, { color: themeColors.text }]}>English</Text>
            </TouchableOpacity>

            <View style={[styles.nameModalActions, { marginTop: 20 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLangModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Admin Code Modal */}
      <Modal
        visible={showAdminModal}
        transparent
        animationType="fade"
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdminModal(false)}>
          <View style={[styles.nameModalContent, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.nameModalTitle, { color: themeColors.text }]}>Admin Access</Text>
            <Text style={{ color: themeColors.textSecondary, marginBottom: 15 }}>Please enter the admin security code.</Text>
            <TextInput
              style={[styles.nameInput, { color: themeColors.text, backgroundColor: themeColors.surfaceLight, borderColor: themeColors.textMuted }]}
              value={adminCode}
              onChangeText={setAdminCode}
              placeholder="Enter code..."
              placeholderTextColor={themeColors.textSecondary}
              secureTextEntry
              autoFocus
            />
            <View style={styles.nameModalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdminModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdminSubmit}>
                <Text style={styles.saveBtnText}>Enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 40,
  },
  avatarWrapper: {
    position: 'relative',
    padding: 2,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E53935',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#E53935',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  proBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    gap: 4,
  },
  proBadgeMiniText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: 'bold',
  },
  proBanner: {
    marginHorizontal: SPACING.md,
    backgroundColor: 'rgba(229, 57, 51, 0.15)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(229, 57, 51, 0.1)',
  },
  proLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  crownIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proTextContainer: {
    flex: 1,
  },
  proTitle: {
    color: '#E53935',
    fontSize: 18,
    fontWeight: 'bold',
  },
  proSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  menuSection: {
    paddingHorizontal: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    marginBottom: 10,
    padding: 18,
    borderRadius: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuTitle: {
    color: '#DDD',
    fontSize: 16,
    fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuValueText: {
    color: '#555',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Pro Modal Styles
  proModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  proModalContent: {
    backgroundColor: '#16161D',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '92%',
  },
  proModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  proModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  proModalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  proMainBox: {
    padding: 24,
    alignItems: 'center',
  },
  proBrandBox: {
    backgroundColor: '#E53935',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 24,
  },
  proBrandText: {
    color: 'white',
    fontSize: 24,
    letterSpacing: 2,
  },
  proSubscribeTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  proSubscribeSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  proWhyBox: {
    width: '100%',
    marginBottom: 30,
  },
  proWhyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  proBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 15,
  },
  proBenefitText: {
    color: '#BBB',
    fontSize: 15,
  },
  proPlanBox: {
    width: '100%',
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  proPlanBoxActive: {
    borderColor: 'rgba(229,57,53,0.5)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  proPlanTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  proPlanSubtitle: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    maxWidth: '70%',
  },
  proPlanPrice: {
    color: '#E53935',
    fontSize: 18,
    fontWeight: '900',
  },
  proFootnote: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 10,
    marginBottom: 30,
  },
  proSubscribeButton: {
    width: '100%',
    backgroundColor: '#E53935',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  proSubscribeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Name Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameModalContent: {
    backgroundColor: '#1A1A22',
    width: '85%',
    padding: 24,
    borderRadius: 24,
  },
  nameModalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: '#111',
    color: 'white',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
  },
  nameModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 12,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  langOptionActive: {
    backgroundColor: 'rgba(229, 57, 53, 0.2)',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  langFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  langText: {
    fontSize: 16,
    fontWeight: '500',
  }
});
