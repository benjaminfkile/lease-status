import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  AppBar,
  Toolbar,
  Alert,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  DirectionsCar as CarIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { differenceInDays, format, parseISO } from 'date-fns';

interface MileageEntry {
  id: string;
  date: string;
  mileage: number;
}

const STORAGE_KEY = 'lease-mileage-entries';

// Lease configuration from environment variables
const LEASE_START_DATE = process.env.REACT_APP_LEASE_START_DATE || '2024-01-15';
const LEASE_END_DATE = process.env.REACT_APP_LEASE_END_DATE || '2027-01-15';
const LEASE_TOTAL_MILES = parseInt(process.env.REACT_APP_LEASE_TOTAL_MILES || '36000', 10);
const LEASE_START_MILEAGE = parseInt(process.env.REACT_APP_LEASE_START_MILEAGE || '0', 10);

function App() {
  const theme = useTheme();
  const [entries, setEntries] = useState<MileageEntry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored entries:', e);
      }
    }
    return [];
  });
  const [newMileage, setNewMileage] = useState('');
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Save entries to localStorage whenever they change (keep last 100)
  useEffect(() => {
    const sortedByDate = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || parseInt(b.id) - parseInt(a.id)
    );
    const limitedEntries = sortedByDate.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedEntries));
  }, [entries]);

  const leaseStats = useMemo(() => {
    const startDate = parseISO(LEASE_START_DATE);
    const endDate = parseISO(LEASE_END_DATE);
    const today = new Date();

    const totalLeaseDays = differenceInDays(endDate, startDate);
    const daysElapsed = Math.max(0, differenceInDays(today, startDate));
    const daysRemaining = Math.max(0, differenceInDays(endDate, today));
    const percentComplete = Math.min(100, (daysElapsed / totalLeaseDays) * 100);

    // Daily allowance
    const dailyAllowance = LEASE_TOTAL_MILES / totalLeaseDays;
    const milesAllowedToDate = dailyAllowance * daysElapsed;

    // Get current mileage (most recent entry by date, then by creation time)
    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || parseInt(b.id) - parseInt(a.id)
    );
    const currentOdometer = sortedEntries.length > 0 ? sortedEntries[0].mileage : LEASE_START_MILEAGE;
    const currentMileage = currentOdometer - LEASE_START_MILEAGE;

    // Calculate over/under
    const milesOverUnder = currentMileage - milesAllowedToDate;
    const isOver = milesOverUnder > 0;

    // Projected end mileage based on current pace
    const avgMilesPerDay = daysElapsed > 0 ? currentMileage / daysElapsed : 0;
    const projectedEndMileage = avgMilesPerDay * totalLeaseDays;

    return {
      startDate: format(startDate, 'MMM d, yyyy'),
      endDate: format(endDate, 'MMM d, yyyy'),
      totalLeaseDays,
      daysElapsed,
      daysRemaining,
      percentComplete,
      dailyAllowance,
      milesAllowedToDate,
      currentMileage,
      milesOverUnder: Math.abs(milesOverUnder),
      isOver,
      projectedEndMileage,
      totalAllowedMiles: LEASE_TOTAL_MILES,
    };
  }, [entries]);

  const handleAddEntry = () => {
    const mileage = parseInt(newMileage, 10);
    if (isNaN(mileage) || mileage < 0 || !newDate) return;

    const newEntry: MileageEntry = {
      id: Date.now().toString(),
      date: newDate,
      mileage,
    };

    setEntries((prev) => [...prev, newEntry]);
    setNewMileage('');
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || parseInt(b.id) - parseInt(a.id)
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <CarIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            Lease Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 3 }}>
        {/* Status Card */}
        <Card
          elevation={3}
          sx={{
            mb: 3,
            background: leaseStats.isOver
              ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.dark, 0.2)} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.dark, 0.2)} 100%)`
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {leaseStats.isOver ? (
                <TrendingUpIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
              ) : (
                <TrendingDownIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
              )}
              <Box>
                <Typography variant="h3" component="div" fontWeight="bold">
                  {leaseStats.milesOverUnder.toLocaleString()}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  miles {leaseStats.isOver ? 'OVER' : 'UNDER'} budget
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Current Odometer
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {leaseStats.currentMileage.toLocaleString()} mi
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Allowed to Date
                </Typography>
                <Typography variant="h6" fontWeight="medium">
                  {Math.round(leaseStats.milesAllowedToDate).toLocaleString()} mi
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Lease Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(leaseStats.percentComplete)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={leaseStats.percentComplete}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {leaseStats.startDate}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {leaseStats.endDate}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<SpeedIcon />}
                label={`${leaseStats.dailyAllowance.toFixed(1)} mi/day allowance`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${leaseStats.daysRemaining} days left`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${LEASE_TOTAL_MILES.toLocaleString()} mi total`}
                size="small"
                variant="outlined"
              />
            </Box>

            {leaseStats.currentMileage > 0 && (
              <Alert
                severity={leaseStats.projectedEndMileage > LEASE_TOTAL_MILES ? 'warning' : 'info'}
                sx={{ mt: 2 }}
              >
                At your current pace, you'll end at{' '}
                <strong>{Math.round(leaseStats.projectedEndMileage).toLocaleString()} miles</strong>
                {leaseStats.projectedEndMileage > LEASE_TOTAL_MILES
                  ? ` (${Math.round(leaseStats.projectedEndMileage - LEASE_TOTAL_MILES).toLocaleString()} over limit)`
                  : ` (${Math.round(LEASE_TOTAL_MILES - leaseStats.projectedEndMileage).toLocaleString()} under limit)`}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* As of Today Status */}
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📅 As of Today
              <Chip label={format(new Date(), 'MMM d, yyyy')} size="small" />
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 2,
                px: 1,
                borderRadius: 2,
                bgcolor: leaseStats.isOver
                  ? alpha(theme.palette.error.main, 0.1)
                  : alpha(theme.palette.success.main, 0.1),
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  fontWeight="bold"
                  color={leaseStats.isOver ? 'error.main' : 'success.main'}
                >
                  {leaseStats.milesOverUnder.toLocaleString()} miles
                </Typography>
                <Typography variant="h6" color={leaseStats.isOver ? 'error.dark' : 'success.dark'}>
                  {leaseStats.isOver ? 'OVER' : 'UNDER'} your allowed mileage
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  You've driven {leaseStats.currentMileage.toLocaleString()} mi — allowed: {Math.round(leaseStats.milesAllowedToDate).toLocaleString()} mi
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Add Entry Form */}
        <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
            Log Mileage
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ flexGrow: 1 }}
            />
            <TextField
              label="Odometer"
              type="number"
              value={newMileage}
              onChange={(e) => setNewMileage(e.target.value)}
              placeholder="e.g., 15000"
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleAddEntry}
              startIcon={<AddIcon />}
              disabled={!newMileage || !newDate}
            >
              Add
            </Button>
          </Box>
        </Paper>

        {/* Entry History */}
        <Paper elevation={2}>
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Mileage History
            </Typography>
          </Box>
          {sortedEntries.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No entries yet. Log your first mileage reading above!
              </Typography>
            </Box>
          ) : (
            <List dense>
              {sortedEntries.map((entry, index) => {
                const prevEntry = sortedEntries[index + 1];
                const milesDiff = prevEntry ? entry.mileage - prevEntry.mileage : null;

                return (
                  <React.Fragment key={entry.id}>
                    {index > 0 && <Divider />}
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight="medium">
                              {entry.mileage.toLocaleString()} mi
                            </Typography>
                            {milesDiff !== null && (
                              <Chip
                                label={`+${milesDiff.toLocaleString()}`}
                                size="small"
                                color="default"
                                sx={{ height: 20, fontSize: '0.75rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteEntry(entry.id)}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

export default App;
