import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../features/landing/components/Navbar';
import HeroSection from '../../features/landing/components/HeroSection';
import DashboardPreview from '../../features/landing/components/DashboardPreview';
import StatsStrip from '../../features/landing/components/StatsStrip';
import FeaturesSection from '../../features/landing/components/FeaturesSection';
import HowItWorksSection from '../../features/landing/components/HowItWorksSection';
import FaqSection from '../../features/landing/components/FaqSection';
import Footer from '../../features/landing/components/Footer';
import RegisterModal from '../../features/auth/components/RegisterModal';
import LoginModal from '../../features/auth/components/LoginModal';
import SelectRoleModal from '../../features/auth/components/SelectRoleModal';

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSelectRoleModalOpen, setIsSelectRoleModalOpen] = useState(false);
  const [roleSelectionToken, setRoleSelectionToken] = useState(null);

  useEffect(() => {
    if (location.state?.showRoleSelection && location.state?.token) {
      setRoleSelectionToken(location.state.token);
      setIsSelectRoleModalOpen(true);
      // Clear the state so it doesn't reopen on refresh
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    setIsRegisterModalOpen(true);
  };

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#430202] overflow-x-hidden font-sans scroll-smooth">
      <Navbar scrollToSection={scrollToSection} onLogin={handleLogin} />
      <HeroSection scrollToSection={scrollToSection} onGetStarted={handleGetStarted} />
      
      {/* Circular Gradient Orb Between Sections */}
      <div className="relative w-full h-0 z-0 flex justify-center pointer-events-none">
        <div className="absolute top-0 w-[800px] h-[800px] -translate-y-1/2 bg-gradient-to-tr from-[#430202] to-[#bc1313] rounded-full blur-[150px] opacity-20" />
      </div>

      <DashboardPreview />
      <StatsStrip />
      <FeaturesSection />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#bc1313] to-transparent my-12 opacity-50"></div>
      </div>
      
      <HowItWorksSection />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#bc1313] to-transparent my-12 opacity-50"></div>
      </div>
      
      <FaqSection />
      <Footer onGetStarted={handleGetStarted} />

      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <SelectRoleModal
        isOpen={isSelectRoleModalOpen}
        onClose={() => setIsSelectRoleModalOpen(false)}
        token={roleSelectionToken}
      />
    </div>
  );
}