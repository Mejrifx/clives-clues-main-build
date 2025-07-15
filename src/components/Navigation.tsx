import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, User, LogOut, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  
  const navItems = [
    { name: 'Home', href: '/', current: location.pathname === '/' && !location.hash },
    { name: 'About', href: '/#about', current: location.hash === '#about' },
    { name: "Clive's Blogs", href: '/#blogs', current: location.hash === '#blogs' },
    { name: 'Submit a Project', href: '/#submit', current: location.hash === '#submit' },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (href.includes('#')) {
      const sectionId = href.split('#')[1];
      if (location.pathname === '/') {
        setTimeout(() => {
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    }
  };

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0], mobile?: boolean }) => (
    <Link
      to={item.href}
      onClick={() => handleNavClick(item.href)}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary relative group",
        item.current 
          ? "text-primary" 
          : "text-black hover:text-primary",
        mobile && "text-base py-2 block"
      )}
    >
      {item.name}
      {item.current && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
      {!item.current && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200" />
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/clive-blog-logo.png" 
              alt="Curious Clive" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navItems.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>

          {/* Desktop Auth Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 px-3">
                    <User className="h-4 w-4 mr-2" />
                    {user.user_metadata?.username || user.email?.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Toggle navigation menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <img 
                      src="/clive-blog-logo.png" 
                      alt="Curious Clive" 
                      className="h-10 w-auto"
                    />
                  </div>
                  <div className="flex flex-col space-y-4 pt-4">
                    {navItems.map((item) => (
                      <NavLink key={item.name} item={item} mobile />
                    ))}
                    
                    {/* Mobile Auth Section */}
                    <div className="border-t pt-4 space-y-2">
                      {loading ? (
                        <div className="h-9 bg-muted animate-pulse rounded" />
                      ) : user ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{user.user_metadata?.username || user.email?.split('@')[0]}</span>
                          </div>
                          <Button 
                            onClick={() => {
                              signOut();
                              setIsOpen(false);
                            }}
                            variant="outline" 
                            className="w-full justify-start"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Button 
                            asChild 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => setIsOpen(false)}
                          >
                            <Link to="/login">
                              <LogIn className="h-4 w-4 mr-2" />
                              Sign In
                            </Link>
                          </Button>
                          <Button 
                            asChild 
                            className="w-full"
                            onClick={() => setIsOpen(false)}
                          >
                            <Link to="/signup">Sign Up</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;