import React, { useState } from 'react';
import { Camera, Calendar, Users, PieChart, Lock, Mail, MapPin, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const [authTab, setAuthTab] = useState(0);
  
  const features = [
    {
      icon: <Calendar className="text-white" size={24} />,
      title: "Event Management",
      description: "Create and manage events with ease. Set dates, locations, and reminders all in one place."
    },
    {
      icon: <Users className="text-white" size={24} />,
      title: "Attendee Tracking",
      description: "Track RSVPs, send invitations, and manage your guest list effortlessly."
    },
    {
      icon: <Calendar className="text-white" size={24} />,
      title: "Calendar Integration",
      description: "Sync with your favorite calendar apps to keep all your events organized."
    },
    {
      icon: <PieChart className="text-white" size={24} />,
      title: "Insightful Analytics",
      description: "Get detailed analytics on attendance, engagement, and event performance."
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-800">
      {/* Navigation */}
      <nav className="bg-white shadow-sm py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
            <Calendar className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Evently</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-900 font-medium">Login</button>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1">Sign Up</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 -left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              <span className="block">Plan, Manage, and</span>
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Host Amazing Events</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-lg">
              Evently simplifies event planning with powerful tools for organizers and a seamless experience for attendees.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-8 py-4 rounded-xl font-medium text-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1 flex items-center justify-center">
                Get Started <ChevronRight className="ml-2" size={20} />
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-medium text-lg hover:border-gray-400 transition duration-300 ease-in-out flex items-center justify-center">
                See how it works
              </button>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">JD</div>
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">KL</div>
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">MN</div>
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs">AB</div>
              </div>
              <span className="text-sm text-gray-600">Join 10,000+ event planners</span>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-20 rounded-3xl transform rotate-2"></div>
            <img 
              src="/api/placeholder/600/400" 
              alt="Event dashboard preview" 
              className="relative rounded-2xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-in-out"
            />
            <div className="absolute -right-4 -bottom-4 bg-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">500+ Active Events</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Why Choose</span> Evently
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create successful events, all in one platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg hover:shadow-xl p-6 transition duration-300 ease-in-out transform hover:-translate-y-2 border border-gray-100">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-20 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-3xl font-bold text-white mb-4">Ready to plan your next event?</h3>
                <p className="text-blue-100 mb-8">Join thousands of event planners using Evently to create unforgettable experiences.</p>
                <button className="bg-white text-indigo-700 px-8 py-4 rounded-xl font-medium text-lg hover:shadow-xl transition duration-300 ease-in-out">
                  Get Started Free
                </button>
              </div>
              <div className="relative">
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500 h-10 w-10 rounded-full flex items-center justify-center">
                      <MapPin className="text-white" size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium">Tech Conference 2025</h4>
                      <p className="text-blue-100 text-sm">April 15-17, San Francisco</p>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 mb-3">
                    <div className="flex justify-between">
                      <span className="text-white text-sm">Total Registrations</span>
                      <span className="text-white font-medium">349/500</span>
                    </div>
                    <div className="w-full bg-white/20 h-2 rounded-full mt-2">
                      <div className="bg-white h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Last registration: 5 minutes ago</span>
                    <span>70% full</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
              <div className="flex">
                <button 
                  className={`flex-1 py-4 text-center font-medium ${authTab === 0 ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white' : 'text-gray-600'}`}
                  onClick={() => setAuthTab(0)}
                >
                  Login
                </button>
                <button 
                  className={`flex-1 py-4 text-center font-medium ${authTab === 1 ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white' : 'text-gray-600'}`}
                  onClick={() => setAuthTab(1)}
                >
                  Create Account
                </button>
              </div>
              
              <div className="p-6">
                {authTab === 0 ? (
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-gray-400" />
                        </div>
                        <input 
                          type="email" 
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input 
                          type="password" 
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input id="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
                      </div>
                      <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800">Forgot password?</a>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-medium hover:shadow-lg transition duration-300"
                    >
                      Sign in
                    </button>
                  </form>
                ) : (
                  <form className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-gray-400" />
                        </div>
                        <input 
                          type="email" 
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input 
                          type="password" 
                          className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input id="agree-terms" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                      <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-700">
                        I agree to the <a href="#" className="text-blue-600 hover:text-blue-800">Terms</a> and <a href="#" className="text-blue-600 hover:text-blue-800">Privacy Policy</a>
                      </label>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl font-medium hover:shadow-lg transition duration-300"
                    >
                      Create Account
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center">
                  <Calendar className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">Evently</span>
              </div>
              <p className="text-gray-400 mb-4">
                The complete platform for event planning and management.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition">
                  <span className="text-lg">𝕏</span>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition">
                  <span className="text-lg">f</span>
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition">
                  <span className="text-lg">in</span>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Integrations</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Enterprise</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Event Ideas</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Legal</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Evently. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition text-sm">Cookie Settings</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white h-14 w-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};

export default LandingPage;