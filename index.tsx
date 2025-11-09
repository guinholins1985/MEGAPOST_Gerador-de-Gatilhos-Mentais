// React and library imports are handled by the importmap in index.html
import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

//======================================================================
// TYPES
//======================================================================
interface MentalTrigger {
  value: string;
  label: string;
  description: string;
}

interface CopywritingResult {
  title: string;
  copy: string;
}

//======================================================================
// CONSTANTS
//======================================================================
const mentalTriggers: MentalTrigger[] = [
  { value: 'escassez', label: 'Escassez', description: 'Cria a sensação de que o produto é limitado.' },
  { value: 'urgencia', label: 'Urgência', description: 'Incentiva a ação imediata com um prazo.' },
  { value: 'prova_social', label: 'Prova Social', description: 'Mostra que outras pessoas estão usando e aprovando.' },
  { value: 'autoridade', label: 'Autoridade', description: 'Posiciona a marca como especialista no assunto.' },
  { value: 'reciprocidade', label: 'Reciprocidade', description: 'Oferece algo de valor para criar um senso de dívida.' },
  { value: 'compromisso_e_coerencia', label: 'Compromisso e Coerência', description: 'Incentiva pequenos passos que levam a uma compra maior.' },
  { value: 'afinidade', label: 'Afinidade', description: 'Cria uma conexão com o cliente através de valores em comum.' },
  { value: 'novidade', label: 'Novidade', description: 'Desperta a curiosidade com algo novo e exclusivo.' },
  { value: 'antecipacao', label: 'Antecipação', description: 'Gera expectativa sobre um lançamento futuro.' },
];

//======================================================================
// GEMINI API SERVICE
//======================================================================
function getAiInstance() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("A chave da API do Gemini (API_KEY) não está configurada. Adicione-a como uma variável de ambiente nas configurações do seu projeto.");
  }
  return new GoogleGenAI({ apiKey });
}

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Um título curto e impactante para a copy (ex: Título de E-mail, Chamada para Anúncio).',
      },
      copy: {
        type: Type.STRING,
        description: 'O texto de copywriting gerado, com 2 a 4 frases.',
      },
    },
    required: ["title", "copy"],
  },
};

const generateProductName = async (adImage: string): Promise<string> => {
  const prompt = "Analise a imagem fornecida e crie um título descritivo para o produto/serviço exibido. O título deve ser claro, conciso e descrever exatamente o que é o produto, como se fosse para um catálogo de e-commerce. Inclua características principais visíveis na imagem. Forneça apenas o título, sem qualquer texto ou explicação adicional.";

  const match = adImage.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
  if (!match) {
    throw new Error("Formato de imagem Base64 inválido.");
  }
  const mimeType = match[1];
  const data = match[2];

  const parts = [
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data,
      },
    },
  ];

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "Você é um especialista em catalogação de produtos para e-commerce. Sua principal habilidade é analisar imagens de produtos e criar títulos precisos, objetivos e descritivos que ajudem os clientes a entenderem exatamente o que estão vendo. Evite nomes criativos ou de marca, foque estritamente na descrição do item.",
        temperature: 0.4,
      },
    });

    let productName = response.text.trim();
    if ((productName.startsWith('"') && productName.endsWith('"')) || (productName.startsWith("'") && productName.endsWith("'"))) {
      productName = productName.substring(1, productName.length - 1);
    }
    return productName;
    
  } catch (error) {
    console.error("Error calling Gemini API for product name generation:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao gerar o nome do produto: ${error.message}`);
    }
    throw new Error("Falha ao gerar o nome do produto. Verifique o console para mais detalhes.");
  }
};

