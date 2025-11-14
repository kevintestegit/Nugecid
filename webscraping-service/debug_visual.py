"""
Script SIMPLES para ver o navegador abrindo e navegando no SEIRN

Execute: python debug_visual.py
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import time

# CONFIGURAR AQUI
SEIRN_URL = "https://seirn.itep.rn.gov.br"  # URL REAL DO SEIRN

print("🚀 Abrindo navegador...")

# Opções do Chrome
options = Options()
# NÃO usar headless = navegador VISÍVEL
# options.add_argument("--headless")  # COMENTADO = MOSTRA NAVEGADOR

options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")

# Criar driver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

try:
    print(f"🌐 Navegando para: {SEIRN_URL}")
    driver.get(SEIRN_URL)
    
    print(f"✅ Página carregada: {driver.title}")
    print(f"✅ URL atual: {driver.current_url}")
    
    print("\n" + "="*60)
    print("NAVEGADOR ABERTO!")
    print("="*60)
    print("\n📝 AGORA VOCÊ PODE:")
    print("1. Ver a página do SEIRN no navegador")
    print("2. Fazer login manualmente")
    print("3. Testar buscar processos")
    print("4. Pressionar F12 para abrir DevTools")
    print("5. Inspecionar elementos para encontrar seletores")
    print("\n💡 DICA: Clique direito em qualquer campo → Inspecionar")
    print("         Veja o ID ou class no HTML")
    
    input("\n⏸️  Pressione ENTER quando terminar de explorar...")
    
    # Tirar screenshot
    driver.save_screenshot("seirn_debug.png")
    print("✅ Screenshot salvo: seirn_debug.png")
    
    # Salvar HTML
    with open("seirn_debug.html", "w", encoding="utf-8") as f:
        f.write(driver.page_source)
    print("✅ HTML salvo: seirn_debug.html")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    
finally:
    print("\n🔒 Fechando navegador...")
    driver.quit()
    print("✅ Concluído!")
