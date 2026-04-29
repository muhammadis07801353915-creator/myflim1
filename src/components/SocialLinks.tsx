import { useState, useEffect } from 'react';
import { X, Send, Facebook, Instagram, Music2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface SocialLinks {
  telegram: string;
  facebook: string;
  instagram: string;
  tiktok: string;
}

export function FloatingSocialButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<SocialLinks>({
    telegram: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  });

  useEffect(() => {
    async function fetchLinks() {
      const { data } = await supabase.from('settings').select('*').in('key', ['telegram_link', 'facebook_link', 'instagram_link', 'tiktok_link']);
      if (data) {
        const newLinks = { ...links };
        data.forEach(item => {
          if (item.key === 'telegram_link') newLinks.telegram = item.value;
          if (item.key === 'facebook_link') newLinks.facebook = item.value;
          if (item.key === 'instagram_link') newLinks.instagram = item.value;
          if (item.key === 'tiktok_link') newLinks.tiktok = item.value;
        });
        setLinks(newLinks);
      }
    }
    fetchLinks();
  }, []);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#24A1DE] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-[100] shadow-blue-500/20"
      >
        <Send size={28} fill="white" className="-rotate-12 ml-[-2px] mt-[-2px]" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1A1D24] animate-pulse"></span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-[#1A1D24] border border-neutral-800 w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
            >
              <div className="p-6 text-center space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-bold text-white">سۆشیاڵ میدیا</h3>
                  <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid gap-4">
                  <SocialButton 
                    icon={<Send size={20} fill="currentColor" />} 
                    label="تێلیگرام" 
                    color="bg-[#24A1DE]" 
                    url={links.telegram} 
                  />
                  <SocialButton 
                    icon={<Facebook size={20} fill="currentColor" />} 
                    label="فەیسبووک" 
                    color="bg-[#1877F2]" 
                    url={links.facebook} 
                  />
                  <SocialButton 
                    icon={<Instagram size={20} />} 
                    label="ئینستاگرام" 
                    color="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" 
                    url={links.instagram} 
                  />
                  <SocialButton 
                    icon={<Music2 size={20} />} 
                    label="تیک تۆک" 
                    color="bg-black" 
                    url={links.tiktok} 
                  />
                </div>
                
                <p className="text-neutral-500 text-xs mt-4">بۆ وەرگرتنی نوێترین هەواڵ و فیلمەکان، فۆڵۆومان بکەن</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SocialButton({ icon, label, color, url }: { icon: any, label: string, color: string, url: string }) {
  if (!url) return null;
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`${color} text-white flex items-center justify-between px-5 py-4 rounded-2xl hover:opacity-90 transition-opacity shadow-lg active:scale-95 duration-200`}
    >
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {icon}
        <span className="font-bold text-sm">{label}</span>
      </div>
      <ExternalLink size={16} className="opacity-50" />
    </a>
  );
}
