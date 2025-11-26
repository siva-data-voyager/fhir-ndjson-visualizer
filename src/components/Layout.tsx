/**
 * Layout Component
 *
 * Main application shell with header, footer, and content area.
 * Includes theme toggle and attribution.
 */

import { ReactNode } from 'react';
import { Moon, Sun, Database, ExternalLink } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                <Database className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  FHIR NDJSON Visualizer
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Explore Synthea US Core Data
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>

              {/* GitHub link placeholder */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <span>Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* Footer with attribution */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
            <p>
              <strong className="text-gray-700 dark:text-gray-300">
                Created by Siva Komaragiri
              </strong>{' '}
              (Data Voyager Team)
            </p>
            <div className="flex items-center gap-4">
              <span>FHIR R4 · US Core 6.1.0</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">Client-side only</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
            <strong>Disclaimer:</strong> This tool is for data exploration and educational purposes only.
            Not a medical device. Not for clinical decision-making.
            All processing occurs locally in your browser—no data is transmitted externally.
          </p>
        </div>
      </div>
    </div>
  );
}
