import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic, MicOff, X, Send, MessageCircle, Volume2, VolumeX,
  ChevronDown, ChevronUp, Loader, Bot, User, RefreshCw,
  History, Settings, Sparkles
} from 'lucide-react';

const VoiceAssistantWidget = ({ apiUrl, authToken }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        setTextInput(transcript);

        if (event.results[0].isFinal) {
          handleSendCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError('Speech recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch command history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/voice/history?limit=20`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setCommandHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [apiUrl, authToken]);

  useEffect(() => {
    if (isOpen && showHistory) {
      fetchHistory();
    }
  }, [isOpen, showHistory, fetchHistory]);

  // Start/stop voice recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) {
        setError('Speech recognition not supported in this browser');
        return;
      }
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Send command to backend
  const handleSendCommand = async (command) => {
    if (!command.trim()) return;

    const userMessage = {
      type: 'user',
      content: command,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setTextInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/api/voice/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: command,
          session_id: sessionId
        })
      });

      const data = await res.json();

      if (data.success) {
        // Store session ID for context
        if (data.session_id) {
          setSessionId(data.session_id);
        }

        const botMessage = {
          type: 'bot',
          content: data.response,
          data: data.data,
          intent: data.intent,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, botMessage]);

        // Speak response if enabled
        if (speechEnabled && data.response) {
          speak(data.response);
        }
      } else {
        throw new Error(data.error || 'Failed to process command');
      }
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        type: 'bot',
        content: "Sorry, I couldn't process that. Please try again.",
        error: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Text-to-speech
  const speak = (text) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // Handle keyboard submit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand(textInput);
    }
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setSessionId(null);
  };

  // Render data visualization based on intent
  const renderDataVisualization = (data, intent) => {
    if (!data) return null;

    return (
      <div className="mt-3 p-3 bg-slate-700/50 rounded-lg text-sm">
        {data.stats && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.stats).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-slate-400">{formatLabel(key)}:</span>
                <span className="text-white font-medium">{formatValue(key, value)}</span>
              </div>
            ))}
          </div>
        )}
        {data.trades && Array.isArray(data.trades) && data.trades.length > 0 && (
          <div className="mt-2">
            <p className="text-slate-400 mb-1">Recent trades:</p>
            <div className="space-y-1">
              {data.trades.slice(0, 3).map((trade, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{trade.pair}</span>
                  <span className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${trade.profit?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatValue = (key, value) => {
    if (typeof value === 'number') {
      if (key.includes('rate') || key.includes('percent')) {
        return `${value.toFixed(1)}%`;
      }
      if (key.includes('profit') || key.includes('loss') || key.includes('pnl')) {
        return `$${value.toFixed(2)}`;
      }
      return value.toFixed(2);
    }
    return value;
  };

  // Example commands
  const exampleCommands = [
    "What's my win rate this month?",
    "Show me my best performing pair",
    "How many trades did I make today?",
    "What's my total profit this week?",
    "Show my psychology score"
  ];

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-slate-700 hover:bg-slate-600'
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
        }`}
        title="Voice Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <Mic className="w-6 h-6 text-white" />
            <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
          </div>
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">Trading Assistant</h3>
                <p className="text-xs text-white/70">Ask me about your trades</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-lg transition-colors ${
                  showHistory ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
                title="Command History"
              >
                <History className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  speechEnabled ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
                title={speechEnabled ? 'Mute responses' : 'Enable speech'}
              >
                {speechEnabled ? (
                  <Volume2 className="w-4 h-4 text-white" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white/50" />
                )}
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
            {showHistory ? (
              // Command History View
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-400 mb-3">Recent Commands</h4>
                {commandHistory.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">No command history yet</p>
                ) : (
                  commandHistory.map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowHistory(false);
                        handleSendCommand(cmd.processed_command || cmd.raw_transcript);
                      }}
                      className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <p className="text-sm text-white truncate">{cmd.processed_command || cmd.raw_transcript}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(cmd.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : messages.length === 0 ? (
              // Welcome Message
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-purple-400" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Hi! I'm your Trading Assistant</h4>
                <p className="text-sm text-slate-400 mb-4">
                  Ask me about your trading performance, stats, or get insights.
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Try saying:</p>
                  {exampleCommands.slice(0, 3).map((cmd, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendCommand(cmd)}
                      className="block w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
                    >
                      "{cmd}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // Chat Messages
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        msg.type === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : msg.error
                            ? 'bg-red-500/20 text-red-300 rounded-bl-md'
                            : 'bg-slate-700 text-white rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      {msg.type === 'bot' && msg.data && renderDataVisualization(msg.data, msg.intent)}
                      <p className={`text-xs mt-1 ${msg.type === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-sm text-slate-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-slate-800/50 border-t border-slate-700">
            {isSpeaking && (
              <div className="flex items-center justify-between mb-2 px-2 py-1 bg-blue-500/20 rounded-lg">
                <span className="text-xs text-blue-400 flex items-center gap-2">
                  <Volume2 className="w-3 h-3" />
                  Speaking...
                </span>
                <button onClick={stopSpeaking} className="text-xs text-blue-400 hover:text-blue-300">
                  Stop
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Voice Button */}
              <button
                onClick={toggleListening}
                disabled={loading}
                className={`p-3 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white" />
                ) : (
                  <Mic className="w-5 h-5 text-slate-300" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? 'Listening...' : 'Type or speak a command...'}
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />

              {/* Send Button */}
              <button
                onClick={() => handleSendCommand(textInput)}
                disabled={!textInput.trim() || loading}
                className="p-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <button
                onClick={clearConversation}
                className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Clear chat
              </button>
              {!recognitionRef.current && (
                <span className="text-yellow-500">Voice not supported in this browser</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAssistantWidget;
