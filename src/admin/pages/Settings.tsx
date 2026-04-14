import { useState, useEffect } from 'react';
import { Save, Bell, DollarSign, Smartphone, Settings as SettingsIcon, Image as ImageIcon, Plus, Trash2, Edit, Key } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SettingsAdmin() {
  const [activeTab, setActiveTab] = useState('pro_codes');
  const [codes, setCodes] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [newDuration, setNewDuration] = useState(30);
  const [generating, setGenerating] = useState(false);

  const tabs = [
    { id: 'general', name: 'General Settings', icon: <SettingsIcon size={18} /> },
    { id: 'ads', name: 'Ads Management', icon: <DollarSign size={18} /> },
    { id: 'pro_codes', name: 'PRO Codes', icon: <Key size={18} /> },
    { id: 'notifications', name: 'Push Notifications', icon: <Bell size={18} /> },
    { id: 'app', name: 'App Config', icon: <Smartphone size={18} /> },
  ];

  useEffect(() => {
    if (activeTab === 'pro_codes') {
      fetchCodes();
    }
  }, [activeTab]);

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

          {/* Push Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-4">Send Push Notification</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Notification Title</label>
                  <input type="text" placeholder="e.g. New Episode Available!" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Message Body</label>
                  <textarea rows={3} placeholder="Watch the latest episode of..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition resize-none"></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Target Audience</label>
                  <select className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition">
                    <option>All Users</option>
                    <option>Free Users Only</option>
                    <option>Premium Users Only</option>
                  </select>
                </div>
                <button className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition w-full flex justify-center items-center space-x-2 mt-4">
                  <Bell size={18} />
                  <span>Send Notification Now</span>
                </button>
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
