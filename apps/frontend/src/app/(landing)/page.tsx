'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-graphite-950 via-graphite-900 to-graphite-950" />

      {/* Glowing orb effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-display font-bold mb-6">
            <span className="text-gradient">Hamster Chat</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Meet new people instantly through premium 1-to-1 video chat.
            <br />
            Modern, fast, and privacy-first.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/matching" className="btn-primary text-lg px-8 py-4">
              Start Chatting
            </Link>
            <a
              href="#features"
              className="btn-secondary text-lg px-8 py-4"
            >
              Learn More
            </a>
          </div>

          {/* Features */}
          <motion.div
            id="features"
            className="mt-20 grid md:grid-cols-3 gap-6 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="glass rounded-2xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Privacy note */}
          <div className="mt-12 flex items-center justify-center gap-2 text-gray-500 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>No account required • No video recording • Privacy-first</span>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Instant Matching',
    description: 'Get connected with random people worldwide in seconds. No waiting, no hassle.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'HD Video Chat',
    description: 'Crystal clear video and audio quality. Talk face-to-face with strangers.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Privacy First',
    description: 'No accounts, no recordings, no tracking. Your conversations stay private.',
  },
];
