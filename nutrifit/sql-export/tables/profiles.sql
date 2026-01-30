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

