-- Insert test users
INSERT INTO "USERS" ("USERS_ID", "NAME", "SURNAME", "EMAIL", "NICKNAME", "PASSWORD", "JOIN_DATE")
VALUES
  ('user-1', 'John', 'Doe', 'john.doe@example.com', 'johnd', 'password123', '2023-01-01'),
  ('user-2', 'Jane', 'Smith', 'jane.smith@example.com', 'janes', 'password456', '2023-01-02');

-- Insert categories
INSERT INTO "CATEGORIES" ("CATEGORIES_ID", "NAME")
VALUES
  ('cat-1', 'Technology'),
  ('cat-2', 'Finance'),
  ('cat-3', 'Healthcare');

-- Insert stocks (using real companies)
INSERT INTO "STOCKS" ("ISIN", "CATEGORIES_ID", "NAME", "WKN", "SYMBOL")
VALUES
  ('US0378331005', 'cat-1', 'Apple Inc.', '865985', 'AAPL'),
  ('US5949181045', 'cat-1', 'Microsoft Corporation', '870747', 'MSFT'),
  ('US0846707026', 'cat-2', 'Berkshire Hathaway Inc.', '854075', 'BRK.A'),
  ('US46625H1005', 'cat-2', 'JPMorgan Chase & Co.', '850628', 'JPM'),
  ('US58933Y1055', 'cat-3', 'Merck & Co.', '851830', 'MRK');

-- Insert quotes
INSERT INTO "QUOTES" ("QUOTES_ID", "ISIN", "PRICE", "CURRENCY", "MARKET_TIME", "EXCHANGE")
VALUES
  ('quote-1', 'US0378331005', 175.50, 'USD', '2023-10-20 10:00:00', 'NASDAQ'),
  ('quote-2', 'US5949181045', 330.25, 'USD', '2023-10-20 10:00:00', 'NASDAQ'),
  ('quote-3', 'US0846707026', 549999.00, 'USD', '2023-10-20 10:00:00', 'NYSE'),
  ('quote-4', 'US46625H1005', 145.75, 'USD', '2023-10-20 10:00:00', 'NYSE'),
  ('quote-5', 'US58933Y1055', 105.25, 'USD', '2023-10-20 10:00:00', 'NYSE');

-- Insert portfolios
INSERT INTO "PORTFOLIOS" ("PORTFOLIOS_ID", "NAME", "CREATED_AT", "USERS_ID")
VALUES
  ('portfolio-1', 'Tech Growth', '2023-01-15', 'user-1'),
  ('portfolio-2', 'Value Investing', '2023-02-01', 'user-1'),
  ('portfolio-3', 'Healthcare Focus', '2023-01-20', 'user-2');

-- Insert holdings
INSERT INTO "HOLDINGS" ("HOLDINGS_ID", "PORTFOLIOS_ID", "ISIN", "QUANTITY", "START_DATE", "END_DATE")
VALUES
  ('holding-1', 'portfolio-1', 'US0378331005', 100, '2023-01-16', NULL),
  ('holding-2', 'portfolio-1', 'US5949181045', 50, '2023-01-17', NULL),
  ('holding-3', 'portfolio-2', 'US0846707026', 1, '2023-02-02', NULL),
  ('holding-4', 'portfolio-2', 'US46625H1005', 200, '2023-02-03', NULL),
  ('holding-5', 'portfolio-3', 'US58933Y1055', 150, '2023-01-21', NULL);

-- Insert transactions
INSERT INTO "TRANSACTIONS" ("TRANSACTIONS_ID", "HOLDINGS_ID", "BUY", "TRANSACTION_TIME", "AMOUNT", "PRICE", "COMMISSION", "BROKER")
VALUES
  ('trans-1', 'holding-1', true, '2023-01-16 09:30:00', 100, 150.25, 5.99, 'Robinhood'),
  ('trans-2', 'holding-2', true, '2023-01-17 10:15:00', 50, 310.75, 5.99, 'Robinhood'),
  ('trans-3', 'holding-3', true, '2023-02-02 11:00:00', 1, 525000.00, 29.99, 'Fidelity'),
  ('trans-4', 'holding-4', true, '2023-02-03 14:30:00', 200, 140.50, 9.99, 'Fidelity'),
  ('trans-5', 'holding-5', true, '2023-01-21 15:45:00', 150, 98.75, 7.99, 'E*TRADE');
