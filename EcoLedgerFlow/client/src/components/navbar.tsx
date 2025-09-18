import { Link, useLocation } from "wouter";
import { Leaf, Home, TreePine, Store, FileText, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  currentUser?: {
    id: string;
    role: string;
    organizationName?: string;
  } | null;
}

export default function Navbar({ currentUser }: NavbarProps) {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home, roles: ["all"] },
    { path: "/ngo", label: "NGO Portal", icon: TreePine, roles: ["ngo", "admin"] },
    { path: "/marketplace", label: "Marketplace", icon: Store, roles: ["buyer", "admin"] },
    { path: "/ledger", label: "Ledger", icon: FileText, roles: ["all"] },
    { path: "/admin", label: "Admin", icon: Shield, roles: ["admin"] },
  ];

  const visibleItems = navItems.filter(item => 
    item.roles.includes("all") || 
    (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <nav className="bg-white border-b border-border shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Leaf className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">EcoLedger</h1>
              <p className="text-xs text-muted-foreground -mt-1">Trustworthy Carbon, Transparent Future</p>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              return (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center space-x-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {currentUser && (
            <div className="flex items-center space-x-3">
              <div className="bg-muted px-3 py-1 rounded-full text-sm">
                <span className="text-primary mr-1">●</span>
                <span data-testid="current-user">{currentUser.organizationName || currentUser.id}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
