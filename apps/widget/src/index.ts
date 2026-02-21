import { useState, useEffect, useRef } from 'react';
import './index.css';

interface Message {
  id: string;
  content: string;
  author: { name: string; isAgent?: boolean };
  createdAt: string;
}

interface ZapTicketWidgetProps {
  organizationId: string;
  apiUrl?: string;
  primaryColor?: string;
  title?: string;
  subtitle?: string;
}

export function ZapTicketWidget({
  organizationId,
  apiUrl = 'http://localhost:3001',
  primaryColor = '#3b82f6',
  title = 'Chat Support',
  subtitle = 'How can we help you today?',
}: ZapTicketWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const savedTicket = localStorage.getItem(`zapticket_${organizationId}`);
    if (savedTicket) {
      const { ticketId: savedId, name, email, msgs } = JSON.parse(savedTicket);
      setTicketId(savedId);
      setCustomerName(name);
      setCustomerEmail(email);
      setShowForm(false);
      if (msgs) setMessages(msgs);
    }
  }, [organizationId]);

  const saveState = (tid: string, name: string, email: string, msgs: Message[]) => {
    localStorage.setItem(`zapticket_${organizationId}`, JSON.stringify({
      ticketId: tid,
      name,
      email,
      msgs,
    }));
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/widget/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, name: customerName, email: customerEmail }),
      });
      const data = await res.json();
      setTicketId(data.ticketId);
      setShowForm(false);
      saveState(data.ticketId, customerName, customerEmail, []);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !ticketId) return;

    const msg: Message = {
      id: Date.now().toString(),
      content: input,
      author: { name: customerName || 'You' },
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, msg];
    setMessages(newMessages);
    setInput('');
    saveState(ticketId, customerName, customerEmail, newMessages);

    try {
      await fetch(`${apiUrl}/api/v1/widget/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, content: input, authorName: customerName }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    localStorage.removeItem(`zapticket_${organizationId}`);
    setTicketId(null);
    setMessages([]);
    setShowForm(true);
    setCustomerName('');
    setCustomerEmail('');
  };

  return (
    <div className="zt-widget">
      <style>{`
        .zt-btn { background-color: ${primaryColor}; }
        .zt-btn:hover { background-color: ${primaryColor}dd; }
        .zt-header { background-color: ${primaryColor}; }
        .zt-send-btn { background-color: ${primaryColor}; }
        .zt-send-btn:hover { background-color: ${primaryColor}dd; }
        .zt-agent-msg { background-color: ${primaryColor}15; border-left: 3px solid ${primaryColor}; }
      `}</style>

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="zt-btn zt-toggle-btn"
          aria-label="Open chat"
        >
          <svg className="zt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {messages.length > 0 && <span className="zt-badge">{messages.length}</span>}
        </button>
      )}

      {isOpen && (
        <div className="zt-chat-window">
          <div className="zt-header">
            <div className="zt-header-info">
              <span className="zt-title">{title}</span>
              <span className="zt-subtitle">{subtitle}</span>
            </div>
            <div className="zt-header-actions">
              {ticketId && !showForm && (
                <button onClick={clearChat} className="zt-clear-btn" title="New chat">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="zt-icon-sm">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="zt-close-btn" aria-label="Close chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="zt-messages">
            {showForm ? (
              <div className="zt-form-container">
                <p className="zt-welcome-text">Hello! Please provide your details to start chatting.</p>
                <form onSubmit={handleStartChat} className="zt-form">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="zt-input"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="zt-input"
                  />
                  <button type="submit" disabled={loading} className="zt-btn zt-start-btn">
                    {loading ? 'Starting...' : 'Start Chat'}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="zt-empty">
                    <p>{subtitle}</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`zt-msg ${msg.author.isAgent ? 'zt-agent-msg' : 'zt-user-msg'}`}
                  >
                    <div className="zt-msg-content">{msg.content}</div>
                    <div className="zt-msg-time">{formatTime(msg.createdAt)}</div>
                  </div>
                ))}
                {isTyping && (
                  <div className="zt-typing">
                    <span className="zt-typing-dot"></span>
                    <span className="zt-typing-dot"></span>
                    <span className="zt-typing-dot"></span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {!showForm && (
            <div className="zt-input-area">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="zt-input zt-msg-input"
              />
              <button onClick={sendMessage} disabled={!input.trim()} className="zt-send-btn" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ZapTicketWidget;
