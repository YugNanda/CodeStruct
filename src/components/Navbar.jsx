import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Braces, User, LogOut, ChevronDown, Trophy, BookOpen, Heart, BarChart3, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useVisualizerTheme } from '../context/VisualizerThemeContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/algorithms', label: 'Algorithms' },
  { to: '/cheatsheet', label: 'Cheatsheet' },
  { to: '/progress', label: 'My Progress', icon: BarChart3 },
  { to: '/contact', label: 'Contact Us' },
];

const userNavLinks = [
  { to: '/profile', label: 'My Profile', icon: User },
  
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/learning-paths', label: 'Learning Paths', icon: BookOpen },
  { to: '/favorites', label: 'Favorites', icon: Heart },
];

function NavLink({ to, label, isActive, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative group py-2 px-1"
    >
      <span
        className={`transition-colors duration-300 ${isActive
          ? 'text-white'
          : 'text-slate-400 group-hover:text-white'
          }`}
      >
        {label}
      </span>

      {isActive && (
        <motion.span
          layoutId="activeLink"
          className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}

      <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-gradient-to-r from-blue-500/0 to-cyan-400/0 group-hover:from-blue-500/40 group-hover:to-cyan-400/40 transition-all duration-300" />
    </Link>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { colorMode, toggleColorMode, soundEnabled, toggleSoundEffects } = useVisualizerTheme();
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const MotionDiv = motion.div;
  const MotionSpan = motion.span;
  const MotionButton = motion.button;

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-slate-900/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-2 group" onClick={closeMobile}>
          <MotionDiv
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2"
          >
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25">
              <Braces size={16} className="text-white" strokeWidth={2.5} />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            </span>

            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              DSA LAB
            </span>
          </MotionDiv>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium text-sm">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              label={link.label}
              isActive={location.pathname === link.to}
            />
          ))}

          <a
            href="https://github.com/Yugnanda"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Star
          </a>

          {/* Dark/Light toggle */}
          <button
            onClick={toggleColorMode}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
            aria-label="Toggle dark/light mode"
            title={colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait">
              {colorMode === 'dark' ? (
                <MotionSpan
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Sun size={16} />
                </MotionSpan>
              ) : (
                <MotionSpan
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={16} />
                </MotionSpan>
              )}
            </AnimatePresence>
          </button>

          {/* Sound toggle */}
          <button
            onClick={toggleSoundEffects}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
            aria-label="Toggle sound effects"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          >
            <AnimatePresence mode="wait">
              {soundEnabled ? (
                <MotionSpan
                  key="vol"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  <Volume2 size={16} />
                </MotionSpan>
              ) : (
                <MotionSpan
                  key="mute"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  <VolumeX size={16} />
                </MotionSpan>
              )}
            </AnimatePresence>
          </button>

          {user ? (
            <div className="relative ml-4" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-2 pr-3 py-1 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white focus:outline-none"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/25 uppercase overflow-hidden">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name ? user.name.charAt(0) : user?.email ? user.email.charAt(0) : 'U'
                  )}
                </div>
                <ChevronDown size={14} className={`transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-xl backdrop-blur-xl"
                  >
                    <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                      <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      {userNavLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setProfileOpen(false)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          <link.icon size={16} />
                          {link.label}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={() => {
                          logout();
                          setProfileOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-white/10 hover:text-red-300"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-4">
              <Link
                to="/signin"
                className="rounded-full px-4 py-2 text-sm font-bold text-slate-300 transition-all hover:text-white active:scale-95"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <MotionButton
          whileTap={{ scale: 0.9 }}
          onClick={toggleMobile}
          className="md:hidden relative z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <MotionSpan
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={20} />
              </MotionSpan>
            ) : (
              <MotionSpan
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={20} />
              </MotionSpan>
            )}
          </AnimatePresence>
        </MotionButton>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <MotionDiv
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/5 bg-slate-900/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map((link, i) => (
                <MotionDiv
                  key={link.to}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.07, duration: 0.25 }}
                >
                  <Link
                    to={link.to}
                    onClick={closeMobile}
                    className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${location.pathname === link.to
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    {location.pathname === link.to && (
                      <span className="mr-3 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    )}
                    {link.label}
                  </Link>
                </MotionDiv>
              ))}

              {user && (
                <>
                  <div className="my-2 border-t border-white/10" />
                  {userNavLinks.map((link, i) => (
                    <MotionDiv
                      key={link.to}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: (navLinks.length + i) * 0.07, duration: 0.25 }}
                    >
                      <Link
                        to={link.to}
                        onClick={closeMobile}
                        className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${location.pathname === link.to
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        <link.icon size={16} />
                        {link.label}
                      </Link>
                    </MotionDiv>
                  ))}
                </>
              )}

              {user ? (
                <MotionDiv
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: (navLinks.length + userNavLinks.length + 0.5) * 0.07, duration: 0.25 }}
                >
                  <button
                    onClick={() => {
                      logout();
                      closeMobile();
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-white/5 hover:text-red-300"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </MotionDiv>
              ) : (
                <MotionDiv
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navLinks.length * 0.07, duration: 0.25 }}
                  className="flex flex-col gap-2 mt-2"
                >
                  <Link
                    to="/signin"
                    onClick={closeMobile}
                    className="flex justify-center items-center rounded-lg px-4 py-3 text-sm font-medium text-slate-300 border border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMobile}
                    className="flex justify-center items-center rounded-lg px-4 py-3 text-sm font-medium text-white bg-blue-600 transition-all hover:bg-blue-500"
                  >
                    Sign Up
                  </Link>
                </MotionDiv>
              )}

              <MotionDiv
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: (navLinks.length + (user ? userNavLinks.length : 0) + 1) * 0.07, duration: 0.25 }}
              >
                <a
                  href="https://github.com/Yugnanda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Star on GitHub
                </a>

                {/* Dark/Light toggle (mobile) */}
                <button
                  onClick={toggleColorMode}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  {colorMode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {colorMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
              </MotionDiv>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </nav>
  );
}