const generateCopy = async (
  productName: string,
  trigger: string,
  adUrl?: string,
  adImage?: string | null
): Promise<CopywritingResult[]> => {
  const triggerName = trigger.replace(/_/g, ' ');
  let prompt = `Gere 3 exemplos de copywriting curtos e persuasivos para o produto/serviço "${productName}", utilizando o gatilho mental de "${triggerName}".`;
  if (adUrl) {
    prompt += ` A página de destino do anúncio é: ${adUrl}. Analise o conteúdo desta URL para extrair benefícios e características importantes.`;
  }
  if (adImage) {
    prompt += ` Analise a imagem fornecida e use elementos visuais e o sentimento que ela transmite na criação da copy.`;
  }
  const parts: any[] = [{ text: prompt }];
  if (adImage) {
    const match = adImage.match(/^data:(image\/[a-zA-Z]+);base64,(.*)$/);
    if (match) {
      const mimeType = match[1];
      const data = match[2];
      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    } else {
      console.warn("Formato de imagem Base64 inválido.");
    }
  }

  try {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "Você é um copywriter especialista em marketing digital e psicologia do consumidor. Seu objetivo é criar textos curtos, diretos e altamente persuasivos, considerando todos os materiais fornecidos (imagem, URL, nome do produto). Retorne os resultados exclusivamente no formato JSON especificado.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    const jsonText = response.text.trim();
    const parsedResult = JSON.parse(jsonText) as CopywritingResult[];
    if (!Array.isArray(parsedResult)) {
        throw new Error("A resposta da API não é um array válido.");
    }
    return parsedResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao comunicar com a API do Gemini: ${error.message}`);
    }
    throw new Error("Falha ao comunicar com a API do Gemini. Verifique o console para mais detalhes.");
  }
};

//======================================================================
// UI COMPONENTS
//======================================================================

//--- Header Component ---
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 mr-3 text-brand-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a5 5 0 01-4.9-5.555 5 5 0 014.33-4.33A5 5 0 0114.555 12 5 5 0 019 17zM9 17a5 5 0 004.9 5.555 5 5 0 00-4.33-4.33A5 5 0 003.445 12 5 5 0 009 17z" clipRule="evenodd" />
  </svg>
);
const Header: React.FC = () => {
  return (
    <header className="text-center mb-10 md:mb-12">
      <div className="flex items-center justify-center mb-4">
        <BrainIcon />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-light">
          Gerador de Gatilhos Mentais
        </h1>
      </div>
      <p className="text-lg md:text-xl text-dark-text-secondary max-w-2xl mx-auto">
        Crie copys persuasivas com o poder da IA. Selecione um gatilho, informe seu produto e veja a mágica acontecer.
      </p>
    </header>
  );
};

//--- CopywritingForm Component ---
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
const CopywritingForm: React.FC<CopywritingFormProps> = ({
  productName, setProductName, adUrl, setAdUrl, adImage, setAdImage, selectedTrigger, setSelectedTrigger, onGenerate, isLoading, isGeneratingName, onGenerateName,
}) => {
  const selectedTriggerDetails = mentalTriggers.find(t => t.value === selectedTrigger);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
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
        <div className="relative">
          <label htmlFor="productName" className="block text-sm font-medium text-dark-text-secondary mb-2">Nome do Produto/Serviço</label>
          <input id="productName" type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Consultoria de Finanças Pessoais" className="w-full bg-gray-900 border border-dark-border rounded-lg pl-4 pr-12 py-3 text-dark-text placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300" disabled={isLoading || isGeneratingName} />
           <button type="button" onClick={onGenerateName} disabled={isLoading || isGeneratingName || !adImage} className="absolute right-2 top-[38px] p-2 rounded-full text-brand-light hover:bg-brand-primary/20 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors" title={adImage ? "Gerar nome com IA a partir da imagem" : "Envie uma imagem para habilitar"}>
            {isGeneratingName ? <MiniSpinner /> : <SparklesIcon />}
          </button>
        </div>
        <div>
          <label htmlFor="mentalTrigger" className="block text-sm font-medium text-dark-text-secondary mb-2">Gatilho Mental</label>
          <select id="mentalTrigger" value={selectedTrigger} onChange={(e) => setSelectedTrigger(e.target.value)} className="w-full bg-gray-900 border border-dark-border rounded-lg px-4 py-3 text-dark-text focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300" disabled={isLoading}>
            {mentalTriggers.map((trigger: MentalTrigger) => (
              <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
        <div>
          <label htmlFor="adUrl" className="block text-sm font-medium text-dark-text-secondary mb-2">URL do Anúncio (Opcional)</label>
          <input id="adUrl" type="url" value={adUrl} onChange={(e) => setAdUrl(e.target.value)} placeholder="https://suapagina.com/produto" className="w-full bg-gray-900 border border-dark-border rounded-lg px-4 py-3 text-dark-text placeholder-gray-500 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all duration-300" disabled={isLoading} />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text-secondary mb-2">Imagem do Anúncio (Opcional)</label>
          {adImage ? (
            <div className="relative group">
              <img src={adImage} alt="Preview do anúncio" className="w-full h-auto rounded-lg object-cover max-h-40 border border-dark-border" />
              <button onClick={() => setAdImage(null)} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white transition-opacity opacity-0 group-hover:opacity-100" title="Remover imagem" disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-brand-primary transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="mt-2 text-sm text-dark-text-secondary">Clique para enviar</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/png, image/jpeg, image/webp" disabled={isLoading} />
            </>
          )}
        </div>
      </div>
      {selectedTriggerDetails && (
        <p className="text-center text-sm text-dark-text-secondary mt-6 bg-gray-900/50 p-3 rounded-md">
          <strong>{selectedTriggerDetails.label}:</strong> {selectedTriggerDetails.description}
        </p>
      )}
      <div className="mt-8 text-center">
        <button onClick={onGenerate} disabled={isLoading || !productName} className="w-full md:w-auto inline-flex items-center justify-center px-12 py-4 border border-transparent text-base font-semibold rounded-full shadow-lg text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg focus:ring-brand-primary transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none">
          {isLoading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Analisando...</>) : ('Gerar Copy Inteligente')}
        </button>
      </div>
    </div>
  );
};

//--- ResultsDisplay Component ---
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
        <button onClick={handleCopy} className="ml-4 p-2 rounded-md bg-gray-700 hover:bg-brand-primary text-gray-300 hover:text-white transition-colors text-sm" title="Copiar texto">
          {copied ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>)}
        </button>
      </div>
    </div>
  );
};
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
interface ResultsDisplayProps {
  isLoading: boolean;
  error: string | null;
  generatedCopy: CopywritingResult[];
}
const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ isLoading, error, generatedCopy }) => {
  if (isLoading) { return <LoadingSkeleton />; }
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
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
      <h3 className="mt-2 text-sm font-medium text-dark-text">Aguardando para gerar</h3>
      <p className="mt-1 text-sm text-dark-text-secondary">Seus resultados aparecerão aqui.</p>
    </div>
  );
};


//======================================================================
// MAIN APP COMPONENT
//======================================================================
const App = () => {
  const [productName, setProductName] = useState('');
  const [adUrl, setAdUrl] = useState('');
  const [adImage, setAdImage] = useState<string | null>(null);
  const [selectedTrigger, setSelectedTrigger] = useState(mentalTriggers[0].value);
  const [generatedCopy, setGeneratedCopy] = useState<CopywritingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

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

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-dark-bg font-sans text-dark-text flex items-center justify-center p-4 animate-fade-in">
         <div className="text-center max-w-2xl mx-auto p-6 md:p-8 bg-dark-card border border-red-500 rounded-xl shadow-2xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h1 className="text-2xl font-bold text-red-300 mb-3">Erro de Configuração</h1>
            <p className="text-dark-text-secondary">Sua <code className="bg-gray-900 text-yellow-300 p-1 rounded font-mono">API_KEY</code> do Gemini não foi encontrada. Para que esta ferramenta funcione, você precisa adicioná-la às variáveis de ambiente do seu projeto na Vercel.</p>
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
        <CopywritingForm productName={productName} setProductName={setProductName} adUrl={adUrl} setAdUrl={setAdUrl} adImage={adImage} setAdImage={setAdImage} selectedTrigger={selectedTrigger} setSelectedTrigger={setSelectedTrigger} onGenerate={handleGenerateClick} isLoading={isLoading} isGeneratingName={isGeneratingName} onGenerateName={handleGenerateName} />
        <ResultsDisplay isLoading={isLoading} error={error} generatedCopy={generatedCopy} />
      </main>
    </div>
  );
}

//======================================================================
// RENDER APP
//======================================================================
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
