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

      // Admin account has access to all blogs automatically
      if (user.email === 'cliveonabs@outlook.com') {
        setIsUnlocked(true);
        setLoading(false);
        return;
      }

      try {
        // Direct database query instead of RPC
        const { data, error } = await supabase
          .from('unlocked_blogs')
          .select('id')
          .eq('user_id', user.id)
          .eq('blog_id', blogId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
          console.error('Error checking unlock status:', error);
          setIsUnlocked(false);
        } else {
          setIsUnlocked(!!data); // Convert to boolean
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

    // Admin account already has all blogs unlocked
    if (user.email === 'cliveonabs@outlook.com') {
      toast({
        title: "Admin Access",
        description: "Admin account has automatic access to all content.",
      });
      return true;
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
      // Direct database insert instead of RPC
      const { data, error } = await supabase
        .from('unlocked_blogs')
        .insert({
          user_id: user.id,
          blog_id: blogId,
          game_score: score,
          unlocked_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate entry (user already unlocked this blog)
        if (error.code === '23505') {
          // Duplicate entry - user already unlocked this blog
          setIsUnlocked(true);
          toast({
            title: "🎉 Blog Already Unlocked!",
            description: "You've already unlocked this blog content.",
          });
          return true;
        } else {
          console.error('Error unlocking blog:', error);
          toast({
            title: "Unlock Failed",
            description: "Failed to unlock the blog. Please try again.",
            variant: "destructive",
          });
          return false;
        }
      }

      if (data) {
        // Force update the state and ensure component re-renders
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