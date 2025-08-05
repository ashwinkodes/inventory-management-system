import { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, Package, ShoppingCart, Calendar, User, FileText, AlertTriangle } from 'lucide-react';
import api, { getImageUrl } from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';

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
  totalAvailable?: number;
}

interface CartItem extends GearItem {
  quantity: number;
}

interface CartProps {
  cart: string[];
  onUpdateCart: (newCart: string[]) => void;
  onCheckout: (requestData: RequestData) => void;
  startDate?: string;
  endDate?: string;
}

interface RequestData {
  startDate: string;
  endDate: string;
  tripName: string;
  intentionsCode: string;
  purpose: string;
  experience: string;
  notes?: string;
  gearItems: { gearId: string; quantity: number }[];
}

const Cart = ({ cart, onUpdateCart, onCheckout, startDate = '', endDate = '' }: CartProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState<Omit<RequestData, 'gearItems'>>({
    startDate,
    endDate,
    tripName: '',
    intentionsCode: '',
    purpose: '',
    experience: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCartItems();
  }, [cart]);

  const fetchCartItems = async () => {
    if (cart.length === 0) {
      setCartItems([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/gear');
      const allGear: GearItem[] = response.data;
      
      // Convert cart array to cart items with quantities
      const cartItemsMap = new Map<string, number>();
      cart.forEach(id => {
        cartItemsMap.set(id, (cartItemsMap.get(id) || 0) + 1);
      });

      const items: CartItem[] = [];
      cartItemsMap.forEach((quantity, gearId) => {
        const gearItem = allGear.find(item => item.id === gearId);
        if (gearItem) {
          items.push({
            ...gearItem,
            quantity,
            totalAvailable: getTotalAvailable(gearItem)
          });
        }
      });

      setCartItems(items);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalAvailable = (item: GearItem): number => {
    // This would typically come from the server with proper inventory tracking
    // For now, we'll assume each item has a quantity of 1 unless specified
    return 1;
  };

  const updateQuantity = (gearId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(gearId);
      return;
    }

    const item = cartItems.find(item => item.id === gearId);
    if (!item) return;

    const maxQuantity = item.totalAvailable || 1;
    const actualQuantity = Math.min(newQuantity, maxQuantity);

    // Update cart array to reflect new quantity
    const newCart = cart.filter(id => id !== gearId);
    for (let i = 0; i < actualQuantity; i++) {
      newCart.push(gearId);
    }
    
    onUpdateCart(newCart);
  };

  const removeFromCart = (gearId: string) => {
    const newCart = cart.filter(id => id !== gearId);
    onUpdateCart(newCart);
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

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.tripName) newErrors.tripName = 'Trip name is required';
    if (!formData.intentionsCode) newErrors.intentionsCode = 'Intentions code is required';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (!formData.experience) newErrors.experience = 'Experience level is required';
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const gearItems = cartItems.map(item => ({
      gearId: item.id,
      quantity: item.quantity
    }));

    const requestData: RequestData = {
      ...formData,
      gearItems
    };

    setIsSubmitting(true);
    try {
      await onCheckout(requestData);
      setShowCheckout(false);
      // Reset form
      setFormData({
        startDate: '',
        endDate: '',
        tripName: '',
        intentionsCode: '',
        purpose: '',
        experience: '',
        notes: ''
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isAdmin ? 'No items selected for request' : 'Your cart is empty'}
        </h3>
        <p className="text-gray-500">
          Browse the gear catalog to {isAdmin ? 'select items for a request' : 'add items to your cart'}.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAdmin ? 'Create Gear Request' : 'Shopping Cart'}
        </h2>
        <p className="text-gray-600">
          {isAdmin ? 'Review and edit your gear selection for the request' : 'Review and edit your gear selection'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Cart Items */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Selected Gear ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h3>
            <div className="space-y-4">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={getImageUrl(item.imageUrl)} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        {item.brand && <p className="text-sm text-gray-600">{item.brand}</p>}
                        <p className="text-sm text-gray-500">{formatCategory(item.category)}</p>
                        {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(item.condition)}`}>
                        {item.condition}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-700">Quantity:</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
                            disabled={item.quantity >= (item.totalAvailable || 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {item.totalAvailable && item.totalAvailable > 1 && (
                          <span className="text-xs text-gray-500">({item.totalAvailable} available)</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checkout Button */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium text-gray-900">
                Total: {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
              <p className="text-sm text-gray-600">Ready to submit your request</p>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className={`${isAdmin ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-3 rounded-md transition-colors text-sm font-medium`}
            >
              {isAdmin ? 'Submit Request' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {isAdmin ? 'Create Gear Request' : 'Request Gear'}
              </h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-6">
              {/* Cart Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">
                  Selected Gear ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
                </h3>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600">
                        {item.brand} - Qty: {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.startDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.startDate && <p className="text-red-600 text-xs mt-1">{errors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.endDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.endDate && <p className="text-red-600 text-xs mt-1">{errors.endDate}</p>}
                </div>
              </div>

              {/* Trip Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Name *
                </label>
                <input
                  type="text"
                  name="tripName"
                  value={formData.tripName}
                  onChange={handleChange}
                  placeholder="e.g., Tongariro Alpine Crossing"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tripName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.tripName && <p className="text-red-600 text-xs mt-1">{errors.tripName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Intentions Code *
                </label>
                <input
                  type="text"
                  name="intentionsCode"
                  value={formData.intentionsCode}
                  onChange={handleChange}
                  placeholder="e.g., 0x10A"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.intentionsCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your adventure registration code (usually from outdoor safety forms)
                </p>
                {errors.intentionsCode && <p className="text-red-600 text-xs mt-1">{errors.intentionsCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Purpose *
                </label>
                <select
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.purpose ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select purpose</option>
                  <option value="tramping">Tramping/Hiking</option>
                  <option value="climbing">Rock/Alpine Climbing</option>
                  <option value="kayaking">Kayaking/Canoeing</option>
                  <option value="camping">Camping</option>
                  <option value="course">Club Course/Training</option>
                  <option value="other">Other</option>
                </select>
                {errors.purpose && <p className="text-red-600 text-xs mt-1">{errors.purpose}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Experience Level *
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.experience ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select experience level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                {errors.experience && <p className="text-red-600 text-xs mt-1">{errors.experience}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional information about your trip or special requirements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className={`flex-1 px-4 py-2 ${isAdmin ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;