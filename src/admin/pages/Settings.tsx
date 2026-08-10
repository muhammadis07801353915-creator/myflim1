import { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, Smartphone, Settings as SettingsIcon, Image as ImageIcon, Plus, Trash2, Edit, Key, Share2, Loader2, Check, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState('pro_codes');
  const [codes, setCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [newDuration, setNewDuration] = useState(30);
  const [generating, setGenerating] = useState(false);

  const [aboutText, setAboutText] = useState('');
  const [savingAbout, setSavingAbout] = useState(false);

  const fetchAboutText = async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'about_taban_play').single();
    if (data?.value) setAboutText(data.value);
  };

  const saveAboutText = async () => {
    setSavingAbout(true);
    try {
      const { data } = await supabase.from('settings').select('id').eq('key', 'about_taban_play').single();
      if (data) {
        await supabase.from('settings').update({ value: aboutText }).eq('key', 'about_taban_play');
      } else {
        await supabase.from('settings').insert([{ key: 'about_taban_play', value: aboutText }]);
      }
      alert('About text saved successfully!');
    } catch (e: any) {
      alert('Error saving about text: ' + e.message);
    } finally {
      setSavingAbout(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General Settings', icon: <SettingsIcon size={18} /> },
    { id: 'about', name: 'About Taban Play', icon: <Info size={18} /> },
    { id: 'ads', name: 'Ads Management', icon: <DollarSign size={18} /> },
    { id: 'pro_codes', name: 'PRO Codes', icon: <Key size={18} /> },
    { id: 'notifications', name: 'Push Notifications', icon: <Bell size={18} /> },
    { id: 'social', name: 'Social Media', icon: <Share2 size={18} /> },
    { id: 'app', name: 'App Config', icon: <Smartphone size={18} /> },
  ];

  // Notifications tab state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState<'push_and_inbox' | 'inbox_only'>('push_and_inbox');
  const [notifAudience, setNotifAudience] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [loadingSentNotifs, setLoadingSentNotifs] = useState(false);

  const fetchSentNotifications = async () => {
    setLoadingSentNotifs(true);
    try {
      // 1. Try notifications table first
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length >= 0) {
        // Also check if settings table has items and merge or return
        const { data: sData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'app_notifications_list')
          .maybeSingle();

        let sList: any[] = [];
        if (sData?.value) {
          try { sList = JSON.parse(sData.value); } catch {}
        }

        const combined = Array.from(new Map([...data, ...sList].map((item: any) => [item.id || item.created_at, item])).values());
        combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setSentNotifications(combined);
        return;
      }

      // 2. Fallback to settings table
      const { data: sData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'app_notifications_list')
        .maybeSingle();

      if (sData?.value) {
        setSentNotifications(JSON.parse(sData.value));
      } else {
        setSentNotifications([]);
      }
    } catch (e: any) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoadingSentNotifs(false);
    }
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      alert('تکایە ناونیشان و دەقی ئاگادارکردنەوە بنووسە / Please enter title and message!');
      return;
    }
    setSendingNotif(true);
    try {
      const newNotif = {
        id: 'notif_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
        title: notifTitle.trim(),
        body: notifBody.trim(),
        type: notifType,
        target_audience: notifAudience,
        created_at: new Date().toISOString()
      };

      // Try sending to notifications table
      let inserted = false;
      try {
        const { error } = await supabase
          .from('notifications')
          .insert([newNotif]);
        if (!error) inserted = true;
      } catch (e) {}

      // Always backup/store in settings table to guarantee instant delivery
      const { data: sData } = await supabase
        .from('settings')
        .select('id, value')
        .eq('key', 'app_notifications_list')
        .maybeSingle();

      let currentList: any[] = [];
      if (sData?.value) {
        try { currentList = JSON.parse(sData.value); } catch {}
      }

      const updatedList = [newNotif, ...currentList];

      if (sData?.id) {
        await supabase.from('settings').update({ value: JSON.stringify(updatedList) }).eq('key', 'app_notifications_list');
      } else {
        await supabase.from('settings').insert([{ key: 'app_notifications_list', value: JSON.stringify(updatedList) }]);
      }

      alert('ئاگادارکردنەوەکە بە سەرکەوتوویی نێردرا! / Notification sent successfully!');
      setNotifTitle('');
      setNotifBody('');
      fetchSentNotifications();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSendingNotif(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (window.confirm('ئایا دڵنیایت لە سڕینەوەی ئەم ئاگادارکردنەوەیە؟')) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch {}

      const { data: sData } = await supabase
        .from('settings')
        .select('id, value')
        .eq('key', 'app_notifications_list')
        .maybeSingle();

      if (sData?.value) {
        try {
          const currentList = JSON.parse(sData.value);
          const updatedList = currentList.filter((item: any) => String(item.id) !== String(id));
          await supabase.from('settings').update({ value: JSON.stringify(updatedList) }).eq('key', 'app_notifications_list');
        } catch {}
      }

      fetchSentNotifications();
    }
  };

  useEffect(() => {
    if (activeTab === 'about') {
      fetchAboutText();
    }
    if (activeTab === 'pro_codes') {
      fetchCodes();
    }
    if (activeTab === 'social') {
      fetchSocialLinks();
    }
    if (activeTab === 'notifications') {
      fetchSentNotifications();
    }
  }, [activeTab]);

  const [socialLinks, setSocialLinks] = useState({
    telegram: '',
    facebook: '',
    instagram: '',
    tiktok: ''
  });
  const [savingSocial, setSavingSocial] = useState(false);

  const fetchSocialLinks = async () => {
    const { data } = await supabase.from('settings').select('*').in('key', ['telegram_link', 'facebook_link', 'instagram_link', 'tiktok_link']);
    if (data) {
      const links = { telegram: '', facebook: '', instagram: '', tiktok: '' };
      data.forEach(item => {
        if (item.key === 'telegram_link') links.telegram = item.value;
        if (item.key === 'facebook_link') links.facebook = item.value;
        if (item.key === 'instagram_link') links.instagram = item.value;
        if (item.key === 'tiktok_link') links.tiktok = item.value;
      });
      setSocialLinks(links);
    }
  };

  const saveSocialLinks = async () => {
    setSavingSocial(true);
    const updates = [
      { key: 'telegram_link', value: socialLinks.telegram },
      { key: 'facebook_link', value: socialLinks.facebook },
      { key: 'instagram_link', value: socialLinks.instagram },
      { key: 'tiktok_link', value: socialLinks.tiktok }
    ];

    try {
      for (const update of updates) {
        // Upsert logic: check if exists, then update or insert
        const { data } = await supabase.from('settings').select('id').eq('key', update.key).single();
        if (data) {
          await supabase.from('settings').update({ value: update.value }).eq('key', update.key);
        } else {
          await supabase.from('settings').insert([update]);
        }
      }
      alert('Social links saved successfully!');
    } catch (e: any) {
      alert('Error saving social links: ' + e.message);
    } finally {
      setSavingSocial(false);
    }
  };

  const fetchCodes = async () => {
    setLoadingCodes(true);
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setCodes(data);
    setLoadingCodes(false);
  };

  const generateCode = async () => {
    setGenerating(true);
    const code = 'PRO-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const { error } = await supabase.from('promo_codes').insert([{
      code,
      duration_days: newDuration
    }]);

    if (!error) {
      fetchCodes();
    } else {
      alert('Error generating code: ' + error.message);
    }
    setGenerating(false);
  };

  const deleteCode = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this code?')) {
      await supabase.from('promo_codes').delete().eq('id', id);
      fetchCodes();
    }
  };

  return (
    <div className="text-white space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings & Configuration</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage platform settings, ads, and notifications</p>
        </div>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center space-x-2">
          <Save size={18} />
          <span>Save All Changes</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                activeTab === tab.id 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'text-neutral-400 hover:bg-[#1a1d24] hover:text-white border border-transparent'
              }`}
            >
              {tab.icon}
              <span className="font-medium">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
          
          {/* About Taban Play Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-medium">About Taban Play Content</h3>
                  <p className="text-xs text-neutral-400">Manage the text displayed when users click "About Taban Play" in the app & web.</p>
                </div>
                <button 
                  onClick={saveAboutText}
                  disabled={savingAbout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingAbout ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  <span>{savingAbout ? 'Saving...' : 'Save Content'}</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Custom About Text / Description</label>
                <textarea 
                  rows={8} 
                  value={aboutText} 
                  onChange={e => setAboutText(e.target.value)}
                  placeholder="بپلاتفۆرمی پێشەنگی تابان پڵەی بۆ بینینی نوێترین فیلم، زنجیرە، ئەنیمەیشن و کەناڵە ڕاستەوخۆکان بە بەرزترین کوالێتی HD..." 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white outline-none focus:border-red-500 transition text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Ads Management Tab */}
          {activeTab === 'ads' && (
            <div className="space-y-8">
              {/* Admob Settings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Admob Integration</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400">Android App ID</label>
                    <input type="text" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy" className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400">iOS App ID</label>
                    <input type="text" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy" className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400">Banner Ad Unit ID</label>
                    <input type="text" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy" className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-neutral-400">Interstitial Ad Unit ID</label>
                    <input type="text" placeholder="ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy" className="w-full bg-[#1a1d24] border border-neutral-800 rounded-md px-3 py-2 text-sm text-white outline-none" />
                  </div>
                </div>
              </div>

              <hr className="border-neutral-800" />

              {/* Custom Ads */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Custom Ads Campaigns</h3>
                    <p className="text-xs text-neutral-400">Manage your own image/video ads</p>
                  </div>
                  <button className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition flex items-center space-x-2">
                    <Plus size={16} />
                    <span>Create Campaign</span>
                  </button>
                </div>

                {/* Sample Custom Ad Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-neutral-800 rounded flex items-center justify-center">
                        <ImageIcon size={20} className="text-neutral-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Summer Sale Promo</h4>
                        <p className="text-xs text-emerald-500">Active • Ends in 12 days</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1.5 text-neutral-400 hover:text-white transition"><Edit size={16} /></button>
                      <button className="p-1.5 text-neutral-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-[#1a1d24] p-3 rounded-md border border-neutral-800">
                      <p className="text-xs text-neutral-500">Impressions</p>
                      <p className="text-lg font-bold">45.2k</p>
                    </div>
                    <div className="bg-[#1a1d24] p-3 rounded-md border border-neutral-800">
                      <p className="text-xs text-neutral-500">Clicks</p>
                      <p className="text-lg font-bold">1,204</p>
                    </div>
                    <div className="bg-[#1a1d24] p-3 rounded-md border border-neutral-800">
                      <p className="text-xs text-neutral-500">CTR</p>
                      <p className="text-lg font-bold text-emerald-500">2.6%</p>
                    </div>
                    <div className="bg-[#1a1d24] p-3 rounded-md border border-neutral-800">
                      <p className="text-xs text-neutral-500">Target OS</p>
                      <p className="text-sm font-medium mt-1">iOS, Android</p>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-neutral-400">
                    <span>Start: 2024-06-01</span>
                    <span>End: 2024-06-30</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRO Codes Tab */}
          {activeTab === 'pro_codes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">PRO Activation Codes</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
                    <span className="text-sm text-neutral-400 mr-2">Duration (Days):</span>
                    <input 
                      type="number" 
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="bg-transparent border-none outline-none text-sm w-16 text-white"
                    />
                  </div>
                  <button 
                    onClick={generateCode}
                    disabled={generating}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Plus size={18} />
                    <span>{generating ? 'Generating...' : 'Generate Code'}</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-900/50 text-neutral-400">
                    <tr>
                      <th className="px-6 py-4 font-medium">Code</th>
                      <th className="px-6 py-4 font-medium">Duration</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Expires At</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {loadingCodes ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Loading codes...</td>
                      </tr>
                    ) : codes.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No codes generated yet.</td>
                      </tr>
                    ) : codes.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/50 transition">
                        <td className="px-6 py-4 font-mono text-white font-medium tracking-wider">{item.code}</td>
                        <td className="px-6 py-4 text-neutral-400">{item.duration_days} Days</td>
                        <td className="px-6 py-4">
                          {item.activated_at ? (
                            new Date(item.expires_at) < new Date() ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500">Expired</span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">Active</span>
                            )
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Unused</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-neutral-400">
                          {item.expires_at ? new Date(item.expires_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteCode(item.id)} className="text-neutral-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Social Media Links</h3>
                <button 
                  onClick={saveSocialLinks}
                  disabled={savingSocial}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center space-x-2 disabled:opacity-50"
                >
                  {savingSocial ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  <span>{savingSocial ? 'Saving...' : 'Save Social Links'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Telegram Channel</label>
                  <input 
                    type="text" 
                    value={socialLinks.telegram} 
                    onChange={e => setSocialLinks({...socialLinks, telegram: e.target.value})}
                    placeholder="https://t.me/..." 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Facebook Page</label>
                  <input 
                    type="text" 
                    value={socialLinks.facebook} 
                    onChange={e => setSocialLinks({...socialLinks, facebook: e.target.value})}
                    placeholder="https://facebook.com/..." 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Instagram Profile</label>
                  <input 
                    type="text" 
                    value={socialLinks.instagram} 
                    onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
                    placeholder="https://instagram.com/..." 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">TikTok Profile</label>
                  <input 
                    type="text" 
                    value={socialLinks.tiktok} 
                    onChange={e => setSocialLinks({...socialLinks, tiktok: e.target.value})}
                    placeholder="https://tiktok.com/@..." 
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-500">These links will appear in the floating Telegram button on the homepage.</p>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">ناردنی ئاگادارکردنەوە و تێبینی / Push & In-App Notifications</h3>
                <p className="text-xs text-neutral-400">
                  لێراوە دەتوانیت نۆتیڤیکشنی ڕاستەوخۆ یان تێبینی/هەواڵ بۆ ناو ئەپەکەی بەکارهێنەران بنێریت.
                </p>
              </div>

              {/* Notification Creation Form */}
              <div className="bg-neutral-900/60 p-6 rounded-xl border border-neutral-800 space-y-6">
                
                {/* Notification Type Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-200">جۆری نۆتیڤێکشن / Notification Type</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNotifType('push_and_inbox')}
                      className={`p-4 rounded-xl border text-right transition flex items-start space-x-3 ${
                        notifType === 'push_and_inbox'
                          ? 'bg-red-500/10 border-red-500/50 text-white'
                          : 'bg-[#1a1d24] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="p-2 bg-red-500/20 text-red-400 rounded-lg ml-3">
                        <Bell size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">📣 نۆتیڤیکشنی ڕاستەوخۆ + ناو ئەپ</div>
                        <div className="text-xs text-neutral-400 mt-1">
                          نۆتیڤیکشنی ڕاستەوخۆ بۆ سەر شاشەی مۆبایلەکەیان دەڕوات + لە سندوقی ئاگادارکردنەوەش (Bell Icon) خەزن دەبێت.
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNotifType('inbox_only')}
                      className={`p-4 rounded-xl border text-right transition flex items-start space-x-3 ${
                        notifType === 'inbox_only'
                          ? 'bg-blue-500/10 border-blue-500/50 text-white'
                          : 'bg-[#1a1d24] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg ml-3">
                        <Info size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">📥 تەنها لە سندوقی ئاگادارکردنەوە (تێبینی/هەواڵ)</div>
                        <div className="text-xs text-neutral-400 mt-1">
                          بەبێ ناردنی نۆتیڤیکشنی ڕاستەوخۆ، تەنها وەک تێبینی یان هەواڵ کاتێک ئایکۆنی نۆتیڤیکشنیان داگرت دەیبینن.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">ناونیشان / Title</label>
                  <input
                    type="text"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="نموونە: زنجیرەی نوێ زێدە کراوە / New Episode Release!"
                    className="w-full bg-[#1a1d24] border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition text-sm"
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">دەقی ئاگادارکردنەوە / Message Body</label>
                  <textarea
                    rows={3}
                    value={notifBody}
                    onChange={(e) => setNotifBody(e.target.value)}
                    placeholder="نموونە: بەشی چوارەمی ئەنیمەیشنی تابان پڵەی ئێستا بەردەستە بە ژێرنووسی کوردی..."
                    className="w-full bg-[#1a1d24] border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition resize-none text-sm"
                  />
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">ئامانج / Target Audience</label>
                  <select
                    value={notifAudience}
                    onChange={(e) => setNotifAudience(e.target.value)}
                    className="w-full bg-[#1a1d24] border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition text-sm"
                  >
                    <option value="all">هەموو بەکارهێنەران (All Users)</option>
                    <option value="free">بەکارهێنەرانی ئاسایی (Free Users)</option>
                    <option value="premium">بەکارهێنەرانی پریمۆم/پڕۆ (Premium Users)</option>
                  </select>
                </div>

                {/* Submit Button */}
                <button
                  onClick={sendNotification}
                  disabled={sendingNotif}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition w-full flex justify-center items-center space-x-2 text-sm shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {sendingNotif ? <Loader2 size={18} className="animate-spin mr-2" /> : <Bell size={18} className="mr-2" />}
                  <span>{sendingNotif ? 'لە ناردندایە...' : 'ناردنی ئاگادارکردنەوە / Send Notification'}</span>
                </button>
              </div>

              {/* Sent Notifications History */}
              <div>
                <h4 className="text-md font-bold text-neutral-200 mb-3">مێژووی ئاگادارکردنەوە نێردراوەکان / Sent History</h4>
                <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-900/50 text-neutral-400">
                      <tr>
                        <th className="px-6 py-3.5 font-medium">جۆر / Type</th>
                        <th className="px-6 py-3.5 font-medium">ناونیشان / Title</th>
                        <th className="px-6 py-3.5 font-medium">دەق / Message</th>
                        <th className="px-6 py-3.5 font-medium">کاتی ناردن / Date</th>
                        <th className="px-6 py-3.5 font-medium text-right">سڕینەوە / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {loadingSentNotifs ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">لە بارکردندایە...</td>
                        </tr>
                      ) : sentNotifications.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">هیچ ئاگادارکردنەوەیەک نەدۆزرایەوە.</td>
                        </tr>
                      ) : (
                        sentNotifications.map((n) => (
                          <tr key={n.id} className="hover:bg-neutral-800/40 transition">
                            <td className="px-6 py-4">
                              {n.type === 'push_and_inbox' ? (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                  📣 ڕاستەوخۆ + ناو ئەپ
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  📥 تەنها ناو ئەپ (تێبینی)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-white">{n.title}</td>
                            <td className="px-6 py-4 text-neutral-300 max-w-xs truncate">{n.body}</td>
                            <td className="px-6 py-4 text-neutral-400 text-xs">
                              {new Date(n.created_at).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => deleteNotification(n.id)} className="text-neutral-500 hover:text-red-500 transition p-1.5">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* General Tab Placeholder */}
          {(activeTab === 'general' || activeTab === 'app') && (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
              <SettingsIcon size={48} className="mb-4 opacity-20" />
              <p>Configuration options for {activeTab} will appear here.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
