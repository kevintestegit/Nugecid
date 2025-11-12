const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando reorganização de páginas...\n');

const basePath = path.join(__dirname, 'src', 'pages');

// Criar estrutura de diretórios
const directories = [
  'auth',
  'dashboard',
  'arquivo',
  'custodia',
  'relatorios',
  'configuracoes'
];

console.log('📁 Criando estrutura de diretórios...');
directories.forEach(dir => {
  const dirPath = path.join(basePath, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  ✓ Criado: ${dir}`);
  } else {
    console.log(`  • Já existe: ${dir}`);
  }
});

console.log('\n📦 Movendo arquivos...');

// Mapeamento de arquivos para mover
const filesToMove = {
  'LoginPage.tsx': 'auth/',
  'DashboardPage.tsx': 'dashboard/',
  'ArquivoPage.tsx': 'arquivo/',
  'PrateleiraDetailPage.tsx': 'arquivo/',
  'DesarquivamentosPage.tsx': 'desarquivamentos/',
  'DetalhesDesarquivamentoPage.tsx': 'desarquivamentos/',
  'EditDesarquivamentoPage.tsx': 'desarquivamentos/',
  'NovoDesarquivamentoPage.tsx': 'desarquivamentos/',
  'LixeiraPage.tsx': 'desarquivamentos/',
  'TarefasPage.tsx': 'tarefas/',
  'KanbanPage.tsx': 'tarefas/',
  'ProjetosPage.tsx': 'tarefas/',
  'CustodiaVestigiosPage.tsx': 'custodia/',
  'RelatoriosPage.tsx': 'relatorios/',
  'ConfiguracoesPage.tsx': 'configuracoes/'
};

Object.entries(filesToMove).forEach(([file, dest]) => {
  const source = path.join(basePath, file);
  const destination = path.join(basePath, dest, file);
  
  if (fs.existsSync(source)) {
    fs.renameSync(source, destination);
    console.log(`  ✓ Movido: ${file} → ${dest}`);
  } else {
    console.log(`  ⚠ Não encontrado: ${file}`);
  }
});

console.log('\n📝 Criando arquivos index.ts...');

// Criar index files
const indexFiles = {
  'auth/index.ts': "export { default as LoginPage } from './LoginPage'\n",
  'dashboard/index.ts': "export { default as DashboardPage } from './DashboardPage'\n",
  'arquivo/index.ts': `export { default as ArquivoPage } from './ArquivoPage'
export { default as PrateleiraDetailPage } from './PrateleiraDetailPage'
`,
  'desarquivamentos/index.ts': `export { default as DesarquivamentosPage } from './DesarquivamentosPage'
export { default as DetalhesDesarquivamentoPage } from './DetalhesDesarquivamentoPage'
export { default as EditDesarquivamentoPage } from './EditDesarquivamentoPage'
export { default as NovoDesarquivamentoPage } from './NovoDesarquivamentoPage'
export { default as LixeiraPage } from './LixeiraPage'
`,
  'tarefas/index.ts': `export { default as TarefasPage } from './TarefasPage'
export { default as KanbanPage } from './KanbanPage'
export { default as ProjetosPage } from './ProjetosPage'
`,
  'custodia/index.ts': "export { default as CustodiaVestigiosPage } from './CustodiaVestigiosPage'\n",
  'relatorios/index.ts': "export { default as RelatoriosPage } from './RelatoriosPage'\n",
  'configuracoes/index.ts': "export { default as ConfiguracoesPage } from './ConfiguracoesPage'\n"
};

Object.entries(indexFiles).forEach(([file, content]) => {
  const filePath = path.join(basePath, file);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Criado: ${file}`);
});

console.log('\n🔄 Atualizando imports...');

// Atualizar imports em todos os arquivos
const replacements = {
  "from '@/pages/LoginPage'": "from '@/pages/auth/LoginPage'",
  "from '@/pages/DashboardPage'": "from '@/pages/dashboard/DashboardPage'",
  "from '@/pages/DesarquivamentosPage'": "from '@/pages/desarquivamentos/DesarquivamentosPage'",
  "from '@/pages/DetalhesDesarquivamentoPage'": "from '@/pages/desarquivamentos/DetalhesDesarquivamentoPage'",
  "from '@/pages/EditDesarquivamentoPage'": "from '@/pages/desarquivamentos/EditDesarquivamentoPage'",
  "from '@/pages/NovoDesarquivamentoPage'": "from '@/pages/desarquivamentos/NovoDesarquivamentoPage'",
  "from '@/pages/LixeiraPage'": "from '@/pages/desarquivamentos/LixeiraPage'",
  "from '@/pages/ArquivoPage'": "from '@/pages/arquivo/ArquivoPage'",
  "from '@/pages/PrateleiraDetailPage'": "from '@/pages/arquivo/PrateleiraDetailPage'",
  "from '@/pages/TarefasPage'": "from '@/pages/tarefas/TarefasPage'",
  "from '@/pages/KanbanPage'": "from '@/pages/tarefas/KanbanPage'",
  "from '@/pages/ProjetosPage'": "from '@/pages/tarefas/ProjetosPage'",
  "from '@/pages/CustodiaVestigiosPage'": "from '@/pages/custodia/CustodiaVestigiosPage'",
  "from '@/pages/RelatoriosPage'": "from '@/pages/relatorios/RelatoriosPage'",
  "from '@/pages/ConfiguracoesPage'": "from '@/pages/configuracoes/ConfiguracoesPage'"
};

function updateImportsInDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory() && file.name !== 'node_modules') {
      updateImportsInDirectory(filePath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      Object.entries(replacements).forEach(([old, newPath]) => {
        if (content.includes(old)) {
          content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newPath);
          changed = true;
        }
      });
      
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✓ Atualizado: ${file.name}`);
      }
    }
  });
}

const srcPath = path.join(__dirname, 'src');
updateImportsInDirectory(srcPath);

console.log('\n✨ Reorganização concluída com sucesso!\n');
console.log('📋 PRÓXIMOS PASSOS:');
console.log('1️⃣  Iniciar o servidor: npm run dev');
console.log('2️⃣  Testar todas as rotas');
console.log('3️⃣  Verificar o console do navegador\n');
