import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
}

export default function HeroSection({ onStartAnalysis }: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-r from-primary to-secondary text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Your Perfect
              <span className="text-yellow-300"> Scholarship Match</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Our AI analyzes your academic profile, skills, and background to find personalized scholarship opportunities you never knew existed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={onStartAnalysis}
                className="bg-white text-primary px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                data-testid="button-start-analysis"
              >
                Start Your Analysis
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                onClick={() => window.location.href = '/matches'}
                data-testid="button-sample-results"
              >
                View Sample Results
              </Button>
            </div>
            <div className="mt-8 flex items-center space-x-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>50,000+ Scholarships</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5" />
                <span>AI-Powered Matching</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Diverse group of students collaborating on laptops" 
              className="rounded-xl shadow-2xl w-full h-auto"
            />
            <div className="absolute -bottom-6 -left-6 bg-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">94% Success Rate</p>
                  <p className="text-sm text-slate-600">Students find funding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
