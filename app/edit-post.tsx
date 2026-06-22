import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput, Modal,
  FlatList, ActivityIndicator, Image, SafeAreaView, Alert, BackHandler
} from 'react-native';
import { ChevronLeft, ChevronDown, Camera, X, Check, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../src/lib/supabase';
import { uploadToR2 } from '../src/lib/r2';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../src/i18n/LanguageContext';

export default function EditPostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { t, getTranslatedName, language } = useLanguage();
  const isRTL = language === 'ckb' || language === 'ku' || language === 'ar';

  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // All editable fields
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState('');
  const [model, setModel] = useState('');
  const [modelId, setModelId] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [color, setColor] = useState('');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [engineSize, setEngineSize] = useState('');
  const [cylinders, setCylinders] = useState('');
  const [condition, setCondition] = useState('');
  const [importCountry, setImportCountry] = useState('');
  const [plateType, setPlateType] = useState('');
  const [paintStatus, setPaintStatus] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [governorate, setGovernorate] = useState('');
  const [governorateId, setGovernorateId] = useState('');
  const [city, setCity] = useState('');
  const [cityId, setCityId] = useState('');
  const [images, setImages] = useState<any[]>(Array(8).fill(null));
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  // Modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalSearch, setModalSearch] = useState('');

  useEffect(() => {
    if (params.id) fetchCar();
  }, [params.id]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isModalVisible) { setIsModalVisible(false); return true; }
      router.back(); return true;
    });
    return () => backHandler.remove();
  }, [isModalVisible]);

  const fetchCar = async () => {
    try {
      const { data, error } = await supabase.from('cars').select('*').eq('id', params.id).single();
      if (error) throw error;
      setCar(data);
      setBrand(data.brand || '');
      setBrandId(data.brand_id || '');
      setModel(data.model || '');
      setModelId(data.model_id || '');
      setYear(data.year?.toString() || '');
      setPrice(data.price?.toString() || '');
      setMileage(data.mileage?.toString() || '');
      setColor(data.color || '');
      setTransmission(data.transmission || '');
      setFuelType(data.fuel_type || '');
      setEngineSize(data.engine_size?.toString() || '');
      setCylinders(data.cylinders?.toString() || '');
      setCondition(data.condition || '');
      setImportCountry(data.import_country || '');
      setPlateType(data.plate_type || '');
      setPaintStatus(data.paint_status || '');
      setDescription(data.description || '');
      setPhone(data.phone || '');
      setPhone2(data.phone2 || '');
      setGovernorate(data.governorate || '');
      setGovernorateId(data.governorate_id || '');
      setCity(data.city || '');
      setCityId(data.city_id || '');
      setExistingImageUrls(data.images || data.image_urls || []);
    } catch (e) {
      console.error(e);
      Alert.alert('هەڵە', 'نەتوانرا پۆستەکە بهێنرێت');
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (type: string) => {
    setModalType(type);
    setModalSearch('');
    let data: any[] = [];
    if (type === 'brand') {
      const { data: b } = await supabase.from('brands').select('*').order('name');
      data = b || [];
    } else if (type === 'model') {
      if (!brandId) { Alert.alert('', 'پێشتر براند هەڵبژێرە'); return; }
      const { data: m } = await supabase.from('models').select('*').eq('brand_id', brandId).order('name');
      data = m || [];
    } else if (type === 'governorate') {
      const { data: govs } = await supabase.from('governorates').select('*').order('id');
      data = govs || [];
    } else if (type === 'city') {
      if (governorateId) {
        const { data: cities } = await supabase.from('cities').select('*').eq('governorate_id', governorateId).order('name');
        data = cities || [];
      } else {
        const { data: cities } = await supabase.from('cities').select('*').order('name');
        data = cities || [];
      }
    } else if (type === 'year') {
      for (let y = 2025; y >= 1990; y--) data.push({ id: y.toString(), name: y.toString() });
    } else if (type === 'transmission') {
      data = ['ئۆتۆماتیک', 'گێڕ ئاسایی'].map(n => ({ id: n, name: n }));
    } else if (type === 'fuel_type') {
      data = ['بەنزین', 'گاز', 'هایبرید', 'کارەبا'].map(n => ({ id: n, name: n }));
    } else if (type === 'condition') {
      data = ['Used', 'New'].map(n => ({ id: n, name: n === 'Used' ? 'بەکارهاتوو' : 'نوێ' }));
    } else if (type === 'import_country') {
      data = ['خەلیجی', 'ئەمریکی', 'کەنەدی', 'ئەورووپی', 'ژاپۆنی', 'کۆری'].map(n => ({ id: n, name: n }));
    } else if (type === 'plate_type') {
      data = ['عراقی', 'بێ پلەیت', 'ئیستیمارا'].map(n => ({ id: n, name: n }));
    } else if (type === 'paint_status') {
      data = ['فابریکا', 'ڕووکێشكراو', 'نیوە ڕووکێشكراو'].map(n => ({ id: n, name: n }));
    } else if (type === 'cylinders') {
      data = ['3', '4', '6', '8', '12'].map(n => ({ id: n, name: `${n} سیلیندر` }));
    }
    setModalData(data);
    setIsModalVisible(true);
  };

  const handleModalSelect = (item: any) => {
    if (modalType === 'brand') {
      setBrand(item.name); setBrandId(item.id); setModel(''); setModelId('');
    } else if (modalType === 'model') {
      setModel(item.name); setModelId(item.id);
    } else if (modalType === 'year') {
      setYear(item.name);
    } else if (modalType === 'transmission') {
      setTransmission(item.id);
    } else if (modalType === 'fuel_type') {
      setFuelType(item.id);
    } else if (modalType === 'condition') {
      setCondition(item.id);
    } else if (modalType === 'import_country') {
      setImportCountry(item.id);
    } else if (modalType === 'plate_type') {
      setPlateType(item.id);
    } else if (modalType === 'paint_status') {
      setPaintStatus(item.id);
    } else if (modalType === 'cylinders') {
      setCylinders(item.id);
    } else if (modalType === 'governorate') {
      setGovernorate(item.name); setGovernorateId(item.id); setCity(''); setCityId('');
    } else if (modalType === 'city') {
      setCity(item.name); setCityId(item.id);
    }
    setIsModalVisible(false);
  };

  const getSelectedValue = (type: string): string => {
    const map: Record<string, string> = {
      brand: brand ? getTranslatedName(brand, 'brands') : '',
      model: model ? getTranslatedName(model, 'models') : '',
      year,
      transmission,
      fuel_type: fuelType,
      condition: condition === 'Used' ? 'بەکارهاتوو' : condition === 'New' ? 'نوێ' : '',
      import_country: importCountry,
      plate_type: plateType,
      paint_status: paintStatus,
      cylinders: cylinders ? `${cylinders} سیلیندر` : '',
      governorate: governorate ? getTranslatedName(governorate, 'locations') : '',
      city: city ? getTranslatedName(city, 'locations') : '',
    };
    return map[type] || '';
  };

  const getModalSelectedId = (type: string): string => {
    const map: Record<string, string> = {
      brand: brand, model, year, transmission, fuel_type: fuelType,
      condition, import_country: importCountry, plate_type: plateType,
      paint_status: paintStatus, cylinders,
      governorate, city,
    };
    return map[type] || '';
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const newImages = [...images];
      newImages[index] = result.assets[0];
      setImages(newImages);
    }
  };

  const removeExistingImage = (index: number) => {
    const updated = [...existingImageUrls];
    updated.splice(index, 1);
    setExistingImageUrls(updated);
  };

  const handleSave = async () => {
    if (!price) { Alert.alert('تکایە', 'نرخەکە بنووسە'); return; }
    setIsSaving(true);
    try {
      const newUrls: string[] = [];
      for (const img of images) {
        if (img && img.base64) {
          const fileName = `cars/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          try {
            const url = await uploadToR2(img.base64, fileName, 'image/jpeg');
            newUrls.push(url);
          } catch (e) { console.error('img upload error', e); }
        }
      }
      const allImages = [...existingImageUrls, ...newUrls];

      const { error } = await supabase.from('cars').update({
        brand: brand || null,
        brand_id: brandId || null,
        model: model || null,
        model_id: modelId || null,
        year: year || null,
        price: parseInt(price.replace(/\D/g, '')) || 0,
        mileage: mileage ? parseInt(mileage.replace(/\D/g, '')) : null,
        color: color || null,
        transmission: transmission || null,
        fuel_type: fuelType || null,
        engine_size: engineSize || null,
        cylinders: cylinders || null,
        condition: condition || null,
        import_country: importCountry || null,
        plate_type: plateType || null,
        paint_status: paintStatus || null,
        description: description || null,
        phone: phone || null,
        phone2: phone2 || null,
        governorate: governorate || null,
        city: city || null,
        images: allImages,
      }).eq('id', params.id);

      if (error) throw error;
      Alert.alert('سەرکەوتوو بوو ✅', 'پۆستەکەت نوێ کرایەوە', [
        { text: 'باشە', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('هەڵە', err.message || 'نەتوانرا پۆستەکە نوێ بکرێتەوە');
    } finally {
      setIsSaving(false);
    }
  };

  const DropdownField = ({ label, type, placeholder }: { label: string; type: string; placeholder: string }) => (
    <View className="mb-4">
      <Text className={`text-sm font-bold text-gray-500 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{label}</Text>
      <TouchableOpacity
        onPress={() => openModal(type)}
        className={`bg-gray-50 border border-gray-100 rounded-2xl h-14 px-5 flex-row${isRTL ? '' : '-reverse'} items-center justify-between`}
      >
        <ChevronDown size={18} color="#9ca3af" />
        <Text className={`text-base font-bold ${getSelectedValue(type) ? 'text-gray-900' : 'text-gray-300'}`}>
          {getSelectedValue(type) || placeholder}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View className="mb-4">
      <Text className={`text-sm font-bold text-gray-500 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#d1d5db"
        className={`bg-gray-50 border border-gray-100 rounded-2xl h-14 px-5 text-base font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}
      />
    </View>
  );

  if (loading) return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <ActivityIndicator size="large" color="#CC222F" />
    </SafeAreaView>
  );

  if (!car) return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
      <Text className="text-gray-500 font-bold text-lg text-center">پۆستەکە نەدۆزرایەوە</Text>
    </SafeAreaView>
  );

  const filteredModal = modalData.filter(item => {
    const n = item.name || '';
    return n.toLowerCase().includes(modalSearch.toLowerCase());
  });

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa]">
      {/* Header */}
      <View className="bg-white flex-row items-center px-5 pt-12 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <ChevronLeft size={22} color="#111" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-xl font-black text-gray-900 mr-10">گۆڕینی پۆست</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Images ── */}
        <View className="bg-white mx-4 mt-4 rounded-[25px] p-5 border border-gray-100 shadow-sm">
          <Text className={`text-base font-black text-gray-700 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>🖼 وێنەکان</Text>
          {existingImageUrls.length > 0 && (
            <View className="mb-4">
              <Text className={`text-xs font-bold text-gray-400 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>وێنەی ئێستا — دەستت لای بنێ بۆ سڕینەوە</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row" style={{ gap: 8 }}>
                  {existingImageUrls.map((url, i) => (
                    <View key={i} className="relative">
                      <Image source={{ uri: url }} className="w-24 h-20 rounded-2xl" resizeMode="cover" />
                      <TouchableOpacity onPress={() => removeExistingImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
                        <X size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          <Text className={`text-xs font-bold text-gray-400 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>+ زیادکردنی وێنەی نوێ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 8 }}>
              {images.map((img, i) => (
                <TouchableOpacity key={i} onPress={() => pickImage(i)}
                  className={`w-20 h-16 rounded-2xl border-2 items-center justify-center ${img ? 'border-transparent' : 'border-dashed border-gray-200 bg-gray-50'}`}>
                  {img ? <Image source={{ uri: img.uri }} className="w-full h-full rounded-2xl" resizeMode="cover" /> : <Camera size={20} color="#d1d5db" />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* ── Car Identity ── */}
        <View className="bg-white mx-4 mt-4 rounded-[25px] p-5 border border-gray-100 shadow-sm">
          <Text className={`text-base font-black text-gray-700 mb-5 ${isRTL ? 'text-right' : 'text-left'}`}>🚗 زانیاری ئۆتۆمبێل</Text>
          <DropdownField label="براند" type="brand" placeholder="براند هەڵبژێرە" />
          <DropdownField label="مۆدێل" type="model" placeholder="مۆدێل هەڵبژێرە" />
          <DropdownField label="ساڵ" type="year" placeholder="ساڵ هەڵبژێرە" />
          <DropdownField label="گیرسەدە" type="transmission" placeholder="هەڵبژێرە" />
          <DropdownField label="جۆری سووتەمەنی" type="fuel_type" placeholder="هەڵبژێرە" />
          <DropdownField label="بارودۆخی ئۆتۆمبێل" type="condition" placeholder="هەڵبژێرە" />
          <DropdownField label="وڵاتی وارد" type="import_country" placeholder="هەڵبژێرە" />
          <DropdownField label="سیلیندر" type="cylinders" placeholder="هەڵبژێرە" />
          <InputField label="قەبارەی مۆتەر (cc)" value={engineSize} onChangeText={setEngineSize} placeholder="بۆ نموونە: 2000" keyboardType="numeric" />
          <DropdownField label="جۆری پلەیت" type="plate_type" placeholder="هەڵبژێرە" />
          <DropdownField label="باری ڕووکێش" type="paint_status" placeholder="هەڵبژێرە" />
        </View>

        {/* ── Price & Details ── */}
        <View className="bg-white mx-4 mt-4 rounded-[25px] p-5 border border-gray-100 shadow-sm">
          <Text className={`text-base font-black text-gray-700 mb-5 ${isRTL ? 'text-right' : 'text-left'}`}>💰 نرخ و زانیاری</Text>
          <InputField label="نرخ ($)" value={price} onChangeText={setPrice} placeholder="0" keyboardType="numeric" />
          <InputField label="کیلۆمەتر" value={mileage} onChangeText={setMileage} placeholder="0" keyboardType="numeric" />
          <InputField label="ڕەنگ" value={color} onChangeText={setColor} placeholder="بۆ نموونە: سپی" />
          <InputField label="ژمارەی یەکەم" value={phone} onChangeText={setPhone} placeholder="07XX XXX XXXX" keyboardType="phone-pad" />
          <InputField label="ژمارەی دووەم (دیاری نەکراو)" value={phone2} onChangeText={setPhone2} placeholder="07XX XXX XXXX" keyboardType="phone-pad" />
        </View>

        {/* ── Location ── */}
        <View className="bg-white mx-4 mt-4 rounded-[25px] p-5 border border-gray-100 shadow-sm">
          <Text className={`text-base font-black text-gray-700 mb-5 ${isRTL ? 'text-right' : 'text-left'}`}>📍 شوێن</Text>
          <DropdownField label="پارێزگا" type="governorate" placeholder="پارێزگا هەڵبژێرە" />
          <DropdownField label="شار" type="city" placeholder="شار هەڵبژێرە" />
        </View>

        {/* ── Description ── */}
        <View className="bg-white mx-4 mt-4 rounded-[25px] p-5 border border-gray-100 shadow-sm">
          <Text className={`text-base font-black text-gray-700 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>📝 وەسف</Text>
          <TextInput
            value={description} onChangeText={setDescription} multiline numberOfLines={5}
            placeholder="زانیارییەکانی ماشێنەکەت بنووسە..."
            placeholderTextColor="#d1d5db"
            className={`bg-gray-50 border border-gray-100 rounded-2xl p-4 text-base font-bold min-h-[120px] ${isRTL ? 'text-right' : 'text-left'}`}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-8 border-t border-gray-100">
        <TouchableOpacity onPress={handleSave} disabled={isSaving}
          className="bg-[#CC222F] h-14 rounded-2xl items-center justify-center flex-row shadow-lg shadow-red-500/20">
          {isSaving ? <ActivityIndicator color="white" /> : (
            <>
              <Save size={20} color="white" />
              <Text className="text-white font-black text-lg ml-2">پاشەکەوت بکە</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Selection Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[40px] p-6 h-[65%]">
            <View className={`flex-row${isRTL ? '' : '-reverse'} justify-between items-center mb-5`}>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <X size={20} color="#111" />
              </TouchableOpacity>
              <Text className="text-xl font-black text-gray-900">هەڵبژاردن</Text>
            </View>
            <View className={`flex-row${isRTL ? '' : '-reverse'} items-center bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 mb-4`}>
              <TextInput placeholder="گەڕان..." value={modalSearch} onChangeText={setModalSearch}
                placeholderTextColor="#9ca3af"
                className={`flex-1 font-bold text-base ${isRTL ? 'mr-2 text-right' : 'ml-2 text-left'}`} />
            </View>
            <FlatList
              data={filteredModal}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const displayName = (modalType === 'brand' ? getTranslatedName(item.name, 'brands') :
                  modalType === 'model' ? getTranslatedName(item.name, 'models') :
                  modalType === 'governorate' || modalType === 'city' ? getTranslatedName(item.name, 'locations') :
                  item.name);
                const selected = getModalSelectedId(modalType) === item.name || getModalSelectedId(modalType) === item.id;
                return (
                  <TouchableOpacity onPress={() => handleModalSelect(item)}
                    className={`flex-row${isRTL ? '' : '-reverse'} justify-between items-center py-5 border-b border-gray-50`}>
                    <Check size={20} color={selected ? '#CC222F' : '#e5e7eb'} />
                    <Text className={`text-lg font-bold ${selected ? 'text-[#CC222F]' : 'text-gray-800'}`}>{displayName}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
