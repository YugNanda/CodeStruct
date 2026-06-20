import { Link } from 'react-router-dom';
import { Github, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:px-10 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">

          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">
              DSA Visualizer Project
            </h3>
            <p className="text-sm leading-relaxed max-w-xs">
              Open Source for Learners. Interactive visualizations for Data Structures and Algorithms to help you master the fundamentals.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://github.com/Yugnanda"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github size={20} />
              </a>
              {/* Added as placeholder for future social links, kept hidden or minimal if not needed */}
              {/* <a href="#" className="text-slate-400 hover:text-white transition-colors duration-200"><Twitter size={20} /></a> */}
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm hover:text-blue-400 transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/algorithms" className="text-sm hover:text-blue-400 transition-colors duration-200">
                  Algorithms
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm hover:text-blue-400 transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Community
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/sanglaphalder/DSA-Visualizer/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-blue-400 transition-colors duration-200"
                >
                  Report an Issue
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/sanglaphalder/DSA-Visualizer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-blue-400 transition-colors duration-200"
                >
                  Star on GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-6 py-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-center md:text-left">
            &copy; {currentYear} DSA Visualizer Project. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500" />
            <span>for learners worldwide.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
