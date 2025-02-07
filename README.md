# FPL Analytics Dashboard

A real-time Fantasy Premier League analytics dashboard showing top performers, budget picks, and premium recommendations.

## Features

- Top 25 performing players
- Budget-friendly recommendations (under £7.0m)
- Premium player picks (£7.0m+)
- Real-time form and fixture difficulty
- Predicted points and buy recommendations
- Auto-updates twice daily

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Chart.js
- FPL API Integration

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fpl-analytics.git
cd fpl-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### GitHub Setup

1. Create a new repository on GitHub
2. Initialize Git and push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/fpl-analytics.git
git push -u origin main
```

### Netlify Deployment

1. Log in to Netlify
2. Click "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Click "Deploy site"

The site will automatically deploy when you push changes to the main branch.

## Environment Variables

No environment variables are required as the app uses the public FPL API.

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## License

MIT License - feel free to use this project for learning or building your own FPL tools.