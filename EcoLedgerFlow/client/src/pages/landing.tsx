import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout, TreePine, ShieldCheck, Handshake, ShoppingCart } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LandingProps {
  onLogin: (user: any) => void;
}

export default function Landing({ onLogin }: LandingProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest('POST', '/api/login', { username: `${role}_user`, role });
      return response.json();
    },
    onSuccess: (data, role) => {
      onLogin(data.user);
      if (role === 'ngo') {
        setLocation('/ngo');
      } else if (role === 'buyer') {
        setLocation('/marketplace');
      } else if (role === 'admin') {
        setLocation('/admin');
      }
      toast({
        title: "Login Successful",
        description: `Welcome to EcoLedger, ${data.user.organizationName}!`,
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Unable to log in. Please try again.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="gradient-bg text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="text-white" size={32} />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 fade-in">
              EcoLedger
            </h1>
            <p className="text-xl md:text-2xl mb-4 text-white/90 fade-in">
              Trustworthy Carbon, Transparent Future
            </p>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12 fade-in">
              Connect NGOs planting mangroves with buyers seeking verified carbon credits through our transparent blockchain-powered marketplace
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                onClick={() => loginMutation.mutate('ngo')}
                disabled={loginMutation.isPending}
                className="hover-lift bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold shadow-lg flex items-center space-x-3 min-w-48"
                data-testid="ngo-login-button"
              >
                <TreePine size={24} />
                <span>{loginMutation.isPending ? 'Logging in...' : 'NGO Login'}</span>
              </Button>
              <Button
                onClick={() => loginMutation.mutate('buyer')}
                disabled={loginMutation.isPending}
                className="hover-lift bg-white/10 backdrop-blur text-white border-2 border-white/30 px-8 py-4 rounded-xl text-lg font-semibold flex items-center space-x-3 min-w-48"
                data-testid="buyer-login-button"
              >
                <ShoppingCart size={24} />
                <span>{loginMutation.isPending ? 'Logging in...' : 'Buyer Login'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center fade-in hover-lift">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sprout className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-4">Plant & Record</h3>
                <p className="text-muted-foreground">NGOs record mangrove plantations with GPS coordinates and photographic proof</p>
              </CardContent>
            </Card>
            
            <Card className="text-center fade-in hover-lift">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-4">Verify & Mint</h3>
                <p className="text-muted-foreground">Admin verification converts plantations into verified carbon credits (100 mangroves = 1 credit)</p>
              </CardContent>
            </Card>
            
            <Card className="text-center fade-in hover-lift">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Handshake className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-4">Trade & Track</h3>
                <p className="text-muted-foreground">Buyers purchase credits in our transparent marketplace with full blockchain tracking</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
