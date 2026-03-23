import { useState } from 'react';
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

export default function LandingPage() {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0a0101] text-white overflow-x-hidden font-sans scroll-smooth">
      <Navbar scrollToSection={scrollToSection} onLogin={handleLogin} />
      <HeroSection scrollToSection={scrollToSection} onGetStarted={handleGetStarted} />
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
    </div>
  );
}