import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

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

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const mainContentRef = useRef(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSelectRoleModalOpen, setIsSelectRoleModalOpen] = useState(false);
  const [roleSelectionToken, setRoleSelectionToken] = useState(null);

  useEffect(() => {
    if (location.state?.showRoleSelection && location.state?.token) {
      setRoleSelectionToken(location.state.token);
      sessionStorage.setItem('aspire_role_selection_token', location.state.token);
      setIsSelectRoleModalOpen(true);
      navigate('/', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => setIsRegisterModalOpen(true);
  const handleLogin = () => setIsLoginModalOpen(true);

  useGSAP(() => {
    // True Curtain Reveal:
    // The main content section is pinned/parallaxed to "lift" like a curtain
    // while the footer is revealed from underneath.
    gsap.to(mainContentRef.current, {
      y: -100, // Parallax lift
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: "bottom bottom",
        end: "bottom top",
        scrub: true,
      }
    });
  }, { scope: mainContentRef });

  return (
    <div className="min-h-screen bg-white text-[#430202] overflow-x-hidden font-sans scroll-smooth">

      {/* Main Content "Curtain" Layer */}
      <div ref={mainContentRef} className="relative z-10 bg-white mb-[600px]">
        <Navbar scrollToSection={scrollToSection} onLogin={handleLogin} />
        <HeroSection scrollToSection={scrollToSection} onGetStarted={handleGetStarted} />

        <div className="-mt-48 relative z-10">
          <DashboardPreview />
        </div>
        <StatsStrip />
        <FeaturesSection />

        <HowItWorksSection />

        <FaqSection />
      </div>

      {/* Fixed Footer "Underneath" the Curtain */}
      <div className="fixed bottom-0 left-0 w-full h-[600px] z-0">
        <Footer onGetStarted={handleGetStarted} />
      </div>

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