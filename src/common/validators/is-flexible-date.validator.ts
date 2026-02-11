import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

/**
 * Validator customizado que aceita múltiplos formatos de data:
 * - YYYY-MM-DD
 * - ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
 * - Date objects
 */
export function IsFlexibleDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isFlexibleDate",
      target: (object as { constructor: new (...args: any[]) => unknown })
        .constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (value === null || value === undefined) {
            return true; // Permite valores vazios (use @IsNotEmpty se obrigatório)
          }

          // Aceita Date objects
          if (value instanceof Date) {
            return !isNaN(value.getTime());
          }

          if (typeof value !== "string") {
            return false;
          }

          // Aceita YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const date = new Date(value + "T00:00:00.000Z");
            return !isNaN(date.getTime());
          }

          // Aceita ISO 8601
          if (value.includes("T")) {
            const date = new Date(value);
            return !isNaN(date.getTime());
          }

          // Tenta parsear qualquer outro formato
          const date = new Date(value);
          return !isNaN(date.getTime());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser uma data válida (aceita YYYY-MM-DD ou ISO 8601)`;
        },
      },
    });
  };
}
