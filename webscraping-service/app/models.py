from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class SeirnSearchRequest(BaseModel):
    """Request para buscar informações no SEIRN"""
    tipo_busca: str = Field(..., description="Tipo de busca: 'processo', 'ocorrencia', 'documento'")
    numero: str = Field(..., description="Número do processo/ocorrência/documento")
    parametros_adicionais: Optional[Dict[str, Any]] = Field(default=None, description="Parâmetros extras")

class SeirnProcesso(BaseModel):
    """Dados de um processo do SEIRN"""
    numero_processo: str
    ano: Optional[str] = None
    status: Optional[str] = None
    tipo: Optional[str] = None
    data_abertura: Optional[str] = None
    interessado: Optional[str] = None
    assunto: Optional[str] = None
    localizacao: Optional[str] = None
    observacoes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SeirnOcorrencia(BaseModel):
    """Dados de uma ocorrência do SEIRN"""
    numero_ocorrencia: str
    data_ocorrencia: Optional[str] = None
    tipo_ocorrencia: Optional[str] = None
    local: Optional[str] = None
    vitima: Optional[str] = None
    autor: Optional[str] = None
    status: Optional[str] = None
    descricao: Optional[str] = None
    delegacia: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SeirnResponse(BaseModel):
    """Resposta genérica do webscraping"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    cached: bool = False
    timestamp: datetime = Field(default_factory=datetime.now)
    execution_time_ms: Optional[float] = None

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.now)
