#!/bin/bash

# Script CLI para gerenciamento de backups do SGC-ITEP
# Uso: ./scripts/backup-cli.sh [comando]

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
API_URL="${API_URL:-http://localhost:3000}"
BACKUP_DIR="./backups"

# Funções
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   SGC-ITEP - Sistema de Backup       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo
}

print_usage() {
    echo -e "${YELLOW}Uso:${NC} ./scripts/backup-cli.sh [comando]"
    echo
    echo -e "${YELLOW}Comandos disponíveis:${NC}"
    echo "  full              - Criar backup completo do banco de dados"
    echo "  desarq            - Criar backup da tabela de desarquivamentos"
    echo "  list              - Listar todos os backups disponíveis"
    echo "  restore <arquivo> - Restaurar backup específico"
    echo "  clean             - Remover backups antigos (>30 dias)"
    echo "  size              - Mostrar tamanho total dos backups"
    echo "  help              - Exibir esta ajuda"
    echo
    echo -e "${YELLOW}Exemplos:${NC}"
    echo "  ./scripts/backup-cli.sh full"
    echo "  ./scripts/backup-cli.sh list"
    echo "  ./scripts/backup-cli.sh restore backup_full_2025-11-04-020000.sql"
    echo
}

check_token() {
    if [ -z "$SGC_TOKEN" ]; then
        echo -e "${RED}❌ Erro: Token de autenticação não encontrado${NC}"
        echo -e "${YELLOW}💡 Dica: Export o token antes de usar:${NC}"
        echo "   export SGC_TOKEN='seu_token_aqui'"
        exit 1
    fi
}

