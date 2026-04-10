# EcoTrace - Carbon Footprint Calculator (Next.js + MongoDB)

A modern, full-stack web application for assessing employee carbon footprints and generating sustainability reports with AI-powered insights.

## 🌍 Features

- **User Quiz System**: 27 comprehensive questions across 4 categories (Energy, Transport, Food, Waste)
- **CO₂ Calculation Engine**: Accurate carbon footprint calculations based on user responses
- **AI-Powered Analysis**: Uses Google Gemini API to generate detailed sustainability reports
- **PDF Generation**: Creates comprehensive reports with AI analysis and user responses
- **Admin Dashboard**: Complete management system for questions, formulas, responses, and LLM settings
- **Role-Based Access**: Separate user and admin interfaces with secure authentication
- **MongoDB Persistence**: All data stored securely in MongoDB
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Deployment Ready**: Configured for easy deployment to Vercel, Heroku, or any Node.js host

## 📋 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Next.js 14
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens, bcrypt for password hashing
- **PDF Generation**: jsPDF, html2canvas
- **AI**: Google Gemini API for response analysis
- **Deployment**: Docker, Vercel, or traditional Node.js hosting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB Atlas account (for database)
- Google Gemini API key (for AI features)

### 1. Installation

```bash
# Clone or navigate to project directory
cd ecotrace-app

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecotrace?retryWrites=true&w=majority

# JWT Secret for authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Gemini API Key for AI reports
GEMINI_API_KEY=your_gemini_api_key_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up MongoDB

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with credentials
3. Add your IP address to the network access list
4. Copy your connection string and add to `.env.local`

### 4. Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to `.env.local`

### 5. Initialize Database

```bash
# Start development server
npm run dev

