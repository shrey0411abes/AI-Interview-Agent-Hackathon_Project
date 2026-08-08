import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bot, LayoutDashboard, Home, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useInterviewStore } from '../../lib/store';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    aria-label={label}
    className={({ isActive }) =>
      `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50
       ${isActive
         ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
         : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
       }`
    }
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCandidate, resetInterview } = useInterviewStore();

  const handleNewSession = () => {
    resetInterview();
    navigate('/dashboard');
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-[var(--glass-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <NavLink
          to="/"
          aria-label="AI Interview Agent Home"
          className="flex items-center gap-2.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-sm text-[var(--text-primary)] hidden sm:block">
            AI Interview Agent
          </span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1" aria-label="Main Navigation">
          <NavItem to="/" icon={<Home className="w-3.5 h-3.5" />} label="Home" />
          <NavItem to="/dashboard" icon={<LayoutDashboard className="w-3.5 h-3.5" />} label="Dashboard" />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Current candidate chip */}
          <button
            onClick={handleNewSession}
            aria-label={`Start new interview for candidate ${selectedCandidate.member.name}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-lg text-xs
                       font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
          >
            <div className="w-5 h-5 rounded-md gradient-brand flex items-center justify-center text-white text-[10px] font-bold">
              {selectedCandidate.member.name.charAt(0)}
            </div>
            <span>{selectedCandidate.member.name.split(' ')[0]}</span>
            <ChevronRight className="w-3 h-3 opacity-50" />
          </button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
