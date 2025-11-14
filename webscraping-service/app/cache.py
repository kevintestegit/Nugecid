import redis
import json
import logging
from typing import Optional, Any
from .config import settings

logger = logging.getLogger(__name__)

class CacheService:
    """Serviço de cache com Redis"""
    
    def __init__(self):
        try:
            self.redis_client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Testa conexão
            self.redis_client.ping()
            self.enabled = True
            logger.info("Cache Redis conectado com sucesso")
        except Exception as e:
            logger.warning(f"Redis não disponível, cache desabilitado: {e}")
            self.redis_client = None
            self.enabled = False
    
    def get(self, key: str) -> Optional[Any]:
        """Busca valor no cache"""
        if not self.enabled:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            logger.debug(f"Cache MISS: {key}")
        except Exception as e:
            logger.error(f"Erro ao buscar do cache: {e}")
        
        return None
    
    def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Salva valor no cache"""
        if not self.enabled:
            return False
        
        try:
            ttl = ttl or settings.CACHE_TTL
            serialized = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar no cache: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Remove valor do cache"""
        if not self.enabled:
            return False
        
        try:
            self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar do cache: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Remove todas as chaves que correspondem ao padrão"""
        if not self.enabled:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Cache CLEAR: {deleted} chaves removidas ({pattern})")
                return deleted
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
        
        return 0
    
    def health_check(self) -> bool:
        """Verifica saúde do cache"""
        if not self.enabled:
            return False
        
        try:
            return self.redis_client.ping()
        except:
            return False

# Instância global
cache = CacheService()
