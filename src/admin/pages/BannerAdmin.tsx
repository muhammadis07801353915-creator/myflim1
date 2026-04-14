'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../../components/ImageUpload';

export default function BannerAdmin() {
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    image: '',
    link: '',
    type: 'interspersed',
    placement_after: '',
    order_index: 0
  });

  useEffect(() => {
    fetchBanners();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('channel_categories').select('*').order('order_index', { ascending: true });
    if (data) setCategories(data);
  };

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('type', { ascending: false })
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error("Error fetching banners:", error);
      setErrorMsg(`Error loading banners: ${error.message}`);
    }
    if (data) {
      setBanners(data);
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setFormData({ 
      image: '',
      link: '',
      type: 'interspersed',
      placement_after: categories.length > 0 ? categories[0].name : '',
      order_index: 0
    });
    setEditingId(null);
    setErrorMsg(null);
    setView('form');
  };

  const handleEdit = (item: any) => {
    setFormData({
      image: item.image || '',
      link: item.link || '',
      type: item.type || 'interspersed',
      placement_after: item.placement_after || '',
      order_index: item.order_index || 0
    });
    setEditingId(item.id);
    setErrorMsg(null);
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if(window.confirm('Are you sure you want to delete this banner?')) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (!error) {
        setBanners(banners.filter(item => item.id !== id));
      } else {
        alert('Error deleting banner');
      }
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!formData.image) {
      setErrorMsg('Banner image is required!');
      return;
    }

    setSaving(true);
    
    const payload: any = {
      image: formData.image,
      link: formData.link,
      type: formData.type,
      placement_after: formData.type === 'interspersed' ? formData.placement_after : null,
      order_index: formData.order_index
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('banners').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert([payload]);
        if (error) throw error;
      }
      
      fetchBanners();
      setView('list');
    } catch (err: any) {
      console.error('Supabase save error:', err);
      setErrorMsg(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (view === 'form') {
    return (
      <div className="text-white space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{editingId ? 'Edit Banner' : 'Add New Banner'}</h1>
            <p className="text-neutral-400 text-sm mt-1">Configure banner appearance and link</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition">Cancel</button>
            <button disabled={saving} onClick={handleSave} className="px-4 py-2 bg-white text-black font-medium hover:bg-neutral-200 rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Banner Type</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})} 
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition"
              >
                <option value="top">Top Slider</option>
                <option value="interspersed">Interspersed (Between Categories)</option>
              </select>
            </div>
            
            {formData.type === 'interspersed' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Place After Category</label>
                <select 
                  value={formData.placement_after} 
                  onChange={e => setFormData({...formData, placement_after: e.target.value})} 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition"
                >
                  <option value="">Start (Before first category)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Order Index (For Slider)</label>
                <input 
                  type="number" 
                  value={formData.order_index} 
                  onChange={e => setFormData({...formData, order_index: parseInt(e.target.value)})} 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Destination Link (Optional)</label>
            <input 
              type="text" 
              value={formData.link} 
              onChange={e => setFormData({...formData, link: e.target.value})} 
              placeholder="https://..." 
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" 
            />
            <p className="text-[10px] text-neutral-500">Users will be redirected to this link when they tap the banner.</p>
          </div>

          <div className="space-y-2">
            <ImageUpload 
              label="Banner Image" 
              value={formData.image} 
              onChange={(val) => setFormData({...formData, image: val})} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Banner & Ad Management</h1>
        <button onClick={handleAddNew} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center space-x-2">
          <Plus size={20} /><span>Add Banner</span>
        </button>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Preview</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Placement / Order</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">Loading banners...</td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No banners found</td>
                </tr>
              ) : banners.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="w-40 h-16 bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
                      <img src={item.image} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold ${item.type === 'top' ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">
                    {item.type === 'top' ? `Order: ${item.order_index}` : `After: ${item.placement_after || 'Start'}`}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-neutral-500 hover:text-white transition"><ExternalLink size={16} /></a>}
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-neutral-400 hover:text-white transition bg-neutral-800 rounded-md"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-neutral-400 hover:text-red-500 transition bg-neutral-800 rounded-md"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
