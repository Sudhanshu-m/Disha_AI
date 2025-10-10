import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, DollarSign, Clock } from "lucide-react";
import type { ScholarshipMatch, Scholarship } from "@shared/schema";

interface ScholarshipCardProps {
  match: ScholarshipMatch & { scholarship: Scholarship };
  onFavorite?: (matchId: string) => void;
  onApply?: (scholarship: Scholarship) => void;
}

export default function ScholarshipCard({ match, onFavorite, onApply }: ScholarshipCardProps) {
  const { scholarship, matchScore, status } = match;
  
  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 90) return `${score}% Match`;
    if (score >= 70) return `${score}% Match`;
    return `${score}% Match`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-scholarship-${scholarship.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold text-slate-800" data-testid={`text-title-${scholarship.id}`}>
                {scholarship.title}
              </h3>
              <Badge className={getMatchScoreColor(matchScore)} data-testid={`badge-match-${scholarship.id}`}>
                {getMatchScoreLabel(matchScore)}
              </Badge>
            </div>
            <p className="text-slate-600 mb-3" data-testid={`text-organization-${scholarship.id}`}>
              {scholarship.organization}
            </p>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span className="flex items-center space-x-1">
                <DollarSign className="w-4 h-4" />
                <span data-testid={`text-amount-${scholarship.id}`}>{scholarship.amount}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span data-testid={`text-deadline-${scholarship.id}`}>Due: {scholarship.deadline}</span>
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onFavorite?.(match.id)}
            className={status === 'favorited' ? 'text-red-500' : 'text-slate-400 hover:text-slate-600'}
            data-testid={`button-favorite-${scholarship.id}`}
          >
            <Heart className={`w-5 h-5 ${status === 'favorited' ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <p className="text-slate-600 mb-4 text-sm" data-testid={`text-description-${scholarship.id}`}>
          {scholarship.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {scholarship.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            className="text-primary hover:text-blue-700 font-medium text-sm"
            data-testid={`button-requirements-${scholarship.id}`}
          >
            View Requirements
          </Button>
          <Button 
            onClick={() => onApply?.(scholarship)}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            data-testid={`button-apply-${scholarship.id}`}
          >
            Start Application
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
