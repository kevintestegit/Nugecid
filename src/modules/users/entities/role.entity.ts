import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true, nullable: false })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({
    name: "settings",
    type: "jsonb",
    nullable: true,
    default: () => "'{}'::jsonb",
    select: false,
  })
  settings?: {
    theme?: "light" | "dark";
    notifications?: {
      email?: boolean;
      push?: boolean;
      desktop?: boolean;
      sound?: boolean;
    };
  };

  @Column({
    type: "text",
    nullable: true,
    transformer: {
      to: (value: string[]) => (value ? JSON.stringify(value) : null),
      from: (value: any) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          try {
            return JSON.parse(value);
          } catch {
            return [];
          }
        }
        // If it's already an object (e.g. parsed by driver), try to return it as array
        return value;
      },
    },
  })
  permissions: string[];

  @Column({ name: "ativo", type: "boolean", default: true })
  ativo: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  // Métodos
  hasPermission(permission: string): boolean {
    return this.permissions?.includes(permission) || false;
  }

  isAdmin(): boolean {
    return this.name === "admin";
  }

  isEditor(): boolean {
    return this.name === "editor";
  }
}
