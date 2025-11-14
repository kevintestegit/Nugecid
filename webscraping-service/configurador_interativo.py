"""
Script para executar webscraping com navegador VISÍVEL
Use este script para:
1. Ver o que está acontecendo
2. Identificar seletores CSS
3. Testar credenciais de login
4. Debug manual
"""

import asyncio
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# CONFIGURAÇÕES
SEIRN_URL = "https://seirn.itep.rn.gov.br"  # ATUALIZAR COM URL REAL
HEADLESS = False  # False = MOSTRA O NAVEGADOR
WAIT_TIME = 30  # Tempo de espera em segundos

# CREDENCIAIS (PREENCHER)
USERNAME = "seu_usuario_aqui"
PASSWORD = "sua_senha_aqui"


def criar_driver_visivel():
    """Cria driver do Chrome VISÍVEL"""
    chrome_options = Options()
    
    # IMPORTANTE: Comentar headless para VER o navegador
    # chrome_options.add_argument("--headless=new")
    
    # Opções úteis
    chrome_options.add_argument("--start-maximized")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # Criar driver
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    return driver


def passo_1_navegar(driver):
    """Passo 1: Navegar para SEIRN"""
    print("\n" + "="*60)
    print("PASSO 1: Navegando para SEIRN...")
    print("="*60)
    
    driver.get(SEIRN_URL)
    time.sleep(3)
    
    print(f"✅ URL acessada: {driver.current_url}")
    print(f"✅ Título da página: {driver.title}")
    
    input("\n⏸️  Pressione ENTER para continuar...")


def passo_2_login_manual(driver):
    """Passo 2: Login manual (para você ver e anotar seletores)"""
    print("\n" + "="*60)
    print("PASSO 2: LOGIN MANUAL")
    print("="*60)
    print("\n📝 INSTRUÇÕES:")
    print("1. Faça login MANUALMENTE no navegador que abriu")
    print("2. Enquanto faz login, abra o DevTools (F12)")
    print("3. ANOTE os seguintes seletores:")
    print("   - Campo de usuário (ID, class, name)")
    print("   - Campo de senha (ID, class, name)")
    print("   - Botão de login (ID, class, name)")
    print("\n💡 Como encontrar seletores:")
    print("   - Clique com botão direito no elemento")
    print("   - Inspecionar elemento")
    print("   - Veja o ID ou class no HTML")
    
    input("\n⏸️  Depois de fazer login, pressione ENTER...")
    
    print("\n✅ Login concluído!")
    print(f"✅ URL atual: {driver.current_url}")


def passo_3_buscar_processo_manual(driver):
    """Passo 3: Buscar processo manualmente"""
    print("\n" + "="*60)
    print("PASSO 3: BUSCAR PROCESSO MANUAL")
    print("="*60)
    print("\n📝 INSTRUÇÕES:")
    print("1. No navegador aberto, navegue até a busca de processos")
    print("2. Com DevTools (F12) aberto, inspecione:")
    print("   - Campo de número do processo")
    print("   - Botão de buscar")
    print("   - Onde aparecem os resultados")
    print("\n3. ANOTE todos os seletores CSS:")
    print("   - Input número: By.ID ou By.NAME = ???")
    print("   - Botão buscar: By.ID = ???")
    print("   - Container resultado: By.CLASS_NAME = ???")
    
    input("\n⏸️  Pressione ENTER quando estiver na página de busca...")
    
    # Tentar buscar um processo de exemplo
    numero_processo = input("\n📝 Digite um número de processo para testar: ")
    
    print("\n🔍 Tentando buscar automaticamente...")
    print("⚠️  Se não funcionar, anote os seletores corretos!")
    
    # EXEMPLOS DE POSSÍVEIS SELETORES (VOCÊ VAI ATUALIZAR)
    try:
        # Exemplo 1: Por ID
        input_processo = driver.find_element(By.ID, "numeroProcesso")
        input_processo.clear()
        input_processo.send_keys(numero_processo)
        print("✅ Campo preenchido por ID: 'numeroProcesso'")
    except:
        try:
            # Exemplo 2: Por NAME
            input_processo = driver.find_element(By.NAME, "processo")
            input_processo.clear()
            input_processo.send_keys(numero_processo)
            print("✅ Campo preenchido por NAME: 'processo'")
        except:
            print("❌ Não encontrei o campo. ANOTE o seletor correto!")
    
    input("\n⏸️  Clique manualmente no botão BUSCAR e pressione ENTER...")


