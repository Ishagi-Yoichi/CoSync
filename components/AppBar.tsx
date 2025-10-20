
"use client";
import { useState } from "react";

export default function AppBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
    <div className="bg-black border border-white p-4 flex justify-between items-center mt-4 sm:mt-7 rounded-3xl mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="font-bold text-lg sm:text-xl bg-gradient-to-r from-blue-400 via-white to-blue-600 inline-block text-transparent bg-clip-text">
            CoSync
        </div>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4">
            <a href='' className="text-white hover:text-blue-400 transition">Features</a>
            <a href="/pricing" className="text-white hover:text-blue-400 transition">Pricing</a>
            <a href='%' className="text-white hover:text-blue-400 transition">About</a>
        </div>

        {/* Mobile Menu Button */}
        <button 
            className="md:hidden text-white hover:text-blue-400 transition"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
            </svg>
        </button>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-black border border-white border-t-0 rounded-b-3xl p-4 mt-2 mx-4 md:hidden z-50">
                <div className="flex flex-col space-y-3">
                    <a href='' className="text-white hover:text-blue-400 transition py-2">Features</a>
                    <a href="/pricing" className="text-white hover:text-blue-400 transition py-2">Pricing</a>
                    <a href='%' className="text-white hover:text-blue-400 transition py-2">About</a>
                </div>
            </div>
        )}
    </div>);
}