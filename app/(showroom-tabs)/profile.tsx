import React, { useState, useEffect, useRef } from 'react';
import { 
  View,
  Text as RNText,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  FlatList,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  StyleSheet,
  Dimensions,
 } from 'react-native';
import { Text } from '../../src/components/Common/CustomText';
import {
  Camera,
  Building2,
  MapPin,
  Clock,
  Edit3,
  Check,
  Search,
  ChevronDown,
  X,
  ChevronLeft,
  Link,
  FileText,
  ArrowLeftRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../src/lib/supabase';
import { uploadToR2 } from '../../src/lib/r2';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STATUSBAR_HEIGHT =
  Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 20;
const COVER_HEIGHT = 220;
const LOGO_SIZE = 90;

export default function ShowroomProfileScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showroom, setShowroom] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    bio: '',
    address: '',
    location: '',
    working_hours: '',
    governorate: '',
    governorate_id: '',
    city: '',
    city_id: '',
    cover_image_base64: null as string | null,
    cover_image_uri: null as string | null,
    logo_image_base64: null as string | null,
    logo_image_uri: null as string | null,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'governorate' | 'city'>('governorate');
  const [modalData, setModalData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchShowroom();
  }, []);

  const fetchShowroom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      const phone = profile?.phone || user.user_metadata?.phone ||
        (user.email ? user.email.replace('@taban.com', '') : null);

      if (!phone) return;

      const { data: sr } = await supabase
        .from('showrooms')
        .select('*')
        .eq('phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sr) {
        setShowroom(sr);
        setForm({
          name: sr.name || '',
          bio: sr.bio || '',
          address: sr.address || '',
          location: sr.location || '',
          working_hours: sr.working_hours || '',
          governorate: sr.governorate || '',
          governorate_id: sr.governorate_id || '',
          city: sr.city || '',
          city_id: sr.city_id || '',
          cover_image_base64: null,
          cover_image_uri: null,
          logo_image_base64: null,
          logo_image_uri: null,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (type: 'governorate' | 'city') => {
    setModalType(type);
    setSearchQuery('');
    setModalVisible(true);

    if (type === 'governorate') {
      const { data } = await supabase.from('governorates').select('*').order('id');
      setModalData(data || []);
    } else {
      if (form.governorate_id) {
        const { data } = await supabase
          .from('cities')
          .select('*')
          .eq('governorate_id', form.governorate_id)
          .order('name');
        setModalData(data || []);
      } else {
        const { data } = await supabase.from('cities').select('*').order('name');
        setModalData(data || []);
      }
    }
  };

  const pickImage = async (field: 'cover' | 'logo') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'cover' ? [16, 9] : [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (field === 'cover') {
        setForm({
          ...form,
          cover_image_base64: asset.base64 || null,
          cover_image_uri: asset.uri,
        });
      } else {
        setForm({
          ...form,
          logo_image_base64: asset.base64 || null,
          logo_image_uri: asset.uri,
        });
      }
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('هەڵە', 'ناوی پێشانگا پرکەوە');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !showroom) return;

      let coverUrl = showroom.cover_url || '';
      let logoUrl = showroom.logo_url || '';

      if (form.cover_image_base64) {
        const name = `showroom-covers/${showroom.id}-${Date.now()}.jpg`;
        coverUrl = await uploadToR2(form.cover_image_base64, name);
      }

      if (form.logo_image_base64) {
        const name = `showroom-logos/${showroom.id}-${Date.now()}.jpg`;
        logoUrl = await uploadToR2(form.logo_image_base64, name);
      }

      const { error } = await supabase.from('showrooms').update({
        name: form.name,
        bio: form.bio,
        address: form.address,
        location: form.location,
        working_hours: form.working_hours,
        governorate: form.governorate,
        governorate_id: form.governorate_id || null,
        city: form.city,
        city_id: form.city_id || null,
        cover_url: coverUrl,
        logo_url: logoUrl,
      }).eq('id', showroom.id);

      if (error) throw error;

      setShowroom({
        ...showroom,
        name: form.name,
        bio: form.bio,
        address: form.address,
        location: form.location,
        working_hours: form.working_hours,
        governorate: form.governorate,
        city: form.city,
        cover_url: coverUrl,
        logo_url: logoUrl,
      });

      setEditing(false);
      // Scroll to profile card area (below cover image) after edit ends
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: COVER_HEIGHT - 20, animated: true });
      }, 100);
      Alert.alert('سەرکەوتوو', 'پرۆفایلەکەت نوێکرایەوە ✓');
    } catch (e: any) {
      Alert.alert('هەڵە', e.message || 'هەڵەیەک ڕوویدا');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to showroom data and scroll to profile card
    if (showroom) {
      setForm({
        name: showroom.name || '',
        bio: showroom.bio || '',
        address: showroom.address || '',
        location: showroom.location || '',
        working_hours: showroom.working_hours || '',
        governorate: showroom.governorate || '',
        governorate_id: showroom.governorate_id || '',
        city: showroom.city || '',
        city_id: showroom.city_id || '',
        cover_image_base64: null,
        cover_image_uri: null,
        logo_image_base64: null,
        logo_image_uri: null,
      });
    }
    setEditing(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: COVER_HEIGHT - 20, animated: true });
    }, 100);
  };

  const calculateDays = () => {
    if (!showroom) return { passed: 0, remaining: 30 };
    
    let end = new Date();
    if (showroom.verified_until) {
      end = new Date(showroom.verified_until);
    } else if (showroom.created_at) {
      end = new Date(showroom.created_at);
      end.setDate(end.getDate() + 30);
    } else {
      end.setDate(end.getDate() + 30);
    }

    const today = new Date();
    const remainingMs = end.getTime() - today.getTime();
    let remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    
    if (remainingDays < 0) remainingDays = 0;
    
    let passedDays = 30 - remainingDays;
    if (passedDays < 0) passedDays = 0;
    if (passedDays > 30) passedDays = 30;
    if (remainingDays > 30) remainingDays = 30;
    
    return { passed: passedDays, remaining: remainingDays };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  if (!showroom) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <View style={styles.emptyIconBg}>
          <Building2 size={42} color="#CC222F" />
        </View>
        <Text style={styles.emptyTitle}>پێشانگایەک نەدۆزرایەوە</Text>
        <Text style={styles.emptySubtitle}>ئەکاونتی پێشانگات نییە</Text>
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <ArrowLeftRight size={18} color="white" />
          <Text style={styles.switchBtnText}>گەڕانەوە بۆ ئەکاونتی کەسی</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const coverUri = form.cover_image_uri || showroom.cover_url || null;
  const logoUri = form.logo_image_uri || showroom.logo_url || null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ══════════════════ HERO SECTION ══════════════════ */}
          <View style={styles.heroSection}>
            {/* Cover Image */}
            <View style={styles.coverContainer}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <View style={styles.coverPlaceholder} />
              )}

              {/* Dark gradient overlay */}
              <View style={styles.coverGradient} />

              {/* Top buttons overlay */}
              <View style={[styles.headerOverlay, { paddingTop: STATUSBAR_HEIGHT + 10 }]}>
                <TouchableOpacity
                  style={styles.headerBtn}
                  onPress={() => editing ? handleCancelEdit() : router.back()}
                >
                  <ChevronLeft size={20} color="#1a1a1a" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>پرۆفایلی پێشانگا</Text>

                {!editing && (
                  <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => setEditing(true)}
                  >
                    <Edit3 size={18} color="white" />
                  </TouchableOpacity>
                )}
                {editing && <View style={{ width: 38 }} />}
              </View>

              {/* Cover edit overlay (editing mode) */}
              {editing && (
                <TouchableOpacity
                  style={styles.coverEditOverlay}
                  onPress={() => pickImage('cover')}
                >
                  <Camera size={24} color="white" />
                  <Text style={styles.coverEditText}>وێنەی کەڤەر بگۆڕە</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Logo + Name card */}
            <View style={styles.profileCard}>
              {/* Logo */}
              <TouchableOpacity
                style={styles.logoWrapper}
                onPress={() => editing && pickImage('logo')}
                activeOpacity={editing ? 0.7 : 1}
              >
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImage} />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Building2 size={32} color="#CC222F" />
                  </View>
                )}
                {editing && (
                  <View style={styles.logoEditOverlay}>
                    <Camera size={16} color="white" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Name */}
              <Text style={styles.showroomName}>{showroom.name}</Text>

              {/* Location pill (view mode) */}
              {!editing && (showroom.governorate || showroom.city) ? (
                <View style={styles.locationPill}>
                  <MapPin size={13} color="#CC222F" />
                  <Text style={styles.locationPillText}>
                    {[showroom.governorate, showroom.city].filter(Boolean).join(' - ')}
                  </Text>
                </View>
              ) : null}

              {/* Edit button (view mode) */}
              {!editing && (
                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={() => setEditing(true)}
                >
                  <Edit3 size={15} color="#CC222F" />
                  <Text style={styles.editProfileBtnText}>دەستکاری پرۆفایل</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Free Trial Days Card */}
            {!editing && (
              <View style={{
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                backgroundColor: '#fff', 
                width: '90%', 
                padding: 16, 
                borderRadius: 16, 
                marginBottom: 20, 
                borderWidth: 1, 
                borderColor: '#f1f5f9',
                alignSelf: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 5,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}>
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#CC222F' }}>{calculateDays().remaining}</Text>
                  <Text style={{ color: '#64748b', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>ڕۆژی ماوە</Text>
                </View>
                <View style={{ width: 1, height: 40, backgroundColor: '#e2e8f0' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#1e293b' }}>{calculateDays().passed}</Text>
                  <Text style={{ color: '#64748b', fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>ڕۆژی ڕۆیشتوو</Text>
                </View>
              </View>
            )}
          </View>

          {/* ══════════════════ EDIT FORM ══════════════════ */}
          {editing && (
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>زانیاریەکان دەستکاری بکە</Text>

              {/* Name */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>ناوی پێشانگا</Text>
                <View style={styles.fieldInput}>
                  <Building2 size={17} color="#CC222F" />
                  <TextInput
                    style={styles.textInput}
                    value={form.name}
                    onChangeText={(t) => setForm({ ...form, name: t })}
                    placeholder="ناوی پێشانگا..."
                    placeholderTextColor="#c0c0c0"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Bio */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>دەربارە / بایۆ</Text>
                <View style={[styles.fieldInput, { alignItems: 'flex-start', paddingTop: 14 }]}>
                  <FileText size={17} color="#CC222F" style={{ marginTop: 2 }} />
                  <TextInput
                    style={[styles.textInput, { minHeight: 80 }]}
                    value={form.bio}
                    onChangeText={(t) => setForm({ ...form, bio: t })}
                    placeholder="دەربارەی پێشانگاکەت بنووسە..."
                    placeholderTextColor="#c0c0c0"
                    multiline
                    textAlignVertical="top"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Governorate & City */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>شوێن</Text>
                <View style={styles.rowFields}>
                  <TouchableOpacity
                    style={[styles.fieldInput, styles.rowField]}
                    onPress={() => openModal('city')}
                  >
                    <ChevronDown size={15} color="#CC222F" />
                    <Text style={[styles.selectText, !form.city && styles.selectPlaceholder]}>
                      {form.city || 'شار'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.fieldInput, styles.rowField]}
                    onPress={() => openModal('governorate')}
                  >
                    <ChevronDown size={15} color="#CC222F" />
                    <Text style={[styles.selectText, !form.governorate && styles.selectPlaceholder]}>
                      {form.governorate || 'پارێزگا'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Address */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>ناونیشان</Text>
                <View style={styles.fieldInput}>
                  <MapPin size={17} color="#CC222F" />
                  <TextInput
                    style={styles.textInput}
                    value={form.address}
                    onChangeText={(t) => setForm({ ...form, address: t })}
                    placeholder="ناونیشانی تەواوی پێشانگا..."
                    placeholderTextColor="#c0c0c0"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Working Hours */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>کاتی کارکردن</Text>
                <View style={styles.fieldInput}>
                  <Clock size={17} color="#CC222F" />
                  <TextInput
                    style={styles.textInput}
                    value={form.working_hours}
                    onChangeText={(t) => setForm({ ...form, working_hours: t })}
                    placeholder="نموونە: 9 بەیانی - 6 ئێوارە"
                    placeholderTextColor="#c0c0c0"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Location Link */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>لینکی گووگڵ ماپ</Text>
                <View style={styles.fieldInput}>
                  <Link size={17} color="#CC222F" />
                  <TextInput
                    style={styles.textInput}
                    value={form.location}
                    onChangeText={(t) => setForm({ ...form, location: t })}
                    placeholder="https://maps.google.com/..."
                    placeholderTextColor="#c0c0c0"
                    keyboardType="url"
                    textAlign="right"
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>پاشەکەوتکردن</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelBtnText}>بەتاڵکردنەوە</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══════════════════ SWITCH ACCOUNT (view mode) ══════════════════ */}
          {!editing && (
            <View style={styles.switchSection}>
              <TouchableOpacity
                style={styles.switchBtn}
                onPress={() => router.replace('/(tabs)/profile')}
              >
                <ArrowLeftRight size={18} color="white" />
                <Text style={styles.switchBtnText}>گەڕانەوە بۆ ئەکاونتی کەسی</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ══════════════════ SELECTION MODAL ══════════════════ */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {modalType === 'governorate' ? 'پارێزگا هەڵبژێرە' : 'شار هەڵبژێرە'}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            <View style={styles.searchBar}>
              <Search size={16} color="#aaa" />
              <TextInput
                placeholder="گەڕان..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#aaa"
                textAlign="right"
              />
            </View>

            <FlatList
              data={modalData.filter(i => i.name.includes(searchQuery))}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSelected =
                  modalType === 'governorate'
                    ? form.governorate === item.name
                    : form.city === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      if (modalType === 'governorate') {
                        setForm({ ...form, governorate: item.name, governorate_id: item.id.toString(), city: '', city_id: '' });
                      } else {
                        setForm({ ...form, city: item.name, city_id: item.id.toString() });
                      }
                      setModalVisible(false);
                    }}
                  >
                    <View style={[styles.modalCheckbox, isSelected && styles.modalCheckboxSelected]}>
                      {isSelected && <Check size={11} color="white" strokeWidth={4} />}
                    </View>
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
    textAlign: 'center',
  },

  // ── Hero ──
  heroSection: {
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  coverContainer: {
    width: '100%',
    height: COVER_HEIGHT,
    position: 'relative',
    backgroundColor: '#1a1a2e',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 20,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerCancelBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSaveBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CC222F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  coverEditText: {
    color: 'white',
    fontWeight: '700',
    marginTop: 8,
    fontSize: 14,
  },

  // Profile card
  profileCard: {
    alignItems: 'center',
    paddingTop: LOGO_SIZE / 2 + 12,
    paddingBottom: 24,
    position: 'relative',
  },
  logoWrapper: {
    position: 'absolute',
    top: -(LOGO_SIZE / 2),
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEditOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showroomName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff0f0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    marginBottom: 14,
  },
  locationPillText: {
    color: '#CC222F',
    fontWeight: '700',
    fontSize: 13,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff0f0',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffd6d8',
  },
  editProfileBtnText: {
    color: '#CC222F',
    fontWeight: '800',
    fontSize: 14,
  },

  // ── Form ──
  formSection: {
    backgroundColor: '#fff',
    marginHorizontal: 0,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'right',
    marginBottom: 16,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#888',
    textAlign: 'right',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  rowField: {
    flex: 1,
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'right',
  },
  selectPlaceholder: {
    color: '#c0c0c0',
  },
  saveBtn: {
    backgroundColor: '#CC222F',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    shadowColor: '#CC222F',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
  cancelBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cancelBtnText: {
    color: '#999',
    fontWeight: '700',
    fontSize: 15,
  },

  // ── Switch ──
  switchSection: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  switchBtn: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  switchBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },

  // ── Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '75%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    gap: 10,
  },
  modalItemSelected: {
    backgroundColor: '#fff8f8',
  },
  modalCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCheckboxSelected: {
    borderColor: '#CC222F',
    backgroundColor: '#CC222F',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#444',
    flex: 1,
    textAlign: 'right',
  },
  modalItemTextSelected: {
    color: '#CC222F',
  },
});
