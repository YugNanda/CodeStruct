import { useState, useEffect } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Trophy, Flame, Clock, Star, Target, BookOpen,
    ChevronRight, TrendingUp, Zap, Award, Heart,
    Calendar, Activity, BarChart3, PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart as RePieChart, Pie
} from 'recharts';

// --- Mock Data for Fallback/Preview ---
const MOCK_ACTIVITY_DATA = [
    { name: 'Mon', minutes: 45, xp: 120 },
    { name: 'Tue', minutes: 30, xp: 80 },
    { name: 'Wed', minutes: 60, xp: 150 },
    { name: 'Thu', minutes: 25, xp: 60 },
    { name: 'Fri', minutes: 90, xp: 220 },
    { name: 'Sat', minutes: 120, xp: 300 },
    { name: 'Sun', minutes: 50, xp: 110 },
];

const MOCK_CATEGORY_DATA = [
    { name: 'Sorting', value: 85, color: '#22d3ee' }, // Cyan
    { name: 'Graph', value: 45, color: '#8b5cf6' },   // Violet
    { name: 'Trees', value: 60, color: '#10b981' },   // Emerald
    { name: 'DP', value: 30, color: '#f59e0b' },      // Amber
];

export default function ProgressDashboard() {
    useDocumentTitle('Progress Dashboard');
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch data with fallback to mock data
    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            
            try {
                const token = user?.token || localStorage.getItem('token');
                // Attempt fetch
                const response = await fetch('http://localhost:5000/api/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setDashboardData(data);
                } else {
                    // Use mock data if API fails (for preview/development)
                    console.warn("API unavailable, using mock data for preview");
                    setDashboardData({
                        level: 5,
                        xp: 2450,
                        xpToNextLevel: 550,
                        xpProgress: 82,
                        currentStreak: 12,
                        longestStreak: 15,
                        totalPracticeTime: 12450, // seconds
                        totalPracticeDays: 45,
                        achievementsUnlocked: 8,
                        masteredCount: 12,
                        practicedCount: 24,
                        progressPercent: 35,
                        skillLevel: 'Intermediate',
                        favoritesCount: 5,
                        recentAchievements: [
                            { name: "Sorting Master", description: "Completed all sorting algorithms" },
                            { name: "Graph Explorer", description: "Visualized Dijkstra's Algorithm" }
                        ]
                    });
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user]);

    const formatTime = (seconds) => {
        if (!seconds) return '0s';
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (!user) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center bg-slate-950">
                <div className="text-center p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl">
                    <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                        <UserLockIcon />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-400 mb-6">Please sign in to track your progress and view analytics.</p>
                    <Link to="/signin" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-all shadow-lg shadow-cyan-500/20">
                        Sign In Now
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-lg shadow-cyan-500/20" />
                    <p className="text-cyan-500/80 font-medium animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-slate-950 relative overflow-hidden selection:bg-cyan-500/30">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-14 z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-8"
                >
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <motion.div variants={itemVariants}>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-2">
                                Dashboard
                            </h1>
                            <p className="text-slate-400 text-lg">
                                Welcome back, <span className="text-cyan-400 font-semibold">{user.name}</span>. You're doing great!
                            </p>
                        </motion.div>
                        <motion.div variants={itemVariants} className="flex gap-2">
                            <Link to="/algorithms" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-white/10 transition-all">
                                Browse Library
                            </Link>
                            <Link to="/learning-paths" className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-sm font-medium shadow-lg shadow-cyan-500/20 transition-all">
                                Resume Learning
                            </Link>
                        </motion.div>
                    </div>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Level & XP"
                            value={dashboardData?.level || 1}
                            icon={Zap}
                            color="text-amber-400"
                            gradient="from-amber-400/20 to-orange-500/20"
                            subValue={`${dashboardData?.xpProgress || 0}% to Lvl ${dashboardData?.level + 1 || 2}`}
                            progress={dashboardData?.xpProgress}
                            progressColor="bg-amber-400"
                        />
                        <StatCard
                            title="Current Streak"
                            value={`${dashboardData?.currentStreak || 0} Days`}
                            icon={Flame}
                            color="text-orange-500"
                            gradient="from-orange-500/20 to-red-600/20"
                            subValue={`Best: ${dashboardData?.longestStreak || 0} Days`}
                        />
                        <StatCard
                            title="Time Spent"
                            value={formatTime(dashboardData?.totalPracticeTime)}
                            icon={Clock}
                            color="text-cyan-400"
                            gradient="from-cyan-400/20 to-blue-500/20"
                            subValue={`${dashboardData?.totalPracticeDays || 0} Sessions`}
                        />
                        <StatCard
                            title="Achievements"
                            value={dashboardData?.achievementsUnlocked || 0}
                            icon={Trophy}
                            color="text-violet-400"
                            gradient="from-violet-400/20 to-purple-500/20"
                            subValue="View All"
                            link="/achievements"
                        />
                    </div>

                    {/* Analytics Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Activity Chart */}
                        <motion.div
                            variants={itemVariants}
                            className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-cyan-500/10">
                                        <Activity className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white">Learning Activity</h3>
                                </div>
                                <select className="bg-slate-800 border-none text-xs text-slate-400 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-cyan-500/50">
                                    <option>This Week</option>
                                    <option>Last Week</option>
                                </select>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={MOCK_ACTIVITY_DATA}>
                                        <defs>
                                            <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                        <RechartsTooltip
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="xp"
                                            stroke="#06b6d4"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorXp)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Category Mastery Pie Chart */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 rounded-lg bg-violet-500/10">
                                    <PieChart className="h-5 w-5 text-violet-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Mastery Split</h3>
                            </div>
                            
                            <div className="flex-1 min-h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={MOCK_CATEGORY_DATA}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {MOCK_CATEGORY_DATA.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                                {/* Center Text Overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-white">{dashboardData?.masteredCount || 0}</span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">Mastered</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                {MOCK_CATEGORY_DATA.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-slate-300">{item.name}</span>
                                        </div>
                                        <span className="text-slate-400 font-medium">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Section: Learning Paths & Recent Achievements */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Active Learning Path */}
                        <motion.div
                            variants={itemVariants}
                            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6 transition-all hover:border-cyan-500/30"
                        >
                            <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 blur-2xl group-hover:scale-110 transition-transform duration-500" />
                            
                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                <BookOpen className="h-5 w-5 text-cyan-400" />
                                <h3 className="text-lg font-bold text-white">Continue Learning</h3>
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-xl font-semibold text-white mb-2">Data Structures I</h4>
                                <p className="text-slate-400 text-sm mb-6">Master the fundamentals of Arrays, Linked Lists, and Stacks.</p>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                                        <span>Progress</span>
                                        <span>{dashboardData?.progressPercent || 35}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" 
                                            style={{ width: `${dashboardData?.progressPercent || 35}%` }}
                                        />
                                    </div>
                                </div>

                                <Link to="/learning-paths" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                                    Resume Path <ChevronRight size={16} />
                                </Link>
                            </div>
                        </motion.div>

                        {/* Recent Achievements */}
                        <motion.div
                            variants={itemVariants}
                            className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-amber-400" />
                                    <h3 className="text-lg font-bold text-white">Recent Unlocks</h3>
                                </div>
                                <Link to="/achievements" className="text-xs text-slate-400 hover:text-white transition-colors">
                                    View Collection
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {dashboardData?.recentAchievements?.length > 0 ? (
                                    dashboardData.recentAchievements.map((achievement, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                                                <Star className="h-5 w-5 text-amber-400" fill="currentColor" fillOpacity={0.3} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white text-sm">{achievement.name}</p>
                                                <p className="text-xs text-slate-400 line-clamp-1">{achievement.description}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 text-sm">
                                        No recent achievements. Keep practicing!
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

// --- Sub-components for Cleaner Code ---

function StatCard({ title, value, icon: Icon, color, gradient, subValue, progress, progressColor, link }) {
    const Wrapper = link ? Link : 'div';
    
    return (
        <Wrapper 
            to={link}
            className={`
                relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl
                transition-all duration-300 hover:border-white/20 hover:translate-y-[-2px] hover:shadow-xl hover:shadow-${color.split('-')[1]}-500/10
            `}
        >
            <div className={`
                absolute top-0 right-0 h-24 w-24 translate-x-8 translate-y--8 rounded-full bg-gradient-to-br ${gradient} blur-2xl opacity-50
            `} />
            
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 ${color}`}>
                        <Icon size={24} />
                    </div>
                    {progress !== undefined && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/5 text-slate-300 border border-white/5`}>
                            Lvl {Math.floor(value)}
                        </span>
                    )}
                </div>
                
                <div>
                    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
                    <p className="text-2xl font-black text-white tracking-tight">{value}</p>
                    
                    {progress !== undefined ? (
                        <div className="mt-3">
                            <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full ${progressColor} rounded-full`} 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">{subValue}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 mt-2 font-medium">{subValue}</p>
                    )}
                </div>
            </div>
        </Wrapper>
    );
}

function UserLockIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}