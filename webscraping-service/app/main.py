from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import uvicorn
from datetime import datetime

from .config import settings
from .models import (
    SeirnSearchRequest,
    SeirnResponse,
    HealthResponse
)
from .seirn_service import seirn_service
from .cache import cache

# Configuração de logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Inicializa FastAPI
app = FastAPI(
    title="SEIRN Webscraping Service",
    description="Microserviço de webscraping para integração com SEIRN",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Status"])
async def root():
    """Endpoint raiz"""
    return {
        "service": "SEIRN Webscraping Service",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthResponse, tags=["Status"])
async def health_check():
    """Health check do serviço"""
    cache_status = cache.health_check()
    
    return HealthResponse(
        status="healthy" if cache_status else "degraded",
        service="seirn-webscraping",
        version="1.0.0",
    )

@app.get("/api/v1/processo/{numero_processo}", response_model=SeirnResponse, tags=["SEIRN"])
async def buscar_processo(
    numero_processo: str,
    use_cache: bool = Query(True, description="Usar cache Redis")
):
    """
    Busca informações de um processo no SEIRN
    
    Args:
        numero_processo: Número do processo (ex: 12345/2024)
        use_cache: Se deve usar cache (padrão: True)
    
    Returns:
        Dados do processo encontrado
    """
    try:
        logger.info(f"Buscando processo: {numero_processo}")
        result = await seirn_service.buscar_processo(numero_processo, use_cache)
        
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Processo não encontrado"))
        
        return SeirnResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar processo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/ocorrencia/{numero_ocorrencia}", response_model=SeirnResponse, tags=["SEIRN"])
async def buscar_ocorrencia(
    numero_ocorrencia: str,
    use_cache: bool = Query(True, description="Usar cache Redis")
):
    """
    Busca informações de uma ocorrência no SEIRN
    
    Args:
        numero_ocorrencia: Número da ocorrência
        use_cache: Se deve usar cache (padrão: True)
    
    Returns:
        Dados da ocorrência encontrada
    """
    try:
        logger.info(f"Buscando ocorrência: {numero_ocorrencia}")
        result = await seirn_service.buscar_ocorrencia(numero_ocorrencia, use_cache)
        
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Ocorrência não encontrada"))
        
        return SeirnResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar ocorrência: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/search", response_model=SeirnResponse, tags=["SEIRN"])
async def buscar_generico(request: SeirnSearchRequest):
    """
    Busca genérica no SEIRN (suporta múltiplos tipos)
    
    Args:
        request: Dados da busca
    
    Returns:
        Resultado da busca
    """
    try:
        tipo = request.tipo_busca.lower()
        numero = request.numero
        
        if tipo == "processo":
            result = await seirn_service.buscar_processo(numero)
        elif tipo == "ocorrencia":
            result = await seirn_service.buscar_ocorrencia(numero)
        else:
            raise HTTPException(status_code=400, detail=f"Tipo de busca inválido: {tipo}")
        
        if not result.get("success"):
            raise HTTPException(status_code=404, detail=result.get("error", "Não encontrado"))
        
        return SeirnResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro na busca genérica: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/v1/cache", tags=["Cache"])
async def limpar_cache(tipo: str = Query(None, description="Tipo específico (processo, ocorrencia)")):
    """
    Limpa cache do Redis
    
    Args:
        tipo: Tipo específico para limpar (opcional)
    
    Returns:
        Número de entradas removidas
    """
    try:
        deleted = await seirn_service.limpar_cache(tipo)
        return {
            "success": True,
            "deleted": deleted,
            "message": f"{deleted} entradas removidas do cache"
        }
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/cache/status", tags=["Cache"])
async def cache_status():
    """Status do cache Redis"""
    return {
        "enabled": cache.enabled,
        "healthy": cache.health_check(),
        "host": settings.REDIS_HOST,
        "port": settings.REDIS_PORT
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
