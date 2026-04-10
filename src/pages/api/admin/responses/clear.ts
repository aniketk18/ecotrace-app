import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Response } from '@/models/Response';
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
    await Response.deleteMany({});
    return res.status(200).json({ message: 'All responses cleared' });
  } catch (error) {
    console.error('Clear responses error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
