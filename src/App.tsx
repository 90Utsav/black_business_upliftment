import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import { mockAuthService } from './auth/mockAuthService';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BotanicalDecor from './components/BotanicalDecor';
import RequireAuth from './components/auth/RequireAuth';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider service={mockAuthService}>
        <div className={styles.page}>
          <BotanicalDecor />
          <Navbar />
          <main className={styles.main}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
