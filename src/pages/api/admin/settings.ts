import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req: NextApiRequest): boolean => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET || 'secret'); return true; }
  catch { return false; }
};

async function getSetting(key: string) {
  const s = await Settings.findOne({ key });
  return s ? s.value : null;
}

async function setSetting(key: string, value: any) {
  await Settings.findOneAndUpdate({ key }, { key, value }, { upsert: true, new: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const formula = await getSetting('formula') || { electricity: 0.82, transport: 0.15, food: 5, threshold: 142 };
      const llmApiKey = await getSetting('llm_api_key') || '';
      const llmPrompt = await getSetting('llm_prompt') || '';
      return res.status(200).json({ formula, llmApiKey, llmPrompt });
    }

    if (req.method === 'POST') {
      const { formula, llmApiKey, llmPrompt } = req.body;
      if (formula) await setSetting('formula', formula);
      if (llmApiKey !== undefined) await setSetting('llm_api_key', llmApiKey);
      if (llmPrompt !== undefined) await setSetting('llm_prompt', llmPrompt);
      return res.status(200).json({ message: 'Settings saved' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
