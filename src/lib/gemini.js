// Google Gemini API Integration (Server-side only)
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Google Gemini API key not found. AI features may not work properly.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Get suggestions for next best action using Gemini AI
 * @param {string} leadName - Name of the lead
 * @param {string} companyName - Company name
 * @param {string} dealStage - Current deal stage
 * @param {string} lastInteraction - Description of last interaction
 * @returns {Promise<string>} - AI-generated suggestion
 */
export async function getSuggestNextBestAction(leadName, companyName, dealStage, lastInteraction) {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a CRM sales expert. The user has asked a question or requested analysis. Provide a comprehensive, detailed response based on the information provided.

Lead Name: ${leadName}
Company: ${companyName}
Deal Stage: ${dealStage}
User Query/Question: ${lastInteraction}

Provide a comprehensive, detailed answer that:
- Fully addresses the user's query or question
- Provides actionable insights and recommendations
- Includes specific details when available
- Analyzes the situation thoroughly
- Gives a complete, thorough response without being unnecessarily brief
- Can include multiple paragraphs if needed to fully answer the question`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Generate sales email using Gemini AI
 * @param {string} leadName - Name of the lead
 * @param {string} subject - Email subject/purpose
 * @param {string} context - Additional context
 * @returns {Promise<string>} - AI-generated email body
 */
export async function generateSalesEmail(leadName, subject, context) {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a professional sales email writer. Generate a professional, personalized sales email.

Lead Name: ${leadName}
Subject: ${subject}
Context: ${context}

Write an email that is:
- Professional but personable
- Concise (3-4 sentences)
- Action-oriented with a clear call-to-action
- No salutation or closing (just the body)`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Analyze deal to predict win probability using Gemini AI
 * @param {object} dealData - Deal information
 * @returns {Promise<object>} - Analysis with probability and reasoning
 */
export async function analyzeDealProbability(dealData) {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a sales analytics expert. Analyze this deal and provide a win probability assessment.

Deal Title: ${dealData.title}
Amount: ₹${dealData.amount}
Current Stage: ${dealData.stage}
Days in Current Stage: ${dealData.daysInStage || 'Unknown'}
Contact Engagement: ${dealData.engagement || 'Moderate'}
Competition: ${dealData.competition || 'Unknown'}

Provide a JSON response with:
{
  "winProbability": <0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "riskFactors": ["<risk1>", "<risk2>"],
  "opportunities": ["<opportunity1>", "<opportunity2>"]
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  try {
    // Extract JSON from response
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
  }

  return {
    winProbability: 50,
    reasoning: response.text(),
    riskFactors: [],
    opportunities: []
  };
}

/**
 * Generate meeting summary using Gemini AI
 * @param {string} notes - Meeting notes
 * @param {string} attendees - Meeting attendees
 * @returns {Promise<object>} - Summary with key points and action items
 */
export async function generateMeetingSummary(notes, attendees) {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are a meeting transcription expert. Summarize this meeting and extract action items.

Attendees: ${attendees}
Notes: ${notes}

Provide a JSON response with:
{
  "summary": "<2-3 sentence summary>",
  "keyPoints": ["<point1>", "<point2>", "<point3>"],
  "actionItems": [
    {"task": "<task>", "owner": "<owner>", "dueDate": "<YYYY-MM-DD>"}
  ],
  "nextSteps": "<brief description>"
}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  try {
    const jsonMatch = response.text().match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
  }

  return {
    summary: response.text(),
    keyPoints: [],
    actionItems: [],
    nextSteps: ''
  };
}
