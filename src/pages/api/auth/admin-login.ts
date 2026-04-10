import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import { Settings } from '@/models/Settings';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await dbConnect();
    const { username, password } = req.body;

    if (!username || !password) return res.status(400).json({ error: 'Both fields required' });

    // Check custom credentials in Settings first
    const customCreds = await Settings.findOne({ key: 'admin_credentials' });
    let isValid = false;

    if (customCreds?.value) {
      const match = await bcrypt.compare(password, customCreds.value.password);
      if (username === customCreds.value.username && match) isValid = true;
    }

    // Fall back to Admin model / default credentials
    if (!isValid) {
      const admin = await Admin.findOne({ username });
      if (admin) {
        isValid = await admin.comparePassword(password);
      } else if (username === 'admin' && password === 'admin123') {
        // Default credentials
        isValid = true;
      }
    }

    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
