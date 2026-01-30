-- ============================================
-- NutriFit+ - Exportação Completa de Dados
-- Gerado em: 2026-01-30T15:36:04.660Z
-- ============================================

-- IMPORTANTE:
-- 1. Execute o schema primeiro (supabase/ALL_IN_ONE.sql)
-- 2. Depois execute este arquivo para importar os dados
-- 3. A ordem das tabelas importa (respeite foreign keys)


-- ============================================
-- Tabela: profiles
-- Registros: 2
-- ============================================

-- Desabilitar triggers temporariamente
ALTER TABLE profiles DISABLE TRIGGER ALL;

INSERT INTO profiles (id, nome, email, tipo_plano, nome_assistente, contagem_streak, criado_em, atualizado_em, plano_pausado, plano_expira_em, plano_iniciado_em, foto_url, bio, peso, altura, objetivo, proximo_vencimento, metodo_pagamento_principal_id, status_cobranca) VALUES ('d2e0f772-b9b6-4057-b6b9-007c838e267c', 'Lucas Nunes', 'testemobile@teste.com', 'plus', 'Athena', 0, '2026-01-14T23:00:48.711165+00:00', '2026-01-16T18:23:18.331967+00:00', FALSE, '2026-10-30T20:00:00+00:00', '2026-01-14T23:00:46.994+00:00', 'https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/sign/food/d2e0f772-b9b6-4057-b6b9-007c838e267c/profile-1768587790594-IMG_6990.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMmViNDQwYi01MzAxLTQ3NWEtYmY2Yi1hOTM2YjA3MzFiMDkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb29kL2QyZTBmNzcyLWI5YjYtNDA1Ny1iNmI5LTAwN2M4MzhlMjY3Yy9wcm9maWxlLTE3Njg1ODc3OTA1OTQtSU1HXzY5OTAuanBlZyIsImlhdCI6MTc2ODU4Nzc5MSwiZXhwIjoxODAwMTIzNzkxfQ.BziLz56qYVK28GPdYuEIX6mThKOEycu_Uw9G34lHur8', 'Começando minha jornada fitness! 💪', 75, 180, 'Ganho de massa', NULL, NULL, 'ativo');
INSERT INTO profiles (id, nome, email, tipo_plano, nome_assistente, contagem_streak, criado_em, atualizado_em, plano_pausado, plano_expira_em, plano_iniciado_em, foto_url, bio, peso, altura, objetivo, proximo_vencimento, metodo_pagamento_principal_id, status_cobranca) VALUES ('13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', 'Lucas', 'nutriadm@admin.com', 'plus', 'Athena', 0, '2026-01-13T02:52:45.291253+00:00', '2026-01-20T13:31:11.08637+00:00', FALSE, '2027-05-30T23:52:00+00:00', '2026-01-13T02:52:44.745+00:00', 'https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/sign/food/13ab0883-2dd0-45e0-8c1a-89b71a44a0c3/profile-1768520742674-Gemini_Generated_Image_a26qoka26qoka26q__1_.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8yMmViNDQwYi01MzAxLTQ3NWEtYmY2Yi1hOTM2YjA3MzFiMDkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb29kLzEzYWIwODgzLTJkZDAtNDVlMC04YzFhLTg5YjcxYTQ0YTBjMy9wcm9maWxlLTE3Njg1MjA3NDI2NzQtR2VtaW5pX0dlbmVyYXRlZF9JbWFnZV9hMjZxb2thMjZxb2thMjZxX18xXy5wbmciLCJpYXQiOjE3Njg1MjA3NDUsImV4cCI6MTgwMDA1Njc0NX0.6QZmJJ0nlHoqIkl4qgRcitsp_HfyJpRrIr4jsDfXfr0', 'Dono', 75, 180, 'Ganho de massa', NULL, NULL, 'ativo');

-- Reabilitar triggers
ALTER TABLE profiles ENABLE TRIGGER ALL;



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



-- ============================================
-- Tabela: diet_plans
-- Registros: 1
-- ============================================

-- Desabilitar triggers temporariamente
ALTER TABLE diet_plans DISABLE TRIGGER ALL;

INSERT INTO diet_plans (id, user_id, goal, calories_target, protein_g, carbs_g, fats_g, plan, groceries, created_at) VALUES (1, '13ab0883-2dd0-45e0-8c1a-89b71a44a0c3', 'bulking', 3000, 180, 420, 66, '{"meals":[{"items":["4 ovos inteiros mexidos","100g de aveia em flocos","1 banana grande picada","1 colher de sopa de mel"],"notes":"Foco em carboidratos complexos e proteínas de alto valor biológico para iniciar o dia.","title":"Café da Manhã - Despertar Anabólico"},{"items":["200g de peito de frango grelhado","250g de arroz branco ou integral","100g de feijão preto ou carioca","Brócolis e cenoura no vapor à vontade","1 colher de chá de azeite de oliva extra virgem"],"notes":"Refeição densa em nutrientes para sustentar o treino e a recuperação.","title":"Almoço - Combustível de Performance"},{"items":["150g de batata doce cozida","1 lata de atum em conserva (em água)","Café preto sem açúcar (opcional para foco)"],"notes":"Carboidratos de baixo índice glicêmico para energia sustentada durante a sessão de força.","title":"Pré-Treino - Energia Máxima"},{"items":["180g de patinho moído ou carne magra","300g de batata inglesa assada ou purê","Salada verde (alface, rúcula, espinafre) à vontade","1 fatia de abacaxi"],"notes":"O abacaxi contém bromelina, que auxilia na digestão das proteínas e recuperação muscular.","title":"Pós-Treino/Jantar - Recuperação de Elite"},{"items":["200g de iogurte grego natural","30g de pasta de amendoim integral","1 scoop de Whey Protein (opcional) ou 3 claras de ovos"],"notes":"Gorduras boas e proteínas de absorção lenta para evitar o catabolismo durante o sono.","title":"Ceia - Proteção Noturna"}],"notes":"Como os dados biométricos não foram informados, assumimos um perfil padrão de 75kg com nível de atividade moderada para calcular um superávit calórico seguro. Esta dieta foca em 2.4g/kg de proteína para maximizar a síntese proteica. Ajuste as porções se sentir fome excessiva ou ganho de gordura acelerado. Mantenha a hidratação em no mínimo 3.5 litros de água por dia. Sem desculpas, Lucas. Treine pesado ou continue o mesmo."}'::jsonb, '["Ovos (pelo menos 3 dúzias)","Peito de frango","Carne moída magra (Patinho)","Atum em lata (em água)","Aveia em flocos","Arroz (branco ou integral)","Feijão","Batata doce","Batata inglesa","Bananas","Abacaxi","Brócolis e Cenoura","Folhas verdes","Iogurte grego natural","Pasta de amendoim","Azeite de oliva extra virgem","Mel"]'::jsonb, '2026-01-30T15:10:17.6759+00:00');

-- Reabilitar triggers
ALTER TABLE diet_plans ENABLE TRIGGER ALL;


