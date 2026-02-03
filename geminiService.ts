
import { GoogleGenAI, Type } from "@google/genai";
import { Question, SearchResult } from "./types";

const API_KEY = process.env.API_KEY || "";

export const findDuplicates = async (
  inputQuestion: string,
  existingQuestions: Question[]
): Promise<SearchResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Format questions for context
  const questionsContext = existingQuestions.map(q => `ID: ${q.id} | Content: ${q.text}`).join('\n');

  const systemInstruction = `
    You are an intelligent duplicate question detection assistant. 
    Compare the "Input Question" provided by the user against the list of "Existing Questions".
    Identify questions that are semantically identical or very similar, even if phrased differently.
    
    Return a JSON response with:
    1. "matches": An array of objects containing "questionId", "similarityScore" (0-100), and "reasoning" (a short explanation in Vietnamese).
    2. "analysis": A brief overall summary in Vietnamese about the similarity of the input to the existing database.
    
    Only include matches with a similarity score higher than 40.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Input Question: "${inputQuestion}"
        
        Existing Questions:
        ${questionsContext}
      `,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionId: { type: Type.STRING },
                  similarityScore: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING }
                },
                required: ["questionId", "similarityScore", "reasoning"]
              }
            },
            analysis: { type: Type.STRING }
          },
          required: ["matches", "analysis"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"matches": [], "analysis": "Không tìm thấy kết quả."}');
    return result;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      matches: [],
      analysis: "Đã xảy ra lỗi khi phân tích bằng AI. Vui lòng thử lại sau."
    };
  }
};
