import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Package, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import api, { getImageUrl } from '../lib/axios';

interface GearItem {
  id: string;
  name: string;
  brand?: string;
  category: string;
  imageUrl?: string;
}

interface RequestItem {
  id: string;
  quantity: number;
  gear: GearItem;
}

interface RequestUser {
  id: string;
  name: string;
  email: string;
}

interface Request {
  id: string;
  startDate: string;
  endDate: string;
  tripName?: string;
  purpose?: string;
  experience?: string;
  intentionsCode?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_OUT' | 'RETURNED' | 'CANCELLED';
  createdAt: string;
  approvedAt?: string;
  adminNotes?: string;
  user: RequestUser;
  items: RequestItem[];
}

const AdminRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditGear, setShowEditGear] = useState(false);
  const [availableGear, setAvailableGear] = useState<GearItem[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests/all');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableGear = async () => {
    try {
      const response = await api.get('/gear');
      setAvailableGear(response.data);
    } catch (error) {
      console.error('Error fetching available gear:', error);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.tripName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    setIsUpdating(true);
    try {
      await api.put(`/requests/${requestId}/status`, {
        status: newStatus,
        notes
      });
      await fetchRequests();
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update request status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'CHECKED_OUT': return <Package className="w-5 h-5 text-blue-600" />;
      case 'RETURNED': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'CANCELLED': return <XCircle className="w-5 h-5 text-gray-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'CHECKED_OUT': return 'bg-blue-100 text-blue-800';
      case 'RETURNED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    return category.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const EditGearModal = () => {
    const [editedItems, setEditedItems] = useState<{gearId: string, quantity: number}[]>(
      selectedRequest?.items.map(item => ({
        gearId: item.gear.id,
        quantity: item.quantity
      })) || []
    );
    const [isUpdatingGear, setIsUpdatingGear] = useState(false);

    const handleAddItem = () => {
      setEditedItems([...editedItems, { gearId: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
      setEditedItems(editedItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'gearId' | 'quantity', value: string | number) => {
      const updated = [...editedItems];
      updated[index] = { ...updated[index], [field]: value };
      setEditedItems(updated);
    };

    const handleSaveGearChanges = async () => {
      if (!selectedRequest) return;
      
      // Filter out empty gear selections
      const validItems = editedItems.filter(item => item.gearId && item.quantity > 0);
      
      if (validItems.length === 0) {
        alert('Please select at least one gear item');
        return;
      }

      setIsUpdatingGear(true);
      try {
        await api.put(`/requests/${selectedRequest.id}/items`, {
          items: validItems
        });
        await fetchRequests();
        setShowEditGear(false);
        // Update the selected request to reflect changes
        const updatedRequest = requests.find(r => r.id === selectedRequest.id);
        if (updatedRequest) {
          setSelectedRequest(updatedRequest);
        }
      } catch (error: any) {
        console.error('Error updating gear items:', error);
        alert(error.response?.data?.error || 'Failed to update gear items');
      } finally {
        setIsUpdatingGear(false);
      }
    };

    if (!selectedRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Edit Request Gear</h2>
            <button
              onClick={() => setShowEditGear(false)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Modify the gear items for <strong>{selectedRequest.tripName || 'Gear Request'}</strong> by {selectedRequest.user.name}
            </p>

            {editedItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <select
                  value={item.gearId}
                  onChange={(e) => handleItemChange(index, 'gearId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select gear item...</option>
                  {availableGear.map(gear => (
                    <option key={gear.id} value={gear.id}>
                      {gear.name} {gear.brand ? `- ${gear.brand}` : ''} ({formatCategory(gear.category)})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddItem}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-center text-gray-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Item
            </button>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowEditGear(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGearChanges}
                disabled={isUpdatingGear}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isUpdatingGear ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RequestModal = () => {
    const [reviewNotes, setReviewNotes] = useState(selectedRequest?.adminNotes || '');
    
    if (!selectedRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
            <button
              onClick={() => {setShowModal(false); setSelectedRequest(null);}}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Request Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Trip Name:</span>
                    <p className="text-gray-900">{selectedRequest.tripName || 'Gear Request'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Dates:</span>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Purpose:</span>
                    <p className="text-gray-900 capitalize">{selectedRequest.purpose}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Experience:</span>
                    <p className="text-gray-900 capitalize">{selectedRequest.experience}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Intentions Code:</span>
                    <p className="text-gray-900">{selectedRequest.intentionsCode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Requester Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Name:</span>
                    <p className="text-gray-900">{selectedRequest.user.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{selectedRequest.user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedRequest.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.charAt(0) + selectedRequest.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Submitted:</span>
                    <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedRequest.notes && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trip Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRequest.notes}</p>
              </div>
            )}

            {/* Requested Gear */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requested Gear ({selectedRequest.items.reduce((sum, item) => sum + item.quantity, 0)} items)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {selectedRequest.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.gear.imageUrl ? (
                        <img src={getImageUrl(item.gear.imageUrl)} alt={item.gear.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.gear.name}</p>
                      {item.gear.brand && (
                        <p className="text-xs text-gray-600">{item.gear.brand}</p>
                      )}
                      <p className="text-xs text-gray-500">{formatCategory(item.gear.category)}</p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-blue-600">Qty: {item.quantity}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about the approval/rejection decision..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {/* Edit Gear Button - available for PENDING and APPROVED requests */}
              {['PENDING', 'APPROVED'].includes(selectedRequest.status) && (
                <button
                  onClick={() => {setShowEditGear(true); fetchAvailableGear();}}
                  className="bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Gear
                </button>
              )}

              {selectedRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'APPROVED', reviewNotes)}
                    disabled={isUpdating}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isUpdating ? 'Updating...' : 'Approve Request'}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED', reviewNotes)}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {isUpdating ? 'Updating...' : 'Reject Request'}
                  </button>
                </>
              )}
            </div>

            {selectedRequest.status === 'APPROVED' && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'CHECKED_OUT', reviewNotes)}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Mark as Checked Out'}
                </button>
              </div>
            )}

            {selectedRequest.status === 'CHECKED_OUT' && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => handleStatusUpdate(selectedRequest.id, 'RETURNED', reviewNotes)}
                  disabled={isUpdating}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? 'Updating...' : 'Mark as Returned'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Requests</h2>
        <p className="text-gray-600">Review and manage all gear rental requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search requests, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-6">
        {filteredRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{request.tripName || 'Gear Request'}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  {request.user.name} ({request.user.email})
                </div>
                <div className="flex items-center mt-1 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(request.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Purpose: <span className="font-medium capitalize">{request.purpose}</span></p>
                <p className="text-sm text-gray-600">Experience: <span className="font-medium capitalize">{request.experience}</span></p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Items: <span className="font-medium">{request.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></p>
              </div>
            </div>

            {request.adminNotes && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Review Notes</h4>
                <p className="text-sm text-gray-600">{request.adminNotes}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => {setSelectedRequest(request); setShowModal(true);}}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Request Modal */}
      {showModal && <RequestModal />}

      {/* Edit Gear Modal */}
      {showEditGear && selectedRequest && <EditGearModal />}
    </div>
  );
};

export default AdminRequests;