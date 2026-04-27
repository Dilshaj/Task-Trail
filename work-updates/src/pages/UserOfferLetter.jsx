import React from 'react';
import Layout from '../components/Layout';
import { FileText, Download, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { downloadOfferLetter } from '../services/offerLetterService';

const UserOfferLetter = () => {
    const { user } = useAuth();
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDownload = async () => {
        const empId = user?.employee_id || user?.employeeId;
        if (empId) {
            setIsDownloading(true);
            try {
                await downloadOfferLetter(empId);
            } finally {
                setIsDownloading(false);
            }
        } else {
            alert('Employee ID not found. Please contact HR.');
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <FileText className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    My Offer Letter
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Download and view your official employment confirmation document.</p>
            </div>

            <div className="max-w-xl mx-auto mt-12">
                <div className="card-modern p-10 flex flex-col items-center text-center space-y-6 animate-fade-in-up">
                    <div className="h-20 w-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                        <FileText className="h-10 w-10" />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Employment Offer Letter</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed px-4">
                            Your official offer letter is available for download. This document serves as a confirmation of your role and terms of employment.
                        </p>
                    </div>

                    <div className="flex flex-col w-full gap-3 pt-4">
                        <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex items-center justify-center gap-3 w-full rounded-xl btn-gradient px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isDownloading ? (
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download className="h-5 w-5" />
                            )}
                            {isDownloading ? 'Preparing PDF...' : 'Download Offer Letter (PDF)'}
                        </button>

                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                            <ShieldCheck className="h-3 w-3" />
                            Secured & Official Document
                        </div>
                    </div>
                </div>

                <div className="mt-8 p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                        Need Help?
                    </h4>
                    <p className="text-xs text-blue-700/70 dark:text-blue-400/70 leading-relaxed">
                        If you notice any discrepancies in your offer letter or are unable to download it, please contact the HR department or raise a support ticket.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default UserOfferLetter;
