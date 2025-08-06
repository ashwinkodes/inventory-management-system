import { useState, useEffect } from 'react';
import { Search, Calendar, Package, User, Filter } from 'lucide-react';
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

interface Rental {
  id: string;
  startDate: string;
  endDate: string;
  tripName?: string;
  purpose?: string;
  status: 'APPROVED' | 'CHECKED_OUT' | 'RETURNED';
  createdAt: string;
  approvedAt?: string;
  user: RequestUser;
  items: RequestItem[];
}

const RentalList = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  useEffect(() => {
    fetchRentals();
  }, []);

  useEffect(() => {
    filterRentals();
  }, [rentals, searchTerm, statusFilter, startDateFilter, endDateFilter]);

  const fetchRentals = async () => {
    try {
      const response = await api.get('/requests/all');
      const allRequests = response.data;
      
      // Filter to only show approved, checked out, or returned rentals
      const approvedRentals = allRequests.filter((request: Rental) => 
        ['APPROVED', 'CHECKED_OUT', 'RETURNED'].includes(request.status)
      );
      
      setRentals(approvedRentals);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterRentals = () => {
    let filtered = rentals;

    // Filter by search term (name or trip name)
    if (searchTerm) {
      filtered = filtered.filter(rental =>
        rental.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.tripName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.items.some(item => 
          item.gear.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rental => rental.status === statusFilter);
    }

    // Filter by date range
    if (startDateFilter) {
      filtered = filtered.filter(rental => 
        new Date(rental.startDate) >= new Date(startDateFilter)
      );
    }

    if (endDateFilter) {
      filtered = filtered.filter(rental => 
        new Date(rental.endDate) <= new Date(endDateFilter)
      );
    }

    setFilteredRentals(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'CHECKED_OUT':
        return 'bg-green-100 text-green-800';
      case 'RETURNED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rental List</h2>
        <p className="text-gray-600">View and manage all approved gear rentals</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, trip, or gear..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="CHECKED_OUT">Checked Out</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="date"
              placeholder="Start date from..."
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="date"
              placeholder="End date to..."
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== 'all' || startDateFilter || endDateFilter) && (
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredRentals.length} of {rentals.length} rentals
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setStartDateFilter('');
                setEndDateFilter('');
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredRentals.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No rentals found</h3>
          <p className="mt-2 text-gray-600">
            {searchTerm || statusFilter !== 'all' || startDateFilter || endDateFilter
              ? 'Try adjusting your filters'
              : 'No approved rentals yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRentals.map((rental) => (
            <div key={rental.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {rental.tripName || 'Gear Rental'}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <User className="w-4 h-4 mr-1" />
                    {rental.user.name} ({rental.user.email})
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(rental.startDate).toLocaleDateString()} - {new Date(rental.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(rental.status)}`}>
                    {rental.status.charAt(0) + rental.status.slice(1).toLowerCase()}
                  </span>
                  <p className="text-xs text-gray-500">
                    Approved: {rental.approvedAt ? new Date(rental.approvedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Purpose and details */}
              {rental.purpose && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Purpose: </span>
                  <span className="text-sm text-gray-600 capitalize">{rental.purpose}</span>
                </div>
              )}

              {/* Gear Items */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Gear Items ({rental.items.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {rental.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.gear.imageUrl ? (
                          <img 
                            src={getImageUrl(item.gear.imageUrl)} 
                            alt={item.gear.name} 
                            className="w-full h-full object-cover rounded-lg" 
                          />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.gear.name}</p>
                        {item.gear.brand && (
                          <p className="text-xs text-gray-600">{item.gear.brand}</p>
                        )}
                        <p className="text-xs text-gray-500">{formatCategory(item.gear.category)}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentalList;