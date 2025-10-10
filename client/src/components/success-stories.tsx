import { Card, CardContent } from "@/components/ui/card";

const successStories = [
  {
    name: "Sarah Chen",
    school: "Computer Science, Stanford",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200&fit=facearea&facepad=2",
    quote: "ScholarshipAI found 12 scholarships I never would have discovered. I received $45,000 in funding and graduated debt-free!",
    achievement: "$45,000 in scholarships"
  },
  {
    name: "Marcus Johnson",
    school: "Pre-Med, Howard University",
    image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200&fit=facearea&facepad=2",
    quote: "The AI guidance helped me write essays that truly stood out. I went from no scholarships to 6 awards in one semester.",
    achievement: "6 scholarship awards"
  },
  {
    name: "Elena Rodriguez",
    school: "Engineering, MIT",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200&fit=facearea&facepad=2",
    quote: "The platform's deadline tracking saved me from missing opportunities. I secured funding for all four years of college.",
    achievement: "Full tuition covered"
  }
];

export default function SuccessStories() {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
          <p className="text-xl text-blue-100">Real students, real results, real futures</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {successStories.map((story, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur border-white/20" data-testid={`story-card-${index}`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={story.image}
                    alt={`${story.name} success story portrait`}
                    className="w-12 h-12 rounded-full object-cover"
                    data-testid={`img-story-${index}`}
                  />
                  <div>
                    <p className="font-semibold text-white" data-testid={`text-name-${index}`}>
                      {story.name}
                    </p>
                    <p className="text-blue-200 text-sm" data-testid={`text-school-${index}`}>
                      {story.school}
                    </p>
                  </div>
                </div>
                <p className="text-blue-100 mb-4" data-testid={`text-quote-${index}`}>
                  "{story.quote}"
                </p>
                <div className="text-yellow-300 font-semibold" data-testid={`text-achievement-${index}`}>
                  {story.achievement}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-300 mb-2" data-testid="stat-students-helped">
              50,000+
            </div>
            <p className="text-blue-100">Students helped</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-300 mb-2" data-testid="stat-total-funding">
              $127M
            </div>
            <p className="text-blue-100">Total funding secured</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-300 mb-2" data-testid="stat-success-rate">
              94%
            </div>
            <p className="text-blue-100">Success rate</p>
          </div>
        </div>
      </div>
    </section>
  );
}
