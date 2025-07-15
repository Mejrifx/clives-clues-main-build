import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Lock, Unlock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnlockBlog } from '@/hooks/useUnlockBlog';

interface BlogCardProps {
  post: any;
  onUnlockClick: (post: any) => void;
}

const BlogCard = ({ post, onUnlockClick }: BlogCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isUnlocked, loading: unlockLoading } = useUnlockBlog(post.id);

  const handleReadClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isUnlocked) {
      navigate(`/blog/${post.id}`);
    } else {
      onUnlockClick(post);
    }
  };

  const renderButton = () => {
    if (!user) {
      return (
        <Button 
          onClick={() => navigate('/login')}
          variant="default" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          Sign In to Read
          <UserIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    if (unlockLoading) {
      return (
        <Button 
          variant="default" 
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          disabled
        >
          Checking...
        </Button>
      );
    }

    if (isUnlocked) {
      return (
        <Button 
          onClick={handleReadClick}
          variant="default" 
          className="bg-green-600 hover:bg-green-700 text-white font-medium"
        >
          Read Full Post
          <Unlock className="ml-2 h-4 w-4" />
        </Button>
      );
    }

    return (
      <Button 
        onClick={handleReadClick}
        variant="default" 
        className="bg-orange-600 hover:bg-orange-700 text-white font-medium"
      >
                        Unlock Alpha
        <Lock className="ml-2 h-4 w-4" />
      </Button>
    );
  };

  return (
    <Card className="glass-card border-0 transition-all duration-300 hover:scale-[1.02] mx-3 sm:mx-0">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-2xl md:text-3xl font-bold text-black relative group overflow-hidden cursor-pointer">
            <span className="relative z-10 transition-all duration-300">
              {post.title}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
          </CardTitle>
          {!user && (
            <div className="flex items-center text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3 mr-1" />
              <span>Locked</span>
            </div>
          )}
          {user && !unlockLoading && !isUnlocked && (
            <div className="flex items-center text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              <Lock className="w-3 h-3 mr-1" />
              <span>Locked</span>
            </div>
          )}
          {user && !unlockLoading && isUnlocked && (
            <div className="flex items-center text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
              <Unlock className="w-3 h-3 mr-1" />
              <span>Unlocked</span>
            </div>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {post.images && post.images.length > 0 && (
          <div className="mb-6 group cursor-pointer w-full max-w-sm sm:max-w-md mx-auto">
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
        <div className="flex items-end gap-3 w-full">
          {renderButton()}
          <img 
            src="/lovable-uploads/0aeeda89-42d2-40a0-a002-0fc3c823c55c.png" 
            alt="Clive Verified" 
            className="h-10 sm:h-12 w-auto object-contain flex-shrink-0 -translate-y-[5px] translate-x-[2px] sm:-translate-y-[3px] sm:translate-x-[3px] transition-transform duration-300 hover:scale-125 cursor-pointer"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogCard; 