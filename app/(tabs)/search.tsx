import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, TextInput, Modal, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { ChevronDown, ArrowRight, Search, X, Check, Car, MapPin, ChevronLeft } from 'lucide-react-native';
import { supabase } from '../../src/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '../../src/i18n/LanguageContext';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, getTranslatedName, language } = useLanguage();
  
  const [brands, setBrands] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({
    brand: '',
    brand_id: '',
    model: '',
    model_id: '',
    fromYear: '',
    toYear: '',
    minPrice: '',
    maxPrice: '',
    governorate: '',
    governorate_id: '',
    city: '',
    city_id: '',
    condition: 'All',
    transmission: 'All',
    fuelType: 'All',
    interiorType: 'All',
    plateType: 'All',
  });

  const [carCount, setCarCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialBrands();
  }, []);

  useEffect(() => {
    if (params.brand) {
      handleBrandSelectFromParams(params.brand as string);
    }
  }, [params.brand]);

  useEffect(() => {
    updateCarCount();
  }, [filters]);

  const fetchInitialBrands = async () => {
    try {
      const { data } = await supabase.from('brands').select('*').limit(8);
      if (data) setBrands(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBrandSelectFromParams = async (brandName: string) => {
    try {
      // Fetch the specific brand
      const { data: selectedBrand } = await supabase.from('brands').select('*').eq('name', brandName).single();
      
      if (selectedBrand) {
        // Set the filters
        setFilters(prev => ({...prev, brand: selectedBrand.name, brand_id: selectedBrand.id, model: '', model_id: ''}));
        
        // Re-order brands list: Selected brand first, then others
        const { data: otherBrands } = await supabase.from('brands').select('*').neq('id', selectedBrand.id).limit(7);
        if (otherBrands) {
          setBrands([selectedBrand, ...otherBrands]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateCarCount = async () => {
    try {
      let query = supabase.from('cars').select('id', { count: 'exact', head: true }).eq('status', 'active');
      if (filters.brand) query = query.eq('brand', filters.brand);
      if (filters.model) query = query.eq('model', filters.model);
      if (filters.condition !== 'All') query = query.eq('condition', filters.condition);
      if (filters.transmission !== 'All') query = query.eq('transmission', filters.transmission);
      if (filters.fuelType !== 'All') query = query.eq('fuel_type', filters.fuelType);
      if (filters.interiorType !== 'All') query = query.eq('interior_type', filters.interiorType);
      if (filters.plateType !== 'All') query = query.eq('plate_type', filters.plateType);
      if (filters.fromYear) query = query.gte('year', filters.fromYear);
      if (filters.toYear) query = query.lte('year', filters.toYear);
      if (filters.governorate) query = query.eq('governorate', filters.governorate);
      if (filters.city) query = query.eq('city', filters.city);
      
      const { count } = await query;
      setCarCount(count || 0);
    } catch (e) {}
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    setResultsModalVisible(true);
    try {
      let query = supabase.from('cars').select('*').eq('status', 'active');
      if (filters.brand) query = query.eq('brand', filters.brand);
      if (filters.model) query = query.eq('model', filters.model);
      if (filters.fromYear) query = query.gte('year', filters.fromYear);
      if (filters.toYear) query = query.lte('year', filters.toYear);
      if (filters.condition !== 'All') query = query.eq('condition', filters.condition);
      if (filters.transmission !== 'All') query = query.eq('transmission', filters.transmission);
      if (filters.fuelType !== 'All') query = query.eq('fuel_type', filters.fuelType);
      if (filters.interiorType !== 'All') query = query.eq('interior_type', filters.interiorType);
      if (filters.plateType !== 'All') query = query.eq('plate_type', filters.plateType);
      if (filters.governorate) query = query.eq('governorate', filters.governorate);
      if (filters.city) query = query.eq('city', filters.city);

      const { data, error } = await query
        .order('vip_plan', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const openModal = async (type: string) => {
    setModalType(type);
    setLoading(true);
    setIsModalVisible(true);
    let data: any[] = [];

    if (type === 'brand') {
      const { data: b } = await supabase.from('brands').select('*').order('name');
      data = b || [];
    } else if (type === 'model') {
      if (!filters.brand_id) { alert(t('search.selectBrandFirst')); setIsModalVisible(false); setLoading(false); return; }
      const { data: m } = await supabase.from('models').select('*').eq('brand_id', filters.brand_id).order('name');
      data = m || [];
    } else if (type === 'fromYear' || type === 'toYear') {
      for (let y = 2025; y >= 1990; y--) data.push({ id: y.toString(), name: y.toString() });
    } else if (type === 'minPrice' || type === 'maxPrice') {
      const prices = [1000, 5000, 10000, 15000, 20000, 30000, 40000, 50000, 75000, 100000];
      data = prices.map(p => ({ id: p.toString(), name: `$${p.toLocaleString()}` }));
    } else if (type === 'governorate') {
      const { data: govs } = await supabase.from('governorates').select('*').order('id');
      data = govs || [];
    } else if (type === 'city') {
      if (filters.governorate_id) {
        const { data: cities } = await supabase.from('cities').select('*').eq('governorate_id', filters.governorate_id).order('name');
        data = cities || [];
      } else {
        const { data: cities } = await supabase.from('cities').select('*').order('name');
        data = cities || [];
      }
    }
    
    setModalData(data);
    setLoading(false);
  };

  const FilterDropdown = ({ label, value, onPress }: { label: string, value?: string, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className="flex-1 h-16 bg-white border border-gray-100 rounded-2xl px-5 flex-row items-center justify-between mb-4 mx-1 shadow-sm">
      <Text numberOfLines={1} className={`text-[15px] ${value ? 'text-slate-900 font-black' : 'text-gray-400 font-bold'}`}>{value || label}</Text>
      <ChevronDown size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  const TabButton = ({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} className={`px-6 py-3.5 rounded-2xl border mr-2 mb-2 ${active ? 'bg-[#CC222F] border-[#CC222F]' : 'bg-white border-gray-100'}`}>
      <Text className={`font-black text-[15px] ${active ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 py-4 flex-row justify-end items-center mt-12">
        <TouchableOpacity 
          onPress={handleSearch}
          disabled={carCount === 0}
          className={`px-6 py-3 rounded-full shadow-lg ${carCount > 0 ? 'bg-[#CC222F] shadow-red-500/30' : 'bg-gray-300'}`}
        >
          <Text className="text-white font-black text-[16px]">{t('search.findCars').replace('{count}', carCount.toString())}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 mt-8">
          <Text className="text-slate-400 font-black mb-5 text-right text-[15px]">{t('search.brands')}</Text>
          <View className="flex-row flex-wrap justify-between">
            {brands.map((brand, i) => (
              <TouchableOpacity 
                key={i} 
                onPress={() => setFilters({...filters, brand: brand.name, brand_id: brand.id, model: '', model_id: ''})}
                className={`w-[31%] aspect-square bg-white border rounded-[30px] items-center justify-center mb-2 ${filters.brand === brand.name ? 'border-[#CC222F] bg-red-50' : 'border-slate-100 shadow-sm'}`}
              >
                {brand.image_url ? (
                   <Image source={{ uri: brand.image_url }} className="w-16 h-16" resizeMode="contain" />
                ) : (
                   <Car size={32} color="#EEE" />
                )}
                <Text numberOfLines={1} className={`mt-2 text-[12px] font-black ${filters.brand === brand.name ? 'text-[#CC222F]' : 'text-slate-500'}`}>{getTranslatedName(brand.name, 'brands')}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => router.push('/brands')} className="w-[31%] aspect-square bg-white border border-slate-100 rounded-[30px] items-center justify-center mb-2 shadow-sm">
              <ArrowRight size={32} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-4 mt-2">
          <View className="flex-row">
            <FilterDropdown label={t('search.model')} value={filters.model ? getTranslatedName(filters.model, 'models') : ''} onPress={() => openModal('model')} />
            <FilterDropdown label={t('search.governorate')} value={filters.governorate ? getTranslatedName(filters.governorate, 'locations') : ''} onPress={() => openModal('governorate')} />
          </View>
          <View className="flex-row">
            <FilterDropdown label={t('search.city')} value={filters.city ? getTranslatedName(filters.city, 'locations') : ''} onPress={() => openModal('city')} />
            <FilterDropdown label={t('search.fromYear')} value={filters.fromYear} onPress={() => openModal('fromYear')} />
          </View>
          <View className="flex-row">
            <FilterDropdown label={t('search.toYear')} value={filters.toYear} onPress={() => openModal('toYear')} />
            <FilterDropdown label={t('search.minPrice')} value={filters.minPrice} onPress={() => openModal('minPrice')} />
          </View>
          <View className="flex-row">
            <FilterDropdown label={t('search.maxPrice')} value={filters.maxPrice} onPress={() => openModal('maxPrice')} />
            <View className="flex-1 mb-4 mx-1" />
          </View>
        </View>

        <View className="px-5 mt-8">
          <Text className="text-slate-400 font-black mb-5 text-right text-[15px]">{t('search.carCondition')}</Text>
          <View className="flex-row flex-wrap justify-end">
            {[{id: 'All', name: t('search.all')}, {id: 'Used', name: t('search.used')}, {id: 'New', name: t('search.new')}].map(c => (
              <TabButton key={c.id} label={c.name} active={filters.condition === c.id} onPress={() => setFilters({...filters, condition: c.id})} />
            ))}
          </View>
        </View>

        <View className="px-5 mt-8">
          <Text className="text-slate-400 font-black mb-5 text-right text-[15px]">{t('search.transmission')}</Text>
          <View className="flex-row flex-wrap justify-end">
            {[{id: 'All', name: t('search.all')}, {id: 'ئۆتۆماتیک', name: t('search.automatic')}, {id: 'گێڕ ئاسایی', name: t('search.manual')}].map(t => (
              <TabButton key={t.id} label={t.name} active={filters.transmission === t.id} onPress={() => setFilters({...filters, transmission: t.id})} />
            ))}
          </View>
        </View>

        <View className="px-5 mt-8 mb-40">
          <Text className="text-slate-400 font-black mb-5 text-right text-[15px]">{t('search.fuelType')}</Text>
          <View className="flex-row flex-wrap justify-end">
            {[{id: 'All', name: t('search.all')}, {id: 'بەنزین', name: t('search.petrol')}, {id: 'گاز', name: t('search.diesel')}, {id: 'هایبرید', name: t('search.hybrid')}].map(f => (
              <TabButton key={f.id} label={f.name} active={filters.fuelType === f.id} onPress={() => setFilters({...filters, fuelType: f.id})} />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Filter Selection Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-[45px] p-8 h-[75%]">
             <View className="flex-row justify-between items-center mb-8">
                <TouchableOpacity onPress={() => setIsModalVisible(false)} className="p-2 bg-gray-100 rounded-full"><X size={24} color="#000" /></TouchableOpacity>
                <Text className="text-2xl font-black">{t('search.selection')}</Text>
             </View>
             <View className="flex-row-reverse items-center bg-slate-50 px-5 py-4 rounded-[25px] border border-slate-100 mb-8">
                <Search size={22} color="#999" />
                <TextInput placeholder={t('search.searchPlaceholder')} className="flex-1 mr-3 font-black text-right text-lg" value={searchQuery} onChangeText={setSearchQuery} />
             </View>
             {loading ? <ActivityIndicator size="large" color="#CC222F" /> : (
               <FlatList 
                 data={modalData.filter(i => {
                   const n = getTranslatedName(i.name, modalType === 'brand' ? 'brands' : modalType === 'model' ? 'models' : modalType === 'governorate' || modalType === 'city' ? 'locations' : 'default');
                   return n.toLowerCase().includes(searchQuery.toLowerCase());
                 })}
                 keyExtractor={(item) => item.id}
                 showsVerticalScrollIndicator={false}
                 renderItem={({item}) => (
                   <TouchableOpacity 
                     onPress={() => {
                       if (modalType === 'brand') setFilters({...filters, brand: item.name, brand_id: item.id, model: ''});
                       if (modalType === 'model') setFilters({...filters, model: item.name, model_id: item.id});
                       if (modalType === 'fromYear') setFilters({...filters, fromYear: item.name});
                       if (modalType === 'toYear') setFilters({...filters, toYear: item.name});
                       if (modalType === 'minPrice') setFilters({...filters, minPrice: item.name});
                       if (modalType === 'maxPrice') setFilters({...filters, maxPrice: item.name});
                       if (modalType === 'governorate') setFilters({...filters, governorate: item.name, governorate_id: item.id, city: '', city_id: ''});
                       if (modalType === 'city') setFilters({...filters, city: item.name, city_id: item.id});
                       setIsModalVisible(false);
                       setSearchQuery('');
                     }}
                     className="py-6 border-b border-slate-50 flex-row justify-between items-center"
                   >
                     <Check size={24} color={(filters[modalType] === item.name) ? '#CC222F' : '#EEE'} />
                     <Text className="text-xl font-black text-slate-800">
                        {modalType === 'brand' || modalType === 'model' || modalType === 'governorate' || modalType === 'city' 
                           ? getTranslatedName(item.name, modalType === 'brand' ? 'brands' : modalType === 'model' ? 'models' : 'locations') 
                           : item.name}
                     </Text>
                   </TouchableOpacity>
                 )}
               />
             )}
          </View>
        </View>
      </Modal>

      {/* Results Modal */}
      <Modal visible={resultsModalVisible} animationType="slide">
        <SafeAreaView className="flex-1 bg-[#f8f9fa]">
          <View className="px-5 py-6 flex-row items-center border-b border-gray-100 bg-white">
            <TouchableOpacity onPress={() => setResultsModalVisible(false)} className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center">
              <ChevronLeft size={28} color="#000" />
            </TouchableOpacity>
            <Text className="flex-1 text-center text-2xl font-black mr-12">{t('search.results')} ({searchResults.length})</Text>
          </View>

          {searchLoading ? (
            <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#CC222F" /></View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => { setResultsModalVisible(false); router.push(`/car/${item.id}`); }}
                  className="w-full bg-white rounded-[30px] mb-6 overflow-hidden border border-gray-100 shadow-sm"
                >
                  <View className="relative">
                    <Image source={{ uri: item.images?.[0] || item.image_urls?.[0] || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70' }} className="w-full h-56" resizeMode="cover" />
                    {item.vip_plan && (
                      <View className="absolute top-0 left-0 bg-[#FF5A5F] px-5 py-2 rounded-br-2xl rotate-[-5deg] mt-[-3px] ml-[-3px] shadow-sm shadow-red-500/50">
                        <Text className="text-white font-black text-[15px] tracking-widest">VIP</Text>
                      </View>
                    )}
                  </View>
                  <View className="p-5">
                    <View className="flex-row justify-between items-start">
                      <View className="items-end flex-1">
                        <Text className="text-2xl font-black text-gray-900">{getTranslatedName(item.brand, 'brands')} {getTranslatedName(item.model, 'models')}</Text>
                        <Text className="text-gray-500 font-black mt-1 text-lg">{item.year} • {item.mileage || 0} km</Text>
                      </View>
                      <Text className="text-[#CC222F] text-3xl font-black ml-4">${item.price?.toLocaleString()}</Text>
                    </View>
                    <View className="flex-row items-center mt-4 pt-4 border-t border-gray-50">
                      <MapPin size={16} color="#94a3b8" />
                      <Text className={`text-slate-400 text-sm font-black ${language === 'en' ? 'ml-1.5' : 'mr-1.5'}`}>{item.city ? `${item.governorate ? `${getTranslatedName(item.governorate, 'locations')} - ` : ''}${getTranslatedName(item.city, 'locations')}` : getTranslatedName(item.governorate || item.city || 'Erbil', 'locations')}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View className="py-20 items-center">
                  <Text className="text-gray-400 font-black text-xl">{t('search.noCarsFound')}</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
