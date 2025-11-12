import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";

/**
 * Permite que um endpoint seja acessível sem autenticação JWT.
 * O `JwtAuthGuard` global irá ignorar a verificação para rotas com este decorator.
 */
export const IsPublic = () => SetMetadata(IS_PUBLIC_KEY, true);
