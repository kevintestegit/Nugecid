"""
Script para testar LOGIN no SEIRN com navegador VISÍVEL

Preencha suas credenciais e execute para ver o login automático
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import time

# ====================================================================
# CONFIGURAR SUAS CREDENCIAIS AQUI
# ====================================================================
SEIRN_URL = "https://seirn.itep.rn.gov.br"
USERNAME = "seu_usuario"  # PREENCHER
PASSWORD = "sua_senha"    # PREENCHER

# ====================================================================
# SELETORES - ATUALIZE APÓS INSPECIONAR A PÁGINA
# ====================================================================
# Você precisa atualizar esses seletores conforme o SEIRN real
SELETORES = {
    # Exemplo de possíveis seletores (ATUALIZAR!)
    'username_field': ('ID', 'username'),      # ou ('NAME', 'usuario')
    'password_field': ('ID', 'password'),      # ou ('NAME', 'senha')
    'login_button': ('ID', 'btnLogin'),        # ou ('CLASS_NAME', 'btn-login')
}

# ====================================================================
# FUNÇÕES
# ====================================================================

def criar_driver():
    """Cria driver Chrome VISÍVEL"""
    options = Options()
    options.add_argument("--start-maximized")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=options)


def fazer_login_manual(driver):
    """Permite fazer login MANUALMENTE para ver os seletores"""
    print("="*60)
    print("LOGIN MANUAL")
    print("="*60)
    print("\n1. Uma janela do Chrome vai abrir")
    print("2. Faça login MANUALMENTE")
    print("3. ENQUANTO faz login, pressione F12 e inspecione:")
    print("   - Campo de usuário")
    print("   - Campo de senha")
    print("   - Botão de entrar")
    print("4. ANOTE os IDs, NAMEs ou CLASSes de cada elemento")
    
    driver.get(SEIRN_URL)
    
    input("\n⏸️  Após fazer login, pressione ENTER...")
    print(f"✅ Login OK! URL atual: {driver.current_url}")


def fazer_login_automatico(driver):
    """Tenta fazer login AUTOMATICAMENTE (após configurar seletores)"""
    print("="*60)
    print("LOGIN AUTOMÁTICO")
    print("="*60)
    
    driver.get(SEIRN_URL)
    time.sleep(2)
    
    try:
        print("\n🔍 Procurando campo de usuário...")
        tipo, valor = SELETORES['username_field']
        
        if tipo == 'ID':
            username_input = driver.find_element(By.ID, valor)
        elif tipo == 'NAME':
            username_input = driver.find_element(By.NAME, valor)
        elif tipo == 'CLASS_NAME':
            username_input = driver.find_element(By.CLASS_NAME, valor)
        
        username_input.clear()
        username_input.send_keys(USERNAME)
        print(f"✅ Usuário preenchido: {USERNAME}")
        
        print("\n🔍 Procurando campo de senha...")
        tipo, valor = SELETORES['password_field']
        
        if tipo == 'ID':
            password_input = driver.find_element(By.ID, valor)
        elif tipo == 'NAME':
            password_input = driver.find_element(By.NAME, valor)
        elif tipo == 'CLASS_NAME':
            password_input = driver.find_element(By.CLASS_NAME, valor)
        
        password_input.clear()
        password_input.send_keys(PASSWORD)
        print("✅ Senha preenchida")
        
        print("\n🔍 Procurando botão de login...")
        tipo, valor = SELETORES['login_button']
        
        if tipo == 'ID':
            login_button = driver.find_element(By.ID, valor)
        elif tipo == 'NAME':
            login_button = driver.find_element(By.NAME, valor)
        elif tipo == 'CLASS_NAME':
            login_button = driver.find_element(By.CLASS_NAME, valor)
        
        login_button.click()
        print("✅ Clicou no botão de login")
        
        time.sleep(3)
        print(f"\n✅ Login automático concluído!")
        print(f"   URL atual: {driver.current_url}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Erro no login automático: {e}")
        print("\n💡 SOLUÇÃO:")
        print("   1. Execute o script em modo MANUAL primeiro")
        print("   2. Anote os seletores corretos")
        print("   3. Atualize o dicionário SELETORES neste arquivo")
        return False


def main():
    """Função principal"""
    print("="*60)
    print("🔐 TESTADOR DE LOGIN SEIRN")
    print("="*60)
    
    print("\nEscolha o modo:")
    print("1 - LOGIN MANUAL (para descobrir seletores)")
    print("2 - LOGIN AUTOMÁTICO (após configurar seletores)")
    
    escolha = input("\nOpção (1 ou 2): ")
    
    driver = criar_driver()
    
    try:
        if escolha == "1":
            fazer_login_manual(driver)
        else:
            if USERNAME == "seu_usuario":
                print("\n⚠️  ATENÇÃO: Configure suas credenciais primeiro!")
                print("   Edite este arquivo e preencha USERNAME e PASSWORD")
                return
            
            sucesso = fazer_login_automatico(driver)
            
            if sucesso:
                print("\n✅ SUCESSO! Login automático funcionou!")
                print("📝 Agora você pode usar esses seletores no seirn_service.py")
            else:
                print("\n❌ Falhou. Tente o modo MANUAL (opção 1) primeiro")
        
        input("\n⏸️  Pressione ENTER para fechar...")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
    
    finally:
        driver.quit()
        print("\n👋 Concluído!")


if __name__ == "__main__":
    main()
