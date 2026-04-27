import eduLogo from '../pages/edu-logo.png';
import eduHeading from '../pages/edu-heading.png';

const PageLoader = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
            {/* Progress Loading Bar at Top */}
            <div className="loading-progress-bar"></div>

            {/* Animated Logo Intro */}
            <div className="animate-logo flex flex-col items-center">
                <img src={eduLogo} alt="Eduprova Logo" className="w-24 h-24 mb-6 object-contain drop-shadow-lg" />

                <img src={eduHeading} alt="Eduprova" className="h-10 w-auto tracking-widest" />
                <p className="text-sm font-medium text-[#475569] mt-3 tracking-widest uppercase opacity-70">
                    Management Platform
                </p>
            </div>

            {/* Professional subtle loading animation below logo */}
            <div className="mt-8 flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
        </div>
    );
};

export default PageLoader;
