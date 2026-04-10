import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Response } from '@/models/Response';
import jwt from 'jsonwebtoken';

const verifyAdmin = (req: NextApiRequest): boolean => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return false;

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'secret');
    return true;
  } catch {
    return false;
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      await dbConnect();
      const responses = await Response.find().sort({ createdAt: -1 });
      return res.status(200).json(responses);
    } catch (error) {
      console.error('Get responses error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await dbConnect();
      const { id } = req.body;
      await Response.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Response deleted' });
    } catch (error) {
      console.error('Delete response error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
