import React from "react";
import { BookOpen, ShieldCheck, Workflow } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const SobrePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/60 bg-card/85 p-6 shadow-[0_24px_55px_-42px_rgba(15,23,42,0.75)] backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-primary/70">
          Sobre o sistema
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          SGC-ITEP
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Sistema de gestão documental e acompanhamento operacional, com foco
          nos fluxos de desarquivamento, arquivo e apoio administrativo do ITEP.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/90 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Workflow className="h-5 w-5 text-primary" />
              Fluxo operacional
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Consolida consultas, anexos, termos e acompanhamento de solicitações
            em uma interface única para operação interna.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Segurança e rastreabilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            O acesso é controlado por autenticação, papéis e trilhas de
            auditoria nos pontos mais sensíveis da operação.
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-[0_18px_36px_-34px_rgba(15,23,42,0.8)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Evolução contínua
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            A aplicação segue uma evolução incremental, priorizando robustez,
            contratos consistentes e redução de legado sem reescritas amplas.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SobrePage;
