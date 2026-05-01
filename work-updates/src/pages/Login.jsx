import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Sun, Moon, User as UserIcon } from 'lucide-react';
import { changePassword } from '../services/authService';
import eduLogo from '../pages/edu-logo.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [loginMode, setLoginMode] = useState('admin');
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [tempUser, setTempUser] = useState(null);

    const { signIn } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await signIn(
                loginMode === 'admin' ? email : null,
                loginMode === 'user' ? employeeId : null,
                password
            );
            if (user.isFirstLogin && user.role === 'admin') {
                setTempUser(user);
                setShowChangePassword(true);
                setIsLoading(false);
            } else {
                setTimeout(() => {
                    if (user.role === 'admin') navigate('/admin');
                    else navigate('/dashboard');
                }, 800);
            }
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await changePassword(tempUser.token, newPass);
            setTimeout(() => {
                navigate('/admin');
            }, 800);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-500">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[140px] animate-float-slow"></div>
                <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-cyan-400/10 dark:bg-cyan-400/5 rounded-full blur-[140px] animate-float-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-float-slow" style={{ animationDelay: '4s' }}></div>

                {/* Floating Particles */}
                {[...Array(12)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute h-1 w-1 bg-primary/30 rounded-full animate-float-particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 15}s`,
                            animationDuration: `${10 + Math.random() * 10}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Theme Toggle Button */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-slate-800 shadow-xl text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:-translate-y-1 active:scale-95 transition-all duration-300"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
            </div>

            <div className="w-full max-w-md glass-card rounded-2xl p-8 relative z-10 animate-fade-in-up border border-white/60 shadow-xl">


                <div className="space-y-2 mb-8">
                    <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">Sign in to continue to the platform.</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 animate-pulse-soft">
                        {error}
                    </div>
                )}

                {showChangePassword ? (
                    <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-2 mb-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                This is your first time logging in. For security purposes, please set a new password before accessing the dashboard.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">New Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                                <input
                                    type="password"
                                    required
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm outline-none input-focus-glow dark:text-white placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-2xl bg-gradient-to-r from-[#5B8DEF] to-[#67E8F9] py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group btn-glow"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Set New Password'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        {loginMode === 'admin' ? (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 focus:border-[#5B8DEF] dark:text-white placeholder:text-slate-400"
                                        placeholder="dilshajceo@dilshajinfotech.tech"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Employee ID</label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                                    <input
                                        type="text"
                                        required
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full rounded-[14px] border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm outline-none transition-all duration-300 focus:ring-4 focus:ring-blue-500/10 focus:border-[#5B8DEF] dark:text-white placeholder:text-slate-400"
                                        placeholder="e.g. EMP001"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                <button type="button" className="text-xs font-semibold text-primary hover:text-primary/80 transition">Forgot Password?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 transition-colors group-focus-within:text-primary" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 pl-11 pr-4 py-3 text-sm outline-none input-focus-glow dark:text-white placeholder:text-slate-400"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-2xl bg-gradient-to-r from-[#5B8DEF] to-[#67E8F9] py-4 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group btn-glow"
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </>
                            )}
                        </button>
                    </form>
                )}

                {!showChangePassword && (
                    <div className="mt-10 pt-8 border-t border-slate-200/50 dark:border-slate-800 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Don't have an account? <button className="font-bold text-primary hover:text-primary/80 transition">Sign Up</button>
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button
                                type="button"
                                onClick={() => { setLoginMode('admin'); setError(''); setPassword(''); }}
                                className={`flex flex-col items-center gap-1 rounded-2xl border ${loginMode === 'admin' ? 'border-primary bg-primary/5 dark:bg-primary/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'} py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300`}
                            >
                                <span>Admin Login</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginMode('user'); setError(''); setPassword(''); }}
                                className={`flex flex-col items-center gap-1 rounded-2xl border ${loginMode === 'user' ? 'border-primary bg-primary/5 dark:bg-primary/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50'} py-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300`}
                            >
                                <span>User Login</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
