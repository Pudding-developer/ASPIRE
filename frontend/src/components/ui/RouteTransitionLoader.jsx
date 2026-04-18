import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTransitionLoader() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 500);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="h-1 bg-white/10 overflow-hidden">
        <div className="route-loading-bar h-full w-1/2 bg-[#bc1313] rounded-full" />
      </div>
    </div>
  );
}