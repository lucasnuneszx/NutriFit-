-- ============================================
-- Tabela: workout_plans
-- Registros: 2
-- ============================================

-- Desabilitar triggers temporariamente
ALTER TABLE workout_plans DISABLE TRIGGER ALL;

INSERT INTO workout_plans (id, user_id, title, created_at) VALUES (1, 'd2e0f772-b9b6-4057-b6b9-007c838e267c', 'Meu treino', '2026-01-14T23:15:54.578184+00:00');
INSERT INTO workout_plans (id, user_id, title, created_at) VALUES (2, '13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', 'Meu treino', '2026-01-29T22:03:22.973088+00:00');

-- Reabilitar triggers
ALTER TABLE workout_plans ENABLE TRIGGER ALL;

