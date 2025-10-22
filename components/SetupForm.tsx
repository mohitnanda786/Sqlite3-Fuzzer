
import React, { useState } from 'react';
import type { FuzzingConfig } from '../types';
import { PlayIcon } from './icons/PlayIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TargetIcon } from './icons/TargetIcon';

interface SetupFormProps {
  onStart: (config: FuzzingConfig) => void;
  error: string | null;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart, error }) => {
  const [binaryName, setBinaryName] = useState('sqlite3');
  const [dbName, setDbName] = useState<string | undefined>(undefined);
  const [timeBudget, setTimeBudget] = useState(60);
  const [cpuCores, setCpuCores] = useState(4);
  const [memoryLimit, setMemoryLimit] = useState(2048);
  const [coverageTarget, setCoverageTarget] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onStart({
      binaryName,
      dbName,
      timeBudget,
      cpuCores,
      memoryLimit,
      coverageTarget,
    });
  };
  
  const FileInput: React.FC<{id: string, label: string, fileName?: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({id, label, fileName, onChange}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      <label htmlFor={id} className="cursor-pointer bg-gray-800 border-2 border-dashed border-gray-700 rounded-lg p-4 flex items-center justify-center hover:border-emerald-500 transition-colors">
        <div className="text-center">
            <UploadIcon className="mx-auto h-8 w-8 text-gray-500"/>
            <p className="mt-2 text-sm text-gray-400">
                <span className="font-semibold text-emerald-400">Click to upload</span> or drag and drop
            </p>
            {fileName ? (
                <p className="text-xs text-gray-300 mt-1">{fileName}</p>
            ) : (
                <p className="text-xs text-gray-500 mt-1">No file selected</p>
            )}
        </div>
      </label>
      <input id={id} type="file" className="sr-only" onChange={onChange}/>
    </div>
  );

  return (
    <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-emerald-900/50 p-3 rounded-lg border border-emerald-800">
          <TargetIcon className="h-8 w-8 text-emerald-400"/>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Configure Fuzzing Run</h2>
          <p className="text-gray-400">Specify the target and testing parameters to begin.</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FileInput id="sqlite-binary" label="SQLite3 Binary" fileName={binaryName} onChange={(e) => setBinaryName(e.target.files?.[0]?.name ?? 'sqlite3')} />
          <FileInput id="sqlite-db" label="Seed Database (Optional)" fileName={dbName} onChange={(e) => setDbName(e.target.files?.[0]?.name)} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
           <div>
            <label htmlFor="timeBudget" className="block text-sm font-medium text-gray-400">Time Budget (minutes)</label>
            <input type="number" id="timeBudget" value={timeBudget} onChange={(e) => setTimeBudget(parseInt(e.target.value, 10))} className="mt-2 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-3" />
          </div>
          <div>
            <label htmlFor="coverageTarget" className="block text-sm font-medium text-gray-400">Coverage Target (%)</label>
            <input type="number" id="coverageTarget" value={coverageTarget} onChange={(e) => setCoverageTarget(parseInt(e.target.value, 10))} min="1" max="100" className="mt-2 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-3" />
          </div>
          <div>
            <label htmlFor="cpuCores" className="block text-sm font-medium text-gray-400">CPU Cores</label>
            <input type="number" id="cpuCores" value={cpuCores} onChange={(e) => setCpuCores(parseInt(e.target.value, 10))} min="1" className="mt-2 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-3" />
          </div>
          <div>
            <label htmlFor="memoryLimit" className="block text-sm font-medium text-gray-400">Memory Limit (MB)</label>
            <input type="number" id="memoryLimit" value={memoryLimit} onChange={(e) => setMemoryLimit(parseInt(e.target.value, 10))} min="128" className="mt-2 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm p-3" />
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={isSubmitting} className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed transition-colors">
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Simulation...
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5"/>
                Start Fuzzing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SetupForm;
