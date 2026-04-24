import { useState, useEffect } from 'react';
import { Plus, Trash2, List as ListIcon, Save, ArrowUp, ArrowDown, Edit2, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function MovieLists() {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState({ ku: '', ar: '', en: '' });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState({ ku: '', ar: '', en: '' });

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('movie_lists')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setLists(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.ku.trim()) {
      alert("Kurdish Name is required!");
      return;
    }
    setSaving(true);
    
    const nextOrder = lists.length > 0 ? Math.max(...lists.map(l => l.order_index || 0)) + 1 : 0;
    
    const { error } = await supabase
      .from('movie_lists')
      .insert([{ 
        name: newName.ku, 
        name_ar: newName.ar, 
        name_en: newName.en, 
        order_index: nextOrder 
      }]);
    
    if (!error) {
      setNewName({ ku: '', ar: '', en: '' });
      fetchLists();
    } else {
      alert('Error creating list.');
    }
    setSaving(false);
  };

  const handleUpdateName = async (id: number, oldName: string) => {
    if (!editName.ku.trim()) {
      alert("Kurdish Name is required!");
      return;
    }
    setSaving(true);
    
    try {
      // 1. Update the list name
      const { error: listError } = await supabase
        .from('movie_lists')
        .update({ 
          name: editName.ku, 
          name_ar: editName.ar, 
          name_en: editName.en 
        })
        .eq('id', id);
      
      if (listError) throw listError;

      // 2. Update all movies that were using the old name (Fallback just in case)
      if (editName.ku !== oldName) {
        const { error: movieError } = await supabase
          .from('movies')
          .update({ list_name: editName.ku })
          .eq('list_name', oldName);
        
        if (movieError) console.error("Error updating movies list_name:", movieError);
      }

      setEditingId(null);
      fetchLists();
    } catch (err: any) {
      alert('Error updating name: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure? Movies in this list will no longer be categorized.')) {
      const { error } = await supabase.from('movie_lists').delete().eq('id', id);
      if (!error) {
        fetchLists();
      }
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lists.length) return;

    const currentItem = lists[index];
    const targetItem = lists[targetIndex];

    const updatedLists = [...lists];
    const tempOrder = currentItem.order_index;
    updatedLists[index].order_index = targetItem.order_index;
    updatedLists[targetIndex].order_index = tempOrder;
    updatedLists.sort((a, b) => a.order_index - b.order_index);
    setLists(updatedLists);

    try {
      await Promise.all([
        supabase.from('movie_lists').update({ order_index: targetItem.order_index }).eq('id', currentItem.id),
        supabase.from('movie_lists').update({ order_index: currentItem.order_index }).eq('id', targetItem.id)
      ]);
    } catch (err) {
      console.error("Error reordering:", err);
    }

    fetchLists();
  };

  return (
    <div className="text-white space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage Movie Lists</h1>
        <p className="text-neutral-400 text-sm">Create sections for your home screen</p>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input 
            type="text" 
            value={newName.ku}
            onChange={(e) => setNewName({...newName, ku: e.target.value})}
            placeholder="ناوی لیست (کوردی)..." 
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 transition"
          />
          <input 
            type="text" 
            value={newName.ar}
            onChange={(e) => setNewName({...newName, ar: e.target.value})}
            placeholder="اسم القائمة (عربي)..." 
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 transition"
            dir="rtl"
          />
          <input 
            type="text" 
            value={newName.en}
            onChange={(e) => setNewName({...newName, en: e.target.value})}
            placeholder="List Name (English)..." 
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2 text-white outline-none focus:border-red-500 transition"
          />
        </div>
        <div className="flex justify-end mb-8">
          <button 
            onClick={handleAdd}
            disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Plus size={20} />
            <span>{saving ? 'Adding...' : 'Add List'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {loading && lists.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">Loading lists...</div>
          ) : lists.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">No lists created yet.</div>
          ) : (
            lists.map((list, index) => (
              <div key={list.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-lg group gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-1">
                    <button 
                      disabled={index === 0}
                      onClick={() => moveItem(index, 'up')} 
                      className={`transition ${index === 0 ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-600 hover:text-white'}`}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      disabled={index === lists.length - 1}
                      onClick={() => moveItem(index, 'down')} 
                      className={`transition ${index === lists.length - 1 ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-600 hover:text-white'}`}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  <ListIcon size={20} className="text-red-500 shrink-0" />
                </div>
                  
                {editingId === list.id ? (
                  <div className="flex flex-col md:flex-row items-center gap-2 flex-1 w-full">
                    <input 
                      type="text" 
                      value={editName.ku}
                      onChange={(e) => setEditName({...editName, ku: e.target.value})}
                      placeholder="کوردی"
                      className="w-full md:flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white outline-none focus:border-red-500"
                    />
                    <input 
                      type="text" 
                      value={editName.ar}
                      onChange={(e) => setEditName({...editName, ar: e.target.value})}
                      placeholder="عربي"
                      dir="rtl"
                      className="w-full md:flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white outline-none focus:border-red-500"
                    />
                    <input 
                      type="text" 
                      value={editName.en}
                      onChange={(e) => setEditName({...editName, en: e.target.value})}
                      placeholder="English"
                      className="w-full md:flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white outline-none focus:border-red-500"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateName(list.id, list.name)} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded transition">
                        <Check size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-neutral-500 hover:bg-neutral-500/10 rounded transition">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col md:flex-row md:gap-8 gap-1 ml-10 md:ml-0">
                    <span className="font-medium text-white">{list.name} <span className="text-xs text-neutral-500 ml-2">(KU)</span></span>
                    <span className="text-neutral-400">{list.name_ar || '-'} <span className="text-xs text-neutral-600 ml-2">(AR)</span></span>
                    <span className="text-neutral-400">{list.name_en || '-'} <span className="text-xs text-neutral-600 ml-2">(EN)</span></span>
                  </div>
                )}

                {editingId !== list.id && (
                  <div className="flex items-center space-x-2 md:opacity-0 group-hover:opacity-100 transition self-end md:self-auto">
                    <button 
                      onClick={() => {
                        setEditingId(list.id);
                        setEditName({ ku: list.name, ar: list.name_ar || '', en: list.name_en || '' });
                      }}
                      className="p-2 text-neutral-500 hover:text-blue-500 transition"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(list.id)}
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
