import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Question } from '@/models/Question';
import { Settings } from '@/models/Settings';
import { Admin } from '@/models/Admin';

const DEFAULT_QUESTIONS = [
  {
    id: 'e1',
    category: 'energy',
    icon: '⚡',
    order: 1,
    formula: 'kWh × 0.82',
    question: 'Monthly electricity consumption (kWh)',
    options: [
      { emoji: '🔌', label: '0–50 kWh', weight: 41 },
      { emoji: '🔌', label: '50–100 kWh', weight: 82 },
      { emoji: '🔌', label: '100–200 kWh', weight: 164 },
      { emoji: '🔌', label: '200–400 kWh', weight: 328 },
      { emoji: '🔌', label: '>400 kWh', weight: 500 },
    ],
  },
  {
    id: 'e2',
    category: 'energy',
    icon: '💡',
    order: 2,
    formula: 'Behavioural waste factor',
    question: 'How often do you forget to turn off lights and fans while not in use?',
    options: [
      { emoji: '✅', label: 'Never', weight: 0 },
      { emoji: '⚠️', label: 'Sometimes', weight: 15 },
      { emoji: '❌', label: 'Often', weight: 30 },
      { emoji: '❌', label: 'Always', weight: 50 },
    ],
  },
  {
    id: 'e3',
    category: 'energy',
    icon: '🖥️',
    order: 3,
    formula: 'Appliance kWh × 0.82',
    question: 'How often do you use electric appliances for daily work?',
    options: [
      { emoji: '✅', label: 'Never', weight: 0 },
      { emoji: '⚠️', label: 'Rarely', weight: 20 },
      { emoji: '⚠️', label: 'Sometimes', weight: 40 },
      { emoji: '❌', label: 'Always', weight: 60 },
    ],
  },
  {
    id: 'e4',
    category: 'energy',
    icon: '☀️',
    order: 4,
    formula: 'Renewable offset from Q1 electricity',
    question: 'What percentage of your home\'s electricity comes from renewable sources?',
    options: [
      { emoji: '🌱', label: 'All (100%)', weight: -164 },
      { emoji: '🌱', label: 'Most (75%)', weight: -82 },
      { emoji: '⚠️', label: 'Some (25–50%)', weight: -41 },
      { emoji: '❌', label: 'Rarely (<25%)', weight: 0 },
    ],
  },
  {
    id: 'e5',
    category: 'energy',
    icon: '🔥',
    order: 5,
    formula: 'Cylinders × 43 kg CO₂ (LPG)',
    question: 'Monthly LPG usage',
    options: [
      { emoji: '✅', label: 'None', weight: 0 },
      { emoji: '⚠️', label: '0.25 cylinder/month', weight: 11 },
      { emoji: '⚠️', label: '0.5 cylinder/month', weight: 22 },
      { emoji: '❌', label: '1+ cylinder/month', weight: 43 },
    ],
  },
  {
    id: 't1',
    category: 'transport',
    icon: '🚗',
    order: 6,
    formula: 'Mode emission factor × 30 days',
    question: 'Primary mode of transport for your family',
    options: [
      { emoji: '🚴', label: 'Walk / Cycle', weight: 0 },
      { emoji: '🚌', label: 'Public transport', weight: 45 },
      { emoji: '🏍️', label: 'Motorcycle / Scooter', weight: 68 },
      { emoji: '🚗', label: 'Personal car', weight: 136 },
    ],
  },
  {
    id: 't2',
    category: 'transport',
    icon: '🚌',
    order: 7,
    formula: 'Public transport offset',
    question: 'How often do you use public transport?',
    options: [
      { emoji: '✅', label: 'Always — it\'s my primary mode', weight: -68 },
      { emoji: '⚠️', label: 'Often', weight: -34 },
      { emoji: '⚠️', label: 'Sometimes', weight: -17 },
      { emoji: '❌', label: 'Never', weight: 0 },
    ],
  },
  {
    id: 't3',
    category: 'transport',
    icon: '📍',
    order: 8,
    formula: 'km/day × 30 × 0.15 kg CO₂/km',
    question: 'Daily travel distance (total for your family)',
    options: [
      { emoji: '✅', label: '0–5 km / day', weight: 0 },
      { emoji: '⚠️', label: '5–10 km / day', weight: 23 },
      { emoji: '⚠️', label: '10–20 km / day', weight: 45 },
      { emoji: '❌', label: '>20 km / day', weight: 90 },
    ],
  },
  {
    id: 'f1',
    category: 'food',
    icon: '🥗',
    order: 9,
    formula: 'Diet base emission factor',
    question: 'What is your diet type?',
    options: [
      { emoji: '🌱', label: 'Vegan', weight: 20 },
      { emoji: '🥬', label: 'Vegetarian', weight: 35 },
      { emoji: '🍖', label: 'Non-vegetarian', weight: 60 },
    ],
  },
  {
    id: 'f2',
    category: 'food',
    icon: '🍖',
    order: 10,
    formula: 'Meals/month × 5 kg CO₂ (non-veg)',
    question: 'How often do you eat non-veg?',
    options: [
      { emoji: '✅', label: 'Never', weight: 0 },
      { emoji: '⚠️', label: '1–2 times / week', weight: 10 },
      { emoji: '⚠️', label: '3–5 times / week', weight: 25 },
      { emoji: '❌', label: 'Daily', weight: 40 },
    ],
  },
  {
    id: 'f3',
    category: 'food',
    icon: '🌾',
    order: 11,
    formula: 'Local / unprocessed food offset',
    question: 'How much of the food you eat is unprocessed, unpackaged, or locally grown?',
    options: [
      { emoji: '🌱', label: 'All — mostly local & unprocessed', weight: -20 },
      { emoji: '🌱', label: 'Most (>75%)', weight: -10 },
      { emoji: '⚠️', label: 'Some (25–50%)', weight: -5 },
      { emoji: '❌', label: 'None — packaged & imported', weight: 0 },
    ],
  },
  {
    id: 'f4',
    category: 'food',
    icon: '🗑️',
    order: 12,
    formula: 'Food waste decomposition emissions',
    question: 'Food waste frequency in your home',
    options: [
      { emoji: '✅', label: 'Very rare', weight: 0 },
      { emoji: '⚠️', label: 'Sometimes', weight: 5 },
      { emoji: '❌', label: 'Often', weight: 10 },
      { emoji: '❌', label: 'Very often', weight: 15 },
    ],
  },
  {
    id: 'w1',
    category: 'waste',
    icon: '♻️',
    order: 13,
    formula: 'Waste segregation impact',
    question: 'How often do you segregate waste?',
    options: [
      { emoji: '✅', label: 'Always', weight: 0 },
      { emoji: '⚠️', label: 'Often', weight: 5 },
      { emoji: '⚠️', label: 'Sometimes', weight: 10 },
      { emoji: '❌', label: 'Never', weight: 20 },
    ],
  },
  {
    id: 'w2',
    category: 'waste',
    icon: '🧴',
    order: 14,
    formula: 'Single-use plastic impact',
    question: 'How often do you carry a reusable bottle / bag?',
    options: [
      { emoji: '✅', label: 'Always', weight: 0 },
      { emoji: '⚠️', label: 'Sometimes', weight: 5 },
      { emoji: '⚠️', label: 'Rarely', weight: 10 },
      { emoji: '❌', label: 'Never', weight: 15 },
    ],
  },
  {
    id: 'w3',
    category: 'waste',
    icon: '🤝',
    order: 15,
    formula: 'Civic engagement factor',
    question: 'How often do you engage in waste management or sustainability advocacy tasks?',
    options: [
      { emoji: '✅', label: 'Always', weight: -10 },
      { emoji: '⚠️', label: 'Sometimes', weight: -5 },
      { emoji: '⚠️', label: 'Rarely', weight: 0 },
      { emoji: '❌', label: 'Never', weight: 10 },
    ],
  },
  {
    id: 'w4',
    category: 'waste',
    icon: '👗',
    order: 16,
    formula: 'Fashion consumption frequency',
    question: 'How often do you buy new clothes?',
    options: [
      { emoji: '✅', label: 'Rarely (once a year)', weight: 5 },
      { emoji: '⚠️', label: 'Every 6 months', weight: 10 },
      { emoji: '⚠️', label: 'Every 2–3 months', weight: 20 },
      { emoji: '❌', label: 'Monthly or more', weight: 30 },
    ],
  },
  {
    id: 'w5',
    category: 'waste',
    icon: '🧥',
    order: 17,
    formula: 'Clothing volume impact',
    question: 'On average, how many new clothing items do you buy in a year?',
    options: [
      { emoji: '✅', label: '0–5 items', weight: 0 },
      { emoji: '⚠️', label: '6–10 items', weight: 10 },
      { emoji: '⚠️', label: '11–20 items', weight: 20 },
      { emoji: '❌', label: '>20 items', weight: 35 },
    ],
  },
  {
    id: 'w6',
    category: 'waste',
    icon: '🏭',
    order: 18,
    formula: 'Fashion production & transport emissions',
    question: 'What type of clothing do you mostly purchase?',
    options: [
      { emoji: '🌱', label: 'Second-hand / thrift', weight: 5 },
      { emoji: '⚠️', label: 'Sustainable / organic', weight: 10 },
      { emoji: '⚠️', label: 'Regular commercial', weight: 20 },
      { emoji: '❌', label: 'Fast fashion (trendy brands)', weight: 30 },
    ],
  },
  {
    id: 'w7',
    category: 'waste',
    icon: '⏱️',
    order: 19,
    formula: 'Garment lifespan & disposal rate',
    question: 'How long do you typically wear your clothes?',
    options: [
      { emoji: '✅', label: '3+ years', weight: 0 },
      { emoji: '⚠️', label: '2–3 years', weight: 5 },
      { emoji: '⚠️', label: '1–2 years', weight: 10 },
      { emoji: '❌', label: '<1 year', weight: 20 },
    ],
  },
  {
    id: 'w8',
    category: 'waste',
    icon: '👚',
    order: 20,
    formula: 'End-of-life disposal emissions',
    question: 'What do you do with old clothes?',
    options: [
      { emoji: '🌱', label: 'Donate', weight: 0 },
      { emoji: '⚠️', label: 'Gift to others', weight: 2 },
      { emoji: '⚠️', label: 'Repurpose / upcycle', weight: 0 },
      { emoji: '❌', label: 'Throw away', weight: 10 },
    ],
  },
  {
    id: 'w9',
    category: 'waste',
    icon: '🧵',
    order: 21,
    formula: 'Material production emissions factor',
    question: 'What type of materials do you mostly wear?',
    options: [
      { emoji: '🌱', label: 'Cotton', weight: 8 },
      { emoji: '🌱', label: 'Wool', weight: 10 },
      { emoji: '⚠️', label: 'Polyester', weight: 15 },
      { emoji: '❌', label: 'Synthetic blends', weight: 20 },
    ],
  },
  {
    id: 'w10',
    category: 'waste',
    icon: '👜',
    order: 22,
    formula: 'Leather industry emissions (methane + land use)',
    question: 'Do you use leather products (shoes, bags, belts)?',
    options: [
      { emoji: '✅', label: 'Never', weight: 0 },
      { emoji: '⚠️', label: 'Rarely', weight: 5 },
      { emoji: '⚠️', label: 'Sometimes', weight: 10 },
      { emoji: '❌', label: 'Yes, frequently', weight: 20 },
    ],
  },
  {
    id: 'w11',
    category: 'waste',
    icon: '🛍️',
    order: 23,
    formula: 'Leather purchase frequency',
    question: 'How often do you buy leather products?',
    options: [
      { emoji: '✅', label: 'Never', weight: 0 },
      { emoji: '⚠️', label: 'Rarely (every 2+ years)', weight: 3 },
      { emoji: '⚠️', label: 'Occasionally (once a year)', weight: 7 },
      { emoji: '❌', label: 'Frequently (multiple times/year)', weight: 15 },
    ],
  },
  {
    id: 'w12',
    category: 'waste',
    icon: '👟',
    order: 24,
    formula: 'Footwear material & production impact',
    question: 'What type of footwear do you mostly use?',
    options: [
      { emoji: '🌱', label: 'Canvas / fabric', weight: 5 },
      { emoji: '⚠️', label: 'Synthetic', weight: 10 },
      { emoji: '⚠️', label: 'Leather', weight: 15 },
      { emoji: '❌', label: 'High-end / luxury leather', weight: 20 },
    ],
  },
  {
    id: 'w13',
    category: 'waste',
    icon: '👜',
    order: 25,
    formula: 'Accessories material production impact',
    question: 'What type of bags / accessories do you usually use?',
    options: [
      { emoji: '🌱', label: 'Fabric (cotton, jute)', weight: 5 },
      { emoji: '⚠️', label: 'Synthetic / nylon', weight: 10 },
      { emoji: '⚠️', label: 'Leather', weight: 15 },
      { emoji: '❌', label: 'Multiple / seasonal', weight: 20 },
    ],
  },
  {
    id: 'w14',
    category: 'waste',
    icon: '💧',
    order: 26,
    formula: 'Container lifecycle & plastic pollution impact',
    question: 'What kind of water bottles / containers do you use regularly?',
    options: [
      { emoji: '✅', label: 'Reusable (metal / glass)', weight: 0 },
      { emoji: '⚠️', label: 'Reusable (plastic)', weight: 5 },
      { emoji: '⚠️', label: 'Plastic (single-use or reused)', weight: 10 },
      { emoji: '❌', label: 'Multiple containers / wasteful', weight: 15 },
    ],
  },
  {
    id: 'w15',
    category: 'waste',
    icon: '📦',
    order: 27,
    formula: 'Packaging material production & disposal',
    question: 'What type of packaging do you mostly use or receive?',
    options: [
      { emoji: '🌱', label: 'Cloth / jute', weight: 0 },
      { emoji: '🌱', label: 'Paper / cardboard', weight: 3 },
      { emoji: '⚠️', label: 'Mixed (plastic + paper)', weight: 8 },
      { emoji: '❌', label: 'Excessive plastic', weight: 20 },
    ],
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if questions already exist
    const existingQuestions = await Question.countDocuments();
    if (existingQuestions > 0) {
      return res.status(400).json({ error: 'Database already seeded' });
    }

    // Insert default questions
    await Question.insertMany(DEFAULT_QUESTIONS);

    // Insert default formula
    await Settings.create({
      key: 'formula',
      value: { electricity: 0.82, transport: 0.15, food: 5, threshold: 142 },
      updatedBy: 'system',
    });

    // Insert default LLM prompt
    await Settings.create({
      key: 'llm_prompt',
      value: 'Please analyze the user sustainability report...',
      updatedBy: 'system',
    });

    // Create default admin user
    const admin = new Admin({
      username: 'admin',
      password: 'admin123',
      email: 'admin@ecotrace.local',
    });
    await admin.save();

    return res.status(200).json({
      message: 'Database seeded successfully',
      questionsCount: DEFAULT_QUESTIONS.length,
      adminCreated: true,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Seeding failed' });
  }
}
