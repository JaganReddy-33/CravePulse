-- ====================================================================
-- CravePulse Platform Migration V8: Order-Scoped Chat & Realtime Messaging
-- ====================================================================

CREATE TABLE IF NOT EXISTS order_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    sender_role ENUM('CUSTOMER', 'RIDER', 'RESTAURANT', 'ADMIN') NOT NULL,
    recipient_role ENUM('CUSTOMER', 'RIDER', 'RESTAURANT', 'ALL') NOT NULL DEFAULT 'ALL',
    message_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_order_messages_order (order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
