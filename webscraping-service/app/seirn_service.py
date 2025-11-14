from selenium.webdriver.common.by import By
import logging
import re
from typing import Optional, Dict, Any
from .scraper import SeleniumScraper, BeautifulSoupScraper
from .models import SeirnProcesso, SeirnOcorrencia
from .cache import cache
from .config import settings
import hashlib
import time

logger = logging.getLogger(__name__)

class SeirnService:
    """Serviço principal de webscraping do SEIRN"""
    
    def __init__(self):
        self.base_url = settings.SEIRN_BASE_URL
        self.scraper = SeleniumScraper()
        self.soup_parser = BeautifulSoupScraper()
    
    def _generate_cache_key(self, tipo: str, numero: str) -> str:
        """Gera chave de cache"""
        data = f"{tipo}:{numero}"
        return f"seirn:{hashlib.md5(data.encode()).hexdigest()}"
    
    def _normalize_numero(self, numero: str) -> str:
        """Normaliza número removendo caracteres especiais"""
        return re.sub(r'[^0-9]', '', numero)
    
    async def buscar_processo(self, numero_processo: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Busca informações de um processo no SEIRN
        
        Args:
            numero_processo: Número do processo
            use_cache: Se deve usar cache
            
        Returns:
            Dicionário com dados do processo
        """
        start_time = time.time()
        numero_normalizado = self._normalize_numero(numero_processo)
        cache_key = self._generate_cache_key("processo", numero_normalizado)
        
        # Verifica cache
        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                cached_data['cached'] = True
                cached_data['execution_time_ms'] = 0
                return cached_data
        
        try:
            # TODO: Implementar lógica específica do SEIRN
            # Esta é uma estrutura base que você deve adaptar
            
            with self.scraper as scraper:
                # Navega para página de busca
                url_busca = f"{self.base_url}/busca-processo"
                if not scraper.navigate_to(url_busca):
                    raise Exception("Falha ao navegar para página de busca")
                
                # Exemplo: Preenche formulário de busca
                # ADAPTAR CONFORME ESTRUTURA REAL DO SEIRN
                if not scraper.fill_input(By.ID, "numero_processo", numero_processo):
                    raise Exception("Falha ao preencher número do processo")
                
                # Submete formulário
                if not scraper.click_element(By.ID, "btn_buscar"):
                    raise Exception("Falha ao submeter busca")
                
                # Aguarda resultados
                if not scraper.wait_for_element(By.CLASS_NAME, "resultado-processo", timeout=10):
                    return {
                        "success": False,
                        "error": "Processo não encontrado",
                        "data": None
                    }
                
                # Extrai HTML
                html = scraper.get_page_source()
                soup = self.soup_parser.parse_html(html)
                
                # Extrai dados (ADAPTAR CONFORME HTML DO SEIRN)
                processo_data = {
                    "numero_processo": numero_processo,
                    "ano": self.soup_parser.extract_text(soup, ".processo-ano"),
                    "status": self.soup_parser.extract_text(soup, ".processo-status"),
                    "tipo": self.soup_parser.extract_text(soup, ".processo-tipo"),
                    "data_abertura": self.soup_parser.extract_text(soup, ".processo-data"),
                    "interessado": self.soup_parser.extract_text(soup, ".processo-interessado"),
                    "assunto": self.soup_parser.extract_text(soup, ".processo-assunto"),
                    "localizacao": self.soup_parser.extract_text(soup, ".processo-localizacao"),
                    "observacoes": self.soup_parser.extract_text(soup, ".processo-obs"),
                }
                
                # Remove valores None
                processo_data = {k: v for k, v in processo_data.items() if v is not None}
                
                result = {
                    "success": True,
                    "data": processo_data,
                    "error": None,
                    "cached": False,
                    "execution_time_ms": (time.time() - start_time) * 1000
                }
                
                # Salva no cache
                if use_cache:
                    cache.set(cache_key, result)
                
                return result
                
        except Exception as e:
            logger.error(f"Erro ao buscar processo {numero_processo}: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": None,
                "cached": False,
                "execution_time_ms": (time.time() - start_time) * 1000
            }
    
    async def buscar_ocorrencia(self, numero_ocorrencia: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Busca informações de uma ocorrência no SEIRN
        
        Args:
            numero_ocorrencia: Número da ocorrência
            use_cache: Se deve usar cache
            
        Returns:
            Dicionário com dados da ocorrência
        """
        start_time = time.time()
        numero_normalizado = self._normalize_numero(numero_ocorrencia)
        cache_key = self._generate_cache_key("ocorrencia", numero_normalizado)
        
        # Verifica cache
        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                cached_data['cached'] = True
                cached_data['execution_time_ms'] = 0
                return cached_data
        
        try:
            # TODO: Implementar lógica específica do SEIRN para ocorrências
            with self.scraper as scraper:
                url_busca = f"{self.base_url}/busca-ocorrencia"
                
                if not scraper.navigate_to(url_busca):
                    raise Exception("Falha ao navegar para página de busca")
                
                # ADAPTAR CONFORME ESTRUTURA REAL DO SEIRN
                if not scraper.fill_input(By.ID, "numero_ocorrencia", numero_ocorrencia):
                    raise Exception("Falha ao preencher número da ocorrência")
                
                if not scraper.click_element(By.ID, "btn_buscar"):
                    raise Exception("Falha ao submeter busca")
                
                if not scraper.wait_for_element(By.CLASS_NAME, "resultado-ocorrencia", timeout=10):
                    return {
                        "success": False,
                        "error": "Ocorrência não encontrada",
                        "data": None
                    }
                
                html = scraper.get_page_source()
                soup = self.soup_parser.parse_html(html)
                
                # Extrai dados (ADAPTAR)
                ocorrencia_data = {
                    "numero_ocorrencia": numero_ocorrencia,
                    "data_ocorrencia": self.soup_parser.extract_text(soup, ".ocorrencia-data"),
                    "tipo_ocorrencia": self.soup_parser.extract_text(soup, ".ocorrencia-tipo"),
                    "local": self.soup_parser.extract_text(soup, ".ocorrencia-local"),
                    "vitima": self.soup_parser.extract_text(soup, ".ocorrencia-vitima"),
                    "autor": self.soup_parser.extract_text(soup, ".ocorrencia-autor"),
                    "status": self.soup_parser.extract_text(soup, ".ocorrencia-status"),
                    "descricao": self.soup_parser.extract_text(soup, ".ocorrencia-descricao"),
                    "delegacia": self.soup_parser.extract_text(soup, ".ocorrencia-delegacia"),
                }
                
                ocorrencia_data = {k: v for k, v in ocorrencia_data.items() if v is not None}
                
                result = {
                    "success": True,
                    "data": ocorrencia_data,
                    "error": None,
                    "cached": False,
                    "execution_time_ms": (time.time() - start_time) * 1000
                }
                
                if use_cache:
                    cache.set(cache_key, result)
                
                return result
                
        except Exception as e:
            logger.error(f"Erro ao buscar ocorrência {numero_ocorrencia}: {e}")
            return {
                "success": False,
                "error": str(e),
                "data": None,
                "cached": False,
                "execution_time_ms": (time.time() - start_time) * 1000
            }
    
    async def limpar_cache(self, tipo: Optional[str] = None) -> int:
        """Limpa cache do SEIRN"""
        if tipo:
            pattern = f"seirn:{tipo}:*"
        else:
            pattern = "seirn:*"
        
        return cache.clear_pattern(pattern)

# Instância global
seirn_service = SeirnService()
