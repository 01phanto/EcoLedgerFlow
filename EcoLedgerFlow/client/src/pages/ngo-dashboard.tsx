import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TreePine, Plus, History, MapPin, Clock, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlantationSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const plantationFormSchema = insertPlantationSchema.extend({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});

interface NgoDashboardProps {
  currentUser: {
    id: string;
    organizationName?: string;
  };
}

export default function NgoDashboard({ currentUser }: NgoDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(plantationFormSchema),
    defaultValues: {
      ngoId: currentUser.id,
      mangroveCount: 250,
      latitude: 1.3521,
      longitude: 103.8198,
      notes: "",
      imageUrl: null,
    },
  });

  // Get NGO plantations
  const { data: plantations = [], isLoading: plantationsLoading } = useQuery({
    queryKey: ["/api/plantations/ngo", currentUser.id],
  });

  // Get NGO credits
  const { data: credits = [], isLoading: creditsLoading } = useQuery({
    queryKey: ["/api/credits/owner", currentUser.id],
  });

  const totalCredits = Array.isArray(credits) ? credits.reduce((sum: number, credit: any) => sum + credit.amount, 0) : 0;

  const submitPlantationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/plantations', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plantations/ngo"] });
      form.reset({
        ngoId: currentUser.id,
        mangroveCount: 250,
        latitude: 1.3521,
        longitude: 103.8198,
        notes: "",
        imageUrl: null,
      });
      toast({
        title: "Plantation Submitted!",
        description: `Your plantation of ${data.mangroveCount} mangroves has been submitted for verification. You will receive ${data.creditsEarned} credits once approved.`,
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit plantation. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: any) => {
    submitPlantationMutation.mutate(data);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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
        
        {/* NGO Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <TreePine className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{currentUser.organizationName}</h2>
                  <p className="text-muted-foreground">Organization ID: {currentUser.id}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary" data-testid="ngo-credit-balance">
                  {creditsLoading ? "..." : totalCredits}
                </div>
                <p className="text-sm text-muted-foreground">Available Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Plantation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Plus className="text-primary" size={20} />
                <span>Record New Plantation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="mangroveCount">Number of Mangroves Planted</Label>
                  <Input
                    id="mangroveCount"
                    type="number"
                    min="1"
                    max="10000"
                    {...form.register('mangroveCount', { valueAsNumber: true })}
                    data-testid="input-mangrove-count"
                  />
                  <p className="text-xs text-muted-foreground mt-1">100 mangroves = 1 carbon credit</p>
                  {form.formState.errors.mangroveCount && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.mangroveCount.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      {...form.register('latitude', { valueAsNumber: true })}
                      data-testid="input-latitude"
                    />
                    {form.formState.errors.latitude && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.latitude.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      {...form.register('longitude', { valueAsNumber: true })}
                      data-testid="input-longitude"
                    />
                    {form.formState.errors.longitude && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.longitude.message}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Species planted, soil conditions, etc."
                    {...form.register('notes')}
                    data-testid="input-notes"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={submitPlantationMutation.isPending}
                  className="w-full flex items-center justify-center space-x-2"
                  data-testid="button-submit-plantation"
                >
                  <TreePine size={16} />
                  <span>{submitPlantationMutation.isPending ? 'Submitting...' : 'Submit Plantation Record'}</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Map and History */}
          <div className="space-y-6">
            
            {/* Map Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="text-primary" size={20} />
                  <span>Plantation Locations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8194633957965!2d103.81735!3d1.3521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31da110c684b7b55%3A0x85b1b62a34cd5d66!2sSungei%20Buloh%20Wetland%20Reserve!5e0!3m2!1sen!2ssg!4v1647839472635!5m2!1sen!2ssg"
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy"
                    title="Plantation Locations Map"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Plantations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <History className="text-primary" size={20} />
                  <span>Recent Submissions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {plantationsLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : !Array.isArray(plantations) || plantations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No plantation submissions yet. Create your first submission above!
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="plantation-history">
                    {Array.isArray(plantations) ? plantations.map((plantation: any) => (
                      <div key={plantation.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            plantation.status === 'verified' ? 'bg-green-500' : 
                            plantation.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                          }`}>
                            {plantation.status === 'verified' ? (
                              <CheckCircle className="text-white" size={16} />
                            ) : (
                              <Clock className="text-white" size={16} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{plantation.mangroveCount} Mangroves Planted</p>
                            <p className="text-sm text-muted-foreground">
                              Lat: {plantation.latitude}, Lng: {plantation.longitude}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(plantation.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            plantation.status === 'verified' ? 'text-green-600' :
                            plantation.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {plantation.status === 'verified' ? '+' : ''}{plantation.creditsEarned} Credits
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {plantation.status}
                          </div>
                        </div>
                      </div>
                    )) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
