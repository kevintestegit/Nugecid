import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import CustodiaBalistica from "@/components/custodia/balistica";

const CustodiaVestigiosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Custódia de Vestígios
        </h1>
        <p className="text-muted-foreground">
          Visualização das etiquetas geradas para o SIGEP (exemplo ilustrativo).
        </p>
        <Alert>
          <AlertTitle>Pré-visualização</AlertTitle>
          <AlertDescription>
            Esta área é apenas para demonstrar como as etiquetas serão montadas
            quando forem inseridas no SIGEP. Nenhum dado é enviado ou gravado
            aqui.
          </AlertDescription>
        </Alert>
      </div>
      <CustodiaBalistica />
    </div>
  );
};

export default CustodiaVestigiosPage;
