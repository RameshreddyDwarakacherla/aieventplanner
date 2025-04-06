import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  Grid,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PsychologyIcon from '@mui/icons-material/Psychology';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const AIOptimizationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [optimizationStatus, setOptimizationStatus] = useState({
    lastOptimized: null,
    optimizationRunning: false,
    progress: 0
  });

  useEffect(() => {
    fetchAIMetrics();
    fetchAIInsights();
  }, []);

  const fetchAIMetrics = async () => {
    try {
      setLoading(true);
      
      // In a real application, this would fetch actual AI metrics from the database
      // For now, we'll simulate metrics data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const metrics = {
        // Recommendation metrics
        totalRecommendations: 1248,
        recommendationsApplied: 742,
        recommendationAcceptanceRate: 59.5,
        
        // Suggestion metrics
        totalSuggestions: 3567,
        suggestionsAccepted: 2103,
        suggestionAcceptanceRate: 58.9,
        
        // Vendor lead metrics
        totalLeadsGenerated: 856,
        leadsContacted: 412,
        leadConversionRate: 48.1,
        
        // Feedback analysis metrics
        feedbackAnalysesGenerated: 324,
        improvementsSuggested: 187,
        improvementsImplemented: 93,
        
        // Model performance
        aiModelVersion: '1.2.3',
        averagePredictionAccuracy: 87.4,
        averageResponseTime: 1.2, // seconds
        
        // Usage metrics
        activeUsers: 1245,
        activeVendors: 378,
        totalEventsWithAI: 892
      };
      
      setAiMetrics(metrics);
    } catch (error) {
      console.error('Error fetching AI metrics:', error);
      toast.error('Failed to load AI metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    try {
      // In a real application, this would fetch actual AI insights from the database
      // For now, we'll simulate insights data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const insights = [
        {
          id: 1,
          category: 'User Behavior',
          insight: 'Users are 3.2x more likely to accept budget recommendations when they are within 15% of their initial budget',
          confidence: 92,
          impact: 'high',
          actionable: true,
          action: 'Adjust budget recommendation algorithm to stay within 15% of initial budget when possible'
        },
        {
          id: 2,
          category: 'Vendor Matching',
          insight: 'Wedding vendors have a 27% higher match rate when they include portfolio images',
          confidence: 88,
          impact: 'medium',
          actionable: true,
          action: 'Prompt wedding vendors to upload portfolio images during onboarding'
        },
        {
          id: 3,
          category: 'Event Planning',
          insight: 'Corporate event planners accept task suggestions at a 42% higher rate when they include timeline estimates',
          confidence: 85,
          impact: 'high',
          actionable: true,
          action: 'Add timeline estimates to all corporate event task suggestions'
        },
        {
          id: 4,
          category: 'Guest Management',
          insight: 'RSVP rates increase by 18% when invitations are sent between 6-8 weeks before the event',
          confidence: 79,
          impact: 'medium',
          actionable: true,
          action: 'Adjust invitation timing recommendations to 6-8 weeks before event date'
        },
        {
          id: 5,
          category: 'Feedback Analysis',
          insight: 'Venue-related feedback is mentioned in 47% of post-event surveys but only 12% of pre-event planning',
          confidence: 91,
          impact: 'high',
          actionable: true,
          action: 'Increase venue-related suggestions during early planning stages'
        }
      ];
      
      setAiInsights(insights);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const runAIOptimization = async () => {
    try {
      setOptimizationStatus({
        ...optimizationStatus,
        optimizationRunning: true,
        progress: 0
      });
      
      // Simulate optimization process with progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setOptimizationStatus(prev => ({
          ...prev,
          progress: i
        }));
      }
      
      // Simulate completion
      setOptimizationStatus({
        lastOptimized: new Date().toISOString(),
        optimizationRunning: false,
        progress: 100
      });
      
      toast.success('AI models successfully optimized');
      
      // Refresh metrics after optimization
      fetchAIMetrics();
      fetchAIInsights();
      
    } catch (error) {
      console.error('Error running AI optimization:', error);
      toast.error('Failed to optimize AI models');
      
      setOptimizationStatus({
        ...optimizationStatus,
        optimizationRunning: false
      });
    }
  };

  const exportAIReport = () => {
    // In a real application, this would generate and download a report
    toast.info('AI performance report is being generated and will download shortly');
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading AI optimization dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h5">AI Optimization Dashboard</Typography>
          </Box>
          
          <Box>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportAIReport}
              sx={{ mr: 2 }}
            >
              Export Report
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AutoFixHighIcon />}
              onClick={runAIOptimization}
              disabled={optimizationStatus.optimizationRunning}
            >
              Optimize AI Models
            </Button>
          </Box>
        </Box>
        
        {optimizationStatus.optimizationRunning && (
          <Box sx={{ width: '100%', mt: 2, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Optimizing AI models... {optimizationStatus.progress}%
            </Typography>
            <LinearProgress variant="determinate" value={optimizationStatus.progress} />
          </Box>
        )}
        
        {optimizationStatus.lastOptimized && !optimizationStatus.optimizationRunning && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Last optimized: {new Date(optimizationStatus.lastOptimized).toLocaleString()}
          </Typography>
        )}
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Performance Metrics" />
          <Tab label="AI Insights" />
          <Tab label="Optimization Settings" />
        </Tabs>
        
        {/* Performance Metrics Tab */}
        {tabValue === 0 && (
          <Box sx={{ pt: 3 }}>
            <Grid container spacing={3}>
              {/* Recommendation Metrics */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recommendations</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Acceptance Rate</Typography>
                      <Typography variant="h4">{aiMetrics.recommendationAcceptanceRate}%</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={aiMetrics.recommendationAcceptanceRate} 
                        color="primary"
                        sx={{ height: 8, borderRadius: 5, mt: 1 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Generated</Typography>
                        <Typography variant="h6">{aiMetrics.totalRecommendations}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Applied</Typography>
                        <Typography variant="h6">{aiMetrics.recommendationsApplied}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Vendor Lead Metrics */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Vendor Leads</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Conversion Rate</Typography>
                      <Typography variant="h4">{aiMetrics.leadConversionRate}%</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={aiMetrics.leadConversionRate} 
                        color="success"
                        sx={{ height: 8, borderRadius: 5, mt: 1 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Generated</Typography>
                        <Typography variant="h6">{aiMetrics.totalLeadsGenerated}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Contacted</Typography>
                        <Typography variant="h6">{aiMetrics.leadsContacted}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Feedback Analysis Metrics */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Feedback Analysis</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Implementation Rate</Typography>
                      <Typography variant="h4">
                        {Math.round((aiMetrics.improvementsImplemented / aiMetrics.improvementsSuggested) * 100)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={(aiMetrics.improvementsImplemented / aiMetrics.improvementsSuggested) * 100} 
                        color="info"
                        sx={{ height: 8, borderRadius: 5, mt: 1 }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Analyses</Typography>
                        <Typography variant="h6">{aiMetrics.feedbackAnalysesGenerated}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Improvements</Typography>
                        <Typography variant="h6">{aiMetrics.improvementsSuggested}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Model Performance */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>AI Model Performance</Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Model Version</Typography>
                          <Typography variant="h6">{aiMetrics.aiModelVersion}</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Prediction Accuracy</Typography>
                          <Typography variant="h6">{aiMetrics.averagePredictionAccuracy}%</Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Average Response Time</Typography>
                          <Typography variant="h6">{aiMetrics.averageResponseTime}s</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* AI Insights Tab */}
        {tabValue === 1 && (
          <Box sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">AI-Generated Insights</Typography>
              <Button 
                startIcon={<RefreshIcon />} 
                onClick={fetchAIInsights}
                size="small"
              >
                Refresh Insights
              </Button>
            </Box>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Insight</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Impact</TableCell>
                    <TableCell>Recommended Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aiInsights.map((insight) => (
                    <TableRow key={insight.id}>
                      <TableCell>
                        <Chip label={insight.category} size="small" />
                      </TableCell>
                      <TableCell>{insight.insight}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>{insight.confidence}%</Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={insight.confidence} 
                            sx={{ width: 50, height: 6, borderRadius: 3 }}
                            color={insight.confidence > 85 ? 'success' : insight.confidence > 70 ? 'primary' : 'warning'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={insight.impact.toUpperCase()} 
                          size="small" 
                          color={insight.impact === 'high' ? 'error' : insight.impact === 'medium' ? 'warning' : 'info'}
                        />
                      </TableCell>
                      <TableCell>{insight.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Optimization Settings Tab */}
        {tabValue === 2 && (
          <Box sx={{ pt: 3 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              These settings control how the AI models are optimized and trained. Changes may affect recommendation quality and system performance.
            </Alert>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Model Training Settings</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Training Frequency" 
                          secondary="How often the AI models are retrained with new data"
                        />
                        <Chip label="Weekly" />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Data Retention Period" 
                          secondary="How long user interaction data is kept for training"
                        />
                        <Chip label="6 Months" />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Minimum Confidence Threshold" 
                          secondary="Minimum confidence level required for recommendations"
                        />
                        <Chip label="75%" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Feature Weights</Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Budget Alignment" 
                          secondary="Importance of staying within budget constraints"
                        />
                        <Chip label="High" color="primary" />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="User Preferences" 
                          secondary="Weight given to past user choices and preferences"
                        />
                        <Chip label="High" color="primary" />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Vendor Ratings" 
                          secondary="Importance of vendor ratings in recommendations"
                        />
                        <Chip label="Medium" color="secondary" />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Seasonal Trends" 
                          secondary="Consideration of seasonal and trending factors"
                        />
                        <Chip label="Low" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AIOptimizationDashboard;