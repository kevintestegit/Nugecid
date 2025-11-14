from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import logging
import time
from typing import Optional, Dict, Any
from .config import settings

logger = logging.getLogger(__name__)

class SeleniumScraper:
    """Selenium-based scraper para páginas dinâmicas"""
    
    def __init__(self):
        self.driver: Optional[webdriver.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
        
    def _get_chrome_options(self) -> Options:
        """Configura opções do Chrome"""
        chrome_options = Options()
        
        if settings.HEADLESS:
            chrome_options.add_argument("--headless=new")
        
        for option in settings.CHROME_OPTIONS:
            chrome_options.add_argument(option)
        
        # User agent aleatório
        ua = UserAgent()
        chrome_options.add_argument(f"user-agent={ua.random}")
        
        return chrome_options
    
    def start_driver(self):
        """Inicia o driver do Chrome"""
        try:
            chrome_options = self._get_chrome_options()
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
            self.wait = WebDriverWait(self.driver, settings.TIMEOUT)
            logger.info("Chrome driver iniciado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao iniciar Chrome driver: {e}")
            raise
    
    def close_driver(self):
        """Fecha o driver"""
        if self.driver:
            try:
                self.driver.quit()
                logger.info("Chrome driver fechado")
            except Exception as e:
                logger.error(f"Erro ao fechar driver: {e}")
    
    def navigate_to(self, url: str) -> bool:
        """Navega para uma URL"""
        if not self.driver:
            self.start_driver()
        
        try:
            self.driver.get(url)
            time.sleep(2)  # Espera a página carregar
            return True
        except Exception as e:
            logger.error(f"Erro ao navegar para {url}: {e}")
            return False
    
    def wait_for_element(self, by: By, value: str, timeout: int = None) -> bool:
        """Espera um elemento aparecer"""
        try:
            timeout = timeout or settings.TIMEOUT
            wait = WebDriverWait(self.driver, timeout)
            wait.until(EC.presence_of_element_located((by, value)))
            return True
        except TimeoutException:
            logger.warning(f"Timeout aguardando elemento {value}")
            return False
    
    def get_element_text(self, by: By, value: str) -> Optional[str]:
        """Pega texto de um elemento"""
        try:
            element = self.driver.find_element(by, value)
            return element.text.strip()
        except NoSuchElementException:
            logger.warning(f"Elemento {value} não encontrado")
            return None
    
    def get_page_source(self) -> str:
        """Retorna o HTML da página"""
        return self.driver.page_source if self.driver else ""
    
    def click_element(self, by: By, value: str) -> bool:
        """Clica em um elemento"""
        try:
            element = self.wait.until(EC.element_to_be_clickable((by, value)))
            element.click()
            time.sleep(1)
            return True
        except Exception as e:
            logger.error(f"Erro ao clicar no elemento {value}: {e}")
            return False
    
    def fill_input(self, by: By, value: str, text: str) -> bool:
        """Preenche um campo de input"""
        try:
            element = self.driver.find_element(by, value)
            element.clear()
            element.send_keys(text)
            time.sleep(0.5)
            return True
        except Exception as e:
            logger.error(f"Erro ao preencher input {value}: {e}")
            return False
    
    def execute_script(self, script: str) -> Any:
        """Executa JavaScript"""
        if self.driver:
            return self.driver.execute_script(script)
        return None
    
    def take_screenshot(self, filepath: str) -> bool:
        """Tira screenshot da página"""
        try:
            if self.driver:
                self.driver.save_screenshot(filepath)
                return True
        except Exception as e:
            logger.error(f"Erro ao tirar screenshot: {e}")
        return False
    
    def __enter__(self):
        """Context manager entry"""
        self.start_driver()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close_driver()


class BeautifulSoupScraper:
    """BeautifulSoup scraper para HTML estático"""
    
    @staticmethod
    def parse_html(html: str) -> BeautifulSoup:
        """Parse HTML com BeautifulSoup"""
        return BeautifulSoup(html, 'lxml')
    
    @staticmethod
    def extract_text(soup: BeautifulSoup, selector: str) -> Optional[str]:
        """Extrai texto de um seletor CSS"""
        element = soup.select_one(selector)
        return element.get_text(strip=True) if element else None
    
    @staticmethod
    def extract_all_text(soup: BeautifulSoup, selector: str) -> list:
        """Extrai texto de todos elementos que correspondem ao seletor"""
        elements = soup.select(selector)
        return [el.get_text(strip=True) for el in elements]
    
    @staticmethod
    def extract_attribute(soup: BeautifulSoup, selector: str, attr: str) -> Optional[str]:
        """Extrai atributo de um elemento"""
        element = soup.select_one(selector)
        return element.get(attr) if element else None
    
    @staticmethod
    def extract_table(soup: BeautifulSoup, table_selector: str) -> list:
        """Extrai dados de uma tabela HTML"""
        table = soup.select_one(table_selector)
        if not table:
            return []
        
        rows = []
        for tr in table.find_all('tr'):
            cells = [td.get_text(strip=True) for td in tr.find_all(['td', 'th'])]
            if cells:
                rows.append(cells)
        
        return rows
