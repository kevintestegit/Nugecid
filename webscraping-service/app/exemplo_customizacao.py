"""
Exemplo de customização do scraper SEIRN

Este arquivo mostra como adaptar o scraper para o SEIRN real.
Copie este conteúdo para seirn_service.py e ajuste conforme necessário.
"""

from selenium.webdriver.common.by import By
import logging
import re
from typing import Optional, Dict, Any
from .scraper import SeleniumScraper, BeautifulSoupScraper
from .cache import cache
from .config import settings
import hashlib
import time

logger = logging.getLogger(__name__)

class SeirnCustomService:
    """Exemplo customizado para SEIRN - ADAPTAR CONFORME SITE REAL"""
    
    def __init__(self):
        self.base_url = settings.SEIRN_BASE_URL
        self.scraper = SeleniumScraper()
        self.soup_parser = BeautifulSoupScraper()
    
    async def fazer_login(self, scraper: SeleniumScraper) -> bool:
        """
        Se SEIRN requer autenticação, implementar aqui
        """
        try:
            # Exemplo de login (ADAPTAR)
            login_url = f"{self.base_url}/login"
            scraper.navigate_to(login_url)
            
            # Preencher credenciais
            # scraper.fill_input(By.ID, "username", "seu_usuario")
            # scraper.fill_input(By.ID, "password", "sua_senha")
            # scraper.click_element(By.ID, "btn-login")
            
            # Aguardar login bem-sucedido
            # return scraper.wait_for_element(By.ID, "dashboard", timeout=10)
            
            return True
        except Exception as e:
            logger.error(f"Erro no login: {e}")
            return False
    
    async def buscar_processo_real(self, numero_processo: str) -> Dict[str, Any]:
        """
        Exemplo de busca real - ADAPTE CONFORME SEIRN
        
        Passos típicos:
        1. Navegar para página de busca
        2. Preencher formulário
        3. Submeter busca
        4. Aguardar resultados
        5. Extrair dados
        """
        try:
            with self.scraper as scraper:
                # PASSO 1: Login (se necessário)
                # if not await self.fazer_login(scraper):
                #     raise Exception("Falha no login")
                
                # PASSO 2: Navegar para busca
                url_busca = f"{self.base_url}/processos/consulta"
                if not scraper.navigate_to(url_busca):
                    raise Exception("Falha ao navegar")
                
                # PASSO 3: Preencher formulário
                # Exemplo 1: Input direto
                scraper.fill_input(By.NAME, "numeroProcesso", numero_processo)
                
                # Exemplo 2: Select/dropdown
                # scraper.execute_script(
                #     "document.getElementById('tipoProcesso').value = 'CRIMINAL'"
                # )
                
                # Exemplo 3: Radio button
                # scraper.click_element(By.ID, "opcao_processo")
                
                # PASSO 4: Submeter
                scraper.click_element(By.ID, "btnBuscar")
                
                # PASSO 5: Aguardar resultado
                # Opção 1: Aguardar elemento específico
                if not scraper.wait_for_element(By.CLASS_NAME, "resultado", timeout=15):
                    return {"success": False, "error": "Nenhum resultado encontrado"}
                
                # Opção 2: Aguardar JavaScript terminar
                # scraper.execute_script("return document.readyState") == "complete"
                
                # PASSO 6: Extrair dados
                html = scraper.get_page_source()
                soup = self.soup_parser.parse_html(html)
                
                # Exemplo de extração
                dados = {}
                
                # Método 1: Seletor CSS direto
                dados['numero'] = self.soup_parser.extract_text(
                    soup, 
                    "div.processo-info span.numero"
                )
                
                # Método 2: XPath convertido para CSS
                dados['status'] = self.soup_parser.extract_text(
                    soup,
                    "#dadosProcesso > div.status > span"
                )
                
                # Método 3: Busca por texto e extrai próximo elemento
                # label_element = soup.find(text=re.compile("Status:"))
                # if label_element:
                #     dados['status'] = label_element.find_next('span').get_text()
                
                # Método 4: Extrair tabela completa
                # tabela_dados = self.soup_parser.extract_table(
                #     soup,
                #     "table.dados-processo"
                # )
                
                # Método 5: Múltiplos elementos
                # partes = self.soup_parser.extract_all_text(
                #     soup,
                #     "div.partes span.nome"
                # )
                # dados['partes'] = partes
                
                # Método 6: Extrair atributo
                # dados['pdf_link'] = self.soup_parser.extract_attribute(
                #     soup,
                #     "a.download-pdf",
                #     "href"
                # )
                
                return {
                    "success": True,
                    "data": dados,
                    "error": None
                }
                
        except Exception as e:
            logger.error(f"Erro: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": None
            }
    
    async def extrair_com_regex(self, texto: str) -> Dict[str, str]:
        """
        Extrair dados usando regex quando HTML não é estruturado
        """
        dados = {}
        
        # Exemplo: Extrair número de processo
        match_processo = re.search(r'Processo:\s*(\d+/\d{4})', texto)
        if match_processo:
            dados['processo'] = match_processo.group(1)
        
        # Exemplo: Extrair data
        match_data = re.search(r'Data:\s*(\d{2}/\d{2}/\d{4})', texto)
        if match_data:
            dados['data'] = match_data.group(1)
        
        return dados
    
    async def navegacao_complexa(self, scraper: SeleniumScraper) -> None:
        """
        Exemplo de navegação com múltiplas páginas
        """
        # Clicar em aba
        scraper.click_element(By.LINK_TEXT, "Detalhes")
        time.sleep(1)
        
        # Rolar página
        scraper.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        # Aguardar AJAX carregar
        scraper.execute_script(
            "return jQuery.active == 0"  # Se site usa jQuery
        )
        
        # Expandir seção
        scraper.click_element(By.CLASS_NAME, "expandir")
        
        # Mudar para iframe
        # scraper.driver.switch_to.frame("iframe_id")
        # ... fazer algo no iframe
        # scraper.driver.switch_to.default_content()
    
    async def tratar_captcha(self, scraper: SeleniumScraper) -> bool:
        """
        Detectar e tratar CAPTCHA (exemplo básico)
        """
        # Verificar se há CAPTCHA
        html = scraper.get_page_source()
        if "captcha" in html.lower():
            logger.warning("CAPTCHA detectado!")
            
            # Opção 1: Pausar e aguardar resolução manual
            if not settings.HEADLESS:
                input("Resolva o CAPTCHA e pressione Enter...")
                return True
            
            # Opção 2: Usar serviço de resolução (não recomendado)
            # ...
            
            return False
        
        return True


# DICAS DE DEBUG
"""
1. Ver o que está acontecendo:
   - Desative HEADLESS no .env
   - Adicione time.sleep() entre ações
   - Use scraper.take_screenshot('debug.png')

2. Encontrar seletores:
   - Abra o SEIRN no Chrome
   - F12 > Elements
   - Clique com botão direito no elemento > Copy > Copy selector
   - Use no código: By.CSS_SELECTOR, "seu_seletor"

3. Testar extração:
   html = scraper.get_page_source()
   soup = BeautifulSoup(html, 'lxml')
   # Experimente diferentes seletores
   print(soup.select('.sua-classe'))
   print(soup.select_one('#seu-id'))

4. Logs detalhados:
   - Configure LOG_LEVEL=DEBUG no .env
   - Verifique webscraping-service/logs/

5. Tratamento de erros:
   - Sempre use try/except
   - Adicione fallbacks
   - Retorne dados parciais se possível
"""
