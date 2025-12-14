import React from 'react';
import { Activity, LayoutDashboard, Database } from 'lucide-react';

interface LayoutProps {
  activeTab: 'dashboard' | 'pipeline' | 'knowledge';
  setActiveTab: (tab: 'dashboard' | 'pipeline' | 'knowledge') => void;
  children?: React.ReactNode;
}

export const Layout = ({ activeTab, setActiveTab, children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 z-20 shadow-xl">
        {/* Header */}
        <div className="h-20 flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            </div>
            <span className="text-xl font-bold tracking-wider text-white group-hover:text-blue-400 transition-colors">ORBITAL-X</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-medium ${
              activeTab === 'dashboard'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
            }`}
          >
            <Activity size={20} className={activeTab === 'dashboard' ? 'text-blue-400' : 'text-gray-500'} />
            <span>Agent Monitor</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-medium ${
              activeTab === 'pipeline'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
            }`}
          >
            <LayoutDashboard size={20} className={activeTab === 'pipeline' ? 'text-blue-400' : 'text-gray-500'} />
            <span>RFP Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all duration-200 font-medium ${
              activeTab === 'knowledge'
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
            }`}
          >
            <Database size={20} className={activeTab === 'knowledge' ? 'text-blue-400' : 'text-gray-500'} />
            <span>Knowledge Base</span>
          </button>
        </nav>
        
        {/* Footer Removed */}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-gray-950 relative custom-scrollbar">
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};