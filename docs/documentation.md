# FPL Analytics Dashboard Documentation

## Overview
FPL Analytics Dashboard is a web application that provides real-time analytics and insights for Fantasy Premier League (FPL) managers. The application helps users make informed decisions by analyzing player performance, predicting points, and providing fixture difficulty ratings.

## Features
- Real-time player analytics and predictions
- Budget and premium player recommendations
- Match fixture information with broadcast details
- Difficulty rating indicators for upcoming matches
- Automated data updates twice daily

## Technical Stack
- **Frontend**: Next.js 14 with React
- **Styling**: Tailwind CSS
- **Data Source**: Official FPL API
- **Deployment**: Netlify

## Project Structure
```
fpl-analytics/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/         # API routes
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Main page
│   ├── components/      # React components
│   │   ├── PlayerCard.tsx
│   │   ├── MatchFixtures.tsx
│   │   └── PlayerCardSkeleton.tsx
│   ├── lib/            # Utility functions
│   │   └── api.ts      # API handling
│   └── types/          # TypeScript types
│       └── fpl.ts
└── public/            # Static assets
```

## Key Components

### PlayerCard
Displays individual player information including:
- Player name and position
- Team
- Current price
- Predicted points
- Form rating
- Buy recommendation
- Next match difficulty indicator

### MatchFixtures
Shows upcoming Premier League fixtures with:
- Match date and time
- Team matchups
- Live scores
- Broadcast channel information

## Data Flow
1. Application fetches data from the FPL API through our backend proxy
2. Data is processed and enriched with predictions and analytics
3. Results are cached for 12 hours
4. UI components render the processed data
5. Updates occur automatically twice daily

## API Integration
The application uses a proxy to interact with the FPL API:
- `/api/fpl/bootstrap-static` - Basic player and team data
- `/api/fpl/fixtures` - Match fixture information

## Deployment
The application is deployed on Netlify with:
- Automatic builds on main branch updates
- Environment variable configuration
- Custom domain setup
- CDN caching for optimal performance

## Performance Optimizations
- Server-side data fetching
- Component-level loading states
- Efficient data caching
- Optimized bundle size
- Lazy loading of components

## Future Enhancements
- Player comparison tool
- Historical performance graphs
- Team builder feature
- Custom prediction models
- Mobile application

## Maintenance
- Regular dependency updates
- API endpoint monitoring
- Performance metrics tracking
- Error logging and monitoring