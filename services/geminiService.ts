import { GoogleGenAI, Type } from "@google/genai";
import type { FuzzingConfig, FuzzingReport, Crash, CrashAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    totalDuration: { type: Type.NUMBER, description: "Total simulated duration in seconds." },
    finalCoverage: { type: Type.NUMBER, description: "Final code coverage percentage." },
    totalExecs: { type: Type.NUMBER, description: "Total number of executions." },
    execsPerSec: { type: Type.NUMBER, description: "Average executions per second." },
    crashes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
          type: { type: Type.STRING, enum: ['Memory Safety', 'Undefined Behavior', 'Logic Bug', 'DoS Potential'] },
          summary: { type: Type.STRING },
          stackTrace: { type: Type.STRING, description: "The full stack trace that follows an ASan error report header." },
          reproducibleTestCase: { type: Type.STRING, description: "A small, reproducible SQL test case." },
          timestamp: { type: Type.NUMBER, description: "Timestamp in seconds since the start of the run." },
          originalOutput: { type: Type.STRING, description: "The expected, correct output from a non-vulnerable version of the software." },
          faultyOutput: { type: Type.STRING, description: "The AddressSanitizer (ASan) error summary line. e.g., '==1337==ERROR: AddressSanitizer: heap-buffer-overflow on address ...'. Should not include the full stack trace." }
        },
        required: ["id", "severity", "type", "summary", "stackTrace", "reproducibleTestCase", "timestamp", "originalOutput", "faultyOutput"]
      }
    },
    coverageTimeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.NUMBER },
          coverage: { type: Type.NUMBER }
        },
        required: ["time", "coverage"]
      }
    },
    logs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.NUMBER },
          message: { type: Type.STRING },
          level: { type: Type.STRING, enum: ['info', 'warn', 'error'] },
        },
        required: ["time", "message", "level"]
      }
    },
    grammarPy: { type: Type.STRING, description: "Content of a plausible Python fuzzing grammar file (grammar.py)." },
    seedCorpus: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                filename: { type: Type.STRING },
                content: { type: Type.STRING }
            },
            required: ["filename", "content"]
        },
        description: "A list of 3-5 seed files for the corpus."
    },
    reproductionGuide: { type: Type.STRING, description: "A step-by-step guide in Markdown format on how to reproduce a bug manually using the generated artifacts." }
  },
  required: ["totalDuration", "finalCoverage", "totalExecs", "execsPerSec", "crashes", "coverageTimeline", "logs", "grammarPy", "seedCorpus", "reproductionGuide"]
};


export const generateFuzzingSimulation = async (config: FuzzingConfig): Promise<FuzzingReport> => {
  const prompt = `
    Simulate a fuzzing run for SQLite3 with the following configuration:
    - Time Budget: ${config.timeBudget} minutes
    - Coverage Target: ${config.coverageTarget}%
    - CPU Cores: ${config.cpuCores}

    Generate a plausible, detailed timeline of events for this fuzzing run. The simulation should progress realistically.
    - Start with low coverage and gradually increase, aiming to reach or get close to the target. The coverage should plateau towards the end.
    - Logs should show initialization, corpus expansion, finding new paths, and crash discoveries.
    - Generate between 2 and 5 unique crashes. Crashes should be diverse (e.g., heap-buffer-overflow, null-pointer-dereference, integer-overflow).
    - Crashes should have realistic summaries and stack traces.
    - For each crash, also provide:
        - "originalOutput": A string representing the expected, correct output from a non-vulnerable version of SQLite3 when running the reproducible test case.
        - "faultyOutput": The AddressSanitizer (ASan) error summary line for the crash. For example: '==1337==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x...'. This field should contain only the error summary, not the stack trace.
    - The "stackTrace" field should contain the detailed stack trace that follows the ASan error summary.
    - The simulation should end when either the time budget is reached or the coverage target is met.
    - The final JSON must conform to the provided schema. Ensure all fields are populated correctly.

    In addition to the simulation data, generate the following artifacts:
    1.  **grammarPy**: A plausible, simplified Python script representing a fuzzing grammar for generating SQL queries. It should not be overly complex, but should look realistic.
    2.  **seedCorpus**: A list of 3-5 small seed files. Each file should have a simple filename (e.g., 'seed1.sql') and contain a basic SQL statement.
    3.  **reproductionGuide**: A concise, step-by-step guide in Markdown format. This guide should explain generically how a developer might use the 'grammar.py' and 'seedCorpus' to reproduce one of the discovered crashes. Use Markdown for formatting (e.g., ### for headers, - for lists, \`code\` for inline code).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text;
    const report: FuzzingReport = JSON.parse(jsonText);
    
    // Ensure timeline and logs are sorted by time
    report.coverageTimeline.sort((a, b) => a.time - b.time);
    report.logs.sort((a, b) => a.time - b.time);
    report.crashes.sort((a, b) => a.timestamp - b.timestamp);

    return report;

  } catch (error) {
    console.error("Error generating fuzzing simulation:", error);
    throw new Error("Failed to get a valid simulation from the AI model.");
  }
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        vulnerabilityPattern: { type: Type.STRING, description: "A specific vulnerability pattern identified from the stack trace (e.g., 'Heap-based Buffer Overflow', 'Use-After-Free')." },
        potentialImpact: { type: Type.STRING, description: "The potential security impact of this vulnerability (e.g., 'Arbitrary Code Execution', 'Denial of Service', 'Information Leak')." },
        detailedExplanation: { type: Type.STRING, description: "A detailed, technical explanation of the vulnerability, how it might be triggered based on the stack trace, and why it's a security risk. Should be a short paragraph." }
    },
    required: ["vulnerabilityPattern", "potentialImpact", "detailedExplanation"]
};

export const analyzeCrash = async (crash: Crash): Promise<CrashAnalysis> => {
    const prompt = `
        As a principal security researcher, analyze the following crash report from a fuzzing run against SQLite3.

        Crash Summary: ${crash.summary}
        Crash Type: ${crash.type}
        Reproducible Test Case:
        \`\`\`sql
        ${crash.reproducibleTestCase}
        \`\`\`

        Stack Trace:
        \`\`\`
        ${crash.stackTrace}
        \`\`\`

        Based on the provided information, especially the stack trace, perform a detailed analysis.
        1.  **Identify Vulnerability Pattern:** Pinpoint the specific type of memory corruption or logic error. Look for function names in the stack trace like 'memcpy', 'free', 'malloc', or operations on internal SQLite data structures that suggest a specific vulnerability class.
        2.  **Determine Potential Impact:** Assess the most likely security consequence of exploiting this vulnerability. Is it likely to lead to remote code execution, a crash (Denial of Service), or leaking sensitive information?
        3.  **Provide a Detailed Explanation:** Write a clear, concise explanation suitable for a developer. Explain what the stack trace implies, what the root cause might be, and what the security implications are.

        Provide the output in a JSON object that conforms to the specified schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
            },
        });

        const jsonText = response.text;
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing crash:", error);
        throw new Error("Failed to get a valid analysis from the AI model.");
    }
};