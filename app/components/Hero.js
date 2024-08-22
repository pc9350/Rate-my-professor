"use client";

import { Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './Navbar';

const AnimatedCharacterCanvas = dynamic(() => import('./AnimatedCharacterCanvas'), { ssr: false });

export default function Hero() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-indigo-900 to-purple-800">
      <Navbar />
      
      <div className="absolute inset-0 flex">
        {/* Left side - Text content */}
        <div className="w-1/2 flex flex-col justify-center px-12 z-10">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Rate Your Professors
          </h1>
          <p className="text-xl md:text-2xl text-indigo-200 mb-8">
            Discover and share insights about your educators
          </p>
          <button className="px-8 py-3 bg-indigo-600 text-white text-lg rounded-lg shadow-lg hover:bg-indigo-700 transition duration-300 w-48">
            Get Started
          </button>
        </div>
        
        {/* Right side - 3D character */}
        <div className="w-1/2 relative">
          <Suspense fallback={<div>Loading...</div>}>
            <AnimatedCharacterCanvas />
          </Suspense>
        </div>
      </div>
    </div>
  );
}