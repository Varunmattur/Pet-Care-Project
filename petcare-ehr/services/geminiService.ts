
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `You are PawPal, a world-class AI pet care consultant and veterinary assistant. 
Your goal is to provide accurate, empathetic, and scientifically-backed advice for a wide range of pets including dogs, cats, birds, fish, and exotic animals.

Guidelines:
1. Prioritize Safety: If a user describes symptoms that suggest a medical emergency (e.g., difficulty breathing, uncontrolled bleeding, poisoning, extreme lethargy), clearly advise them to contact a veterinarian IMMEDIATELY.
2. Nutrition: Provide advice on safe and toxic foods.
3. Behavior: Give positive reinforcement training tips.
4. Tone: Be friendly, supportive, and knowledgeable.
5. Search: Use Google Search to find current data on specific pet products or local pet-related laws if necessary.
6. Images: When analyzing images, identify the pet or object and provide relevant safety or care info.`;

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async chat(history: Message[], userInput: string, imageBase64?: string): Promise<Message> {
    const model = 'gemini-3-flash-preview';
    
    // Prepare contents
    const contents: any[] = history.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const currentParts: any[] = [{ text: userInput }];
    if (imageBase64) {
      currentParts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64.split(',')[1]
        }
      });
    }

    contents.push({ role: 'user', parts: currentParts });

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "I'm sorry, I couldn't process that request.";
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || 'Source'
      })).filter((s: any) => s.uri !== '') || [];

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
        sources: sources.length > 0 ? sources : undefined
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to my brain right now. Please check your connection or try again later.",
        timestamp: Date.now()
      };
    }
  }
}

export const geminiService = new GeminiService();
