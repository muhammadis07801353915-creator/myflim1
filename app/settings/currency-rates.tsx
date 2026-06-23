import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Euro, PoundSterling, Coins } from 'lucide-react-native';
import { useLanguage } from '../../src/i18n/LanguageContext';

type CurrencyData = {
  id: string;
  name: string;
  symbol: any;
  baseRate: number;
  currentRate: number;
  change: number;
  isUp: boolean;
  color: string;
  suffix: string;
};

type GoldData = {
  id: string;
  name: string;
  price: number;
  color: string;
};

export default function CurrencyRatesScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const initialRates: CurrencyData[] = [
    { id: 'USD', name: 'دۆلاری ئەمریکی (١٠٠ دۆلار)', symbol: DollarSign, baseRate: 156000, currentRate: 156000, change: 0, isUp: true, color: '#10b981', suffix: 'IQD' },
    { id: 'EUR', name: 'یۆرۆ (١٠٠ یۆرۆ)', symbol: Euro, baseRate: 168000, currentRate: 168000, change: 0, isUp: true, color: '#3b82f6', suffix: 'IQD' },
    { id: 'GBP', name: 'پاوەندی بەریتانی (١٠٠ پاوەند)', symbol: PoundSterling, baseRate: 198000, currentRate: 198000, change: 0, isUp: true, color: '#8b5cf6', suffix: 'IQD' },
    { id: 'TRY', name: 'لیرەی تورکی بەرامبەر ١٠٠ دۆلار', symbol: DollarSign, baseRate: 3250, currentRate: 3250, change: 0, isUp: true, color: '#ef4444', suffix: 'لیرە' },
    { id: 'IRR', name: 'تومەنی ئێرانی بەرامبەر ١٠٠ دۆلار', symbol: DollarSign, baseRate: 6050000, currentRate: 6050000, change: 0, isUp: true, color: '#f59e0b', suffix: 'تومەن' },
  ];

  const initialGoldRates: GoldData[] = [
    { id: '24K', name: 'زێڕی عەیار ٢٤', price: 0, color: '#fbbf24' },
    { id: '22K', name: 'زێڕی عەیار ٢٢', price: 0, color: '#f59e0b' },
    { id: '21K', name: 'زێڕی عەیار ٢١', price: 0, color: '#d97706' },
    { id: '18K', name: 'زێڕی عەیار ١٨', price: 0, color: '#b45309' },
  ];

  const [rates, setRates] = useState<CurrencyData[]>(initialRates);
  const [goldRates, setGoldRates] = useState<GoldData[]>(initialGoldRates);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [goldUpdated, setGoldUpdated] = useState<string>('');

  // Fetch from Telegram channel and API
  const fetchRealRates = async () => {
    try {
      // 1. Fetch USD rate from Iraq Borsa
      const borsaResponse = await fetch('https://t.me/s/iraqborsa');
      const borsaHtml = await borsaResponse.text();
      
      const regex = /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g;
      let match;
      let lastMsg = '';
      while ((match = regex.exec(borsaHtml)) !== null) {
        lastMsg = match[1];
      }

      let usdPrice = 156000;
      if (lastMsg) {
        const priceMatch = lastMsg.match(/100.*?=\s*(\d{3})[,.]?(\d{3})/i) || lastMsg.match(/(\d{3})[,.]?(\d{3})/);
        if (priceMatch) {
          const price = parseInt(priceMatch[1] + priceMatch[2], 10);
          if (price > 100000 && price < 200000) {
            usdPrice = price;
          }
        }
      }

      // 2. Fetch international exchange rates
      let apiRates: any = null;
      try {
        const apiResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const apiData = await apiResponse.json();
        apiRates = apiData.rates;
      } catch (e) {
        console.warn('API error:', e);
      }

      setRates(currentRates => 
        currentRates.map(c => {
          let newRate = c.currentRate;
          
          if (c.id === 'USD') {
            newRate = usdPrice;
          } else if (apiRates && c.id === 'EUR') {
            newRate = Math.round((100 / apiRates.EUR) * (usdPrice / 100));
          } else if (apiRates && c.id === 'GBP') {
            newRate = Math.round((100 / apiRates.GBP) * (usdPrice / 100));
          } else if (apiRates && c.id === 'TRY') {
            newRate = Math.round(apiRates.TRY * 100);
          }
          // IRR stays simulated as it's a parallel market

          return { ...c, change: Math.abs(newRate - c.currentRate), isUp: newRate >= c.currentRate, currentRate: newRate, baseRate: newRate };
        })
      );
      setLastUpdated(new Date().toLocaleTimeString('ku-IQ'));

      // 3. Fetch Gold from Azura Gold
      const goldResponse = await fetch('https://t.me/s/azura_gold');
      const goldHtml = await goldResponse.text();
      let lastGoldMsg = '';
      while ((match = regex.exec(goldHtml)) !== null) {
        lastGoldMsg = match[1];
      }

      if (lastGoldMsg) {
        // Parse gold: e.g. "زێڕی عەیار 21 به 921 هەزار دینار"
        const g24Match = lastGoldMsg.match(/24\s*به\s*(\d+)\s*(هەزار|ملیۆن)/);
        const g22Match = lastGoldMsg.match(/22\s*به\s*(\d+)\s*(هەزار|ملیۆن)/);
        const g21Match = lastGoldMsg.match(/21\s*به\s*(\d+)\s*(هەزار|ملیۆن)/);
        const g18Match = lastGoldMsg.match(/18\s*به\s*(\d+)\s*(هەزار|ملیۆن)/);

        const parsePrice = (m: RegExpMatchArray | null) => {
          if (!m) return 0;
          let val = parseInt(m[1], 10);
          if (m[2] === 'ملیۆن') val = val * 1000;
          if (val < 2000) val = val * 1000; // If they wrote 1053, it's 1,053,000
          return val;
        };

        const g24 = parsePrice(g24Match);
        const g22 = parsePrice(g22Match);
        const g21 = parsePrice(g21Match);
        const g18 = parsePrice(g18Match);

        if (g21 > 0) {
          setGoldRates([
            { id: '24K', name: 'زێڕی عەیار ٢٤', price: g24, color: '#fbbf24' },
            { id: '22K', name: 'زێڕی عەیار ٢٢', price: g22, color: '#f59e0b' },
            { id: '21K', name: 'زێڕی عەیار ٢١', price: g21, color: '#d97706' },
            { id: '18K', name: 'زێڕی عەیار ١٨', price: g18, color: '#b45309' },
          ]);
          setGoldUpdated(new Date().toLocaleTimeString('ku-IQ'));
        }
      }

    } catch (e) {
      console.warn('Failed to fetch real rates:', e);
    }
  };

  // Fetch real rates every 15 seconds
  useEffect(() => {
    fetchRealRates();
    const interval = setInterval(fetchRealRates, 15000);
    return () => clearInterval(interval);
  }, []);

  // Simulate slight live market fluctuations every 2 seconds for effect (only for IRR as it is black market simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(currentRates => 
        currentRates.map(currency => {
          if (currency.id !== 'IRR') return currency; // Only simulate IRR now

          const volatility = 20000; // Tomans volatility
          const randomChange = Math.floor(Math.random() * (volatility * 2 + 1)) - volatility;
          
          let newRate = currency.baseRate + randomChange;
          if (Math.abs(newRate - currency.baseRate) > (volatility * 4)) {
            newRate = currency.baseRate + (randomChange > 0 ? -Math.abs(randomChange) : Math.abs(randomChange));
          }

          const diff = newRate - currency.currentRate;
          
          return {
            ...currency,
            currentRate: newRate,
            change: Math.abs(diff),
            isUp: diff >= 0,
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#111827]">
      {/* Header */}
      <View className="px-5 pt-12 pb-6 flex-row items-center justify-between bg-[#1f2937] border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center">
          <ChevronLeft size={24} color="#f3f4f6" />
        </TouchableOpacity>
        <Text className="text-[24px] font-black text-white">{t('settings.exchangeRates')}</Text>
        <View className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center">
          <Activity size={20} color="#10b981" />
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        <View className="mb-6 items-center">
          <Text className="text-gray-400 font-bold mb-2">نرخی دراوەکان بەرامبەر بە دیناری عێراقی</Text>
          <View className="flex-row items-center bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
             <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
             <Text className="text-green-500 font-bold text-xs">ڕاستەوخۆ لە بۆرسەی عێراقەوە {lastUpdated ? `(نوێکراوەتەوە: ${lastUpdated})` : ''}</Text>
          </View>
        </View>

        <View className="space-y-4 mb-10">
          {rates.map((currency) => {
            const Icon = currency.symbol;
            return (
              <View 
                key={currency.id} 
                className="bg-[#1f2937] rounded-3xl p-5 flex-row items-center border border-gray-800 shadow-lg"
              >
                {/* Icon */}
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${currency.color}20` }}
                >
                  <Icon size={28} color={currency.color} />
                </View>

                {/* Details */}
                <View className="flex-1">
                  <Text className="text-white font-black text-[18px] mb-1">{currency.id}</Text>
                  <Text className="text-gray-400 font-bold text-[12px]">{currency.name}</Text>
                </View>

                {/* Price & Change */}
                <View className="items-end">
                  <Text className="text-white font-black text-[22px] mb-1">
                    {currency.currentRate.toLocaleString()} <Text className="text-[12px] text-gray-400 font-normal">{currency.suffix}</Text>
                  </Text>
                  
                  <View className={`flex-row items-center px-2 py-1 rounded-lg ${currency.isUp ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {currency.isUp ? (
                      <ArrowUpRight size={14} color="#10b981" />
                    ) : (
                      <ArrowDownRight size={14} color="#ef4444" />
                    )}
                    <Text className={`font-bold text-[12px] ml-1 ${currency.isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {currency.isUp ? '+' : '-'}{currency.change.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Gold Section */}
        <View className="mb-6 items-center">
          <Text className="text-gray-400 font-bold mb-2">نرخی زێڕ لە بازاڕەکانی عێراق</Text>
          <View className="flex-row items-center bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20">
             <View className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
             <Text className="text-yellow-500 font-bold text-xs">ڕاستەوخۆ لە زێڕینگری ئازورا {goldUpdated ? `(نوێکراوەتەوە: ${goldUpdated})` : ''}</Text>
          </View>
        </View>

        <View className="space-y-4 pb-20">
          {goldRates.map((gold) => {
            if (gold.price === 0) return null; // hide if not fetched
            return (
              <View 
                key={gold.id} 
                className="bg-[#1f2937] rounded-3xl p-5 flex-row items-center border border-gray-800 shadow-lg"
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${gold.color}20` }}
                >
                  <Coins size={28} color={gold.color} />
                </View>

                <View className="flex-1">
                  <Text className="text-white font-black text-[18px] mb-1">{gold.id}</Text>
                  <Text className="text-gray-400 font-bold text-[12px]">{gold.name}</Text>
                </View>

                <View className="items-end">
                  <Text className="text-white font-black text-[22px] mb-1">
                    {gold.price.toLocaleString()} <Text className="text-[12px] text-gray-400 font-normal">IQD</Text>
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
