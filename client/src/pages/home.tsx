import { useState } from "react";
import { Link } from "wouter";
import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import ProfileForm from "@/components/profile-form";

import { Button } from "@/components/ui/button";
import { Check, FileText, Shield, Users, DollarSign, Clock, Target, Info, X, Heart, User } from "lucide-react";

// Sample opportunities data
const sampleOpportunities = [
  {
    id: 1,
    title: "Tech Innovation Grant",
    organization: "TechForward Foundation",
    amount: "₹7,00,000",
    deadline: "April 15, 2024",
    matchScore: "94%",
    description: "Supporting students in computer science and technology fields with demonstrated innovation potential.",
    color: "from-blue-500 to-purple-600"
  },
  {
    id: 2,
    title: "Google Computer Science Scholarship",
    organization: "Google Inc.",
    amount: "₹8,25,000",
    deadline: "March 15, 2024",
    matchScore: "88%",
    description: "Supporting underrepresented students in computer science and technology fields.",
    color: "from-green-500 to-blue-600"
  },
  {
    id: 3,
    title: "Microsoft LEAP Engineering Program",
    organization: "Microsoft Corporation",
    amount: "₹20,60,000",
    deadline: "April 1, 2024",
    matchScore: "91%",
    description: "Full-time program for students from non-traditional backgrounds in tech.",
    color: "from-purple-500 to-pink-600"
  },
  {
    id: 4,
    title: "NASA Summer Internship",
    organization: "NASA",
    amount: "₹6,18,000",
    deadline: "January 31, 2024",
    matchScore: "85%",
    description: "Hands-on internship experience in aerospace engineering and space science.",
    color: "from-red-500 to-orange-600"
  },
  {
    id: 5,
    title: "Women in STEM Scholarship",
    organization: "STEM Foundation",
    amount: "₹4,12,000",
    deadline: "May 1, 2024",
    matchScore: "79%",
    description: "Empowering women to pursue careers in science, technology, engineering, and mathematics.",
    color: "from-teal-500 to-cyan-600"
  }
];

function SampleOpportunityCard({ onStartAnalysis }: { onStartAnalysis: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentOpportunity = sampleOpportunities[currentIndex];

  const handleAction = (action: 'pass' | 'save') => {
    setIsAnimating(true);
    
    setTimeout(() => {
      const nextIndex = (currentIndex + 1) % sampleOpportunities.length;
      setCurrentIndex(nextIndex);
      setIsAnimating(false);
    }, 300);
  };

  const handlePass = () => handleAction('pass');
  const handleSave = () => handleAction('save');

  return (
    <div className="max-w-md mx-auto">
      <div className={`transition-all duration-300 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-8">
          <div className="flex items-center mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${currentOpportunity.color} rounded-full flex items-center justify-center`}>
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h3 className="font-semibold text-slate-800">{currentOpportunity.title}</h3>
              <p className="text-sm text-slate-500">{currentOpportunity.organization}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Amount:</span>
              <span className="font-semibold text-green-600">{currentOpportunity.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Deadline:</span>
              <span className="font-semibold text-slate-800">{currentOpportunity.deadline}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Match Score:</span>
              <span className="font-semibold text-blue-600">{currentOpportunity.matchScore}</span>
            </div>
            <p className="text-sm text-slate-600 mt-3">{currentOpportunity.description}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-8 mb-8">
        <button 
          onClick={handlePass}
          className="p-4 rounded-full bg-white shadow-lg hover:bg-red-100 hover:scale-110 transition-all duration-200"
          disabled={isAnimating}
        >
          <X className="w-10 h-10 text-red-500" />
        </button>
        <button 
          onClick={handleSave}
          className="p-4 rounded-full bg-white shadow-lg hover:bg-green-100 hover:scale-110 transition-all duration-200"
          disabled={isAnimating}
        >
          <Heart className="w-10 h-10 text-green-500" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center space-x-2 mb-8">
        {sampleOpportunities.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentIndex ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center">
        <p className="text-slate-600 mb-4">Ready to find your perfect scholarship matches?</p>
        <Button 
          onClick={onStartAnalysis}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Get Started Now
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  const [showProfileForm, setShowProfileForm] = useState(false);

  const scrollToProfileForm = () => {
    setShowProfileForm(true);
    setTimeout(() => {
      document.getElementById('profile-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <HeroSection onStartAnalysis={scrollToProfileForm} />

      {/* Profile Creation Section */}
      {showProfileForm && (
        <section id="profile-section" className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-800 mb-4">Build Your Academic Profile</h2>
              <p className="text-lg text-slate-600">Help our AI understand your unique background to find the best opportunities</p>
            </div>
            <ProfileForm />
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">How Disha AI Works</h2>
            <p className="text-lg text-slate-600">Three simple steps to unlock your educational funding</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Create Your Profile</h3>
              <p className="text-slate-600">Share your academic background, skills, and goals to build a comprehensive profile.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">AI-Powered Matching</h3>
              <p className="text-slate-600">Our advanced AI analyzes thousands of scholarships to find your perfect matches.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Get Personalized Guidance</h3>
              <p className="text-slate-600">Receive tailored application tips, essay guidance, and deadline reminders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Application Guidance Section */}
      <section id="guidance" className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-6">AI-Powered Application Guidance</h2>
              <p className="text-lg text-slate-600 mb-8">
                Get personalized tips, essay suggestions, and requirement checklists to maximize your chances of success.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Essay Writing Assistant</h3>
                    <p className="text-slate-600">AI-generated prompts and structure suggestions tailored to each scholarship's requirements.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Document Checklist</h3>
                    <p className="text-slate-600">Never miss a requirement with automatically generated checklists for each application.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-2">Profile Enhancement Tips</h3>
                    <p className="text-slate-600">Specific suggestions to strengthen your profile and increase eligibility for future opportunities.</p>
                  </div>
                </div>
              </div>

              <Link href="/dashboard">
                <Button className="mt-8 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Try Guidance Assistant
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
                alt="Students working on scholarship applications together"
                className="rounded-xl shadow-lg w-full h-auto"
              />

              <div className="absolute -bottom-6 -right-6 bg-white rounded-lg p-6 shadow-xl max-w-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800 mb-1">AI Suggestion</p>
                    <p className="text-xs text-slate-600">Consider highlighting your volunteer work in renewable energy for the Environmental Innovation Award.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Opportunities Section */}
      <section className="py-16 bg-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Discover Opportunities</h2>
            <p className="text-lg text-slate-600">Swipe left to pass, right to save for later</p>
          </div>
          
          {/* Sample Scholarship Cards */}
          <SampleOpportunityCard onStartAnalysis={scrollToProfileForm} />
        </div>
      </section>

          

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">DA</span>
                </div>
                <h3 className="text-xl font-bold text-white">Disha AI</h3>
              </div>
              <p className="text-slate-400 mb-4 leading-relaxed">Empowering students to discover and secure funding opportunities through intelligent AI matching.</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="/" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">How it Works</Link></li>
                <li><Link href="/#guidance" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">AI Matching</Link></li>
                <li><Link href="/dashboard" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Dashboard</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Scholarship Database</a></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Financial Aid Guide</a></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Essay Templates</a></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-blue-400 transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 mt-8 pt-8 text-center">
            <p className="text-slate-400">&copy; 2024 Disha AI. All rights reserved. Empowering students to achieve their educational dreams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}