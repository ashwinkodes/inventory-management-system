import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Package, Edit, Trash2 } from 'lucide-react';
import axios from 'axios';
import AddGearModal from './AddGearModal';
import EditGearModal from './EditGearModal';

interface GearItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  condition: string;
  size?: string;
  imageUrl?: string;
  isAvailable: boolean;
  nextAvailable?: string;
  description?: string;
  clubId: string;
}

const GearCatalog = () => {
  const [gear, setGear] = useState<GearItem[]>([]);
  const [filteredGear, setFilteredGear] = useState<GearItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGear, setEditingGear] = useState<GearItem | null>(null);
  
  const { isAdmin } = useAuth();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'BACKPACK', label: 'Backpacks' },
    { value: 'SLEEPING_BAG', label: 'Sleeping Bags' },
    { value: 'SLEEPING_PAD', label: 'Sleeping Pads' },
    { value: 'TENT', label: 'Tents' },
    { value: 'COOKING', label: 'Cooking' },
    { value: 'CLIMBING_HARNESS', label: 'Climbing Harnesses' },
    { value: 'CLIMBING_SHOES', label: 'Climbing Shoes' },
    { value: 'ICE_AXE', label: 'Ice Axes' },
    { value: 'CRAMPONS', label: 'Crampons' },
    { value: 'HELMET', label: 'Helmets' },
    { value: 'ROPE', label: 'Ropes' },
    { value: 'CANOE_KAYAK', label: 'Canoe/Kayak' },
    { value: 'PADDLE', label: 'Paddles' },
    { value: 'PFD', label: 'PFDs' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    fetchGear();
  }, []);

  useEffect(() => {
    filterGear();
  }, [gear, searchTerm, selectedCategory]);

  const fetchGear = async () => {
    try {
      const response = await axios.get('/gear');
      setGear(response.data);
    } catch (error) {
      console.error('Error fetching gear:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGear = () => {
    let filtered = gear;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredGear(filtered);
  };

  const handleDeleteGear = async (gearId: string) => {
    if (!confirm('Are you sure you want to delete this gear item?')) {
      return;
    }

    try {
      await axios.delete(`/gear/${gearId}`);
      setGear(gear.filter(item => item.id !== gearId));
    } catch (error) {
      console.error('Error deleting gear:', error);
      alert('Failed to delete gear item');
    }
  };

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
      <div className="h-48 bg-gray-200 flex items-center justify-center relative">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <Package className="w-16 h-16 text-gray-400" />
        )}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => setEditingGear(item)}
              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              title="Edit gear"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteGear(item.id)}
              className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              title="Delete gear"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
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
        {item.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
        {isAdmin && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
          >
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

      {/* Modals */}
      {showAddModal && (
        <AddGearModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchGear();
          }}
        />
      )}

      {editingGear && (
        <EditGearModal
          gear={editingGear}
          onClose={() => setEditingGear(null)}
          onSuccess={() => {
            setEditingGear(null);
            fetchGear();
          }}
        />
      )}
    </div>
  );
};

export default GearCatalog;