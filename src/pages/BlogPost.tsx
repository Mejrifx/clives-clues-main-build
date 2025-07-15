import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useUnlockBlog } from '@/hooks/useUnlockBlog';
import UnlockAlpha from '@/components/UnlockAlpha';

// Clear cache for Clock error fix

type BlogPost = Tables<'posts'>;

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  
  // Use the unlock hook only if we have an ID
  const { isUnlocked, loading: unlockLoading, unlockBlog } = useUnlockBlog(id || '');

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        setError('No post ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching post:', error);
          setError('Failed to fetch post');
        } else if (!data) {
          setError('Post not found');
        } else {
          setPost(data);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleUnlockClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setGameDialogOpen(true);
  };

  const handleGameComplete = async (score: number) => {
    if (score >= 100) {
      const success = await unlockBlog(score);
      if (success) {
        // Close the game dialog immediately after successful unlock
        setGameDialogOpen(false);
        // The hook will automatically update isUnlocked state
        // and the component will re-render with unlocked content
      } else {
        // If unlock failed, close dialog after delay
        setTimeout(() => {
          setGameDialogOpen(false);
        }, 1000);
      }
    } else {
      // Score too low, close dialog after delay
      setTimeout(() => {
        setGameDialogOpen(false);
      }, 1000);
    }
  };

  const handleGameClose = () => {
    setGameDialogOpen(false);
  };

  const dynamicBackgroundStyle = {
    background: '#8ad1ed'
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full pb-8 fixed inset-0 overflow-auto flex items-center justify-center" style={dynamicBackgroundStyle}>
        <Card className="glass-card border-0 p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen w-full pb-8 fixed inset-0 overflow-auto flex items-center justify-center" style={dynamicBackgroundStyle}>
        <Card className="glass-card border-0 p-8 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || 'Post Not Found'}
          </h1>
          <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full pb-8 fixed inset-0 overflow-auto" style={dynamicBackgroundStyle}>
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-8 text-foreground hover:bg-secondary/50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>

        {/* Article */}
        <article>
          <Card className="glass-card border-0">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl md:text-4xl font-bold text-black leading-tight relative group overflow-hidden cursor-pointer">
                <span className="relative z-10 transition-all duration-300">
                  {post.title}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </CardTitle>
              <div className="flex items-center gap-6 text-muted-foreground mt-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'No date'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{post.is_ai_generated ? 'Clive' : 'Admin'}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              {/* Always show first image */}
              {post.images && post.images.length > 0 && (
                <div className="mb-8">
                  <img
                    src={post.images[0]}
                    alt={`${post.title} - Preview`}
                    className="w-full max-w-md mx-auto h-64 object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}

              {/* Always show summary */}
              <div className="text-foreground/80 leading-relaxed mb-6 text-lg">
                {post.summary}
              </div>

              {/* Content gating based on unlock status */}
              {unlockLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ) : !user ? (
                // Not authenticated
                <Card className="glass-card border-orange-200 bg-orange-50/50 p-6 text-center">
                  <div className="space-y-4">
                    <Lock className="h-12 w-12 mx-auto text-orange-600" />
                    <div>
                      <p className="text-lg text-center text-black/70 mb-6">
                        Full Content Locked
                      </p>
                      <p className="text-base text-center text-black/60 mb-8">
                        Complete the challenge to unlock this content
                      </p>
                      <Button 
                        onClick={() => navigate('/login')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
                      >
                        Sign In to Unlock
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : !isUnlocked ? (
                // Authenticated but not unlocked
                <Card className="glass-card border-orange-200 bg-orange-50/50 p-6 text-center">
                  <div className="space-y-4">
                    <Lock className="h-12 w-12 mx-auto text-orange-600" />
                    <div>
                      <h3 className="text-xl font-bold text-orange-700 mb-2">
                        Ready for the Challenge?
                      </h3>
                      <p className="text-orange-600">
                        Complete the Unlock Alpha mini-game to access the full content!
                      </p>
                    </div>
                    <Button 
                      onClick={handleUnlockClick}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-3 text-lg"
                    >
                      Unlock Alpha
                    <Lock className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                // Unlocked - show full content
                <div className="space-y-6">
                  <Card className="glass-card border-green-200 bg-green-50/50 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <Unlock className="h-5 w-5" />
                      <span className="font-medium">Content Unlocked! Enjoy the full article.</span>
                    </div>
                  </Card>

                  {/* Show all images if unlocked */}
                  {post.images && post.images.length > 1 && (
                    <div className="mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {post.images.slice(1).map((imageUrl, index) => (
                          <img
                            key={index + 1}
                            src={imageUrl}
                            alt={`${post.title} - Image ${index + 2}`}
                            className="w-full h-64 object-cover rounded-lg shadow-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full content */}
                  <div 
                    className="text-foreground/80 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content || '' }}
                    style={{
                      lineHeight: '1.7',
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </article>

        {/* Navigation */}
        <div className="mt-12 flex justify-between">
          <Button 
            onClick={() => navigate('/')} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      {/* Unlock Alpha Game Dialog */}
      {post && (
        <UnlockAlpha
          isOpen={gameDialogOpen}
          onClose={handleGameClose}
          onComplete={handleGameComplete}
          blogTitle={post.title || 'Blog Post'}
          blogId={post.id}
        />
      )}
    </div>
  );
};

export default BlogPost;