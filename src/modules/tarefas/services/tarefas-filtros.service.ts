import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Tarefa } from "../entities/tarefa.entity";
import { FiltrosTarefasDto, FiltroPrazo, AgruparPor } from "../dto";

@Injectable()
export class TarefasFiltrosService {
  constructor(
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
  ) {}

  /**
   * Aplica filtros avançados na query
   */
  aplicarFiltros(
    query: SelectQueryBuilder<Tarefa>,
    filtros: FiltrosTarefasDto,
  ): SelectQueryBuilder<Tarefa> {
    // Filtro por projeto
    if (filtros.projetoId) {
      query.andWhere("tarefa.projetoId = :projetoId", {
        projetoId: filtros.projetoId,
      });
    }

    // Filtro por responsável
    if (filtros.responsavelId) {
      query.andWhere("tarefa.responsavelId = :responsavelId", {
        responsavelId: filtros.responsavelId,
      });
    }

    // Filtro por prioridade
    if (filtros.prioridade) {
      query.andWhere("tarefa.prioridade = :prioridade", {
        prioridade: filtros.prioridade,
      });
    }

    // Filtro por tags
    if (filtros.tags && filtros.tags.length > 0) {
      query.andWhere("tarefa.tags @> :tags", {
        tags: JSON.stringify(filtros.tags),
      });
    }

    // Filtro por prazo
    if (filtros.prazo) {
      this.aplicarFiltroPrazo(query, filtros.prazo);
    }

    // Filtro por busca (título ou descrição)
    if (filtros.busca) {
      query.andWhere(
        "(tarefa.titulo ILIKE :busca OR tarefa.descricao ILIKE :busca)",
        { busca: `%${filtros.busca}%` },
      );
    }

    // Filtro por comentários
    if (filtros.comComentarios) {
      query.andWhere(
        "EXISTS (SELECT 1 FROM comentarios WHERE comentarios.tarefa_id = tarefa.id)",
      );
    }

    // Filtro por anexos
    if (filtros.comAnexos) {
      query.andWhere(
        "EXISTS (SELECT 1 FROM anexos WHERE anexos.tarefa_id = tarefa.id)",
      );
    }

    return query;
  }

  /**
   * Aplica filtro de prazo específico
   */
  private aplicarFiltroPrazo(
    query: SelectQueryBuilder<Tarefa>,
    filtroPrazo: FiltroPrazo,
  ): void {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (filtroPrazo) {
      case FiltroPrazo.ATRASADAS:
        query.andWhere("tarefa.prazo < :hoje", { hoje });
        break;

      case FiltroPrazo.HOJE:
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        query.andWhere("tarefa.prazo >= :hoje AND tarefa.prazo < :amanha", {
          hoje,
          amanha,
        });
        break;

      case FiltroPrazo.SEMANA:
        const proximaSemana = new Date(hoje);
        proximaSemana.setDate(proximaSemana.getDate() + 7);
        query.andWhere(
          "tarefa.prazo >= :hoje AND tarefa.prazo <= :proximaSemana",
          { hoje, proximaSemana },
        );
        break;

      case FiltroPrazo.MES:
        const proximoMes = new Date(hoje);
        proximoMes.setMonth(proximoMes.getMonth() + 1);
        query.andWhere(
          "tarefa.prazo >= :hoje AND tarefa.prazo <= :proximoMes",
          { hoje, proximoMes },
        );
        break;

      case FiltroPrazo.SEM_PRAZO:
        query.andWhere("tarefa.prazo IS NULL");
        break;
    }
  }

  /**
   * Busca tarefas com filtros aplicados
   */
  async buscarComFiltros(filtros: FiltrosTarefasDto): Promise<Tarefa[]> {
    let query = this.tarefaRepository
      .createQueryBuilder("tarefa")
      .leftJoinAndSelect("tarefa.responsavel", "responsavel")
      .leftJoinAndSelect("tarefa.coluna", "coluna")
      .leftJoinAndSelect("tarefa.projeto", "projeto")
      .leftJoinAndSelect("tarefa.comentarios", "comentarios")
      .leftJoinAndSelect("tarefa.anexos", "anexos")
      .leftJoinAndSelect("tarefa.checklists", "checklists");

    query = this.aplicarFiltros(query, filtros);

    // Ordenação padrão
    query.orderBy("tarefa.ordem", "ASC");

    return await query.getMany();
  }

