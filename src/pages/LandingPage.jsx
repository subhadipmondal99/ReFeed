import React, { useState } from 'react';
import { 
    Leaf, 
    ArrowRight, 
    BrainCircuit, 
    Scale, 
    HeartHandshake, 
    LineChart,
    CalendarClock,
    ChefHat,
    Utensils,
    Truck,
    Github
} from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("LandingPage Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
                    <h2>Something went wrong loading the page.</h2>
                </div>
            );
        }
        return this.props.children;
    }
}

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="group relative p-8 bg-slate-900 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl"></div>
        <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
            <Icon className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-3">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
);

const StepCircle = ({ number, icon: Icon, title, active }) => (
    <div className="flex flex-col items-center relative z-10">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-500 shadow-lg border-2 ${active ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-emerald-500/30 scale-110' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
            <Icon className="w-7 h-7" />
        </div>
        <div className="text-center">
            <div className={`text-sm font-bold tracking-wider uppercase mb-1 ${active ? 'text-emerald-400' : 'text-slate-500'}`}>Step {number}</div>
            <div className={`font-semibold ${active ? 'text-slate-100' : 'text-slate-400'}`}>{title}</div>
        </div>
    </div>
);

const LandingPage = () => {
    const [hoveredStep, setHoveredStep] = useState(0);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
            
            {}
            <nav className="fixed w-full top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <Leaf className="w-6 h-6 text-slate-950" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">Re<span className="text-emerald-400">Feed</span></span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                        <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
                        <a href="#workflow" className="hover:text-emerald-400 transition-colors">How it Works</a>
                        <a href="#impact" className="hover:text-emerald-400 transition-colors">Impact</a>
                    </div>
                    <button className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-lg transition-colors flex items-center gap-2">
                        Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            {}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Campus Canteen Food Waste Forecaster
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        Smarter Meals. <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Less Waste.
                        </span>
                    </h1>
                    
                    <p className="text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                        An end-to-end AI platform that predicts canteen meal demand, calculates precise ingredients, and automatically dispatches unavoidable surplus to local NGOs.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 text-lg">
                            Go to Dashboard <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2 text-lg">
                            Read the Docs
                        </button>
                    </div>
                </div>
            </section>

            {}
            <section id="features" className="py-24 bg-slate-950 relative border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-16 text-center">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">A Complete Sustainability Loop</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">Designed for hostel mess contractors, canteen managers, and food rescue volunteers to seamlessly collaborate.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        <FeatureCard 
                            icon={BrainCircuit}
                            title="Predict Demand"
                            description="AI-powered time-series forecasting predicts exact lunch and dinner headcount by analyzing academic calendars, weather patterns, and historical attendance."
                        />
                        <FeatureCard 
                            icon={Scale}
                            title="Prepare Efficiently"
                            description="Automatically converts predicted meal counts into exact raw grocery weights (e.g., 45kg rice, 18kg dal) to prevent over-purchasing and over-cooking."
                        />
                        <FeatureCard 
                            icon={HeartHandshake}
                            title="Rescue Surplus"
                            description="1-button broadcast trigger. If >20 meals remain unconsumed at 8:30 PM, the system instantly alerts registered local NGOs with quantity and pickup location."
                        />
                        <FeatureCard 
                            icon={LineChart}
                            title="Track Impact"
                            description="Live visual dashboard continuously tracks total kilograms of food saved and rupees conserved over the academic year, proving tangible ESG impact."
                        />
                    </div>
                </div>
            </section>

            {}
            <section id="workflow" className="py-24 bg-slate-900/50 border-t border-slate-900 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl lg:text-4xl font-bold mb-4">How ReFeed Works</h2>
                        <p className="text-slate-400 text-lg">From early morning planning to late night food rescue.</p>
                    </div>

                    <div className="relative max-w-4xl mx-auto">
                        {/* Connecting Line */}
                        <div className="absolute top-8 left-[10%] right-[10%] h-1 bg-slate-800 -z-0 hidden md:block">
                            <div className="h-full bg-gradient-to-r from-emerald-500/20 via-emerald-500 to-emerald-500/20" style={{ width: `${(hoveredStep / 3) * 100}%`, transition: 'width 0.5s ease' }}></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-4 relative z-10" onMouseLeave={() => setHoveredStep(0)}>
                            <div onMouseEnter={() => setHoveredStep(0)}>
                                <StepCircle number={1} icon={CalendarClock} title="Predict" active={hoveredStep >= 0} />
                            </div>
                            <div onMouseEnter={() => setHoveredStep(1)}>
                                <StepCircle number={2} icon={ChefHat} title="Prepare" active={hoveredStep >= 1} />
                            </div>
                            <div onMouseEnter={() => setHoveredStep(2)}>
                                <StepCircle number={3} icon={Utensils} title="Serve" active={hoveredStep >= 2} />
                            </div>
                            <div onMouseEnter={() => setHoveredStep(3)}>
                                <StepCircle number={4} icon={Truck} title="Rescue" active={hoveredStep >= 3} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {}
            <footer className="bg-slate-950 border-t border-slate-900 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Leaf className="w-5 h-5 text-emerald-500" />
                        <span className="text-xl font-bold tracking-tight">Re<span className="text-emerald-400">Feed</span></span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        Built for Campus Canteen Food Waste Forecaster & Donation Dispatcher (ML-03)
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-slate-400 hover:text-emerald-400 transition-colors">
                            <Github className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default function App() {
    return (
        <ErrorBoundary>
            <LandingPage />
        </ErrorBoundary>
    );
}