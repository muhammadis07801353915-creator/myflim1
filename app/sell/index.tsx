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
  CheckCircle2,
  Wallet,
  Send,
  CreditCard,
  Copy
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../src/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { useRouter } from 'expo-router';
import { uploadToR2 } from '../../src/lib/r2';
import { useLanguage } from '../../src/i18n/LanguageContext';
import * as Clipboard from 'expo-clipboard';

export default function SellCarScreen() {
  const router = useRouter();
  const { t, getTranslatedName, language } = useLanguage();
  const isRTL = language === 'ckb' || language === 'ku' || language === 'ar';
  const [step, setStep] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVipEnabled, setIsVipEnabled] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('+9647500000000');
  const [adminPhones, setAdminPhones] = useState({ korek: '07501429094', asiacell: '07702750669', fastpay: '07500000000', fib: '07500000000' });

  const countryMap: Record<string, Record<string, string>> = {
    ar:  { 'خەلیجی': 'خليجي', 'ئەمریکی': 'أمريكي', 'کەنەدی': 'كندي', 'ئەورووپی': 'أوروبي', 'ژاپۆنی': 'ياباني', 'کۆری': 'كوري', 'ئەڵمانی': 'ألماني' },
    en:  { 'خەلیجی': 'Gulf', 'ئەمریکی': 'American', 'کەنەدی': 'Canadian', 'ئەورووپی': 'European', 'ژاپۆنی': 'Japanese', 'کۆری': 'Korean', 'ئەڵمانی': 'German' },
    ckb: { 'خەلیجی': 'خەلیجی', 'ئەمریکی': 'ئەمریکی', 'کەنەدی': 'کەنەدی', 'ئەورووپی': 'ئەورووپی', 'ژاپۆنی': 'ژاپۆنی', 'کۆری': 'کۆری', 'ئەڵمانی': 'ئەڵمانی' },
    ku:  { 'خەلیجی': 'خەلیجی', 'ئەمریکی': 'ئەمریکی', 'کەنەدی': 'کەنەدی', 'ئەورووپی': 'ئەورووپی', 'ژاپۆنی': 'ژاپۆنی', 'کۆری': 'کۆری', 'ئەڵمانی': 'ئەڵمانی' },
  };
  const getCountryName = (name: string) => countryMap[language]?.[name] || name;

  const [sellData, setSellData] = useState<any>({
    governorate: '', governorate_id: '', city: '', city_id: '', brand: '', brand_id: '', model: '', model_id: '', spec: '', spec_id: '', year: '',
    transmission: '', cylinders: '', interior_type: '', seats: '', engine_size: '', import_country: '',
    mileage: '', color: '', fuel_type: '', plate_type: '', plate_city: '', paint_status: '',
    description: '', currency: '$ (Dollar)', price: '', phone: '', phone2: '', mileage_unit: 'km',
    plan: 'free',
    paymentMethod: '', paymentType: '', paymentImages: [],
    paymentMethod: '', paymentType: '', paymentImages: [], paymentNote: '',
    images: Array(8).fill(null),
    features: [] as string[]
  });

  const FEATURES_LIST = [
    'door_shift', 'panorama', 'abs', 'seat_cooling', 'seat_heating',
    'electric_seats', 'smart_key', 'hill_holder', 'four_screens',
    'electric_trunk', 'camera_360', 'four_way_radar', 'lane_assist',
    'led_lights', 'three_drive_modes', 'remote_start', 'rain_sensor', 'wireless_charger'
  ];

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
        const { data } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (data) {
          if (data.vip_plan_enabled !== undefined) setIsVipEnabled(data.vip_plan_enabled);
          if (data.whatsapp_number) setWhatsappNumber(data.whatsapp_number);
          if (data.korek_number || data.asiacell_number || data.fastpay_number || data.fib_number) {
            setAdminPhones(prev => ({
              korek: data.korek_number || prev.korek,
              asiacell: data.asiacell_number || prev.asiacell,
              fastpay: data.fastpay_number || prev.fastpay,
              fib: data.fib_number || prev.fib
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (step === 22) { setStep(16); return true; }
      if (step === 20) { setStep(17); return true; }
      if (step === 19 || step === 15) { router.push('/'); return true; }
      if (step === 18) { setStep(17); return true; }
      if (step === 17) { setStep(16); return true; }
      if (step === 16) { setStep(14); return true; }
      
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
        if (cities) {
          cities.sort((a, b) => {
            const aIsCenter = a.name.includes('(ناوەند)') || a.name.includes('(Center)') || a.name.includes('(المركز)');
            const bIsCenter = b.name.includes('(ناوەند)') || b.name.includes('(Center)') || b.name.includes('(المركز)');
            if (aIsCenter && !bIsCenter) return -1;
            if (!aIsCenter && bIsCenter) return 1;
            return a.name.localeCompare(b.name);
          });
        }
        data = cities || [];
      } else {
        const { data: cities } = await supabase.from('cities').select('*').order('name');
        if (cities) {
          cities.sort((a, b) => {
            const aIsCenter = a.name.includes('(ناوەند)') || a.name.includes('(Center)') || a.name.includes('(المركز)');
            const bIsCenter = b.name.includes('(ناوەند)') || b.name.includes('(Center)') || b.name.includes('(المركز)');
            if (aIsCenter && !bIsCenter) return -1;
            if (!aIsCenter && bIsCenter) return 1;
            return a.name.localeCompare(b.name);
          });
        }
        data = cities || [];
      }
    }
    if (type === 'import_country') data = ['خەلیجی', 'ئەمریکی', 'کەنەدی', 'ئەورووپی', 'ژاپۆنی', 'کۆری', 'ئەڵمانی'].map(n => ({id: n, name: n}));
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
      <Text className={`text-slate-500 font-bold mb-2 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{label}</Text>
      <TouchableOpacity onPress={onPress} className={`bg-white border border-slate-100 h-20 rounded-[35px] flex-row${isRTL ? '' : '-reverse'} items-center justify-between px-8 shadow-sm`}>
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
    <TouchableOpacity onPress={onPress} className={`h-20 rounded-[30px] flex-row${isRTL ? '' : '-reverse'} items-center justify-end px-10 mb-4 border-2 ${selected ? 'border-[#CC222F] bg-white' : 'border-slate-50 bg-white'}`}>
      <Text className={`text-xl font-bold ${selected ? 'text-[#CC222F]' : 'text-[#1A1A1A]'}`}>{label}</Text>
    </TouchableOpacity>
  );

  const pickPaymentImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
      base64: true
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const currentImages = sellData.paymentImages || [];
      setSellData({ ...sellData, paymentImages: [...currentImages, ...result.assets] });
    }
  };

  
  const handleBalanceTransfer = () => {
    setSellData({...sellData, paymentType: 'balance'});
    let ussd = '';
    if (sellData.paymentMethod === 'korek') {
      ussd = `*215*${adminPhones.korek}*10000#`;
    } else if (sellData.paymentMethod === 'asiacell') {
      ussd = `*123*10000*${adminPhones.asiacell}#`;
    }
    if (ussd) {
      Linking.openURL(`tel:${encodeURIComponent(ussd)}`);
    }
    setStep(20);
  };

  const handlePublishClick = () => {
    if (sellData.plan === 'vip') {
      setStep(16);
    } else {
      handleSubmit();
    }
  };

  const handleVIPSubmit = async () => {
    if (sellData.paymentType !== 'balance' && (!sellData.paymentImages || sellData.paymentImages.length === 0)) {
      alert('تکایە وێنەی کارتەکە دابنێ');
      return;
    }
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const imageUrls = await uploadImages();

      // Upload payment proof images to R2 if any
      let proofUrls: string[] = [];
      if (sellData.paymentImages && sellData.paymentImages.length > 0) {
        for (const img of sellData.paymentImages) {
          if (img && img.base64) {
            const fileName = `payment-proofs/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
            try {
              const url = await uploadToR2(img.base64, fileName, 'image/jpeg');
              proofUrls.push(url);
            } catch (e) {
              console.error('proof upload error', e);
            }
          }
        }
      }

      const { error } = await supabase.from('cars').insert({
        brand: sellData.brand,
        model: sellData.model,
        year: sellData.year,
        transmission: sellData.transmission,
        fuel_type: sellData.fuel_type,
        color: sellData.color,
        mileage: sellData.mileage ? parseInt(sellData.mileage.toString().replace(/\D/g, '')) : null,
        price: sellData.price ? parseInt(sellData.price.toString().replace(/\D/g, '')) : 0,
        phone: sellData.phone,
        phone2: sellData.phone2 || null,
        engine_size: sellData.engine_size,
        description: sellData.description,
        city: sellData.city,
        governorate: sellData.governorate,
        images: imageUrls,
        status: 'pending',
        user_id: user?.id || null,
        vip_plan: true,
        payment_type: sellData.paymentType || 'balance',
        payment_proof_images: proofUrls,
        payment_note: sellData.paymentNote || null,
        payment_phone: sellData.phone,
        payment_method: sellData.paymentMethod,
        features: sellData.features || [],
      });

      if (error) {
        // If VIP columns don't exist yet, still submit as pending without VIP data
        const { error: fallbackError } = await supabase.from('cars').insert({
          brand: sellData.brand,
          model: sellData.model,
          year: sellData.year,
          transmission: sellData.transmission,
          fuel_type: sellData.fuel_type,
          color: sellData.color,
          mileage: sellData.mileage ? parseInt(sellData.mileage.toString().replace(/\D/g, '')) : null,
          price: sellData.price ? parseInt(sellData.price.toString().replace(/\D/g, '')) : 0,
          phone: sellData.phone,
          phone2: sellData.phone2 || null,
          engine_size: sellData.engine_size,
          description: sellData.description,
          city: sellData.city,
          governorate: sellData.governorate,
          images: imageUrls,
          status: 'pending',
          user_id: user?.id || null,
        });
        if (fallbackError) throw fallbackError;
      }
      setStep(19);
    } catch (err: any) {
      alert(`هەڵەیەک ڕوویدا: ` + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


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
      const imageUrls = await uploadImages();
      
      if (imageUrls.length === 0) {
        throw new Error(t('sell.errorImage') as string);
      }
      
      const { error } = await supabase.from('cars').insert({
        brand: sellData.brand,
        model: sellData.model,
        year: sellData.year,
        transmission: sellData.transmission,
        fuel_type: sellData.fuel_type,
        color: sellData.color,
        mileage: sellData.mileage ? parseInt(sellData.mileage.toString().replace(/\D/g, '')) : null,
        price: sellData.price ? parseInt(sellData.price.toString().replace(/\D/g, '')) : 0,
        phone: sellData.phone,
        phone2: sellData.phone2 || null,
        engine_size: sellData.engine_size,
        description: sellData.description,
        city: sellData.city,
        governorate: sellData.governorate,
        images: imageUrls,
        status: 'pending',
        user_id: user?.id || null,
        features: sellData.features || [],
      });

      if (error) throw error;
      setStep(15);
    } catch (err: any) {
      alert(`${t('sell.errorPublish')} ` + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return <View className="flex-1"><SelectionField label={t('sell.governorate')} value={getTranslatedName(sellData.governorate)} onPress={() => openModal('governorate')} placeholder={t('sell.choose')} /><SelectionField label={t('sell.city')} value={getTranslatedName(sellData.city)} onPress={() => openModal('city')} placeholder={t('sell.choose')} /></View>;
      case 2: return (
        <View className="flex-1 px-6">
          <View className={`flex-row${isRTL ? '' : '-reverse'} flex-wrap justify-between`}>
            {sellData.images.map((img: any, i: number) => (
              <TouchableOpacity key={i} onPress={() => pickImage(i)} className="w-[48%] h-32 bg-white border border-slate-100 rounded-[30px] items-center justify-center mb-4 overflow-hidden">
                {img ? (
                  <Image source={{ uri: img.uri }} className="w-full h-full" resizeMode="contain" />
                ) : (
                  <>
                    <Camera size={32} color="#CCC" />
                    <Text className="text-slate-300 font-bold mt-2">{t('sell.image')} {i + 1}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
      case 3: return <View className="flex-1"><SelectionField label={t('sell.brand')} value={getTranslatedName(sellData.brand)} onPress={() => openModal('brand')} placeholder={t('sell.choose')} /><SelectionField label={t('sell.model')} value={getTranslatedName(sellData.model)} onPress={() => openModal('model')} placeholder={t('sell.choose')} /><SelectionField label={t('sell.year')} value={sellData.year} onPress={() => openModal('year')} placeholder={t('sell.choose')} /><SelectionField label={t('sell.spec')} value={sellData.spec} onPress={() => openModal('spec')} placeholder={t('sell.choose')} /></View>;
      case 4: return (
        <View className="flex-1 px-6">
          <SelectionField label={t('sell.importCountry')} value={sellData.import_country} onPress={() => openModal('import_country')} placeholder={t('sell.choose')} />
          <Text className={`text-slate-500 font-bold mb-4 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.transmission')}</Text>
          <View className={`flex-row${isRTL ? '' : '-reverse'} gap-4 mb-8`}>
            {(t('sell.transmissions') as string[]).map(tr => (
              <OptionButton key={tr} label={tr} selected={sellData.transmission === tr} onPress={() => setSellData({...sellData, transmission: tr})} />
            ))}
          </View>
          <Text className={`text-slate-500 font-bold mb-4 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.cylinders')}</Text>
          <View className={`flex-row${isRTL ? '' : '-reverse'} gap-3`}>
            {(t('sell.cylindersList') as string[]).map(c => (
              <OptionButton key={c} label={c} selected={sellData.cylinders === c} onPress={() => setSellData({...sellData, cylinders: c})} />
            ))}
          </View>
        </View>
      );
      case 5: return <View className="flex-1 px-6"><Text className={`text-slate-500 font-bold mb-4 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.interiorType')}</Text><View className={`flex-row${isRTL ? '' : '-reverse'} gap-3 mb-8`}>{(t('sell.interiors') as string[]).map(type => (<OptionButton key={type} label={type} selected={sellData.interior_type === type} onPress={() => setSellData({...sellData, interior_type: type})} />))}</View><Text className={`text-slate-500 font-bold mb-4 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.seats')}</Text><View className={`flex-row${isRTL ? '' : '-reverse'} gap-3 mb-8`}>{['2', '4', '5', '7'].map(s => (<OptionButton key={s} label={s} selected={sellData.seats === s} onPress={() => setSellData({...sellData, seats: s})} />))}</View><Text className={`text-slate-500 font-bold mb-4 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.engineSize')}</Text><View className={`bg-white border border-slate-100 h-16 rounded-[25px] flex-row${isRTL ? '' : '-reverse'} items-center px-6`}><TextInput placeholder="0.0" className={`flex-1 text-xl font-black ${isRTL ? 'text-right' : 'text-left'}`} keyboardType="numeric" value={sellData.engine_size} onChangeText={t => setSellData({...sellData, engine_size: t})} /></View></View>;
      case 6: return (
        <View className="flex-1 px-6">
          {/* Mileage */}
          <Text className={`text-slate-500 font-bold mb-2 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.mileage')}</Text>
          <View className={`flex-row${isRTL ? '' : '-reverse'} items-center gap-3 mb-6`}>
            <View className={`flex-1 bg-white border border-slate-100 h-16 rounded-[25px] flex-row${isRTL ? '' : '-reverse'} items-center px-6`}>
              <TextInput placeholder="000,000" className={`flex-1 text-xl font-black ${isRTL ? 'text-right' : 'text-left'}`} keyboardType="numeric" value={sellData.mileage} onChangeText={t => setSellData({...sellData, mileage: t})} />
            </View>
            <TouchableOpacity onPress={() => openModal('mileage_unit')} className={`w-24 bg-white border border-slate-100 h-16 rounded-[25px] flex-row${isRTL ? '' : '-reverse'} items-center justify-center px-3`}>
              <ChevronDown size={16} color="#BBB" /><Text className={`text-lg font-black ${isRTL ? 'ml-1' : 'mr-1'}`}>{sellData.mileage_unit}</Text>
            </TouchableOpacity>
          </View>

          {/* Color */}
          <Text className={`text-slate-500 font-bold mb-3 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.color')}</Text>
          <View className={`flex-row${isRTL ? '' : '-reverse'} flex-wrap ${isRTL ? 'justify-end' : 'justify-start'} gap-3 mb-5`}>
            {(t('sell.colors') as any[]).map(color => (
              <TouchableOpacity key={color.n} onPress={() => setSellData({...sellData, color: color.n})} className="items-center">
                <View style={{backgroundColor: color.c}} className={`w-11 h-11 rounded-full border-4 ${sellData.color === color.n ? 'border-[#CC222F]' : 'border-slate-50'} shadow-sm`} />
                <Text className="text-[#1A1A1A] font-bold mt-1 text-[10px]">{color.n}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fuel Type */}
          <Text className={`text-slate-500 font-bold mb-3 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.fuelType')}</Text>
          <View className={`flex-row${isRTL ? '' : '-reverse'} flex-wrap gap-2 mb-2`}>
            {[...(t('sell.fuels1') as string[]), ...(t('sell.fuels2') as string[])].map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setSellData({...sellData, fuel_type: f})}
                className={`px-4 py-2.5 rounded-2xl border-2 ${sellData.fuel_type === f ? 'border-[#CC222F] bg-white' : 'border-slate-100 bg-slate-50'}`}
              >
                <Text className={`text-base font-black ${sellData.fuel_type === f ? 'text-[#CC222F]' : 'text-[#1A1A1A]'}`}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
      case 7: return (
        <View className="flex-1 px-6">
          <Text className={`text-slate-900 font-bold mb-6 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-xl`}>{t('sell.choosePlateType')}</Text>
          {(t('sell.plates') as string[]).map(t => (
            <SelectionCard key={t} label={t} selected={sellData.plate_type === t} onPress={() => setSellData({...sellData, plate_type: t})} />
          ))}
        </View>
      );
      case 8: return (
        <View className="flex-1 px-6">
          <Text className={`text-slate-900 font-bold mb-6 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-xl`}>{t('sell.choosePlateCity')}</Text>
          {(t('sell.cities') as string[]).map(c => (
            <SelectionCard key={c} label={c} selected={sellData.plate_city === c} onPress={() => setSellData({...sellData, plate_city: c})} />
          ))}
        </View>
      );
      case 9: return (
        <View className="flex-1 px-6">
          <Text className={`text-slate-900 font-bold mb-4 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-xl`}>{t('sell.paintStatus')}</Text>
          <View className={`flex-row${isRTL ? '' : '-reverse'} flex-wrap justify-between gap-y-3 pb-8`}>
            {(t('sell.paints') as string[]).map(p => (
              <TouchableOpacity
                key={p}
                onPress={() => setSellData({...sellData, paint_status: p})}
                className={`w-[48%] py-4 rounded-2xl border-2 items-center justify-center shadow-sm ${sellData.paint_status === p ? 'border-[#CC222F] bg-white' : 'border-slate-100 bg-slate-50'}`}
              >
                <Text className={`text-[13px] font-bold ${sellData.paint_status === p ? 'text-[#CC222F]' : 'text-slate-600'}`}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
      case 11: return <View className="flex-1 px-6"><TextInput multiline placeholder={t('sell.descriptionPlaceholder') as string} className={`bg-white border border-slate-100 h-72 rounded-[40px] p-10 text-2xl font-bold ${isRTL ? 'text-right' : 'text-left'}`} value={sellData.description} onChangeText={t => setSellData({...sellData, description: t})} /></View>;
      case 12: return (
        <View className="flex-1 px-6">
          <SelectionField label={t('sell.currency')} value={sellData.currency} onPress={() => openModal('currency')} placeholder="$ (Dollar)" />
          <Text className={`text-slate-500 font-bold mb-2 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.price')}</Text>
          <View className={`bg-white border border-slate-100 h-20 rounded-[35px] flex-row${isRTL ? '' : '-reverse'} items-center px-8 mb-6`}>
            <TextInput placeholder="00,000" className={`flex-1 text-2xl font-black ${isRTL ? 'text-right' : 'text-left'}`} keyboardType="numeric" value={sellData.price} onChangeText={t => setSellData({...sellData, price: t})} />
          </View>
          <Text className={`text-slate-500 font-bold mb-2 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.phone1')}</Text>
          <View className={`bg-white border border-slate-100 h-20 rounded-[35px] flex-row${isRTL ? '' : '-reverse'} items-center px-8 mb-6`}>
            <TextInput placeholder="07XX XXX XXXX" className={`flex-1 text-2xl font-black ${isRTL ? 'text-right' : 'text-left'}`} keyboardType="numeric" value={sellData.phone} onChangeText={t => setSellData({...sellData, phone: t})} />
          </View>
          <Text className={`text-slate-500 font-bold mb-2 ${isRTL ? 'text-right mr-2' : 'text-left ml-2'} text-lg`}>{t('sell.phone2')}</Text>
          <View className={`bg-white border border-slate-100 h-20 rounded-[35px] flex-row${isRTL ? '' : '-reverse'} items-center px-8`}>
            <TextInput placeholder="07XX XXX XXXX" className={`flex-1 text-2xl font-black ${isRTL ? 'text-right' : 'text-left'}`} keyboardType="numeric" value={sellData.phone2} onChangeText={t => setSellData({...sellData, phone2: t})} />
          </View>
        </View>
      );
      case 13: return (
        <View className="flex-1 px-6">
          <View className={`flex-row${isRTL ? '' : '-reverse'} flex-wrap gap-3`}>
            {FEATURES_LIST.map((featureId) => {
              const isSelected = sellData.features.includes(featureId);
              const label = (t('sell.featuresList') as any)?.[featureId] || featureId;
              return (
                <TouchableOpacity
                  key={featureId}
                  onPress={() => {
                    const newFeatures = isSelected
                      ? sellData.features.filter((f: string) => f !== featureId)
                      : [...sellData.features, featureId];
                    setSellData({ ...sellData, features: newFeatures });
                  }}
                  className={`flex-row items-center px-4 py-3 rounded-full border-2 ${
                    isSelected
                      ? 'border-[#CC222F] bg-[#CC222F]'
                      : 'border-slate-200 bg-white'
                  }`}
                  style={{ marginBottom: 4 }}
                >
                  {isSelected && <Check size={14} color="white" style={{ marginRight: isRTL ? 0 : 6, marginLeft: isRTL ? 6 : 0 }} />}
                  <Text className={`text-sm font-black ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {sellData.features.length === 0 && (
            <View className="mt-6 py-6 items-center">
              <Text className={`text-slate-400 font-bold text-base ${
                isRTL ? 'text-right' : 'text-left'
              }`}>
                {isRTL ? 'هیچ مواسەفاتێک هەڵنەبژێردراوە' : 'No features selected'}
              </Text>
            </View>
          )}
        </View>
      );
      case 14: return (
        <View className="flex-1 px-6">
          <Text className={`text-slate-900 font-black mb-6 ${isRTL ? 'text-right' : 'text-left'} text-2xl`}>{t('sell.choosePlan')}</Text>

          {/* Free Plan */}
          <TouchableOpacity 
            onPress={() => setSellData({...sellData, plan: 'free'})}
            className={`bg-white rounded-3xl p-6 mb-4 border-2 ${sellData.plan === 'free' ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 shadow-sm'}`}
          >
            <View className={`flex-row${isRTL ? '' : '-reverse'} justify-between items-start mb-4`}>
              {sellData.plan === 'free' ? (
                <View className="w-8 h-8 bg-emerald-500 rounded-full items-center justify-center">
                  <Check size={16} color="white" strokeWidth={3} />
                </View>
              ) : <View className="w-8 h-8 rounded-full border-2 border-slate-200" />}
              <View className={`${isRTL ? 'items-end' : 'items-start'}`}>
                <Text className="text-orange-400 font-bold text-sm tracking-widest mb-1">STARTER</Text>
                <Text className="text-3xl font-black text-slate-800">{t('sell.free')}</Text>
              </View>
            </View>
            <View className="mt-2 border-t border-slate-100 pt-4">
              <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'} mb-2`}>• {t('sell.freeFeature1')}</Text>
              <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'} mb-2`}>• {t('sell.freeFeature2')}</Text>
              <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'}`}>• {t('sell.freeFeature3')}</Text>
            </View>
          </TouchableOpacity>

          {/* VIP Plan */}
          {isVipEnabled && (
            <TouchableOpacity 
              onPress={() => setSellData({...sellData, plan: 'vip'})}
              className={`bg-white rounded-3xl p-6 border-2 ${sellData.plan === 'vip' ? 'border-purple-500 bg-purple-50/50' : 'border-slate-100 shadow-sm'}`}
            >
              <View className={`flex-row${isRTL ? '' : '-reverse'} justify-between items-start mb-4`}>
                {sellData.plan === 'vip' ? (
                  <View className="w-8 h-8 bg-purple-500 rounded-full items-center justify-center">
                    <Check size={16} color="white" strokeWidth={3} />
                  </View>
                ) : <View className="w-8 h-8 rounded-full border-2 border-slate-200" />}
                <View className={`${isRTL ? 'items-end' : 'items-start'}`}>
                  <Text className="text-purple-500 font-bold text-sm tracking-widest mb-1">VIP</Text>
                  <Text className="text-3xl font-black text-slate-800 mb-1">١٠,٠٠٠ <Text className="text-lg text-slate-500 font-bold">{t('sell.vipCurrency')}</Text></Text>
                </View>
              </View>
              <View className="mt-2 border-t border-slate-100 pt-4">
                <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'} mb-2`}>• {t('sell.vipFeature1')}</Text>
                <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'} mb-2`}>• {t('sell.vipFeature2')}</Text>
                <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'} mb-2`}>• {t('sell.vipFeature3')}</Text>
                <Text className={`text-slate-600 font-bold text-lg ${isRTL ? 'text-right' : 'text-left'}`}>• {t('sell.vipFeature4')}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={handlePublishClick} 
            disabled={isLoading}
            className={`w-full h-16 rounded-full items-center justify-center mt-10 shadow-lg ${sellData.plan === 'vip' ? 'bg-purple-600 shadow-purple-200' : 'bg-[#CC222F] shadow-red-200'}`}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-2xl font-black">{t('sell.publish')}</Text>}
          </TouchableOpacity>
        </View>
      );
      
      case 16: return (
        <View className="flex-1 bg-slate-50 absolute inset-0 z-50">
          <View className="bg-[#CC222F] pt-16 pb-12 rounded-b-[40px] items-center shadow-lg">
            <TouchableOpacity onPress={() => setStep(14)} className="absolute left-6 top-16 w-10 h-10 items-center justify-center">
              <ChevronLeft size={30} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold mb-2">{t('payment.title')}</Text>
            <Text className="text-white/80 text-lg">{t('payment.subtitle')}</Text>
          </View>
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Debit Card */}
            <View className="flex-row items-center mb-4">
               <CreditCard size={24} color="#475569" />
               <Text className="text-slate-600 font-bold ml-2 text-xl">{t('payment.debitCard')}</Text>
            </View>
            <View className="flex-row gap-4 mb-8">
               <TouchableOpacity onPress={() => alert(t('payment.comingSoon'))} className="flex-1 h-24 border border-slate-200 rounded-xl items-center justify-center bg-white shadow-sm">
                  <Text className="text-blue-800 font-black text-3xl italic">VISA</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => alert(t('payment.comingSoon'))} className="flex-1 h-24 border border-slate-200 rounded-xl items-center justify-center bg-white shadow-sm flex-row">
                  <View className="w-8 h-8 rounded-full bg-red-500 opacity-90 -mr-3 z-10" />
                  <View className="w-8 h-8 rounded-full bg-yellow-500 opacity-90" />
               </TouchableOpacity>
            </View>
            
            {/* e-Wallets */}
            <View className="flex-row items-center mb-4 mt-4">
               <Wallet size={24} color="#475569" />
               <Text className="text-slate-600 font-bold ml-2 text-xl">{t('payment.eWallets')}</Text>
            </View>
            <View className="flex-row flex-wrap gap-4">
               <TouchableOpacity onPress={() => { setSellData({...sellData, paymentMethod: 'fastpay', paymentType: 'wallet'}); setStep(22); }} className={`w-[85px] h-[85px] rounded-full items-center justify-center shadow-md ${sellData.paymentMethod === 'fastpay' ? 'border-4 border-emerald-500 bg-[#E12A61]' : 'bg-[#E12A61]'}`}>
                  <Text className="text-white font-black">FastPay</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setSellData({...sellData, paymentMethod: 'fib', paymentType: 'wallet'}); setStep(22); }} className={`w-[85px] h-[85px] rounded-full items-center justify-center shadow-md ${sellData.paymentMethod === 'fib' ? 'border-4 border-emerald-500 bg-[#00A8B8]' : 'bg-[#00A8B8]'}`}>
                   <Text className="text-white font-black text-lg">FIB</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setSellData({...sellData, paymentMethod: 'korek'}); setStep(17); }} className={`w-[85px] h-[85px] rounded-full items-center justify-center shadow-md ${sellData.paymentMethod === 'korek' ? 'border-4 border-emerald-500 bg-[#0B5ED7]' : 'bg-[#0B5ED7]'}`}>
                  <Text className="text-white font-black text-xs">KOREK</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setSellData({...sellData, paymentMethod: 'asiacell'}); setStep(17); }} className={`w-[85px] h-[85px] rounded-full items-center justify-center shadow-md ${sellData.paymentMethod === 'asiacell' ? 'border-4 border-emerald-500 bg-[#E30613]' : 'bg-[#E30613]'}`}>
                  <Text className="text-white font-black text-[10px]">Asiacell</Text>
               </TouchableOpacity>
            </View>
          </ScrollView>
          <View className="p-6 bg-white border-t border-slate-100 pb-10">
             <TouchableOpacity onPress={() => { if (!sellData.paymentMethod) { alert(t('payment.selectMethod')); return; } setStep(17); }} className="w-full h-16 bg-[#CC222F] rounded-full items-center justify-center shadow-lg">
                <Text className="text-white text-xl font-bold">{t('payment.next')}</Text>
             </TouchableOpacity>
          </View>
        </View>
      );
      case 17: return (
        <View className="flex-1 px-6 pt-10 absolute inset-0 z-50 bg-slate-50">
          <TouchableOpacity onPress={() => setStep(16)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm mb-6 mt-10">
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-slate-800 mb-8 text-center">{t('payment.choosePayType')}</Text>
          <TouchableOpacity onPress={() => { setSellData({...sellData, paymentType: 'card'}); setStep(18); }} className="bg-white p-8 rounded-3xl mb-4 border border-slate-200 items-center justify-center shadow-sm h-40">
             <Camera size={40} color="#475569" className="mb-4" />
             <Text className="text-xl font-bold text-slate-700">{t('payment.sendCard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBalanceTransfer} className="bg-white p-8 rounded-3xl border border-slate-200 items-center justify-center shadow-sm h-40">
             <Send size={40} color="#475569" className="mb-4" />
             <Text className="text-xl font-bold text-slate-700">{t('payment.sendBalance')}</Text>
          </TouchableOpacity>
        </View>
      );
      case 18: return (
        <View className="flex-1 px-6 pt-10 absolute inset-0 z-50 bg-[#F8F9FB]">
          <TouchableOpacity onPress={() => setStep(17)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm mb-6 mt-10">
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-3xl font-black text-[#1E293B] mb-4 text-center">{t('payment.uploadProof')}</Text>
          <Text className="text-lg text-slate-500 mb-10 text-center leading-relaxed">{t('payment.uploadDesc')}</Text>
          
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {sellData.paymentImages && sellData.paymentImages.length > 0 ? (
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {sellData.paymentImages.map((img: any, idx: number) => (
                  <View key={idx} className="w-[48%] aspect-square rounded-[30px] overflow-hidden shadow-sm border border-slate-200">
                    <Image source={{uri: img.uri}} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity onPress={() => {
                      const newImgs = [...sellData.paymentImages];
                      newImgs.splice(idx, 1);
                      setSellData({...sellData, paymentImages: newImgs});
                    }} className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center">
                      <X size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={pickPaymentImage} className="w-[48%] aspect-square bg-white rounded-[30px] border-2 border-dashed border-slate-300 items-center justify-center">
                   <Camera size={32} color="#94A3B8" className="mb-2" />
                   <Text className="text-slate-500 font-bold text-sm">{t('payment.add')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickPaymentImage} className="w-full h-64 bg-white rounded-[40px] border-2 border-dashed border-[#CBD5E1] items-center justify-center shadow-sm">
                 <View className="w-20 h-20 bg-[#F1F5F9] rounded-full items-center justify-center mb-4">
                   <Camera size={32} color="#64748B" />
                 </View>
                 <Text className="text-slate-600 font-bold text-lg">{t('payment.chooseImage')}</Text>
              </TouchableOpacity>
            )}

            <View className="mt-8 mb-8">
              <Text className="text-lg font-bold text-slate-700 mb-3 text-right">{t('payment.noteOptional')}</Text>
              <TextInput
                value={sellData.paymentNote}
                onChangeText={(text) => setSellData({ ...sellData, paymentNote: text })}
                placeholder={t('payment.notePlaceholder')}
                placeholderTextColor="#94A3B8"
                multiline
                className="w-full bg-white border border-slate-200 rounded-3xl p-6 text-right text-lg text-slate-700 shadow-sm"
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
            </View>

            <TouchableOpacity onPress={handleVIPSubmit} disabled={isLoading} className="w-full h-16 bg-[#CC222F] rounded-full items-center justify-center shadow-lg mt-4">
               {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-2xl font-black">{t('payment.sendPost')}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
      case 19: return (
        <View className="flex-1 items-center justify-center px-10 absolute inset-0 z-50 bg-white">
          <View className="w-48 h-48 bg-purple-500 rounded-[50px] items-center justify-center mb-10 shadow-xl shadow-purple-500/40 rotate-12">
             <View className="-rotate-12">
               <Check size={100} color="white" strokeWidth={4} />
             </View>
          </View>
          <Text className="text-4xl font-black text-[#1A1A1A] mb-6 text-center leading-tight">گەیشت!{"\n"}دەستەکانت خۆش</Text>
          <Text className="text-xl text-slate-600 mb-16 text-center leading-relaxed">لەماوەی 60 دەقە پێداچوونەوە بە پارەکە و ریکڵامەکەت دا دەکرێت و راستەوخۆ وەردەگیرێ</Text>
          <TouchableOpacity onPress={() => router.push('/')} className="w-full bg-[#0F172A] py-6 rounded-full items-center shadow-xl shadow-slate-900/20">
            <Text className="text-white text-2xl font-black">{t('sell.done')}</Text>
          </TouchableOpacity>
        </View>
      );

      
      case 20: return (
        <View className="flex-1 items-center justify-center px-6 absolute inset-0 z-50 bg-[#F8F9FB]">
          <View className="w-32 h-32 bg-blue-100 rounded-full items-center justify-center mb-8">
             <Send size={50} color="#0B5ED7" />
          </View>
          <Text className="text-3xl font-black text-slate-800 mb-4 text-center">{t('payment.balanceConfirmTitle')}</Text>
          <Text className="text-lg text-slate-600 mb-10 text-center leading-relaxed">
            {t('payment.balanceConfirmDesc')}
          </Text>
          <View className="w-full mb-8">
            <Text className="text-lg font-bold text-slate-700 mb-3 text-right">{t('payment.noteOptional')}</Text>
            <Text className="text-sm text-slate-500 mb-2 text-right">{t('payment.noteHint')}</Text>
            <TextInput
              value={sellData.paymentNote}
              onChangeText={(text) => setSellData({ ...sellData, paymentNote: text })}
              placeholder={t('payment.notePlaceholder')}
              placeholderTextColor="#94A3B8"
              multiline
              className="w-full bg-white border border-slate-200 rounded-3xl p-5 text-right text-base text-slate-700 shadow-sm"
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
          </View>
          
          <TouchableOpacity onPress={handleVIPSubmit} disabled={isLoading} className="w-full h-16 bg-[#CC222F] rounded-full items-center justify-center shadow-lg mb-4">
             {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-xl font-black">{t('payment.sendAd')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep(17)} disabled={isLoading} className="w-full h-16 bg-white border border-slate-200 rounded-full items-center justify-center">
             <Text className="text-slate-600 text-xl font-bold">{t('payment.back')}</Text>
          </TouchableOpacity>
        </View>
      );

      
      case 16: return (
        <View className="flex-1 bg-slate-50 absolute inset-0 z-50">
          <View className="bg-[#5B88D6] pt-16 pb-12 rounded-b-[40px] items-center shadow-lg">
            <TouchableOpacity onPress={() => setStep(14)} className="absolute left-6 top-16 w-10 h-10 items-center justify-center">
              <ChevronLeft size={30} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-3xl font-bold mb-2">Payment</Text>
            <Text className="text-white/80 text-lg">Select payment method</Text>
          </View>
          <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
            {/* Debit Card */}
            <View className="flex-row items-center mb-4">
               <CreditCard size={24} color="#475569" />
               <Text className="text-slate-600 font-bold ml-2 text-xl">Debit Card</Text>
            </View>
            <View className="flex-row gap-4 mb-8">
               <TouchableOpacity onPress={() => alert('بە زوویی بەردەست دەبێت')} className="flex-1 h-24 border border-slate-200 rounded-xl items-center justify-center bg-white shadow-sm">
                  <Text className="text-blue-800 font-black text-3xl italic">VISA</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => alert('بە زوویی بەردەست دەبێت')} className="flex-1 h-24 border border-slate-200 rounded-xl items-center justify-center bg-white shadow-sm flex-row">
                  <View className="w-8 h-8 rounded-full bg-red-500 opacity-90 -mr-3 z-10" />
                  <View className="w-8 h-8 rounded-full bg-yellow-500 opacity-90" />
               </TouchableOpacity>
            </View>
            
            {/* e-Wallets */}
            <View className="flex-row items-center mb-4 mt-4">
               <Wallet size={24} color="#475569" />
               <Text className="text-slate-600 font-bold ml-2 text-xl">e-Wallets</Text>
            </View>
            <View className="flex-row flex-wrap gap-4">
               <TouchableOpacity onPress={() => alert('بە زوویی بەردەست دەبێت')} className="w-[85px] h-[85px] bg-[#E12A61] rounded-full items-center justify-center shadow-md">
                  <Text className="text-white font-black">FastPay</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => alert('بە زوویی بەردەست دەبێت')} className="w-[85px] h-[85px] bg-[#00A8B8] rounded-full items-center justify-center shadow-md">
                   <Text className="text-white font-black text-lg">FIB</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setSellData({...sellData, paymentMethod: 'korek'}); setStep(17); }} className={`w-[85px] h-[85px] rounded-full items-center justify-center shadow-md ${sellData.paymentMethod === 'korek' ? 'border-4 border-emerald-500 bg-[#0B5ED7]' : 'bg-[#0B5ED7]'}`}>
                  <Text className="text-white font-black text-xs">KOREK</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={() => { setSellData({...sellData, paymentMethod: 'asiacell'}); setStep(17); }} className={`w-[85px] h-[85px] rounded-full items-center justify-center shadow-md ${sellData.paymentMethod === 'asiacell' ? 'border-4 border-emerald-500 bg-[#E30613]' : 'bg-[#E30613]'}`}>
                  <Text className="text-white font-black text-[10px]">Asiacell</Text>
               </TouchableOpacity>
            </View>
          </ScrollView>
          <View className="p-6 bg-white border-t border-slate-100 pb-10">
             <TouchableOpacity onPress={() => { if (!sellData.paymentMethod) { alert('تکایە جۆرێک هەڵبژێرە'); return; } setStep(17); }} className="w-full h-16 bg-[#4CA66B] rounded-full items-center justify-center shadow-lg">
                <Text className="text-white text-xl font-bold">Next</Text>
             </TouchableOpacity>
          </View>
        </View>
      );
      case 17: return (
        <View className="flex-1 px-6 pt-10 absolute inset-0 z-50 bg-slate-50">
          <TouchableOpacity onPress={() => setStep(16)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm mb-6 mt-10">
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-2xl font-black text-slate-800 mb-8 text-center">شێوازی پارەدان هەڵبژێرە</Text>
          <TouchableOpacity onPress={() => setStep(18)} className="bg-white p-8 rounded-3xl mb-4 border border-slate-200 items-center justify-center shadow-sm h-40">
             <Camera size={40} color="#475569" className="mb-4" />
             <Text className="text-xl font-bold text-slate-700">ناردن بە وێنەی کارتی پڕکردنەوە</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert('بە زوویی بەردەست دەبێت')} className="bg-white p-8 rounded-3xl border border-slate-200 items-center justify-center shadow-sm h-40 opacity-70">
             <Send size={40} color="#475569" className="mb-4" />
             <Text className="text-xl font-bold text-slate-700">ناردن بە شێوەی باڵانس</Text>
          </TouchableOpacity>
        </View>
      );
      case 18: return (
        <View className="flex-1 px-6 pt-10 absolute inset-0 z-50 bg-slate-50">
          <TouchableOpacity onPress={() => setStep(17)} className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm mb-6 mt-10">
            <ChevronLeft size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-3xl font-black text-slate-800 mb-4 text-center">وێنەی کارتەکە دابنێ</Text>
          <Text className="text-lg text-slate-600 mb-10 text-center leading-relaxed">تکایە لەو بەشە وێنەی کارتەکە دابنێ و پاشان بنێرێ</Text>
          
          <TouchableOpacity onPress={pickPaymentImage} className="w-full h-64 bg-white rounded-[40px] border-2 border-dashed border-slate-300 items-center justify-center mb-10 overflow-hidden shadow-sm">
             {sellData.paymentImages && sellData.paymentImages[0] ? (
                <Image source={{uri: sellData.paymentImages[0].uri}} className="w-full h-full" resizeMode="cover" />
             ) : (
                <>
                  <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
                    <Camera size={32} color="#94A3B8" />
                  </View>
                  <Text className="text-slate-500 font-bold text-lg">وێنەی کارت هەڵبژێرە</Text>
                </>
             )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleVIPSubmit} disabled={isLoading} className="w-full h-16 bg-[#CC222F] rounded-full items-center justify-center shadow-lg">
             {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-2xl font-black">ناردن</Text>}
          </TouchableOpacity>
        </View>
      );
      case 19: return (
        <View className="flex-1 items-center justify-center px-10 absolute inset-0 z-50 bg-white">
          <View className="w-48 h-48 bg-purple-500 rounded-[50px] items-center justify-center mb-10 shadow-xl shadow-purple-500/40 rotate-12">
             <View className="-rotate-12">
               <Check size={100} color="white" strokeWidth={4} />
             </View>
          </View>
          <Text className="text-4xl font-black text-[#1A1A1A] mb-6 text-center leading-tight">گەیشت!{"\n"}دەستەکانت خۆش</Text>
          <Text className="text-xl text-slate-600 mb-16 text-center leading-relaxed">لەماوەی 60 دەقە پێداچوونەوە بە پارەکە و ریکڵامەکەت دا دەکرێت و راستەوخۆ وەردەگیرێ</Text>
          <TouchableOpacity onPress={() => router.push('/')} className="w-full bg-[#0F172A] py-6 rounded-full items-center shadow-xl shadow-slate-900/20">
            <Text className="text-white text-2xl font-black">{t('sell.done')}</Text>
          </TouchableOpacity>
        </View>
      );

      case 15: return (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-44 h-44 bg-emerald-500 rounded-full items-center justify-center mb-10 shadow-xl shadow-emerald-500/40">
             <Check size={90} color="white" strokeWidth={4} />
          </View>
          <Text className="text-6xl font-black text-[#1A1A1A] mb-12">{t('sell.step15Title')}</Text>
          <TouchableOpacity onPress={() => router.push('/')} className="w-48 bg-[#0F172A] py-8 rounded-full items-center">
            <Text className="text-white text-2xl font-black">{t('sell.done')}</Text>
          </TouchableOpacity>
        </View>
      );
      case 22: return (
        <View className="flex-1 px-6 pt-10 absolute inset-0 z-50 bg-[#F8F9FB]">
          <View className="flex-row items-center mb-6 mt-6">
            <TouchableOpacity onPress={() => setStep(16)} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
              <ChevronLeft size={24} color="#1e293b" />
            </TouchableOpacity>
            <View className="flex-1 items-center mr-10">
              <Text className="text-2xl font-black text-[#1E293B]">ناردنی پارە بە {sellData.paymentMethod === 'fastpay' ? 'FastPay' : 'FIB'}</Text>
            </View>
          </View>
          <Text className="text-sm text-slate-500 mb-4 text-center leading-relaxed">{t('payment.sendTo')}</Text>
          
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Number Copy Section */}
            <View className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 mb-4 items-center">
               <Text className="text-slate-500 font-bold mb-2 text-sm">{t('payment.numberOf')} {sellData.paymentMethod === 'fastpay' ? 'FastPay' : 'FIB'}</Text>
               <View className="flex-row items-center justify-between w-full bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200">
                  <Text className="text-xl font-black text-slate-800 tracking-wider flex-1 text-center" dir="ltr">{sellData.paymentMethod === 'fastpay' ? adminPhones.fastpay : adminPhones.fib}</Text>
                  <TouchableOpacity onPress={() => { 
                    Clipboard.setStringAsync(sellData.paymentMethod === 'fastpay' ? adminPhones.fastpay : adminPhones.fib); 
                    alert(t('payment.copyNumber')); 
                  }} className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center ml-2">
                    <Copy size={18} color="#0B5ED7" />
                  </TouchableOpacity>
               </View>
            </View>

            <Text className="text-base font-bold text-slate-700 mb-2 text-right">{t('payment.uploadSendProof')}</Text>
            {sellData.paymentImages && sellData.paymentImages.length > 0 ? (
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {sellData.paymentImages.map((img: any, idx: number) => (
                  <View key={idx} className="w-[48%] aspect-square rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                    <Image source={{uri: img.uri}} className="w-full h-full" resizeMode="cover" />
                    <TouchableOpacity onPress={() => {
                      const newImgs = [...sellData.paymentImages];
                      newImgs.splice(idx, 1);
                      setSellData({...sellData, paymentImages: newImgs});
                    }} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full items-center justify-center">
                      <X size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={pickPaymentImage} className="w-[48%] aspect-square bg-white rounded-[24px] border-2 border-dashed border-slate-300 items-center justify-center">
                   <Camera size={24} color="#94A3B8" className="mb-1" />
                   <Text className="text-slate-500 font-bold text-xs">{t('payment.add')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickPaymentImage} className="w-full h-28 bg-white rounded-[24px] border-2 border-dashed border-[#CBD5E1] items-center justify-center shadow-sm">
                 <View className="w-12 h-12 bg-[#F1F5F9] rounded-full items-center justify-center mb-2">
                   <Camera size={20} color="#64748B" />
                 </View>
                 <Text className="text-slate-600 font-bold text-sm">{t('payment.uploadSendProof')}</Text>
              </TouchableOpacity>
            )}

            <View className="w-full mt-4 mb-4">
               <Text className="text-base font-bold text-slate-700 mb-2 text-right">{t('payment.noteOptional')}</Text>
               <TextInput
                 value={sellData.paymentNote}
                 onChangeText={(text) => setSellData({ ...sellData, paymentNote: text })}
                 placeholder={t('payment.notePlaceholder')}
                 placeholderTextColor="#94A3B8"
                 multiline
                 className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-right text-sm text-slate-700 shadow-sm"
                 style={{ minHeight: 70, textAlignVertical: 'top' }}
               />
            </View>

            <TouchableOpacity onPress={handleVIPSubmit} disabled={isLoading} className="w-full h-14 bg-[#CC222F] rounded-full items-center justify-center shadow-lg mb-4">
               {isLoading ? <ActivityIndicator color="white" /> : <Text className="text-white text-xl font-black">{t('payment.send')}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
      default: return <View className="p-10"><Text className="text-center font-bold">{t('sell.title')} {step}</Text></View>;
    }
  };

  const getStepTitle = () => {
    const titles: any = { 1: t('sell.step1Title'), 2: t('sell.step2Title'), 3: t('sell.step3Title'), 4: t('sell.step4Title'), 5: t('sell.step5Title'), 6: t('sell.step6Title'), 7: t('sell.step7Title'), 8: t('sell.step8Title'), 9: t('sell.step9Title'), 11: t('sell.step11Title'), 12: t('sell.step12Title'), 13: t('sell.step13Title'), 14: t('sell.step14Title') };
    const subs: any = { 1: t('sell.step1Sub'), 2: t('sell.step2Sub'), 3: t('sell.step3Sub'), 4: t('sell.step4Sub'), 5: t('sell.step5Sub'), 6: t('sell.step6Sub'), 7: t('sell.step7Sub'), 8: t('sell.step8Sub'), 9: t('sell.step9Sub'), 11: t('sell.step11Sub'), 12: t('sell.step12Sub'), 13: t('sell.step13Sub'), 14: t('sell.step14Sub') };
    return { title: titles[step] || t('sell.title'), sub: subs[step] || '' };
  };

  return (
    <View style={{ flex: 1 }}>
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
                 className={`bg-white/10 px-4 py-2 rounded-full border border-white/20 flex-row${isRTL ? '' : '-reverse'} items-center`}
               >
                 <Text className={`text-white font-bold text-xs ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('sell.callForHelp')}</Text>
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
          <View className={`p-8 flex-row${isRTL ? '' : '-reverse'} gap-4 bg-white pb-12`}>
            <TouchableOpacity onPress={prevStep} className="flex-1 bg-slate-50 h-20 rounded-[35px] items-center justify-center border border-slate-100">
              <Text className="text-slate-400 text-2xl font-black">{t('sell.previous')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={nextStep} className="flex-[2] bg-[#CC222F] h-20 rounded-[35px] items-center justify-center shadow-lg">
              <Text className="text-white text-2xl font-black">{t('sell.next')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <Modal visible={isModalVisible} animationType="fade" transparent={true}>
          <View className="flex-1 bg-black/60 justify-center items-center px-10">
            <View className="bg-white w-full max-h-[70%] rounded-[40px] overflow-hidden p-6 shadow-2xl">
              <View className="mb-4">
                <Text className={`text-xl font-bold text-[#1A1A1A] ${isRTL ? 'text-right' : 'text-left'} mb-4`}>
                  {modalType === 'brand' ? t('sell.brand') : modalType === 'model' ? t('sell.model') : modalType === 'spec' ? t('sell.spec') : modalType === 'governorate' ? t('sell.governorate') : t('sell.selection')}
                </Text>
                <View className={`flex-row${isRTL ? '-reverse' : ''} items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100`}>
                  <Search size={18} color="#999" />
                  <TextInput 
                    placeholder={t('sell.search') as string} 
                    className={`flex-1 ${isRTL ? 'mr-3' : 'ml-3'} font-bold text-base ${isRTL ? 'text-right' : 'text-left'}`}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <FlatList
                data={modalData.filter(i => {
                  const cat = modalType === 'import_country' ? 'importCountries' : (modalType === 'brand' ? 'brands' : (modalType === 'model' ? 'models' : (modalType === 'governorate' || modalType === 'city' ? 'locations' : undefined)));
                  return getTranslatedName(i.name, cat).toLowerCase().includes(searchQuery.toLowerCase());
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
                      className={`flex-row${isRTL ? '-reverse' : ''} items-center justify-between py-4 border-b border-slate-50`}
                    >
                      <View className={`flex-row${isRTL ? '-reverse' : ''} items-center gap-3 flex-1 flex-shrink`}>
                        <Text className={`text-lg font-bold ${isSelected ? 'text-[#CC222F]' : 'text-slate-500'}`} numberOfLines={1} style={{flexShrink: 1}}>
                          {modalType === 'import_country' ? getCountryName(item.name) : getTranslatedName(item.name, modalType === 'brand' ? 'brands' : (modalType === 'model' ? 'models' : (modalType === 'governorate' || modalType === 'city' ? 'locations' : undefined)))}
                        </Text>
                        {modalType === 'brand' && item.image_url && (
                          <Image source={{ uri: item.image_url }} className="w-8 h-8" resizeMode="contain" />
                        )}
                      </View>
                      <View className={`w-6 h-6 rounded-lg items-center justify-center border-2 ${isSelected ? 'border-[#CC222F] bg-[#CC222F]' : 'border-slate-200'}`}>
                        {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              <View className={`flex-row${isRTL ? '-reverse' : ''} items-center mt-6 pt-2 border-t border-slate-50 gap-6`}>
                 <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Text className="text-[#CC222F] text-lg font-black">{t('sell.save')}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Text className="text-slate-400 text-lg font-black">{t('sell.cancel')}</Text>
                 </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}
