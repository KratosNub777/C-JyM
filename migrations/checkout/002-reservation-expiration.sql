-- Requires the existing Payload Orders collection schema. Apply once before
-- deploying this feature to production; development uses Payload's schema push.
BEGIN;
ALTER TYPE enum_orders_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at timestamptz(3);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expired_at timestamptz(3);
CREATE INDEX IF NOT EXISTS orders_expires_at_idx ON orders (expires_at);
-- The agreed initial policy is 24 hours measured from creation, including legacy orders.
UPDATE orders SET expires_at = created_at + INTERVAL '24 hours'
WHERE status = 'pending_payment' AND expires_at IS NULL;
COMMIT;
