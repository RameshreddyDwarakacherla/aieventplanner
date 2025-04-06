import { supabase } from '../lib/supabase';

// This service handles all AI-related functionality
// It connects to OpenAI API for AI capabilities

const OPENAI_API_URL = 'https://api.openai.com/v1';

// Get API key from environment variable or Supabase
const getApiKey = async () => {
  try {
    // First try to get from Supabase secure settings
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'openai.api_key')
      .single();
    
    if (error) throw error;
    
    if (data && data.setting_value) {
      return data.setting_value;
    }
    
    // Fallback to environment variable
    return import.meta.env.VITE_OPENAI_API_KEY;
  } catch (error) {
    console.error('Error getting OpenAI API key:', error);
    throw new Error('Failed to get OpenAI API key');
  }
};

// Generate event recommendations based on event type, budget, and preferences
export const generateEventRecommendations = async (eventData) => {
  try {
    const apiKey = await getApiKey();
    
    const prompt = `
      Generate personalized recommendations for a ${eventData.event_type} event with the following details:
      - Budget: $${eventData.budget}
      - Expected guests: ${eventData.estimated_guests}
      - Location: ${eventData.city}, ${eventData.state}
      - Date: ${new Date(eventData.start_date).toLocaleDateString()}
      
      Please provide recommendations for:
      1. Budget allocation (venue, catering, decoration, entertainment)
      2. Vendor suggestions based on the event type and budget
      3. Timeline suggestions for planning tasks
      4. Guest experience ideas
    `;
    
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert event planner AI assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response into structured recommendations
    // This is a simplified parsing logic - in a real app, you'd want more robust parsing
    const recommendations = parseAIRecommendations(aiResponse, eventData);
    
    // Save recommendations to database
    await saveRecommendationsToDatabase(recommendations, eventData.id, eventData.user_id);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating event recommendations:', error);
    throw error;
  }
};

// Parse AI response into structured recommendations
const parseAIRecommendations = (aiResponse, eventData) => {
  // This is a simplified parsing logic
  // In a real application, you'd want more robust parsing
  
  // Extract budget recommendations
  const budgetMatch = aiResponse.match(/Budget allocation[:\s]+([\s\S]+?)(?=\n\n|\n[0-9]\.|\n[A-Z]|$)/i);
  const budgetRecommendation = budgetMatch ? budgetMatch[1].trim() : '';
  
  // Extract vendor recommendations
  const vendorMatch = aiResponse.match(/Vendor suggestions[:\s]+([\s\S]+?)(?=\n\n|\n[0-9]\.|\n[A-Z]|$)/i);
  const vendorRecommendation = vendorMatch ? vendorMatch[1].trim() : '';
  
  // Extract timeline recommendations
  const timelineMatch = aiResponse.match(/Timeline suggestions[:\s]+([\s\S]+?)(?=\n\n|\n[0-9]\.|\n[A-Z]|$)/i);
  const timelineRecommendation = timelineMatch ? timelineMatch[1].trim() : '';
  
  // Extract guest experience recommendations
  const guestMatch = aiResponse.match(/Guest experience[:\s]+([\s\S]+?)(?=\n\n|\n[0-9]\.|\n[A-Z]|$)/i);
  const guestRecommendation = guestMatch ? guestMatch[1].trim() : '';
  
  return [
    {
      type: 'budget',
      title: 'Budget Allocation',
      description: 'AI-optimized budget allocation for your event',
      content: budgetRecommendation,
      confidence: 85,
      event_id: eventData.id
    },
    {
      type: 'vendor',
      title: 'Recommended Vendors',
      description: 'Top vendor suggestions for your event type and budget',
      content: vendorRecommendation,
      confidence: 80,
      event_id: eventData.id
    },
    {
      type: 'timeline',
      title: 'Planning Timeline',
      description: 'Suggested timeline and tasks for your event',
      content: timelineRecommendation,
      confidence: 90,
      event_id: eventData.id
    },
    {
      type: 'guest',
      title: 'Guest Experience Ideas',
      description: 'Personalized ideas to enhance guest experience',
      content: guestRecommendation,
      confidence: 75,
      event_id: eventData.id
    }
  ];
};

