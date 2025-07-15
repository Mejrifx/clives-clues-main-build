import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoImage from '/lovable-uploads/ce0a246f-e8d2-4acf-b500-e46169a2aaf3.png';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
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
              src={logoImage} 
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
                      src={logoImage} 
                      alt="Curious Clive" 
                      className="h-10 w-auto"
                    />
                  </div>
                  <div className="flex flex-col space-y-4 pt-4">
                    {navItems.map((item) => (
                      <NavLink key={item.name} item={item} mobile />
                    ))}
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