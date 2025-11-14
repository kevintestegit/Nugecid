import { Injectable, Logger } from '@nestjs/common';
import { WebscrapingService } from '../webscraping/services/webscraping.service';

/**
 * EXEMPLO DE USO DO MÓDULO DE WEBSCRAPING
 * 
 * Este arquivo demonstra como usar o serviço de webscraping
 * em diferentes cenários do sistema SGC-ITEP.
 */

@Injectable()
export class ExemploIntegracaoService {
  private readonly logger = new Logger(ExemploIntegracaoService.name);

  constructor(
    private readonly webscrapingService: WebscrapingService,
  ) {}

  /**
   * Exemplo 1: Enriquecer dados de processo ao criar
   */
  async criarProcessoComDadosSeirn(numeroProcesso: string) {
    try {
      // Buscar dados no SEIRN
      const resultadoSeirn = await this.webscrapingService.buscarProcesso(
        numeroProcesso,
        true, // usar cache
      );

      if (resultadoSeirn.success && resultadoSeirn.data) {
        const dadosSeirn = resultadoSeirn.data;

        // Criar processo com dados enriquecidos
        const processo = {
          numero: numeroProcesso,
          ano: dadosSeirn.ano,
          status: dadosSeirn.status,
          tipo: dadosSeirn.tipo,
          interessado: dadosSeirn.interessado,
          assunto: dadosSeirn.assunto,
          data_abertura: dadosSeirn.data_abertura,
          // ... outros campos
          
          // Metadados
          fonte_dados: 'SEIRN',
          ultima_atualizacao_seirn: new Date(),
          dados_seirn_completos: dadosSeirn,
        };

        this.logger.log(
          `Processo ${numeroProcesso} enriquecido com dados do SEIRN`,
        );

        return processo;
      }

      // Criar processo apenas com dados básicos se SEIRN falhar
      this.logger.warn(
        `Dados do SEIRN não disponíveis para ${numeroProcesso}`,
      );
      
      return {
        numero: numeroProcesso,
        status: 'PENDENTE_VERIFICACAO',
        // ... campos padrão
      };

    } catch (error) {
      this.logger.error(
        `Erro ao buscar dados do SEIRN: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Exemplo 2: Validar número de processo antes de criar
   */
  async validarProcessoNoSeirn(numeroProcesso: string): Promise<boolean> {
    try {
      const resultado = await this.webscrapingService.buscarProcesso(
        numeroProcesso,
        true,
      );

      return resultado.success && resultado.data !== null;
    } catch (error) {
      this.logger.warn(
        `Não foi possível validar processo ${numeroProcesso}: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Exemplo 3: Sincronizar dados periodicamente
   */
  async sincronizarProcessosComSeirn(listaProcessos: string[]) {
    const resultados = {
      sucesso: [],
      falha: [],
      total: listaProcessos.length,
    };

    for (const numeroProcesso of listaProcessos) {
      try {
        const dados = await this.webscrapingService.buscarProcesso(
          numeroProcesso,
          false, // não usar cache para sincronização
        );

        if (dados.success) {
          // Atualizar dados no banco
          // await this.processoRepository.update(...)
          
          resultados.sucesso.push(numeroProcesso);
          this.logger.debug(`Processo ${numeroProcesso} sincronizado`);
        } else {
          resultados.falha.push({
            numero: numeroProcesso,
            erro: dados.error,
          });
        }

        // Pequeno delay entre requisições para não sobrecarregar
        await this.delay(1000);

      } catch (error) {
        resultados.falha.push({
          numero: numeroProcesso,
          erro: error.message,
        });
      }
    }

    this.logger.log(
      `Sincronização concluída: ${resultados.sucesso.length}/${resultados.total} processos`,
    );

    return resultados;
  }

  /**
   * Exemplo 4: Buscar ocorrência vinculada a processo
   */
  async buscarOcorrenciaRelacionada(numeroOcorrencia: string) {
    try {
      const resultado = await this.webscrapingService.buscarOcorrencia(
        numeroOcorrencia,
        true,
      );

      if (resultado.success && resultado.data) {
        return {
          numero_ocorrencia: resultado.data.numero_ocorrencia,
          tipo: resultado.data.tipo_ocorrencia,
          data: resultado.data.data_ocorrencia,
          local: resultado.data.local,
          delegacia: resultado.data.delegacia,
          vitima: resultado.data.vitima,
          autor: resultado.data.autor,
          status: resultado.data.status,
          descricao: resultado.data.descricao,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao buscar ocorrência: ${error.message}`);
      return null;
    }
  }

  /**
   * Exemplo 5: Busca genérica com tratamento de erro
   */
  async buscarGenericoComFallback(tipo: string, numero: string) {
    try {
      // Tentar com cache primeiro
      const resultado = await this.webscrapingService.buscarGenerico({
        tipo_busca: tipo as any,
        numero,
        use_cache: true,
      });

      if (resultado.success) {
        return resultado.data;
      }

      // Se falhar, tentar sem cache
      this.logger.warn('Tentando busca sem cache...');
      
      const resultadoSemCache = await this.webscrapingService.buscarGenerico({
        tipo_busca: tipo as any,
        numero,
        use_cache: false,
      });

      return resultadoSemCache.success ? resultadoSemCache.data : null;

    } catch (error) {
      this.logger.error(`Erro na busca genérica: ${error.message}`);
      return null;
    }
  }

  /**
   * Exemplo 6: Verificar disponibilidade do serviço antes de usar
   */
  async executarComHealthCheck<T>(
    operacao: () => Promise<T>,
  ): Promise<T | null> {
    try {
      // Verificar se serviço está disponível
      await this.webscrapingService.healthCheck();

      // Executar operação
      return await operacao();

    } catch (error) {
      this.logger.error(
        `Serviço de webscraping indisponível: ${error.message}`,
      );
      
      // Retornar null ou lançar exceção personalizada
      return null;
    }
  }

  /**
   * Exemplo 7: Limpar cache quando dados são atualizados manualmente
   */
  async atualizarProcessoELimparCache(numeroProcesso: string, novosDados: any) {
    try {
      // Atualizar dados no banco
      // await this.processoRepository.update(numeroProcesso, novosDados);

      // Limpar cache do SEIRN para este processo
      await this.webscrapingService.limparCache('processo');

      this.logger.log(
        `Processo ${numeroProcesso} atualizado e cache limpo`,
      );

      return true;
    } catch (error) {
      this.logger.error(`Erro ao atualizar processo: ${error.message}`);
      return false;
    }
  }

  /**
   * Exemplo 8: Verificar status do cache periodicamente
   */
  async monitorarCache() {
    try {
      const status = await this.webscrapingService.verificarCacheStatus();

      if (!status.healthy) {
        this.logger.warn('Cache Redis não está saudável!');
        // Enviar notificação, alerta, etc.
      }

      return status;
    } catch (error) {
      this.logger.error(`Erro ao verificar cache: ${error.message}`);
      return null;
    }
  }

  /**
   * Exemplo 9: Uso com Promise.all para múltiplas buscas
   */
  async buscarMultiplosProcessos(numeros: string[]) {
    try {
      const promises = numeros.map((numero) =>
        this.webscrapingService.buscarProcesso(numero, true)
          .catch((error) => {
            this.logger.warn(`Falha ao buscar ${numero}: ${error.message}`);
            return null;
          }),
      );

      const resultados = await Promise.all(promises);

      // Filtrar apenas sucessos
      const sucessos = resultados.filter(
        (r) => r && r.success && r.data,
      );

      return sucessos.map((r) => r.data);

    } catch (error) {
      this.logger.error(`Erro em busca múltipla: ${error.message}`);
      return [];
    }
  }

  /**
   * Exemplo 10: Implementar retry customizado
   */
  async buscarComRetryCustomizado(
    numeroProcesso: string,
    tentativas: number = 3,
  ) {
    for (let i = 0; i < tentativas; i++) {
      try {
        const resultado = await this.webscrapingService.buscarProcesso(
          numeroProcesso,
          i === 0, // usar cache apenas na primeira tentativa
        );

        if (resultado.success) {
          return resultado.data;
        }

        // Se não for a última tentativa, aguardar antes de tentar novamente
        if (i < tentativas - 1) {
          await this.delay(2000 * (i + 1)); // backoff exponencial
        }

      } catch (error) {
        if (i === tentativas - 1) {
          throw error;
        }
        
        this.logger.warn(
          `Tentativa ${i + 1}/${tentativas} falhou para ${numeroProcesso}`,
        );
      }
    }

    return null;
  }

  // Função auxiliar
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * EXEMPLO DE USO EM CONTROLLER
 */
/*
@Controller('processos')
export class ProcessosController {
  constructor(
    private readonly exemploIntegracaoService: ExemploIntegracaoService,
  ) {}

  @Post()
  async criarProcesso(@Body() dto: CriarProcessoDto) {
    // Opção 1: Criar com dados do SEIRN
    const processo = await this.exemploIntegracaoService
      .criarProcessoComDadosSeirn(dto.numero);

    return processo;
  }

  @Get(':numero/validar')
  async validarProcesso(@Param('numero') numero: string) {
    const valido = await this.exemploIntegracaoService
      .validarProcessoNoSeirn(numero);

    return { valido };
  }

  @Post('sincronizar')
  async sincronizar(@Body() dto: { processos: string[] }) {
    return await this.exemploIntegracaoService
      .sincronizarProcessosComSeirn(dto.processos);
  }
}
*/