def passo_4_extrair_dados_manual(driver):
    """Passo 4: Identificar como extrair dados"""
    print("\n" + "="*60)
    print("PASSO 4: EXTRAIR DADOS DOS RESULTADOS")
    print("="*60)
    print("\n📝 INSTRUÇÕES:")
    print("1. Com o resultado da busca na tela")
    print("2. Abra DevTools (F12) e inspecione cada campo:")
    print("\n   📋 DADOS DO PROCESSO:")
    print("   - Número do processo: seletor = ???")
    print("   - Status: seletor = ???")
    print("   - Tipo: seletor = ???")
    print("   - Data abertura: seletor = ???")
    print("   - Interessado: seletor = ???")
    print("   - Assunto: seletor = ???")
    print("\n3. Para cada campo, anote o SELETOR CSS:")
    print("   Exemplo: .processo-numero ou #statusProcesso")
    
    input("\n⏸️  Pressione ENTER quando terminar de anotar...")
    
    # Tentar pegar o HTML da página para você analisar
    print("\n💾 Salvando HTML da página para análise...")
    
    with open("seirn_resultado.html", "w", encoding="utf-8") as f:
        f.html(driver.page_source)
    
    print("✅ HTML salvo em: seirn_resultado.html")
    print("   Você pode abrir esse arquivo e procurar os seletores!")
    
    # Tirar screenshot
    driver.save_screenshot("seirn_screenshot.png")
    print("✅ Screenshot salvo em: seirn_screenshot.png")


def passo_5_template_codigo(driver):
    """Passo 5: Gerar template com seus seletores"""
    print("\n" + "="*60)
    print("PASSO 5: GERANDO TEMPLATE DE CÓDIGO")
    print("="*60)
    
    print("\n📝 Agora preencha os seletores que você anotou:")
    
    seletores = {
        'login_username_id': input("ID do campo usuário (login): "),
        'login_password_id': input("ID do campo senha (login): "),
        'login_button_id': input("ID do botão login: "),
        'busca_input_id': input("ID do campo número processo (busca): "),
        'busca_button_id': input("ID do botão buscar: "),
        'resultado_container': input("CLASS do container de resultado: "),
        'processo_numero': input("Seletor CSS do número processo: "),
        'processo_status': input("Seletor CSS do status: "),
        'processo_tipo': input("Seletor CSS do tipo: "),
        'processo_data': input("Seletor CSS da data: "),
    }
    
    # Gerar código customizado
    codigo = f'''
# SELETORES CUSTOMIZADOS PARA SEIRN
# Gerado em: {time.strftime("%Y-%m-%d %H:%M:%S")}

SEIRN_CONFIG = {{
    "url": "{SEIRN_URL}",
    
    # Login
    "login": {{
        "username_field": (By.ID, "{seletores['login_username_id']}"),
        "password_field": (By.ID, "{seletores['login_password_id']}"),
        "submit_button": (By.ID, "{seletores['login_button_id']}"),
    }},
    
    # Busca
    "busca": {{
        "input_processo": (By.ID, "{seletores['busca_input_id']}"),
        "button_buscar": (By.ID, "{seletores['busca_button_id']}"),
        "resultado_container": (By.CLASS_NAME, "{seletores['resultado_container']}"),
    }},
    
    # Seletores CSS para extração
    "seletores_extracao": {{
        "numero": "{seletores['processo_numero']}",
        "status": "{seletores['processo_status']}",
        "tipo": "{seletores['processo_tipo']}",
        "data": "{seletores['processo_data']}",
    }}
}}

# Use esses seletores em seirn_service.py!
'''
    
    with open("seirn_config_customizado.py", "w", encoding="utf-8") as f:
        f.write(codigo)
    
    print("\n✅ Configuração salva em: seirn_config_customizado.py")
    print("📝 Use esse arquivo para atualizar seirn_service.py")


def main():
    """Função principal"""
    print("="*60)
    print("🔍 CONFIGURADOR INTERATIVO DE WEBSCRAPING SEIRN")
    print("="*60)
    print("\nEste script vai:")
    print("1. Abrir o navegador Chrome VISÍVEL")
    print("2. Permitir você fazer login manualmente")
    print("3. Ajudar a identificar todos os seletores CSS")
    print("4. Gerar código customizado para você")
    
    input("\n⏸️  Pressione ENTER para começar...")
    
    driver = criar_driver_visivel()
    
    try:
        passo_1_navegar(driver)
        passo_2_login_manual(driver)
        passo_3_buscar_processo_manual(driver)
        passo_4_extrair_dados_manual(driver)
        passo_5_template_codigo(driver)
        
        print("\n" + "="*60)
        print("✅ CONFIGURAÇÃO CONCLUÍDA!")
        print("="*60)
        print("\n📁 Arquivos gerados:")
        print("   - seirn_config_customizado.py (use este!)")
        print("   - seirn_resultado.html (para análise)")
        print("   - seirn_screenshot.png (screenshot)")
        print("\n📝 Próximos passos:")
        print("   1. Copie os seletores de seirn_config_customizado.py")
        print("   2. Atualize webscraping-service/app/seirn_service.py")
        print("   3. Teste o serviço!")
        
        input("\n⏸️  Pressione ENTER para fechar o navegador...")
        
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        print("💡 Não se preocupe, você pode executar novamente!")
        input("\nPressione ENTER para fechar...")
    
    finally:
        driver.quit()
        print("\n👋 Navegador fechado. Até logo!")


if __name__ == "__main__":
    main()
