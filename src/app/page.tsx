"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white'>
      {/* Responsive Header */}
      <header className='sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b'>
        <div className='container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center'>
          <div className='flex items-center space-x-2'>
            <div className='w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='white'
                className='w-5 h-5'
              >
                <path
                  fillRule='evenodd'
                  d='M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm14.25 6a.75.75 0 01-.75.75H7.5v1.5h9a.75.75 0 01.75.75v3a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-9c0-.414.336-.75.75-.75h12a.75.75 0 01.75.75v3z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <span className='text-xl font-bold text-gray-800'>
              Asphere Apps
            </span>
          </div>

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className='hidden md:flex items-center space-x-6'>
            <Link
              href='/guest/login'
              className='text-gray-600 hover:text-blue-600 transition-colors font-medium'
            >
              Client Portal
            </Link>
            <Link
              href='/login'
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm md:text-base'
            >
              Sign In
            </Link>
          </nav>

          {/* Mobile Hamburger Button - Visible only on mobile */}
          <button
            className='md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 focus:outline-none'
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d={
                  isMenuOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Mobile Menu - Shows when hamburger is clicked */}
        {isMenuOpen && (
          <div className='md:hidden bg-white py-4 px-6 border-t'>
            <div className='flex flex-col space-y-4'>
              <Link
                href='/guest/login'
                className='text-gray-600 hover:text-blue-600 transition-colors font-medium py-2'
                onClick={() => setIsMenuOpen(false)}
              >
                Client Portal
              </Link>
              <Link
                href='/login'
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium text-center'
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Rest of your landing page content remains the same */}
      <section className='container mx-auto px-4 sm:px-6 py-20'>
        <div className='max-w-4xl mx-auto text-center'>
          <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6'>
            Revolutionize Your Document Tracking
          </h1>
          <p className='text-lg sm:text-xl text-gray-600 mb-10'>
            Asphere Apps provides enterprise-grade document tracking with
            real-time visibility, client collaboration, and powerful analytics -
            all in one intuitive platform.
          </p>
          <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
            <Link
              href='/login'
              className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg transition-colors font-medium text-lg text-center'
            >
              Get Started
            </Link>
            <Link
              href='#features'
              className='border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 sm:px-8 sm:py-3 rounded-lg transition-colors font-medium text-lg text-center'
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='bg-white py-16 sm:py-20'>
        <div className='container mx-auto px-4 sm:px-6'>
          <div className='max-w-3xl mx-auto text-center mb-12 sm:mb-16'>
            <h2 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-4'>
              Powerful Features for Complete Document Control
            </h2>
            <p className='text-gray-600'>
              Designed for professionals who demand efficiency, transparency,
              and actionable insights in their document workflows.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10'>
            {/* Feature 1 */}
            <div className='bg-blue-50 p-6 sm:p-8 rounded-xl'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='w-6 h-6 text-blue-600'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                Client Portal
              </h3>
              <p className='text-gray-600'>
                Provide secure, branded access for clients to view document
                status, upload files, and communicate - reducing email clutter
                and improving transparency.
              </p>
            </div>

            {/* Feature 2 */}
            <div className='bg-blue-50 p-6 sm:p-8 rounded-xl'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='w-6 h-6 text-blue-600'
                >
                  <path
                    fillRule='evenodd'
                    d='M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                Realtime Tracking
              </h3>
              <p className='text-gray-600'>
                Monitor document progress in real-time with automated status
                updates, deadline alerts, and instant notifications for all
                stakeholders.
              </p>
            </div>

            {/* Feature 3 */}
            <div className='bg-blue-50 p-6 sm:p-8 rounded-xl'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  className='w-6 h-6 text-blue-600'
                >
                  <path d='M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z' />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                Analytics & Reporting
              </h3>
              <p className='text-gray-600'>
                Gain valuable insights with customizable reports on processing
                times, team performance, document types, and client activity for
                any time period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='bg-blue-600 py-16 sm:py-20'>
        <div className='container mx-auto px-4 sm:px-6 text-center'>
          <h2 className='text-2xl sm:text-3xl font-bold text-white mb-6'>
            Ready to Transform Your Document Management?
          </h2>
          <p className='text-blue-100 mb-10 max-w-2xl mx-auto'>
            Join hundreds of professionals who have streamlined their document
            workflows with Asphere Apps. Get started in minutes.
          </p>
          <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
            <Link
              href='/login'
              className='bg-white hover:bg-gray-100 text-blue-600 px-6 py-3 sm:px-8 sm:py-3 rounded-lg transition-colors font-medium text-lg text-center'
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-gray-900 text-gray-400 py-12'>
        <div className='container mx-auto px-4 sm:px-6'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='flex items-center space-x-2 mb-6 md:mb-0'>
              <div className='w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='white'
                  className='w-5 h-5'
                >
                  <path
                    fillRule='evenodd'
                    d='M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm14.25 6a.75.75 0 01-.75.75H7.5v1.5h9a.75.75 0 01.75.75v3a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75v-9c0-.414.336-.75.75-.75h12a.75.75 0 01.75.75v3z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <span className='text-xl font-bold text-white'>Asphere Apps</span>
            </div>
            <div className='text-sm'>
              © {new Date().getFullYear()} Asphere Apps. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
