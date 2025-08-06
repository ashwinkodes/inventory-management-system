import { useState, useEffect } from 'react';
import { Calendar, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

interface Request {
  id: string;
  startDate: string;
  endDate: string;
  tripName?: string;
  intentionsCode?: string;
  purpose?: string;
  experience?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_OUT' | 'RETURNED' | 'CANCELLED';
  createdAt: string;
  items: RequestItem[];
  reviewNotes?: string;
}

const MyRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
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
      default: return <AlertCircle className="w-5 h-5 text-gray-600" />;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Requests</h2>
      
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-center py-8">No requests yet. Start by browsing the gear catalog!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{request.tripName || 'Gear Request'}</h3>
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
                  <p className="text-sm text-gray-600">Purpose: <span className="font-medium">{request.purpose}</span></p>
                  <p className="text-sm text-gray-600">Experience: <span className="font-medium">{request.experience}</span></p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted: {new Date(request.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Items: <span className="font-medium">{request.items.reduce((sum, item) => sum + item.quantity, 0)} items</span></p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Requested Gear</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {request.items.map((item) => (
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

              {request.reviewNotes && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Review Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{request.reviewNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRequests;