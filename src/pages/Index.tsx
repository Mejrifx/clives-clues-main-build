import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import BlogCard from '@/components/BlogCard';
import UnlockAlpha from '@/components/UnlockAlpha';

// Force rebuild to clear blogPosts cache

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    email: '',
    website: ''
  });
  const [gameDialogOpen, setGameDialogOpen] = useState(false);
  const [selectedBlogForUnlock, setSelectedBlogForUnlock] = useState<any>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching posts:', error);
        } else {
          setPosts(data || []);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic will be added later
    console.log('Form submitted:', formData);
  };

  const handleUnlockClick = (post: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedBlogForUnlock(post);
    setGameDialogOpen(true);
  };

  const handleGameComplete = async (score: number) => {
    if (selectedBlogForUnlock && score >= 100) {
      // Game completed successfully - close dialog and navigate to blog
      setGameDialogOpen(false);
      setSelectedBlogForUnlock(null);
      // Navigate to the blog post (it will show unlocked content)
      navigate(`/blog/${selectedBlogForUnlock.id}`);
    } else {
      // Score too low - close dialog after delay
      setTimeout(() => {
        setGameDialogOpen(false);
        setSelectedBlogForUnlock(null);
      }, 1000);
    }
  };

  const handleGameClose = () => {
    setGameDialogOpen(false);
    setSelectedBlogForUnlock(null);
  };

  const dynamicBackgroundStyle = {
    background: '#8ad1ed'
  };

  return (
    <div className="w-full pb-8 overflow-x-hidden" style={{ background: '#8ad1ed', minHeight: '100vh', height: 'auto' }}>
      {/* Header Section */}
      <header className="container mx-auto px-4 py-16 pt-24 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-center mb-6">
            <img 
              src="/clive-blog-logo.png" 
              alt="Curious Clive Logo" 
              className="h-32 md:h-40 w-auto object-contain"
            />
          </div>
          <p className="text-xl md:text-2xl text-foreground/80 font-medium">
            Decoding The Abstract Chain | One post at a time
          </p>
        </div>
      </header>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card border-0 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer mb-8 px-8 py-4 relative group overflow-hidden rounded-full inline-block">
            <h2 className="text-3xl md:text-4xl font-black mb-0 bg-gradient-to-r from-primary to-primary-blue bg-clip-text text-transparent whitespace-nowrap">
              About Curious Clive
            </h2>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out rounded-full"></div>
          </div>
          <Card className="glass-card border-0 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
            <CardContent className="p-8 md:p-12 relative z-10">
              <div className="prose prose-lg max-w-none text-center">
                <p className="text-lg md:text-xl leading-relaxed text-black mb-6">
                  AM CLIVE! This is my digital blog built to decode the chaos of the Abstract Chain. I filter the noise, analyse CT, and deliver raw, insightful breakdowns on what's happening across the Chain.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-black">
                  Whether you're a seasoned trencher or a curious reader, I've got clues you don't want to miss, always remember am Curious Clive...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Blog Posts Section */}
      <section id="blogs" className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:gap-12">
          {loading ? (
            <div className="text-center text-foreground/70">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-foreground/70">No posts found.</div>
          ) : (
            posts.map((post) => (
              <BlogCard 
                key={post.id} 
                post={post} 
                onUnlockClick={handleUnlockClick}
              />
            ))
          )}
        </div>
      </section>

      {/* Submission Form Section */}
      <section id="submit" className="container mx-auto px-4 py-16">
        <Card className="glass-card border-0 max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Submit Your Project
            </CardTitle>
            <CardDescription className="text-lg text-foreground/70">
              Share your Abstract Chain project with the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="projectName" className="text-base font-medium text-foreground">
                  Project Name
                </Label>
                <Input
                  id="projectName"
                  name="projectName"
                  type="text"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="glass-card border-border/50 bg-secondary/50 mt-2"
                  placeholder="Enter your project name"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium text-foreground">
                  Project Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="glass-card border-border/50 bg-secondary/50 mt-2 min-h-32"
                  placeholder="Describe your project and its features"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-medium text-foreground">
                  Contact Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="glass-card border-border/50 bg-secondary/50 mt-2"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="website" className="text-base font-medium text-foreground">
                  Website or Twitter
                </Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="glass-card border-border/50 bg-secondary/50 mt-2"
                  placeholder="https://yourproject.com or https://twitter.com/yourhandle"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 text-lg"
              >
                Submit Project
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center">
        <p className="text-foreground/60">
          © 2025{' '}
          <Link 
            to="/admin" 
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Clive's Clues
          </Link>
          . Exploring Abstract Chain together.
        </p>
      </footer>

      {/* Unlock Alpha Game Dialog */}
      {selectedBlogForUnlock && (
        <UnlockAlpha
          isOpen={gameDialogOpen}
          onClose={handleGameClose}
          onComplete={handleGameComplete}
          blogTitle={selectedBlogForUnlock.title}
          blogId={selectedBlogForUnlock.id}
        />
      )}
    </div>
  );
};

export default Index;
