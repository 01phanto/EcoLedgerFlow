import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Store, ShieldCheck, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BuyerDashboardProps {
  currentUser: {
    id: string;
    organizationName?: string;
  };
}

export default function BuyerDashboard({ currentUser }: BuyerDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get buyer's owned credits
  const { data: ownedCredits = [], isLoading: creditsLoading } = useQuery({
    queryKey: ["/api/credits/owner", currentUser.id],
  });

  // Get available credits in marketplace
  const { data: availableCredits = [], isLoading: marketplaceLoading } = useQuery({
    queryKey: ["/api/credits/available"],
  });

  const totalOwnedCredits = Array.isArray(ownedCredits) ? ownedCredits.reduce((sum: number, credit: any) => sum + credit.amount, 0) : 0;

  const purchaseCreditMutation = useMutation({
    mutationFn: async (creditId: string) => {
      const response = await apiRequest('POST', `/api/credits/${creditId}/purchase`, {
        buyerId: currentUser.id,
      });
      return response.json();
    },
    onSuccess: (data, creditId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits/owner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/available"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      const credit = Array.isArray(availableCredits) ? availableCredits.find((c: any) => c.id === creditId) : null;
      const totalPrice = credit ? credit.amount * parseFloat(credit.pricePerCredit) : 0;
      
      toast({
        title: "Purchase Successful!",
        description: `You have successfully purchased ${data.credit.amount} carbon credits for $${totalPrice.toFixed(2)}.`,
      });
    },
    onError: () => {
      toast({
        title: "Purchase Failed",
        description: "Unable to complete purchase. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePurchase = (creditId: string) => {
    purchaseCreditMutation.mutate(creditId);
  };

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Buyer Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                  <Building2 className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentUser.organizationName}</h2>
                  <p className="text-muted-foreground">Carbon Offset Buyer • ID: {currentUser.id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-accent" data-testid="buyer-credits-owned">
                  {creditsLoading ? "..." : totalOwnedCredits}
                </div>
                <p className="text-sm text-muted-foreground">Credits Owned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marketplace */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <Store className="text-primary" size={20} />
                <span>Carbon Credit Marketplace</span>
              </CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <ShieldCheck className="text-green-500" size={16} />
                <span>All credits are verified and blockchain-tracked</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {marketplaceLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading marketplace...</div>
            ) : !Array.isArray(availableCredits) || availableCredits.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No credits available for purchase at this time.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="marketplace-grid">
                {Array.isArray(availableCredits) ? availableCredits.map((credit: any) => {
                  const totalPrice = credit.amount * parseFloat(credit.pricePerCredit);
                  return (
                    <Card key={credit.id} className="hover-lift">
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <Building2 className="text-white" size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold">{credit.ngo?.organizationName || 'Unknown NGO'}</h4>
                            <p className="text-sm text-muted-foreground">Verified NGO</p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <img 
                            src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200" 
                            alt="Mangrove plantation" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Credits Available:</span>
                            <span className="font-medium">{credit.amount} Credits</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mangroves Planted:</span>
                            <span className="font-medium">{credit.plantation?.mangroveCount || 'N/A'} Trees</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price per Credit:</span>
                            <span className="font-medium text-primary">${credit.pricePerCredit}</span>
                          </div>
                          {credit.plantation && (
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium flex items-center space-x-1">
                                <MapPin size={12} />
                                <span>{credit.plantation.latitude}, {credit.plantation.longitude}</span>
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-4">
                          <ShieldCheck className="text-green-500" size={16} />
                          <Badge variant="secondary" className="text-green-600">Verified</Badge>
                        </div>
                        
                        <Button
                          onClick={() => handlePurchase(credit.id)}
                          disabled={purchaseCreditMutation.isPending}
                          className="w-full"
                          data-testid={`button-purchase-${credit.id}`}
                        >
                          {purchaseCreditMutation.isPending 
                            ? 'Processing...' 
                            : `Purchase ${credit.amount} Credits ($${totalPrice.toFixed(2)})`
                          }
                        </Button>
                      </CardContent>
                    </Card>
                  );
                }) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
