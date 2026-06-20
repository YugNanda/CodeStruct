const express = require('express');
const router = express.Router();
const { 
  generateExplanation, 
  generateSuggestions,
  createSession,
  addMessage,
  getSessionHistory,
  clearSession
} = require('../services/aiService');

// POST /api/ai-tutor/explain - Get AI explanation for current step
router.post('/explain', async (req, res) => {
  try {
    const { 
      algorithmName, 
      category, 
      currentStep, 
      totalSteps, 
      operation, 
      explanation, 
      variables, 
      array,
      question,
      sessionId 
    } = req.body;

    // Validate required fields
    if (!algorithmName) {
      return res.status(400).json({ error: 'Algorithm name is required' });
    }

    const context = {
      algorithmName,
      category: category || 'Unknown',
      currentStep: currentStep || 0,
      totalSteps: totalSteps || 0,
      operation: operation || '',
      explanation: explanation || '',
      variables: variables || {},
      array: array || []
    };

    // Add user message to session if sessionId provided
    if (sessionId && question) {
      addMessage(sessionId, 'user', question);
    }

    const aiResponse = await generateExplanation(context, question);

    // Add AI response to session if sessionId provided
    if (sessionId) {
      addMessage(sessionId, 'assistant', aiResponse);
    }

    res.json({ 
      explanation: aiResponse,
      sessionId: sessionId || null
    });
  } catch (error) {
    console.error('AI Tutor error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// POST /api/ai-tutor/suggestions - Get AI-powered suggestions
router.post('/suggestions', async (req, res) => {
  try {
    const { 
      algorithmName, 
      category, 
      currentStep, 
      totalSteps, 
      operation, 
      variables, 
      array 
    } = req.body;

    if (!algorithmName) {
      return res.status(400).json({ error: 'Algorithm name is required' });
    }

    const context = {
      algorithmName,
      category: category || 'Unknown',
      currentStep: currentStep || 0,
      totalSteps: totalSteps || 0,
      operation: operation || '',
      variables: variables || {},
      array: array || []
    };

    const suggestions = await generateSuggestions(context);

    res.json({ suggestions });
  } catch (error) {
    console.error('AI Tutor suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// POST /api/ai-tutor/chat - Chat with AI tutor
router.post('/chat', async (req, res) => {
  try {
    const { 
      message, 
      sessionId,
      algorithmName, 
      category, 
      currentStep, 
      totalSteps, 
      operation, 
      explanation,
      variables, 
      array 
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create new session if doesn't exist
    const finalSessionId = sessionId || `session_${Date.now()}`;
    
    // Build context from current visualization state
    const context = {
      algorithmName: algorithmName || 'Unknown Algorithm',
      category: category || 'Unknown',
      currentStep: currentStep || 0,
      totalSteps: totalSteps || 0,
      operation: operation || '',
      explanation: explanation || '',
      variables: variables || {},
      array: array || []
    };

    // Get conversation history
    const history = getSessionHistory(finalSessionId);

    // Add current user message to history
    addMessage(finalSessionId, 'user', message);

    // Generate response
    const aiResponse = await generateExplanation(context, message);

    // Add AI response to history
    addMessage(finalSessionId, 'assistant', aiResponse);

    res.json({ 
      response: aiResponse,
      sessionId: finalSessionId,
      history: getSessionHistory(finalSessionId)
    });
  } catch (error) {
    console.error('AI Tutor chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/ai-tutor/history/:sessionId - Get chat history
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = getSessionHistory(sessionId);
    res.json({ history, sessionId });
  } catch (error) {
    console.error('AI Tutor history error:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// DELETE /api/ai-tutor/session/:sessionId - Clear chat session
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    clearSession(sessionId);
    res.json({ success: true, message: 'Session cleared' });
  } catch (error) {
    console.error('AI Tutor clear session error:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

// POST /api/ai-tutor/quick-actions - Get quick action responses
router.post('/quick-actions', async (req, res) => {
  try {
    const { 
      action,
      algorithmName, 
      category, 
      currentStep, 
      totalSteps, 
      operation, 
      explanation,
      variables, 
      array 
    } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const context = {
      algorithmName: algorithmName || 'Unknown Algorithm',
      category: category || 'Unknown',
      currentStep: currentStep || 0,
      totalSteps: totalSteps || 0,
      operation: operation || '',
      explanation: explanation || '',
      variables: variables || {},
      array: array || []
    };

    // Map actions to questions
    const actionQuestions = {
      'explain-step': 'Explain what is happening at this step in simple terms',
      'why-this-step': 'Why is this step necessary? What does it accomplish?',
      'time-complexity': 'What is the time complexity of this algorithm? How does it affect performance?',
      'next-step': 'What will happen in the next step? Can you predict?',
      'trace-example': 'Can you walk through a simple example with a small array?',
      'real-world-use': 'What are some real-world applications of this algorithm?'
    };

    const question = actionQuestions[action] || 'Explain this step to me';

    const response = await generateExplanation(context, question);

    res.json({ 
      action,
      response
    });
  } catch (error) {
    console.error('AI Tutor quick actions error:', error);
    res.status(500).json({ error: 'Failed to process quick action' });
  }
});

module.exports = router;
