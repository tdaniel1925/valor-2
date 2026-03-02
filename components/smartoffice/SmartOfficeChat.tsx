'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, ChevronDown, ChevronUp, Code } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any[];
  queryType?: string;
  sqlGenerated?: string;
}

const SUGGESTED_QUESTIONS = [
  'Show me pending policies',
  'How much commission this month?',
  'Who is my top advisor?',
  'Show policies over $100k',
  'List all agents',
  'Show Athene policies',
];

export default function SmartOfficeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showSql, setShowSql] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (question?: string) => {
    const messageText = question || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/smartoffice/chat', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: `session-${Date.now()}`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          data: data.data,
          queryType: data.queryType,
          sqlGenerated: data.sqlGenerated,
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${data.error || 'Failed to process your question. Please try again.'}`,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderData = (data: any[], queryType?: string) => {
    if (!data || data.length === 0) return null;

    // For aggregate results (single number)
    if (queryType === 'aggregate' && data.length === 1) {
      const result = data[0];
      const value = result._sum || result._count || result._avg || result;

      return (
        <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-900">
            {typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : value.toLocaleString()}
          </div>
        </div>
      );
    }

    // For table results
    if (data.length > 0) {
      const keys = Object.keys(data[0]).filter(k =>
        !k.includes('id') && !k.includes('tenantId') && !k.includes('raw')
      );

      return (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {keys.slice(0, 5).map(key => (
                  <th
                    key={key}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {keys.slice(0, 5).map(key => (
                    <td key={key} className="px-3 py-2 whitespace-nowrap text-gray-900">
                      {typeof row[key] === 'number'
                        ? row[key].toLocaleString()
                        : row[key]?.toString().substring(0, 50) || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 10 && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Showing first 10 of {data.length} results
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-white" />
          <div>
            <h3 className="text-lg font-semibold text-white">AI Assistant</h3>
            <p className="text-sm text-purple-100">Ask questions about your SmartOffice data</p>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Try asking:</h4>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(question)}
                disabled={loading}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat History */}
      {messages.length > 0 && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50"
          >
            <span className="text-sm font-medium text-gray-700">
              Chat History ({messages.length} messages)
            </span>
            {showHistory ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showHistory && (
            <div className="max-h-96 overflow-y-auto px-6 pb-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    } rounded-lg px-4 py-2`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Show data if available */}
                  {message.role === 'assistant' && message.data && (
                    <div className="mt-2 inline-block w-full">
                      {renderData(message.data, message.queryType)}
                    </div>
                  )}

                  {/* Show SQL if available */}
                  {message.role === 'assistant' && message.sqlGenerated && (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          setShowSql(showSql === message.sqlGenerated ? null : message.sqlGenerated!)
                        }
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Code className="w-3 h-3" />
                        {showSql === message.sqlGenerated ? 'Hide' : 'View'} Query
                      </button>
                      {showSql === message.sqlGenerated && (
                        <pre className="mt-1 p-2 bg-gray-800 text-gray-100 rounded text-xs overflow-x-auto">
                          {message.sqlGenerated}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            placeholder="Ask a question about your data..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Powered by Claude AI • Results are based on your SmartOffice data
        </p>
      </div>
    </div>
  );
}
