import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, X, RotateCw, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

const FaceVerificationModal = ({ isOpen, onClose, onVerified, mode = 'verify' }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [status, setStatus] = useState('Initializing...'); // 'Initializing', 'Scanning', 'Success', 'Error'
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const loadModels = async () => {
            try {
                setStatus('Loading models...');
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
                setStatus('Ready');
            } catch (err) {
                console.error('Failed to load models:', err);
                setError('Failed to load face detection models. Please check your connection.');
                setStatus('Error');
            }
        };

        if (isOpen) {
            loadModels();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setError(null);
            setStatus('Starting camera...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
                setStatus('Scanning face...');
            }
        } catch (err) {
            console.error('Camera access denied:', err);
            setError('Camera access denied. Face verification is mandatory.');
            setStatus('Error');
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    useEffect(() => {
        if (modelsLoaded && isOpen && !isCameraActive) {
            startCamera();
        }
    }, [modelsLoaded, isOpen, isCameraActive]);

    const captureAndVerify = async () => {
        if (!videoRef.current || isProcessing) return;

        setIsProcessing(true);
        setStatus('Scanning face...');
        setError(null);

        try {
            // Detect single face with landmarks and descriptor
            const detection = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                // Check if multiple faces are present (using detectAllFaces for error handling)
                const allDetections = await faceapi.detectAllFaces(
                    videoRef.current,
                    new faceapi.TinyFaceDetectorOptions()
                );
                
                if (allDetections.length > 1) {
                    setError('Multiple faces detected. Please ensure only you are in the frame.');
                } else {
                    setError('Face not detected. Please ensure your face is clearly visible.');
                }
                setIsProcessing(false);
                return;
            }

            // Success!
            setStatus('Face matched ✅');
            
            // Convert Float32Array to regular array for JSON serialization
            const descriptor = Array.from(detection.descriptor);
            
            // Wait a bit to show success message
            setTimeout(() => {
                onVerified(descriptor);
                onClose();
            }, 1000);

        } catch (err) {
            console.error('Verification error:', err);
            setError('An error occurred during verification. Please try again.');
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                            {mode === 'register' ? 'Register Face' : 'Face Verification'}
                        </h3>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Camera Container */}
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {!isCameraActive && !error && (
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                            <RotateCw className="h-8 w-8 animate-spin" />
                            <p className="text-sm font-medium">{status}</p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
                        onPlay={() => setIsCameraActive(true)}
                    />

                    {/* Scanning Overlay */}
                    {isCameraActive && !error && !isProcessing && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-[15%] border-2 border-indigo-500/50 rounded-3xl">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-indigo-500/30 animate-scan"></div>
                            </div>
                        </div>
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {status.includes('✅') ? (
                            <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
                                <UserCheck className="h-3 w-3" />
                                {status}
                            </div>
                        ) : error ? (
                            <div className="bg-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-shake">
                                <AlertTriangle className="h-3 w-3" />
                                Error
                            </div>
                        ) : isCameraActive && (
                            <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                                <Camera className="h-3 w-3 animate-pulse" />
                                Live
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Controls */}
                <div className="p-6">
                    {error ? (
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-4 rounded-2xl mb-6">
                            <p className="text-rose-600 dark:text-rose-400 text-sm font-medium flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                {error}
                            </p>
                            <button 
                                onClick={startCamera}
                                className="mt-3 text-xs font-bold text-rose-700 dark:text-rose-300 underline hover:no-underline"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <div className="text-center mb-6">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {isProcessing ? 'Analyzing your face...' : 'Position your face in the center of the frame.'}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={captureAndVerify}
                            disabled={!isCameraActive || isProcessing || !!error}
                            className={`flex-[2] py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                !isCameraActive || isProcessing || !!error
                                    ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed shadow-none'
                                    : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 active:scale-95'
                            }`}
                        >
                            {isProcessing ? (
                                <RotateCw className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Camera className="h-5 w-5" />
                                    {mode === 'register' ? 'Capture & Register' : 'Capture & Verify'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0%, 100% { top: 15%; }
                    50% { top: 85%; }
                }
                .animate-scan {
                    animation: scan 3s ease-in-out infinite;
                    position: absolute;
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            ` }} />
        </div>
    );
};

export default FaceVerificationModal;
