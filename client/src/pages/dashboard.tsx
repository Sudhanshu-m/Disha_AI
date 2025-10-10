import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import ScholarshipCard from "@/components/scholarship-card";
import DeadlineTracker from "@/components/deadline-tracker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, DollarSign, Clock, Target } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScholarshipMatch, Scholarship } from "@shared/schema";

export default function Dashboard() {
  const [filters, setFilters] = useState({ type: "", amount: "", deadline: "" });
  const [sortBy, setSortBy] = useState("matchScore");
  const { toast } = useToast();

  const profileId = localStorage.getItem('currentProfileId') || 'demo-profile';
  const validProfileId = profileId !== 'demo-profile' ? profileId : null;

  const { data: matches, isLoading } = useQuery<(ScholarshipMatch & { scholarship?: Scholarship })[]>({
    queryKey: ['/api/matches', profileId],
    enabled: !!profileId,
  });

  const favoriteMatchMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      return await apiRequest("PUT", `/api/matches/${matchId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches', profileId] });
      toast({ title: "Updated", description: "Scholarship favorited successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update scholarship status", variant: "destructive" });
    },
  });

  const handleFavorite = (matchId: string) => {
    favoriteMatchMutation.mutate({ matchId, status: "favorited" });
  };

  const handleApply = (scholarship?: Scholarship) => {
    if (!scholarship) return;
    toast({ title: "Application Started", description: `Starting application for ${scholarship.title}` });
  };

  const getStats = () => {
    if (!matches) return { totalMatches: 0, highMatch: 0, dueThisMonth: 0, totalValue: "₹0" };

    const totalMatches = matches.length;
    const highMatch = matches.filter(m => m.matchScore >= 90).length;

    const dueThisMonth = matches.filter(m => {
      const deadline = m.scholarship?.deadline ? new Date(m.scholarship.deadline) : null;
      if (!deadline) return false;
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return deadline >= now && deadline <= nextMonth;
    }).length;

    const totalValue = matches.reduce((sum, match) => {
      const amountStr = match.scholarship?.amount || "0";
      const amount = parseInt(amountStr.replace(/[^0-9]/g, "") || "0");
      return sum + amount;
    }, 0);

    return { totalMatches, highMatch, dueThisMonth, totalValue: `₹${(totalValue / 1000).toFixed(0)}K` };
  };

  const stats = getStats();

  const filteredAndSortedMatches = (matches || [])
    .filter(match => {
      if (!match.scholarship) return false;
      if (filters.type && filters.type !== "all" && match.scholarship.type !== filters.type) return false;
      if (filters.amount && filters.amount !== "all") {
        const amount = parseInt(match.scholarship.amount.replace(/[^0-9]/g, "") || "0");
        const filterAmount = parseInt(filters.amount);
        if (filterAmount === 5000 && amount >= 5000) return false;
        if (filterAmount === 10000 && (amount < 5000 || amount >= 10000)) return false;
        if (filterAmount === 20000 && amount < 10000) return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "matchScore":
          return (b.matchScore || 0) - (a.matchScore || 0);
        case "amount":
          const aAmount = parseInt(a.scholarship?.amount.replace(/[^0-9]/g, "") || "0");
          const bAmount = parseInt(b.scholarship?.amount.replace(/[^0-9]/g, "") || "0");
          return bAmount - aAmount;
        case "deadline":
          const aDeadline = a.scholarship?.deadline ? new Date(a.scholarship.deadline).getTime() : 0;
          const bDeadline = b.scholarship?.deadline ? new Date(b.scholarship.deadline).getTime() : 0;
          return aDeadline - bDeadline;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Loading your dashboard...</h2>
          <p className="text-slate-600">Please wait while we fetch your scholarship matches.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalMatches}</p>
                <p className="text-sm text-slate-600">Total Matches</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.highMatch}</p>
                <p className="text-sm text-slate-600">High Match (90%+)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.dueThisMonth}</p>
                <p className="text-sm text-slate-600">Due This Month</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{stats.totalValue}</p>
                <p className="text-sm text-slate-600">Total Value</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="opportunities" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="opportunities">Scholarship Opportunities</TabsTrigger>
            <TabsTrigger value="deadlines">Deadline Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-6">
            {filteredAndSortedMatches.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-8">
                {filteredAndSortedMatches
                  .filter((match) => match.scholarship) // Ensure scholarship is present
                  .map((match) => (
                    <ScholarshipCard
                      key={match.id}
                      match={match as typeof match & { scholarship: Scholarship }}
                      onFavorite={handleFavorite}
                      onApply={() => handleApply(match.scholarship)}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <h3 className="text-xl font-semibold text-slate-800 mb-4">No matches found</h3>
                  <p className="text-slate-600 mb-6">We couldn't find any scholarship matches for your profile yet.</p>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={() => window.location.href = '/profile'}>Create Profile</Button>
                    <Button onClick={() => {
                      if (validProfileId) {
                        apiRequest('POST', '/api/matches/generate', { profileId: validProfileId })
                          .then(() => {
                            queryClient.invalidateQueries({ queryKey: ['/api/matches', validProfileId] });
                            toast({ title: 'Matches Generated', description: 'New scholarship matches have been generated!' });
                          })
                          .catch(() => toast({ title: 'Error', description: 'Failed to generate matches', variant: 'destructive' }));
                      } else {
                        toast({ title: 'Profile Required', description: 'Please create a profile first.', variant: 'destructive' });
                      }
                    }}>Generate Matches</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="deadlines">
            <DeadlineTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
