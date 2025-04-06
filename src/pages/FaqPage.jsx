import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FaqPage = () => {
  // FAQ data organized by categories
  const faqData = [
    {
      category: 'General',
      questions: [
        {
          id: 'general-1',
          question: 'What is EventMaster?',
          answer: 'EventMaster is a comprehensive AI-powered event planning platform that connects event organizers with vendors and provides tools for managing every aspect of your event, from budgeting to guest management. Our AI technology helps you make smarter decisions and simplifies the planning process.'
        },
        {
          id: 'general-2',
          question: 'Is EventMaster free to use?',
          answer: 'EventMaster offers both free and premium plans. The basic features are available for free, while advanced features and AI-powered recommendations require a subscription. Visit our pricing page for more details.'
        },
        {
          id: 'general-3',
          question: 'How do I get started with EventMaster?',
          answer: 'To get started, simply create an account by clicking the "Register" button in the top right corner. Once registered, you can create your first event and start exploring our features. Our AI assistant will guide you through the process and provide personalized recommendations.'
        },
        {
          id: 'general-4',
          question: 'Can I use EventMaster on my mobile device?',
          answer: 'Yes, EventMaster is fully responsive and works on all devices, including smartphones and tablets. We also have mobile apps available for iOS and Android.'
        },
        {
          id: 'general-5',
          question: 'How does AI improve my event planning experience?',
          answer: 'Our AI technology analyzes your preferences, budget, and event requirements to provide personalized recommendations for venues, vendors, and planning tasks. It also helps you optimize your budget, manage guests more effectively, and provides real-time assistance during your event.'
        }
      ]
    },
    {
      category: 'Event Planning',
      questions: [
        {
          id: 'planning-1',
          question: 'How do I create a new event?',
          answer: 'After logging in, navigate to your dashboard and click the "Create Event" button. Follow the step-by-step wizard to set up your event details, including date, location, and type.'
        },
        {
          id: 'planning-2',
          question: 'Can I manage multiple events at once?',
          answer: 'Yes, you can create and manage multiple events simultaneously. All your events will be listed in your dashboard, where you can easily switch between them.'
        },
        {
          id: 'planning-3',
          question: 'How do I set up a budget for my event?',
          answer: 'Each event has a dedicated budget planner tool. You can access it from your event management page. The tool allows you to set a total budget, add expense categories, and track your spending.'
        },
        {
          id: 'planning-4',
          question: 'Can I share my event planning progress with others?',
          answer: 'Yes, you can invite collaborators to help you plan your event. Go to your event settings and use the "Collaborators" section to add people by email.'
        }
      ]
    },
    {
      category: 'Vendors',
      questions: [
        {
          id: 'vendors-1',
          question: 'How do I find vendors for my event?',
          answer: 'Use our vendor marketplace to browse vendors by category, location, and ratings. You can filter results based on your specific requirements and budget.'
        },
        {
          id: 'vendors-2',
          question: 'Can I communicate with vendors through EventMaster?',
          answer: 'Yes, our platform includes a messaging system that allows you to communicate directly with vendors. All your conversations are saved for future reference.'
        },
        {
          id: 'vendors-3',
          question: 'How do I book a vendor?',
          answer: 'Once you\'ve found a vendor you like, you can send them a booking request through our platform. The vendor will review your request and respond with availability and pricing.'
        },
        {
          id: 'vendors-4',
          question: 'I am a vendor. How do I list my services on EventMaster?',
          answer: 'To list your services, you need to create a vendor account. Click on "Register" and select "I am a vendor". Once your account is approved, you can create your profile and list your services.'
        }
      ]
    },
    {
      category: 'Guest Management',
      questions: [
        {
          id: 'guests-1',
          question: 'How do I create and send invitations?',
          answer: 'In your event management page, go to the "Guests" section and click "Create Invitation". You can customize the invitation design, add event details, and send it via email or generate a shareable link.'
        },
        {
          id: 'guests-2',
          question: 'Can guests RSVP through EventMaster?',
          answer: 'Yes, guests can RSVP directly through the invitation link. Their responses will be automatically tracked in your guest management dashboard.'
        },
        {
          id: 'guests-3',
          question: 'How do I track RSVPs and attendance?',
          answer: 'All RSVPs are tracked in real-time in your guest management dashboard. You can see who has accepted, declined, or not responded yet. On the day of the event, you can use our check-in feature to track attendance.'
        },
        {
          id: 'guests-4',
          question: 'Can I collect additional information from guests?',
          answer: 'Yes, you can create custom forms to collect additional information from guests, such as dietary restrictions, plus-one details, or any other information you need.'
        }
      ]
    },
    {
      category: 'AI Features',
      questions: [
        {
          id: 'ai-1',
          question: 'What AI-powered features does EventMaster offer?',
          answer: 'EventMaster offers several AI-powered features including: personalized event recommendations, smart budget planning, AI-suggested vendor matches, automated task scheduling, real-time event monitoring with AI chatbots, and post-event feedback analysis.'
        },
        {
          id: 'ai-2',
          question: 'How does the AI recommend vendors for my event?',
          answer: 'Our AI analyzes your event type, budget, location, and preferences to match you with the most suitable vendors. It also considers vendor ratings, availability, and past performance to ensure quality recommendations.'
        },
        {
          id: 'ai-3',
          question: 'Can the AI help me stay within my budget?',
          answer: 'Yes! Our AI budget planner analyzes your event requirements and helps allocate funds efficiently across different categories. It provides cost-saving suggestions and alerts you if you\'re at risk of exceeding your budget.'
        },
        {
          id: 'ai-4',
          question: 'How does the real-time event monitoring work?',
          answer: 'During your event, our AI chatbot provides real-time updates, answers questions from you or your team, tracks guest check-ins, monitors vendor activities, and alerts you to any issues that need immediate attention.'
        },
        {
          id: 'ai-5',
          question: 'How does the AI analyze event feedback?',
          answer: 'After your event, our AI analyzes guest feedback to identify patterns, sentiment, and key areas of success or improvement. It generates detailed reports and provides actionable recommendations for your future events.'
        }
      ]
    },
    {
      category: 'Account & Billing',
      questions: [
        {
          id: 'account-1',
          question: 'How do I update my account information?',
          answer: 'You can update your account information by clicking on your profile picture in the top right corner and selecting "Profile Settings".'
        },
        {
          id: 'account-2',
          question: 'How do I change my password?',
          answer: 'To change your password, go to your profile settings and select the "Security" tab. Click on "Change Password" and follow the instructions.'
        },
        {
          id: 'account-3',
          question: 'How do I upgrade to a premium plan?',
          answer: 'To upgrade, go to your account settings and select the "Subscription" tab. Choose the plan that best suits your needs and follow the payment instructions.'
        },
        {
          id: 'account-4',
          question: 'How do I cancel my subscription?',
          answer: 'You can cancel your subscription at any time from your account settings. Go to the "Subscription" tab and click "Cancel Subscription". Your premium features will remain active until the end of your billing period.'
        }
      ]
    }
  ];

  // State to track which questions are expanded
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // Toggle question expansion
  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  return (
    <div className="w-full px-4 py-8 bg-gradient-to-b from-purple-50 to-white">
      <h1 className="text-4xl font-bold mb-8 text-center text-purple-800">Frequently Asked Questions</h1>
      
      <div className="w-full max-w-6xl mx-auto mb-10">
        <p className="text-center text-lg mb-10">
          Find answers to common questions about EventMaster. If you can't find what you're looking for, 
          please <Link to="/contact" className="text-purple-600 hover:text-purple-800 font-medium underline">contact us</Link>.
        </p>
        
        {/* Category navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {faqData.map(category => (
            <a 
              key={category.category} 
              href={`#${category.category.toLowerCase().replace(' ', '-')}`}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-6 py-3 rounded-full transition duration-300 shadow-sm font-medium"
            >
              {category.category}
            </a>
          ))}
        </div>
      </div>
      
      {/* FAQ content */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
        {faqData.map(category => (
          <div key={category.category} id={category.category.toLowerCase().replace(' ', '-')} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-purple-200 text-purple-700">{category.category}</h2>
            
            <div className="space-y-4">
              {category.questions.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                  <button
                    className="w-full text-left p-5 flex justify-between items-center focus:outline-none"
                    onClick={() => toggleQuestion(item.id)}
                  >
                    <span className="font-medium text-lg text-gray-800">{item.question}</span>
                    <svg 
                      className={`w-6 h-6 text-purple-600 transition-transform duration-300 ${expandedQuestions[item.id] ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {expandedQuestions[item.id] && (
                    <div className="p-5 pt-0 border-t bg-gray-50">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="w-full max-w-4xl mx-auto text-center mt-16 p-8 bg-purple-100 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-purple-800">Still have questions?</h2>
        <p className="mb-6 text-lg">We're here to help. Contact our support team for assistance.</p>
        <Link 
          to="/contact" 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 inline-block shadow-md hover:shadow-lg"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
};

export default FaqPage;