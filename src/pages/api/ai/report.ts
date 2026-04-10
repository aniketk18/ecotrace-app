import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models/Settings';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { score, totalCO2, categories, answers } = req.body;

    // Get LLM configuration
    const apiKeySetting = await Settings.findOne({ key: 'llm_api_key' });
    const promptSetting = await Settings.findOne({ key: 'llm_prompt' });

    // Fallback logic: check process.env first, then DB
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_LLM_KEY || apiKeySetting?.value;

    if (!apiKey) {
      return res.status(400).json({ error: 'LLM API Key not configured in .env.local or DB' });
    }
    const defaultPrompt = `You are an expert Sustainability Analyst specializing in ESG (Environmental, Social, Governance), carbon footprint assessment, and behavioral impact analysis.

Your task is to analyze a user's sustainability report along with their questionnaire responses. Based on this data, identify root causes of environmental impact.

User Score: ${score} Earths, Total CO2: ${totalCO2} kg/month
User Category Breakdown: ${JSON.stringify(categories)}
User Answers:
${JSON.stringify(answers, null, 2)}

Generate a Root Cause & Environmental Impact Analysis in this format:

-> Area: <Area Name>
   Root Cause: <Behavior-based reasoning> (Max 2 Lines)
   Systemic Impact: <Macro-level ESG impact> (Max 2 Lines)`;

    const prompt = promptSetting?.value || defaultPrompt;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate report';

    return res.status(200).json({ report: reportText });
  } catch (error) {
    console.error('AI report generation error:', error);
    return res.status(500).json({ error: 'Failed to generate AI report' });
  }
}
