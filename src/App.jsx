import { Routes, Route } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Accounts from './pages/Accounts';
import Payments from './pages/Payments';
import Cards from './pages/Cards';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Login />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/cards" element={<Cards />} />
      </Routes>
    </Layout>
  );
}
