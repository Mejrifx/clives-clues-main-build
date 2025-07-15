import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Force rebuild to clear blogPosts cache

const Index = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    email: '',
    website: ''
  });

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

  const dynamicBackgroundStyle = {
    background: `linear-gradient(180deg, 
      hsl(203, 73%, ${74 - Math.min(scrollY * 0.01, 15)}%) 0%, 
      hsl(203, 73%, ${50 - Math.min(scrollY * 0.02, 20)}%) 100%)`
  };

  return (
    <div className="min-h-screen w-full pb-8 fixed inset-0 overflow-auto" style={dynamicBackgroundStyle}>
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
            Decoding Abstract Chain, one post at a time
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
                  This is my digital blog built to decode the chaos of the Abstract Chain. We filter the noise, analyse CT, and deliver raw, insightful breakdowns on what's happening across the Abstract Chain.
                </p>
                <p className="text-lg md:text-xl leading-relaxed text-black">
                  Whether you're a seasoned trencher or a curious reader, I've got clues you don't want to miss, remember i'm Curious Clive...
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
              <Card key={post.id} className="glass-card border-0 transition-all duration-300 hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-black relative group overflow-hidden cursor-pointer">
                      <span className="relative z-10 transition-all duration-300">
                        {post.title}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                    </CardTitle>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  {post.images && post.images.length > 0 && (
                    <div className="mb-6 group cursor-pointer max-w-md mx-auto">
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/10 p-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20">
                        <div className="relative overflow-hidden rounded-lg aspect-[4/3]">
                          <img 
                            src={post.images[0]} 
                            alt={post.title}
                            className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
                          />
                          {/* Diagonal Blade Glare Effect - Contained within image */}
                          <div className="absolute inset-1 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-6 transform -translate-x-full opacity-0 group-hover:translate-x-full group-hover:opacity-100 transition-all duration-700 ease-out"></div>
                        </div>
                        {/* Premium Frame Glow */}
                        <div className="absolute inset-0 rounded-xl border border-gradient-to-r from-primary/20 via-white/30 to-primary-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </div>
                    </div>
                  )}
                  <CardDescription className="text-base md:text-lg text-foreground/70 mb-6 leading-relaxed">
                    {post.summary}
                  </CardDescription>
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={() => navigate(`/blog/${post.id}`)}
                      variant="default" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      Read more 
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    <img 
                      src="/lovable-uploads/0aeeda89-42d2-40a0-a002-0fc3c823c55c.png" 
                      alt="Clive Verified" 
                      className="h-12 w-auto object-contain -translate-y-[5px] translate-x-[4px] transition-transform duration-300 hover:scale-125 cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
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
          © 2024{' '}
          <Link 
            to="/admin" 
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Clive's Clues
          </Link>
          . Exploring Abstract Chain together.
        </p>
      </footer>
    </div>
  );
};

export default Index;
