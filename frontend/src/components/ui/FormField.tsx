import React from "react";
import { cn } from "@/utils/cn";

export interface FormFieldProps {
  /** Unique id for the field. Used to wire aria-labelledby/aria-describedby. */
  id: string;
  /** Visible label text. */
  label: string;
  /** Optional helper text shown below the field. */
  helperText?: string;
  /** Error message shown below the field; when present, field is marked invalid. */
  error?: string;
  /** Indicates whether the field is required (shows an asterisk). */
  required?: boolean;
  /** Field content (input, select, textarea, etc.). */
  children: React.ReactNode;
  /** Additional classes for the wrapper. */
  className?: string;
}

/**
 * Accessible form field wrapper that wires the label, input, helper text, and error
 * together via `aria-labelledby` / `aria-describedby` so screen readers announce
 * errors when focus enters the field.
 *
 * Usage:
 *   <FormField id="nome" label="Nome" required error={errors.nome?.message}>
 *     <Input id="nome" aria-invalid={!!errors.nome} aria-describedby="nome-error" ... />
 *   </FormField>
 *
 * The error id is derived as `${id}-error`; helper text id is `${id}-helper`.
 */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  helperText,
  error,
  required,
  children,
  className,
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy =
    [helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <FieldSlot describedBy={describedBy} invalid={Boolean(error)}>
        {children}
      </FieldSlot>
      {helperText && !error && (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
};

interface FieldSlotProps {
  describedBy: string | undefined;
  invalid: boolean;
  children: React.ReactNode;
}

/**
 * Clones the single child element and injects the proper aria attributes.
 * If the child already has aria-describedby, it is preserved (rare edge case).
 */
const FieldSlot: React.FC<FieldSlotProps> = ({
  describedBy,
  invalid,
  children,
}) => {
  const child = React.Children.only(children) as React.ReactElement<{
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }>;

  const existingDescribedBy = child.props["aria-describedby"];
  const mergedDescribedBy =
    [existingDescribedBy, describedBy].filter(Boolean).join(" ") || undefined;

  return React.cloneElement(child, {
    "aria-describedby": mergedDescribedBy,
    "aria-invalid": invalid || child.props["aria-invalid"] || undefined,
  });
};
