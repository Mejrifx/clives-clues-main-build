import { useEffect, useState } from "react";
export const NewsTicker = () => {
  const [isVisible, setIsVisible] = useState(true);
  useEffect(() => {
    // Add padding to body to account for the ticker
    document.body.style.paddingBottom = '60px';
    return () => {
      // Clean up when component unmounts
      document.body.style.paddingBottom = '';
    };
  }, []);
  return <div className="fixed bottom-0 left-0 right-0 z-50 h-15 bg-foreground text-background overflow-hidden border-t border-border/20">
      
    </div>;
};