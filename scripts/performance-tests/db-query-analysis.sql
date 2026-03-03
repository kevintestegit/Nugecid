-- =====================================================
-- ANÁLISE DE QUERIES DO BANCO DE DADOS
-- Execute no PostgreSQL para identificar queries lentas
-- =====================================================

-- 1. Queries mais lentas (última hora)
SELECT 
    query,
    calls,
    round(total_exec_time::numeric, 2) AS total_time_ms,
    round(mean_exec_time::numeric, 2) AS avg_time_ms,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS pct_time,
    rows
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_exec_time DESC
LIMIT 20;

-- 2. Queries mais frequentes
SELECT 
    query,
    calls,
    round(mean_exec_time::numeric, 2) AS avg_time_ms,
    round((calls / extract(epoch from (now() - stats_reset)))::numeric, 2) AS calls_per_sec
FROM pg_stat_statements
WHERE calls > 100
ORDER BY calls DESC
LIMIT 20;

-- 3. Análise de índices não utilizados
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- 4. Tabelas com mais scans sequenciais (sem índice)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
AND seq_scan > 100
ORDER BY seq_scan DESC
LIMIT 20;

-- 5. Análise de cache hit ratio
SELECT 
    sum(heap_blks_read) AS heap_read,
    sum(heap_blks_hit) AS heap_hit,
    round((sum(heap_blks_hit) - sum(heap_blks_read)) / sum(heap_blks_hit)::numeric, 4) AS ratio
FROM pg_statio_user_tables;

-- 6. Bloqueios ativos
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.relation = blocked_locks.relation
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- 7. Conexões ativas
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    count(*)
FROM pg_stat_activity
WHERE state IS NOT NULL
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY count(*) DESC;

-- 8. Tamanho das tabelas
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size,
    pg_total_relation_size(schemaname || '.' || tablename) AS bytes
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;

-- 9. Queries em execução (tempo real)
SELECT 
    pid,
    now() - query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY now() - query_start DESC;

-- 10. Recomendação de índices (baseado em queries)
SELECT 
    schemaname,
    tablename,
    attname AS column,
    n_tup_read + n_tup_fetch AS access_count
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('desarquivamentos', 'tarefas', 'usuarios', 'auditoria')
ORDER BY n_tup_read + n_tup_fetch DESC
LIMIT 50;
