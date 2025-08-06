import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import GearCatalog from '../components/GearCatalog';
import MyRequests from '../components/MyRequests';
import AdminPanel from '../components/AdminPanel';
import AdminRequests from '../components/AdminRequests';
import UserManagement from '../components/UserManagement';
import UserApprovals from '../components/UserApprovals';
import RentalCalendar from '../components/RentalCalendar';
import RentalList from '../components/RentalList';
import Cart from '../components/Cart';
import api from '../lib/axios';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('catalog');
  const [cart, setCart] = useState<string[]>([]);
  const { isAdmin } = useAuth();

  const handleCheckout = async (requestData: any) => {
    try {
      const response = await api.post('/requests', requestData);
      alert('Request submitted successfully! You will be notified when it\'s approved.');
      setCart([]);
      setCurrentView('requests');
    } catch (error: any) {
      console.error('Error submitting request:', error);
      alert(error.response?.data?.error || 'Failed to submit request');
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'catalog':
        return <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      case 'cart':
        return <Cart cart={cart} onUpdateCart={setCart} onCheckout={handleCheckout} />;
      case 'requests':
        return <MyRequests />;
      case 'calendar':
        return isAdmin ? <RentalCalendar /> : <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      case 'admin':
        return isAdmin ? <AdminPanel /> : <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      case 'admin-requests':
        return isAdmin ? <AdminRequests /> : <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      case 'users':
        return isAdmin ? <UserManagement /> : <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      case 'approvals':
        return isAdmin ? <UserApprovals /> : <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      case 'rental-list':
        return isAdmin ? <RentalList /> : <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
      default:
        return <GearCatalog cart={cart} onUpdateCart={setCart} onNavigateToCart={() => setCurrentView('cart')} />;
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
      {renderCurrentView()}
    </Layout>
  );
};

export default Dashboard;