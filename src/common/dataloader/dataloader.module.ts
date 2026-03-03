import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../../modules/users/entities/user.entity";
import { DesarquivamentoTypeOrmEntity } from "../../modules/nugecid/infrastructure/entities/desarquivamento.typeorm-entity";
import { Pasta } from "../../modules/pastas/entities/pasta.entity";
import { UserLoader } from "./user.loader";
import { DesarquivamentoLoader } from "./desarquivamento.loader";
import { PastaLoader } from "./pasta.loader";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, DesarquivamentoTypeOrmEntity, Pasta]),
  ],
  providers: [UserLoader, DesarquivamentoLoader, PastaLoader],
  exports: [UserLoader, DesarquivamentoLoader, PastaLoader],
})
export class DataloaderModule {}
