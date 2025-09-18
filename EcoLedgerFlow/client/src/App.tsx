import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Navbar from "@/components/navbar";
import Landing from "@/pages/landing";
import NgoDashboard from "@/pages/ngo-dashboard";
import BuyerDashboard from "@/pages/buyer-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import Ledger from "@/pages/ledger";
import NotFound from "@/pages/not-found";

function Router() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Try to restore user session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        // Set up API headers for restored session
        if (typeof window !== 'undefined' && user.id) {
          setupAPIHeaders(user);
        }
      } catch (e) {
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const setupAPIHeaders = (user: any) => {
    if (typeof window !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = (input, init = {}) => {
        return originalFetch(input, {
          ...init,
          headers: {
            ...init.headers,
            'x-user-id': user.id,
          },
        });
      };
    }
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setupAPIHeaders(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="min-h-screen">
      <Navbar currentUser={currentUser} />
      <Switch>
        <Route path="/" component={() => <Landing onLogin={handleLogin} />} />
        <Route path="/ngo" component={() => 
          currentUser && (currentUser.role === 'ngo' || currentUser.role === 'admin') ? (
            <NgoDashboard currentUser={currentUser} />
          ) : (
            <Landing onLogin={handleLogin} />
          )
        } />
        <Route path="/marketplace" component={() =>
          currentUser && (currentUser.role === 'buyer' || currentUser.role === 'admin') ? (
            <BuyerDashboard currentUser={currentUser} />
          ) : (
            <Landing onLogin={handleLogin} />
          )
        } />
        <Route path="/admin" component={() =>
          currentUser && currentUser.role === 'admin' ? (
            <AdminDashboard currentUser={currentUser} />
          ) : (
            <Landing onLogin={handleLogin} />
          )
        } />
        <Route path="/ledger" component={Ledger} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
