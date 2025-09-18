import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ClipboardCheck, Check, X, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminDashboardProps {
  currentUser: {
    id: string;
    organizationName?: string;
  };
}

export default function AdminDashboard({ currentUser }: AdminDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get pending plantations for verification
  const { data: pendingPlantations = [], isLoading } = useQuery({
    queryKey: ["/api/plantations/pending"],
  });

  const verifyPlantationMutation = useMutation({
    mutationFn: async (plantationId: string) => {
      const response = await apiRequest('PATCH', `/api/plantations/${plantationId}/verify`, {
        verifiedBy: currentUser.id,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantations/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Verification Complete!",
        description: `${data.plantation.creditsEarned} carbon credits have been verified and minted.`,
      });
    },
    onError: () => {
      toast({
        title: "Verification Failed",
        description: "Unable to verify plantation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const rejectPlantationMutation = useMutation({
    mutationFn: async (plantationId: string) => {
      const response = await apiRequest('PATCH', `/api/plantations/${plantationId}/reject`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantations/pending"] });
      toast({
        title: "Submission Rejected",
        description: "The plantation submission has been rejected and will not receive credits.",
      });
    },
    onError: () => {
      toast({
        title: "Rejection Failed",
        description: "Unable to reject plantation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than 1 hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-muted/20 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Admin Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <ShieldCheck className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Administrator Portal</h2>
                <p className="text-muted-foreground">Verify plantation submissions and manage credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <ClipboardCheck className="text-secondary" size={20} />
              <span>Pending Verifications</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                {Array.isArray(pendingPlantations) ? pendingPlantations.length : 0} Pending
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading pending verifications...</div>
            ) : !Array.isArray(pendingPlantations) || pendingPlantations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No pending verifications at this time.
              </div>
            ) : (
              <div className="space-y-6" data-testid="pending-verifications">
                {Array.isArray(pendingPlantations) ? pendingPlantations.map((plantation: any) => (
                  <Card key={plantation.id} className="border-l-4 border-l-amber-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <Check className="text-white" size={16} />
                          </div>
                          <div>
                            <h4 className="font-semibold">Plantation Submission</h4>
                            <p className="text-sm text-muted-foreground">
                              Submitted {formatDate(plantation.createdAt)}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium mb-3">Plantation Details</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mangroves Planted:</span>
                              <span className="font-medium">{plantation.mangroveCount} trees</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Calculated Credits:</span>
                              <span className="font-medium text-primary">{plantation.creditsEarned} Credits</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Location:</span>
                              <span className="font-medium flex items-center space-x-1">
                                <MapPin size={12} />
                                <span>{plantation.latitude}, {plantation.longitude}</span>
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Submission ID:</span>
                              <span className="font-mono text-xs">{plantation.id.slice(0, 12)}...</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium mb-3">Evidence & Notes</h5>
                          <div className="mb-3">
                            <img 
                              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                              alt="Plantation evidence" 
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plantation.notes || "No additional notes provided"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 mt-6">
                        <Button
                          onClick={() => verifyPlantationMutation.mutate(plantation.id)}
                          disabled={verifyPlantationMutation.isPending || rejectPlantationMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                          data-testid={`button-verify-${plantation.id}`}
                        >
                          <Check size={16} />
                          <span>{verifyPlantationMutation.isPending ? 'Approving...' : 'Approve & Mint Credits'}</span>
                        </Button>
                        <Button
                          onClick={() => rejectPlantationMutation.mutate(plantation.id)}
                          disabled={verifyPlantationMutation.isPending || rejectPlantationMutation.isPending}
                          variant="destructive"
                          className="flex items-center space-x-2"
                          data-testid={`button-reject-${plantation.id}`}
                        >
                          <X size={16} />
                          <span>{rejectPlantationMutation.isPending ? 'Rejecting...' : 'Reject'}</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center space-x-2"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${plantation.latitude},${plantation.longitude}`;
                            window.open(url, '_blank');
                          }}
                          data-testid={`button-view-location-${plantation.id}`}
                        >
                          <MapPin size={16} />
                          <span>View Location</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
