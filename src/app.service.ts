import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./modules/users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "./modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "./modules/nugecid/domain/enums/status-desarquivamento.enum";
import { Tarefa } from "./modules/tarefas/entities/tarefa.entity";
import { Projeto } from "./modules/tarefas/entities/projeto.entity";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DesarquivamentoTypeOrmEntity)
    private readonly desarquivamentoRepository: Repository<DesarquivamentoTypeOrmEntity>,
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,
    @InjectRepository(Projeto)
    private readonly projetoRepository: Repository<Projeto>,
  ) {}

  async getDashboardData(user: any) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Otimizado: usar Promise.all para executar queries em paralelo
    const [
      statsResult,
      ultimosDesarquivamentos,
    ] = await Promise.all([
      // Uma única query para todas as estatísticas
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .select("COUNT(*)", "total")
        .addSelect(
          `SUM(CASE WHEN d.createdAt >= :startOfMonth THEN 1 ELSE 0 END)`,
          "doMes",
        )
        .addSelect(
          `SUM(CASE WHEN d.createdAt >= :startOfWeek THEN 1 ELSE 0 END)`,
          "daSemana",
        )
        .addSelect(
          `SUM(CASE WHEN d.status = :statusDesarquivado THEN 1 ELSE 0 END)`,
          "emPosse",
        )
        .addSelect(
          `SUM(CASE WHEN d.urgente = true THEN 1 ELSE 0 END)`,
          "urgentes",
        )
        .where("d.deletedAt IS NULL")
        .setParameters({
          startOfMonth,
          startOfWeek,
          statusDesarquivado: StatusDesarquivamentoEnum.DESARQUIVADO,
        })
        .getRawOne(),

      // Últimos desarquivamentos
      this.desarquivamentoRepository
        .createQueryBuilder("d")
        .leftJoinAndSelect("d.criadoPor", "criadoPor")
        .where("d.deletedAt IS NULL")
        .andWhere(
          user.role?.name === "admin" ? "1=1" : "d.criadoPorId = :userId",
          { userId: user.id },
        )
        .orderBy("d.createdAt", "DESC")
        .take(5)
        .getMany(),
    ]);

    return {
      stats: {
        total: parseInt(statsResult.total, 10) || 0,
        doMes: parseInt(statsResult.doMes, 10) || 0,
        daSemana: parseInt(statsResult.daSemana, 10) || 0,
        emPosse: parseInt(statsResult.emPosse, 10) || 0,
        urgentes: parseInt(statsResult.urgentes, 10) || 0,
      },
      ultimosDesarquivamentos,
    };
  }

  /**
   * Health check da aplicação
   */
  getHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
    };
  }

  /**
   * Busca global no sistema
   */
  async globalSearch(params: {
    query: string;
    types?: string[];
    limit?: number;
    offset?: number;
  }) {
    const { query, types, limit = 10, offset = 0 } = params;
    const results: any[] = [];
    const typesCounts: Record<string, number> = {};

    // Validar query
    if (!query || query.trim().length < 2) {
      return {
        results: [],
        total: 0,
        query: query || "",
        typesCounts: {},
      };
    }

    const searchTerm = `%${query.trim()}%`;

    // Executar todas as buscas em paralelo
    const searchPromises: Promise<void>[] = [];

    // Buscar Desarquivamentos
    if (!types || types.includes("desarquivamento")) {
      searchPromises.push(
        this.desarquivamentoRepository
          .createQueryBuilder("des")
          .select([
            "des.id",
            "des.numeroSolicitacao",
            "des.tipoDesarquivamento",
            "des.nomeCompleto",
            "des.numeroNicLaudoAuto",
            "des.numeroProcesso",
            "des.status",
            "des.setorDemandante",
            "des.dataSolicitacao",
          ])
          .where("des.deletedAt IS NULL")
          .andWhere(
            "(LOWER(des.nomeCompleto) LIKE LOWER(:searchTerm) OR " +
              "LOWER(des.numeroNicLaudoAuto) LIKE LOWER(:searchTerm) OR " +
              "LOWER(des.numeroProcesso) LIKE LOWER(:searchTerm) OR " +
              "LOWER(des.setorDemandante) LIKE LOWER(:searchTerm) OR " +
              "LOWER(des.servidorResponsavel) LIKE LOWER(:searchTerm))",
            { searchTerm },
          )
          .orderBy("des.createdAt", "DESC")
          .take(limit)
          .skip(offset)
          .getMany()
          .then((desarquivamentos) => {
            typesCounts["desarquivamento"] = desarquivamentos.length;
            desarquivamentos.forEach((des) => {
              results.push({
                id: des.id,
                type: "desarquivamento",
                title: `Solicitação #${des.numeroSolicitacao}`,
                subtitle: `${des.tipoDesarquivamento} - ${des.nomeCompleto}`,
                description: `NIC/Laudo/Auto: ${des.numeroNicLaudoAuto} | Processo: ${des.numeroProcesso}`,
                url: `/desarquivamentos/${des.id}`,
                metadata: {
                  status: des.status,
                  setor: des.setorDemandante,
                  dataSolicitacao: des.dataSolicitacao,
                },
              });
            });
          })
          .catch((error) => {
            this.logger.error("Erro ao buscar desarquivamentos:", error.message);
          }),
      );
    }

    // Buscar Usuários
    if (!types || types.includes("usuario")) {
      searchPromises.push(
        this.userRepository
          .createQueryBuilder("user")
          .leftJoinAndSelect("user.role", "role")
          .select(["user.id", "user.nome", "user.usuario", "role.name"])
          .where("user.ativo = :ativo", { ativo: true })
          .andWhere(
            '(LOWER("user"."nome") LIKE LOWER(:searchTerm) OR ' +
              'LOWER("user"."usuario") LIKE LOWER(:searchTerm))',
            { searchTerm },
          )
          .take(limit)
          .skip(offset)
          .getMany()
          .then((usuarios) => {
            typesCounts["usuario"] = usuarios.length;
            usuarios.forEach((user) => {
              results.push({
                id: user.id,
                type: "usuario",
                title: user.nome,
                subtitle: user.usuario,
                description: user.role?.name || "Usuário",
                url: `/usuarios/${user.id}`,
                metadata: {
                  role: user.role?.name,
                },
              });
            });
          })
          .catch((error) => {
            this.logger.error("Erro ao buscar usuários:", error.message);
          }),
      );
    }

    // Buscar Tarefas
    if (!types || types.includes("tarefa")) {
      searchPromises.push(
        this.tarefaRepository
          .createQueryBuilder("tarefa")
          .leftJoin("tarefa.responsavel", "responsavel")
          .leftJoin("tarefa.projeto", "projeto")
          .select([
            "tarefa.id",
            "tarefa.titulo",
            "tarefa.descricao",
            "tarefa.prioridade",
            "tarefa.prazo",
            "responsavel.nome",
            "projeto.nome",
          ])
          .where(
            '(LOWER("tarefa"."titulo") LIKE LOWER(:searchTerm) OR ' +
              'COALESCE(LOWER("tarefa"."descricao"), \'\') LIKE LOWER(:searchTerm))',
            { searchTerm },
          )
          .orderBy("tarefa.createdAt", "DESC")
          .take(limit)
          .skip(offset)
          .getMany()
          .then((tarefas) => {
            typesCounts["tarefa"] = tarefas.length;
            tarefas.forEach((tarefa) => {
              results.push({
                id: tarefa.id,
                type: "tarefa",
                title: tarefa.titulo,
                subtitle: tarefa.projeto?.nome || "Sem projeto",
                description: tarefa.descricao?.substring(0, 100) || "",
                url: `/tarefas/${tarefa.id}`,
                metadata: {
                  prioridade: tarefa.prioridade,
                  responsavel: tarefa.responsavel?.nome,
                  prazo: tarefa.prazo,
                },
              });
            });
          })
          .catch((error) => {
            this.logger.error("Erro ao buscar tarefas:", error.message);
          }),
      );
    }

    // Buscar Projetos
    if (!types || types.includes("projeto")) {
      searchPromises.push(
        this.projetoRepository
          .createQueryBuilder("projeto")
          .leftJoin("projeto.criador", "criador")
          .select([
            "projeto.id",
            "projeto.nome",
            "projeto.descricao",
            "projeto.createdAt",
            "criador.nome",
          ])
          .where(
            '(LOWER("projeto"."nome") LIKE LOWER(:searchTerm) OR ' +
              'LOWER("projeto"."descricao") LIKE LOWER(:searchTerm))',
            { searchTerm },
          )
          .orderBy("projeto.createdAt", "DESC")
          .take(limit)
          .skip(offset)
          .getMany()
          .then((projetos) => {
            typesCounts["projeto"] = projetos.length;
            projetos.forEach((projeto) => {
              results.push({
                id: projeto.id,
                type: "projeto",
                title: projeto.nome,
                subtitle: `Criado por ${projeto.criador?.nome || "Desconhecido"}`,
                description: projeto.descricao?.substring(0, 100) || "",
                url: `/projetos/${projeto.id}`,
                metadata: {
                  cor: (projeto as Record<string, any>).cor,
                  dataCriacao: projeto.createdAt,
                },
              });
            });
          })
          .catch((error) => {
            this.logger.error("Erro ao buscar projetos:", error.message);
          }),
      );
    }

    // Aguardar todas as buscas em paralelo
    await Promise.all(searchPromises);

    return {
      results,
      total: results.length,
      query,
      typesCounts,
    };
  }
}
