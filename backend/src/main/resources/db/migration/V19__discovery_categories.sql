CREATE TABLE IF NOT EXISTS discovery_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_discovery_categories_name (name)
);

INSERT IGNORE INTO discovery_categories (name, image_url, display_order) VALUES
('North Indian', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=240&h=240&fit=crop', 1),
('Biryani', 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=240&h=240&fit=crop', 2),
('Pizza', 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=240&h=240&fit=crop', 3),
('Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&h=240&fit=crop', 4),
('Sushi', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=240&h=240&fit=crop', 5),
('Salads', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=240&h=240&fit=crop', 6),
('Desserts', 'https://images.unsplash.com/photo-1551024506-0zu262e94d6a?w=240&h=240&fit=crop', 7);
