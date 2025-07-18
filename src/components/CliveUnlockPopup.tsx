import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CliveUnlockPopupProps {
  isOpen: boolean;
  onClose: () => void;
  blogId: string;
  blogTitle: string;
}

const CliveUnlockPopup = ({ isOpen, onClose, blogId, blogTitle }: CliveUnlockPopupProps) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleViewBlog = () => {
    navigate(`/blog/${blogId}`);
    onClose();
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Popup */}
      <Card className={`relative glass-card border-0 max-w-md w-full mx-auto transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        <CardContent className="p-0">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-1 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Clive Image */}
          <div className="relative overflow-hidden rounded-t-xl">
            <img
              src="/curious-clive-pose.png"
              alt="Curious Clive"
              className="w-full h-48 object-cover"
            />
            {/* Success indicator overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-600/90 text-white px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Unlocked!</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center space-y-4">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                🎉 Alpha Unlocked!
              </h3>
              <p className="text-foreground/70 text-sm">
                Congratulations! You've successfully unlocked:
              </p>
              <p className="text-foreground font-medium mt-2 text-sm leading-tight">
                "{blogTitle}"
              </p>
            </div>

            <Button
              onClick={handleViewBlog}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3"
            >
              View Blog
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CliveUnlockPopup; 