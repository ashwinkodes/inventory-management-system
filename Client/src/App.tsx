import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Package, Users, Settings } from 'lucide-react';

// Types
interface GearItem {
    id: string;
    name: string;
    brand?: string;
    category: string;
    condition: string;
    size?: string;
    isAvailable: boolean;
    nextAvailable?: string;
    imageUrl?: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
}

// Mock data for demonstration
const mockGear: GearItem[] = [
    {
        id: '1',
        name: 'Osprey Atmos 65L',
        brand: 'Osprey',
        category: 'BACKPACK',
        condition: 'GOOD',
        size: 'Medium',
        isAvailable: true
    },
    {
        id: '2',
        name: 'Marmot Trestles 15°',
        brand: 'Marmot',
        category: 'SLEEPING_BAG',
        condition: 'EXCELLENT',
        isAvailable: false,
        nextAvailable: '2025-08-15'
    },
    {
        id: '3',
        name: 'Black Diamond Momentum',
        brand: 'Black Diamond',
        category: 'CLIMBING_HARNESS',
        condition: 'GOOD',
        size: 'Large',
        isAvailable: true
    }
];

const mockUser: User = {
    id: '1',
    name: 'John Climber',
    email: 'john@outdoorclub.com',
    role: 'MEMBER'
};

const GearRentalApp = () => {
    const [currentView, setCurrentView] = useState('catalog');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [gear, setGear] = useState<GearItem[]>(mockGear);
    const [user] = useState<User>(mockUser);

    const categories = [
        { value: 'all', label: 'All Categories' },
        { value: 'BACKPACK', label: 'Backpacks' },
        { value: 'SLEEPING_BAG', label: 'Sleeping Bags' },
        { value: 'TENT', label: 'Tents' },
        { value: 'CLIMBING_HARNESS', label: 'Climbing Harnesses' },
        { value: 'ICE_AXE', label: 'Ice Axes' },
        { value: 'OTHER', label: 'Other' }
    ];

    const filteredGear = gear.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatCategory = (category: string) => {
        return category.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'EXCELLENT': return 'text-green-600 bg-green-100';
            case 'GOOD': return 'text-blue-600 bg-blue-100';
            case 'FAIR': return 'text-yellow-600 bg-yellow-100';
            case 'POOR': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const GearCard = ({ item }: { item: GearItem }) => (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gray-200 flex items-center justify-center">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <Package className="w-16 h-16 text-gray-400" />
                )}
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
            {item.condition}
          </span>
                </div>
                {item.brand && (
                    <p className="text-gray-600 text-sm mb-1">{item.brand}</p>
                )}
                <p className="text-gray-500 text-sm mb-2">{formatCategory(item.category)}</p>
                {item.size && (
                    <p className="text-gray-500 text-sm mb-2">Size: {item.size}</p>
                )}
                <div className="flex justify-between items-center">
                    {item.isAvailable ? (
                        <span className="text-green-600 font-medium">Available</span>
                    ) : (
                        <span className="text-red-600 font-medium">
              Until {item.nextAvailable && new Date(item.nextAvailable).toLocaleDateString()}
            </span>
                    )}
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            item.isAvailable
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!item.isAvailable}
                    >
                        {item.isAvailable ? 'Request' : 'Unavailable'}
                    </button>
                </div>
            </div>
        </div>
    );

    const Sidebar = () => (
        <div className="w-64 bg-white shadow-lg h-screen fixed left-0 top-0 overflow-y-auto">
            <div className="p-6 border-b">
                <h1 className="text-xl font-bold text-gray-900">Gear Rental</h1>
                <p className="text-sm text-gray-600 mt-1">{user.name}</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
          {user.role}
        </span>
            </div>

            <nav className="p-4">
                <ul className="space-y-2">
                    <li>
                        <button
                            onClick={() => setCurrentView('catalog')}
                            className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                                currentView === 'catalog' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Package className="w-5 h-5 mr-3" />
                            Gear Catalog
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setCurrentView('requests')}
                            className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                                currentView === 'requests' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Calendar className="w-5 h-5 mr-3" />
                            My Requests
                        </button>
                    </li>
                    {user.role === 'ADMIN' && (
                        <>
                            <li>
                                <button
                                    onClick={() => setCurrentView('admin')}
                                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                                        currentView === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Settings className="w-5 h-5 mr-3" />
                                    Admin Panel
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setCurrentView('users')}
                                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${
                                        currentView === 'users' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <Users className="w-5 h-5 mr-3" />
                                    Users
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </div>
    );

    const GearCatalog = () => (
        <div>
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search gear..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </select>
                {user.role === 'ADMIN' && (
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Gear
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredGear.map(item => (
                    <GearCard key={item.id} item={item} />
                ))}
            </div>

            {filteredGear.length === 0 && (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No gear found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
            )}
        </div>
    );

    const MyRequests = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Requests</h2>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center py-8">No requests yet. Start by browsing the gear catalog!</p>
            </div>
        </div>
    );

    const AdminPanel = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Gear</h3>
                    <p className="text-3xl font-bold text-blue-600">{gear.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Now</h3>
                    <p className="text-3xl font-bold text-green-600">{gear.filter(g => g.isAvailable).length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Requests</h3>
                    <p className="text-3xl font-bold text-yellow-600">0</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <p className="text-gray-500">No recent activity to display.</p>
            </div>
        </div>
    );

    const Users = () => (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-500 text-center py-8">User management features coming soon...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <main className="ml-64 p-8">
                {currentView === 'catalog' && <GearCatalog />}
                {currentView === 'requests' && <MyRequests />}
                {currentView === 'admin' && user.role === 'ADMIN' && <AdminPanel />}
                {currentView === 'users' && user.role === 'ADMIN' && <Users />}
            </main>
        </div>
    );
};

export default GearRentalApp;