import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function suggestTags(title: string, content: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 relevant tags for a blog post with title: "${title}" and content: "${content.substring(0, 1000)}". Return only the tags as a JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return [];
  }
}

export async function filterComment(comment: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this comment: "${comment}". Is it spam, offensive, or inappropriate? Return a JSON object with a boolean field "is_spam" and a string field "reason".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_spam: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["is_spam", "reason"]
        }
      }
    });
    return JSON.parse(response.text || '{"is_spam": false, "reason": ""}');
  } catch (error) {
    console.error("Error filtering comment:", error);
    return { is_spam: false, reason: "" };
  }
}
