import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { LifeBuoy, Shield, Users, Clock, Gift, TrendingUp, Wallet, Phone, Mail, MapPin, MessageSquare } from 'lucide-react';
import PublicLayout from '../components/layouts/PublicLayout';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If user is authenticated, redirect to dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
              Your Journey to Financial Freedom Starts Here
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-primary-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Join our community-driven thrift platform and experience a secure way to save for your future while earning attractive returns. Create multiple thrift accounts to maximize your savings potential.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/auth/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 md:py-4 md:text-lg md:px-10"
                >
                  Get Started
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/about"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 md:py-4 md:text-lg md:px-10"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">50%</div>
              <div className="mt-2 text-sm text-gray-500">Return on Investment</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">₦2K</div>
              <div className="mt-2 text-sm text-gray-500">Minimum Weekly Contribution</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">52</div>
              <div className="mt-2 text-sm text-gray-500">Weeks Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">5+</div>
              <div className="mt-2 text-sm text-gray-500">Foodstuff Benefits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div id="features" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Why Choose Honest Minds?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Our platform offers numerous benefits to help you save smartly and build a secure financial future.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">50% Return on Investment</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Receive your total contribution plus 50% profit at maturity after 52 weeks of consistent saving.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Multiple Thrift Accounts</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Create and manage multiple thrift accounts simultaneously. Start with as little as ₦2,000 weekly per account and make payments at your convenience, even in advance.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Secure Platform</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Your contributions across all thrift accounts are safe with us, backed by transparent processes and account management.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Referral Benefits</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Earn rewards by referring others to join our growing community of savers. The more thrift accounts you manage, the more opportunities to earn.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                    <Gift className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Foodstuff Benefits</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Users with 5 or more thrift accounts receive foodstuff and provisions, adding extra value to your savings journey.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div className="flow-root bg-white rounded-lg px-6 pb-8">
                <div className="-mt-6">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-500 rounded-md shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Easy Management</h3>
                  <p className="mt-5 text-base text-gray-500">
                    Our platform provides an intuitive dashboard to track all your thrift accounts, contributions, balances, and benefits in one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Join our thrift platform in a few simple steps and start your journey toward financial security.
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  1
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Sign Up</h3>
                <p className="mt-2 text-base text-gray-500">
                  Create your account and complete your profile with basic information and bank details. You can create multiple thrift accounts after registration.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Sign up fees: ₦3,000 per thrift account</p>
                  <p>Minimum weekly contribution: ₦2,000</p>
                  <p>You can pay in advance or according to your schedule</p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  2
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Make Weekly Contributions</h3>
                <p className="mt-2 text-base text-gray-500">
                  Contribute weekly to your thrift account(s) for 52 weeks to complete the cycle.
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  3
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Track Your Progress</h3>
                <p className="mt-2 text-base text-gray-500">
                  Monitor your contributions, balance, and benefits through your personalized dashboard.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Monitor your total balance</p>
                  <p>Track contributions weekly</p>
                  <p>View referral earnings</p>
                  <p>Check December Foodie status</p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white mx-auto">
                  4
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Enjoy Your Returns</h3>
                <p className="mt-2 text-base text-gray-500">
                  At maturity (52 weeks), receive your contributions plus the promised returns.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Receive your total contribution + 50% profit</p>
                  <p>Plus foodstuff and provisions for users with 5+ thrifts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to Start Saving?</span>
            <span className="block text-primary-200">Join thousands of members who are already building their financial future with Honest Minds.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Contact Us
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Have questions? We're here to help. Reach out to our team for assistance.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Our Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-primary-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Phone Numbers</h4>
                    <p className="mt-1 text-sm text-gray-500">08060132364, 07064507263</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Users className="h-6 w-6 text-primary-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Contact Person</h4>
                    <p className="mt-1 text-sm text-gray-500">Dr. Honest Ameh</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-primary-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Address</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      House 13, Pengassan Estate Phase 1, Lokogoma, Abuja, Nigeria
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Wallet className="h-6 w-6 text-primary-600 mt-1" />
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Bank Information</h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Bank Name: UBA<br />
                      Account Name: Honest Minds Global Ventures<br />
                      Account Number: 1028003352
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="https://wa.me/2348060132364"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Join our WhatsApp Group
                </Link>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h3>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <LifeBuoy className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold">Honest Minds</span>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Bringing smiles to every household through our community-driven contribution platform.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Quick Links</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <Link href="/#features" className="text-base text-gray-300 hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-base text-gray-300 hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/#contact" className="text-base text-gray-300 hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-base text-gray-300 hover:text-white">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-base text-gray-300 hover:text-white">
                    Log In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Our Vision</h3>
              <p className="mt-4 text-base text-gray-300">
                Making saving easy and flexible through community-driven contribution to bring smiles to every household.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Connect With Us</h3>
              <div className="mt-4">
                <Link
                  href="https://wa.me/2348060132364"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Join our WhatsApp Group
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              © {new Date().getFullYear()} Honest Minds Global Ventures. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}
