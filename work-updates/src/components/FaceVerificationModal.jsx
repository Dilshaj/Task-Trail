import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, X, RotateCw, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

let modelsPromise = null;

const loadModelsGlobal = () => {
    if (modelsPromise) return modelsPromise;
    const LOCAL_MODEL_URL = '/models';
    modelsPromise = Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(LOCAL_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(LOCAL_MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(LOCAL_MODEL_URL)
    ]).catch(err => {
        console.error('Failed to load local models, trying CDN fallback...', err);
        const CDN_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        return Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(CDN_MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(CDN_MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(CDN_MODEL_URL)
        ]);
    });
    return modelsPromise;
};

const FaceVerificationModal = ({ isOpen, onClose, onVerified, mode = 'verify' }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const livenessStateRef = useRef('waiting_open');

    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [status, setStatus] = useState('Initializing...'); // 'Initializing', 'Scanning', 'Success', 'Error'
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [livenessState, setLivenessState] = useState('waiting_open');
    const [faceDetected, setFaceDetected] = useState(false);
    const latestDetectionRef = useRef(null);

    const updateLivenessState = (newState) => {
        livenessStateRef.current = newState;
        setLivenessState(newState);
    };

    const getDistance = (p1, p2) => {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };

    const calculateEAR = (eye) => {
        if (!eye || eye.length < 6) return 0;
        const vertical1 = getDistance(eye[1], eye[5]);
        const vertical2 = getDistance(eye[2], eye[4]);
        const horizontal = getDistance(eye[0], eye[3]);
        return (vertical1 + vertical2) / (2.0 * horizontal);
    };

    const captureSnapshot = () => {
        if (!videoRef.current) return null;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoRef.current.videoWidth || 640;
        tempCanvas.height = videoRef.current.videoHeight || 480;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        return tempCanvas.toDataURL('image/jpeg', 0.85);
    };

    useEffect(() => {
        let isMounted = true;
        const loadModels = async () => {
            try {
                await loadModelsGlobal();
                if (isMounted) {
                    setModelsLoaded(true);
                    setStatus('Ready');
                }
            } catch (err) {
                console.error('Failed to load face api models:', err);
                if (isMounted) {
                    setError('Failed to load face detection models. Please check your connection.');
                    setStatus('Error');
                }
            }
        };

        if (isOpen) {
            // Reset all verification states when opening the modal
            setIsProcessing(false);
            setFaceDetected(false);
            updateLivenessState('waiting_open');
            setError(null);
            setStatus(modelsLoaded ? 'Ready' : 'Initializing...');
            latestDetectionRef.current = null;

            loadModels();
        } else {
            stopCamera();
        }

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [isOpen]);

    const startCamera = async () => {
        try {
            setError(null);
            setStatus('Starting camera...');
            updateLivenessState('waiting_open');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            // Check if component has been unmounted or closed during user permission prompt
            if (!isOpen || !videoRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            
            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            setIsCameraActive(true);
            setStatus('Scanning face...');
        } catch (err) {
            console.error('Camera access denied:', err);
            setError('Camera access denied. Face verification is mandatory.');
            setStatus('Error');
        }
    };

    const stopCamera = () => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }
        if (streamRef.current) {
            const tracks = streamRef.current.getTracks();
            tracks.forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    };

    useEffect(() => {
        if (modelsLoaded && isOpen && !isCameraActive) {
            startCamera();
        }
    }, [modelsLoaded, isOpen, isCameraActive]);

    const runDetection = async () => {
        if (!videoRef.current || !modelsLoaded) return;
        
        try {
            const detection = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
            ).withFaceLandmarks().withFaceDescriptor();

            if (canvasRef.current && videoRef.current) {
                const displaySize = { 
                    width: videoRef.current.videoWidth || 640, 
                    height: videoRef.current.videoHeight || 480 
                };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                if (detection) {
                    setFaceDetected(true);
                    latestDetectionRef.current = {
                        descriptor: Array.from(detection.descriptor),
                        snapshot: captureSnapshot()
                    };

                    const resizedDetection = faceapi.resizeResults(detection, displaySize);
                    
                    // Clear canvas before drawing
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, displaySize.width, displaySize.height);
                    
                    faceapi.draw.drawDetections(canvasRef.current, resizedDetection);
                    faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetection);

                    const landmarks = detection.landmarks;
                    const leftEye = landmarks.getLeftEye();
                    const rightEye = landmarks.getRightEye();
                    
                    const leftEAR = calculateEAR(leftEye);
                    const rightEAR = calculateEAR(rightEye);
                    const avgEAR = (leftEAR + rightEAR) / 2.0;

                    // State machine logic
                    if (livenessStateRef.current === 'waiting_open') {
                        if (avgEAR > 0.22) {
                            updateLivenessState('waiting_closed');
                        }
                    } else if (livenessStateRef.current === 'waiting_closed') {
                        if (avgEAR < 0.21) {
                            updateLivenessState('waiting_open_again');
                        }
                    } else if (livenessStateRef.current === 'waiting_open_again') {
                        if (avgEAR > 0.22) {
                            updateLivenessState('verified');
                            
                            // Success!
                            setStatus('Face matched ✅');
                            setIsProcessing(true);

                            const descriptor = latestDetectionRef.current.descriptor;
                            const snapshot = latestDetectionRef.current.snapshot;

                            // Small delay for UI animation feedback
                            setTimeout(() => {
                                stopCamera();
                                onVerified(descriptor, snapshot);
                                onClose();
                            }, 800);
                            return; // exit execution loop
                        }
                    }
                } else {
                    setFaceDetected(false);
                    latestDetectionRef.current = null;
                    // Reset if face is lost
                    updateLivenessState('waiting_open');
                }
            }
        } catch (err) {
            console.error('Detection error:', err);
        }

        if (streamRef.current && livenessStateRef.current !== 'verified') {
            setTimeout(() => {
                if (streamRef.current && livenessStateRef.current !== 'verified') {
                    animationFrameIdRef.current = requestAnimationFrame(runDetection);
                }
            }, 80);
        }
    };

    const handleManualCapture = () => {
        if (!latestDetectionRef.current || isProcessing) return;
        
        setIsProcessing(true);
        updateLivenessState('verified');
        setStatus('Face matched ✅');
        
        const descriptor = latestDetectionRef.current.descriptor;
        const snapshot = latestDetectionRef.current.snapshot;
        
        // Small delay for UI animation feedback
        setTimeout(() => {
            stopCamera();
            onVerified(descriptor, snapshot);
            onClose();
        }, 500);
    };

    const handleVideoPlay = () => {
        setIsCameraActive(true);
        setStatus('Scanning face...');
        updateLivenessState('waiting_open');
        animationFrameIdRef.current = requestAnimationFrame(runDetection);
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
                        onPlay={handleVideoPlay}
                    />

                    {/* Canvas overlay for landmarks/detections */}
                    {isCameraActive && (
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />
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
                            {isCameraActive && !error && (
                                <div className="flex flex-col items-center gap-2 animate-fade-in">
                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                                        Liveness Verification
                                    </span>
                                    <div className="flex items-center gap-2 justify-center">
                                        {livenessState === 'waiting_open' && (
                                            <p className="text-slate-700 dark:text-slate-200 text-sm font-semibold animate-pulse">
                                                👀 Step 1: Open your eyes and look at the camera
                                            </p>
                                        )}
                                        {livenessState === 'waiting_closed' && (
                                            <p className="text-amber-600 dark:text-amber-400 text-sm font-semibold animate-pulse">
                                                😉 Step 2: Blink your eyes now
                                            </p>
                                        )}
                                        {livenessState === 'waiting_open_again' && (
                                            <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold animate-pulse">
                                                🔄 Step 3: Open your eyes to complete scan
                                            </p>
                                        )}
                                        {livenessState === 'verified' && (
                                            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold animate-bounce">
                                                ✅ Scan Complete!
                                            </p>
                                        )}
                                    </div>
                                    {faceDetected && livenessState !== 'verified' && (
                                        <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-bold mt-1 uppercase tracking-wider animate-pulse">
                                            ⚡ Or click "Capture Face" below to skip blinking
                                        </p>
                                    )}
                                    {/* Premium step visualizer */}
                                    <div className="flex gap-1.5 mt-2 justify-center w-24">
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                            livenessState !== 'waiting_open' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700 animate-pulse'
                                        }`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                            livenessState === 'waiting_open_again' || livenessState === 'verified' ? 'bg-indigo-600' : (livenessState === 'waiting_closed' ? 'bg-slate-300 dark:bg-slate-600 animate-pulse' : 'bg-slate-200 dark:bg-slate-700')
                                        }`} />
                                        <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                            livenessState === 'verified' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                        }`} />
                                    </div>
                                </div>
                            )}
                            {!isCameraActive && !error && (
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    Preparing liveness check...
                                </p>
                            )}
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
                            onClick={handleManualCapture}
                            disabled={!faceDetected || isProcessing}
                            className={`flex-[2] py-3.5 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                                faceDetected && !isProcessing
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer transform active:scale-95'
                                    : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <ShieldCheck className={`h-5 w-5 ${faceDetected && !isProcessing ? 'text-white' : 'text-slate-400 dark:text-slate-500 animate-pulse'}`} />
                            {isProcessing ? 'Processing...' : (faceDetected ? 'Capture Face' : 'Scanning Face...')}
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
