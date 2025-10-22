import React, { useState, useEffect } from 'react';
import type { FuzzingReport, Crash, FuzzingConfig, CrashAnalysis } from '../types';
import { RefreshIcon } from './icons/RefreshIcon';
import { BugIcon } from './icons/BugIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { FolderDownloadIcon } from './icons/FolderDownloadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ExclamationCircleIcon } from './icons/ExclamationCircleIcon';
import { ClipboardCopyIcon } from './icons/ClipboardCopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { analyzeCrash } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { DownloadIcon } from './icons/DownloadIcon';


const severityClasses = {
  Critical: 'bg-red-900/50 text-red-300 border-red-700',
  High: 'bg-orange-900/50 text-orange-300 border-orange-700',
  Medium: 'bg-amber-900/50 text-amber-300 border-amber-700',
  Low: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
};

const CrashDetailsModal: React.FC<{ crash: Crash; config: FuzzingConfig; onClose: () => void }> = ({ crash, config, onClose }) => {
    const [copied, setCopied] = useState(false);
    const [analysis, setAnalysis] = useState<CrashAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(true);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    useEffect(() => {
        if (crash) {
            setIsAnalyzing(true);
            setAnalysis(null);
            setAnalysisError(null);
            
            analyzeCrash(crash)
                .then(setAnalysis)
                .catch((err) => {
                    console.error(err);
                    setAnalysisError('Failed to generate AI analysis. The model may be overloaded.');
                })
                .finally(() => {
                    setIsAnalyzing(false);
                });
        }
    }, [crash]);

    const reproductionCommand = `echo "${crash.reproducibleTestCase.replace(/"/g, '\\"')}" | ./${config.binaryName} ${config.dbName || ''}`.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(reproductionCommand).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-800">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-sans font-bold text-white">{crash.summary}</h3>
                            <p className="text-gray-400 font-sans">{crash.type}</p>
                        </div>
                         <span className={`px-3 py-1 text-xs font-sans font-semibold rounded-full border ${severityClasses[crash.severity]}`}>{crash.severity}</span>
                    </div>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-sm font-mono">
                    <div>
                        <h4 className="text-gray-400 font-sans font-semibold mb-2">Reproducible Test Case (SQL)</h4>
                        <pre className="bg-gray-950 p-4 rounded-md text-emerald-300 overflow-x-auto"><code>{crash.reproducibleTestCase}</code></pre>
                    </div>
                    <div>
                        <h4 className="text-gray-400 font-sans font-semibold mb-2">Reproduction Command</h4>
                        <div className="relative flex items-center gap-2 bg-gray-950 p-3 rounded-md border border-gray-800">
                            <code className="text-gray-300 overflow-x-auto grow font-mono text-xs sm:text-sm">{reproductionCommand}</code>
                            <button 
                                onClick={handleCopy} 
                                className="flex-shrink-0 p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-950"
                                aria-label="Copy command"
                            >
                                {copied ? (
                                    <CheckIcon className="h-5 w-5 text-emerald-400" />
                                ) : (
                                    <ClipboardCopyIcon className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>
                     <div>
                        <h4 className="text-gray-400 font-sans font-semibold mb-2 flex items-center gap-2">
                            <SparklesIcon className="h-5 w-5 text-purple-400" />
                            AI-Powered Analysis
                        </h4>
                        <div className="bg-gray-950 p-4 rounded-md border border-gray-800 space-y-4">
                            {isAnalyzing && (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 bg-gray-800 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-800 rounded w-1/3 mt-4"></div>
                                    <div className="h-12 bg-gray-800 rounded w-full"></div>
                                </div>
                            )}
                            {analysisError && (
                                <div className="text-center py-4">
                                    <p className="text-red-400">{analysisError}</p>
                                </div>
                            )}
                            {analysis && (
                                <>
                                    <div>
                                        <h5 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Vulnerability Pattern</h5>
                                        <p className="text-purple-300 font-sans">{analysis.vulnerabilityPattern}</p>
                                    </div>
                                     <div>
                                        <h5 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">Potential Impact</h5>
                                        <p className="text-orange-300 font-sans">{analysis.potentialImpact}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-gray-300 text-xs uppercase tracking-wider mb-1">Detailed Explanation</h5>
                                        <p className="text-gray-400 whitespace-pre-wrap font-sans text-base leading-relaxed">{analysis.detailedExplanation}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-gray-400 font-sans font-semibold mb-2 flex items-center gap-2">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                            AddressSanitizer Report
                        </h4>
                        <pre className="bg-gray-950 p-4 rounded-md text-gray-300 overflow-x-auto text-xs border border-red-800/50 whitespace-pre-wrap">{`${crash.faultyOutput}\n\n${crash.stackTrace}`}</pre>
                    </div>
                     <div>
                        <h4 className="text-gray-400 font-sans font-semibold mb-2 flex items-center gap-2">
                            <CheckCircleIcon className="h-5 w-5 text-emerald-400" />
                            Expected Output
                        </h4>
                        <pre className="bg-gray-950 p-3 rounded-md text-gray-300 overflow-x-auto text-xs whitespace-pre-wrap"><code>{crash.originalOutput}</code></pre>
                    </div>
                </div>
                <div className="p-4 bg-gray-800/50 border-t border-gray-800 text-right rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white font-sans rounded-md hover:bg-gray-600 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

const ReportView: React.FC<{ report: FuzzingReport; config: FuzzingConfig; onReset: () => void }> = ({ report, config, onReset }) => {
  const [selectedCrash, setSelectedCrash] = useState<Crash | null>(null);

  const downloadFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    const fullReport = {
      configuration: config,
      results: report,
    };
    const jsonContent = JSON.stringify(fullReport, null, 2);
    downloadFile(`fuzzing-report-${config.binaryName}.json`, jsonContent, 'application/json');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white">Fuzzing Run Complete</h2>
           <p className="text-gray-400 mt-1">Detailed report of the security and robustness testing.</p>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleExportReport} className="flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 rounded-md text-sm font-medium transition-colors">
            <DownloadIcon className="h-4 w-4" />
            Export Report
          </button>
          <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-sm font-medium transition-colors">
            <RefreshIcon className="h-4 w-4" />
            Start New Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Total Duration</p>
            <p className="text-2xl font-bold text-white">{Math.floor(report.totalDuration / 60)}m {Math.floor(report.totalDuration % 60)}s</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Final Coverage</p>
            <p className="text-2xl font-bold text-emerald-400">{report.finalCoverage.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Total Executions</p>
            <p className="text-2xl font-bold text-white">{report.totalExecs.toLocaleString()}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-400">Crashes Found</p>
            <p className={`text-2xl font-bold ${report.crashes.length > 0 ? 'text-red-400' : 'text-gray-200'}`}>{report.crashes.length}</p>
        </div>
      </div>
      
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <BugIcon className="h-6 w-6 text-red-400"/>
          Vulnerability Report
        </h3>
        {report.crashes.length > 0 ? (
          <div className="space-y-3">
            {report.crashes.map(crash => (
              <div key={crash.id} className="bg-gray-800/50 p-4 rounded-md border border-gray-700 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${severityClasses[crash.severity]}`}>{crash.severity}</span>
                    <p className="font-semibold text-gray-200">{crash.summary}</p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 ml-1">{crash.type}</p>
                </div>
                <button onClick={() => setSelectedCrash(crash)} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap flex items-center gap-1.5">
                   <DocumentTextIcon className="h-4 w-4" />
                   View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No vulnerabilities or crashes were found during this run.</p>
          </div>
        )}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
          <FolderDownloadIcon className="h-6 w-6 text-emerald-400"/>
          Fuzzing Artifacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <h4 className="font-semibold text-gray-200 mb-3">Downloads</h4>
            <div className="flex flex-col items-start gap-2">
              <button 
                onClick={() => downloadFile('grammar.py', report.grammarPy, 'text/x-python')}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md px-3 py-1.5 transition-colors"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>grammar.py</span>
              </button>
              {report.seedCorpus.map((seed) => (
                <button 
                  key={seed.filename} 
                  onClick={() => downloadFile(seed.filename, seed.content, 'application/sql')}
                  className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md px-3 py-1.5 transition-colors"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{seed.filename}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-200 mb-3">Reproduction Guide</h4>
            <div className="bg-gray-950 p-4 rounded-md border border-gray-800 max-h-80 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{report.reproductionGuide}</pre>
            </div>
          </div>
        </div>
      </div>

      {selectedCrash && <CrashDetailsModal crash={selectedCrash} config={config} onClose={() => setSelectedCrash(null)} />}
    </div>
  );
};

export default ReportView;