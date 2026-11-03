-- Unprovided photos are NULL and use a neutral UI placeholder.
ALTER TABLE menu_items MODIFY COLUMN image_url VARCHAR(500) NULL DEFAULT NULL;
