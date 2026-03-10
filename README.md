# Lease Tracker

A mobile-friendly app to track your car lease mileage and see if you're over or under your allowed miles.

## Features

- **Mileage Tracking**: Log odometer readings with dates
- **Budget Status**: See how many miles over/under you are
- **Projections**: View projected end-of-lease mileage based on your current driving pace
- **Progress Visualization**: Visual progress bar showing lease timeline
- **Persistent Storage**: Last 100 entries saved to local storage
- **Mobile-Friendly**: Responsive design with Material-UI

## Configuration

Configure your lease terms in the `.env` file:

```env
# The date your lease started (YYYY-MM-DD format)
REACT_APP_LEASE_START_DATE=2024-01-15

# The date your lease ends (YYYY-MM-DD format)
REACT_APP_LEASE_END_DATE=2027-01-15

# Total miles allowed for the entire lease period
REACT_APP_LEASE_TOTAL_MILES=36000

# Odometer reading when the lease started (default: 0)
REACT_APP_LEASE_START_MILEAGE=0
```

## Getting Started

1. Copy `.env.example` to `.env` and update with your lease details
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Formulas

### Miles Driven

```
milesDriven = currentOdometer - startMileage
```

### Daily Allowance

```
totalLeaseDays = endDate - startDate (in days)
dailyAllowance = totalMilesAllowed / totalLeaseDays
```

### Miles Allowed to Date

```
daysElapsed = today - startDate (in days)
milesAllowedToDate = dailyAllowance × daysElapsed
```

### Over/Under Budget

```
milesOverUnder = milesDriven - milesAllowedToDate
```

- **Positive** = over budget (driving too much)
- **Negative** = under budget (on track)

### Projected End Mileage

```
avgMilesPerDay = milesDriven / daysElapsed
projectedEndMileage = avgMilesPerDay × totalLeaseDays
```

### Lease Progress

```
percentComplete = (daysElapsed / totalLeaseDays) × 100
```

## Tech Stack

- React with TypeScript
- Material-UI (MUI)
- date-fns
- Local Storage for persistence
# lease-status
