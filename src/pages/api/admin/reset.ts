import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Question } from '@/models/Question';
import { Response } from '@/models/Response';
import { Settings } from '@/models/Settings';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req: NextApiRequest): boolean => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET || 'secret'); return true; }
  catch { return false; }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await dbConnect();
    await Question.deleteMany({});
    await Response.deleteMany({});
    await Settings.deleteMany({ key: { $in: ['formula', 'llm_api_key', 'llm_prompt'] } });
    return res.status(200).json({ message: 'Full reset complete' });
  } catch (error) {
    console.error('Full reset error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
