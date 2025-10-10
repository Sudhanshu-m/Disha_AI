import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, Clock, DollarSign, Building2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ScholarshipMatch, Scholarship } from "@shared/schema";

// Import predefined scholarships
import allScholarshipsData from "../data/scholarships.json";

export default function Matches() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const startXRef = useRef(0);

  const profileId = localStorage.getItem("currentProfileId");

  if (!profileId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Profile Found</h2>
          <p className="text-slate-600 mb-8">
            Please create your profile first to start generating scholarship matches.
          </p>
          <Button onClick={() => (window.location.href = "/profile")}>
            Create Profile
          </Button>
        </div>
      </div>
    );
  }

  // Fetch AI-generated matches
  const { data: rawMatches = [], isLoading, refetch } = useQuery<
    ScholarshipMatch[]
  >({
    queryKey: ["/api/matches", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/matches/${profileId}`);
        const data = await res.json();
        return data || [];
      } catch {
        // fallback to empty array
        return [];
      }
    },
  });

  // Map raw matches to include full scholarship data
  const matches = rawMatches.length > 0
    ? rawMatches.map((m) => {
        const scholarship = (allScholarshipsData as Scholarship[]).find(
          (s) => s.id === m.scholarshipId
        );
        return {
          ...m,
          scholarship: scholarship || {
            title: "Untitled Scholarship",
            organization: "Unknown",
            description: "No description available",
            amount: "N/A",
            requirements: "N/A",
            deadline: "N/A",
            type: "N/A",
            tags: [],
          },
        };
      })
    : // If no AI matches, use predefined scholarships as fallback
      (allScholarshipsData as Scholarship[]).map((s) => ({
        id: s.id,
        scholarshipId: s.id,
        matchScore: 50,
        aiReasoning: "Fallback match from predefined scholarships.",
        scholarship: s,
      }));

  // Mutation to update match status
  const updateMatchMutation = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: string; status: string }) => {
      return await apiRequest("PUT", `/api/matches/${matchId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches", profileId] });
    },
  });

  // Mutation to delete all matches
  const deleteMatchesMutation = useMutation({
    mutationFn: async () => await apiRequest("DELETE", `/api/matches/all`, {}),
    onSuccess: () => {
      refetch();
      setCurrentIndex(0);
    },
  });

  const handleGenerateMatches = () => {
    deleteMatchesMutation.mutate();
  };

  const handleSwipe = (direction: "left" | "right") => {
    if (!matches || currentIndex >= matches.length || isAnimating) return;

    setIsAnimating(true);
    const currentMatch = matches[currentIndex];

    const status = direction === "right" ? "favorited" : "passed";
    updateMatchMutation.mutate({ matchId: currentMatch.id, status });

    toast({
      title: direction === "right" ? "Great Choice! 💚" : "Passed",
      description:
        direction === "right"
          ? `You liked ${currentMatch.scholarship?.title || "this scholarship"}`
          : "We'll find you better matches!",
    });

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
      setDragOffset(0);
    }, 300);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setDragOffset(clientX - startXRef.current);
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (dragOffset > 100) handleSwipe("right");
    else if (dragOffset < -100) handleSwipe("left");
    else setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleSwipe("left");
      else if (e.key === "ArrowRight") handleSwipe("right");
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isDragging, dragOffset, currentIndex, matches, isAnimating]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Loading your matches...
          </h2>
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Matches Yet</h2>
          <p className="text-slate-600 mb-8">
            Update your profile or generate new matches to get started!
          </p>
          <Button onClick={handleGenerateMatches}>Generate Matches</Button>
        </div>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            🎉 You've Reviewed All Matches!
          </h2>
          <p className="text-slate-600 mb-8">
            Check your dashboard to see your favorited scholarships and start applying.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            View Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];
  const scholarship = currentMatch.scholarship;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Disha AI Scholarship Matches
          </h1>
          <p className="text-slate-600">
            Swipe right to save, left to pass • {currentIndex + 1} of {matches.length}
          </p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="relative h-[600px] mb-8">
          <Card
            ref={cardRef}
            className={`absolute inset-0 shadow-xl border-2 select-none ${
              isAnimating
                ? "transition-all duration-300 ease-out scale-95 opacity-0"
                : "transition-transform duration-100 ease-out scale-100 opacity-100"
            }`}
            style={{
              transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`,
              opacity: isDragging
                ? Math.max(0.8, 1 - Math.abs(dragOffset) / 400)
                : 1,
              transition: isDragging
                ? "none"
                : "transform 0.2s ease-out, opacity 0.2s ease-out",
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">
                    {scholarship?.title || "Untitled Scholarship"}
                  </CardTitle>
                  <div className="flex items-center text-slate-600 mb-2">
                    <Building2 className="w-4 h-4 mr-2" />
                    <span>{scholarship?.organization || "Unknown"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600 font-semibold text-lg mb-1">
                    <DollarSign className="w-5 h-5 mr-1" />
                    {scholarship?.amount || "N/A"}
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {currentMatch.matchScore ?? 0}% Match
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-2">About</h3>
                <p className="text-slate-600 leading-relaxed">
                  {scholarship?.description || "No description available"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-2">Requirements</h3>
                <p className="text-slate-600">{scholarship?.requirements || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-500" />
                  <span className="text-sm text-slate-600">
                    Deadline: {scholarship?.deadline || "N/A"}
                  </span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-slate-500" />
                  <span className="text-sm text-slate-600 capitalize">
                    {scholarship?.type || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {scholarship?.tags?.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                )) || null}
              </div>

              {currentMatch?.aiReasoning && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    🤖 Why This Matches You
                  </h3>
                  <p className="text-blue-700 text-sm">{currentMatch.aiReasoning}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center space-x-8">
          <Button
            size="lg"
            variant="outline"
            className="w-16 h-16 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={() => handleSwipe("left")}
            disabled={isAnimating}
          >
            <X className="w-8 h-8 text-red-500" />
          </Button>

          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={() => handleSwipe("right")}
            disabled={isAnimating}
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
