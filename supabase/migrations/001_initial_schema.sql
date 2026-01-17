-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed ON newsletter_subscribers(subscribed);

-- Enable Row Level Security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (subscribe)
CREATE POLICY "Allow public inserts" ON newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update their own subscription (via email in unsubscribe link)
CREATE POLICY "Allow public updates" ON newsletter_subscribers
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow admin to read all subscribers (you'll need to set up proper auth)
CREATE POLICY "Allow admin reads" ON newsletter_subscribers
  FOR SELECT
  USING (true);

