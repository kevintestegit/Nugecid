import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { RoleType } from "../users/enums/role-type.enum";

@Injectable()
export class SeedingService implements OnModuleInit {
  private readonly logger = new Logger(SeedingService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    // Safety: do not run seeding automatically in production containers
    if (process.env.NODE_ENV === "production") {
      this.logger.log(
        "Ambiente `production` detectado — seeding automático desabilitado.",
      );
      return;
    }

    this.logger.log("Iniciando o processo de seeding do banco de dados...");
    if (!(await this.tableExists("roles"))) {
      this.logger.warn(
        "[Seeding] Tabela `roles` não encontrada. Execute as migrations antes do seeding.",
      );
      return;
    }

    await this.ensureRoleSettingsColumn();
    await this.seedRoles();
    await this.updateExistingRoles();
    await this.seedAdminUser();
    this.logger.log("Seeding do banco de dados concluído.");
  }

  private async tableExists(tableName: string): Promise<boolean> {
    const result = await this.roleRepository.query(
      `SELECT to_regclass($1) as regclass`,
      [`public.${tableName}`],
    );
    return (
      Array.isArray(result) && result.length > 0 && result[0].regclass !== null
    );
  }

  private async ensureRoleSettingsColumn() {
    try {
      if (!(await this.tableExists("roles"))) {
        this.logger.warn(
          "[Seeding] Tabela `roles` ausente. Pulando criação da coluna settings.",
        );
        return;
      }

      const result = await this.roleRepository.query(
        "SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'settings' LIMIT 1",
      );

      if (!Array.isArray(result) || result.length === 0) {
        this.logger.log(
          "[Seeding] Adicionando coluna roles.settings (jsonb) ausente...",
        );
        await this.roleRepository.query(
          "ALTER TABLE roles ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb",
        );
        await this.roleRepository.query(
          `DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes WHERE tablename = 'roles' AND indexname = 'IDX_ROLES_SETTINGS'
            ) THEN
              CREATE INDEX "IDX_ROLES_SETTINGS" ON roles USING GIN (settings);
            END IF;
          END $$;`,
        );
        this.logger.log("[Seeding] Coluna roles.settings criada com sucesso.");
      }
    } catch (err) {
      this.logger.error(
        `[Seeding] Falha ao garantir coluna roles.settings: ${err?.message || err}`,
      );
    }
  }

  private async updateExistingRoles() {
    if (!(await this.tableExists("roles"))) {
      return;
    }

    const rolePermissions = {
      [RoleType.ADMIN]: [
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "roles:manage",
        "system:admin",
        "nugecid:manage",
        "audit:read",
      ],
      [RoleType.COORDENADOR]: [
        "users:read",
        "nugecid:manage",
        "nugecid:read",
        "nugecid:create",
        "nugecid:update",
        "profile:read",
        "dashboard:read",
        "reports:read",
      ],
      [RoleType.NUGECID_OPERATOR]: [
        "nugecid:read",
        "nugecid:create",
        "nugecid:update",
        "profile:read",
        "dashboard:read",
        "reports:read",
      ],
      [RoleType.USUARIO]: [
        "nugecid:read",
        "nugecid:create",
        "nugecid:update",
        "profile:read",
        "dashboard:read",
        "reports:read",
      ],
    };

    for (const [roleName, permissions] of Object.entries(rolePermissions)) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleName },
      });

      if (
        existingRole &&
        (!existingRole.permissions || existingRole.permissions.length === 0)
      ) {
        this.logger.log(`Atualizando permissões para a role: ${roleName}`);
        existingRole.permissions = permissions;
        await this.roleRepository.save(existingRole);
        this.logger.log(`Permissões atualizadas para a role: ${roleName}`);
      }
    }
  }

  private async seedRoles() {
    if (!(await this.tableExists("roles"))) {
      return;
    }

    const existingRoles = await this.roleRepository.find();
    const existingRoleNames = existingRoles.map((role) => role.name);

    const rolesToCreate = [
      {
        name: RoleType.ADMIN,
        description: "Administrador do sistema",
        permissions: [
          "users:create",
          "users:read",
          "users:update",
          "users:delete",
          "roles:manage",
          "system:admin",
          "nugecid:manage",
          "audit:read",
        ],
      },
      {
        name: RoleType.COORDENADOR,
        description: "Coordenador",
        permissions: [
          "users:read",
          "nugecid:manage",
          "nugecid:read",
          "nugecid:create",
          "nugecid:update",
          "profile:read",
          "dashboard:read",
          "reports:read",
        ],
      },
      {
        name: RoleType.NUGECID_OPERATOR,
        description: "Operador NUGECID",
        permissions: [
          "nugecid:read",
          "nugecid:create",
          "nugecid:update",
          "profile:read",
          "dashboard:read",
          "reports:read",
        ],
      },
      {
        name: RoleType.USUARIO,
        description: "Usuário padrão",
        permissions: [
          "nugecid:read",
          "nugecid:create",
          "nugecid:update",
          "profile:read",
          "dashboard:read",
          "reports:read",
        ],
      },
    ];

    const newRoles = rolesToCreate.filter(
      (role) => !existingRoleNames.includes(role.name),
    );

    if (newRoles.length > 0) {
      this.logger.log(`Criando ${newRoles.length} roles faltantes...`);
      const roleEntities = newRoles.map((role) =>
        this.roleRepository.create(role),
      );
      await this.roleRepository.save(roleEntities);
      this.logger.log(
        "Roles criadas com sucesso:",
        newRoles.map((r) => r.name).join(", "),
      );
    } else {
      this.logger.log("Todas as roles já existem.");
    }
  }

  private async seedAdminUser() {
    if (
      !(await this.tableExists("roles")) ||
      !(await this.tableExists("usuarios"))
    ) {
      this.logger.warn(
        "[Seeding] Tabelas `roles` ou `usuarios` ausentes. Pulando criação do usuário admin.",
      );
      return;
    }

    const adminRole = await this.roleRepository.findOne({
      where: { name: RoleType.ADMIN },
    });
    if (!adminRole) {
      this.logger.error(
        "Role de Admin não encontrada. Não foi possível criar ou atualizar o usuário admin.",
      );
      return;
    }

    const adminUser = await this.userRepository.findOne({
      where: { usuario: "admin" },
    });
    const hashedPassword = await bcrypt.hash("admin123", 12);

    if (adminUser) {
      this.logger.log("Usuário admin encontrado. Atualizando a senha...");
      adminUser.senha = hashedPassword;
      adminUser.role = adminRole;
      await this.userRepository.save(adminUser);
      this.logger.log("Usuário admin atualizado com sucesso.");
    } else {
      this.logger.log("Usuário admin não encontrado. Criando usuário admin...");
      const newAdminUser = this.userRepository.create({
        nome: "Administrador",
        usuario: "admin",
        senha: hashedPassword,
        ativo: true,
        role: adminRole,
      });
      await this.userRepository.save(newAdminUser);
      this.logger.log("Usuário admin criado com sucesso.");
    }
  }
}
