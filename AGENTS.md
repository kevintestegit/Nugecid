# AI BEHAVIOR & PROJECT RULES (LINUX ENVIRONMENT)

## 1. Project Context
- **Stack:** [React, Vite, TypeScript, TailwindCSS]
- **Architecture:** [Clean Architecture, feature-based folders]
- **Main Goal:** Sistema de gestão de documentos e desarquivamento da Polícia Científica do RN

## 2. Linux & Terminal Constraints
- **Case Sensitivity:** Linux file systems are case-sensitive. Always import files with the exact casing (e.g., `import X from './MyComponent'` matches `MyComponent.tsx`, NOT `mycomponent.tsx`).
- **Path Separators:** Always use forward slashes `/`.
- **Permissions:** If creating shell scripts (`.sh`), remind me to run `chmod +x <script>`.

## 3. Mandatory Commands
- **Install:** `pnpm install` (Use sudo only if absolutely necessary, prefer user space).
- **Run Dev:** `pnpm run dev`
- **Test:** `pnpm test:unit`
- **Build:** `pnpm build`

## 4. Coding Standards
- **Components:** Functional Components with TypeScript interfaces.
- **Styling:** Tailwind utility classes. No inline styles.
- **State Management:** Zustand. Avoid Context API for complex state.
- **Naming:** camelCase for variables/functions, PascalCase for components/classes.

## 5. Common Mistakes to Avoid
- Do not use `any` in TypeScript. Define types explicitly.
- Do not import absolute paths without `@/` alias.
- Always check authentication before API calls.
- Do not suggest Windows-specific commands (like `cls` or `dir`); use `clear` and `ls`.
