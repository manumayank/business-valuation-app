# Quick Start Guide

Get the Business Valuation & Improvement App running in 5 minutes.

## Prerequisites

Make sure you have Node.js installed. Check with:
```bash
node --version
npm --version
```

Need Node.js? [Download it here](https://nodejs.org/) (v16 or higher)

## Step-by-Step Setup

### 1. Start the Backend Server

Open a terminal and run:

```bash
cd backend
npm install
npm start
```

You should see:
```
Database initialized
Server running on port 5000
```

**Keep this terminal open!** Your backend is now running.

### 2. Start the Frontend (in a NEW terminal)

Open another terminal window and run:

```bash
cd frontend
npm install
npm start
```

Your browser should automatically open to `http://localhost:3000`

## Using the App

### The Wizard (Data Entry)
1. **Step 1**: Enter your company name and select industry
2. **Step 2**: Input annual revenue and EBITDA
3. **Step 3**: Provide years in business and employee count
4. **Step 4**: Enter growth rate, profit margin, and customer retention
5. **Step 5**: Specify customer concentration and debt level
6. **Calculate**: Submit to see your valuation

### The Dashboard (Results)
- **Valuation**: See your estimated business value
- **Value Drivers**: What's working well for your business
- **Gaps**: Areas lagging industry benchmarks
- **Improvements**: Actionable recommendations
- **Mark Complete**: Track implemented improvements and see impact

## Tips

### Sample Data (for quick testing)

**Tech Startup:**
- Company: TechStart Inc
- Industry: Technology
- Annual Revenue: $5,000,000
- EBITDA: $1,500,000
- Years in Business: 4
- Employees: 25
- Growth Rate: 35%
- Profit Margin: 25%
- Customer Retention: 92%
- Top Customer: 15%
- Debt: 25%

**Established Services:**
- Company: Professional Services LLC
- Industry: Services
- Annual Revenue: $2,000,000
- EBITDA: $400,000
- Years in Business: 10
- Employees: 15
- Growth Rate: 8%
- Profit Margin: 15%
- Customer Retention: 88%
- Top Customer: 22%
- Debt: 35%

## Troubleshooting

### Backend won't start
- Make sure port 5000 is not in use: `netstat -an | grep 5000`
- Try a different port: Set `PORT=5001` in `backend/.env`

### Frontend won't connect to backend
- Confirm backend is running on port 5000
- Check browser console for errors (F12)
- Add to `frontend/.env`: `REACT_APP_API_URL=http://localhost:5000/api`

### npm install fails
- Delete `node_modules` folder and `package-lock.json`
- Clear npm cache: `npm cache clean --force`
- Try install again

### Port 3000 already in use
- Stop other Node processes
- Or set `PORT=3001` in terminal before running: `PORT=3001 npm start`

## Development Mode

Both applications run with hot-reload:
- **Frontend**: Changes to React code reload automatically
- **Backend**: Restart required for backend changes (or install nodemon for auto-reload)

## Stopping the App

Press `Ctrl+C` in each terminal to stop the servers.

## Next Steps

- Read [README.md](README.md) for full documentation
- Check out the API endpoints in README.md
- Explore the code structure
- Customize the valuation formula in `backend/valuationEngine.js`
- Add more industries to the benchmarks

---

**Happy Valuating!** 🚀
