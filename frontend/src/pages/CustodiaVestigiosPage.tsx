import React from 'react'
import CustodiaBalistica from '@/components/custodia/balistica'

const CustodiaVestigiosPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Custódia de Vestígios
        </h1>
        <p className="text-muted-foreground">
          Alguma coisa.
        </p>
      </div>
      <CustodiaBalistica />
    </div>
  )
}

export default CustodiaVestigiosPage
