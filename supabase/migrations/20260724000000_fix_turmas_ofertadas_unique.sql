-- Fix turmas_ofertadas unique constraint to isolate by course
ALTER TABLE turmas_ofertadas DROP CONSTRAINT IF EXISTS turmas_ofertadas_turma_sigaa_id_key;
ALTER TABLE turmas_ofertadas ADD CONSTRAINT turmas_ofertadas_turma_sigaa_id_curso_id_key UNIQUE (curso_id, turma_sigaa_id);
