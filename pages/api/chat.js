
const { GoogleGenerativeAI } = require('@google/generative-ai');
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '../../lib/supabaseAdmin'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to implement delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse retry delay from error message if available
function getRetryDelay(errorMessage, defaultDelay = 60000) {
  try {
    const retryDelayMatch = errorMessage.match(/retryDelay":"(\d+)s"/);
    if (retryDelayMatch && retryDelayMatch[1]) {
      // Convert seconds to milliseconds and add a buffer
      return (parseInt(retryDelayMatch[1]) * 1000) + 5000;
    }
  } catch (e) {
    console.log("Could not parse retry delay from error message");
  }
  return defaultDelay;
}

// Function with retry logic for Gemini API
async function generateContentWithRetry(context, question, maxRetries = 3) {
  let retries = 0;
  let waitTime = 60000; // Initial wait time in ms (60s)
  
  // Available models to try in order of preference
  const models = ["gemini-1.5-pro", "gemini-pro", "gemini-pro-latest"];
  let currentModelIndex = 0;
  let currentModel = models[currentModelIndex];
  
  while (retries <= maxRetries) {
    try {
      // After failure, switch to the next model which might have different quota limits
      if (retries >= 1) {
        currentModelIndex = (currentModelIndex + 1) % models.length;
        currentModel = models[currentModelIndex];
        console.log(`Switching to alternative model: ${currentModel}`);
      }
      
      const model = genAI.getGenerativeModel({ 
        model: currentModel,
        apiVersion: "v1"
      });
      
      console.log(`Attempt ${retries + 1} with model ${currentModel}...`);
      
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: `Context:\n${context}\n\nQuestion: ${question}` }]
          }
        ],
        // Add safety settings to reduce token usage
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ],
      });
      
      return result.response.text();
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error.message);
      
      // 404 error means the model doesn't exist - try next model immediately
      if (error.message.includes('404 Not Found')) {
        console.log(`Model ${currentModel} not found. Trying next model.`);
        retries++;
        continue; // Skip waiting and try next model immediately
      }
      
      // Check if it's a rate limit error (429)
      if (error.message.includes('429 Too Many Requests') && retries < maxRetries) {
        // Try to extract the recommended retry delay from the error message
        waitTime = getRetryDelay(error.message, waitTime);
        
        console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retrying...`);
        await delay(waitTime);
        retries++;
        waitTime *= 2; // More aggressive exponential backoff
      } else {
        // If this is our last retry, don't throw but return a fallback message
        if (retries >= maxRetries) {
          console.log("All retries failed, returning fallback message");
          return `I'm sorry, but I'm currently experiencing high demand. Please try again later. Your question was: "${question}"`;
        }
        
        // Otherwise, for non-rate limit errors, try the next model
        retries++;
      }
    }
  }
  
  // If we reached here, all retries failed
  return `I'm sorry, but I'm currently experiencing high demand. Please try again later. Your question was: "${question}"`;
}

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return res.status(401).json({ error: 'Unauthorized' })

  const { context, question } = req.body

  try {
    // Use our retry function instead of direct API call
    const reply = await generateContentWithRetry(context, question);
    
    // Check if we got a real response or the fallback message
    const isSuccessfulResponse = !reply.includes("I'm sorry, but I'm currently experiencing high demand");
    
    // Only store successful responses in the database
    if (isSuccessfulResponse) {
      await supabaseAdmin.from('chat_messages').insert({
        user_id: session.user.id,
        question,
        response: reply,
      });
    }


    res.status(200).json({ reply })
  } catch (err) {
    console.error('Gemini Error:', err);
    

    const userMessage = "I'm sorry, but the AI service is currently unavailable. Please try again later.";
    res.status(500).json({ error: userMessage, details: err.message })
  }
}