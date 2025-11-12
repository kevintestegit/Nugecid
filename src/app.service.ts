import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";

import { User } from "./modules/users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "./modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { StatusDesarquivamentoEnum } from "./modules/nugecid/domain/enums/status-desarquivamento.enum";
import { Tarefa } from "./modules/tarefas/entities/tarefa.entity";
import { Projeto } from "./modules/projetos/entities/projeto.entity";

@Injectable()
export class AppService {
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
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    // Estatísticas gerais
    const totalDesarquivamentos = await this.desarquivamentoRepository.count({
      where: { deletedAt: null },
    });

    const desarquivamentosDoMes = await this.desarquivamentoRepository.count({
      where: {
        createdAt: MoreThanOrEqual(startOfMonth),
        deletedAt: null,
      },
    });

    const desarquivamentosDaSemana = await this.desarquivamentoRepository.count(
      {
        where: {
          createdAt: MoreThanOrEqual(startOfWeek),
          deletedAt: null,
        },
      },
    );

    // Desarquivamentos em posse (status específicos)
    const emPosse = await this.desarquivamentoRepository.count({
      where: {
        status: StatusDesarquivamentoEnum.DESARQUIVADO,
        deletedAt: null,
      },
    });

    // Desarquivamentos urgentes
    const urgentes = await this.desarquivamentoRepository.count({
      where: {
        urgente: true,
        deletedAt: null,
      },
    });

    // Últimos desarquivamentos (apenas para o usuário se não for admin)
    const whereCondition =
      user.role?.name === "admin"
        ? { deletedAt: null }
        : { createdBy: user.id, deletedAt: null };

    const ultimosDesarquivamentos = await this.desarquivamentoRepository.find({
      where: whereCondition as any,
      order: { createdAt: "DESC" },
      take: 5,
      relations: ["createdByUser"],
    });

    return {
      stats: {
        total: totalDesarquivamentos,
        doMes: desarquivamentosDoMes,
        daSemana: desarquivamentosDaSemana,
        emPosse,
        urgentes,
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
    const results = [];
    const typesCounts: Record<string, number> = {};

    console.log("🔎 Iniciando busca global:", { query, types, limit, offset });

    // Validar query
    if (!query || query.trim().length < 2) {
      console.log("⚠️ Query muito curta:", query);
      return {
        results: [],
        total: 0,
        query: query || "",
        typesCounts: {},
      };
    }

    const searchTerm = `%${query.trim()}%`;
    console.log("📝 Termo de busca formatado:", searchTerm);

    // Buscar Desarquivamentos
    if (!types || types.includes("desarquivamento")) {
      try {
        console.log("📄 Buscando desarquivamentos...");
        const desarquivamentos = await this.desarquivamentoRepository
          .createQueryBuilder("des")
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
          .getMany();

        console.log(
          `✅ Encontrados ${desarquivamentos.length} desarquivamentos`,
        );
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
      } catch (error) {
        console.error("❌ Erro ao buscar desarquivamentos:", error);
      }
    }

    // Buscar Usuários
    if (!types || types.includes("usuario")) {
      try {
        console.log("👤 Buscando usuários...");
        const usuarios = await this.userRepository
          .createQueryBuilder("user")
          .leftJoinAndSelect("user.role", "role")
          .where("user.ativo = :ativo", { ativo: true })
          .andWhere(
            '(LOWER("user"."nome") LIKE LOWER(:searchTerm) OR ' +
              'LOWER("user"."usuario") LIKE LOWER(:searchTerm))',
            { searchTerm },
          )
          .take(limit)
          .skip(offset)
          .getMany();

        console.log(`✅ Encontrados ${usuarios.length} usuários`);
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
      } catch (error) {
        console.error("❌ Erro ao buscar usuários:", error);
        console.error("❌ Detalhes do erro:", error.message);
      }
    }

    // Buscar Tarefas
    if (!types || types.includes("tarefa")) {
      try {
        console.log("✅ Buscando tarefas...");
        console.log("📝 Termo de busca para tarefas:", searchTerm);

        const tarefas = await this.tarefaRepository
          .createQueryBuilder("tarefa")
          .leftJoinAndSelect("tarefa.responsavel", "responsavel")
          .leftJoinAndSelect("tarefa.projeto", "projeto")
          .where(
            '(LOWER("tarefa"."titulo") LIKE LOWER(:searchTerm) OR ' +
              'COALESCE(LOWER("tarefa"."descricao"), \'\') LIKE LOWER(:searchTerm))',
            { searchTerm },
          )
          .orderBy("tarefa.createdAt", "DESC")
          .take(limit)
          .skip(offset)
          .getMany();

        console.log(`✅ Encontrados ${tarefas.length} tarefas`);
        if (tarefas.length > 0) {
          console.log(
            "📋 Primeiras tarefas encontradas:",
            tarefas.map((t) => ({ id: t.id, titulo: t.titulo })),
          );
        }
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
      } catch (error) {
        console.error("❌ Erro ao buscar tarefas:", error);
        console.error("❌ Detalhes do erro:", error.message);
      }
    }

    // Buscar Projetos
    if (!types || types.includes("projeto")) {
      try {
        console.log("📊 Buscando projetos...");
        const projetos = await this.projetoRepository
          .createQueryBuilder("projeto")
          .leftJoinAndSelect("projeto.criador", "criador")
          .where(
            '(LOWER("projeto"."nome") LIKE LOWER(:searchTerm) OR ' +
              'LOWER("projeto"."descricao") LIKE LOWER(:searchTerm))',
            { searchTerm },
          )
          .orderBy("projeto.createdAt", "DESC")
          .take(limit)
          .skip(offset)
          .getMany();

        console.log(`✅ Encontrados ${projetos.length} projetos`);
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
      } catch (error) {
        console.error("❌ Erro ao buscar projetos:", error);
        console.error("❌ Detalhes do erro:", error.message);
      }
    }

    console.log("🎯 Total de resultados:", results.length);
    console.log("📊 Contadores por tipo:", typesCounts);

    return {
      results,
      total: results.length,
      query,
      typesCounts,
    };
  }
}
