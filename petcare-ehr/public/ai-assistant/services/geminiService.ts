
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `You are PawPal, a world-class AI pet care consultant. 
Provide expert, empathetic advice for dogs, cats, and other pets.
If a medical emergency is described, urge the user to see a vet immediately.`;

export class GeminiService {
  private ai: GoogleGenAI;
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async chat(history: Message[], userInput: string, imageBase64?: string): Promise<Message> {
    const contents: any[] = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const currentParts: any[] = [{ text: userInput }];
    if (imageBase64) {
      currentParts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } });
    }
    contents.push({ role: 'user', parts: currentParts });

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTION, tools: [{ googleSearch: {} }] },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      uri: chunk.web?.uri || '',
      title: chunk.web?.title || 'Source'
    })).filter((s: any) => s.uri !== '') || [];

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.text || "I'm sorry, I couldn't process that.",
      timestamp: Date.now(),
      sources: sources.length > 0 ? sources : undefined
    };
  }
}
export const geminiService = new GeminiService();
