-- ============================================
-- Tabela: workout_sessions
-- Registros: 3
-- ============================================

-- Desabilitar triggers temporariamente
ALTER TABLE workout_sessions DISABLE TRIGGER ALL;

INSERT INTO workout_sessions (id, user_id, performed_on, created_at) VALUES (1, 'd2e0f772-b9b6-4057-b6b9-007c838e267c', '2026-01-14', '2026-01-14T23:15:54.347726+00:00');
INSERT INTO workout_sessions (id, user_id, performed_on, created_at) VALUES (5, '13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', '2026-01-20', '2026-01-20T13:33:30.301629+00:00');
INSERT INTO workout_sessions (id, user_id, performed_on, created_at) VALUES (6, '13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', '2026-01-29', '2026-01-29T22:03:22.670216+00:00');

-- Reabilitar triggers
ALTER TABLE workout_sessions ENABLE TRIGGER ALL;

