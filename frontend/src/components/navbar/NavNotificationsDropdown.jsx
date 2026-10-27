import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * NavNotificationsDropdown: Real-time notification center popover.
 */
const NavNotificationsDropdown = ({
  notifications,
  unreadCount,
  showNotifs,
  setShowNotifs,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
}) => {
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowNotifs]);

  return (
    <div className="position-relative" ref={notifRef}>
      <button 
        type="button" 
        className="btn btn-light rounded-circle p-2 border position-relative d-flex align-items-center justify-content-center shadow-sm touch-target"
        onClick={() => setShowNotifs(!showNotifs)}
        aria-label="View notifications"
        aria-expanded={showNotifs}
      >
        <i className="bi bi-bell-fill fs-6 text-dark"></i>
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white"
            style={{ fontSize: 10 }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifs && (
        <div 
          className="card position-absolute end-0 mt-2 shadow-xl border-0 rounded-4 bg-white overflow-hidden animate-slide-left" 
          style={{ width: 340, zIndex: 1050 }}
        >
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
            <h6 className="mb-0 fw-bold small text-dark">Live Notifications</h6>
            <div className="d-flex gap-2">
              {unreadCount > 0 && (
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-primary small text-decoration-none" 
                  style={{ fontSize: 11 }}
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  type="button" 
                  className="btn btn-link p-0 text-muted small text-decoration-none" 
                  style={{ fontSize: 11 }}
                  onClick={clearAllNotifications}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-auto" style={{ maxHeight: 320 }}>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted small">
                <i className="bi bi-bell-slash fs-4 d-block mb-1 opacity-50"></i>
                No notifications right now
              </div>
            ) : (
              <div className="d-flex flex-column">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-3 border-bottom d-flex gap-2 align-items-start ${n.read ? 'bg-white' : 'bg-light'}`}
                    onClick={() => markAsRead(n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="fs-5 mt-n1">{n.icon || '🔔'}</div>
                    <div className="flex-grow-1 text-truncate">
                      <div className="d-flex justify-content-between align-items-center">
                        <strong className="small text-dark text-truncate">{n.title}</strong>
                        <small className="text-muted" style={{ fontSize: 10 }}>{n.time || 'Now'}</small>
                      </div>
                      <p className="mb-0 text-muted small text-truncate" style={{ fontSize: 12 }}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavNotificationsDropdown;
