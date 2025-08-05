import { useState, useEffect } from 'react';
import api from '../lib/axios';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalGear: 0,
    availableGear: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const gearResponse = await api.get('/gear');
      const gear = gearResponse.data;
      
      setStats({
        totalGear: gear.length,
        availableGear: gear.filter((item: any) => item.isAvailable).length,
        pendingRequests: 0 // TODO: Implement requests endpoint
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Gear</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalGear}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Now</h3>
          <p className="text-3xl font-bold text-green-600">{stats.availableGear}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingRequests}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-500">No recent activity to display.</p>
      </div>
    </div>
  );
};

export default AdminPanel;