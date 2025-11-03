-- 02_views.sql
USE lab_emprestimos;

DROP VIEW IF EXISTS vw_emprestimos_ativos;
CREATE VIEW vw_emprestimos_ativos AS
/* NOTEBOKS ATIVOS */
SELECT
  ea.req_id,
  'notebooks' AS recurso,
  ei.codigo,
  n.patrimonio,
  ea.created_at AS retirada_at,
  ea.nome,
  ea.categoria,
  ea.turma,
  ea.disciplina,
  ea.atividade,
  ea.cargo_setor,
  ea.email,
  ea.obs
FROM emprestimos_ativos ea
JOIN emprestimo_itens ei ON ei.emprestimo_id = ea.id AND ei.recurso='notebooks'
JOIN notebook n ON n.codigo = ei.codigo AND n.status='ocupado'

UNION ALL
/* CELULARES ATIVOS */
SELECT
  ea.req_id,
  'celulares' AS recurso,
  ei.codigo,
  c.patrimonio,
  ea.created_at AS retirada_at,
  ea.nome,
  ea.categoria,
  ea.turma,
  ea.disciplina,
  ea.atividade,
  ea.cargo_setor,
  ea.email,
  ea.obs
FROM emprestimos_ativos ea
JOIN emprestimo_itens ei ON ei.emprestimo_id = ea.id AND ei.recurso='celulares'
JOIN celular c ON c.codigo = ei.codigo AND c.status='ocupado'

UNION ALL
/* CÂMERAS ATIVAS */
SELECT
  ea.req_id,
  'cameras' AS recurso,
  ei.codigo,
  ca.patrimonio,
  ea.created_at AS retirada_at,
  ea.nome,
  ea.categoria,
  ea.turma,
  ea.disciplina,
  ea.atividade,
  ea.cargo_setor,
  ea.email,
  ea.obs
FROM emprestimos_ativos ea
JOIN emprestimo_itens ei ON ei.emprestimo_id = ea.id AND ei.recurso='cameras'
JOIN camera ca ON ca.codigo = ei.codigo AND ca.status='ocupado';
