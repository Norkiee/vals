'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf5f0] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Photos arrangement */}
      <div className="relative w-full max-w-xl h-72 md:h-96 -mb-24">
        {/* Left photo */}
        <div className="absolute left-8 md:left-16 top-8 -rotate-12 z-10">
          <div className="animate-float-simple">
            <div className="w-48 md:w-60 aspect-square relative">
              <Image
                src="/photo.png"
                alt="Photo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Center music card */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20">
          <div className="animate-float-simple-delayed">
            <div className="w-52 md:w-64 aspect-square relative">
              <Image
                src="/music.png"
                alt="Music"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right photo */}
        <div className="absolute right-8 md:right-16 top-12 rotate-12 z-10">
          <div className="animate-float-simple-slow">
            <div className="w-48 md:w-60 aspect-square relative">
              <Image
                src="/photo1.png"
                alt="Photo"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <h1
        className="font-loveheart text-7xl md:text-9xl text-amber-600 mb-[18px] text-center"
        style={{
          WebkitTextStroke: '4.5px white',
          textShadow: '3px 3px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        ASK CUTER
      </h1>

      {/* CTA Button */}
      <Link
        href="/create"
        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
      >
        Create your valentine
      </Link>

      {/* Heart decoration */}
      <div className="absolute bottom-8 left-8 text-red-400 opacity-60">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
    </main>
  )
}
