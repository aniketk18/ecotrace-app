import { NextApiRequest, NextApiResponse } from 'next';

// Employee login — just validates presence of name and empId, returns a session object.
// No database lookup needed since employees are identified just by name/empId.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, empId, dept } = req.body;

  if (!name || !empId) return res.status(400).json({ error: 'Name and Employee ID required' });

  // Generate a simple userId from empId
  const userId = empId.toLowerCase().replace(/\s+/g, '_');

  return res.status(200).json({
    message: 'Login successful',
    userId,
    name,
    empId,
    dept: dept || 'N/A',
  });
}