// Save recommendations to database
const saveRecommendationsToDatabase = async (recommendations, eventId, userId) => {
  try {
    for (const rec of recommendations) {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          event_id: eventId,
          recommendation_type: rec.type,
          content: {
            title: rec.title,
            description: rec.description,
            details: rec.content,
            confidence: rec.confidence
          },
          is_applied: false
        });
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving recommendations to database:', error);
    throw error;
  }
};

// Generate vendor leads based on vendor services and upcoming events
export const generateVendorLeads = async (vendorId, vendorServices) => {
  try {
    const apiKey = await getApiKey();
    
    // Get vendor service categories
    const serviceCategories = vendorServices.map(service => service.category);
    
    // Find upcoming events that might need these services
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .order('start_date', { ascending: true });
    
    if (eventsError) throw eventsError;
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      return [];
    }
    
    // Prepare data for AI analysis
    const eventsData = upcomingEvents.map(event => ({
      id: event.id,
      title: event.title,
      type: event.event_type,
      date: new Date(event.start_date).toLocaleDateString(),
      budget: event.budget,
      guests: event.estimated_guests,
      location: `${event.city}, ${event.state}`
    }));
    
    const prompt = `
      As an AI event planning assistant, analyze these upcoming events and identify which ones would be a good match for a vendor offering these services: ${serviceCategories.join(', ')}.
      
      Events:
      ${JSON.stringify(eventsData, null, 2)}
      
      For each matching event, provide:
      1. Event ID
      2. Match score (0-100)
      3. Brief explanation of why it's a good match
      4. Suggested approach for the vendor
      
      Format your response as JSON with an array of matches.
    `;
    
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert event planning AI assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);
    
    // Save leads to database
    for (const lead of aiResponse.matches) {
      const { error } = await supabase
        .from('ai_vendor_leads')
        .upsert({
          vendor_id: vendorId,
          event_id: lead.eventId,
          match_score: lead.matchScore,
          match_reason: lead.explanation,
          suggested_approach: lead.approach,
          status: 'new'
        });
      
      if (error) throw error;
    }
    
    // Return the leads with event details
    const leadsWithEvents = [];
    for (const lead of aiResponse.matches) {
      const event = upcomingEvents.find(e => e.id === lead.eventId);
      if (event) {
        leadsWithEvents.push({
          ...lead,
          event
        });
      }
    }
    
    return leadsWithEvents;
  } catch (error) {
    console.error('Error generating vendor leads:', error);
    throw error;
  }
};

// AI chatbot for event assistance
export const getAIChatResponse = async (eventData, userMessage, chatHistory) => {
  try {
    const apiKey = await getApiKey();
    
    // Prepare event context for the AI
    const eventContext = {
      id: eventData.id,
      title: eventData.title,
      type: eventData.event_type,
      date: new Date(eventData.start_date).toLocaleDateString(),
      budget: eventData.budget,
      guests: eventData.estimated_guests,
      location: `${eventData.city}, ${eventData.state}`,
      status: eventData.status
    };
    
    // Format chat history for the AI
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
    
    const messages = [
      { 
        role: 'system', 
        content: `You are an AI event assistant helping with a ${eventData.event_type} event. 
                  Here are the event details: ${JSON.stringify(eventContext)}. 
                  Provide helpful, concise responses to help the event organizer.` 
      },
      ...formattedHistory,
      { role: 'user', content: userMessage }
    ];
    
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI chat response:', error);
    throw error;
  }
};

// Analyze event feedback
export const analyzeEventFeedback = async (eventId, feedbackData) => {
  try {
    const apiKey = await getApiKey();
    
    const prompt = `
      Analyze the following feedback for an event:
      ${JSON.stringify(feedbackData, null, 2)}
      
      Please provide:
      1. Average rating
      2. Sentiment analysis (positive, negative, neutral percentages)
      3. Key topics mentioned in the feedback
      4. Recommendations for improvement
      
      Format your response as JSON.
    `;
    
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert event analysis AI assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    // Save analysis to database
    const { error } = await supabase
      .from('event_feedback_analysis')
      .upsert({
        event_id: eventId,
        average_rating: analysis.averageRating,
        sentiment_scores: analysis.sentiment,
        key_topics: analysis.keyTopics,
        recommendations: analysis.recommendations,
        analyzed_at: new Date()
      });
    
    if (error) throw error;
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing event feedback:', error);
    throw error;
  }
};

export default {
  generateEventRecommendations,
  generateVendorLeads,
  getAIChatResponse,
  analyzeEventFeedback
};
