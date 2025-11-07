# Business Valuation & Improvement App

A web application that helps business owners estimate their company's valuation and identify recommendations to increase that value.

## Features

- **Multi-Step Input Wizard**: Guided data entry process with validation
- **Valuation Engine**: Calculates business valuation using EBITDA multiples and industry benchmarks
- **Interactive Dashboard**: Displays valuation results, value drivers, performance gaps, and improvement suggestions
- **Revaluation Mechanism**: Update data or mark improvements as completed to see new valuation
- **Persistent Storage**: SQLite database to store valuations and track changes over time
- **Industry Benchmarks**: Built-in benchmarks for Tech, Retail, Services, and Manufacturing sectors

## Architecture

### Tech Stack

- **Frontend**: React 18 with modern CSS
- **Backend**: Node.js with Express
- **Database**: SQLite3
- **API**: RESTful JSON API

### Project Structure

```
.
├── backend/
│   ├── server.js              # Express server and API routes
│   ├── db.js                  # Database initialization and helpers
│   ├── valuationEngine.js     # Business valuation calculation logic
│   ├── package.json
│   ├── .env
│   └── .gitignore
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Main app component with routing
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── services/
│   │   │   └── api.js         # API client service
│   │   └── components/
│   │       ├── Wizard.js      # Multi-step form component
│   │       ├── Wizard.css
│   │       ├── Dashboard.js   # Results display component
│   │       └── Dashboard.css
│   ├── package.json
│   └── .gitignore
└── README.md                   # This file
```

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   The backend will run on `http://localhost:5000`

### Frontend Setup

1. In a new terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The app will open on `http://localhost:3000`

## Usage

### User Journey

1. **Enter Company Information**: Select your industry and company name
2. **Provide Financial Data**: Enter annual revenue and EBITDA
3. **Operational Details**: Share years in business and employee count
4. **Performance Metrics**: Input growth rate, profit margin, and customer retention
5. **Risk Factors**: Specify customer concentration and debt levels
6. **View Valuation**: Get estimated business valuation with analysis

### Improving Your Valuation

After receiving your valuation:

1. **Review Gaps**: Understand where you lag industry benchmarks
2. **Implement Improvements**: Make business changes to address gaps
3. **Mark as Complete**: Click "Mark as Completed" on implemented improvements
4. **Recalculate**: See how your improvements affect your valuation
5. **Update Data**: Modify metrics as your business changes

## API Endpoints

### User Management
- `POST /api/users` - Create a new user session
- `GET /api/users/:userId/valuations` - Get user's valuation history

### Valuation
- `POST /api/valuate` - Submit wizard data and calculate valuation
  - Body: `{ userId, inputData }`
- `GET /api/valuations/:valuationId` - Get valuation results
- `PUT /api/valuations/:valuationId` - Update input data and recalculate
  - Body: `{ inputData }`
- `POST /api/valuations/:valuationId/improvements/:improvementKey` - Mark improvement as completed

### Health
- `GET /api/health` - Check API status

## Valuation Formula

The valuation engine uses the following approach:

1. **Base Valuation**: EBITDA × Industry Multiple (varies by sector)
   - Tech: 12x, Retail: 6x, Services: 7x, Manufacturing: 8x

2. **Adjustments** (Applied to base valuation):
   - **Growth Rate**: ±50% of gap to benchmark
   - **Profit Margin**: ±40% of gap to benchmark
   - **Customer Retention**: ±30% of gap to benchmark
   - **Customer Concentration Risk**: -50% of excess concentration
   - **Debt Level**: -40% of excess debt
   - **Completed Improvements**: +50% recovery of negative impacts

3. **Final Valuation**: Base + Adjustments (minimum 50% of annual revenue)

## Features in MVP

✅ Multi-step wizard with validation
✅ Valuation calculation engine
✅ Interactive dashboard
✅ Revaluation mechanism
✅ Improvement tracking
✅ Data persistence with SQLite
✅ Industry benchmarks
✅ Responsive design

## Future Enhancements

- PDF report export
- Shareable report links
- Authentication & multi-user support
- Advanced analytics and charts
- Email notifications
- Custom industry benchmarks
- Scenario planning tools

## Testing

### To run tests (when implemented):

**Backend:**
```bash
cd backend
npm test
```

**Frontend:**
```bash
cd frontend
npm test
```

## Development Notes

### Key Components

**valuationEngine.js**: Core calculation logic
- Implements industry benchmarks
- Calculates valuation adjustments
- Generates improvement suggestions
- Handles completed improvements

**Wizard.js**: Multi-step form
- Step-by-step data collection
- Real-time validation
- Error handling
- Progress tracking

**Dashboard.js**: Results display
- Shows headline valuation
- Displays value drivers
- Lists performance gaps
- Presents improvement suggestions
- Allows marking improvements complete

### Database Schema

**users**: Simple user session tracking
- `id` (UUID)
- `created_at` (timestamp)

**valuations**: Stores valuation data
- `id` (UUID)
- `user_id` (foreign key)
- `input_data` (JSON)
- `valuation_result` (JSON)
- `created_at`, `updated_at` (timestamps)

**completed_improvements**: Tracks completed improvements
- `id` (auto increment)
- `valuation_id` (foreign key)
- `improvement_key` (string)
- `completed_at` (timestamp)
- Unique constraint on (valuation_id, improvement_key)

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
```

### Frontend (.env - optional)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Deployment

### Backend Deployment

The backend can be deployed to:
- Heroku
- AWS Lambda
- Digital Ocean
- Any Node.js hosting

Requirements:
- Node.js runtime
- SQLite or migrate to PostgreSQL for production
- Set `NODE_ENV=production`

### Frontend Deployment

The frontend can be built and deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

Build command:
```bash
cd frontend
npm run build
```

## License

ISC

## Support

For issues or questions, refer to the project documentation or contact the development team.
