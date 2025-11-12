import brasaorn from '@/components/img/Brasão-RN.png';
import brasaoitep from '@/components/img/Brasão-ITEP.png';

export interface RearquivamentoData {
  processNumber: string;
  dataHoraRecebimento: string;
  userName: string;
  matricula: string;
  dataAssinatura: string;
  horaAssinatura: string;
}

export const generateRearquivamentoHTML = (data: RearquivamentoData): string => {
  const baseHref = window.location.origin + (import.meta.env?.BASE_URL ?? '/');
  const toAbs = (url: string) => new URL(url, baseHref).toString();
  
  const logoRN = toAbs(brasaorn);
  const logoITEP = toAbs(brasaoitep);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Termo de Rearquivamento</title>
  <base href="${baseHref}">
  <style>
    :root {
      --page-padding-x: 10mm;
      --header-height: 115px;
      --footer-height: 80px;
    }
    * { box-sizing: border-box; }
    body {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      margin: 0;
      padding: 20mm;
      color: #000;
      min-height: 100vh;
      position: relative;
    }
    p { margin: 0; }
    .center { text-align: center; }
    .mt-8 { margin-top: 8pt; }
    .mt-16 { margin-top: 16pt; }
    .mt-24 { margin-top: 24pt; }
    .mb-0 { margin-bottom: 0; }

    .hdr { width: 100%; border-collapse: collapse; margin-bottom: 20pt; }
    .hdr td { vertical-align: top; }
    .hdr .logo { width: 95.25pt; text-align: center; }
    .hdr .miolo { width: 341.25pt; }
    .hdr .logo-dir { width: 83.25pt; text-align: left; }

    h1 { 
      margin: 16pt 0; 
      font-size: 14pt; 
      text-align: center; 
      text-transform: uppercase;
      font-weight: bold;
    }

    table.borda { 
      width: 100%; 
      border: 0.75pt solid #000; 
      border-collapse: collapse; 
      margin: 16pt 0;
    }
    table.borda td, table.borda th { 
      border: 0.75pt solid #000; 
      padding: 6pt 8pt; 
    }
    .faixa { 
      background: #bfbfbf; 
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .fs10 { font-size: 10pt; }
    .fs11 { font-size: 11pt; }
    .fs12 { font-size: 12pt; }
    .sub { font-size: 9pt; }
    .vermelho { color: red; }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin: 8pt 0;
      padding: 6pt 8pt;
      border: 1px solid #ddd;
      background: #f9f9f9;
    }
    .info-label {
      font-weight: bold;
      color: #333;
    }
    .info-value {
      color: #000;
    }

    .linha-assinatura { 
      border-bottom: 1.5pt solid #000; 
      margin: 0 auto; 
      width: 60%;
      height: 40pt;
    }
    .bloco-assinatura { 
      margin-top: 40pt; 
      page-break-inside: avoid;
    }
    .bloco-assinatura p { 
      margin: 4pt 0; 
    }
    .print-footer {
      position: absolute;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      text-align: center;
    }

    @media print {
      @page { 
        margin: 10mm; 
        size: A4;
      }
      body {
        margin: 0;
        padding: 10mm;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }
      .faixa {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-footer {
        margin-top: auto;
        padding-top: 20pt;
      }
    }
  </style>
</head>
<body>
  <table class="hdr">
    <tr>
      <td class="logo">
        <img src="${logoRN}" alt="Brasão RN" style="width:80px;height:auto;" />
      </td>
      <td class="miolo">
        <p class="center fs11 mb-0"><strong>GOVERNO DO ESTADO DO RIO GRANDE DO NORTE</strong></p>
        <p class="center fs11 mb-0"><strong>SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA E DA DEFESA SOCIAL</strong></p>
        <p class="center fs11 mb-0"><strong>POLÍCIA CIENTÍFICA DO RIO GRANDE DO NORTE</strong></p>
        <p class="center fs11 mt-8"><strong>NÚCLEO DE GESTÃO DO CONHECIMENTO, INFORMAÇÃO, DOCUMENTAÇÃO E MEMÓRIA - NUGECID</strong></p>
      </td>
      <td class="logo-dir">
        <img src="${logoITEP}" alt="Brasão ITEP" style="width:80px;height:auto;" />
      </td>
    </tr>
  </table>


  <table class="borda">
    <tr>
      <td class="fs11 center" colspan="2"><strong>PROTOCOLO DE REARQUIVAMENTO DE DOCUMENTO</strong></td>
    </tr>
    <tr>
      <td class="faixa fs11" style="width:50%;"><strong>NÚMERO:</strong></td>
      <td class="faixa fs11" style="width:50%;"><strong>DESCRIÇÃO:</strong></td>
    </tr>
    <tr>
      <td class="fs11" style="height:30pt;"></td>
      <td class="fs11" style="height:30pt;"></td>
    </tr>
  </table>

  <div class="mt-24">
    <p class="fs11"><strong>DATA:</strong> <span style="border-bottom: 1px solid #000; display: inline-block; width: 200px; margin-left: 10px;"></span></p>
  </div>

  <div class="mt-24" style="display: flex; justify-content: space-between; gap: 40px;">
    <div style="flex: 1; text-align: center;">
      <div style="border-bottom: 1px solid #000; margin: 60pt 20pt 5pt 20pt;"></div>
      <p class="fs10">NUGECID - PCIRN</p>
      <p class="fs10">Assinatura do responsável</p>
    </div>
    <div style="flex: 1; text-align: center;">
      <div style="border-bottom: 1px solid #000; margin: 60pt 20pt 5pt 20pt;"></div>
      <p class="fs10">X-Solution Tecnologia da Informação</p>
      <p class="fs10">Assinatura do responsável</p>
    </div>
  </div>

  <footer class="print-footer fs10 center">
    <hr style="border: none; border-top: 1px solid #000; margin-bottom: 10pt;" />
    <!-- Rodapé -->
      <div class="rodape fs10 center" style="line-height: 1.3;">
      <p>Polícia Científica do Rio Grande do Norte - PCIRN</p>
      <p>Núcleo de Gestão do Conhecimento, Informação Documentação e Memória - NUGECID</p>
      <p>Rua dos Campos, 293, Felipe Camarão – Natal/RN – CEP: 59.072-103 – Telefone: (84) 3232-6928</p>
      <p>Email: arquivogeral@pci.rn.gov.br</p>
      </div>
    </footer>

</body>
</html>`;
};

export const printRearquivamento = (data: RearquivamentoData): void => {
  const html = generateRearquivamentoHTML(data);
  
  const printWindow = window.open('', '_blank', 'width=900,height=650');
  if (!printWindow) {
    throw new Error('Bloqueador de pop-up impediu a abertura da janela');
  }

  printWindow.document.write(html);
  printWindow.document.close();

  const images = Array.from(printWindow.document.images);
  const triggerPrint = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 100);
  };

  if (images.length === 0) {
    triggerPrint();
  } else {
    let remaining = images.length;
    const onLoad = () => {
      remaining--;
      if (remaining === 0) {
        triggerPrint();
      }
    };
    
    images.forEach(img => {
      if (img.complete) {
        onLoad();
      } else {
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onLoad, { once: true });
      }
    });
    
    // Fallback timeout
    setTimeout(triggerPrint, 2000);
  }
};
