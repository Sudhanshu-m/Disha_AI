import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface DeadlineItem {
  id: string;
  title: string;
  deadline: string;
  daysLeft: number;
  status: "urgent" | "upcoming" | "future";
  progress: {
    completed: string[];
    pending: string[];
  };
}

const mockDeadlines: DeadlineItem[] = [
  {
    id: "1",
    title: "National Merit STEM Scholarship",
    deadline: "March 15, 2024",
    daysLeft: 5,
    status: "urgent",
    progress: {
      completed: ["Transcripts submitted"],
      pending: ["Essay pending"]
    }
  },
  {
    id: "2",
    title: "Tech Diversity Excellence Award", 
    deadline: "April 1, 2024",
    daysLeft: 22,
    status: "upcoming",
    progress: {
      completed: [],
      pending: ["Not started"]
    }
  },
  {
    id: "3",
    title: "Environmental Innovation Award",
    deadline: "June 30, 2024",
    daysLeft: 107,
    status: "future",
    progress: {
      completed: [],
      pending: ["Research phase"]
    }
  }
];

export default function DeadlineTracker() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "urgent":
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "upcoming":
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case "future":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Clock className="w-6 h-6 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "urgent":
        return "bg-red-50 border-red-200";
      case "upcoming":
        return "bg-yellow-50 border-yellow-200";
      case "future":
        return "bg-green-50 border-green-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const getActionButton = (status: string, daysLeft: number) => {
    switch (status) {
      case "urgent":
        return (
          <Button className="bg-red-600 text-white hover:bg-red-700" data-testid="button-complete-urgent">
            Complete Now
          </Button>
        );
      case "upcoming":
        return (
          <Button className="bg-yellow-600 text-white hover:bg-yellow-700" data-testid="button-start-upcoming">
            Start Application
          </Button>
        );
      case "future":
        return (
          <Button className="bg-green-600 text-white hover:bg-green-700" data-testid="button-plan-future">
            Plan Application
          </Button>
        );
      default:
        return <Button>View Details</Button>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-slate-800">Upcoming Deadlines</CardTitle>
            <div className="flex space-x-2">
              <Button size="sm" variant="default" data-testid="button-this-month">
                This Month
              </Button>
              <Button size="sm" variant="outline" data-testid="button-next-three-months">
                Next 3 Months
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border ${getStatusColor(deadline.status)}`}
                data-testid={`deadline-item-${deadline.id}`}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center">
                  {getStatusIcon(deadline.status)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-800" data-testid={`text-deadline-title-${deadline.id}`}>
                      {deadline.title}
                    </h4>
                    <span 
                      className={`font-medium text-sm ${
                        deadline.status === 'urgent' ? 'text-red-600' :
                        deadline.status === 'upcoming' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}
                      data-testid={`text-days-left-${deadline.id}`}
                    >
                      {deadline.daysLeft} days left
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-2" data-testid={`text-deadline-date-${deadline.id}`}>
                    Application deadline {deadline.deadline}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {deadline.progress.completed.map((item, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 text-xs">
                        {item}
                      </Badge>
                    ))}
                    {deadline.progress.pending.map((item, index) => (
                      <Badge key={index} className="bg-slate-100 text-slate-800 text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {getActionButton(deadline.status, deadline.daysLeft)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-800">Notification Preferences</h4>
              <p className="text-sm text-slate-600">Get reminders via email and push notifications</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                  data-testid="checkbox-email-alerts"
                />
                <span className="text-sm text-slate-700">Email alerts</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="rounded border-slate-300 text-primary focus:ring-primary"
                  data-testid="checkbox-push-notifications"
                />
                <span className="text-sm text-slate-700">Push notifications</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
