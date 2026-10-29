import React, { useState } from 'react';
import ModalPortal from '../ModalPortal';

/**
 * TrackingChatModal: In-app chat modal with delivery captain or restaurant kitchen.
 */
const TrackingChatModal = ({
  show,
  onClose,
  chatTarget,
  setChatTarget,
  chatMessages,
  onSendMessage,
  order,
}) => {
  const [error, setError] = useState('');
  const [chatInput, setChatInput] = useState('');

  if (!show || !order) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setError('');
    try { await onSendMessage(chatInput.trim(), chatTarget); setChatInput(''); }
    catch (err) { setError(err.message || 'Message was not sent'); }
  };

  return (
    <ModalPortal isOpen={show}>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-4 shadow-2xl p-0 w-100 d-flex flex-column animate-slide-left overflow-hidden"
          style={{ maxWidth: 460, height: 540 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-title"
        >
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {/* Header */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
            <div className="d-flex align-items-center gap-2">
              <div 
                className="rounded-circle text-white fw-bold d-flex align-items-center justify-content-center shadow-xs"
                style={{ width: 34, height: 34, background: chatTarget === 'RIDER' ? '#10b981' : 'var(--c-primary)' }}
              >
                {chatTarget === 'RIDER' ? '🛵' : '🍳'}
              </div>
              <div>
                <strong className="d-block small text-dark" id="chat-title">
                  {chatTarget === 'RIDER' ? `Captain ${order.riderName || 'Rider'}` : order.restaurantName}
                </strong>
                <small className="text-muted" style={{ fontSize: 11 }}>Active In-App Chat</small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {/* Target Tab Toggle */}
              <div className="btn-group btn-group-sm rounded-pill p-1 bg-white border">
                <button
                  type="button"
                  className={`btn btn-sm py-0 px-2 rounded-pill small ${
                    chatTarget === 'RIDER' ? 'btn-success text-white fw-bold' : 'btn-white text-muted'
                  }`}
                  onClick={() => setChatTarget('RIDER')}
                >
                  Rider
                </button>
                <button
                  type="button"
                  className={`btn btn-sm py-0 px-2 rounded-pill small ${
                    chatTarget === 'KITCHEN' ? 'btn-danger text-white fw-bold' : 'btn-white text-muted'
                  }`}
                  onClick={() => setChatTarget('KITCHEN')}
                >
                  Kitchen
                </button>
              </div>

              <button type="button" className="btn-close touch-target" onClick={onClose} aria-label="Close chat"></button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-2" style={{ background: '#f8fafc' }}>
            {chatMessages.length === 0 ? (
              <div className="text-center my-auto text-muted small p-4">
                <i className="bi bi-chat-text fs-1 d-block mb-2 opacity-25"></i>
                Send a quick message to coordinate delivery directions or special requests.
              </div>
            ) : (
              chatMessages.map((msg, idx) => {
                const isMe = msg.sender === 'ME' || msg.senderRole === 'CUSTOMER';
                return (
                  <div
                    key={idx}
                    className={`d-flex flex-column ${isMe ? 'align-items-end' : 'align-items-start'}`}
                  >
                    <div
                      className={`p-3 rounded-4 small ${
                        isMe
                          ? 'bg-primary text-white'
                          : 'bg-white text-dark shadow-xs border'
                      }`}
                      style={{
                        maxWidth: '80%',
                        backgroundColor: isMe ? 'var(--c-primary)' : '#ffffff',
                      }}
                    >
                      {msg.text}
                    </div>
                    <small className="text-muted mt-1 px-1" style={{ fontSize: 10 }}>
                      {msg.time || 'Just now'}
                    </small>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-2 border-top bg-white d-flex gap-2">
            <input
              type="text"
              className="form-control rounded-pill border py-2 ps-3"
              placeholder={`Message ${chatTarget === 'RIDER' ? 'delivery captain' : 'kitchen'}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              maxLength={250}
            />
            <button
              type="submit"
              className="btn btn-primary rounded-circle touch-target d-flex align-items-center justify-content-center text-white"
              style={{ width: 44, height: 44, background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
              aria-label="Send message"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default TrackingChatModal;
