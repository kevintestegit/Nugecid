# SQL Injection Review (Task 1/3)

## Executive Summary
- Focused on repository-level SQL sinks, especially dynamic sorting/filtering paths and raw queries. No raw `$queryRawUnsafe`/`execute` calls were found that take user input without parameters, but several sorting helpers still inject user-supplied tokens directly into SQL.

## Findings

### 1. Sort direction (`sortOrder`) comes from the client and is appended verbatim to every `ORDER BY` clause in `src/modules/tarefas/services/tarefas.service.ts` (lines 284-324)
- Severity: **High**
- Vulnerable pattern: `queryBuilder.orderBy(..., sortOrder as "ASC" | "DESC")` uses the raw string from `QueryTarefaDto` without any runtime guard. There is no `@IsIn`/whitelist validation and the service simply casts to the union type, leaving the SQL direction clause under attacker control.
- Exploit scenario: An attacker can request `/tarefas?sortOrder=ASC;DROP TABLE usuarios;--` (or any `sortOrder` containing `DESC, (SELECT secret)`) so that the generated SQL becomes `ORDER BY tarefa.titulo ASC;DROP TABLE usuarios;--`, forcing PostgreSQL to run the injected fragment.
- Remediation: Normalize `sortOrder` before it reaches the query builder (e.g., `const direction = queryDto.sortOrder === "ASC" ? "ASC" : "DESC"`). Prefer enumerated validators (`@IsIn(["ASC","DESC"])`) in the DTO/validation pipe and/or harden the service to ignore unexpected values.

### 2. `sortBy`/`sortOrder` from `FindAllOptions` are interpolated directly into the query builder inside `DesarquivamentoTypeOrmRepository.findAll` (lines 79-95)
- Severity: **High**
- Vulnerable pattern: `if (sortBy) queryBuilder.orderBy(`d.${sortBy}`, sortOrder || "ASC");` allows any client-provided column name and direction to be injected into the SQL string because the repository does not validate or map the values itself.
- Exploit scenario: Any code path that bypasses the current use case validation (e.g., a future consumer of this repository or a malicious internal API) can send `sortBy=id);DROP TABLE usuarios;--` and cause the generated SQL to include the injected clause. Even today, a developer might purposely fetch the repository with loose inputs, making the sink easy to misuse.
- Remediation: Guard the sink in the repository itself by mapping `sortBy` to a fixed set of column names (e.g., a lookup table or switch) and forcing `sortOrder` to `ASC`/`DESC`. Avoid interpolating the raw `sortBy` string; use `queryBuilder.orderBy("d.id")` for each supported column.

## Files Inspected
- `src/modules/tarefas/services/tarefas.service.ts`
- `src/modules/nugecid/infrastructure/repositories/desarquivamento.typeorm-repository.ts`
- `src/modules/nugecid/application/use-cases/find-all-desarquivamentos/find-all-desarquivamentos.use-case.ts` (for control flow context)

## Confidence
- **Medium**: castle depends on how the database driver treats multi-statement payloads, but allowing unsanitized ordering tokens is a textbook SQL injection pattern and should be hardened irrespective of the current execution path.
