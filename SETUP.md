# 🚀 EcoTrace Quick Setup Guide

Get EcoTrace running in 5 minutes!

## Step 1: Prerequisites (2 min)

1. **MongoDB Atlas Setup**
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Create free account
   - Create M0 (free) cluster
   - Create database user (save username & password)
   - Click "Connect" → Copy connection string
   - Add your IP to network access

2. **Get Gemini API Key**
   - Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Click "Create new API key"
   - Copy the key

## Step 2: Clone and Install (1 min)

```bash
# Navigate to the project
cd ecotrace-app

# Install dependencies
npm install
```

## Step 3: Configure Environment (1 min)

Create `.env.local` file:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/ecotrace?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_jwt_key_change_this
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace:
- `YOUR_USERNAME` - MongoDB user
- `YOUR_PASSWORD` - MongoDB password
- `YOUR_GEMINI_API_KEY` - Your Gemini key

## Step 4: Initialize Database (1 min)

```bash
# Start development server
npm run dev
```

In a new terminal:
```bash
# Initialize database (run once only)
curl -X POST http://localhost:3000/api/seed
```

You should see:
```json
{
  "message": "Database seeded successfully",
  "questionsCount": 27,
  "adminCreated": true
}
```

## Step 5: Access the Application (Done!)

### For Employees:
- **URL**: http://localhost:3000
- Click "Start Assessment"
- Login with your name and employee ID
- Complete 27 questions
- View results and AI analysis
- Download PDF report

### For Admins:
- **URL**: http://localhost:3000/admin-login
- **Username**: `admin`
- **Password**: `admin123` (⚠️ Change in production!)
- Manage questions, view responses, configure LLM, adjust formulas

## Common Issues & Solutions

### "Cannot connect to MongoDB"
```bash
# Check MONGODB_URI is correct
# Make sure your IP is whitelisted in MongoDB Atlas
# Verify username and password (not connection string password)
```

### "Gemini API error"
```bash
# Check API key is correct
# Verify API is enabled in Google Cloud
# Check API quota isn't exceeded
```

### Port 3000 already in use
```bash
# Use different port
npm run dev -- -p 3001
```

### Database already seeded
- That's OK! Just delete and recreate the cluster if needed

## What's Next?

1. **Customize Questions**
   - Login to admin dashboard
   - Navigate to "Questions" tab
   - Edit/add your own questions

2. **Change Admin Password**
   - Login to admin
   - Go to "Settings"
   - Update admin credentials

3. **Deploy to Production**
   - See [DEPLOYMENT.md](./DEPLOYMENT.md) for full guide
   - Quick: Use Vercel (easiest)
   - Choose your platform and follow steps

4. **Share with Employees**
   - Send them the application URL
   - They can start assessments
   - Admins can review responses

## Project Structure Overview

```
ecotrace-app/
├── src/
│   ├── app/          # Pages (Landing, Login, Quiz, Results, Admin)
│   ├── pages/api/    # Backend API routes
│   ├── models/       # MongoDB models
│   ├── lib/          # Database connection
│   └── utils/        # Helper functions
├── public/           # Static files
├── .env.local        # Your environment variables (store secrets here!)
└── README.md         # Full documentation
```

## Key Features Explained

### Quiz System
- 27 questions across 4 categories
- Real-time calculation
- Instant feedback

### CO₂ Calculation
- Energy: kWh × emission factor
- Transport: km × mode factor
- Food: meal count × diet factor
- Waste: lifestyle score conversion

### AI Analysis
- Powered by Google Gemini
- Analyzes root causes
- Provides systemic impact insights
- Customizable prompt

### PDF Reports
- Page 1: Summary
- Page 2: AI analysis
- Page 3+: Detailed responses
- Download for archiving

## Admin Capabilities

✅ View all employee responses  
✅ Download individual reports  
✅ Delete responses  
✅ Manage questions + answers  
✅ Adjust CO₂ calculation formulas  
✅ Configure Gemini API key  
✅ Set custom analysis prompts  
✅ Change admin credentials  

## Performance Tips

- Database: MongoDB Atlas (free M0 tier is fine for testing)
- Frontend: Next.js optimizes automatically
- API: Serverless functions (no server to manage)
- Storage: Responses stored in MongoDB

## Next Steps for Production

1. **Change admin password**
   ```
   Admin Dashboard → Settings → Change Credentials
   ```

2. **Configure Gemini API key**
   ```
   Admin Dashboard → Settings → Add API Key
   ```

3. **Deploy** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
   - Vercel (recommended)
   - Heroku
   - Docker
   - Traditional VPS

4. **Enable backups**
   - MongoDB Atlas → Backup
   - Enable daily backups

5. **Monitor usage**
   - Check database storage
   - Monitor API quota
   - Review user responses

## Support

- Full documentation: [README.md](./README.md)
- Deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- MongoDB docs: [docs.mongodb.com](https://docs.mongodb.com)
- Gemini API: [ai.google.dev](https://ai.google.dev)
- Next.js: [nextjs.org](https://nextjs.org)

---

**Happy carbon tracking! 🌍♻️**

Need help? Check the troubleshooting section in README.md
