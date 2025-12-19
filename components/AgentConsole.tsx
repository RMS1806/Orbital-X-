import React, { useEffect, useRef } from 'react';

interface AgentConsoleProps {
  logs?: string[];
}

export function AgentConsole({ logs = [] }: AgentConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden flex flex-col h-full shadow-2xl">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
        <span className="text-xs font-mono text-gray-400">_ SYSTEM_TERMINAL.LOG</span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
        </div>
      </div>
      
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 text-left">
        {logs.length === 0 && (
          <span className="text-gray-600 italic">
            {'>'} System Ready. Awaiting Agent Activation...
          </span>
        )}
        
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-gray-500 shrink-0 min-w-[60px]">
              {log.match(/\[(.*?)\]/)?.[0] || '[-]'}
            </span>
            <span className={`${
              log.includes('Price') ? 'text-green-400' : 
              log.includes('Error') ? 'text-red-400' : 
              'text-blue-300'
            }`}>
              {log.replace(/\[(.*?)\]/, '').trim()}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
