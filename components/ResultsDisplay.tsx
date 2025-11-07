import React from 'react';
import type { CopywritingResult } from '../types';

// ResultCard Component defined in the same file for simplicity
interface ResultCardProps {
  result: CopywritingResult;
  index: number;
}

const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.copy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const animationDelay = { animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' };

  return (
    <div className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg transition-all duration-300 hover:border-brand-primary hover:shadow-brand-primary/20 animate-slide-up" style={animationDelay}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-brand-light">{result.title}</h3>
          <p className="mt-2 text-dark-text-secondary">{result.copy}</p>
        </div>
        <button
          onClick={handleCopy}
          className="ml-4 p-2 rounded-md bg-gray-700 hover:bg-brand-primary text-gray-300 hover:text-white transition-colors text-sm"
          title="Copiar texto"
        >
          {copied ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

// LoadingSkeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="bg-dark-card border border-dark-border rounded-lg p-6 shadow-lg animate-pulse-fast">
        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>
    ))}
  </div>
);

// ResultsDisplay Main Component
interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  generatedCopy: CopywritingResult[];
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, generatedCopy }) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-900/50 border border-red-500 rounded-lg">
        <p className="font-semibold text-red-300">{error}</p>
      </div>
    );
  }

  if (generatedCopy.length > 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-center mb-6">Resultados Gerados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedCopy.map((result, index) => (
            <ResultCard key={index} result={result} index={index}/>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-10 px-6 bg-dark-card border border-dashed border-dark-border rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      <h3 className="mt-2 text-sm font-medium text-dark-text">Aguardando para gerar</h3>
      <p className="mt-1 text-sm text-dark-text-secondary">
        Seus resultados aparecerão aqui.
      </p>
    </div>
  );
};