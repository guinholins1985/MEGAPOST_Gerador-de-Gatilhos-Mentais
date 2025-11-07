import React, { useState, useCallback } from 'react';
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
      setError('Ocorreu um erro ao gerar a copy. Por favor, tente novamente.');
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
      setError('Ocorreu um erro ao gerar o nome do produto. Tente novamente.');
    } finally {
      setIsGeneratingName(false);
    }
  }, [adImage]);


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