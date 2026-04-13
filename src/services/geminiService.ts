import { GoogleGenAI } from "@google/genai";

const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ScriptParams {
  numPeople: number;
  names: string[];
  topic: string;
  level: string;
  grammarTopic: string;
  wordCount: number;
}

export async function generateGermanScript(params: ScriptParams) {
  const model = "gemini-2.0-flash";
  const prompt = `
    Create a German conversation script based on the following:
    - Number of people: ${params.numPeople}
    - Names: ${params.names.join(", ")}
    - Topic: ${params.topic}
    - Language Level: ${params.level}
    - Specific Grammar Focus: ${params.grammarTopic}
    - Approximate Word Count: ${params.wordCount} words

    The script should be natural, engaging, and appropriate for the ${params.level} level.
    Include the character names before each line of dialogue.
    Format the output in Markdown.
    At the end, provide a brief summary of how the grammar topic "${params.grammarTopic}" was used in the script.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
}

export async function explainWord(word: string, context: string, level: string) {
  const model = "gemini-2.0-flash";
  const prompt = `
    Explain the German word or phrase "${word}" in the context of this sentence: "${context}".
    The explanation should be suitable for a student at the ${level} level.
    Provide:
    1. Meaning in English.
    2. Grammar notes (e.g., gender for nouns, conjugation for verbs).
    3. Two simple example sentences in German with English translations.
    Format the response in a clear, student-friendly way using Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error explaining word:", error);
    throw error;
  }
}
