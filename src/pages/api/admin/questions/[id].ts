import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Question } from '@/models/Question';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req: NextApiRequest): boolean => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return true;
  } catch { return false; }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  await dbConnect();

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { text, icon, formula, category, options } = req.body;
    const updated = await Question.findByIdAndUpdate(id, { text, icon, formula, category, options }, { new: true });
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    await Question.findByIdAndDelete(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
