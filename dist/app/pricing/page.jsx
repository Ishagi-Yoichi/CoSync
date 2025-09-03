'use client';
import Link from 'next/link';
export default function PricingPage() {
    return (<main className="min-h-screen bg-black text-white px-4 md:px-12 py-12">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
        Choose Your Plan
      </h1>
      <p className="text-center text-gray-400 mb-12">
        Simple and transparent pricing for every team size.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Free Plan */}
        <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold mb-2">Free</h2>
          <p className="text-gray-400 mb-6">Get started with basic features</p>
          <div className="text-3xl font-bold mb-6">$0<span className="text-base font-normal text-gray-400"> /month</span></div>
          <ul className="space-y-3 mb-6">
            <li>✅ Unlimited public rooms</li>
            <li>✅ Basic code collaboration</li>
            <li>✅ 1 active room at a time</li>
          </ul>
          <Link href="/signup" className="block bg-white text-black text-center rounded-xl py-2 font-semibold hover:bg-gray-300 transition">
            Get Started
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-blue-600 rounded-2xl p-8 bg-gray-900 hover:shadow-2xl transition relative">
          <div className="absolute -top-4 right-4 bg-blue-600 text-sm text-white px-3 py-1 rounded-full">Most Popular</div>
          <h2 className="text-2xl font-bold mb-2">Pro</h2>
          <p className="text-gray-400 mb-6">Perfect for growing teams</p>
          <div className="text-3xl font-bold mb-6">$9<span className="text-base font-normal text-gray-400"> /month</span></div>
          <ul className="space-y-3 mb-6">
            <li>✅ Unlimited rooms</li>
            <li>✅ Private rooms</li>
            <li>✅ Team collaboration</li>
            <li>✅ Priority support</li>
          </ul>
          <Link href="/signup" className="block bg-blue-600 text-white text-center rounded-xl py-2 font-semibold hover:bg-blue-700 transition">
            Upgrade Now
          </Link>
        </div>

        {/* Enterprise Plan */}
        <div className="border border-gray-700 rounded-2xl p-8 bg-gray-900 hover:shadow-xl transition">
          <h2 className="text-2xl font-bold mb-2">Enterprise</h2>
          <p className="text-gray-400 mb-6">Custom solution for large teams</p>
          <div className="text-3xl font-bold mb-6">Custom</div>
          <ul className="space-y-3 mb-6">
            <li>✅ All Pro features</li>
            <li>✅ Dedicated support</li>
            <li>✅ SSO integration</li>
            <li>✅ SLA & custom contracts</li>
          </ul>
          <Link href="/contact" className="block bg-white text-black text-center rounded-xl py-2 font-semibold hover:bg-gray-300 transition">
            Contact Sales
          </Link>
        </div>
      </div>
    </main>);
}
