import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Package, Edit, Trash2, Calendar, ShoppingCart, X } from 'lucide-react';
import api, { getImageUrl } from '../lib/axios';
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

interface GearCatalogProps {
  cart?: string[];
  onUpdateCart?: (newCart: string[]) => void;
  onNavigateToCart?: () => void;
}

const GearCatalog = ({ cart = [], onUpdateCart, onNavigateToCart }: GearCatalogProps) => {
  const [gear, setGear] = useState<GearItem[]>([]);
  const [filteredGear, setFilteredGear] = useState<GearItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
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
  }, [gear, searchTerm, selectedCategory, startDate, endDate]);

  const fetchGear = async () => {
    try {
      const response = await api.get('/gear');
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

    // Date-based filtering - for now, show all gear as available
    // In a real implementation, this would check against rental requests
    if (startDate && endDate) {
      // Filter out items that are not available during the selected date range
      // This is a simplified implementation - in reality, you'd check against the Request table
      filtered = filtered.filter(item => item.isAvailable);
    }

    setFilteredGear(filtered);
  };

  const addToCart = (gearId: string) => {
    if (!cart.includes(gearId) && onUpdateCart) {
      onUpdateCart([...cart, gearId]);
    }
  };

  const removeFromCart = (gearId: string) => {
    if (onUpdateCart) {
      onUpdateCart(cart.filter(id => id !== gearId));
    }
  };

  const isInCart = (gearId: string) => {
    return cart.includes(gearId);
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setShowDateFilter(false);
  };

  const getCartItems = () => {
    return gear.filter(item => cart.includes(item.id));
  };


  const handleDeleteGear = async (gearId: string) => {
    if (!confirm('Are you sure you want to delete this gear item?')) {
      return;
    }

    try {
      await api.delete(`/gear/${gearId}`);
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
          <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover" />
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
          <div className="flex gap-2">
            {!isAdmin && (
              <button
                onClick={() => isInCart(item.id) ? removeFromCart(item.id) : addToCart(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  item.isAvailable
                    ? isInCart(item.id)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!item.isAvailable}
              >
                {isInCart(item.id) ? (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    In Cart
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Cart
                  </>
                )}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => isInCart(item.id) ? removeFromCart(item.id) : addToCart(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                  item.isAvailable
                    ? isInCart(item.id)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!item.isAvailable}
                title="Add to request (Admin)"
              >
                {isInCart(item.id) ? (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    In Request
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Request
                  </>
                )}
              </button>
            )}
          </div>
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
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gear Catalog</h2>
          <p className="text-gray-600">Browse and request outdoor gear for your adventures</p>
        </div>
        <div className="min-h-[60px] flex items-center">
          {cart.length > 0 && (
            <div className={`${isAdmin ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className={`w-5 h-5 ${isAdmin ? 'text-orange-600' : 'text-blue-600'} mr-2`} />
                  <span className={`${isAdmin ? 'text-orange-900' : 'text-blue-900'} font-medium`}>
                    {cart.length} item{cart.length !== 1 ? 's' : ''} {isAdmin ? 'to request' : 'in cart'}
                  </span>
                </div>
                <button
                  onClick={onNavigateToCart}
                  className={`${isAdmin ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md transition-colors text-sm`}
                >
                  {isAdmin ? 'Create Request' : 'View Cart'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
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
          
          {!isAdmin && (
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Filter by Dates
            </button>
          )}
          
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

        {/* Date Filter */}
        {showDateFilter && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={clearDateFilter}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </button>
            </div>
            {startDate && endDate && (
              <div className="mt-3 text-sm text-blue-600">
                Showing gear available from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </div>
            )}
          </div>
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