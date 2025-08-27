import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import ProfileForm from "@/components/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Target, MapPin, DollarSign, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StudentProfile } from "@shared/schema";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Get user ID from localStorage - in a real app, this would come from authentication
  const userId = localStorage.getItem("currentUserId") || "temp-user-id";

  const { data: profile, isLoading } = useQuery<StudentProfile>({
    queryKey: ["/api/profile", userId],
    enabled: !!userId,
  });

  // Generate matches after creating/updating profile
  const generateMatchesMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return await apiRequest("POST", "/api/matches/generate", { profileId });
    },
    onSuccess: () => {
      toast({
        title: "Matches Updated",
        description: "Your scholarship matches have been refreshed based on your updated profile.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error) => {
      console.error("Match generation error:", error);
      toast({
        title: "Error",
        description: "Failed to update matches. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Called after profile is created or updated
  const handleProfileUpdate = (newProfile?: StudentProfile) => {
    setIsEditing(false);

    if (newProfile?.id) {
      // ✅ Save ID so Matches page knows which profile to use
      localStorage.setItem("currentProfileId", newProfile.id.toString());

      // Generate matches for this profile
      generateMatchesMutation.mutate(newProfile.id.toString());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Loading your profile...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !isEditing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                Create Your Profile
              </h2>
              <p className="text-slate-600 mb-6">
                You haven't created a profile yet. Let's get started to find your
                perfect scholarship matches!
              </p>
              <Button onClick={() => setIsEditing(true)} data-testid="button-create-profile">
                Create Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">
              {profile ? "Update Your Profile" : "Create Your Profile"}
            </h1>
            <p className="text-lg text-slate-600">
              Keep your information current to get the best scholarship matches
            </p>
          </div>
          {/* ✅ Pass back the saved profile object to handleProfileUpdate */}
          <ProfileForm onComplete={handleProfileUpdate} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Your Profile</h1>
            <p className="text-lg text-slate-600">
              Manage your academic and personal information
            </p>
          </div>
          <div className="space-x-4">
            <Button
              variant="outline"
              onClick={() => profile?.id && generateMatchesMutation.mutate(profile.id.toString())}
              disabled={generateMatchesMutation.isPending}
              data-testid="button-refresh-matches"
            >
              {generateMatchesMutation.isPending ? "Updating..." : "Refresh Matches"}
            </Button>
            <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Full Name</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-name">{profile?.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-email">{profile?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5" />
                <span>Academic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Education Level</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-education-level">
                  {profile?.educationLevel?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Field of Study</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-field-of-study">{profile?.fieldOfStudy}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">GPA</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-gpa">{profile?.gpa || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Graduation Year</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-800" data-testid="text-profile-graduation-year">{profile?.graduationYear}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Skills & Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Skills & Interests</label>
                <p className="text-slate-600 mt-1" data-testid="text-profile-skills">
                  {profile?.skills || "No skills listed"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Extracurricular Activities</label>
                <p className="text-slate-600 mt-1" data-testid="text-profile-activities">
                  {profile?.activities || "No activities listed"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Financial Need</label>
                <div className="flex items-center space-x-2 mt-1">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <Badge
                    variant="secondary"
                    className={
                      profile?.financialNeed === "critical"
                        ? "bg-red-100 text-red-800"
                        : profile?.financialNeed === "high"
                        ? "bg-orange-100 text-orange-800"
                        : profile?.financialNeed === "moderate"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }
                    data-testid="badge-financial-need"
                  >
                    {profile?.financialNeed
                      ? profile.financialNeed.charAt(0).toUpperCase() + profile.financialNeed.slice(1)
                      : "Not specified"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Location Preference</label>
                <p className="text-slate-800 mt-1" data-testid="text-profile-location">
                  {profile?.location?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
