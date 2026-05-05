import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { Calendar, Mail, Shield, Edit2, Check, X, Camera, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { updateProfile } from '../services/profileService';
import { changePassword } from '../services/authService';

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const { employees, refreshEmployees } = useTasks();
    const fileInputRef = useRef(null);

    // Support logic for users mapping to employees info mock data
    const employeeData = employees?.find(e => e.id === user?.id) || user;

    const [isEditMode, setIsEditMode] = useState(false);
    const [isPasswordMode, setIsPasswordMode] = useState(false);
    
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        joining_date: user?.joiningDate || '',
        profile_image: null
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [previewImage, setPreviewImage] = useState(user?.avatar || employeeData?.avatar);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleEditToggle = () => {
        if (!isEditMode) {
            setEditData({
                name: user?.name || '',
                email: user?.email || '',
                joining_date: user?.joiningDate || '',
                profile_image: null
            });
            setPreviewImage(user?.avatar || employeeData?.avatar);
            setIsPasswordMode(false);
        }
        setIsEditMode(!isEditMode);
        setMessage({ type: '', text: '' });
    };

    const handlePasswordToggle = () => {
        setIsPasswordMode(!isPasswordMode);
        if (!isPasswordMode) {
            setIsEditMode(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
        setMessage({ type: '', text: '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleImageClick = () => {
        if (isEditMode) {
            fileInputRef.current.click();
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditData(prev => ({ ...prev, profile_image: file }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (!passwordData.currentPassword) {
            setMessage({ type: 'error', text: 'Current password is required.' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsPasswordMode(false);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!editData.name.trim()) {
            setMessage({ type: 'error', text: 'Name is required.' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editData.email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address.' });
            return;
        }

        if (editData.joining_date) {
            const joinDate = new Date(editData.joining_date);
            if (joinDate > new Date()) {
                setMessage({ type: 'error', text: 'Joining date cannot be in the future.' });
                return;
            }
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('name', editData.name);
            formData.append('email', editData.email);
            formData.append('joining_date', editData.joining_date);
            if (editData.profile_image) {
                formData.append('profile_image', editData.profile_image);
            }

            const response = await updateProfile(formData);

            const updatedUser = { ...response.user };
            updateUser(updatedUser);
            await refreshEmployees(); // Update admin state with latest API response

            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditMode(false);
            setPreviewImage(updatedUser.avatar);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Profile</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account details and profile information.</p>
                </div>
                <div className="flex items-center gap-3">
                    {!isEditMode && !isPasswordMode && (
                        <>
                            <button
                                onClick={handlePasswordToggle}
                                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                            >
                                <Lock className="h-4 w-4" />
                                Change Password
                            </button>
                            <button
                                onClick={handleEditToggle}
                                className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 px-4 py-2 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-sm"
                            >
                                <Edit2 className="h-4 w-4" />
                                Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-2xl mx-auto mt-4 w-full">
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 sm:p-10 flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in-up stagger-1 relative overflow-hidden">

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                            {message.type === 'success' ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    {isPasswordMode ? (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Security Settings</h3>
                                    <p className="text-xs text-slate-500">Update your account password regularly.</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Current Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all pr-12"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => togglePasswordVisibility('current')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.new ? "text" : "password"}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all pr-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => togglePasswordVisibility('new')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPasswords.confirm ? "text" : "password"}
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all pr-12"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => togglePasswordVisibility('confirm')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-100 dark:shadow-none transition flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check className="h-5 w-5" />
                                        )}
                                        Update Password
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handlePasswordToggle}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        <X className="h-5 w-5" />
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group cursor-pointer" onClick={handleImageClick}>
                                    <img
                                        src={previewImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random&color=fff&bold=true`}
                                        alt={user?.name}
                                        className={`h-32 w-32 rounded-full border-4 ${isEditMode ? 'border-indigo-400' : 'border-slate-50 dark:border-slate-800'} mb-4 shadow-md object-cover transition-all`}
                                    />
                                    {isEditMode && (
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="h-8 w-8" />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>
                                {isEditMode ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={editData.name}
                                        onChange={handleChange}
                                        className="text-center text-2xl font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-white mb-2"
                                        placeholder="Enter your name"
                                    />
                                ) : (
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{user?.name}</h3>
                                )}
                                <span className="text-sm font-medium capitalize text-blue-700 dark:text-indigo-300 bg-blue-50 dark:bg-indigo-900/40 px-4 py-1.5 rounded-full mt-1 border border-blue-100 dark:border-indigo-800">
                                    {employeeData?.role || user?.role}
                                </span>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800 w-full">
                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700"><Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" /></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                                        {isEditMode ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={editData.email}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                                required
                                            />
                                        ) : (
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{user?.email}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700"><Shield className="h-5 w-5 text-slate-500 dark:text-slate-400" /></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Access Level</p>
                                        <span className="font-medium capitalize text-slate-700 dark:text-slate-200">{user?.role} Access</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700"><Calendar className="h-5 w-5 text-slate-500 dark:text-slate-400" /></div>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5">Joined Date</p>
                                        {isEditMode ? (
                                            <input
                                                type="date"
                                                name="joining_date"
                                                value={editData.joining_date}
                                                onChange={handleChange}
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                            />
                                        ) : (
                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isEditMode && (
                                <div className="mt-10 flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition flex items-center justify-center gap-2 disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check className="h-5 w-5" />
                                        )}
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEditToggle}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        <X className="h-5 w-5" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default UserProfile;
