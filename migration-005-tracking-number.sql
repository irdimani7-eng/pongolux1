-- Adds an optional tracking-number field to orders, used by the new
-- "your order has shipped" email (sent automatically when an admin marks
-- an order Fulfilled in /admin/orders/[id]).
ALTER TABLE "order" ADD COLUMN "tracking_number" text;
