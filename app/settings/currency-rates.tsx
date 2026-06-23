import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Euro, PoundSterling } from 'lucide-react-native';
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
};

export default function CurrencyRatesScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  // Base rates roughly corresponding to current IQD black market / standard rates
  // 100 USD = 150,000 IQD
  const initialRates: CurrencyData[] = [
    { id: 'USD', name: 'دۆلاری ئەمریکی', symbol: DollarSign, baseRate: 150500, currentRate: 150500, change: 0, isUp: true, color: '#10b981' },
    { id: 'EUR', name: 'یۆرۆ', symbol: Euro, baseRate: 162000, currentRate: 162000, change: 0, isUp: true, color: '#3b82f6' },
    { id: 'GBP', name: 'پاوەندی بەریتانی', symbol: PoundSterling, baseRate: 191000, currentRate: 191000, change: 0, isUp: true, color: '#8b5cf6' },
    { id: 'TRY', name: 'لیرەی تورکی (١٠٠ لیرە)', symbol: DollarSign, baseRate: 4600, currentRate: 4600, change: 0, isUp: true, color: '#ef4444' },
    { id: 'IRR', name: 'تومەنی ئێرانی (١ ملیۆن)', symbol: DollarSign, baseRate: 2550, currentRate: 2550, change: 0, isUp: true, color: '#f59e0b' },
  ];

  const [rates, setRates] = useState<CurrencyData[]>(initialRates);

  // Simulate live market fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setRates(currentRates => 
        currentRates.map(currency => {
          // Add a slight random fluctuation between -250 and +250 for USD/EUR/GBP
          // and -5 to +5 for TRY/IRR
          const volatility = ['USD', 'EUR', 'GBP'].includes(currency.id) ? 250 : 5;
          const randomChange = Math.floor(Math.random() * (volatility * 2 + 1)) - volatility;
          
          let newRate = currency.baseRate + randomChange;
          // Ensure it doesn't deviate too wildly from the base
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
    }, 2000); // Update every 2 seconds for a "live" feel

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
             <Text className="text-green-500 font-bold text-xs">بازاڕ کراوەیە (ڕاستەوخۆ)</Text>
          </View>
        </View>

        <View className="space-y-4 pb-20">
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
                    {currency.currentRate.toLocaleString()} <Text className="text-[12px] text-gray-400 font-normal">IQD</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
