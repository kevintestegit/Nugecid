import React, { useState, useEffect, InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

type ValidationRule = {
  validate: (value: string) => boolean;
  message: string;
};

interface ValidatedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  hint?: string;
  rules?: ValidationRule[];
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showValidIcon?: boolean;
  value?: string;
  onChange?: (value: string, isValid: boolean) => void;
  required?: boolean;
  containerClassName?: string;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  hint,
  rules = [],
  validateOnChange = true,
  validateOnBlur = true,
  showValidIcon = true,
  value = '',
  onChange,
  required = false,
  containerClassName,
  type = 'text',
  className,
  disabled,
  placeholder,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validate = (val: string): string[] => {
    const validationErrors: string[] = [];

    // Required validation
    if (required && !val.trim()) {
      validationErrors.push('Este campo é obrigatório');
      return validationErrors;
    }

    // Custom rules
    for (const rule of rules) {
      if (!rule.validate(val)) {
        validationErrors.push(rule.message);
      }
    }

    return validationErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (validateOnChange && touched) {
      const validationErrors = validate(newValue);
      setErrors(validationErrors);
      onChange?.(newValue, validationErrors.length === 0);
    } else {
      onChange?.(newValue, true);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (validateOnBlur) {
      const validationErrors = validate(inputValue);
      setErrors(validationErrors);
      onChange?.(inputValue, validationErrors.length === 0);
    }
  };

  const hasErrors = touched && errors.length > 0;
  const isValid = touched && errors.length === 0 && (inputValue.trim().length > 0 || required);
  const showPasswordToggle = type === 'password';
  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 border rounded-md bg-background text-foreground transition-all',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            hasErrors && 'border-red-500 focus:ring-red-500',
            isValid && 'border-green-500 focus:ring-green-500',
            !hasErrors && !isValid && 'border-border focus:ring-primary',
            (showValidIcon && (isValid || hasErrors)) && 'pr-10',
            showPasswordToggle && 'pr-10',
            className
          )}
        />

        {/* Validation Icons */}
        {showValidIcon && isValid && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
        )}
        {showValidIcon && hasErrors && (
          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
        )}

        {/* Password Toggle */}
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Hint */}
      {hint && !hasErrors && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {hint}
        </p>
      )}

      {/* Error Messages */}
      {hasErrors && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3 flex-shrink-0" />
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// Common validation rules
export const ValidationRules = {
  email: (): ValidationRule => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Digite um e-mail válido',
  }),

  minLength: (length: number): ValidationRule => ({
    validate: (value: string) => value.length >= length,
    message: `Mínimo de ${length} caracteres`,
  }),

  maxLength: (length: number): ValidationRule => ({
    validate: (value: string) => value.length <= length,
    message: `Máximo de ${length} caracteres`,
  }),

  password: (): ValidationRule => ({
    validate: (value: string) =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(value),
    message: 'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais',
  }),

  numeric: (): ValidationRule => ({
    validate: (value: string) => /^\d+$/.test(value),
    message: 'Digite apenas números',
  }),

  phone: (): ValidationRule => ({
    validate: (value: string) => /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/.test(value),
    message: 'Digite um telefone válido: (XX) XXXXX-XXXX',
  }),

  cpf: (): ValidationRule => ({
    validate: (value: string) => {
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) return false;
      // Validação básica de CPF
      return true; // Implementar validação completa se necessário
    },
    message: 'Digite um CPF válido',
  }),

  url: (): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Digite uma URL válida',
  }),

  match: (otherValue: string, fieldName: string): ValidationRule => ({
    validate: (value: string) => value === otherValue,
    message: `Os campos ${fieldName} não coincidem`,
  }),

  custom: (validator: (value: string) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
};

export default ValidatedInput;
