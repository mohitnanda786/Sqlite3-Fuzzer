
import React, { useState, useCallback } from 'react';
import { FuzzingConfig, FuzzingReport, AppState } from './types';
import Header from './components/Header';
import SetupForm from './components/SetupForm';
import Dashboard from './components/Dashboard';
import ReportView from './components/ReportView';
import { generateFuzzingSimulation } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [config, setConfig] = useState<FuzzingConfig | null>(null);
  const [report, setReport] = useState<FuzzingReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleStartFuzzing = useCallback(async (newConfig: FuzzingConfig) => {
    setConfig(newConfig);
    setAppState('running');
    setIsLoading(true);
    setError(null);
    try {
      const simulationResult = await generateFuzzingSimulation(newConfig);
      setReport(simulationResult);
    } catch (e) {
      setError('Failed to generate fuzzing simulation. Please try again.');
      setAppState('setup');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRunComplete = () => {
    setAppState('report');
  };

  const handleReset = () => {
    setAppState('setup');
    setConfig(null);
    setReport(null);
    setError(null);
  };

  const renderContent = () => {
    switch (appState) {
      case 'setup':
        return <SetupForm onStart={handleStartFuzzing} error={error} />;
      case 'running':
        return (
          <Dashboard
            config={config!}
            simulation={report}
            onComplete={handleRunComplete}
            isLoading={isLoading}
          />
        );
      case 'report':
        return <ReportView report={report!} config={config!} onReset={handleReset} />;
      default:
        return <div>Invalid state</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
