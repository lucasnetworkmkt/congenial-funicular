import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Message, Role, ModelType } from '../types';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates marketing copy for a specific menu item
 */
export const generateMarketingCopy = async (
  dishName: string, 
  dishDescription: string, 
  tone: 'formal' | 'divertido' | 'urgente'
): Promise<string> => {
  try {
    const prompt = `
      Atue como um especialista em Marketing Gastronômico para o restaurante 'Fuego Prime'.
      Crie uma legenda curta, atraente e com emojis para o Instagram.
      
      Prato: ${dishName}
      Descrição: ${dishDescription}
      Tom de voz: ${tone}
      
      A legenda deve ter chamadas para ação (CTA) para reservar mesa. Não use hashtags em excesso.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8 // More creative
      }
    });

    return response.text || "Não foi possível gerar o texto no momento.";
  } catch (error) {
    console.error("Gemini Marketing Error:", error);
    return "Erro ao conectar com a IA. Tente novamente.";
  }
};

/**
 * Creates a chat session and sends a message, handling streaming responses.
 */
export const streamGeminiResponse = async (
  history: Message[],
  newMessage: string,
  attachment: { mimeType: string; data: string } | undefined,
  model: ModelType,
  onChunk: (text: string) => void
): Promise<string> => {
  
  const chatHistory = history
    .filter(msg => !msg.isStreaming) // Filter out incomplete states
    .map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [
        ...(msg.attachment ? [{ inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.data } }] : []),
        { text: msg.text }
      ]
    }));

  const chat: Chat = ai.chats.create({
    model: model,
    history: chatHistory,
    config: {
      systemInstruction: "Você é um assistente IA especializado em gestão de restaurantes e gastronomia. Ajude o dono do restaurante a criar descrições de pratos apetitosas, sugerir harmonizações de vinhos, criar posts de marketing para redes sociais e gerenciar crises com clientes. Responda de forma profissional e criativa.",
    }
  });

  // Prepare the new message parts
  const messageParts = [];
  if (attachment) {
    messageParts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data
      }
    });
  }
  messageParts.push({ text: newMessage });
  
  let fullText = '';
  
  try {
    const resultStream = await chat.sendMessageStream({ 
      message: messageParts.length === 1 && !attachment ? newMessage : messageParts 
    });

    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }

  return fullText;
};

/**
 * Helper to convert file to base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};