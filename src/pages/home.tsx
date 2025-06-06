import Link from 'next/link';
import { LifeBuoy, ArrowRight, Users, Calendar, Coins, ShieldCheck, Sparkles, Phone, Mail, MapPin, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const Home = () => {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop",
      alt: "People saving money together"
    },
    {
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2011&auto=format&fit=crop",
      alt: "Financial planning meeting"
    },
    {
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
      alt: "Team collaboration"
    },
    {
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
      alt: "Business success"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <LifeBuoy size={28} className="text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-primary-600">Honest Minds</h1>
            </div>
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/about" className="text-primary-600 hover:text-primary-500">
                Learn more about us
              </Link>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </nav>
            <div className="md:hidden">
              {user ? (
                <Link
                  href="/dashboard"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="md:flex md:items-center md:space-x-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your Journey to Financial Freedom Starts Here
              </h2>
              <p className="text-xl text-primary-50 max-w-lg mb-8">
                Join our community-driven thrift platform and experience a secure way to save for your future while earning attractive returns. Create multiple thrift accounts to maximize your savings potential.
              </p>
              {!user && (
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  <Link
                    href="/register"
                    className="bg-white text-primary-600 px-8 py-4 rounded-lg font-medium hover:bg-primary-50 text-center text-lg transition-colors"
                  >
                    Get Started
                  </Link>
                  <Link href="/about" className="text-primary-600 hover:text-primary-500">
                    Learn more about us
                  </Link>
                </div>
              )}
            </div>
            <div className="md:w-1/2">
              <motion.div 
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative h-[500px]">
                  {slides.map((slide, index) => (
                    <motion.div
                      key={index}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: currentSlide === index ? 1 : 0,
                        x: currentSlide === index ? 0 : 100
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          console.error('Image failed to load');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </motion.div>
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent rounded-2xl"></div>
                  
                  {/* Navigation Buttons */}
                  <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>

                  {/* Slide Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {slides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentSlide === index ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">50%</div>
              <div className="text-gray-600">Return on Investment</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">₦2K</div>
              <div className="text-gray-600">Minimum Weekly Contribution</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">52</div>
              <div className="text-gray-600">Weeks Duration</div>
            </motion.div>
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-primary-600 mb-2">5+</div>
              <div className="text-gray-600">Foodstuff Benefits</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Honest Minds?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform offers numerous benefits to help you save smartly and build a secure financial future.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                <Coins size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">50% Return on Investment</h3>
              <p className="text-gray-600 text-lg">
                Receive your total contribution plus 50% profit at maturity after 52 weeks of consistent saving.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                <Calendar size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Multiple Thrift Accounts</h3>
              <p className="text-gray-600 text-lg">
                Create and manage multiple thrift accounts simultaneously. Start with as little as ₦2,000 weekly per account and make payments at your convenience, even in advance.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Secure Platform</h3>
              <p className="text-gray-600 text-lg">
                Your contributions across all thrift accounts are safe with us, backed by transparent processes and account management.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Referral Benefits</h3>
              <p className="text-gray-600 text-lg">
                Earn rewards by referring others to join our growing community of savers. The more thrift accounts you manage, the more opportunities to earn.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                <Calendar size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Foodstuff Benefits</h3>
              <p className="text-gray-600 text-lg">
                Users with 5 or more thrift accounts receive foodstuff and provisions, adding extra value to your savings journey.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="h-14 w-14 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 mb-6">
                <Sparkles size={28} />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Easy Management</h3>
              <p className="text-gray-600 text-lg">
                Our platform provides an intuitive dashboard to track all your thrift accounts, contributions, balances, and benefits in one place.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join our thrift platform in a few simple steps and start your journey toward financial security.
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary-200 transform -translate-x-1/2"></div>

            {/* Step 1 */}
            <motion.div 
              className="relative md:flex md:items-center mb-16 md:mb-32"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0 md:text-right">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Sign Up</h3>
                <p className="text-gray-600 text-lg">
                  Create your account and complete your profile with basic information and bank details. You can create multiple thrift accounts after registration.
                </p>
              </div>
              <div className="hidden md:flex md:items-center md:justify-center absolute left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
              </div>
              <div className="md:w-1/2 md:pl-12">
                <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
                  <p className="text-gray-600 text-lg font-medium">
                    Sign up fees: ₦3,000 per thrift account
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="relative md:flex md:items-center mb-16 md:mb-32"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0 order-2 md:order-1">
                <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
                  <p className="text-gray-600 text-lg font-medium">
                    Minimum weekly contribution: ₦2,000
                  </p>
                  <p className="text-gray-600 text-lg mt-2">
                    You can pay in advance or according to your schedule
                  </p>
                </div>
              </div>
              <div className="hidden md:flex md:items-center md:justify-center absolute left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
              </div>
              <div className="md:w-1/2 md:pl-12 order-1 md:order-2 md:text-left">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Make Weekly Contributions</h3>
                <p className="text-gray-600 text-lg">
                  Contribute weekly to your thrift account(s) for 52 weeks to complete the cycle.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="relative md:flex md:items-center mb-16 md:mb-32"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0 md:text-right">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Track Your Progress</h3>
                <p className="text-gray-600 text-lg">
                  Monitor your contributions, balance, and benefits through your personalized dashboard.
                </p>
              </div>
              <div className="hidden md:flex md:items-center md:justify-center absolute left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
              </div>
              <div className="md:w-1/2 md:pl-12">
                <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
                  <ul className="text-gray-600 text-lg space-y-3">
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-600 rounded-full mr-3"></span>
                      Monitor your total balance
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-600 rounded-full mr-3"></span>
                      Track contributions weekly
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-600 rounded-full mr-3"></span>
                      View referral earnings
                    </li>
                    <li className="flex items-center">
                      <span className="h-2 w-2 bg-primary-600 rounded-full mr-3"></span>
                      Check December Foodie status
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Step 4 */}
            <motion.div 
              className="relative md:flex md:items-center"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="md:w-1/2 md:pr-12 mb-8 md:mb-0 order-2 md:order-1">
                <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
                  <p className="text-gray-600 text-lg font-medium">
                    Receive your total contribution + 50% profit
                  </p>
                  <p className="text-gray-600 text-lg mt-2">
                    Plus foodstuff and provisions for users with 5+ thrifts
                  </p>
                </div>
              </div>
              <div className="hidden md:flex md:items-center md:justify-center absolute left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
                  4
                </div>
              </div>
              <div className="md:w-1/2 md:pl-12 order-1 md:order-2 md:text-left">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Enjoy Your Returns</h3>
                <p className="text-gray-600 text-lg">
                  At maturity (52 weeks), receive your contributions plus the promised returns.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Saving?</h2>
            <p className="text-primary-100 text-xl max-w-2xl mx-auto mb-10">
              Join thousands of members who are already building their financial future with Honest Minds.
            </p>
            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-lg font-medium hover:bg-primary-50 text-lg transition-colors"
              >
                Get Started Now
                <ArrowRight size={20} className="ml-2" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to our team for assistance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Our Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Phone size={24} className="text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-900 font-medium text-lg">Phone Numbers</p>
                      <p className="text-gray-600 text-lg">08060132364, 07064507263</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Users size={24} className="text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-900 font-medium text-lg">Contact Person</p>
                      <p className="text-gray-600 text-lg">Dr. Honest Ameh</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <MapPin size={24} className="text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-900 font-medium text-lg">Address</p>
                      <p className="text-gray-600 text-lg">House 13, Pengassan Estate Phase 1, Lokogoma, Abuja, Nigeria</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <Mail size={24} className="text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-gray-900 font-medium text-lg">Bank Information</p>
                      <p className="text-gray-600 text-lg">Bank Name: UBA</p>
                      <p className="text-gray-600 text-lg">Account Name: Honest Minds Global Ventures</p>
                      <p className="text-gray-600 text-lg">Account Number: 1028003352</p>
                    </div>
                  </div>
                </div>
                <div className="mt-8">
                  <a
                    href="https://chat.whatsapp.com/HllVnjobFYIJMcJsvHWq5N"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 text-lg transition-colors"
                  >
                    <MessageCircle size={24} className="mr-2" />
                    Join our WhatsApp Group
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <form className="bg-white rounded-xl p-8 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Send us a Message</h3>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg text-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center">
                <LifeBuoy size={28} className="text-primary-400" />
                <h3 className="ml-2 text-2xl font-bold text-primary-400">Honest Minds</h3>
              </div>
              <p className="mt-6 text-gray-400 text-lg">
                Bringing smiles to every household through our community-driven contribution platform.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-4">
                <li><a href="#features" className="text-gray-400 hover:text-white text-lg transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white text-lg transition-colors">How It Works</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white text-lg transition-colors">Contact Us</a></li>
                {!user && (
                  <>
                    <li><Link href="/auth/register" className="text-gray-400 hover:text-white text-lg transition-colors">Sign Up</Link></li>
                    <li><Link href="/auth/login" className="text-gray-400 hover:text-white text-lg transition-colors">Log In</Link></li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6">Our Vision</h3>
              <p className="text-gray-400 text-lg">
                Making saving easy and flexible through community-driven contribution to bring smiles to every household.
              </p>
              <div className="mt-6">
                <a
                  href="https://chat.whatsapp.com/HllVnjobFYIJMcJsvHWq5N"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-400 hover:text-white text-lg transition-colors"
                >
                  <MessageCircle size={24} className="mr-2" />
                  Join our WhatsApp Group
                </a>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-lg">
            <p>&copy; {new Date().getFullYear()} Honest Minds Global Ventures. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
