-- Menambahkan kolom gateway_reference ke tabel premium_transactions
ALTER TABLE public.premium_transactions
ADD COLUMN IF NOT EXISTS gateway_reference TEXT;

-- Memperbarui kolom gateway_reference dari data yang ada di payment_details
UPDATE public.premium_transactions
SET gateway_reference = payment_details->>'gateway_reference'
WHERE payment_details->>'gateway_reference' IS NOT NULL
  AND (gateway_reference IS NULL OR gateway_reference = '');

-- Memperbarui kolom gateway_reference dari token jika gateway_reference masih kosong
UPDATE public.premium_transactions
SET gateway_reference = payment_details->>'token'
WHERE payment_details->>'token' IS NOT NULL
  AND (gateway_reference IS NULL OR gateway_reference = '');

-- Tambahkan indeks untuk mempercepat pencarian berdasarkan gateway_reference
CREATE INDEX IF NOT EXISTS idx_premium_transactions_gateway_reference
ON public.premium_transactions (gateway_reference);

-- Tambahkan komentar pada kolom
COMMENT ON COLUMN public.premium_transactions.gateway_reference IS 'ID referensi dari payment gateway (PayPal order ID, Duitku merchantCode, dll)';
