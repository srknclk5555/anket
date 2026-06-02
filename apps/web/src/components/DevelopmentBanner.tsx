import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function DevelopmentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('developmentBannerDismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('developmentBannerDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-[#F59E0B] text-[#1a1a1a] px-4 py-2 text-sm font-medium flex items-center justify-between sticky top-0 z-[100]">
      <div className="flex items-center gap-2">
        <span>🚧</span>
        <span>Site geliştirme aşamasındadır . Deneyiminizi iyileştirmek için çalışmalarımız devam etmektedir.</span>
      </div>
      <button 
        onClick={handleDismiss}
        className="hover:bg-black/10 p-1 rounded-full transition-colors"
        aria-label="Kapat"
      >
        <X size={16} />
      </button>
    </div>
  );
}
