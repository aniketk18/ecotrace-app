import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Response } from '@/models/Response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const response = await Response.findById(id);
      if (!response) {
        return res.status(404).json({ error: 'Response not found' });
      }
      return res.status(200).json(response);
    } 
    
    if (req.method === 'PUT') {
      const { aiReport } = req.body;
      const updatedResponse = await Response.findByIdAndUpdate(
        id,
        { $set: { aiReport } },
        { new: true }
      );
      if (!updatedResponse) {
        return res.status(404).json({ error: 'Response not found' });
      }
      return res.status(200).json(updatedResponse);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(`Response [${req.method}] error:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
