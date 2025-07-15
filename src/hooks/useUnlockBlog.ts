import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useUnlockBlog = (blogId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  // Check if blog is unlocked
  useEffect(() => {
    const checkUnlockStatus = async () => {
      if (!user || !blogId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_unlocked_blog', {
          blog_id: blogId
        });

        if (error) {
          console.error('Error checking unlock status:', error);
          setIsUnlocked(false);
        } else {
          setIsUnlocked(data || false);
        }
      } catch (error) {
        console.error('Error checking unlock status:', error);
        setIsUnlocked(false);
      } finally {
        setLoading(false);
      }
    };

    checkUnlockStatus();
  }, [user, blogId]);

  // Unlock a blog with score
  const unlockBlog = async (score: number): Promise<boolean> => {
    if (!user || !blogId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to unlock blog content.",
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
      const { data, error } = await supabase.rpc('unlock_blog', {
        blog_id: blogId,
        score: score
      });

      if (error) {
        console.error('Error unlocking blog:', error);
        toast({
          title: "Unlock Failed",
          description: "Failed to unlock the blog. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (data) {
        setIsUnlocked(true);
        toast({
          title: "🎉 Blog Unlocked!",
          description: `Congratulations! You scored ${score} points and unlocked the full content.`,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unlocking blog:', error);
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