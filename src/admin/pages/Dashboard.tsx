import { Users, Film, Tv, PlayCircle, TrendingUp, DollarSign } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', views: 4000, users: 2400 },
  { name: 'Tue', views: 3000, users: 1398 },
  { name: 'Wed', views: 2000, users: 9800 },
  { name: 'Thu', views: 2780, users: 3908 },
  { name: 'Fri', views: 1890, users: 4800 },
  { name: 'Sat', views: 2390, users: 3800 },
  { name: 'Sun', views: 3490, users: 4300 },
];

export default function Dashboard() {
  const stats = [
    { title: 'Total Users', value: '124,592', icon: <Users size={24} className="text-blue-500" />, trend: '+12.5%' },
    { title: 'Total Movies', value: '3,492', icon: <Film size={24} className="text-purple-500" />, trend: '+4.2%' },
    { title: 'Total Series', value: '845', icon: <PlayCircle size={24} className="text-pink-500" />, trend: '+2.1%' },
    { title: 'Live Channels', value: '156', icon: <Tv size={24} className="text-green-500" />, trend: '0%' },
    { title: 'Active Subscriptions', value: '45,231', icon: <TrendingUp size={24} className="text-orange-500" />, trend: '+8.4%' },
    { title: 'Revenue (Monthly)', value: '$124,500', icon: <DollarSign size={24} className="text-emerald-500" />, trend: '+15.3%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <div className="flex space-x-2">
          <select className="bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg px-3 py-2 outline-none">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
              <p className={`text-sm mt-2 ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-neutral-500'}`}>
                {stat.trend} from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Platform Traffic</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1a1d24] border border-neutral-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[
              { action: 'New User Registered', time: '5 mins ago', user: 'ahmed_99' },
              { action: 'Movie Added', time: '1 hour ago', user: 'Admin', detail: 'Dune: Part Two' },
              { action: 'Subscription Renewed', time: '2 hours ago', user: 'sara_k' },
              { action: 'Live Channel Updated', time: '5 hours ago', user: 'Admin', detail: 'K24 News' },
              { action: 'New User Registered', time: '6 hours ago', user: 'mohammed_ali' },
            ].map((item, i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-white">{item.action}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    <span className="text-neutral-300">{item.user}</span> 
                    {item.detail && <span> • {item.detail}</span>}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
