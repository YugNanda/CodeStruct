import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    User, Mail, Award, Clock, Activity,
    Code, BookOpen, Star, Zap, TrendingUp,
    Map, Layout, Database, CheckCircle, Calendar,
    Camera, Loader2
} from 'lucide-react';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [isUploading, setIsUploading] = useState(false);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('http://localhost:5000/api/user/profile-image', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok) {
                updateUser({ profileImage: data.profileImage });
                toast.success('Profile image updated!');
            } else {
                toast.error(data.message || 'Failed to upload image');
            }
        } catch (error) {
            toast.error('Error uploading image');
        } finally {
            setIsUploading(false);
        }
    };

    const studentInfo = {
        name: user?.name || "Student Developer",
        email: user?.email || "student@dsalab.com",
        joinDate: "Achiever",
        level: "Intermediate Visualizer",
        points: 1250,
    };

    const stats = [
        { label: 'Algorithms Viewed', value: '24', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
        { label: 'Learning Hours', value: '12.5h', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Preferred Code', value: 'C++', icon: Code, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        { label: 'Badges Earned', value: '5', icon: Award, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    ];

    const recentActivity = [
        { id: 1, name: "Dijkstra's Algorithm", category: 'Graph', date: '2 hours ago', icon: Map, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { id: 2, name: 'Quick Sort', category: 'Sorting', date: 'Yesterday', icon: Layout, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { id: 3, name: 'A* Search', category: 'Graph Pathfinding', date: '3 days ago', icon: Database, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    ];

    const progressData = [
        { name: 'Sorting Algorithms', progress: 85, color: 'bg-blue-500' },
        { name: 'Graph Algorithms', progress: 40, color: 'bg-purple-500' },
        { name: 'Search Algorithms', progress: 100, color: 'bg-emerald-500' },
        { name: 'Dynamic Programming', progress: 15, color: 'bg-rose-500' },
    ];

    const badges = [
        { name: "Sorting Master", desc: "Viewed all sort algorithms", icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
        { name: "Graph Beginner", desc: "First graph traversed", icon: Map, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        { name: "Fast Learner", desc: "Viewed 5 algorithms in a day", icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10" },
        { name: "Streak: 7 Days", desc: "Logged in for 7 days", icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-400/10" },
        { name: "Code Explorer", desc: "Viewed 3 different language codes", icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="min-h-screen bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl -z-10 animation-delay-2000"></div>

            <motion.div
                className="max-w-6xl mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >

                <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-800/50 backdrop-blur-xl">
                    <div className="h-32 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 relative">
                        <div className="absolute inset-0 bg-black/20" />
                    </div>
                    <div className="px-6 pb-6">
                        <div className="relative flex justify-between items-end -mt-12 mb-4">
                            <div className="flex items-end space-x-5">
                                <label className="relative h-24 w-24 rounded-full border-4 border-slate-900 bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl cursor-pointer group overflow-hidden">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={isUploading} />
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    ) : user?.profileImage ? (
                                        <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-white uppercase shadow-sm">
                                            {studentInfo.name.charAt(0)}
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white mb-1" />
                                        <span className="text-[10px] text-white font-medium uppercase">Change</span>
                                    </div>
                                    <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 z-10" title="Online" />
                                </label>
                                <div className="pb-2">
                                    <h1 className="text-3xl font-bold text-white tracking-tight">{studentInfo.name}</h1>
                                    <p className="text-slate-400 flex items-center gap-2 mt-1">
                                        <Mail size={16} /> {studentInfo.email}
                                    </p>
                                </div>
                            </div>

                            <div className="hidden sm:flex flex-col items-end pb-2">
                                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">Total Points</div>
                                <div className="text-3xl font-extrabold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                                    <Star size={24} className="text-yellow-400 fill-yellow-400" />
                                    {studentInfo.points}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Award size={14} /> {studentInfo.level}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Calendar size={14} /> Member since 2024
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle size={14} /> Profile Verified
                            </span>
                        </div>
                    </div>
                </motion.div>


                <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="p-5 rounded-xl border border-white/5 bg-slate-800/40 backdrop-blur-md hover:bg-slate-800/60 transition-colors">
                            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                                <stat.icon size={20} />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                        </div>
                    ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    <div className="lg:col-span-2 space-y-6">


                        <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/5 bg-slate-800/40 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <TrendingUp className="text-cyan-400" size={24} />
                                    Learning Progress
                                </h2>
                            </div>
                            <div className="space-y-5">
                                {progressData.map((item, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm font-medium mb-2">
                                            <span className="text-slate-300">{item.name}</span>
                                            <span className="text-white">{item.progress}%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.progress}%` }}
                                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + idx * 0.1 }}
                                                className={`h-full ${item.color} relative`}
                                            >
                                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-gradient-to-r from-transparent to-white/20" />
                                            </motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>


                        <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/5 bg-slate-800/40 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Award className="text-yellow-400" size={24} />
                                    Achievements & Badges
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {badges.map((badge, idx) => (
                                    <div key={idx} className="flex flex-col items-center p-4 rounded-xl bg-slate-900/50 border border-white/5 text-center hover:border-white/10 transition-colors">
                                        <div className={`w-12 h-12 rounded-full ${badge.bg} ${badge.color} flex items-center justify-center mb-3 shadow-lg`}>
                                            <badge.icon size={24} />
                                        </div>
                                        <h4 className="text-white font-semibold text-sm">{badge.name}</h4>
                                        <p className="text-slate-400 text-xs mt-1">{badge.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                    </div>


                    <div className="space-y-6">


                        <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/5 bg-slate-800/40 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="text-blue-400" size={24} />
                                    Recent Activity
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 rounded-lg hover:bg-slate-800/60 transition-colors group cursor-pointer border border-transparent hover:border-white/5">
                                        <div className={`min-w-[40px] h-10 rounded-lg ${activity.bg} ${activity.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <activity.icon size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-sm font-semibold">{activity.name}</h4>
                                            <p className="text-slate-400 text-xs mt-1">Viewed {activity.category}</p>
                                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-2 block">{activity.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-4 py-2 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10">
                                View All Activity →
                            </button>
                        </motion.div>


                        <motion.div variants={itemVariants} className="p-6 rounded-xl border border-white/5 bg-gradient-to-br from-blue-600/20 to-cyan-500/20 backdrop-blur-md">
                            <h3 className="text-lg font-semibold text-white mb-2">Want to customize?</h3>
                            <p className="text-sm text-slate-300 mb-4">Update your profile information and preferences in the settings page.</p>
                            <button className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition-all outline-none border-none">
                                Edit Profile
                            </button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
