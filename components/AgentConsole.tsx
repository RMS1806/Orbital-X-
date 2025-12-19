import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface AgentConsoleProps {
  logs: LogEntry[];
}

export function AgentConsole({ logs }: AgentConsoleProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black border border-gray-800 rounded-xl h-[calc(100vh-6rem)] flex flex-col shadow-2xl overflow-hidden font-mono text-xs ring-1 ring-white/5">
      {/* Header Section */}
      <div className="bg-gray-900 p-3 border-b border-gray-800 flex justify-between items-center">
        <span className="text-gray-400 flex items-center gap-2 font-bold uppercase tracking-wider">
          <Terminal size={14} className="text-green-500" />
          System_Terminal.log
        </span>
        <div className="flex gap-1.5 opacity-50">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/90 text-left">
        {logs.length === 0 && (
          <span className="text-gray-600 animate-pulse block text-center mt-10">
            &gt;&gt; SYSTEM IDLE. WAITING FOR INPUT...
          </span>
        )}
        
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 group">
            <span className="text-gray-600 shrink-0 font-mono opacity-50 select-none">
              [{log.timestamp}]
            </span>
            <div className="flex-1 break-words">
              <span
                className={`font-bold mr-2 uppercase tracking-wide ${
                  log.agent === 'RFP-ID-AGENT'
                    ? 'text-blue-400'
                    : log.agent === 'MATCH-AGENT'
                    ? 'text-purple-400'
                    : log.agent === 'PRICING-AGENT'
                    ? 'text-green-400'
                    : log.agent === 'WRITER-AGENT'
                    ? 'text-yellow-400'
                    : 'text-gray-400'
                }`}
              >
                {log.agent}
              </span>
              <span
                className={`font-mono ${
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'warning'
                    ? 'text-yellow-300'
                    : log.type === 'success'
                    ? 'text-green-300'
                    : 'text-gray-300'
                }`}
              >
                {log.message}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
