import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

// Clear cache for Clock error fix

type BlogPost = Tables<'posts'>;

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const dynamicBackgroundStyle = {
    background: `
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15), transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2), transparent 50%),
      linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--background)) 100%)
    `.replace(/\s+/g, ' ').trim()
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
              {post.images && post.images.length > 0 && (
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${post.title} - Image ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg shadow-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div 
                className="text-foreground/80 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
                style={{
                  lineHeight: '1.7',
                }}
              />
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
    </div>
  );
};

export default BlogPost;