import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, FileText, ClipboardList, Calendar, User, AlertTriangle, MessageCircle, Send, Loader2, Printer } from 'lucide-react'
import { useDesarquivamento, useDesarquivamentoComments, useAddDesarquivamentoComment } from '@/hooks/useDesarquivamentos'
import { getStatusLabel, getTipoDesarquivamentoLabel, formatDate } from '@/utils/format'
import { formatDateTime } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface DesarquivamentoDetailModalProps {
  id: number
  onClose: () => void
}

export const DesarquivamentoDetailModal: React.FC<DesarquivamentoDetailModalProps> = ({ id, onClose }) => {
  const { data: response, isLoading } = useDesarquivamento(id)
  const navigate = useNavigate()
  const item = response?.data
  const { data: commentsResponse, isLoading: isLoadingComments } = useDesarquivamentoComments(id)
  const comments = commentsResponse?.data ?? []
  const addCommentMutation = useAddDesarquivamentoComment(id)
  const [commentText, setCommentText] = useState('')
  const { user } = useAuth()

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) {
      toast.error('Digite um comentário antes de enviar.')
      return
    }

    try {
      await addCommentMutation.mutateAsync(trimmed)
      setCommentText('')
      toast.success('Comentário adicionado com sucesso.')
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Não foi possível adicionar o comentário.'
      toast.error(message)
    }
  }

  const handleEdit = () => {
    onClose()
    navigate(`/desarquivamentos/${id}/editar`)
  }

  const placeholderTemplate = useMemo(
    () => ({
      processoEletronico: '{{processo_eletronico}}',
      tipoDocumentoPrimeiroItem: '{{tipo_documento_1}}',
      nomePrimeiroItem: '{{nome_1}}',
      numeroPrimeiroItem: '{{numero_1}}',
    }),
    [],
  )

  const handlePrintTerm = () => {
    if (!item) {
      toast.error('Nao foi possivel localizar os dados para gerar o termo.')
      return
    }

    const escapeHtml = (value: unknown): string => {
      if (value === null || value === undefined) {
        return ''
      }
      return String(value).replace(/[&<>"']/g, match => ({'&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' }[match] || match))
    }

    const rawItems = Array.isArray((item as any)?.itens) ? ((item as any).itens as any[]) : []
    const identifiers = (item.numeroNicLaudoAuto || '')
      .split(/[,;]+/)
      .map(part => part.trim())
      .filter(Boolean)
    const fallbackIdentifiers = identifiers.length > 0 ? identifiers : [item.numeroNicLaudoAuto || '-']

    const inferredQuantity =
      typeof item.quantidadeItens === 'number' && item.quantidadeItens > 0
        ? item.quantidadeItens
        : rawItems.length > 0
          ? rawItems.length
          : fallbackIdentifiers.length
    const normalizedQuantity = inferredQuantity > 0 ? inferredQuantity : 1

    const baseType = escapeHtml(item.tipoDocumento || getTipoDesarquivamentoLabel(item.tipoDesarquivamento as any))

    const detailRows = fallbackIdentifiers.map((code, index) => {
      const current = rawItems[index]
      const typeValue =
        current && typeof current === 'object'
          ? (current?.tipo ?? current?.tipoDocumento ?? current?.descricaoTipo)
          : undefined
      const nameValue =
        current && typeof current === 'object'
          ? (current?.nome ?? current?.registro ?? current?.titulo)
          : undefined
      const observationValue =
        current && typeof current === 'object'
          ? (current?.observacao ?? current?.descricao ?? current?.detalhe)
          : undefined

      return {
        index: index + 1,
        type: escapeHtml(typeValue ?? baseType),
        name: escapeHtml(nameValue ?? item.nomeCompleto ?? '-'),
        code: escapeHtml(code ?? '-'),
        observation: escapeHtml(observationValue ?? ''),
      }
    })

    const processNumber = escapeHtml(item.numeroProcesso || fallbackIdentifiers[0] || item.numeroNicLaudoAuto || String(item.id ?? '-'))
    const dataRetiradaBase = item.dataDesarquivamentoSAG || item.updatedAt || item.dataSolicitacao
    const dataRetirada = escapeHtml(dataRetiradaBase ? formatDate(dataRetiradaBase) : '-')
    const tipoDocumentoPrincipal = baseType
    const nomeRegistro = escapeHtml(item.nomeCompleto ?? '-')

    const rowsHtml = detailRows
      .map(row => {
        const isFirstRow = row.index === 1
        const typeCell = isFirstRow ? placeholderTemplate.tipoDocumentoPrimeiroItem : row.type
        const nameCell = isFirstRow ? placeholderTemplate.nomePrimeiroItem : row.name
        const numberCell = isFirstRow ? placeholderTemplate.numeroPrimeiroItem : row.code

        return `
      <tr>
        <td>${row.index}</td>
        <td>${typeCell}</td>
        <td>${nameCell}</td>
        <td>${numberCell}</td>
        <td>${row.observation || '-'}</td>
      </tr>`
      })
      .join('')

    const templateHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Termo de Desarquivamento</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; margin: 48px; color: #111827; }
    h1 { font-size: 22px; margin-bottom: 8px; text-transform: uppercase; }
    .intro { font-size: 13px; line-height: 1.6; margin-bottom: 18px; color: #1f2937; }
    .intro p { margin: 0 0 12px 0; }
    .process-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .process-table th, .process-table td { border: 1px solid #d1d5db; padding: 10px 12px; font-size: 13px; text-align: left; }
    .process-table thead th { background: #f3f4f6; font-weight: 600; }
    .process-table .header-row th { text-align: center; font-size: 12px; letter-spacing: 0.5px; }
    .process-table .subtitle { display: block; font-size: 11px; color: #4b5563; font-weight: normal; }
    .process-number { text-align: center; font-weight: 600; text-transform: uppercase; padding: 12px 10px; background: #f9fafb; }
    .summary-row { background: #f9fafb; font-size: 12px; color: #1f2937; }
    .summary-cell { padding: 12px; }
    .summary-content { display: flex; flex-wrap: wrap; gap: 12px; row-gap: 8px; }
    .summary-content span { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
    .summary-content strong { text-transform: uppercase; font-size: 11px; letter-spacing: 0.4px; }
    .summary-content .separator { color: #9ca3af; font-weight: normal; }
    .signature-table { width: 100%; border-collapse: collapse; margin-top: 32px; }
    .signature-table th, .signature-table td { border: 1px solid #d1d5db; padding: 12px; font-size: 12px; vertical-align: top; }
    .signature-table th { background: #f9fafb; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
    .signature-table th span { display: block; font-size: 10px; font-weight: 500; text-transform: none; margin-top: 2px; color: #4b5563; }
    .signature-block { margin-bottom: 16px; }
    .signature-line { border-bottom: 1px solid #9ca3af; height: 28px; margin-bottom: 6px; }
    .signature-label { font-size: 11px; color: #4b5563; text-transform: uppercase; letter-spacing: 0.4px; }
    .note { font-size: 11px; color: #374151; margin-top: 28px; line-height: 1.6; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>
  <header>
    <h1>Termo de Desarquivamento de Documento</h1>
  </header>

  <section class="intro">
    <p>Ao servidor responsavel pelo desarquivamento compete ter ciencia que esta solicitacao de desarquivamento de documento deve estar vinculada a uma demanda do Instituto Tecnico-Cientifico de Pericia do Rio Grande do Norte, ou jurisdicao de orgao publico atraves de autoridade competente.</p>
    <p>Estar ciente quanto as orientacoes e normativas descritas na portaria no 188/2023-GDG/ITEP no DOE no 15433 de 25/05/2023, que dispoe sobre o acesso e o fluxo de desarquivamento de documentos no ambito do Setor de Arquivo Geral do Instituto Tecnico-Cientifico do Rio Grande do Norte.</p>
  </section>

  <table class="process-table">
    <thead>
      <tr class="header-row">
        <th colspan="4">No. de Processo Eletronico</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colspan="4" class="process-number">${placeholderTemplate.processoEletronico}</td>
      </tr>
      <tr class="summary-row">
        <td colspan="4" class="summary-cell">
          <div class="summary-content">
            <span><strong>Quantidade de itens:</strong> ${normalizedQuantity}</span>
            <span class="separator">|</span>
            <span><strong>Tipo de documento:</strong> ${tipoDocumentoPrincipal}</span>
            <span class="separator">|</span>
            <span><strong>Nome:</strong> ${nomeRegistro}</span>
            <span class="separator">|</span>
            <span><strong>Data da retirada:</strong> ${dataRetirada}</span>
          </div>
        </td>
      </tr>
      <tr class="header-row">
        <th>Item</th>
        <th>Tipo de documento<span class="subtitle">Ex: Prontuario, Laudo, Parecer, Relatorio.</span></th>
        <th>Nome</th>
        <th>Numero</th>
      </tr>
      ${rowsHtml}
    </tbody>
  </table>

  <table class="signature-table">
    <thead>
      <tr>
        <th>Setor de Arquivo Geral<span>Responsavel pela entrega</span></th>
        <th>Setor solicitante<span>Responsavel pelo recebimento</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura</div>
          </div>
        </td>
        <td>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do servidor</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Setor</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Matricula</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Data da retirada</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Data da devolucao</div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>

  <p class="note">* Observar as orientacoes da portaria no 188/2023-GDG/ITEP no DOE no 15433 de 25/05/2023, que dispoe quanto aos prazos e instrucoes normativas.</p>
</body>
</html>`

    const placeholderValues: Record<string, string> = {
      [placeholderTemplate.processoEletronico]: processNumber,
      [placeholderTemplate.tipoDocumentoPrimeiroItem]: detailRows[0]?.type ?? '-',
      [placeholderTemplate.nomePrimeiroItem]: detailRows[0]?.name ?? '-',
      [placeholderTemplate.numeroPrimeiroItem]: detailRows[0]?.code ?? '-',
    }

    const html = Object.entries(placeholderValues).reduce((result, [placeholder, value]) => {
      return result.split(placeholder).join(value)
    }, templateHtml)

    const printWindow = window.open('', '_blank', 'width=900,height=650')
    if (!printWindow) {
      toast.error('Nao foi possivel abrir a janela de impressao.')
      return
    }

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 200)
  }
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Detalhes da Solicitação</h3>
              <p className="text-sm text-gray-500">Informações completas do desarquivamento</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : item ? (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Desarquivamento</div>
                  <div className="text-sm font-medium">{getTipoDesarquivamentoLabel(item.tipoDesarquivamento as any)}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {getStatusLabel(item.status as any)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Data de Solicitação</div>
                  <div className="text-sm font-medium">{formatDate(item.dataSolicitacao || (item as any).createdAt)}</div>
                </div>
              </div>

              {/* Dados principais */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Dados do Documento</h4>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="Nome completo" value={item.nomeCompleto} />
                  <Detail label="Nº NIC/Laudo/Auto" value={item.numeroNicLaudoAuto?.startsWith('MISSING-') ? 'N/A' : item.numeroNicLaudoAuto} />
                  <Detail label="Nº Processo" value={item.numeroProcesso} />
                  <Detail label="Tipo de Documento" value={item.tipoDocumento} />
                </div>
              </div>

              {/* Datas e Setor */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Prazos e Movimentação</h4>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="Data Desarquivamento - SAG" value={item.dataDesarquivamentoSAG ? formatDate(item.dataDesarquivamentoSAG) : '-'} />
                  <Detail label="Data Devolução pelo Setor" value={item.dataDevolucaoSetor ? formatDate(item.dataDevolucaoSetor) : '-'} />
                  <Detail label="Setor Demandante" value={item.setorDemandante} />
                  <Detail label="Servidor Responsável" value={item.servidorResponsavel} />
                </div>
              </div>

              {/* Finalidade e flags */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Finalidade e Indicadores</h4>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="Finalidade" value={item.finalidadeDesarquivamento} />
                  <Detail label="Prorrogação" value={item.solicitacaoProrrogacao ? 'Sim' : 'Não'} />
                  {(item as any).urgente !== undefined && (
                    <div className="md:col-span-2">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium ${item.urgente ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                        <AlertTriangle className="h-3 w-3" />
                        {item.urgente ? 'Urgente' : 'Não urgente'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Comentários</h4>
                </div>
                <div className="p-4 space-y-4">
                  <form onSubmit={handleSubmitComment} className="space-y-2">
                    <textarea
                      className="w-full min-h-[90px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Escreva um comentário sobre esta solicitação..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      maxLength={2000}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Registrado como <strong>{user?.nome || user?.usuario || 'Usuário'}</strong>
                      </span>
                      <button
                        type="submit"
                        disabled={addCommentMutation.isPending}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Enviar Comentário
                      </button>
                    </div>
                  </form>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {isLoadingComments ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-gray-500">Nenhum comentário registrado até o momento.</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="border border-gray-200 rounded-md px-3 py-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span className="font-medium text-gray-700">{comment.authorName}</span>
                            <span>{formatDateTime(comment.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{comment.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500">Registro não encontrado</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrintTerm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir Termo
          </button>
          <button
            onClick={handleEdit}
            className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

const Detail = ({ label, value }: { label: string; value?: any }) => (
  <div>
    <div className="text-xs text-gray-500 mb-1">{label}</div>
    <div className="text-sm text-gray-900 break-words">{value || '-'}</div>
  </div>
)

export default DesarquivamentoDetailModal