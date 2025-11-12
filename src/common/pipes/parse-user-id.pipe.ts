import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from "@nestjs/common";

/**
 * Pipe customizado para validar IDs de usuários
 * Fornece mensagens de erro mais específicas quando UUIDs são passados incorretamente
 */
@Injectable()
export class ParseUserIdPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    // Verifica se é um UUID (formato comum de desarquivamentos)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (uuidRegex.test(value)) {
      throw new BadRequestException(
        `ID de usuário inválido. Recebido UUID '${value}', mas esperado um número inteiro. ` +
          "Verifique se você não está confundindo IDs de usuários (numéricos) com IDs de desarquivamentos (UUIDs).",
      );
    }

    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(
        `ID de usuário inválido. '${value}' não é um número válido.`,
      );
    }

    if (val <= 0) {
      throw new BadRequestException(
        `ID de usuário inválido. O ID deve ser um número positivo, recebido: ${val}`,
      );
    }

    return val;
  }
}
