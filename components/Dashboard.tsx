
import React, { useState, useEffect, useMemo } from 'react';
import { FuzzingConfig, FuzzingReport, CoveragePoint, LogEntry, Crash } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { BugIcon } from './icons/BugIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CpuIcon } from './icons/CpuIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { ChartIcon } from './icons/ChartIcon';

interface DashboardProps {
  config: FuzzingConfig;
  simulation: FuzzingReport | null;
  onComplete: () => void;
  isLoading: boolean;
}

const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 flex items-center space-x-4">
    <div className={`p-3 rounded-md bg-${color}-900/50 border border-${color}-800`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-lg"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-gray-800 rounded-lg"></div>
      <div className="h-80 bg-gray-800 rounded-lg"></div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ config, simulation, onComplete, isLoading }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCoverage, setCurrentCoverage] = useState(0);
  const [execs, setExecs] = useState(0);
  const [crashesFound, setCrashesFound] = useState<Crash[]>([]);
  const [logHistory, setLogHistory] = useState<LogEntry[]>([]);
  const [chartData, setChartData] = useState<CoveragePoint[]>([]);

  const totalDuration = useMemo(() => config.timeBudget * 60, [config.timeBudget]);

  useEffect(() => {
    if (!simulation) return;

    const interval = 50; // ms per update
    const totalSteps = (totalDuration * 1000) / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const simulatedTime = (step / totalSteps) * simulation.totalDuration;
      setElapsedTime(simulatedTime);

      const coveragePoints = simulation.coverageTimeline.filter(p => p.time <= simulatedTime);
      const lastCoverage = coveragePoints[coveragePoints.length - 1]?.coverage || 0;
      setCurrentCoverage(lastCoverage);
      setChartData(coveragePoints);

      const currentExecs = Math.floor((simulatedTime / simulation.totalDuration) * simulation.totalExecs);
      setExecs(currentExecs);

      const newCrashes = simulation.crashes.filter(c => c.timestamp <= simulatedTime);
      setCrashesFound(newCrashes);

      const newLogs = simulation.logs.filter(l => l.time <= simulatedTime);
      setLogHistory(newLogs);

      if (simulatedTime >= simulation.totalDuration) {
        clearInterval(timer);
        onComplete();
      }
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulation, totalDuration, onComplete]);

  if (isLoading) {
    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white animate-pulse-strong">Initializing Fuzzing Environment...</h2>
                <p className="text-gray-400">The AI is generating a realistic simulation of the fuzzing process. Please wait.</p>
            </div>
            <LoadingSkeleton />
        </div>
    );
  }
  
  const formattedTime = `${Math.floor(elapsedTime / 60).toString().padStart(2, '0')}:${Math.floor(elapsedTime % 60).toString().padStart(2, '0')}`;
  const execsPerSec = execs > 0 && elapsedTime > 0 ? (execs / elapsedTime).toFixed(0) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Time Elapsed" value={formattedTime} icon={<ClockIcon className="h-6 w-6 text-blue-400" />} color="blue" />
        <MetricCard title="Coverage" value={`${currentCoverage.toFixed(2)}%`} icon={<ChartIcon className="h-6 w-6 text-emerald-400" />} color="emerald" />
        <MetricCard title="Execs / Sec" value={execsPerSec} icon={<CpuIcon className="h-6 w-6 text-amber-400" />} color="amber" />
        <MetricCard title="Crashes Found" value={crashesFound.length} icon={<BugIcon className="h-6 w-6 text-red-400" />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-white">Coverage Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="time" tickFormatter={(time) => `${Math.floor(time/60)}m`} stroke="#a1a1aa" />
              <YAxis unit="%" domain={[0, 100]} stroke="#a1a1aa" />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                labelFormatter={(time) => `Time: ${Math.floor(time/60)}m ${Math.floor(time % 60)}s`}
              />
              <defs>
                <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="coverage" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCoverage)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
            <TerminalIcon className="h-5 w-5"/>
            Fuzzer Logs
          </h3>
          <div className="font-mono text-xs text-gray-400 bg-gray-950 p-4 rounded-md overflow-y-auto flex-grow h-80">
            {logHistory.slice().reverse().map((log, index) => (
              <p key={index} className="whitespace-pre-wrap">
                <span className="text-gray-500 mr-2">[{Math.floor(log.time).toString().padStart(4, ' ')}s]</span>
                <span className={log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : 'text-gray-400'}>
                  {log.message}
                </span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
