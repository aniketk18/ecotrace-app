import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Response } from '@/models/Response';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await dbConnect();
    const { userId, userName, empId, dept, answers, answerLabels, answerWeights, earths, totalCO2, catData, aiReport, questions } = req.body;

    if (!userName || !empId) return res.status(400).json({ error: 'Missing required fields' });

    // Upsert by empId — same behavior as HTML (one record per employee)
    const existing = await Response.findOne({ empId });

    const record: any = {
      userId: userId || empId,
      userName,
      empId,
      dept: dept || 'N/A',
      earths,
      totalCO2,
      catData,
      aiReport,
      timestamp: Date.now(),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    // Store answers as plain objects (not Maps for easier admin view)
    if (answers) record.answers = answers;
    if (answerLabels) record.answerLabels = answerLabels;
    if (answerWeights) record.answerWeights = answerWeights;
    if (questions) record.questions = questions;

    let saved;
    if (existing) {
      saved = await Response.findByIdAndUpdate(existing._id, record, { new: true });
    } else {
      saved = new Response(record);
      await saved.save();
    }

    return res.status(201).json({ message: 'Response saved successfully', responseId: saved._id });
  } catch (error) {
    console.error('Save response error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
