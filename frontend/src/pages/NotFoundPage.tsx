import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="pt-14 flex-1 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="font-heading text-[120px] font-bold gradient-text leading-none mb-4 select-none">
          404
        </div>
        <h1 className="font-heading text-2xl font-bold text-[var(--text-primary)] mb-2">
          Page not found
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 gradient-brand text-white
                       px-6 py-3 rounded-xl text-sm font-semibold hover:scale-105 transition-transform"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 glass px-6 py-3 rounded-xl
                       text-sm font-semibold text-[var(--text-primary)] hover:scale-105 transition-transform"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  </div>
);

export default NotFoundPage;