# In another terminal, initialize the database
curl -X POST http://localhost:3000/api/seed
```

This will create:
- 27 default questions across all categories
- Default formula for CO₂ calculations
- Default admin user (username: `admin`, password: `admin123`)

### 6. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 User Flow

### For Employees

1. **Landing Page**: Overview of the application
2. **Login**: Enter name, employee ID, and department
3. **Quiz**: Answer 27 questions about energy, transport, food, and lifestyle
4. **Results**: View carbon footprint score, category breakdown, and AI-generated insights
5. **Download Report**: Get a PDF with:
   - Employee details & summary
   - AI-generated analysis (Page 2)
   - Detailed responses (Pages 3+)

### For Admins

1. **Admin Login**: Secure login with JWT authentication
2. **Dashboard**: Manage:
   - **Questions**: Create, edit, delete questions and options
   - **Responses**: View all employee submissions, download reports, delete responses
   - **Formula**: Adjust CO₂ calculation formulas
   - **LLM Config**: Set API key and custom prompts for AI analysis
   - **Settings**: Change admin credentials, reset database

## 🏗️ Project Structure

```
ecotrace-app/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout
│   │   ├── login/             # User login page
│   │   ├── quiz/              # Quiz page
│   │   ├── results/           # Results page
│   │   ├── admin/             # Admin dashboard
│   │   └── globals.css        # Global styles
│   ├── pages/
│   │   └── api/               # Next.js API routes
│   │       ├── auth/
│   │       │   └── login.ts   # Admin login endpoint
│   │       ├── questions/
│   │       │   └── index.ts   # Get questions
│   │       ├── responses/
│   │       │   └── index.ts   # Save responses
│   │       ├── admin/         # Admin-only endpoints
│   │       │   ├── questions.ts
│   │       │   ├── responses.ts
│   │       │   └── settings.ts
│   │       ├── ai/
│   │       │   └── report.ts  # AI report generation
│   │       └── seed/
│   │           └── index.ts   # Database seeding
│   ├── models/                # MongoDB models
│   │   ├── Question.ts
│   │   ├── Response.ts
│   │   ├── Settings.ts
│   │   └── Admin.ts
│   ├── lib/
│   │   └── mongodb.ts         # MongoDB connection
│   ├── components/            # React components
│   └── utils/                 # Utility functions
├── public/                    # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.local                 # Environment variables (not in git)
```

## 🔐 API Endpoints

### Public Endpoints

```
GET  /api/questions          # Get all questions
POST /api/responses          # Save user response
POST /api/ai/report          # Generate AI report
```

### Admin Endpoints (JWT Required)

```
POST   /api/auth/login       # Admin login
GET    /api/admin/responses  # Get all responses
DELETE /api/admin/responses  # Delete response
POST   /api/admin/questions  # Create question
PUT    /api/admin/questions  # Edit question
DELETE /api/admin/questions  # Delete question
GET    /api/admin/settings   # Get settings
POST   /api/admin/settings   # Update settings
POST   /api/seed             # Initialize database (one-time)
```

## 📊 Data Models

### Question

```typescript
{
  id: string;                  // Unique ID (e.g., 'e1', 't1')
  category: 'energy' | 'transport' | 'food' | 'waste' | 'custom';
  icon: string;               // Emoji icon
  order: number;              // Question order in quiz
  formula: string;            // Description of formula
  question: string;           // Question text
  options: IOption[];         // Answer options with weights
}
```

### Response

```typescript
{
  userId: string;
  userName: string;
  empId: string;
  dept: string;
  answers: Map<string, number>;        // Question ID -> Option index
  answerLabels: Map<string, string>;   // Question ID -> Selected label
  answerWeights: Map<string, number>;  // Question ID -> CO₂ weight
  earths: number;
  totalCO2: number;
  catData: {
    energy: { co2: number; pct: number };
    transport: { co2: number; pct: number };
    food: { co2: number; pct: number };
    waste: { co2: number; pct: number };
  };
  aiReport?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📈 PDF Report Structure

### Page 1: Summary & Employee Details
- Employee name, ID, department
- Total CO₂ in kg/month
- Earths required
- Category breakdown with percentages

### Page 2: AI-Generated Analysis
- Root Cause & Environmental Impact Analysis
- Details for each impact area

### Page 3+: Detailed Assessment Responses
- Complete list of all questions and answers

## 🚀 Deployment

### Option 1: Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Follow the prompts and add environment variables in the Vercel dashboard.

### Option 2: Heroku

```bash
# Create Heroku app
heroku create ecotrace-app

# Set environment variables
heroku config:set MONGODB_URI=your_url
heroku config:set JWT_SECRET=your_secret
heroku config:set GEMINI_API_KEY=your_key

# Deploy
git push heroku main
```

### Option 3: Docker

```bash
# Build image
docker build -t ecotrace-app .

# Run container
docker run -p 3000:3000 \
  -e MONGODB_URI=your_url \
  -e JWT_SECRET=your_secret \
  -e GEMINI_API_KEY=your_key \
  ecotrace-app
```

### Option 4: Traditional Node.js Hosting (DigitalOcean, AWS, etc.)

```bash
# Build
npm run build

# Start
npm start
```

## 🔑 Admin Credentials

**Default:**
- Username: `admin`
- Password: `admin123`

⚠️ **CHANGE THESE IN PRODUCTION!**

## 🛠️ Development

### Add New Question

1. Login as admin
2. Go to Questions tab
3. Click "Add Question"
4. Fill in details:
   - Category
   - Question text
   - Options (emoji, label, CO₂ weight)
5. Save

### Modify Calculation Formula

1. Login as admin
2. Go to Formula tab
3. Adjust multipliers (electricity, transport, food)
4. Adjust threshold (earths calculation)
5. Save

### Set Up AI Report Prompt

1. Login as admin
2. Go to Settings tab
3. Add Gemini API key
4. Customize the analysis prompt
5. Save

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test MongoDB connection
node -e "require('mongoose').connect(process.env.MONGODB_URI)"
```

### API 500 Errors

Check logs:
```bash
# Development
npm run dev  # See terminal output

# Production
Check application logs (Vercel/Heroku dashboard)
```

### PDF Generation Not Working

- Ensure `html2canvas` and `jspdf` are installed
- Clear browser cache
- Try different browser

### AI Report Not Generating

- Verify Gemini API key is correct
- Check API quota in Google AI Studio
- Verify network connection

## 📝 Customization

### Change Color Scheme

Edit `tailwind.config.js` and `src/app/globals.css`:

```css
:root {
  --primary: #2D6A4F;        /* Change to your primary color */
  --accent: #52B788;         /* Change to your accent color */
  /* ... other colors ... */
}
```

### Add Custom Questions

Use the Admin Dashboard to add questions with custom categories, weights, and options.

### Customize PDF Report

Edit `src/utils/pdf.ts` to change the report layout and content structure.

## 📄 License

This project is provided as-is for internal use.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review MongoDB Atlas error logs
3. Check application server logs
4. Verify all environment variables are set correctly

## 🔄 Migration from Static HTML Version

The original HTML file has been fully refactored with:
- ✅ MongoDB for data persistence
- ✅ Backend API routes for all operations
- ✅ Admin role-based access control
- ✅ JWT authentication
- ✅ PDF generation with new structure (AI report on page 2)
- ✅ Improved performance and scalability
- ✅ Production-ready deployment options

All original functionality and UI design has been preserved!

---

**Happy carbon tracking! 🌍♻️**
