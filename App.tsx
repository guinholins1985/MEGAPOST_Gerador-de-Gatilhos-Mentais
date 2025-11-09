import React, { useState, useCallback, useEffect } from 'react';
import { generateCopy, generateProductName } from './services/geminiService';
import { mentalTriggers } from './constants';
import type { CopywritingResult } from './types';
import { Header } from './components/Header';
import { CopywritingForm } from './components/CopywritingForm';
import { ResultsDisplay } from './components/ResultsDisplay';

export default function App() {
  const [productName, setProductName] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adImage, setAdImage] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState(mentalTriggers[0].value);
  const [generatedCopy, setGeneratedCopy] = useState<CopywritingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Check for API Key on initial load
  useEffect(() => {
    if (!process.env.API_KEY) {
      setApiKeyMissing(true);
    }
  }, []);

  const handleGenerateClick = useCallback(async () => {
    if (!productName || !selectedTrigger) {
      setError('Por favor, preencha o nome do produto e selecione um gatilho.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCopy([]);

    try {
      const results = await generateCopy(productName, selectedTrigger, adUrl, adImage);
      setGeneratedCopy(results);
    } catch (err) {
      console.error('API Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao gerar a copy. Por favor, tente novamente.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productName, selectedTrigger, adUrl, adImage]);

  const handleGenerateName = useCallback(async () => {
    if (!adImage) {
      setError('Por favor, envie uma imagem primeiro para gerar um nome.');
      return;
    }
    
    setIsGeneratingName(true);
    setError(null);
    
    try {
      const name = await generateProductName(adImage);
      setProductName(name);
    } catch (err) {
      console.error('API Error (Name Gen):', err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro ao gerar o nome do produto. Tente novamente.';
      setError(errorMessage);
    } finally {
      setIsGeneratingName(false);
    }
  }, [adImage]);

  // If API key is missing, render a dedicated error screen with clear instructions.
  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-dark-bg font-sans text-dark-text flex items-center justify-center p-4 animate-fade-in">
         <div className="text-center max-w-2xl mx-auto p-6 md:p-8 bg-dark-card border border-red-500 rounded-xl shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-red-300 mb-3">Erro de Configuração</h1>
            <p className="text-dark-text-secondary">
              Sua <code className="bg-gray-900 text-yellow-300 p-1 rounded font-mono">API_KEY</code> do Gemini não foi encontrada. Para que esta ferramenta funcione, você precisa adicioná-la às variáveis de ambiente do seu projeto na Vercel.
            </p>
            <div className="mt-6 text-left bg-gray-900/50 p-4 rounded-lg text-sm">
              <p className="font-semibold text-dark-text">Como corrigir na Vercel:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-dark-text-secondary">
                  <li>Acesse o painel do seu projeto na Vercel.</li>
                  <li>Vá para a aba <strong className="text-dark-text">Settings</strong> &rarr; <strong className="text-dark-text">Environment Variables</strong>.</li>
                  <li>Clique em <strong>Add New</strong>.</li>
                  <li>No campo <strong>Name</strong>, insira <code className="bg-gray-900 text-yellow-300 p-1 rounded font-mono">API_KEY</code>.</li>
                  <li>No campo <strong>Value</strong>, cole a sua chave da API.</li>
                  <li>Salve e faça um novo deploy do seu projeto (Redeploy).</li>
              </ol>
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg font-sans text-dark-text animate-fade-in">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <Header />

        <CopywritingForm
          productName={productName}
          setProductName={setProductName}
          adUrl={adUrl}
          setAdUrl={setAdUrl}
          adImage={adImage}
          setAdImage={setAdImage}
          selectedTrigger={selectedTrigger}
          setSelectedTrigger={setSelectedTrigger}
          onGenerate={handleGenerateClick}
          isLoading={isLoading}
          isGeneratingName={isGeneratingName}
          onGenerateName={handleGenerateName}
        />
        
        <ResultsDisplay
          isLoading={isLoading}
          error={error}
          generatedCopy={generatedCopy}
        />
      </main>
    </div>
  );
}