create_full_backup() {
    echo -e "${YELLOW}🔄 Criando backup completo...${NC}"
    
    response=$(curl -s -X POST "${API_URL}/backup/full" \
        -H "Authorization: Bearer ${SGC_TOKEN}" \
        -H "Content-Type: application/json")
    
    success=$(echo $response | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$success" == "true" ]; then
        filename=$(echo $response | grep -o '"filename":"[^"]*' | cut -d'"' -f4)
        size=$(echo $response | grep -o '"size":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Backup criado com sucesso!${NC}"
        echo -e "${GREEN}📁 Arquivo: ${filename}${NC}"
        echo -e "${GREEN}📊 Tamanho: ${size}${NC}"
    else
        error=$(echo $response | grep -o '"error":"[^"]*' | cut -d'"' -f4)
        echo -e "${RED}❌ Erro ao criar backup: ${error}${NC}"
        exit 1
    fi
}

create_desarq_backup() {
    echo -e "${YELLOW}🔄 Criando backup de desarquivamentos...${NC}"
    
    response=$(curl -s -X POST "${API_URL}/backup/desarquivamentos" \
        -H "Authorization: Bearer ${SGC_TOKEN}" \
        -H "Content-Type: application/json")
    
    success=$(echo $response | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$success" == "true" ]; then
        filename=$(echo $response | grep -o '"filename":"[^"]*' | cut -d'"' -f4)
        size=$(echo $response | grep -o '"size":"[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Backup de desarquivamentos criado!${NC}"
        echo -e "${GREEN}📁 Arquivo: ${filename}${NC}"
        echo -e "${GREEN}📊 Tamanho: ${size}${NC}"
    else
        error=$(echo $response | grep -o '"error":"[^"]*' | cut -d'"' -f4)
        echo -e "${RED}❌ Erro ao criar backup: ${error}${NC}"
        exit 1
    fi
}

list_backups() {
    echo -e "${YELLOW}📋 Listando backups disponíveis...${NC}"
    echo
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}❌ Diretório de backups não encontrado${NC}"
        exit 1
    fi
    
    backups=$(find "$BACKUP_DIR" -name "backup_*.sql" -type f | sort -r)
    
    if [ -z "$backups" ]; then
        echo -e "${YELLOW}⚠️  Nenhum backup encontrado${NC}"
        exit 0
    fi
    
    total=0
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
    printf "${BLUE}║${NC} %-40s ${BLUE}║${NC} %-10s ${BLUE}║${NC}\n" "Arquivo" "Tamanho"
    echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
    
    while IFS= read -r file; do
        filename=$(basename "$file")
        size=$(ls -lh "$file" | awk '{print $5}')
        size_bytes=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
        total=$((total + size_bytes))
        
        if [[ "$filename" == *"desarquivamentos"* ]]; then
            printf "${BLUE}║${NC} ${GREEN}%-40s${NC} ${BLUE}║${NC} %-10s ${BLUE}║${NC}\n" "$filename" "$size"
        else
            printf "${BLUE}║${NC} %-40s ${BLUE}║${NC} %-10s ${BLUE}║${NC}\n" "$filename" "$size"
        fi
    done <<< "$backups"
    
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
    
    total_mb=$(echo "scale=2; $total / 1024 / 1024" | bc)
    echo
    echo -e "${YELLOW}📊 Total: ${total_mb} MB${NC}"
}

restore_backup() {
    local filename=$1
    
    if [ -z "$filename" ]; then
        echo -e "${RED}❌ Erro: Nome do arquivo não fornecido${NC}"
        echo -e "${YELLOW}💡 Uso: ./scripts/backup-cli.sh restore <arquivo>${NC}"
        exit 1
    fi
    
    echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados atuais!${NC}"
    echo -e "${YELLOW}Deseja continuar? (sim/não): ${NC}"
    read -r confirm
    
    if [ "$confirm" != "sim" ]; then
        echo -e "${YELLOW}Operação cancelada${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}🔄 Restaurando backup: ${filename}...${NC}"
    
    response=$(curl -s -X POST "${API_URL}/backup/restore/${filename}" \
        -H "Authorization: Bearer ${SGC_TOKEN}" \
        -H "Content-Type: application/json")
    
    success=$(echo $response | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$success" == "true" ]; then
        echo -e "${GREEN}✅ Backup restaurado com sucesso!${NC}"
    else
        error=$(echo $response | grep -o '"error":"[^"]*' | cut -d'"' -f4)
        echo -e "${RED}❌ Erro ao restaurar backup: ${error}${NC}"
        exit 1
    fi
}

clean_old_backups() {
    echo -e "${YELLOW}🧹 Removendo backups antigos (>30 dias)...${NC}"
    
    response=$(curl -s -X POST "${API_URL}/backup/clean" \
        -H "Authorization: Bearer ${SGC_TOKEN}" \
        -H "Content-Type: application/json")
    
    success=$(echo $response | grep -o '"success":[^,]*' | cut -d':' -f2)
    
    if [ "$success" == "true" ]; then
        deleted=$(echo $response | grep -o '"deletedCount":[0-9]*' | cut -d':' -f2)
        echo -e "${GREEN}✅ Limpeza concluída!${NC}"
        echo -e "${GREEN}🗑️  ${deleted} arquivo(s) removido(s)${NC}"
    else
        echo -e "${RED}❌ Erro ao limpar backups${NC}"
        exit 1
    fi
}

show_total_size() {
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}❌ Diretório de backups não encontrado${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📊 Calculando tamanho total dos backups...${NC}"
    
    total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | awk '{print $1}')
    file_count=$(find "$BACKUP_DIR" -name "backup_*.sql" -type f | wc -l | tr -d ' ')
    
    echo -e "${GREEN}📁 Diretório: ${BACKUP_DIR}${NC}"
    echo -e "${GREEN}📊 Tamanho total: ${total_size}${NC}"
    echo -e "${GREEN}📈 Total de arquivos: ${file_count}${NC}"
}

# Main
print_header

case "${1:-help}" in
    full)
        check_token
        create_full_backup
        ;;
    desarq)
        check_token
        create_desarq_backup
        ;;
    list)
        list_backups
        ;;
    restore)
        check_token
        restore_backup "$2"
        ;;
    clean)
        check_token
        clean_old_backups
        ;;
    size)
        show_total_size
        ;;
    help|*)
        print_usage
        ;;
esac

echo
