import { useState, useEffect } from 'react';
import './index.css';

interface Message {
  id: string;
  content: string;
  author: { name: string };
  createdAt: string;
}

interface ZapTicketWidgetProps {
  organizationId: string;
  apiUrl?: string;
}

export function ZapTicketWidget({ organizationId, apiUrl = 'http://localhost:3001' }: ZapTicketWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !ticketId) {
      startConversation();
    }
  }, [isOpen]);

  const startConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/widget/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });
      const data = await res.json();
      setTicketId(data.ticketId);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !ticketId) return;

    const message = { id: Date.now().toString(), content: input, author: { name: 'You' }, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, message]);
    setInput('');

    try {
      await fetch(`${apiUrl}/api/v1/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, content: input }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col border">
          <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
            <span className="font-semibold">Chat Support</span>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <p className="text-gray-500 text-center">Starting conversation...</p>
            ) : messages.length === 0 ? (
              <p className="text-gray-500 text-center">How can we help you today?</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`text-sm ${msg.author.name === 'You' ? 'text-right' : ''}`}>
                  <span className="inline-block px-3 py-2 rounded-lg bg-gray-100">{msg.content}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZapTicketWidget;
