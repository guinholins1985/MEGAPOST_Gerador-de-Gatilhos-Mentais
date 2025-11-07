import { GoogleGenAI, Type } from "@google/genai";
import type { CopywritingResult } from '../types';

// Ensure this environment variable is set in your deployment environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this context, we assume the key is available.
  console.warn("API_KEY environment variable not set. API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

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

export const generateProductName = async (adImage: string): Promise<string> => {
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
      config: {
        systemInstruction: "Você é um especialista em catalogação de produtos para e-commerce. Sua principal habilidade é analisar imagens de produtos e criar títulos precisos, objetivos e descritivos que ajudem os clientes a entenderem exatamente o que estão vendo. Evite nomes criativos ou de marca, foque estritamente na descrição do item.",
        temperature: 0.4,
      },
    });

    let productName = response.text.trim();
    // Remove quotes if the model returns the name in quotes, e.g., "Meu Produto" -> Meu Produto
    if ((productName.startsWith('"') && productName.endsWith('"')) || (productName.startsWith("'") && productName.endsWith("'"))) {
      productName = productName.substring(1, productName.length - 1);
    }
    return productName;
    
  } catch (error) {
    console.error("Error calling Gemini API for product name generation:", error);
    throw new Error("Falha ao gerar o nome do produto. Verifique o console para mais detalhes.");
  }
};

export const generateCopy = async (
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
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // This model supports multimodal input
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
    
    // Basic validation to ensure we got an array
    if (!Array.isArray(parsedResult)) {
        throw new Error("A resposta da API não é um array válido.");
    }

    return parsedResult;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Falha ao comunicar com a API do Gemini. Verifique o console para mais detalhes.");
  }
};