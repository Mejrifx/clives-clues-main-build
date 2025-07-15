import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Eye, EyeOff, Trash2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [blogForm, setBlogForm] = useState({ title: '', summary: '', content: '' });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [tweets, setTweets] = useState(['', '', '', '', '']);
  const [generatedBlog, setGeneratedBlog] = useState('');
  const [editableBlog, setEditableBlog] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Fetch posts when logged in
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
      setLoadingPosts(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Secure login - only allow specific admin credentials
    if (loginForm.email === 'cliveonabs@outlook.com' && loginForm.password === 'CliveAdmin123!') {
      setIsLoggedIn(true);
        toast({
          title: "Success!",
          description: "Welcome back, Admin.",
        });
        // Fetch posts after successful login
        fetchPosts();
      } else {
      toast({
        title: "Login Failed",
        description: "Invalid email or password. Access denied.",
        variant: "destructive",
      });
    }
  };

  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imageUrls: string[] = [];
      
      // Upload images if any are selected
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const fileName = `${Date.now()}-${image.name}`;
          const { data, error } = await supabase.storage
            .from('blog-images')
            .upload(fileName, image);
            
          if (error) {
            toast({
              title: "Error",
              description: `Failed to upload image: ${image.name}`,
              variant: "destructive",
            });
            return;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(fileName);
            
          imageUrls.push(publicUrl);
        }
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          title: blogForm.title,
          summary: blogForm.summary,
          content: blogForm.content,
          images: imageUrls,
          is_ai_generated: false
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to publish blog post. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success!",
        description: "Blog post published successfully.",
      });

      setBlogForm({ title: '', summary: '', content: '' });
      setSelectedImages([]);
      // Refresh posts list
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete blog post. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Success!",
        description: "Blog post deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTweetChange = (index: number, value: string) => {
    const newTweets = [...tweets];
    newTweets[index] = value;
    setTweets(newTweets);
  };

  const generateBlogFromTweets = async () => {
    const validTweets = tweets.filter(tweet => tweet.trim());
    if (validTweets.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one tweet to generate a blog post.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-blog-ai', {
        body: { tweets: validTweets }
      });

      if (response.error) {
        console.error('Supabase function error:', response.error);
        throw new Error(response.error.message || 'Failed to generate blog');
      }

      if (!response.data) {
        throw new Error('No data returned from function');
      }

      const { generatedBlog } = response.data;
      // Convert line breaks to HTML for proper paragraph formatting
      const formattedBlog = generatedBlog.replace(/\n/g, '<br>');
      setGeneratedBlog(formattedBlog);
      setEditableBlog(generatedBlog);
      setShowPreview(true);
      
      toast({
        title: "Success!",
        description: "Blog post generated successfully. Review and edit below.",
      });
    } catch (error: any) {
      console.error('Blog generation error:', error);
      let errorMessage = "Failed to generate blog post. Please try again.";
      
      if (error.message?.includes('OpenAI API key')) {
        errorMessage = "OpenAI API key not configured. Please check your secrets in Supabase.";
      } else if (error.message?.includes('401')) {
        errorMessage = "Invalid OpenAI API key. Please check your key is correct.";
      } else if (error.message?.includes('429')) {
        errorMessage = "OpenAI rate limit exceeded. Please try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const publishGeneratedBlog = async () => {
    if (!editableBlog.trim()) {
      toast({
        title: "Error",
        description: "Please provide content for the blog post.",
        variant: "destructive",
      });
      return;
    }

    // Extract title from the first line or create a default one
    const lines = editableBlog.split('\n').filter(line => line.trim());
    const title = lines[0]?.replace(/^#+\s*/, '') || 'AI Generated Blog Post';
    const content = editableBlog;
    const summary = lines.find(line => line.length > 50)?.substring(0, 150) + '...' || 'AI generated post from tweet analysis';

    try {
      // Ensure proper paragraph formatting by converting double line breaks to paragraphs
      const formattedContent = editableBlog
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/<br>/g, '<br/>');

      const { error } = await supabase
        .from('posts')
        .insert({
          title,
          summary,
          content: formattedContent,
          is_ai_generated: true
        });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Success!",
        description: "AI-generated blog post published successfully.",
      });

      // Reset form
      setTweets(['', '', '', '', '']);
      setGeneratedBlog('');
      setEditableBlog('');
      setShowPreview(false);
      
      // Refresh posts list
      fetchPosts();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to publish blog post. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen scroll-gradient">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Link to="/" className="inline-flex items-center text-foreground/70 hover:text-foreground mb-8 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <Card className="glass-card border-white/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl gradient-text">Admin Access</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="admin@clivesclues.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={loginForm.password}
                        onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    Login
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen scroll-gradient">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Site
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Create New Blog Post */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-xl">Create New Blog Post</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBlogSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter blog post title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={blogForm.summary}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief summary of the post"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="content">Full Post Content</Label>
                  <Textarea
                    id="content"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your full blog post content here"
                    rows={8}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="images">Blog Images (Optional)</Label>
                  <Input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        setSelectedImages(Array.from(files));
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {selectedImages.length > 0 && (
                    <div className="mt-2 text-sm text-foreground/70">
                      {selectedImages.length} image(s) selected
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  Publish Post
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Manage Blog Posts */}
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-xl">Manage Blog Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="text-center text-foreground/70">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center text-foreground/70">No posts found.</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 rounded-lg bg-white/10 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
                          <p className="text-sm text-foreground/80 mb-2">{post.summary}</p>
                          <div className="text-xs text-foreground/60 flex gap-4">
                            <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                            {post.is_ai_generated && (
                              <span className="text-purple-400 text-xs font-medium">
                                AI Generated
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeletePost(post.id)}
                          className="ml-4 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Blog Generator AI Section */}
        <Card className="glass-card border-white/20 mb-8">
          <CardHeader>
            <CardTitle className="text-xl">
              Blog Generator AI
              <span className="text-sm font-normal text-foreground/70 ml-2">- Clive's Newsroom</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Tweet Input Section */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Tweet Content</Label>
                  <p className="text-sm text-foreground/70 mb-4">
                    Paste up to 5 tweets about Abstract Chain news and developments:
                  </p>
                </div>
                
                {tweets.map((tweet, index) => (
                  <div key={index}>
                    <Label htmlFor={`tweet-${index}`} className="text-sm">
                      Tweet {index + 1}
                    </Label>
                    <Textarea
                      id={`tweet-${index}`}
                      value={tweet}
                      onChange={(e) => handleTweetChange(index, e.target.value)}
                      placeholder={`Paste tweet ${index + 1} content here...`}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                ))}
                
                <Button 
                  onClick={generateBlogFromTweets}
                  disabled={isGenerating || tweets.every(tweet => !tweet.trim())}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? 'Generating Blog...' : 'Generate Blog'}
                </Button>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">AI Generated Preview</Label>
                {showPreview ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10 min-h-[300px]">
                      <Textarea
                        value={editableBlog}
                        onChange={(e) => setEditableBlog(e.target.value)}
                        className="min-h-[280px] resize-none border-none bg-transparent focus:ring-0 focus:ring-offset-0"
                        placeholder="AI generated content will appear here..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={publishGeneratedBlog}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit & Post
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowPreview(false);
                          setGeneratedBlog('');
                          setEditableBlog('');
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-lg bg-white/5 border border-white/10 text-center text-foreground/50 min-h-[300px] flex items-center justify-center">
                    <div className="space-y-2">
                      <p>AI generated blog content will appear here</p>
                      <p className="text-xs">Add tweets and click "Generate Blog" to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;