  /**
   * Agrupa tarefas por critério
   */
  async agruparTarefas(
    tarefas: Tarefa[],
    agruparPor: AgruparPor,
  ): Promise<Record<string, Tarefa[]>> {
    const grupos: Record<string, Tarefa[]> = {};

    switch (agruparPor) {
      case AgruparPor.RESPONSAVEL:
        tarefas.forEach((tarefa) => {
          const chave = tarefa.responsavel?.nome || "Sem Responsável";
          if (!grupos[chave]) grupos[chave] = [];
          grupos[chave].push(tarefa);
        });
        break;

      case AgruparPor.PRIORIDADE:
        tarefas.forEach((tarefa) => {
          const chave = tarefa.prioridade || "Sem Prioridade";
          if (!grupos[chave]) grupos[chave] = [];
          grupos[chave].push(tarefa);
        });
        break;

      case AgruparPor.PRAZO:
        tarefas.forEach((tarefa) => {
          let chave = "Sem Prazo";
          if (tarefa.prazo) {
            const diasRestantes = tarefa.getDaysUntilDue();
            if (diasRestantes === null) {
              chave = "Sem Prazo";
            } else if (diasRestantes < 0) {
              chave = "Atrasadas";
            } else if (diasRestantes === 0) {
              chave = "Hoje";
            } else if (diasRestantes <= 7) {
              chave = "Esta Semana";
            } else if (diasRestantes <= 30) {
              chave = "Este Mês";
            } else {
              chave = "Futuro";
            }
          }
          if (!grupos[chave]) grupos[chave] = [];
          grupos[chave].push(tarefa);
        });
        break;

      case AgruparPor.TAGS:
        tarefas.forEach((tarefa) => {
          if (tarefa.tags && tarefa.tags.length > 0) {
            tarefa.tags.forEach((tag) => {
              if (!grupos[tag]) grupos[tag] = [];
              grupos[tag].push(tarefa);
            });
          } else {
            const chave = "Sem Tags";
            if (!grupos[chave]) grupos[chave] = [];
            grupos[chave].push(tarefa);
          }
        });
        break;
    }

    return grupos;
  }

  /**
   * Busca e agrupa tarefas
   */
  async buscarEAgrupar(
    filtros: FiltrosTarefasDto,
  ): Promise<{ tarefas: Tarefa[]; grupos?: Record<string, Tarefa[]> }> {
    const tarefas = await this.buscarComFiltros(filtros);

    if (filtros.agruparPor) {
      const grupos = await this.agruparTarefas(tarefas, filtros.agruparPor);
      return { tarefas, grupos };
    }

    return { tarefas };
  }

  /**
   * Estatísticas de tarefas por filtros
   */
  async getEstatisticas(filtros: FiltrosTarefasDto): Promise<{
    total: number;
    porPrioridade: Record<string, number>;
    porStatus: Record<string, number>;
    atrasadas: number;
    semPrazo: number;
  }> {
    const tarefas = await this.buscarComFiltros(filtros);

    const porPrioridade: Record<string, number> = {};
    const porStatus: Record<string, number> = {};
    let atrasadas = 0;
    let semPrazo = 0;

    tarefas.forEach((tarefa) => {
      // Por prioridade
      porPrioridade[tarefa.prioridade] =
        (porPrioridade[tarefa.prioridade] || 0) + 1;

      // Por status (nome da coluna)
      const status = tarefa.coluna?.nome || "Sem Coluna";
      porStatus[status] = (porStatus[status] || 0) + 1;

      // Atrasadas
      if (tarefa.isOverdue()) {
        atrasadas++;
      }

      // Sem prazo
      if (!tarefa.prazo) {
        semPrazo++;
      }
    });

    return {
      total: tarefas.length,
      porPrioridade,
      porStatus,
      atrasadas,
      semPrazo,
    };
  }
}
