import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, User } from 'lucide-react';
import api from '../lib/axios';

interface RentalEvent {
  id: string;
  gearName: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  status: string;
  gearCategory: string;
}

const RentalCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rentals, setRentals] = useState<RentalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchRentals();
  }, [currentDate]);

  const fetchRentals = async () => {
    try {
      // For now, we'll create mock data since the requests endpoint is not fully implemented
      // In a real implementation, this would fetch from /api/requests
      const mockRentals: RentalEvent[] = [
        {
          id: '1',
          gearName: 'North Face Backpack 65L',
          userName: 'John Smith',
          userEmail: 'john@example.com',
          startDate: '2025-08-10',
          endDate: '2025-08-15',
          status: 'APPROVED',
          gearCategory: 'BACKPACK'
        },
        {
          id: '2',
          gearName: 'MSR Tent 2-Person',
          userName: 'Sarah Wilson',
          userEmail: 'sarah@example.com',
          startDate: '2025-08-12',
          endDate: '2025-08-18',
          status: 'APPROVED',
          gearCategory: 'TENT'
        },
        {
          id: '3',
          gearName: 'Sleeping Bag -10°C',
          userName: 'Mike Johnson',
          userEmail: 'mike@example.com',
          startDate: '2025-08-06',
          endDate: '2025-08-09',
          status: 'CHECKED_OUT',
          gearCategory: 'SLEEPING_BAG'
        }
      ];
      setRentals(mockRentals);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateInRange = (date: Date, startDate: string, endDate: string) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    return checkDate >= start && checkDate <= end;
  };

  const getRentalsForDate = (date: Date) => {
    return rentals.filter(rental => 
      isDateInRange(date, rental.startDate, rental.endDate)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'CHECKED_OUT': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'RETURNED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (direction === 'prev') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      } else {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      }
    });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayRentals = getRentalsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            isToday ? 'bg-blue-50 border-blue-300' : ''
          } ${isSelected ? 'bg-blue-100 border-blue-400' : ''}`}
        >
          <div className={`font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
            {day}
          </div>
          <div className="mt-1 space-y-1">
            {dayRentals.slice(0, 2).map((rental, index) => (
              <div
                key={`${rental.id}-${index}`}
                className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(rental.status)}`}
                title={`${rental.gearName} - ${rental.userName}`}
              >
                {rental.gearName}
              </div>
            ))}
            {dayRentals.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayRentals.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rental Calendar</h2>
        <p className="text-gray-600">Track gear rentals and availability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-8 flex items-center justify-center font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0">
                {renderCalendarDays()}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold mb-3">Status Legend</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-blue-100 mr-2"></div>
                <span>Approved</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-green-100 mr-2"></div>
                <span>Checked Out</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-red-100 mr-2"></div>
                <span>Overdue</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-gray-100 mr-2"></div>
                <span>Returned</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {formatDate(selectedDate)}
              </h4>
              
              {getRentalsForDate(selectedDate).length > 0 ? (
                <div className="space-y-3">
                  {getRentalsForDate(selectedDate).map(rental => (
                    <div key={rental.id} className="border-l-4 border-blue-400 pl-3">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <Package className="w-4 h-4 mr-1" />
                        {rental.gearName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-1" />
                        {rental.userName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {rental.startDate} to {rental.endDate}
                      </div>
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getStatusColor(rental.status)}`}>
                        {rental.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No rentals scheduled for this date.</p>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold mb-3">Quick Stats</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Active Rentals:</span>
                <span className="font-medium">{rentals.filter(r => r.status === 'CHECKED_OUT').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved:</span>
                <span className="font-medium">{rentals.filter(r => r.status === 'APPROVED').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total This Month:</span>
                <span className="font-medium">{rentals.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalCalendar;