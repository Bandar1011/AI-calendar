'use client';

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-6">
          <Image src="/calendar.svg" alt="Calendar Logo" width={48} height={48} className="mr-3" />
          <h1 className="text-4xl font-bold text-blue-900">Task Calendar</h1>
        </div>
        <p className="text-lg text-blue-700 mb-2">Your intelligent calendar assistant</p>
        <p className="text-sm text-blue-600 mb-6">Powered by AI to help you manage your schedule efficiently</p>
        <div className="flex justify-center space-x-4 mb-8">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-blue-700">Voice Commands</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-blue-700">Smart Scheduling</span>
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-blue-700">Natural Language</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
              footerActionLink: 'text-blue-500 hover:text-blue-600',
              card: 'bg-white shadow-none',
            }
          }}
        />
      </div>
    </div>
  );
} 