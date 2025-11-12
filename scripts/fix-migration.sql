-- Marcar a migration AddAvatarUrlToUsuarios como executada (se a coluna já existe)
INSERT INTO migrations (timestamp, name) 
VALUES (1762105000000, 'AddAvatarUrlToUsuarios1762105000000')
ON CONFLICT DO NOTHING;

-- Verificar migrations pendentes
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;
