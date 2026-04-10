import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Question } from '@/models/Question';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await dbConnect();
    const questions = await Question.find().sort({ order: 1 }).lean();

    // Normalize: ensure `text` field exists (could be stored as `question` in legacy data)
    const normalized = questions.map((q: any) => ({
      ...q,
      text: q.text || q.question || '',
    }));

    return res.status(200).json(normalized);
  } catch (error) {
    console.error('Get questions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
