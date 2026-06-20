import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAITutor = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const sessionIdRef = useRef(null);

  // Quick action definitions
  const quickActions = [
    { id: 'explain-step', label: 'Explain This Step', icon: '💡' },
    { id: 'why-this-step', label: 'Why This Step?', icon: '🤔' },
    { id: 'time-complexity', label: 'Time Complexity', icon: '⏱️' },
    { id: 'next-step', label: 'What\'s Next?', icon: '🔮' },
    { id: 'trace-example', label: 'Walk Through Example', icon: '📝' },
    { id: 'real-world-use', label: 'Real-World Use', icon: '🌍' },
  ];

  // Send message to AI tutor
  const sendMessage = useCallback(async (message, context) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-tutor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: sessionIdRef.current,
          algorithmName: context?.algorithmName,
          category: context?.category,
          currentStep: context?.currentStep,
          totalSteps: context?.totalSteps,
          operation: context?.operation,
          explanation: context?.explanation,
          variables: context?.variables,
          array: context?.array,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI Tutor');
      }

      const data = await response.json();
      
      // Update session ID if new
      if (data.sessionId) {
        sessionIdRef.current = data.sessionId;
      }

      // Add AI response to UI
      const aiMessage = { role: 'assistant', content: data.response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);

      return aiMessage;
    } catch (error) {
      console.error('AI Tutor error:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble responding right now. Please try again.', 
        timestamp: new Date(),
        isError: true 
      };
      setMessages(prev => [...prev, errorMessage]);
      return errorMessage;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Execute a quick action
  const executeQuickAction = useCallback(async (actionId, context) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;

    // Map action to question
    const actionQuestions = {
      'explain-step': 'Explain what is happening at this step in simple terms',
      'why-this-step': 'Why is this step necessary? What does it accomplish?',
      'time-complexity': 'What is the time complexity of this algorithm? How does it affect performance?',
      'next-step': 'What will happen in the next step? Can you predict?',
      'trace-example': 'Can you walk through a simple example with a small array?',
      'real-world-use': 'What are some real-world applications of this algorithm?'
    };

    const question = actionQuestions[actionId];
    if (question) {
      return await sendMessage(question, context);
    }
  }, [sendMessage]);

  // Get AI-powered suggestions
  const fetchSuggestions = useCallback(async (context) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-tutor/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          algorithmName: context?.algorithmName,
          category: context?.category,
          currentStep: context?.currentStep,
          totalSteps: context?.totalSteps,
          operation: context?.operation,
          variables: context?.variables,
          array: context?.array,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        return data.suggestions;
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
    return [];
  }, []);

  // Get explanation for current step
  const getExplanation = useCallback(async (context) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-tutor/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          algorithmName: context?.algorithmName,
          category: context?.category,
          currentStep: context?.currentStep,
          totalSteps: context?.totalSteps,
          operation: context?.operation,
          explanation: context?.explanation,
          variables: context?.variables,
          array: context?.array,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.explanation;
      }
    } catch (error) {
      console.error('Failed to get explanation:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  // Clear chat history
  const clearChat = useCallback(async () => {
    if (sessionIdRef.current) {
      try {
        await fetch(`${API_BASE_URL}/api/ai-tutor/session/${sessionIdRef.current}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error('Failed to clear session:', error);
      }
    }
    setMessages([]);
    setSuggestions([]);
    sessionIdRef.current = null;
  }, []);

  // Toggle chat panel
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Open chat panel
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close chat panel
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    // State
    messages,
    isLoading,
    isOpen,
    suggestions,
    quickActions,
    
    // Actions
    sendMessage,
    executeQuickAction,
    fetchSuggestions,
    getExplanation,
    clearChat,
    toggleChat,
    openChat,
    closeChat,
  };
};

export default useAITutor;
