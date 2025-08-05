import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import GearCatalog from '../components/GearCatalog';
import MyRequests from '../components/MyRequests';
import AdminPanel from '../components/AdminPanel';
import UserManagement from '../components/UserManagement';
import UserApprovals from '../components/UserApprovals';
import RentalCalendar from '../components/RentalCalendar';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('catalog');
  const { isAdmin } = useAuth();

  const renderCurrentView = () => {
    switch (currentView) {
      case 'catalog':
        return <GearCatalog />;
      case 'requests':
        return <MyRequests />;
      case 'calendar':
        return isAdmin ? <RentalCalendar /> : <GearCatalog />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <GearCatalog />;
      case 'users':
        return isAdmin ? <UserManagement /> : <GearCatalog />;
      case 'approvals':
        return isAdmin ? <UserApprovals /> : <GearCatalog />;
      default:
        return <GearCatalog />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  );
};

export default Dashboard;