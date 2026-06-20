const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL;
const DEFAULT_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-latest'
];

const parseGeminiText = (payload) => {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    return '';
  }

  return parts
    .map((part) => part?.text || '')
    .join('')
    .trim();
};

const callGeminiWithModel = async (model, systemInstruction, userPrompt, options = {}) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 700
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = parseGeminiText(payload);

  if (!text) {
    throw new Error('Gemini API returned an empty response');
  }

  return text;
};

const callGemini = async (systemInstruction, userPrompt, options = {}) => {
  const candidates = GEMINI_MODEL
    ? [GEMINI_MODEL, ...DEFAULT_GEMINI_MODELS.filter((model) => model !== GEMINI_MODEL)]
    : DEFAULT_GEMINI_MODELS;

  let lastError;

  for (const model of candidates) {
    try {
      return await callGeminiWithModel(model, systemInstruction, userPrompt, options);
    } catch (error) {
      lastError = error;
      // Try next model only for model availability errors.
      if (!String(error.message).includes('404')) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Gemini API request failed');
};

/**
 * Generate an AI explanation for the current algorithm step
 * @param {Object} context - Current visualization context
 * @param {string} context.algorithmName - Name of the algorithm
 * @param {string} context.category - Algorithm category (Sorting, Searching, etc.)
 * @param {number} context.currentStep - Current step number
 * @param {number} context.totalSteps - Total steps in the algorithm
 * @param {string} context.operation - Current operation being performed
 * @param {string} context.explanation - Current explanation text
 * @param {Object} context.variables - Current state of variables
 * @param {Array} context.array - Current array state
 * @param {string} userQuestion - Optional specific question from user
 * @returns {Promise<string>} AI-generated explanation
 */
const generateExplanation = async (context, userQuestion = null) => {
  if (!GEMINI_API_KEY) {
    // Fallback to rule-based explanations if no API key
    return generateFallbackExplanation(context, userQuestion);
  }

  const { algorithmName, category, currentStep, totalSteps, operation, explanation, variables, array } = context;

  // Build the prompt
  let prompt = `You are an Algorithm Tutor helping students understand algorithms through visualization.
  
Current Visualization Context:
- Algorithm: ${algorithmName}
- Category: ${category}
- Progress: Step ${currentStep} of ${totalSteps}
- Current Operation: ${operation}
- Current Explanation: ${explanation || 'N/A'}
- Variables State: ${JSON.stringify(variables)}
- Array State: [${array.map(item => item.value).join(', ')}]`;

  if (userQuestion) {
    prompt += `\n\nStudent's Question: ${userQuestion}\n\nPlease provide a clear, educational answer.`;
  } else {
    prompt += `\n\nPlease explain what's happening at this step in simple terms. Focus on:
1. What operation is being performed
2. Why it's being done this way
3. What changes are happening to the data`;
  }

  try {
    return await callGemini(
      'You are a patient, knowledgeable algorithm tutor. Explain concepts clearly with analogies when helpful. Use simple language suitable for beginners.',
      prompt,
      { temperature: 0.7, maxOutputTokens: 700 }
    );
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackExplanation(context, userQuestion);
  }
};

/**
 * Generate personalized suggestions based on current state
 * @param {Object} context - Current visualization context
 * @returns {Promise<Array<string>>} Array of suggestions
 */
const generateSuggestions = async (context) => {
  if (!GEMINI_API_KEY) {
    return generateFallbackSuggestions(context);
  }

  const { algorithmName, currentStep, totalSteps, array } = context;

  const prompt = `Based on the algorithm "${algorithmName}" at step ${currentStep} of ${totalSteps} with array [${array.map(item => item.value).join(', ')}],

Provide 3-4 helpful suggestions for what the student could try next or questions they might have. Keep suggestions brief and practical.`;

  try {
    const text = await callGemini(
      'You are a helpful algorithm tutor. Provide brief, actionable suggestions.',
      prompt,
      { temperature: 0.7, maxOutputTokens: 250 }
    );

    // Parse suggestions from response text.
    return text
      .split('\n')
      .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
      .filter((line) => line.length > 0)
      .slice(0, 4);
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateFallbackSuggestions(context);
  }
};

const generateChatbotReply = async (message, history = []) => {
  if (!GEMINI_API_KEY) {
    return 'AI chat is not configured yet. Please add GEMINI_API_KEY on the backend.';
  }

  const recentHistory = Array.isArray(history)
    ? history.slice(-8).map((item) => `${item.role}: ${item.content}`).join('\n')
    : '';

  const prompt = `You are the DSA Visualizer website assistant.
Your role:
- Help users with algorithms, data structures, and how to use this website.
- Give concise and accurate answers.
- Use plain English and short steps when helpful.

Conversation so far:
${recentHistory || 'No prior messages.'}

User: ${message}

Respond as an assistant message only.`;

  try {
    return await callGemini(
      'You are a friendly website chatbot and DSA tutor. Keep responses practical and concise.',
      prompt,
      { temperature: 0.6, maxOutputTokens: 700 }
    );
  } catch (error) {
    console.error('Gemini chatbot error:', error);
    return generateFallbackChatbotReply(message, error);
  }
};

const generateFallbackChatbotReply = (message, error) => {
  const text = String(message || '').toLowerCase();
  const err = String(error?.message || '');

  if (err.includes('429') || err.includes('RESOURCE_EXHAUSTED') || err.includes('quota')) {
    if (text.includes('hi') || text.includes('hello') || text.includes('how are')) {
      return 'Hi. I am running in fallback mode because Gemini quota is currently exhausted, but I can still help with DSA basics. Ask me about sorting, searching, graphs, or complexity.';
    }

    if (text.includes('time complexity') || text.includes('big o')) {
      return 'Fallback quick guide: Binary Search is O(log n), Merge Sort is O(n log n), Quick Sort average is O(n log n) with O(n^2) worst case, and Bubble/Insertion/Selection Sort are O(n^2).';
    }

    return 'Gemini quota is currently exhausted for this API key, so I switched to fallback mode. I can still answer common DSA questions and explain algorithm intuition.';
  }

  if (err.includes('401') || err.includes('403') || err.includes('API key')) {
    return 'Gemini authentication failed. Please verify the API key and Gemini API access for this project.';
  }

  if (text.includes('hi') || text.includes('hello') || text.includes('how are')) {
    return 'Hello. I am here to help with DSA concepts and this visualizer. Ask me a specific topic and I will break it down clearly.';
  }

  if (text.includes('sort')) {
    return 'Sorting tip: choose Merge Sort for stable O(n log n), Quick Sort for fast practical average performance, and Insertion Sort for small or nearly sorted arrays.';
  }

  if (text.includes('search')) {
    return 'Searching tip: use Linear Search for unsorted data and Binary Search for sorted data to get O(log n) lookup time.';
  }

  return 'I am temporarily in fallback mode, but I can still help with DSA explanations. Try asking: "Explain BFS vs DFS" or "When should I use Quick Sort?"';
};

/**
 * Fallback explanation when AI is not available
 */
const generateFallbackExplanation = (context, userQuestion) => {
  const { algorithmName, operation, variables, array, currentStep, totalSteps } = context;

  if (userQuestion) {
    // Common Q&A patterns
    const lowerQuestion = userQuestion.toLowerCase();
    
    if (lowerQuestion.includes('why')) {
      return `Great question! The "${operation}" step is crucial because it helps us achieve the algorithm's goal efficiently. In ${algorithmName}, each step is designed to progressively organize the data.`;
    }
    
    if (lowerQuestion.includes('time complexity') || lowerQuestion.includes('big o')) {
      return `${algorithmName} has different time complexities: Best case is O(n), Average is O(n²), and Worst case is O(n²) for Bubble Sort. This refers to how the number of operations grows with input size.`;
    }
    
    if (lowerQuestion.includes('what')) {
      return `At step ${currentStep}, we're performing "${operation}". The current array state is: [${array.slice(0, 5).map(i => i.value).join(', ')}${array.length > 5 ? '...' : ''}]. This is helping us sort/search the data.`;
    }
    
    return `That's a great question to ask! "${userQuestion}" relates to understanding how ${algorithmName} works step by step. Keep exploring and asking questions - that's the best way to learn!`;
  }

  // Default step explanation
  let explanation = `At step ${currentStep} of ${totalSteps}, we're currently: ${operation || 'processing the data'}. `;
  
  if (variables && Object.keys(variables).length > 0) {
    explanation += 'Current variable values: ';
    explanation += Object.entries(variables)
      .map(([k, v]) => `${k}=${Array.isArray(v) ? '[' + v.slice(0, 5).join(',') + '...]' : v}`)
      .join(', ');
  }
  
  explanation += '. This is part of the ' + algorithmName + ' algorithm which helps organize data efficiently.';
  
  return explanation;
};

/**
 * Fallback suggestions when AI is not available
 */
const generateFallbackSuggestions = (context) => {
  const { algorithmName, currentStep, totalSteps } = context;
  const progress = (currentStep / totalSteps) * 100;
  
  const baseSuggestions = [
    `Try explaining what happens at step ${Math.max(1, currentStep - 1)} to test your understanding`,
    `What would happen if we skipped this step?`,
    `Can you trace through this algorithm with a smaller array?`,
    'Try using Step-by-Step mode to see each operation clearly'
  ];
  
  if (progress < 25) {
    return [
      'Watch the first few steps carefully to understand the pattern',
      'Try to predict what will happen at the next step',
      ...baseSuggestions.slice(0, 2)
    ];
  } else if (progress > 75) {
    return [
      'We\'re almost done! Notice how the array is almost sorted now',
      'Think about why this algorithm guarantees a sorted result',
      ...baseSuggestions.slice(0, 2)
    ];
  }
  
  return baseSuggestions;
};

/**
 * Chat session management
 */
const chatSessions = new Map();

const createSession = (sessionId) => {
  chatSessions.set(sessionId, {
    messages: [],
    createdAt: new Date()
  });
};

const addMessage = (sessionId, role, content) => {
  if (!chatSessions.has(sessionId)) {
    createSession(sessionId);
  }
  chatSessions.get(sessionId).messages.push({ role, content, timestamp: new Date() });
  
  // Keep only last 20 messages
  const session = chatSessions.get(sessionId);
  if (session.messages.length > 20) {
    session.messages = session.messages.slice(-20);
  }
};

const getSessionHistory = (sessionId) => {
  return chatSessions.has(sessionId) 
    ? chatSessions.get(sessionId).messages 
    : [];
};

const clearSession = (sessionId) => {
  chatSessions.delete(sessionId);
};

module.exports = {
  generateExplanation,
  generateSuggestions,
  generateChatbotReply,
  createSession,
  addMessage,
  getSessionHistory,
  clearSession
};
