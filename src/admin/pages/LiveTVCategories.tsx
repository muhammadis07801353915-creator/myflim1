import { useState, useEffect } from 'react';
import { Plus, Trash2, List as ListIcon, ArrowUp, ArrowDown, Edit2, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function LiveTVCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('channel_categories')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error("Error fetching categories:", error);
      alert('Error loading categories: ' + error.message);
    } else if (data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.order_index || 0)) + 1 : 0;
    
    const { error } = await supabase
      .from('channel_categories')
      .insert([{ name: newName, order_index: nextOrder }]);
    
    if (!error) {
      setNewName('');
      fetchCategories();
    } else {
      console.error("Error creating category:", error);
      alert('Error creating category: ' + error.message);
    }
    setSaving(false);
  };

  const handleUpdateName = async (id: number, oldName: string) => {
    if (!editName.trim() || editName === oldName) {
      setEditingId(null);
      return;
    }
    setSaving(true);
    
    try {
      const { error: catError } = await supabase
        .from('channel_categories')
        .update({ name: editName })
        .eq('id', id);
      
      if (catError) throw catError;

      // Update all channels that were using the old name
      const { error: channelError } = await supabase
        .from('channels')
        .update({ category: editName })
        .eq('category', oldName);
      
      if (channelError) console.error("Error updating channels category:", channelError);

      setEditingId(null);
      fetchCategories();
    } catch (err: any) {
      alert('Error updating name: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure? Channels in this category will no longer be categorized.')) {
      const { error } = await supabase.from('channel_categories').delete().eq('id', id);
      if (!error) {
        fetchCategories();
      }
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newCategories = [...categories];
    const [movedItem] = newCategories.splice(index, 1);
    newCategories.splice(targetIndex, 0, movedItem);

    // Optimistic update for smooth UI
    setCategories(newCategories);

    try {
      // Update all items with their new sequential index
      const updates = newCategories.map((cat, i) => 
        supabase.from('channel_categories').update({ order_index: i }).eq('id', cat.id)
      );
      
      await Promise.all(updates);
    } catch (err) {
      console.error("Error reordering:", err);
    }

    fetchCategories();
  };

  return (
    <div className="text-white space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Live TV Categories</h1>
        <p className="text-neutral-400 text-sm">Create sections for your Live TV screen</p>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
        <div className="flex gap-4 mb-8">
          <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. News, Sports, Kids..." 
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 transition"
          />
          <button 
            onClick={handleAdd}
            disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Plus size={20} />
            <span>{saving ? 'Adding...' : 'Add Category'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {loading && categories.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">No categories created yet.</div>
          ) : (
            categories.map((cat, index) => (
              <div key={cat.id} className="flex items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg group">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex flex-col space-y-1">
                    <button 
                      disabled={index === 0}
                      onClick={() => moveItem(index, 'up')} 
                      className={`transition ${index === 0 ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-600 hover:text-white'}`}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      disabled={index === categories.length - 1}
                      onClick={() => moveItem(index, 'down')} 
                      className={`transition ${index === categories.length - 1 ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-600 hover:text-white'}`}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  <ListIcon size={20} className="text-red-500 shrink-0" />
                  
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="text" 
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateName(cat.id, cat.name)}
                        className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white outline-none focus:border-red-500"
                      />
                      <button onClick={() => handleUpdateName(cat.id, cat.name)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-neutral-500 hover:bg-neutral-500/10 rounded transition">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium truncate">{cat.name}</span>
                  )}
                </div>

                {editingId !== cat.id && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition">
                    <button 
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                      className="p-2 text-neutral-500 hover:text-blue-500 transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-neutral-500 hover:text-red-500 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
