/**
 * Script de Migração Completa: PostgreSQL Docker → Neon
 * Executa SQL via HTTP (porta 443) para contornar firewall
 */

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_wVleKGovz4p8@ep-hidden-credit-a443ybb6-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

const DUMP_FILE = path.join(__dirname, '../backups/neon_full_dump.sql');

async function executeSqlStatements() {
    console.log('🚀 Iniciando migração para Neon via HTTP (porta 443)\n');

    // Testa conexão
    console.log('1️⃣  Testando conexão...');
    try {
        const r = await sql`SELECT version()`;
        console.log('   ✅ Conectado:', r[0].version.split(' ').slice(0, 2).join(' '));
    } catch (e) {
        console.error('   ❌ Falha na conexão:', e.message);
        process.exit(1);
    }

    // Lê o dump SQL
    console.log('\n2️⃣  Lendo arquivo de dump...');
    const dumpContent = fs.readFileSync(DUMP_FILE, 'utf8');
    console.log(`   📄 ${dumpContent.length} bytes lidos`);

    // Divide em statements (simplificado - separa por ; no final de linha)
    console.log('\n3️⃣  Processando statements SQL...');

    // Remove comentários e linhas vazias, agrupa em statements
    const lines = dumpContent.split('\n');
    const cleanLines = [];
    let inComment = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Pula linhas vazias e comentários
        if (!trimmed || trimmed.startsWith('--')) continue;

        // Pula psql metacommands
        if (trimmed.startsWith('\\')) continue;

        // Pula SELECTs do set_config e outras configs
        if (trimmed.startsWith('SELECT pg_catalog.set_config')) continue;

        cleanLines.push(line);
    }

    // Junta e divide por ;
    const fullSql = cleanLines.join('\n');
    const statements = [];
    let current = '';
    let inString = false;
    let inDollarQuote = false;
    let dollarTag = '';

    for (let i = 0; i < fullSql.length; i++) {
        const char = fullSql[i];
        const next = fullSql[i + 1] || '';

        // Detecta início/fim de string com aspas simples
        if (char === "'" && !inDollarQuote) {
            inString = !inString;
        }

        // Detecta início de dollar quote
        if (char === '$' && !inString && !inDollarQuote) {
            let tag = '$';
            let j = i + 1;
            while (j < fullSql.length && fullSql[j] !== '$') {
                tag += fullSql[j];
                j++;
            }
            if (j < fullSql.length) {
                tag += '$';
                dollarTag = tag;
                inDollarQuote = true;
            }
        } else if (inDollarQuote && fullSql.substring(i, i + dollarTag.length) === dollarTag) {
            inDollarQuote = false;
            current += dollarTag;
            i += dollarTag.length - 1;
            continue;
        }

        current += char;

        // Final de statement
        if (char === ';' && !inString && !inDollarQuote) {
            const stmt = current.trim();
            if (stmt && stmt !== ';') {
                statements.push(stmt);
            }
            current = '';
        }
    }

    console.log(`   📊 ${statements.length} statements SQL encontrados`);

    // Executa cada statement
    console.log('\n4️⃣  Executando statements...');

    let success = 0;
    let errors = 0;
    const errorDetails = [];

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];

        // Pula statements problemáticos
        if (stmt.includes('pg_catalog.') && !stmt.includes('CREATE EXTENSION')) continue;
        if (stmt.includes('COMMENT ON EXTENSION')) continue;
        if (stmt.startsWith('SET ')) continue;

        try {
            await sql.unsafe(stmt);
            success++;

            // Progress
            if (success % 50 === 0 || i === statements.length - 1) {
                process.stdout.write(`\r   Executados: ${success} | Erros: ${errors} | Total: ${i + 1}/${statements.length}`);
            }
        } catch (e) {
            errors++;
            if (errors <= 10) {
                errorDetails.push({
                    statement: stmt.substring(0, 100) + '...',
                    error: e.message
                });
            }
        }
    }

    console.log(`\n\n✅ Migração concluída!`);
    console.log(`   Sucesso: ${success} statements`);
    console.log(`   Erros: ${errors} statements`);

    if (errorDetails.length > 0) {
        console.log('\n⚠️  Primeiros erros:');
        errorDetails.slice(0, 5).forEach((e, i) => {
            console.log(`   ${i + 1}. ${e.error}`);
        });
    }

    // Verifica tabelas criadas
    console.log('\n5️⃣  Verificando tabelas no Neon...');
    try {
        const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
        console.log(`   ✅ ${tables.length} tabelas encontradas:`);
        tables.forEach(t => console.log(`      - ${t.tablename}`));
    } catch (e) {
        console.error('   ❌ Erro ao listar tabelas:', e.message);
    }

    // Verifica contagem de registros importantes
    console.log('\n6️⃣  Verificando dados migrados...');
    const tablesToCheck = ['usuarios', 'roles', 'desarquivamentos', 'auditorias', 'notificacoes'];
    for (const table of tablesToCheck) {
        try {
            const count = await sql`SELECT COUNT(*) as total FROM ${sql.identifier([table])}`;
            console.log(`   ${table}: ${count[0].total} registros`);
        } catch (e) {
            console.log(`   ${table}: não encontrada ou erro`);
        }
    }
}

executeSqlStatements().catch(console.error);
