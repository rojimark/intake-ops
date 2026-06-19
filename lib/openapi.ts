import OpenAI from "openai";

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  return new OpenAI({
    apiKey,
    baseURL: "http://localhost:9092/v1",
  });
}