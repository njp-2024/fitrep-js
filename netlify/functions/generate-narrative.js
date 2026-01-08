// netlify/functions/generate-narrative.js
const { OpenAI } = require("openai");
require("dotenv").config();

exports.handler = async function (event, context) {
  // --- SECURITY LAYER 1: Method Check ---
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const { prompt } = body;

    // --- SECURITY LAYER 2: Input Validation ---
    
    // 1. Check if prompt exists and is a string
    if (!prompt || typeof prompt !== "string") {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid prompt format." }) };
    }

    // 2. Length Check (Cost Protection)
    // 2000 chars is plenty for a FitRep input. Prevents massive "book" submissions.
    if (prompt.length > 6000) {
        return { statusCode: 400, body: JSON.stringify({ error: "Prompt is too long. Max 6000 characters." }) };
    }

    // 3. Minimum Content Check
    if (prompt.trim().length < 50) {
         return { statusCode: 400, body: JSON.stringify({ error: "Prompt is too short." }) };
    }

    // --- LOGIC: Call OpenAI ---
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("Missing OpenAI API Key");
      return { statusCode: 500, body: JSON.stringify({ error: "Server Configuration Error" }) };
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        { 
            role: "system", 
            // SECURITY LAYER 3: Persona Locking
            // Strict instructions to prevent the AI from doing non-FitRep tasks.
            content: "You are an expert USMC evaluator writing a fitness report narrative. Only generate professional, military-style text based on the input. If the input is unrelated to performance evaluation, reply with 'Error: Input unrelated to performance'." 
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7, 
      max_tokens: 500, // Hard limit on output cost
    });

    const generatedText = completion.choices[0].message.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ text: generatedText }),
    };

  } catch (error) {
    console.error("Error generating narrative:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request." }),
    };
  }
};