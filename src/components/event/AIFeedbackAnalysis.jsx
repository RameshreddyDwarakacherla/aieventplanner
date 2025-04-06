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
  Rating,
  LinearProgress,
  Chip
} from '@mui/material';
import InsightsIcon from '@mui/icons-material/Insights';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

const AIFeedbackAnalysis = ({ event, feedbackData }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [sentimentScores, setSentimentScores] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (event && feedbackData && feedbackData.length > 0) {
      analyzeFeedback();
    }
  }, [event, feedbackData]);

  const analyzeFeedback = async () => {
    try {
      setAnalyzing(true);
      
      // In a real application, this would call an AI service for sentiment analysis
      // For now, we'll simulate AI analysis of feedback data
      
      // Calculate average ratings
      const avgRating = feedbackData.reduce((sum, item) => sum + item.rating, 0) / feedbackData.length;
      
      // Simulate sentiment analysis of comments
      const sentiments = feedbackData.map(item => ({
        id: item.id,
        comment: item.comment,
        sentiment: simulateSentimentAnalysis(item.comment, item.rating)
      }));
      
      // Calculate sentiment distribution
      const positiveFeedback = sentiments.filter(item => item.sentiment.score > 0.6).length;
      const neutralFeedback = sentiments.filter(item => item.sentiment.score >= 0.4 && item.sentiment.score <= 0.6).length;
      const negativeFeedback = sentiments.filter(item => item.sentiment.score < 0.4).length;
      
      // Extract key topics from feedback
      const keyTopics = extractKeyTopics(feedbackData, sentiments);
      
      // Generate improvement recommendations
      const improvementAreas = generateImprovementRecommendations(keyTopics, sentiments);
      
      setInsights({
        averageRating: avgRating,
        totalFeedback: feedbackData.length,
        positiveFeedback,
        neutralFeedback,
        negativeFeedback,
        keyTopics
      });
      
      setSentimentScores({
        positive: (positiveFeedback / feedbackData.length) * 100,
        neutral: (neutralFeedback / feedbackData.length) * 100,
        negative: (negativeFeedback / feedbackData.length) * 100
      });
      
      setRecommendations(improvementAreas);
      
      // Save analysis to database
      await saveFeedbackAnalysis({
        event_id: event.id,
        average_rating: avgRating,
        sentiment_scores: {
          positive: (positiveFeedback / feedbackData.length) * 100,
          neutral: (neutralFeedback / feedbackData.length) * 100,
          negative: (negativeFeedback / feedbackData.length) * 100
        },
        key_topics: keyTopics,
        recommendations: improvementAreas
      });
      
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      toast.error('Failed to analyze feedback');
    } finally {
      setAnalyzing(false);
    }
  };

  const simulateSentimentAnalysis = (comment, rating) => {
    // Simple simulation of sentiment analysis
    // In a real app, this would use NLP/AI to analyze text
    if (!comment) {
      return { score: rating / 5, label: rating > 3 ? 'positive' : rating === 3 ? 'neutral' : 'negative' };
    }
    
    const positiveWords = ['great', 'excellent', 'amazing', 'good', 'wonderful', 'fantastic', 'enjoyed', 'love', 'perfect'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disappointing', 'disappointed', 'issue', 'problem', 'fail'];
    
    const lowerComment = comment.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerComment.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerComment.includes(word)) negativeCount++;
    });
    
    // Calculate sentiment score (0-1)
    const baseScore = rating / 5; // Base score from rating
    const textScore = positiveCount > 0 || negativeCount > 0 ?
      (positiveCount / (positiveCount + negativeCount)) : 0.5;
    
    // Combine rating and text analysis
    const combinedScore = (baseScore * 0.7) + (textScore * 0.3);
    
    let label = 'neutral';
    if (combinedScore > 0.6) label = 'positive';
    else if (combinedScore < 0.4) label = 'negative';
    
    return { score: combinedScore, label };
  };

  const extractKeyTopics = (feedbackData, sentiments) => {
    // Simulate topic extraction from feedback
    // In a real app, this would use NLP/AI to identify common themes
    const topics = [
      { name: 'Service', mentions: 0, sentiment: 0 },
      { name: 'Food', mentions: 0, sentiment: 0 },
      { name: 'Venue', mentions: 0, sentiment: 0 },
      { name: 'Staff', mentions: 0, sentiment: 0 },
      { name: 'Music', mentions: 0, sentiment: 0 },
      { name: 'Decorations', mentions: 0, sentiment: 0 },
      { name: 'Organization', mentions: 0, sentiment: 0 }
    ];
    
    const topicKeywords = {
      'Service': ['service', 'staff', 'waiter', 'waitress', 'attendant'],
      'Food': ['food', 'meal', 'catering', 'dish', 'menu', 'drink', 'beverage'],
      'Venue': ['venue', 'location', 'place', 'room', 'hall', 'space'],
      'Staff': ['staff', 'team', 'employee', 'server', 'helper'],
      'Music': ['music', 'dj', 'band', 'song', 'dance', 'playlist'],
      'Decorations': ['decoration', 'decor', 'flower', 'centerpiece', 'theme', 'design'],
      'Organization': ['organized', 'planning', 'schedule', 'timing', 'coordination']
    };
    
    feedbackData.forEach((feedback, index) => {
      if (!feedback.comment) return;
      
      const comment = feedback.comment.toLowerCase();
      const sentiment = sentiments[index].sentiment.score;
      
      topics.forEach(topic => {
        const keywords = topicKeywords[topic.name];
        keywords.forEach(keyword => {
          if (comment.includes(keyword)) {
            topic.mentions++;
            topic.sentiment += sentiment;
          }
        });
      });
    });
    
    // Calculate average sentiment for each topic and filter out unmentioned topics
    return topics
      .map(topic => ({
        ...topic,
        sentiment: topic.mentions > 0 ? topic.sentiment / topic.mentions : 0
      }))
      .filter(topic => topic.mentions > 0)
      .sort((a, b) => b.mentions - a.mentions);
  };

  const generateImprovementRecommendations = (keyTopics, sentiments) => {
    // Generate recommendations based on sentiment analysis
    const recommendations = [];
    
    // Find topics with negative sentiment
    const improvementAreas = keyTopics
      .filter(topic => topic.sentiment < 0.5)
      .sort((a, b) => a.sentiment - b.sentiment);
    
    improvementAreas.forEach(topic => {
      let recommendation = '';
      
      switch(topic.name) {
        case 'Service':
          recommendation = 'Consider additional training for service staff to improve guest experience.';
          break;
        case 'Food':
          recommendation = 'Review catering options and consider taste testing with different vendors.';
          break;
        case 'Venue':
          recommendation = 'Explore alternative venues or improve the setup of your current venue.';
          break;
        case 'Staff':
          recommendation = 'Provide more detailed briefing to staff about event expectations and roles.';
          break;
        case 'Music':
          recommendation = 'Create a more curated playlist or consider hiring a professional DJ/band.';
          break;
        case 'Decorations':
          recommendation = 'Work with a professional decorator to enhance the visual appeal of your events.';
          break;
        case 'Organization':
          recommendation = 'Implement a more detailed event timeline and assign a dedicated coordinator.';
          break;
        default:
          recommendation = `Review feedback related to ${topic.name} to identify specific improvements.`;
      }
      
      recommendations.push({
        area: topic.name,
        sentiment: topic.sentiment,
        recommendation
      });
    });
    
    // Add general recommendations if needed
    if (recommendations.length === 0) {
      const avgSentiment = sentiments.reduce((sum, item) => sum + item.sentiment.score, 0) / sentiments.length;
      
      if (avgSentiment < 0.7) {
        recommendations.push({
          area: 'General Experience',
          sentiment: avgSentiment,
          recommendation: 'Consider sending follow-up surveys to gather more specific feedback for improvement.'
        });
      }
    }
    
    return recommendations;
  };

  const saveFeedbackAnalysis = async (analysisData) => {
    try {
      const { error } = await supabase
        .from('event_feedback_analysis')
        .upsert({
          event_id: analysisData.event_id,
          average_rating: analysisData.average_rating,
          sentiment_scores: analysisData.sentiment_scores,
          key_topics: analysisData.key_topics,
          recommendations: analysisData.recommendations,
          analyzed_at: new Date()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error saving feedback analysis:', error);
    }
  };

  if (analyzing) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Analyzing feedback data...
        </Typography>
      </Box>
    );
  }

  if (!insights) {
    return (
      <Alert severity="info">
        No feedback data available for analysis. Collect feedback from your event attendees to see AI-powered insights.
      </Alert>
    );
  }

  return (
    <Box>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InsightsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">AI Feedback Analysis</Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Summary Stats */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Overall Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h3" sx={{ mr: 1 }}>
                    {insights.averageRating.toFixed(1)}
                  </Typography>
                  <Rating value={insights.averageRating} precision={0.1} readOnly />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Based on {insights.totalFeedback} responses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Sentiment Distribution */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Sentiment Analysis</Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Positive</Typography>
                    <Typography variant="body2">{sentimentScores.positive.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={sentimentScores.positive} 
                    color="success"
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Neutral</Typography>
                    <Typography variant="body2">{sentimentScores.neutral.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={sentimentScores.neutral} 
                    color="warning"
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2">Negative</Typography>
                    <Typography variant="body2">{sentimentScores.negative.toFixed(1)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={sentimentScores.negative} 
                    color="error"
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Key Topics */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>Key Topics Mentioned</Typography>
                
                {insights.keyTopics.length > 0 ? (
                  <List>
                    {insights.keyTopics.map((topic, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {topic.sentiment > 0.6 ? (
                            <ThumbUpIcon color="success" />
                          ) : topic.sentiment < 0.4 ? (
                            <ThumbDownIcon color="error" />
                          ) : (
                            <FeedbackIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={topic.name}
                          secondary={`${topic.mentions} mentions`}
                        />
                        <Chip 
                          label={topic.sentiment > 0.6 ? 'Positive' : topic.sentiment < 0.4 ? 'Negative' : 'Neutral'}
                          color={topic.sentiment > 0.6 ? 'success' : topic.sentiment < 0.4 ? 'error' : 'warning'}
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific topics identified in feedback.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Recommendations */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>AI Recommendations</Typography>
                
                {recommendations.length > 0 ? (
                  <List>
                    {recommendations.map((rec, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={rec.area}
                          secondary={rec.recommendation}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific recommendations at this time. Your event feedback is generally positive!
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AIFeedbackAnalysis;