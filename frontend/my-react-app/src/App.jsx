import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KYCPage from './pages/KYCPage';
import ApplyLoanPage from './pages/ApplyLoanPage';
import LoanDetailPage from './pages/LoanDetailPage';
import LoansPage from './pages/LoansPage';
import ROSCAPage from './pages/ROSCAPage';
import ChatbotPage from './pages/ChatbotPage';
import ProfilePage from './pages/ProfilePage';
import VendorPage from './pages/VendorPage';
import TransactionsPage from './pages/TransactionsPage';

// Route guard for authenticated actions
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Route guard for public actions (prevents seeing login once logged in)
const PublicRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <BrowserRouter>
      {/* Dynamic Toast Notifications */}
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            fontWeight: '600',
            fontSize: '0.875rem',
            borderRadius: '1rem',
            border: '1px solid #f3f4f6',
            boxShadow: '0 10px 15px -3px rgba(22, 101, 52, 0.05)'
          }
        }} 
      />

      <Routes>
        {/* Public authentication route */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Private core farming dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming KYC */}
        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <KYCPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming loan application */}
        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <ApplyLoanPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming loan details */}
        <Route
          path="/loans/:id"
          element={
            <ProtectedRoute>
              <LoanDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming loans index directory */}
        <Route
          path="/loans"
          element={
            <ProtectedRoute>
              <LoansPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming ROSCA / Chit Fund */}
        <Route
          path="/rosca"
          element={
            <ProtectedRoute>
              <ROSCAPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming Chatbot / Saathi AI Assistant */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming My Profile Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming Vendor Finance Page */}
        <Route
          path="/vendors"
          element={
            <ProtectedRoute>
              <VendorPage />
            </ProtectedRoute>
          }
        />

        {/* Private core farming Transactions Page */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback routes redirect straight to session dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
