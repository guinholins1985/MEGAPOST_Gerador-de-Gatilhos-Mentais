import React, { useRef } from 'react';
import { mentalTriggers } from '../constants';
import type { MentalTrigger } from '../types';

interface CopywritingFormProps {
  productName: string;
  setProductName: (value: string) => void;
  adUrl: string;
  setAdUrl: (value: string) => void;
  adImage: string | null;
  setAdImage: (value: string | null) => void;
  selectedTrigger: string;
  setSelectedTrigger: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isGeneratingName: boolean;
  onGenerateName: () => void;
}

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L13 12l-1.293 1.293a1 1 0 01-1.414 0L8 10.414a1 1 0 010-1.414L10.293 6.707a1 1 0 011.414 0L13 8m5 5l2.293 2.293a1 1 0 010 1.414L18 21.414a1 1 0 01-1.414 0L14.293 19.121a1 1 0 010-1.414L16.586 15.414a1 1 0 011.414 0L19 17.707" />
    </svg>
);

const MiniSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export const CopywritingForm: React.FC<CopywritingFormProps> = ({
  productName,
  setProductName,
  adUrl,
  setAdUrl,
  adImage,
  setAdImage,
  selectedTrigger,
  setSelectedTrigger,
  onGenerate,
  isLoading,
  isGeneratingName,
  onGenerateName,
}) => {
  const selectedTriggerDetails = mentalTriggers.find(t => t.value === selectedTrigger);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { // Gemini API limit is around 4MB for inline data
      alert('A imagem é muito grande. Por favor, escolha uma imagem com menos de 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAdImage(reader.result as string);
    };
    reader.onerror = () => {
      console.error("Erro ao ler o arquivo de imagem.");
      alert('Ocorreu um erro ao processar a imagem. Tente novamente.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-dark-card rounded-xl p-6 md:p-8 shadow-2xl border border-dark-border mb-10 md:mb-12 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        {/* Product Input */}
        <div className="relative">
          <label htmlFor="productName" className="block text-sm font-medium text-dark-text-secondary mb-2">
            Nome do Produto/Serviço
          </label>
          <input
            id="productName"
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Ex: Consultoria de Finanças Pessoais"
            className="w-full bg-gray-900 border border-dark-border rounded-lg pl-4 pr-12 py-3 text-dark-text placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300"
            disabled={isLoading || isGeneratingName}
          />
           <button
            type="button"
            onClick={onGenerateName}
            disabled={isLoading || isGeneratingName || !adImage}
            className="absolute right-2 top-[38px] p-2 rounded-full text-brand-light hover:bg-brand-primary/20 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
            title={adImage ? "Gerar nome com IA a partir da imagem" : "Envie uma imagem para habilitar"}
          >
            {isGeneratingName ? <MiniSpinner /> : <SparklesIcon />}
          </button>
        </div>

        {/* Trigger Selector */}
        <div>
          <label htmlFor="mentalTrigger" className="block text-sm font-medium text-dark-text-secondary mb-2">
            Gatilho Mental
          </label>
          <select
            id="mentalTrigger"
            value={selectedTrigger}
            onChange={(e) => setSelectedTrigger(e.target.value)}
            className="w-full bg-gray-900 border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300"
            disabled={isLoading}
          >
            {mentalTriggers.map((trigger: MentalTrigger) => (
              <option key={trigger.value} value={trigger.value}>
                {trigger.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* URL and Image Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
        <div>
          <label htmlFor="adUrl" className="block text-sm font-medium text-dark-text-secondary mb-2">
            URL do Anúncio (Opcional)
          </label>
          <input
            id="adUrl"
            type="url"
            value={adUrl}
            onChange={(e) => setAdUrl(e.target.value)}
            placeholder="https://suapagina.com/produto"
            className="w-full bg-gray-900 border border-dark-border rounded-lg px-4 py-3 text-dark-text placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-2">
            Imagem do Anúncio (Opcional)
          </label>
          {adImage ? (
            <div className="relative group">
              <img src={adImage} alt="Preview do anúncio" className="w-full h-auto rounded-lg object-cover max-h-40 border border-dark-border" />
              <button
                onClick={() => setAdImage(null)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white transition-opacity opacity-0 group-hover:opacity-100"
                title="Remover imagem"
                disabled={isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-brand-primary transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="mt-2 text-sm text-dark-text-secondary">Clique para enviar</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                disabled={isLoading}
              />
            </>
          )}
        </div>
      </div>
      
      {selectedTriggerDetails && (
        <p className="text-center text-sm text-dark-text-secondary mt-6 bg-gray-900/50 p-3 rounded-md">
          <strong>{selectedTriggerDetails.label}:</strong> {selectedTriggerDetails.description}
        </p>
      )}

      {/* Generate Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onGenerate}
          disabled={isLoading || !productName}
          className="w-full md:w-auto inline-flex items-center justify-center px-12 py-4 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-primary transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analisando...
            </>
          ) : (
            'Gerar Copy Inteligente'
          )}
        </button>
      </div>
    </div>
  );
};