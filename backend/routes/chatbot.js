const express = require('express');
const router = express.Router();
const {
  generateChatbotReply,
  addMessage,
  getSessionHistory,
  clearSession
} = require('../services/aiService');

//Check chatbot backend availability
router.get('/health', (req, res) => {
  return res.json({
    ok: true,
    mode: process.env.GEMINI_API_KEY ? 'ai' : 'fallback'
  });
});

// POST /api/chatbot/message - Send message to Gemini chatbot
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const finalSessionId = sessionId || `chat_${Date.now()}`;
    addMessage(finalSessionId, 'user', String(message).trim());

    const history = getSessionHistory(finalSessionId);
    const responseText = await generateChatbotReply(String(message).trim(), history);

    addMessage(finalSessionId, 'assistant', responseText);

    return res.json({
      response: responseText,
      sessionId: finalSessionId,
      history: getSessionHistory(finalSessionId)
    });
  } catch (error) {
    console.error('Chatbot route error:', error);
    return res.status(500).json({ error: 'Failed to process chatbot message' });
  }
});

// GET /api/chatbot/history/:sessionId - Retrieve chatbot history
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    return res.json({ sessionId, history: getSessionHistory(sessionId) });
  } catch (error) {
    console.error('Chatbot history error:', error);
    return res.status(500).json({ error: 'Failed to get chat history' });
  }
});

// DELETE /api/chatbot/session/:sessionId - Clear chatbot session
router.delete('/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    clearSession(sessionId);
    return res.json({ success: true });
  } catch (error) {
    console.error('Chatbot clear session error:', error);
    return res.status(500).json({ error: 'Failed to clear session' });
  }
});

module.exports = router;
