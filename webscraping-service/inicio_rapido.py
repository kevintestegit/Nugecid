#!/usr/bin/env python3
"""
🎯 INÍCIO RÁPIDO - Abrir SEIRN e Ver Navegador

Execute: python inicio_rapido.py
"""

print("""
╔═══════════════════════════════════════════════════════════════╗
║         🔍 WEBSCRAPING VISUAL - INÍCIO RÁPIDO                 ║
╚═══════════════════════════════════════════════════════════════╝

Este script vai:
✅ Abrir navegador Chrome VISÍVEL
✅ Navegar para o SEIRN
✅ Deixar você explorar e configurar

""")

# Verificar se as bibliotecas estão instaladas
try:
    from selenium import webdriver
    print("✅ Selenium instalado")
except ImportError:
    print("❌ Selenium não instalado!")
    print("\n📦 Instale primeiro:")
    print("   pip install selenium")
    exit(1)

try:
    from webdriver_manager.chrome import ChromeDriverManager
    print("✅ WebDriver Manager instalado")
except ImportError:
    print("❌ WebDriver Manager não instalado!")
    print("\n📦 Instale primeiro:")
    print("   pip install webdriver-manager")
    exit(1)

from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time

print("\n" + "="*60)
url = input("📝 Digite a URL do SEIRN (ou ENTER para padrão): ").strip()
if not url:
    url = "https://seirn.itep.rn.gov.br"

print(f"\n🌐 URL configurada: {url}")
print("="*60)

input("\n⏸️  Pressione ENTER para abrir o navegador...")

print("\n🚀 Iniciando Chrome...")

# Configurar Chrome para ser VISÍVEL
options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])

# Criar driver
print("📦 Baixando/instalando Chrome driver (primeira vez pode demorar)...")
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

try:
    print(f"🌍 Navegando para {url}...")
    driver.get(url)
    
    time.sleep(2)
    
    print("\n" + "="*60)
    print("✅ NAVEGADOR ABERTO COM SUCESSO!")
    print("="*60)
    print(f"\n📄 Título: {driver.title}")
    print(f"🔗 URL: {driver.current_url}")
    
    print("\n" + "="*60)
    print("📝 AGORA VOCÊ PODE:")
    print("="*60)
    print("""
    1. 👀 VER a página do SEIRN carregada
    
    2. 🔐 Fazer LOGIN manualmente
    
    3. 🔍 Buscar processos manualmente
    
    4. 🛠️  INSPECIONAR elementos (F12):
       - Pressione F12 para abrir DevTools
       - Clique na setinha 🔍 no DevTools
       - Clique em qualquer campo da página
       - Veja o HTML e anote ID/class/name
    
    5. 📋 ANOTAR seletores CSS:
       Campo usuário: id="???" ou name="???"
       Campo senha: id="???" ou name="???"
       Botão login: id="???" ou class="???"
       Campo busca processo: id="???"
       Botão buscar: id="???"
    """)
    
    print("="*60)
    print("💡 DICAS:")
    print("="*60)
    print("""
    • Para encontrar ID: <input id="meuCampo">
      → Use: By.ID, "meuCampo"
    
    • Para encontrar NAME: <input name="usuario">
      → Use: By.NAME, "usuario"
    
    • Para encontrar CLASS: <button class="btn-login">
      → Use: By.CLASS_NAME, "btn-login"
    """)
    
    print("\n⏸️  O navegador ficará aberto. Explore à vontade!")
    print("    Quando terminar, volte aqui e pressione ENTER")
    
    input("\n▶️  Pressione ENTER para continuar...")
    
    # Oferecer tirar screenshot
    print("\n📸 Quer salvar um screenshot da página atual?")
    resp = input("   (s/N): ").lower()
    
    if resp == 's':
        filename = f"seirn_screenshot_{int(time.time())}.png"
        driver.save_screenshot(filename)
        print(f"✅ Screenshot salvo: {filename}")
    
    # Oferecer salvar HTML
    print("\n💾 Quer salvar o HTML da página para análise?")
    resp = input("   (s/N): ").lower()
    
    if resp == 's':
        filename = f"seirn_html_{int(time.time())}.html"
        with open(filename, "w", encoding="utf-8") as f:
            f.write(driver.page_source)
        print(f"✅ HTML salvo: {filename}")
    
    print("\n" + "="*60)
    print("📝 PRÓXIMOS PASSOS:")
    print("="*60)
    print("""
    1. ✅ Você viu o navegador funcionando
    
    2. 📋 Anotou os seletores CSS?
       → Anote em um arquivo .txt
    
    3. 🔐 Precisa configurar login?
       → Execute: python test_login_visual.py
    
    4. ⚙️  Quer configuração completa guiada?
       → Execute: python configurador_interativo.py
    
    5. 📚 Leia mais:
       → webscraping-service/GUIA_VISUAL.md
    """)
    
    input("\n⏸️  Pressione ENTER para fechar o navegador e sair...")
    
except KeyboardInterrupt:
    print("\n\n⚠️  Interrompido pelo usuário")
    
except Exception as e:
    print(f"\n❌ Erro: {e}")
    print("\n💡 Possíveis soluções:")
    print("   1. Certifique-se que Chrome está instalado")
    print("   2. Verifique sua conexão com internet")
    print("   3. Tente executar novamente")
    input("\nPressione ENTER para sair...")
    
finally:
    print("\n🔒 Fechando navegador...")
    driver.quit()
    print("✅ Concluído! Até logo! 👋\n")
