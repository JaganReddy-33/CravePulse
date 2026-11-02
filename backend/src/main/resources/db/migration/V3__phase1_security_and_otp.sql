-- V3__phase1_security_and_otp.sql
-- Phase 1 Migration: Add delivery_otp to orders and actor_role to order_events

ALTER TABLE orders 
ADD COLUMN delivery_otp VARCHAR(6) DEFAULT NULL AFTER special_instructions;

ALTER TABLE order_events 
ADD COLUMN actor_role VARCHAR(30) DEFAULT NULL AFTER triggered_by_user_id;
