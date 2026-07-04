import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Modal, 
  FlatList,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
  BackHandler,
  Platform,
  Linking
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  MapPin, 
  Car, 
  Calendar, 
  Search, 
  X,
  Layers,
  Settings2,
  PhoneCall,
  ChevronDown,
  Check,
  CheckCircle2
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import { uploadToR2 } from '../../src/lib/r2';
import { useLanguage } from '../../src/i18n/LanguageContext';

export default function SellCarScreen() {
  const router = useRouter();
  const { t, getTranslatedName, language } = useLanguage();
  const [step, setStep] = useState(1);

  const countryMap: Record<string, Record<string, string>> = {
    ar:  { 'خەلیجی': 'خليجي', 'ئەمریکی': 'أمريكي', 'کەنەدی': 'كندي', 'ئەورووپی': 'أوروبي', 'ژاپۆنی': 'ياباني', 'کۆری': 'كوري' },
    en:  { 'خەلیجی': 'Gulf', 'ئەمریکی': 'American', 'کەنەدی': 'Canadian', 'ئەورووپی': 'European', 'ژاپۆنی': 'Japanese', 'کۆری': 'Korean' },
    ckb: { 'خەلیجی': 'خەلیجی', 'ئەمریکی': 'ئەمریکی', 'کەنەدی': 'کەنەدی', 'ئەورووپی': 'ئەورووپی', 'ژاپۆنی': 'ژاپۆنی', 'کۆری': 'کۆری' },
    ku:  { 'خەلیجی': 'خەلیجی', 'ئەمریکی': 'ئەمریکی', 'کەنەدی': 'کەنەدی', 'ئەورووپی': 'ئەورووپی', 'ژاپۆنی': 'ژاپۆنی', 'کۆری': 'کۆری' },
  };
  const getCountryName = (name: string) => countryMap[language]?.[name] || name;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('+9647500000000');
  const [isExpired, setIsExpired] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showroomEndData, setShowroomEndData] = useState<Date | null>(null);

  const calculateDaysRemaining = () => {
    if (!showroomEndData) return 30;
    const remaining = Math.ceil((showroomEndData.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return remaining;
  };

  const [sellData, setSellData] = useState<any>({
    governorate: '', governorate_id: '', city: '', city_id: '', brand: '', brand_id: '', model: '', model_id: '', spec: '', spec_id: '', year: '',
    transmission: '', cylinders: '', interior_type: '', seats: '', engine_size: '', import_country: '',
    mileage: '', color: '', fuel_type: '', plate_type: '', plate_city: '', paint_status: '',
    description: '', currency: '$ (Dollar)', price: '', phone: '', phone2: '', mileage_unit: 'km',
    images: Array(8).fill(null)
  });

  const nextStep = () => setStep(s => {
    let next = s + 1;
    if (next === 10) next = 11;
    return Math.min(next, 15);
  });
  const prevStep = () => setStep(s => {
    let prev = s - 1;
    if (prev === 10) prev = 9;
    return Math.max(prev, 1);
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('whatsapp_number').eq('id', 1).single();
        if (data && data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).maybeSingle();
      const phone = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);
      if (!phone) return;
      const { data: showroom } = await supabase.from('showrooms').select('verified_until, created_at, is_verified').eq('phone', phone).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!showroom || !showroom.is_verified) return;
      let end: Date;
      if (showroom.verified_until) {
        end = new Date(showroom.verified_until);
      } else {
        end = new Date(showroom.created_at);
        end.setDate(end.getDate() + 30);
      }
      setShowroomEndData(end);
      const remaining = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (remaining <= 0) setIsExpired(true);
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingSubscription(false);
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (step > 1) {
        prevStep();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [step]);

  const openModal = async (type: string) => {
    setModalType(type);
    setIsModalVisible(true);
    let data: any[] = [];
    if (type === 'governorate') {
      const { data: govs } = await supabase.from('governorates').select('*').order('id');
      data = govs || [];
    }
    if (type === 'city') {
      if (sellData.governorate_id) {
        const { data: cities } = await supabase.from('cities').select('*').eq('governorate_id', sellData.governorate_id).order('name');
        data = cities || [];
      } else {
        const { data: cities } = await supabase.from('cities').select('*').order('name');
        data = cities || [];
      }
    }
    if (type === 'import_country') data = ['خەلیجی', 'ئەمریکی', 'کەنەدی', 'ئەورووپی', 'ژاپۆنی', 'کۆری'].map(n => ({id: n, name: n}));
    if (type === 'brand') {
      const { data: b } = await supabase.from('brands').select('*');
      if (b) {
        const brandOrder = [
          "Toyota", "Nissan", "BYD", "Mercedes-Benz", "Haval", "Jeep", 
          "Lexus", "Hyundai", "Ford", "Mitsubishi", "Jetour", "Geely", 
          "Land Rover", "MG", "Cadillac", "Mazda"
        ];
        b.sort((a, bItem) => {
          const indexA = brandOrder.indexOf(a.name);
          const indexB = brandOrder.indexOf(bItem.name);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.name.localeCompare(bItem.name);
        });
      }
      data = b || [];
    }
    if (type === 'model') {
      const { data: m } = await supabase.from('models').select('*').eq('brand_id', sellData.brand_id);
      if (m) {
        if (sellData.brand === 'Toyota') {
          const toyotaModelOrder = [
            "Hilux", "Corolla", "Avalon", "Camry", "Land Cruiser", "Crown", "Rav4", "Land Cruiser Prado",
            "Yaris", "Corolla Cross", "Urban Cruiser", "Frontlander", "Hiace", "Highlander", "Fortuner",
            "4Runner", "Tundra", "Venza", "Corona", "Coaster", "Yaris Cross", "Corolla GR"
          ];
          m.sort((a, bItem) => {
            const indexA = toyotaModelOrder.indexOf(a.name);
            const indexB = toyotaModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Nissan') {
          const nissanModelOrder = [
            "Patrol", "X-Trail", "Kicks", "Sunny", "Sentra", "Sylphy", "Qashqai", "Navara", "Urvan", "Altima", 
            "Rogue", "Rogue Sport", "Pathfinder", "Maxima", "Murano", "Frontier", "Versa", "Xterra", "Armada", 
            "Patrol Safari", "Civilian", "Tiida", "Patrol Pickup", "Altima Coupe", "Pickup", "370Z", "GT-R", 
            "350Z", "Leaf", "Micra", "Juke", "Versa Note", "NV", "Primera", "Pulsar", "Quest", "Teana", "Terrano", 
            "Titan", "NP300", "Cedric", "NV200", "Z", "Elgrand", "Ariya", "Almera", "Cube", "Laurel Altima", 
            "Bluebird", "Magnite", "Vanette", "Skyline GT-R", "Prairie", "Atleon"
          ];
          m.sort((a, bItem) => {
            const indexA = nissanModelOrder.indexOf(a.name);
            const indexB = nissanModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Mercedes-Benz') {
          const benzModelOrder = ["E-Class", "C-Class", "S-Class", "G-Class", "CLS", "CLA", "GLE", "GLS", "GLC", "AMG GT", "CLK-Class", "GLA", "CLC-Class", "GLB", "Vito", "GLC-Class Coupe", "GLK-Class", "V-Class", "Viano", "SLC-Class", "SLK-Class", "A-Class", "SLR McLaren", "SLS AMG", "GL-Class", "AMG GT 4-door Coupe", "ML-Class", "SL-Class", "S-Class Maybach", "Sprinter", "B-Class", "CL-Class", "R-Class", "X-Class", "SSK", "Ponton", "V-Class Maybach", "SEC", "EQV", "EQS", "EQE Sedan", "EQE SUV", "CLE Coupe", "EQB", "EQA", "T-Class", "GLE Coupe"];
          m.sort((a, bItem) => {
            const indexA = benzModelOrder.indexOf(a.name);
            const indexB = benzModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Jeep') {
          const jeepModelOrder = ["Grand Cherokee", "Wrangler", "Grand Cherokee L", "Cherokee", "Compass", "Patriot", "Commander", "Gladiator", "Renegade", "Asia", "Liberty", "Grand Wagoneer", "Willys", "Wagoneer"];
          m.sort((a, bItem) => {
            const indexA = jeepModelOrder.indexOf(a.name);
            const indexB = jeepModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Lexus') {
          const lexusModelOrder = ["LX", "LS", "LC", "ES", "GS", "GX"];
          m.sort((a, bItem) => {
            const indexA = lexusModelOrder.indexOf(a.name);
            const indexB = lexusModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Mitsubishi') {
          const mitsuModelOrder = ["Lancer", "Mirage", "Nativa", "Outlander", "Outlander Sport", "L200", "Pajero", "Pajero Sport", "Eclipse Cross", "Xpander Cross", "Attrage"];
          m.sort((a, bItem) => {
            const indexA = mitsuModelOrder.indexOf(a.name);
            const indexB = mitsuModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Geely') {
          const geelyModelOrder = [
            "Cityray", "Starray", "Monjaro", "Coolray", "Emgrand", "Okavango", "GX3", "GX3 Pro", 
            "Azkarra", "Emgrand X7", "Emgrand X7 Sport", "Emgrand EC8", "Emgrand GT", "GC2", 
            "GC6", "CK", "GX2", "GC7", "Emgrand EC7", "Emgrand GS", "SC7", "Boyue", "Tugella", 
            "MK", "LC", "FC", "Geometry C", "MK Cross", "Binrui", "Preface", "Galaxy Starship 7", "Galaxy L6"
          ];
          m.sort((a, bItem) => {
            const indexA = geelyModelOrder.indexOf(a.name);
            const indexB = geelyModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Land Rover') {
          const lrModelOrder = [
            "Range Rover Sport", "Range Rover Vogue", "Defender", "Range Rover Evoque", 
            "Range Rover Velar", "Discovery", "Discovery Sport", "Freelander", 
            "LR2", "LR3", "LR4", "Defender Pickup"
          ];
          m.sort((a, bItem) => {
            const indexA = lrModelOrder.indexOf(a.name);
            const indexB = lrModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'MG') {
          const mgModelOrder = [
            "5", "RX9", "GT", "3", "ZS", "Whale", "7", "RX5", "6", "HS", "RX8", 
            "One", "T60", "350", "550", "750", "360", "Midget", "5 Plus", 
            "MG4 EV", "GS", "Rakan", "Magistor"
          ];
          m.sort((a, bItem) => {
            const indexA = mgModelOrder.indexOf(a.name);
            const indexB = mgModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Cadillac') {
          const cadillacModelOrder = [
            "Escalade", "CT4", "ATS", "ATS-V", "XT4", "BLS", "ATS-V Coupe", "ATS Coupe", 
            "XLR", "SRX", "CT6", "DTS", "SLS", "STS", "XTS", "CTS Coupe", "CTS-V Coupe", 
            "XT5", "CT5", "CTS", "CTS-V", "XT6", "Eldorado", "DeVille", "Seville", 
            "Fleetwood", "Lyriq", "Optiq"
          ];
          m.sort((a, bItem) => {
            const indexA = cadillacModelOrder.indexOf(a.name);
            const indexB = cadillacModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'BMW') {
          const bmwModelOrder = [
            "5 Series", "3 Series", "7 Series", "4 Series", "X3", "X5", "X6", "X7", "X4", "X1", "XM",
            "Z4", "8 Series", "i3", "i4", "iX1", "i8", "i5", "iX3", "iX", "1 Series", "2 Series", "6 Series",
            "X2", "Z3"
          ];
          m.sort((a, bItem) => {
            const indexA = bmwModelOrder.indexOf(a.name);
            const indexB = bmwModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Changan') {
          const changanModelOrder = [
            "Alsvin", "Eado", "CS75", "CS95", "CS35", "CS85", "Hunter", "CM5", 
            "UNI-K", "UNI-T", "Star 9", "Star Truck", "E-Star", "UNI-V", 
            "Eado Plus", "CS75 Plus", "UNI-S", "CS15", "CS35 Plus", "Raeton", 
            "X5 Plus", "Victory", "UNI-Z"
          ];
          m.sort((a, bItem) => {
            const indexA = changanModelOrder.indexOf(a.name);
            const indexB = changanModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Chevrolet') {
          const chevroletModelOrder = [
            "Tahoe", "Camaro", "Malibu", "Silverado", "Corvette", "Impala", "Blazer", "Equinox", 
            "Traverse", "Optra", "Cruze", "Bolt", "Captiva", "Trax", "Onix", "Uplander", 
            "Caprice", "Suburban", "Avalanche", "Colorado", "T-Series", "Epica", "Lumina", 
            "Trailblazer", "Spark", "CSV CR8", "Aveo", "Sonic", "Bel Air", "Celebrity", 
            "Cobalt", "Corvair", "Express", "HHR", "Monte Carlo", "Nova", "Sail", "SSR", 
            "Tracker", "Groove", "SS", "C10", "Orlando", "Venture", "LUV D-Max", "Astro", 
            "K5 Blazer", "C/K", "N300", "Metro"
          ];
          m.sort((a, bItem) => {
            const indexA = chevroletModelOrder.indexOf(a.name);
            const indexB = chevroletModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'GMC') {
          const gmcModelOrder = [
            "Yukon", "Terrain", "Sierra", "Acadia", "Envoy", "Savana", "Canyon", "Jimmy", 
            "Hummer EV", "Yukon XL", "Safari", "Sonoma", "P3500", "Hummer EV Pickup"
          ];
          m.sort((a, bItem) => {
            const indexA = gmcModelOrder.indexOf(a.name);
            const indexB = gmcModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Honda') {
          const hondaModelOrder = [
            "Legend", "Accord Coupe", "Accord", "Pilot", "MR-V", "Accord Crosstour", 
            "S2000", "Jazz", "City", "Odyssey J", "Odyssey", "CR-V", "HR-V", 
            "Civic Hatchback", "CRX", "Civic", "Passport", "eNS1", "Insight", 
            "Element", "e:NP1", "Acura TLX", "ZR-V", "Ridgeline", "Civic Type R", 
            "Concerto", "Prologue"
          ];
          m.sort((a, bItem) => {
            const indexA = hondaModelOrder.indexOf(a.name);
            const indexB = hondaModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Honda') {
          const hondaModelOrder = [
            "Legend", "Accord Coupe", "Accord", "Pilot", "MR-V", "Accord Crosstour", 
            "S2000", "Jazz", "City", "Odyssey J", "Odyssey", "CR-V", "HR-V", 
            "Civic Hatchback", "CRX", "Civic", "Passport", "eNS1", "Insight", 
            "Element", "e:NP1", "Acura TLX", "ZR-V", "Ridgeline", "Civic Type R", 
            "Concerto", "Prologue"
          ];
          m.sort((a, bItem) => {
            const indexA = hondaModelOrder.indexOf(a.name);
            const indexB = hondaModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Infiniti') {
          const infinitiModelOrder = [
            "Q50", "Q45", "QX80", "QX56", "Q70", "G", "M", "QX60", "QX70", "FX", 
            "JX", "Q60 Convertible", "G37 Convertible", "Q60 Coupe", "G37 Coupe", 
            "G35", "EX", "QX50", "G35 Coupe", "Q30", "QX30", "QX4", "G37", 
            "QX55", "M37"
          ];
          m.sort((a, bItem) => {
            const indexA = infinitiModelOrder.indexOf(a.name);
            const indexB = infinitiModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Kia') {
          const kiaModelOrder = [
            "Sorento", "Sportage", "K4", "Tasman", "K3", "Cerato", "Forte", "Forte5", 
            "Sonet", "K5", "K7", "Optima", "K8", "Niro", "K900", "Rio", "Soul", 
            "Picanto", "Carens", "Cadenza", "EV5", "EV6", "EV9", "Seltos", "Mohave", 
            "Telluride", "Quoris", "Carnival", "Stinger", "Pegas", "Opirus", "Lotze", 
            "Ceed", "Sedona", "Bongo", "Sephia", "Besta", "Ray", "Spectra", "Pregio", 
            "Pride", "Potentia", "Stonic", "Credos", "KX1", "Forte Koup", "Concord"
          ];
          m.sort((a, bItem) => {
            const indexA = kiaModelOrder.indexOf(a.name);
            const indexB = kiaModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Peugeot') {
          const peugeotModelOrder = [
            "308", "307", "408", "3008", "5008", "407 Coupe", "508", "407", "607", 
            "RCZ", "208", "206", "207", "301", "2008", "CC 308", "Expert", "Partner", 
            "Boxer", "306", "405", "Roa", "406", "Pars", "Traveller"
          ];
          m.sort((a, bItem) => {
            const indexA = peugeotModelOrder.indexOf(a.name);
            const indexB = peugeotModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Renault') {
          const renaultModelOrder = [
            "Megane", "Symbol", "Koleos", "Talisman", "Captur", "Duster", "Clio", 
            "Logan", "Sandero", "Dokker Van", "Logan Van", "Trafic", "Megane CC", 
            "Megane GT", "Megane RS", "Fluence", "Espace", "Laguna Coupe", "Laguna", 
            "Scenic", "Safrane", "Twizy", "Zoe", "Clio RS", "Tondar 90", "Lodgy", 
            "Kangoo", "Renault 19", "Master", "12", "Fregate", "Arkana", "Express"
          ];
          m.sort((a, bItem) => {
            const indexA = renaultModelOrder.indexOf(a.name);
            const indexB = renaultModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Suzuki') {
          const suzukiModelOrder = [
            "Swift", "Dzire", "Fronx", "Baleno", "Ciaz", "Ertiga", "Grand Vitara", 
            "Jimny", "S-Cross", "Vitara", "Ignis Crossover", "Ignis", "SX4", "Liana", 
            "APV", "Carry", "Kizashi", "XL7", "Celerio", "Alto", "S-Presso", "Reno", 
            "Forenza", "Eeco"
          ];
          m.sort((a, bItem) => {
            const indexA = suzukiModelOrder.indexOf(a.name);
            const indexB = suzukiModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Volkswagen') {
          const vwModelOrder = [
            "Jetta", "Atlas", "Golf", "Passat", "Tiguan", "Atlas Cross Sport", "Arteon", 
            "Taos", "Golf R", "Beetle", "Touareg", "Amarok", "Eos", "Golf Plus", "Scirocco", 
            "Polo", "Sharan", "Phaeton", "Touran", "Multivan", "Passat CC", "Multivan Alltrack", 
            "Caddy", "Bora", "T-Roc", "ID.4", "Taigo", "ID.6", "ID.3", "Jetta VS7", 
            "Transporter", "e-Tharu", "Routan", "T-Cross", "Vento"
          ];
          m.sort((a, bItem) => {
            const indexA = vwModelOrder.indexOf(a.name);
            const indexB = vwModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else if (sellData.brand === 'Volvo') {
          const volvoModelOrder = [
            "V40", "C30", "S90", "S80", "XC90", "V90", "S60", "S40", "S60 Polestar", 
            "XC60", "V60", "V60 Polestar", "V50", "C70", "XC70", "V70", "XC40", 
            "940", "740", "240", "244 GLE", "960", "440"
          ];
          m.sort((a, bItem) => {
            const indexA = volvoModelOrder.indexOf(a.name);
            const indexB = volvoModelOrder.indexOf(bItem.name);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(bItem.name);
          });
        } else {
          m.sort((a, bItem) => a.name.localeCompare(bItem.name));
        }
      }
      data = m || [];
    }
    if (type === 'spec') {
      const { data: s } = await supabase.from('specs').select('*').eq('model_id', sellData.model_id).order('name');
      data = s || [];
    }
    if (type === 'year') {
      for (let i = 2026; i >= 1990; i--) data.push({ id: i.toString(), name: i.toString() });
    }
    if (type === 'mileage_unit') data = ['km', 'Mil'].map(n => ({id: n, name: n}));
    if (type === 'currency') data = ['$ (Dollar)', 'IQD (Dinar)'].map(n => ({id: n, name: n}));
    setModalData(data);
  };

  const SelectionField = ({ label, value, onPress, placeholder }: any) => (
    <View className="mb-6 px-6">
      <Text className="text-slate-500 font-bold mb-2 text-right mr-2 text-lg">{label}</Text>
      <TouchableOpacity onPress={onPress} className="bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center justify-between px-8 shadow-sm">
        <ChevronDown size={20} color="#BBB" />
        <Text className={`text-xl font-bold ${value ? 'text-slate-900' : 'text-slate-300'}`}>{value || placeholder}</Text>
      </TouchableOpacity>
    </View>
  );

  const OptionButton = ({ label, selected, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className={`flex-1 h-16 rounded-3xl items-center justify-center border-2 ${selected ? 'border-[#CC222F] bg-white' : 'border-slate-100 bg-slate-50'}`}>
      <Text className={`text-lg font-black ${selected ? 'text-[#CC222F]' : 'text-[#1A1A1A]'}`}>{label}</Text>
    </TouchableOpacity>
  );

  const SelectionCard = ({ label, selected, onPress }: any) => (
    <TouchableOpacity onPress={onPress} className={`h-20 rounded-[30px] flex-row items-center justify-end px-10 mb-4 border-2 ${selected ? 'border-[#CC222F] bg-white' : 'border-slate-50 bg-white'}`}>
      <Text className={`text-xl font-bold ${selected ? 'text-[#CC222F]' : 'text-[#1A1A1A]'}`}>{label}</Text>
    </TouchableOpacity>
  );

  const pickImage = async (index: number) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8,
      quality: 0.5,
      base64: true
    });

    if (!result.canceled) {
      const newImages = [...sellData.images];
      result.assets.forEach((asset, i) => {
        const targetIndex = index + i;
        if (targetIndex < 8) {
          newImages[targetIndex] = asset;
        }
      });
      setSellData({ ...sellData, images: newImages });
    }
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const img of sellData.images) {
      if (img && img.base64) {
        const fileName = `cars/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        try {
          const publicUrl = await uploadToR2(img.base64, fileName, 'image/jpeg');
          uploadedUrls.push(publicUrl);
        } catch (error) {
          console.error("Failed to upload image to R2:", error);
        }
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("بەکارهێنەر نەدۆزرایەوە");

      const imageUrls = await uploadImages();
      
      if (imageUrls.length === 0) {
        throw new Error("تکایە وێنەکان بار بکە یان دووبارە تاقی بکەرەوە.");
      }
      
      // Get phone number to find showroom ID
      const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
      const phoneToUse = profile?.phone || user.user_metadata?.phone || (user.email ? user.email.replace('@taban.com', '') : null);

      let showroom_id = null;
      if (phoneToUse) {
         const { data: showroom } = await supabase.from('showrooms').select('id').eq('phone', phoneToUse).order('created_at', { ascending: false }).limit(1).single();
         if (showroom) showroom_id = showroom.id;
      }
      
      const { error } = await supabase.from('cars').insert({
        brand: sellData.brand,
        model: sellData.model,
        year: sellData.year,
        transmission: sellData.transmission,
        fuel_type: sellData.fuel_type,
        color: sellData.color,
        mileage: sellData.mileage,
        price: sellData.price,
        phone: sellData.phone,
        phone2: sellData.phone2 || null,
        engine_size: sellData.engine_size,
        description: sellData.description,
        city: sellData.city,
        governorate: sellData.governorate,
        images: imageUrls,
        status: 'pending',
        user_id: user.id,
        showroom_id: showroom_id
      });

      if (error) throw error;
      setStep(15);
    } catch (err: any) {
      alert('هەڵەیەک ڕوویدا لە کاتی بڵاوکردنەوەدا: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <View className="flex-1"><SelectionField label="پارێزگا" value={sellData.governorate} onPress={() => openModal('governorate')} placeholder="هەڵبژێره..." /><SelectionField label="شار / قەزا" value={sellData.city} onPress={() => openModal('city')} placeholder="هەڵبژێره..." /></View>;
      case 2: return (
        <View className="flex-1 px-6">
          <View className="flex-row flex-wrap justify-between">
            {sellData.images.map((img: any, i: number) => (
              <TouchableOpacity key={i} onPress={() => pickImage(i)} className="w-[48%] h-32 bg-white border border-slate-100 rounded-[30px] items-center justify-center mb-4 overflow-hidden">
                {img ? (
                  <Image source={{ uri: img.uri }} className="w-full h-full" resizeMode="contain" />
                ) : (
                  <>
                    <Camera size={32} color="#CCC" />
                    <Text className="text-slate-300 font-bold mt-2">وێنەی {i + 1}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
      case 3: return <View className="flex-1"><SelectionField label="براند" value={sellData.brand} onPress={() => openModal('brand')} placeholder="هەڵبژێره..." /><SelectionField label="مۆدێل" value={sellData.model} onPress={() => openModal('model')} placeholder="هەڵبژێره..." /><SelectionField label="ساڵ" value={sellData.year} onPress={() => openModal('year')} placeholder="هەڵبژێره..." /><SelectionField label="مواسەفات" value={sellData.spec} onPress={() => openModal('spec')} placeholder="هەڵبژێره..." /></View>;
      case 4: return (
        <View className="flex-1 px-6">
          <SelectionField label="وڵاتی هاوردەکردن" value={sellData.import_country} onPress={() => openModal('import_country')} placeholder="هەڵبژێره..." />
          <Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">جۆری گێڕ</Text>
          <View className="flex-row gap-4 mb-8">
            <OptionButton label="گێڕ ئاسایی" selected={sellData.transmission === 'گێڕ ئاسایی'} onPress={() => setSellData({...sellData, transmission: 'گێڕ ئاسایی'})} />
            <OptionButton label="ئۆتۆماتیک" selected={sellData.transmission === 'ئۆتۆماتیک'} onPress={() => setSellData({...sellData, transmission: 'ئۆتۆماتیک'})} />
          </View>
          <Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">ژمارەی پستۆن</Text>
          <View className="flex-row gap-3">
            {['3 پستۆن', '4 پستۆن', '6 پستۆن', '8 پستۆن'].map(c => (
              <OptionButton key={c} label={c} selected={sellData.cylinders === c} onPress={() => setSellData({...sellData, cylinders: c})} />
            ))}
          </View>
        </View>
      );
      case 5: return <View className="flex-1 px-6"><Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">جۆری کوشن</Text><View className="flex-row gap-3 mb-8">{['پارچە', 'چەرم', 'ئەلکانتارا'].map(t => (<OptionButton key={t} label={t} selected={sellData.interior_type === t} onPress={() => setSellData({...sellData, interior_type: t})} />))}</View><Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">ژمارەی کورسی</Text><View className="flex-row gap-3 mb-8">{['2', '4', '5', '7'].map(s => (<OptionButton key={s} label={s} selected={sellData.seats === s} onPress={() => setSellData({...sellData, seats: s})} />))}</View><Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">قەبارەی مەکینە</Text><View className="bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center px-8"><TextInput placeholder="0.0" className="flex-1 text-2xl font-black text-right" keyboardType="numeric" value={sellData.engine_size} onChangeText={t => setSellData({...sellData, engine_size: t})} /></View></View>;
      case 6: return (
        <View className="flex-1 px-6">
          <Text className="text-slate-500 font-bold mb-2 text-right mr-2 text-lg">کیلۆمەتر</Text>
          <View className="flex-row items-center gap-4 mb-10">
            <View className="flex-1 bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center px-8">
              <TextInput placeholder="000,000" className="flex-1 text-2xl font-black text-right" keyboardType="numeric" value={sellData.mileage} onChangeText={t => setSellData({...sellData, mileage: t})} />
            </View>
            <TouchableOpacity onPress={() => openModal('mileage_unit')} className="w-32 bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center justify-center px-4">
              <ChevronDown size={18} color="#BBB" /><Text className="text-xl font-black ml-2">{sellData.mileage_unit}</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">ڕەنگ</Text>
          <View className="flex-row flex-wrap justify-end gap-5 mb-10">
            {[{c: '#FFF', n: 'سپى'}, {c: '#000', n: 'ڕەش'}, {c: '#C0C0C0', n: 'زیوی'}, {c: '#808080', n: 'خۆڵەمێشی'}, {c: '#F00', n: 'سوور'}, {c: '#00F', n: 'شین'}, {c: '#0F0', n: 'سەوز'}, {c: '#FF0', n: 'زەرد'}].map(color => (
              <TouchableOpacity key={color.n} onPress={() => setSellData({...sellData, color: color.n})} className="items-center">
                <View style={{backgroundColor: color.c}} className={`w-16 h-16 rounded-full border-4 ${sellData.color === color.n ? 'border-[#CC222F]' : 'border-slate-50'} shadow-sm`} />
                <Text className="text-[#1A1A1A] font-bold mt-2">{color.n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-slate-500 font-bold mb-4 text-right mr-2 text-lg">جۆری سووتەمەنی</Text>
          <View className="flex-row gap-3 mb-3">
            {['بەنزین', 'هایبرید'].map(f => (
              <OptionButton key={f} label={f} selected={sellData.fuel_type === f} onPress={() => setSellData({...sellData, fuel_type: f})} />
            ))}
          </View>
          <View className="flex-row gap-3 mb-10">
            {['کارەبایی', 'گاز'].map(f => (
              <OptionButton key={f} label={f} selected={sellData.fuel_type === f} onPress={() => setSellData({...sellData, fuel_type: f})} />
            ))}
          </View>
        </View>
      );
      case 7: return (
        <View className="flex-1 px-6">
          <Text className="text-slate-900 font-bold mb-6 text-right mr-2 text-xl">جۆری تابڵۆ هەڵبژێره</Text>
          {['تایبەت (Private)', 'کاتی (Temporary)', 'بارھەڵگر (Commercial)', 'تەکسی (Taxi)'].map(t => (
            <SelectionCard key={t} label={t} selected={sellData.plate_type === t} onPress={() => setSellData({...sellData, plate_type: t})} />
          ))}
        </View>
      );
      case 8: return (
        <View className="flex-1 px-6">
          <Text className="text-slate-900 font-bold mb-6 text-right mr-2 text-xl">شاری تابڵۆ هەڵبژێره</Text>
          {[
            'هەولێر',
            'سلێمانی',
            'دهۆک',
            'کەرکوک',
            'هەڵەبجە',
            'بەغداد',
            'نەینەوا',
            'بەسڕە',
            'ئەنبار',
            'بابیل',
            'کەربەلا',
            'نەجەف',
            'واست',
            'مەیسان',
            'ذی قار',
            'موسەننا',
            'قادسیە',
            'سەڵاحەددین',
            'دیالە'
          ].map(c => (
            <SelectionCard key={c} label={c} selected={sellData.plate_city === c} onPress={() => setSellData({...sellData, plate_city: c})} />
          ))}
        </View>
      );
      case 9: return (
        <View className="flex-1 px-6">
          <Text className="text-slate-900 font-bold mb-6 text-right mr-2 text-xl">بۆیە و پارچەکان</Text>
          {['بێ بۆیە (قەپات)', '١ بۆ ٢ پارچە', 'چەند پارچەیەک', 'هەمووی بۆیەیە', 'تەنها چەمەلەغ'].map(p => (
            <SelectionCard key={p} label={p} selected={sellData.paint_status === p} onPress={() => setSellData({...sellData, paint_status: p})} />
          ))}
        </View>
      );
      case 11: return <View className="flex-1 px-6"><TextInput multiline placeholder="تێبینی و وردەکاری تر لێرە بنووسە..." className="bg-white border border-slate-100 h-72 rounded-[40px] p-10 text-2xl font-bold text-right" value={sellData.description} onChangeText={t => setSellData({...sellData, description: t})} /></View>;
      case 12: return (
        <View className="flex-1 px-6">
          <SelectionField label="جۆری پارە" value={sellData.currency} onPress={() => openModal('currency')} placeholder="$ (Dollar)" />
          <Text className="text-slate-500 font-bold mb-2 text-right mr-2 text-lg">نرخی فرۆشتن</Text>
          <View className="bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center px-8 mb-6">
            <TextInput placeholder="00,000" className="flex-1 text-2xl font-black text-right" keyboardType="numeric" value={sellData.price} onChangeText={t => setSellData({...sellData, price: t})} />
          </View>
          <Text className="text-slate-500 font-bold mb-2 text-right mr-2 text-lg">ژمارەی تەلەفۆن</Text>
          <View className="bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center px-8 mb-6">
            <TextInput placeholder="07XX XXX XXXX" className="flex-1 text-2xl font-black text-right" keyboardType="numeric" value={sellData.phone} onChangeText={t => setSellData({...sellData, phone: t})} />
          </View>
          <Text className="text-slate-500 font-bold mb-2 text-right mr-2 text-lg">ژمارەی تەلەفۆنی دووەم (ئارەزوومەندانەیە)</Text>
          <View className="bg-white border border-slate-100 h-20 rounded-[35px] flex-row items-center px-8">
            <TextInput placeholder="07XX XXX XXXX" className="flex-1 text-2xl font-black text-right" keyboardType="numeric" value={sellData.phone2} onChangeText={t => setSellData({...sellData, phone2: t})} />
          </View>
        </View>
      );
      case 13: return (
        <View className="flex-1 px-6">
          <View className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm">
            <Text className="text-3xl font-black text-[#1A1A1A] mb-8 text-right">پێداچوونەوە</Text>
            {[{l: 'ئۆتۆمبێل', v: `${sellData.brand || '---'} ${sellData.model || ''}`}, {l: 'ساڵ', v: sellData.year || '---'}, {l: 'نرخ', v: `${sellData.price || '---'} ${sellData.currency}`}, {l: 'مۆبایل', v: sellData.phone || '---'}].map((item, i) => (
               <View key={i} className="flex-row justify-between py-6 border-b border-slate-50">
                  <Text className="text-2xl font-black text-[#1A1A1A]">{item.v}</Text>
                  <Text className="text-xl font-bold text-slate-300">{item.l}</Text>
               </View>
            ))}
          </View>
        </View>
      );
      case 14: return (
        <View className="flex-1 px-10 items-center justify-center">
          <CheckCircle2 size={120} color="#CC222F" />
          <Text className="text-3xl font-black text-slate-900 mt-10 mb-4 text-center">ئایا دڵنیای لە بڵاوکردنەوە؟</Text>
          <Text className="text-xl text-slate-400 font-bold text-center mb-10 px-6">زانیارییەکانت دوای بڵاوکردنەوە دەخرێنە ژێر پێداچوونەوە</Text>
          <TouchableOpacity 
            onPress={() => {
              // Re-check subscription on final publish
              const remaining = calculateDaysRemaining();
              if (remaining <= 0) {
                setIsExpired(true);
              } else {
                handleSubmit();
              }
            }} 
            disabled={isLoading}
            className="bg-[#CC222F] w-full h-20 rounded-[35px] items-center justify-center shadow-lg shadow-red-200"
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-2xl font-black">بەڵێ، بڵاوی بکەرەوە</Text>}
          </TouchableOpacity>
        </View>
      );
      case 15: return (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-44 h-44 bg-emerald-500 rounded-full items-center justify-center mb-10 shadow-xl shadow-emerald-500/40">
             <Check size={90} color="white" strokeWidth={4} />
          </View>
          <Text className="text-6xl font-black text-[#1A1A1A] mb-12">پیرۆزە!</Text>
          <TouchableOpacity onPress={() => router.push('/(showroom-tabs)')} className="w-48 bg-[#0F172A] py-8 rounded-full items-center">
            <Text className="text-white text-2xl font-black">تەواو</Text>
          </TouchableOpacity>
        </View>
      );
      default: return <View className="p-10"><Text className="text-center font-bold">قۆناغی {step}</Text></View>;
    }
  };

  const getStepTitle = () => {
    const titles: any = { 1: t('sell.step1Title'), 2: t('sell.step2Title'), 3: t('sell.step3Title'), 4: t('sell.step4Title'), 5: t('sell.step5Title'), 6: t('sell.step6Title'), 7: t('sell.step7Title'), 8: t('sell.step8Title'), 9: t('sell.step9Title'), 11: t('sell.step11Title'), 12: t('sell.step12Title'), 13: t('sell.step13Title'), 14: t('sell.step14Title') };
    const subs: any = { 1: t('sell.step1Sub'), 2: t('sell.step2Sub'), 3: t('sell.step3Sub'), 4: t('sell.step4Sub'), 5: t('sell.step5Sub'), 6: t('sell.step6Sub'), 7: t('sell.step7Sub'), 8: t('sell.step8Sub'), 9: t('sell.step9Sub'), 11: t('sell.step11Sub'), 12: t('sell.step12Sub'), 13: t('sell.step13Sub'), 14: t('sell.step14Sub') };
    return { title: titles[step] || t('sell.title'), sub: subs[step] || '' };
  };

  // Check subscription
  if (checkingSubscription) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
        <ActivityIndicator size="large" color="#CC222F" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Expiry Warning Modal */}
      <Modal visible={isExpired} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 30, padding: 24, alignItems: 'center' }}>
            <TouchableOpacity 
              style={{ alignSelf: 'flex-start', padding: 8 }}
              onPress={() => setIsExpired(false)}
            >
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>

            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 40 }}>🔒</Text>
            </View>
            
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1f2937', textAlign: 'center', marginBottom: 16 }}>
              بەشداریەکەت کۆتایی هاتووە
            </Text>
            
            <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 20, padding: 16, width: '100%', marginBottom: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'center', lineHeight: 26, marginBottom: 16 }}>
                بەرێزەکەم بەشداری مانگاکەت کۆتایی هاتووە تکایە بۆ بەشداری کردنی ئەکاونتی جالاکی مانگانە و پشتراستکراوە تکایە پەیوەندی بکەن بە وەتسئاپی ئەم ژمارەیە
              </Text>
              <TouchableOpacity
                style={{ backgroundColor: '#25D366', padding: 14, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={() => Linking.openURL(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`)}
              >
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>{whatsappNumber}</Text>
                <PhoneCall size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View className="flex-1 bg-white">
        <StatusBar barStyle="light-content" />
        {step < 15 && (
          <View className="bg-[#CC222F] pt-14 pb-12 rounded-b-[50px] items-center">
            <View className="w-full px-8 flex-row items-center justify-between mb-8">
               <TouchableOpacity onPress={() => step === 1 ? router.back() : prevStep()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
                 <ChevronLeft size={20} color="#CC222F" />
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => Linking.openURL(`whatsapp://send?phone=${whatsappNumber.replace('+', '')}`)}
                 className="bg-white/10 px-4 py-2 rounded-full border border-white/20 flex-row items-center"
               >
                 <Text className="text-white font-bold text-xs mr-2">{t('sell.callForHelp') || 'CALL FOR HELP'}</Text>
                 <PhoneCall size={14} color="white" />
               </TouchableOpacity>
            </View>
            <Text numberOfLines={1} className="text-white text-3xl font-black mb-2">{getStepTitle().title}</Text>
            <Text numberOfLines={1} className="text-white/70 text-lg font-bold">{getStepTitle().sub}</Text>
          </View>
        )}
        <KeyboardAwareScrollView
          style={{ flex: 1, backgroundColor: 'white' }}
          contentContainerStyle={{ paddingBottom: 160, paddingTop: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={100}
          enableAutomaticScroll={true}
        >
          {renderStep()}
        </KeyboardAwareScrollView>
        {step < 14 && (
          <View className="p-8 flex-row gap-4 bg-white pb-12">
            <TouchableOpacity onPress={prevStep} className="flex-1 bg-slate-50 h-20 rounded-[35px] items-center justify-center border border-slate-100">
              <Text className="text-slate-400 text-2xl font-black">پێشوو</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={nextStep} className="flex-[2] bg-[#CC222F] h-20 rounded-[35px] items-center justify-center shadow-lg">
              <Text className="text-white text-2xl font-black">دواتر</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Modal visible={isModalVisible} animationType="fade" transparent={true}>
          <View className="flex-1 bg-black/60 justify-center items-center px-10">
            <View className="bg-white w-full max-h-[70%] rounded-[40px] overflow-hidden p-6 shadow-2xl">
              <View className="mb-4">
                <Text className="text-xl font-bold text-[#1A1A1A] text-right mb-4">
                  {modalType === 'brand' ? t('sell.brand') : modalType === 'model' ? t('sell.model') : modalType === 'spec' ? t('sell.spec') : modalType === 'governorate' ? t('sell.governorate') : t('sell.selection')}
                </Text>
                <View className="flex-row-reverse items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                  <Search size={18} color="#999" />
                  <TextInput 
                    placeholder={t('sell.search') || 'گەڕان...'} 
                    className="flex-1 mr-3 font-bold text-base text-right"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <FlatList
                data={modalData.filter(i => {
                  const cat = modalType === 'import_country' ? 'importCountries' : (modalType === 'brand' ? 'brands' : (modalType === 'model' ? 'models' : (modalType === 'governorate' || modalType === 'city' ? 'locations' : undefined)));
                  const displayName = modalType === 'import_country' ? getCountryName(i.name) : getTranslatedName(i.name, cat);
                  return displayName.toLowerCase().includes(searchQuery.toLowerCase());
                })}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = (modalType === 'brand' && sellData.brand === item.name) || 
                                   (modalType === 'model' && sellData.model === item.name) ||
                                   (modalType === 'spec' && sellData.spec === item.name) ||
                                   (modalType === 'governorate' && sellData.governorate === item.name) ||
                                   (modalType === 'city' && sellData.city === item.name) ||
                                   (modalType === 'year' && sellData.year === item.name);

                  return (
                    <TouchableOpacity 
                      onPress={() => {
                        if(modalType==='governorate')setSellData({...sellData,governorate:item.name,governorate_id:item.id,city:'',city_id:''});
                        if(modalType==='city')setSellData({...sellData,city:item.name,city_id:item.id});
                        if(modalType==='brand')setSellData({...sellData,brand:item.name,brand_id:item.id,model:'',model_id:'',spec:'',spec_id:''});
                        if(modalType==='model')setSellData({...sellData,model:item.name,model_id:item.id,spec:'',spec_id:''});
                        if(modalType==='spec')setSellData({...sellData,spec:item.name,spec_id:item.id});
                        if(modalType==='year')setSellData({...sellData,year:item.name});
                        if(modalType==='mileage_unit')setSellData({...sellData,mileage_unit:item.name});
                        if(modalType==='currency')setSellData({...sellData,currency:item.name});
                        if(modalType==='import_country')setSellData({...sellData,import_country:item.name});
                        setSearchQuery('');
                        setIsModalVisible(false);
                      }}
                      className="flex-row items-center justify-between py-4 border-b border-slate-50"
                    >
                      <View className={`w-6 h-6 rounded-lg items-center justify-center border-2 ${isSelected ? 'border-[#CC222F] bg-[#CC222F]' : 'border-slate-200'}`}>
                        {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                      </View>
                      <View className="flex-row items-center gap-3 flex-1 flex-shrink">
                        <Text className={`text-lg font-bold ${isSelected ? 'text-[#CC222F]' : 'text-slate-500'}`} numberOfLines={1} style={{flexShrink: 1}}>
                          {modalType === 'import_country' ? getCountryName(item.name) : getTranslatedName(item.name, modalType === 'brand' ? 'brands' : (modalType === 'model' ? 'models' : (modalType === 'governorate' || modalType === 'city' ? 'locations' : undefined)))}
                        </Text>
                        {modalType === 'brand' && item.image_url && (
                          <Image source={{ uri: item.image_url }} className="w-8 h-8" resizeMode="contain" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              <View className="flex-row-reverse items-center mt-6 pt-2 border-t border-slate-50 gap-6">
                 <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Text className="text-[#CC222F] text-lg font-black">{t('sell.save') || 'پاشەکەوت'}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Text className="text-slate-400 text-lg font-black">{t('sell.cancel') || 'لابردن'}</Text>
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}
