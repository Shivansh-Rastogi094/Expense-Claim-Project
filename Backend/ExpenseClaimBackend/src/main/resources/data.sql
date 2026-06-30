-- Seed initial budgets for June 2026
INSERT INTO department_budgets (department, month, year, budget_amount) VALUES
('ENGINEERING', 6, 2026, 50000.00),
('MARKETING', 6, 2026, 20000.00),
('FINANCE', 6, 2026, 30000.00),
('HR', 6, 2026, 15000.00),
('SALES', 6, 2026, 40000.00)
ON DUPLICATE KEY UPDATE budget_amount = VALUES(budget_amount);
