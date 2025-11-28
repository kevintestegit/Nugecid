#!/usr/bin/env python3
"""
🚀 SCRAPY - Abrir uma URL com Selenium (Chrome visível)

Execute: python scrapy.py
"""

print("""
╔═══════════════════════════════════════════════════════════════╗
║             🔍 WEBSCRAPING VISUAL - SCRAPY                    ║
╚═══════════════════════════════════════════════════════════════╝

Este script vai:
✅ Abrir navegador Chrome VISÍVEL
✅ Navegar para a URL que você digitar (padrão: https://www.google.com)
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
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os
import shutil
import time
import json
import urllib.request
import urllib.error


def _guess_path(candidates):
    """Retorna o primeiro caminho existente."""
    for path in candidates:
        if path and os.path.exists(path):
            return path
    return None

default_url = os.getenv("LAUNCH_URL", "https://sei.rn.gov.br/sip/login.php?sigla_orgao_sistema=SEAD&sigla_sistema=SEI")
print("\n" + "="*60)
print(f"🌐 URL configurada automaticamente: {default_url}")
print("   (defina LAUNCH_URL=... antes de rodar para mudar)")
print("="*60)

url = default_url

print("\n🚀 Iniciando Chrome...")

# Resolver binário do navegador (chromium/chrome)
chrome_binary = os.getenv("CHROME_BINARY") or _guess_path([
    shutil.which("chromium-browser"),
    shutil.which("chromium"),
    "/snap/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/chrome",
])

# Configurar Chrome para ser VISÍVEL
options = Options()
options.add_argument("--start-maximized")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
if chrome_binary:
    options.binary_location = chrome_binary

# Resolver chromedriver (usa o instalado pelo sistema se existir)
chromedriver_path = os.getenv("CHROMEDRIVER_PATH") or _guess_path([
    shutil.which("chromedriver"),
    "/usr/lib/chromium-browser/chromedriver",
    "/usr/bin/chromedriver",
    "/snap/bin/chromium.chromedriver",
])

if chromedriver_path:
    print(f"🛠️  Usando chromedriver em: {chromedriver_path}")
    service = Service(chromedriver_path)
else:
    print("📦 Baixando/instalando Chrome driver (primeira vez pode demorar)...")
    service = Service(ChromeDriverManager().install())

driver = webdriver.Chrome(service=service, options=options)

def _send_webhook(numero, titulo, link):
    webhook_url = os.getenv("ESCAVADOR_WEBHOOK_URL")
    token = os.getenv("ESCAVADOR_WEBHOOK_TOKEN")
    usuario_id = os.getenv("ESCAVADOR_NOTIFY_USER_ID")
    if not webhook_url or not token:
        return
    payload = {"numero": numero, "titulo": titulo, "link": link}
    if usuario_id:
        payload["usuarioId"] = int(usuario_id)
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"ℹ️  Webhook enviado ({resp.status}) para novo processo.")
    except urllib.error.HTTPError as e:
        print(f"⚠️ Falha ao enviar webhook ({e.code}): {e.read().decode('utf-8', 'ignore')}")
    except Exception as e:
        print(f"⚠️ Falha ao enviar webhook: {e}")

def _fetch_last_received(driver, wait):
    """Retorna (elemento_anchor, numero, titulo, href, tr_id)."""
    wait.until(EC.presence_of_element_located((By.XPATH, "//th[contains(normalize-space(),'Recebidos')]")))
    anchor = wait.until(EC.presence_of_element_located((
        By.XPATH,
        "(//th[contains(normalize-space(),'Recebidos')]/ancestor::tr/following-sibling::tr[.//a[contains(@class,'processoVisualizado')]])[1]//a[contains(@class,'processoVisualizado')]"
    )))
    numero = anchor.text.replace("\u200b", "")
    titulo = anchor.get_attribute("aria-label")
    href = anchor.get_attribute("href")
    tr_id = ""
    try:
        tr_id = anchor.find_element(By.XPATH, "ancestor::tr[1]").get_attribute("id")
    except Exception:
        pass
    return anchor, numero, titulo, href, tr_id

try:
    print(f"🌍 Navegando para {url}...")
    driver.get(url)
    
    time.sleep(2)
    # Selecionar órgão (ajuste o valor conforme seu órgão)
    try:
        orgao_valor = os.getenv("SEI_ORGAO_VALOR", "17")  # PCI = value "17"
        select = Select(driver.find_element(By.ID, "selOrgao"))
        select.select_by_value(orgao_valor)
        print(f"✅ Órgão selecionado: value={orgao_valor}")
    except Exception as e:
        print(f"⚠️ Não foi possível selecionar órgão automaticamente: {e}")

    # Preencher usuário e senha (ajuste ou use variáveis de ambiente)
    try:
        usuario = os.getenv("SEI_USUARIO", "70020194498")
        senha = os.getenv("SEI_SENHA", "@Sanfona1")
        driver.find_element(By.ID, "txtUsuario").clear()
        driver.find_element(By.ID, "txtUsuario").send_keys(usuario)
        driver.find_element(By.ID, "pwdSenha").clear()
        driver.find_element(By.ID, "pwdSenha").send_keys(senha)
        print("✅ Usuário e senha preenchidos automaticamente")
    except Exception as e:
        print(f"⚠️ Não foi possível preencher usuário/senha automaticamente: {e}")

    # Clicar no botão ACESSAR com espera explícita e fallback JS
    try:
        wait = WebDriverWait(driver, 10)
        btn = wait.until(EC.element_to_be_clickable((By.ID, "sbmAcessar")))
        try:
            btn.click()
        except Exception:
            driver.execute_script("arguments[0].click();", btn)
        print("✅ Botão ACESSAR clicado")
    except Exception as e:
        print(f"⚠️ Não foi possível clicar em ACESSAR: {e}")

    # Capturar o último processo na seção "Recebidos"
    main_window = driver.current_window_handle
    watch_interval = int(os.getenv("SEI_WATCH_INTERVAL", "10"))  # em segundos; def=10 para facilitar teste; 0 desativa
    beep_on_new = os.getenv("SEI_WATCH_BEEP", "0") == "1"
    click_last = os.getenv("SEI_CLICK_LAST", "0") == "1"
    try:
        primeiro, numero, titulo, href, tr_id = _fetch_last_received(driver, wait)
        print(f"➡️  Último recebido: {numero} | título: {titulo} | link: {href} | linha: {tr_id}")
        # Enviar o último recebido já na partida, para persistir no sistema mesmo sem mudanças
        _send_webhook(numero, titulo, href)
        if click_last:
            try:
                handles_before = driver.window_handles
                url_before = driver.current_url
                try:
                    primeiro.click()
                except Exception:
                    driver.execute_script("arguments[0].click();", primeiro)
                WebDriverWait(driver, 5).until(
                    lambda d: len(d.window_handles) > len(handles_before) or d.current_url != url_before
                )
                new_handles = driver.window_handles
                if len(new_handles) > len(handles_before):
                    driver.switch_to.window(new_handles[-1])
                print("✅ Último recebido clicado; aguardando página abrir.")
            except Exception as e:
                print(f"⚠️ Não foi possível clicar no último recebido: {e}")
        else:
            print("ℹ️  Clique automático desativado (SEI_CLICK_LAST=0).")

        if watch_interval > 0:
            print(f"👀 Monitorando ‘Recebidos’ a cada {watch_interval}s (SEI_WATCH_INTERVAL). Pressione CTRL+C para parar.")
            ultimo_numero = numero
            ultimo_href = href
            while True:
                time.sleep(watch_interval)
                try:
                    driver.switch_to.window(main_window)
                except Exception:
                    pass  # aba principal pode ter sido fechada; vamos tentar mesmo assim
                try:
                    driver.refresh()
                    novo_anchor, novo_numero, novo_titulo, novo_href, novo_tr_id = _fetch_last_received(driver, wait)
                    if novo_numero != ultimo_numero or novo_href != ultimo_href:
                        print(f"\a🔔 Novo recebido: {novo_numero} | título: {novo_titulo} | link: {novo_href} | linha: {novo_tr_id}")
                        if beep_on_new:
                            print("\a", end="", flush=True)
                        _send_webhook(novo_numero, novo_titulo, novo_href)
                        ultimo_numero = novo_numero
                        ultimo_href = novo_href
                    else:
                        print(f"⏳ Sem novos recebidos; último segue {ultimo_numero}")
                except Exception as e:
                    print(f"⚠️ Erro ao monitorar recebidos: {e}")

    except Exception as e:
        print(f"⚠️ Não foi possível ler o último recebido: {e}")
    
    print("\n" + "="*60)
    print("✅ NAVEGADOR ABERTO COM SUCESSO!")
    print("="*60)
    print(f"\n📄 Título: {driver.title}")
    print(f"🔗 URL: {driver.current_url}")
    
    print("\n⏸️  O navegador ficará aberto. Explore à vontade!")
    input("▶️  Pressione ENTER para fechar o navegador e sair...")
    
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
