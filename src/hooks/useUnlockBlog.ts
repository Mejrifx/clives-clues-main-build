import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Type definition for unlock_blog function response
interface UnlockBlogResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Check if user is on desktop (non-mobile device)
const isDesktop = () => {
  return window.innerWidth >= 768 && !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
};

// Force rebuild: Updated 2025-01-19 with corrected function parameters
export const useUnlockBlog = (blogId: string, onDesktopUnlock?: (blogId: string, blogTitle: string) => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  // Check if blog is unlocked
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!user || !blogId || blogId === 'skip') {
        setLoading(false);
        return;
      }

      // Admin account has access to all blogs automatically
      if (user.email === 'cliveonabs@outlook.com') {
        setIsUnlocked(true);
        setLoading(false);
        return;
      }

      // Validate UUID format before making the call
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(blogId)) {
        console.log('Invalid UUID format for blogId:', blogId);
        setLoading(false);
        return;
      }

      try {
        // Use the database function for proper UUID handling
        const { data, error } = await supabase
          .rpc('has_unlocked_blog', {
            target_blog_id: blogId
          });

        if (error) {
          console.error('Error checking unlock status:', error);
          console.error('BlogId being checked:', blogId);
          console.error('User ID:', user?.id);
          setIsUnlocked(false);
        } else {
          setIsUnlocked(!!data); // Convert to boolean
        }
      } catch (error) {
        console.error('Error checking unlock status:', error);
        console.error('BlogId that caused error:', blogId);
        setIsUnlocked(false);
      } finally {
        setLoading(false);
      }
    };

    checkUnlockStatus();
  }, [user, blogId]);

  // Unlock a blog with score
  const unlockBlog = async (score: number, blogTitle?: string): Promise<boolean> => {
    if (!user || !blogId || blogId === 'skip') {
      toast({
        title: "Authentication Required",
        description: "Please sign in to unlock blog content.",
        variant: "destructive",
      });
      return false;
    }

    // Admin account already has all blogs unlocked
    if (user.email === 'cliveonabs@outlook.com') {
      toast({
        title: "Admin Access",
        description: "Admin account has automatic access to all content.",
      });
      return true;
    }

    // Validate UUID format before making the call
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(blogId)) {
      console.error('Invalid UUID format for blogId in unlock:', blogId);
      toast({
        title: "Invalid Blog ID",
        description: "Unable to unlock - invalid blog identifier.",
        variant: "destructive",
      });
      return false;
    }

    if (score < 100) {
      toast({
        title: "Score Too Low",
        description: "You need at least 100 points to unlock this content!",
        variant: "destructive",
      });
      return false;
    }

    setUnlocking(true);

    try {
      console.log('🔐 Authentication check:');
      console.log('User object:', user);
      console.log('User ID:', user?.id);
      console.log('User email:', user?.email);
      console.log('User authenticated:', !!user);
      
      // Check Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔑 Supabase session check:');
      console.log('Session exists:', !!session);
      console.log('Session user ID:', session?.user?.id);
      console.log('Session access token exists:', !!session?.access_token);
      console.log('Session error:', sessionError);
      
      // Use the database function for proper UUID handling
      const { data, error } = await supabase
        .rpc('unlock_blog', {
          target_blog_id: blogId,
          game_score: score
        });

      if (error) {
        console.error('Error unlocking blog:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        console.error('BlogId being unlocked:', blogId);
        console.error('Score:', score);
        
        let errorMessage = "Failed to unlock the blog. Please try again.";
        if (error.message?.includes('does not exist')) {
          errorMessage = "This blog post no longer exists.";
        } else if (error.message?.includes('must be authenticated')) {
          errorMessage = "Please sign in to unlock blog content.";
        }
        
        toast({
          title: "Unlock Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }

      // Handle the JSON response from the new function
      console.log('🎯 Function response data:', data);
      
      const response = data as unknown as UnlockBlogResponse;
      
      if (response && response.success === false) {
        console.error('Function returned error:', response.error);
        toast({
          title: "Unlock Failed",
          description: response.error || "Unknown error occurred",
          variant: "destructive",
        });
        return false;
      }

      if (response && response.success === true) {
        // Force update the state and ensure component re-renders
        setIsUnlocked(true);
        
        // Check if we're on desktop and have a custom popup callback
        if (isDesktop() && onDesktopUnlock && blogTitle) {
          // Use custom desktop popup instead of toast
          onDesktopUnlock(blogId, blogTitle);
        } else {
          // Use toast for mobile or when no custom popup is available
          toast({
            title: "🎉 Blog Unlocked!",
            description: response.message || `Congratulations! You scored ${score} points and unlocked the full content.`,
          });
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unlocking blog:', error);
      console.error('BlogId that caused unlock error:', blogId);
      toast({
        title: "Unlock Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setUnlocking(false);
    }
  };

  return {
    isUnlocked,
    loading,
    unlocking,
    unlockBlog,
    isAuthenticated: !!user
  };
}; 