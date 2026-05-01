import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            {/* Animated Premium Background Gradients */}
            <div className="fixed top-[-10%] left-[-5%] w-[45%] h-[45%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-float-slow"></div>
            <div className="fixed bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-cyan-400/10 dark:bg-cyan-400/5 rounded-full blur-[120px] pointer-events-none animate-float-slow" style={{ animationDelay: '2s' }}></div>
            <div className="fixed top-[30%] left-[50%] w-[35%] h-[35%] bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none animate-float-slow" style={{ animationDelay: '4s' }}></div>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-md lg:hidden transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-hidden lg:pl-64 w-full relative z-10">
                <Navbar onMenuClick={() => setIsMobileMenuOpen(true)} />
                <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 smooth-scroll animate-fade-in-up flex flex-col relative" id="main-content">
                    <div className="flex-1">
                        {children}
                    </div>
                    {/* Professional Footer */}
                    <footer className="mt-12 pt-6 border-t border-slate-200/40 dark:border-slate-800 text-center flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <p>&copy; {new Date().getFullYear()} Eduprova. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Privacy Policy</a>
                            <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">Terms of Service</a>
                        </div>
                    </footer>
                </main>

                {/* Scroll to Top Button */}
                <button
                    onClick={() => document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 p-3 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] text-white shadow-hover transition-transform hover:scale-110 z-50 micro-interaction"
                    title="Scroll to Top"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default Layout;
