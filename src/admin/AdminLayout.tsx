import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Film, 
  Tv, 
  Settings, 
  LogOut,
  Bell,
  Search,
  List as ListIcon,
  Trophy,
  Menu,
  X,
  Image as ImageIcon,
  BarChart,
  WifiOff,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [brokenCount, setBrokenCount] = useState(0);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check auth on mount
    const hasToken = document.cookie.includes('admin_token=secret_admin_session_token');
    if (hasToken) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);

    const fetchBrokenCount = async () => {
      const { count } = await supabase
        .from('movies')
        .select('id', { count: 'exact', head: true })
        .eq('is_broken', true);
      setBrokenCount(count || 0);
    };
    fetchBrokenCount();
    // Refresh every 5 minutes
    const interval = setInterval(fetchBrokenCount, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginCode === '400500') {
      document.cookie = "admin_token=secret_admin_session_token; path=/; max-age=604800; samesite=lax";
      setIsAuthenticated(true);
    } else {
      alert('Invalid security code!');
      setLoginCode('');
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4">
        <div className="bg-[#1a1d24] w-full max-w-md rounded-2xl p-8 border border-neutral-800 shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-3xl font-bold italic tracking-tighter mb-2">
              <span className="text-red-500">my</span>TV+ <span className="text-xl text-neutral-400 not-italic font-normal">Admin</span>
            </div>
            <p className="text-neutral-500 text-sm">Please enter your security code to access the control center.</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-5 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono outline-none focus:border-red-500 transition-colors"
                placeholder="******"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
            >
              Access Control Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', path: '/portal-control-center', icon: <LayoutDashboard size={20} /> },
    { name: 'Analytics', path: '/portal-control-center/analytics', icon: <BarChart size={20} /> },
    { name: 'Users', path: '/portal-control-center/users', icon: <Users size={20} /> },
    { name: 'Movies & Series', path: '/portal-control-center/movies', icon: <Film size={20} /> },
    { name: 'Comments', path: '/portal-control-center/comments', icon: <MessageSquare size={20} /> },
    { name: 'User Reports', path: '/portal-control-center/reports', icon: <AlertTriangle size={20} /> },
    { name: 'Top Contents', path: '/portal-control-center/top-contents', icon: <Trophy size={20} /> },
    { name: 'Movie Lists', path: '/portal-control-center/movie-lists', icon: <ListIcon size={20} /> },
    { name: 'Live TV Categories', path: '/portal-control-center/livetv-categories', icon: <ListIcon size={20} /> },
    { name: 'Live TV', path: '/portal-control-center/livetv', icon: <Tv size={20} /> },
    { name: 'Banners & Ads', path: '/portal-control-center/banners', icon: <ImageIcon size={20} /> },
    { name: 'Settings', path: '/portal-control-center/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    navigate.push('/');
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-[#0f1115] text-white font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a1d24] border-r border-neutral-800 flex flex-col transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-800 shrink-0">
          <div className="text-2xl font-bold italic tracking-tighter">
            <span className="text-red-500">my</span>TV+ <span className="text-sm text-neutral-400 not-italic font-normal ml-2">Admin</span>
          </div>
          <button onClick={closeSidebar} className="md:hidden text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === '/portal-control-center' ? pathname === '/portal-control-center' : pathname?.startsWith(item.path);
            return (
            <Link
              key={item.name}
              href={item.path}
              onClick={closeSidebar}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-red-500/10 text-red-500 font-medium' 
                  : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          )})}

          {/* Broken Links - Special item with badge */}
          <Link
            href="/portal-control-center/broken-links"
            onClick={closeSidebar}
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              pathname?.startsWith('/portal-control-center/broken-links')
                ? 'bg-red-500/10 text-red-500 font-medium'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <WifiOff size={20} />
              <span>Broken Links</span>
            </div>
            {brokenCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse min-w-[20px] text-center">
                {brokenCount}
              </span>
            )}
          </Link>
        </nav>

        <div className="p-4 border-t border-neutral-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-[#1a1d24] border-b border-neutral-800 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 text-neutral-400 hover:text-white md:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center bg-neutral-900 rounded-lg px-3 py-1.5 w-96 border border-neutral-800">
              <Search size={18} className="text-neutral-500" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-white placeholder-neutral-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-neutral-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 border-l border-neutral-800 pl-4 ml-2">
              <img 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
                alt="Admin" 
                className="w-8 h-8 rounded-full object-cover border border-neutral-700"
              />
              <div className="hidden md:block text-sm">
                <p className="font-medium text-white">Admin User</p>
                <p className="text-xs text-neutral-500">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#0f1115]">
          {children}
        </main>
      </div>
    </div>
  );
}
