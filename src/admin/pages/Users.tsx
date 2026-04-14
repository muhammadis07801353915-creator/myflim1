import { useState } from 'react';
import { Search, Edit, Trash2, Shield, User, Ban, CheckCircle } from 'lucide-react';

const initialUsers = [
  { id: 1, name: 'Anderson Cooper', email: 'anderson@example.com', role: 'Premium', status: 'Active', joinDate: '2024-01-15' },
  { id: 2, name: 'Admin User', email: 'admin@mytv.com', role: 'Admin', status: 'Active', joinDate: '2023-11-02' },
  { id: 3, name: 'John Doe', email: 'john@example.com', role: 'Free', status: 'Banned', joinDate: '2024-02-20' },
  { id: 4, name: 'Sarah Smith', email: 'sarah@example.com', role: 'Free', status: 'Active', joinDate: '2024-03-10' },
];

export default function Users() {
  const [users, setUsers] = useState(initialUsers);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'Free', status: 'Active'
  });

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      email: item.email,
      role: item.role,
      status: item.status
    });
    setEditingId(item.id);
    setView('form');
  };

  const handleDelete = (id: number) => {
    if(window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(item => item.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      alert('Name and Email are required!');
      return;
    }

    if (editingId) {
      setUsers(users.map(item => item.id === editingId ? { ...item, ...formData } : item));
    }
    setView('list');
  };

  if (view === 'form') {
    return (
      <div className="text-white space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit User</h1>
            <p className="text-neutral-400 text-sm mt-1">Manage user roles and access</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setView('list')} className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition">Save Changes</button>
          </div>
        </div>

        <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Email Address</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Account Role</label>
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition">
                <option>Free</option>
                <option>Premium</option>
                <option>Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Account Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 transition">
                <option>Active</option>
                <option>Banned</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Users Management</h1>
      </div>

      <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 w-full sm:w-80">
            <Search size={18} className="text-neutral-500" />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none">
              <option>All Roles</option>
              <option>Free</option>
              <option>Premium</option>
              <option>Admin</option>
            </select>
            <select className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none">
              <option>All Status</option>
              <option>Active</option>
              <option>Banned</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900/50 text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Join Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                        <User size={18} className="text-neutral-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-neutral-500">{item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center w-fit space-x-1 ${
                      item.role === 'Admin' ? 'bg-red-500/10 text-red-500' : 
                      item.role === 'Premium' ? 'bg-yellow-500/10 text-yellow-500' : 
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {item.role === 'Admin' && <Shield size={12} />}
                      <span>{item.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center w-fit space-x-1 ${
                      item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-500/10 text-neutral-400'
                    }`}>
                      {item.status === 'Active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                      <span>{item.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-neutral-400">{item.joinDate}</td>
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
