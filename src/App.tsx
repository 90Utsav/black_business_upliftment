import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthProvider from './auth/AuthProvider';
import { mockAuthService } from './auth/mockAuthService';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import BotanicalDecor from './components/BotanicalDecor';
import RequireAuth from './components/auth/RequireAuth';
import Home from './pages/Home';
import Grants from './pages/Grants';
import Stories from './pages/Stories';
import Demo from './pages/Demo';
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
            <PageTransition>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/grants" element={<Grants />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route element={<RequireAuth />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageTransition>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
