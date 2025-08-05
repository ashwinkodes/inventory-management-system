import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Calendar, 
  Package, 
  Users as UsersIcon, 
  Settings, 
  LogOut,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Layout = ({ children, currentView, setCurrentView }: LayoutProps) => {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navigation = [
    { id: 'catalog', name: 'Gear Catalog', icon: Package },
    { id: 'requests', name: 'My Requests', icon: Calendar },
    ...(isAdmin ? [
      { id: 'calendar', name: 'Rental Calendar', icon: Calendar },
      { id: 'admin', name: 'Admin Panel', icon: Settings },
      { id: 'users', name: 'User Management', icon: UsersIcon },
      { id: 'approvals', name: 'User Approvals', icon: UserCheck }
    ] : [])
  ];

  const Sidebar = () => (
    <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:inset-0`}>
      <div className="flex items-center justify-between h-16 px-6 border-b lg:hidden">
        <span className="text-xl font-bold text-gray-900">Gear Rental</span>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 border-b hidden lg:block">
        <h1 className="text-xl font-bold text-gray-900">Gear Rental</h1>
        <p className="text-sm text-gray-600 mt-1">{user?.name}</p>
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
          isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {user?.role}
        </span>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setCurrentView(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                    currentView === item.id 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2 rounded-md text-left text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Gear Rental</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;