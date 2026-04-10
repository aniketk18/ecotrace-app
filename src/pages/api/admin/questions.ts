import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import { Question } from '@/models/Question';
import jwt from 'jsonwebtoken';

const DEFAULT_QUESTIONS = [
  { id:'e1', category:'energy', icon:'⚡', order:1, formula:'kWh × 0.82',
    text:'Monthly electricity consumption (kWh)',
    options:[{label:'< 100 kWh', emoji:'💡', weight:41},{label:'100–200 kWh', emoji:'🔌', weight:123},{label:'200–400 kWh', emoji:'⚡', weight:246},{label:'> 400 kWh', emoji:'🏭', weight:369}]},
  { id:'e2', category:'energy', icon:'💡', order:2, formula:'Behavioural waste factor',
    text:'How often do you forget to turn off lights and fans while not in use?',
    options:[{label:'Never', emoji:'✅', weight:0},{label:'Rarely', emoji:'🤏', weight:10},{label:'Sometimes', emoji:'😐', weight:20},{label:'Often', emoji:'😬', weight:35}]},
  { id:'e3', category:'energy', icon:'🖥️', order:3, formula:'Appliance kWh × 0.82',
    text:'How often do you use electric appliances for daily work?',
    options:[{label:'Never', emoji:'✅', weight:0},{label:'Rarely', emoji:'🤏', weight:4},{label:'Sometimes', emoji:'😐', weight:12},{label:'Often', emoji:'⚡', weight:25}]},
  { id:'e4', category:'energy', icon:'☀️', order:4, formula:'Renewable offset from Q1 electricity',
    text:'What percentage of your home\'s electricity comes from renewable sources?',
    options:[{label:'All (> 75%)', emoji:'☀️', weight:-30},{label:'Some (25–75%)', emoji:'⚡', weight:-15},{label:'Rarely (< 25%)', emoji:'🔌', weight:-5},{label:'None (0%)', emoji:'🏭', weight:0}]},
  { id:'e5', category:'energy', icon:'🔥', order:5, formula:'Cylinders × 43 kg CO₂ (LPG)',
    text:'Monthly LPG usage',
    options:[{label:'0 cylinders', emoji:'✅', weight:0},{label:'0.5 cylinder/month', emoji:'🍳', weight:21},{label:'1 cylinder/month', emoji:'🔥', weight:43},{label:'> 1 cylinder/month', emoji:'🏭', weight:64}]},
  { id:'t1', category:'transport', icon:'🚗', order:6, formula:'Mode emission factor × 30 days',
    text:'Primary mode of transport for your family',
    options:[{label:'Walking / Cycling', emoji:'🚶', weight:0},{label:'Public Transport (Bus / Metro)', emoji:'🚌', weight:15},{label:'Motorcycle / Scooter', emoji:'🏍️', weight:35},{label:'Private Car (Petrol / Diesel)', emoji:'🚗', weight:60}]},
  { id:'t2', category:'transport', icon:'🚌', order:7, formula:'Public transport offset',
    text:'How often do you use public transport?',
    options:[{label:'Often — it\'s my primary mode', emoji:'✅', weight:0},{label:'Sometimes', emoji:'🚌', weight:10},{label:'Rarely', emoji:'🚗', weight:20},{label:'Never', emoji:'🏎️', weight:40}]},
  { id:'t3', category:'transport', icon:'📍', order:8, formula:'km/day × 30 × 0.15 kg CO₂/km',
    text:'Daily travel distance (total for your family)',
    options:[{label:'< 5 km / day', emoji:'🏠', weight:11},{label:'5–10 km / day', emoji:'🚴', weight:34},{label:'10–20 km / day', emoji:'🚗', weight:68},{label:'> 20 km / day', emoji:'✈️', weight:113}]},
  { id:'f1', category:'food', icon:'🥗', order:9, formula:'Diet base emission factor',
    text:'What is your diet type?',
    options:[{label:'Vegetarian', emoji:'🥗', weight:10},{label:'Eggetarian', emoji:'🥚', weight:20},{label:'Non-vegetarian', emoji:'🍖', weight:30}]},
  { id:'f2', category:'food', icon:'🍖', order:10, formula:'Meals/month × 5 kg CO₂ (non-veg)',
    text:'How often do you eat non-veg?',
    options:[{label:'Never', emoji:'🌱', weight:0},{label:'1–2 times / week', emoji:'🍗', weight:30},{label:'3–5 times / week', emoji:'🥩', weight:80},{label:'Daily', emoji:'🍖', weight:150}]},
  { id:'f3', category:'food', icon:'🌾', order:11, formula:'Local / unprocessed food offset',
    text:'How much of the food you eat is unprocessed, unpackaged, or locally grown?',
    options:[{label:'All — mostly local & unprocessed', emoji:'🌾', weight:-20},{label:'Some — mix of local and packaged', emoji:'🏪', weight:-10},{label:'None — mostly packaged / imported', emoji:'📦', weight:0}]},
  { id:'f4', category:'food', icon:'🗑️', order:12, formula:'Food waste decomposition emissions',
    text:'Food waste frequency in your home',
    options:[{label:'Never', emoji:'✅', weight:0},{label:'Rarely', emoji:'🤏', weight:10},{label:'Sometimes', emoji:'😐', weight:20},{label:'Often', emoji:'🗑️', weight:35}]},
  { id:'w1', category:'waste', icon:'♻️', order:13, formula:'Waste segregation impact',
    text:'How often do you segregate waste?',
    options:[{label:'Always', emoji:'✅', weight:0},{label:'Sometimes', emoji:'😐', weight:15},{label:'Never', emoji:'🗑️', weight:30}]},
  { id:'w2', category:'waste', icon:'🧴', order:14, formula:'Single-use plastic impact',
    text:'How often do you carry a reusable bottle / bag?',
    options:[{label:'Always', emoji:'♻️', weight:0},{label:'Sometimes', emoji:'😐', weight:10},{label:'Never', emoji:'🛍️', weight:20}]},
  { id:'w3', category:'waste', icon:'🤝', order:15, formula:'Civic engagement factor',
    text:'How often do you engage in waste management or sustainability advocacy tasks?',
    options:[{label:'Always', emoji:'🌿', weight:0},{label:'Sometimes', emoji:'👍', weight:5},{label:'Never', emoji:'😶', weight:10}]},
  { id:'w4', category:'waste', icon:'👗', order:16, formula:'Fashion consumption frequency',
    text:'How often do you buy new clothes?',
    options:[{label:'Monthly', emoji:'🛒', weight:30},{label:'Every 2–3 months', emoji:'🛍️', weight:20},{label:'Twice a year', emoji:'📅', weight:10},{label:'Once a year or less', emoji:'✅', weight:5}]},
  { id:'w5', category:'waste', icon:'🧥', order:17, formula:'Clothing volume impact',
    text:'On average, how many new clothing items do you buy in a year?',
    options:[{label:'0–5 items', emoji:'✅', weight:5},{label:'6–10 items', emoji:'👕', weight:15},{label:'11–20 items', emoji:'🛍️', weight:25},{label:'20+ items', emoji:'🏪', weight:35}]},
  { id:'w6', category:'waste', icon:'🏭', order:18, formula:'Fashion production & transport emissions',
    text:'What type of clothing do you mostly purchase?',
    options:[{label:'Fast fashion (low-cost, trend-based)', emoji:'⚡', weight:25},{label:'Branded (mid/high range)', emoji:'💼', weight:15},{label:'Sustainable / eco-friendly brands', emoji:'🌿', weight:5},{label:'Second-hand / thrift', emoji:'♻️', weight:0}]},
  { id:'w7', category:'waste', icon:'⏱️', order:19, formula:'Garment lifespan & disposal rate',
    text:'How long do you typically wear your clothes?',
    options:[{label:'Less than 1 year', emoji:'⏩', weight:25},{label:'1–2 years', emoji:'📅', weight:15},{label:'3–5 years', emoji:'✅', weight:5},{label:'Until worn out', emoji:'🏆', weight:0}]},
  { id:'w8', category:'waste', icon:'👚', order:20, formula:'End-of-life disposal emissions',
    text:'What do you do with old clothes?',
    options:[{label:'Throw away', emoji:'🗑️', weight:20},{label:'Donate', emoji:'🤝', weight:5},{label:'Reuse (home use, cleaning cloths)', emoji:'♻️', weight:3},{label:'Recycle', emoji:'🔄', weight:0}]},
  { id:'w9', category:'waste', icon:'🧵', order:21, formula:'Material production emissions factor',
    text:'What type of materials do you mostly wear?',
    options:[{label:'Cotton', emoji:'🌸', weight:5},{label:'Synthetic (polyester, nylon)', emoji:'⚗️', weight:20},{label:'Wool', emoji:'🐑', weight:15},{label:'Blended fabrics', emoji:'🔀', weight:10},{label:'Sustainable (organic cotton, bamboo, recycled)', emoji:'🌿', weight:0}]},
  { id:'w10', category:'waste', icon:'👜', order:22, formula:'Leather industry emissions (methane + land use)',
    text:'Do you use leather products (shoes, bags, belts)?',
    options:[{label:'Yes, frequently', emoji:'🐄', weight:20},{label:'Occasionally', emoji:'😐', weight:10},{label:'Rarely', emoji:'🤏', weight:5},{label:'Never', emoji:'✅', weight:0}]},
  { id:'w11', category:'waste', icon:'🛍️', order:23, formula:'Leather purchase frequency',
    text:'How often do you buy leather products?',
    options:[{label:'Every year', emoji:'📅', weight:20},{label:'Every 2–3 years', emoji:'🗓️', weight:10},{label:'Rarely', emoji:'🤏', weight:5},{label:'Never', emoji:'✅', weight:0}]},
  { id:'w12', category:'waste', icon:'👟', order:24, formula:'Footwear material & production impact',
    text:'What type of footwear do you mostly use?',
    options:[{label:'Leather', emoji:'🐄', weight:15},{label:'Synthetic (PU, rubber, plastic)', emoji:'⚗️', weight:10},{label:'Fabric-based (canvas, cloth)', emoji:'✅', weight:3},{label:'Mixed materials', emoji:'🔀', weight:8}]},
  { id:'w13', category:'waste', icon:'👜', order:25, formula:'Accessories material production impact',
    text:'What type of bags / accessories do you usually use?',
    options:[{label:'Leather', emoji:'🐄', weight:15},{label:'Synthetic (PU, plastic)', emoji:'⚗️', weight:10},{label:'Fabric (cotton, jute)', emoji:'🌿', weight:3},{label:'Recycled / eco-friendly materials', emoji:'♻️', weight:0}]},
  { id:'w14', category:'waste', icon:'💧', order:26, formula:'Container lifecycle & plastic pollution impact',
    text:'What kind of water bottles / containers do you use regularly?',
    options:[{label:'Plastic (single-use or reused)', emoji:'🧴', weight:20},{label:'Steel', emoji:'🔩', weight:5},{label:'Glass', emoji:'🔮', weight:3},{label:'Copper', emoji:'🟤', weight:2}]},
  { id:'w15', category:'waste', icon:'📦', order:27, formula:'Packaging material production & disposal',
    text:'What type of packaging do you mostly use or receive?',
    options:[{label:'Plastic', emoji:'🧴', weight:20},{label:'Paper / cardboard', emoji:'📦', weight:10},{label:'Cloth / jute', emoji:'🌿', weight:3},{label:'Minimal / no packaging', emoji:'✅', weight:0}]},
];

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
  if (!verifyAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await dbConnect();

    if (req.method === 'GET') {
      let qs = await Question.find().sort({ order: 1 });
      if (!qs || qs.length === 0) {
        // Seed defaults
        await Question.insertMany(DEFAULT_QUESTIONS);
        qs = await Question.find().sort({ order: 1 });
      }
      return res.status(200).json(qs);
    }

    if (req.method === 'POST') {
      const { text, icon, formula, category, options } = req.body;
      if (!text || !category || !options) return res.status(400).json({ error: 'Missing required fields' });
      const count = await Question.countDocuments();
      const newQ = new Question({
        id: 'q' + Date.now(), category, icon: icon || '❓',
        order: count + 1, formula, text, options,
      });
      await newQ.save();
      return res.status(201).json(newQ);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      await Question.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin questions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
