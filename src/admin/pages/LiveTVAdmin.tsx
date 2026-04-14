import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tv, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../../components/ImageUpload';

export default function LiveTVAdmin() {
  const [channels, setChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [formData, setFormData] = useState({
    name: '', category: '', status: 'Active', stream_url: '', image: '', is_pro: false
  });

  useEffect(() => {
    fetchChannels();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('channel_categories').select('*').order('order_index', { ascending: true });
    if (data) {
      setCategories(data);
      if (data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    }
  };

  const fetchChannels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error("Error fetching channels:", error);
      setErrorMsg(`Error loading channels: ${error.message}`);
    }
    if (data) {
      setChannels(data);
    }
    setLoading(false);
  };

  const handleAddNew = () => {
    setFormData({ 
      name: '', 
      category: categories.length > 0 ? categories[0].name : 'News', 
      status: 'Active', 
      stream_url: '', 
      image: '',
      is_pro: false
    });
    setEditingId(null);
    setErrorMsg(null);
    setView('form');
  };

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name || '',
      category: item.category || 'News',
      status: item.status || 'Active',
      stream_url: item.stream_url || '',
      image: item.image || '',
      is_pro: item.is_pro || false
    });
    setEditingId(item.id);
    setErrorMsg(null);
    setView('form');
  };

  const handleDelete = async (id: number) => {
    if(window.confirm('Are you sure you want to delete this channel?')) {
      const { error } = await supabase.from('channels').delete().eq('id', id);
      if (!error) {
        setChannels(channels.filter(item => item.id !== id));
      } else {
        alert('Error deleting channel');
      }
    }
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setErrorMsg(null);
    if (!formData.name) {
      setErrorMsg('Channel name is required!');
      return;
    }

    setSaving(true);
    
    // Get next order index for this category if new
    let nextOrder = 0;
    if (!editingId) {
      const catChannels = channels.filter(c => c.category === formData.category);
      nextOrder = catChannels.length > 0 ? Math.max(...catChannels.map(c => c.order_index || 0)) + 1 : 0;
    }

    const payload: any = {
      name: formData.name,
      category: formData.category,
      status: formData.status,
      stream_url: formData.stream_url,
      image: formData.image,
      is_pro: formData.is_pro
    };

    if (!editingId) {
      payload.order_index = nextOrder;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from('channels').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('channels').insert([payload]);
        if (error) throw error;
      }
      
      fetchChannels();
      setView('list');
    } catch (err: any) {
      console.error('Supabase save error:', err);
      setErrorMsg(`کێشەیەک هەیە: ${err.message || 'هەڵەیەکی نەزانراو'}`);
    } finally {
      setSaving(false);
    }
  };

  if (view === 'form') {
    return (
      <div className="text-white space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{editingId ? 'Edit Channel' : 'Add New Channel'}</h1>
            <p className="text-neutral-400 text-sm mt-1">Configure Live TV channel details</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setView('list')} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition">Cancel</button>
            <button disabled={saving} onClick={handleSave} className="px-4 py-2 bg-white text-black font-medium hover:bg-neutral-200 rounded-lg transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Channel'}
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
              <label className="text-sm font-medium text-neutral-300">Channel Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. K24 News" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition">
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                ) : (
                  <>
                    <option>News</option>
                    <option>Entertainment</option>
                    <option>Sports</option>
                    <option>Kids</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Stream URL (m3u8)</label>
            <input type="text" value={formData.stream_url} onChange={e => setFormData({...formData, stream_url: e.target.value})} placeholder="https://..." className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
          </div>

          <div className="space-y-2">
            <ImageUpload 
              label="Channel Logo" 
              value={formData.image} 
              onChange={(val) => setFormData({...formData, image: val})} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
            <div className="space-y-2 flex flex-col justify-center">
              <label className="text-sm font-medium text-neutral-300 mb-2">Access Type</label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_pro} 
                  onChange={e => setFormData({...formData, is_pro: e.target.checked})}
                  className="w-5 h-5 rounded border-neutral-700 text-red-600 bg-neutral-900 focus:ring-red-600 focus:ring-offset-neutral-900" 
                />
                <span className="text-white font-medium">PRO Channel (Requires Subscription)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const moveChannel = async (index: number, direction: 'up' | 'down') => {
    const filtered = channels.filter(c => selectedCategory === 'All' || c.category === selectedCategory);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= filtered.length) return;

    // Create a new array with the moved item
    const newFiltered = [...filtered];
    const [movedItem] = newFiltered.splice(index, 1);
    newFiltered.splice(targetIndex, 0, movedItem);

    // Update the main channels state optimistically
    const otherChannels = channels.filter(c => selectedCategory !== 'All' && c.category !== selectedCategory);
    const updatedAllChannels = [...newFiltered, ...otherChannels];
    setChannels(updatedAllChannels);

    try {
      // Update sequential order_index for ALL channels to keep it clean
      const updates = updatedAllChannels.map((chan, i) => 
        supabase.from('channels').update({ order_index: i }).eq('id', chan.id)
      );
      await Promise.all(updates);
      fetchChannels();
    } catch (err) {
      console.error("Error reordering channels:", err);
    }
  };

  const filteredChannels = channels.filter(c => selectedCategory === 'All' || c.category === selectedCategory);

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Live TV Management</h1>
        <button onClick={handleAddNew} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center space-x-2">
          <Plus size={20} /><span>Add Channel</span>
        </button>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 w-full sm:w-80">
            <Search size={18} className="text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search channels..." 
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-400">Filter:</span>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">Order</th>
                <th className="px-6 py-4 font-medium">Channel Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">Loading channels...</td>
                </tr>
              ) : filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No channels found</td>
                </tr>
              ) : filteredChannels.map((item, index) => (
                <tr key={item.id} className="hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <button 
                        disabled={index === 0}
                        onClick={() => moveChannel(index, 'up')}
                        className={`p-1 rounded hover:bg-neutral-700 transition ${index === 0 ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-400'}`}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        disabled={index === filteredChannels.length - 1}
                        onClick={() => moveChannel(index, 'down')}
                        className={`p-1 rounded hover:bg-neutral-700 transition ${index === filteredChannels.length - 1 ? 'text-neutral-700 cursor-not-allowed' : 'text-neutral-400'}`}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                    <div className="w-8 h-8 bg-neutral-800 rounded flex items-center justify-center overflow-hidden">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Tv size={16} className="text-neutral-400" />}
                    </div>
                    <span>{item.name}</span>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-neutral-400'}`}>
                      {item.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button onClick={() => handleEdit(item)} className="text-neutral-400 hover:text-white transition"><Edit size={18} /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-neutral-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
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
