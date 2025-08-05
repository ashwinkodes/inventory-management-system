import { useState } from 'react';
import { X, Calendar, User, FileText, AlertTriangle } from 'lucide-react';

interface GearItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: GearItem[];
  onSubmit: (requestData: RequestData) => void;
}

interface RequestData {
  startDate: string;
  endDate: string;
  tripName: string;
  intentionsCode: string;
  purpose: string;
  experience: string;
  notes?: string;
}

const CheckoutModal = ({ isOpen, onClose, cartItems, onSubmit }: CheckoutModalProps) => {
  const [formData, setFormData] = useState<RequestData>({
    startDate: '',
    endDate: '',
    tripName: '',
    intentionsCode: '',
    purpose: '',
    experience: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
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
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Request Gear</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cart Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Selected Gear ({cartItems.length} items)</h3>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-600">{item.brand}</span>
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
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cartItems.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;