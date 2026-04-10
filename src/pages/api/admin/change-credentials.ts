import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Settings } from '@/models/Settings';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const verifyAdmin = (req: NextApiRequest): boolean => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET || 'secret'); return true; }
  catch { return false; }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Both fields required' });

  try {
    await dbConnect();
    const hashed = await bcrypt.hash(password, 10);
    await Settings.findOneAndUpdate(
      { key: 'admin_credentials' },
      { key: 'admin_credentials', value: { username, password: hashed } },
      { upsert: true }
    );
    return res.status(200).json({ message: 'Credentials updated' });
  } catch (error) {
    console.error('Change credentials error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
