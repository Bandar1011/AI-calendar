import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with API key from environment variable
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is not set');
}

// Initialize the API with the correct configuration
const genAI = new GoogleGenerativeAI(apiKey);

interface EventDetails {
  title: string;
  date?: string;
  time?: string;
  duration?: string;
  location?: string;
  participants?: string[];
  description?: string;
}

// Test function to verify Gemini integration
export async function testGeminiConnection(): Promise<boolean> {
  try {
    console.log('Testing Gemini connection...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = 'Say "test" if you can read this.';
    console.log('Sending test prompt:', prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().toLowerCase();
    console.log('Gemini test response:', text);
    return text.includes('test');
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    throw error;
  }
}

export async function processEventText(text: string): Promise<EventDetails | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      Extract event details from the following text and return ONLY a valid JSON object (no markdown formatting, no \`\`\`json tags) with these fields:
      {
        "title": "A descriptive title for the event, e.g., 'Meeting with Sarah', 'Doctor Appointment', etc.",
        "date": "YYYY-MM-DD format, or relative date like 'tomorrow', 'next week'",
        "time": "HH:mm 24-hour format if specified",
        "duration": "duration if specified",
        "location": "location if specified",
        "participants": ["array of participants if any"],
        "description": "any additional details"
      }
      
      Always include a title field, creating one from the available information if not explicitly given.
      If a field is not mentioned in the text, omit it from the JSON. Return ONLY the JSON object, no other text.
      
      Example 1:
      Input: "Meeting with John tomorrow at 3pm"
      Output: {
        "title": "Meeting with John",
        "date": "tomorrow",
        "time": "15:00",
        "participants": ["John"]
      }

      Example 2:
      Input: "Dentist appointment next Friday at 2:30pm"
      Output: {
        "title": "Dentist Appointment",
        "date": "next Friday",
        "time": "14:30"
      }

      Text to process: "${text}"
    `;

    console.log('Sending event processing prompt');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonStr = response.text();
    
    // Clean up the response by removing markdown formatting
    jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
    console.log('Cleaned response:', jsonStr);
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      console.error('Raw response:', jsonStr);
      return null;
    }
  } catch (error) {
    console.error('Error processing text with Gemini:', error);
    throw error;
  }
} 