import React, { useState, useEffect } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'
import Captions from 'yet-another-react-lightbox/plugins/captions'
import 'yet-another-react-lightbox/styles.css'
import 'yet-another-react-lightbox/plugins/captions.css'
import { DesarquivamentoAnexo } from '@/hooks/useDesarquivamentosAnexos'

export type PreviewAttachment = Omit<Partial<DesarquivamentoAnexo>, 'id'> & {
  id: number | string
  nomeOriginal: string
  previewUrl?: string
  url?: string
  tipoMime?: string
  tamanhoBytes?: number | string
  createdAt?: string
  usuario?: { nome?: string } | null
}

const inferMimeFromFileName = (name?: string): string | undefined => {
  if (!name) return undefined

  const ext = name.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'bmp':
      return 'image/bmp'
    default:
      return undefined
  }
}

const formatBytes = (value?: number | string): string | null => {
  if (value === undefined || value === null) return null
  const numeric = typeof value === 'string' ? Number(value) : value
  if (!Number.isFinite(numeric) || numeric < 0) return null
  if (numeric === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(numeric) / Math.log(1024)), units.length - 1)
  const size = numeric / Math.pow(1024, exponent)

  return `${size.toFixed(exponent === 0 ? 0 : size >= 100 ? 0 : 1)} ${units[exponent]}`
}

interface ImagePreviewModalProps {
  anexo: PreviewAttachment | null
  previewUrl: string | null
  onClose: () => void
  onUpdateDescricao?: (anexoId: number | string, descricao: string) => Promise<void>
  onDownload?: (anexoId: number | string) => void
  canEdit?: boolean
  // Lista de todas as imagens para navegação
  allImages?: PreviewAttachment[]
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  anexo,
  previewUrl,
  onClose,
  onUpdateDescricao,
  onDownload,
  canEdit = false,
  allImages = []
}) => {
  // Priorizar o previewUrl do prop (blob URL) em vez do anexo.previewUrl (API URL)
  const resolvedPreviewUrl = previewUrl || anexo?.previewUrl || anexo?.url || null
  const isOpen = Boolean(resolvedPreviewUrl && anexo)

  if (!isOpen || !anexo) return null

  const resolvedMime = (anexo.tipoMime ?? inferMimeFromFileName(anexo.nomeOriginal) ?? '').toLowerCase()
  const isPdf = resolvedMime === 'application/pdf'
  const formattedSize = formatBytes(anexo.tamanhoBytes)
  const uploadedBy = anexo.usuario?.nome
  const uploadedAt = anexo.createdAt
    ? new Date(anexo.createdAt).toLocaleDateString('pt-BR')
    : null

  // Criar slides para todas as imagens ou apenas a atual
  const imagesToShow = allImages.length > 0 ? allImages : [anexo]
  
  const slides = imagesToShow.map((img) => {
    // Para a imagem atual, usar o previewUrl do prop (blob URL)
    // Para outras imagens, usar a URL da API (podem não estar carregadas)
    const imgPreviewUrl = img.id === anexo.id && previewUrl 
      ? previewUrl 
      : (img.previewUrl || img.url || '')
    const imgFormattedSize = formatBytes(img.tamanhoBytes)
    const imgUploadedBy = img.usuario?.nome
    const imgUploadedAt = img.createdAt
      ? new Date(img.createdAt).toLocaleDateString('pt-BR')
      : null

    // Criar descrição para o caption
    let captionText = img.nomeOriginal
    if (img.descricao) {
      captionText += ` - ${img.descricao}`
    }
    if (imgUploadedBy || imgUploadedAt) {
      captionText += '\n'
      if (imgUploadedBy) captionText += `Enviado por ${imgUploadedBy}`
      if (imgUploadedAt) captionText += ` em ${imgUploadedAt}`
    }
    if (imgFormattedSize) {
      captionText += ` • ${imgFormattedSize}`
    }

    return {
      src: imgPreviewUrl,
      title: img.nomeOriginal,
      description: captionText,
      download: imgPreviewUrl,
    }
  })

  // Encontrar o índice da imagem atual
  const currentIndex = allImages.length > 0 
    ? allImages.findIndex(img => img.id === anexo.id)
    : 0

  // Handler customizado de download
  const handleDownload = () => {
    if (onDownload && anexo) {
      onDownload(anexo.id)
    }
    return true // Previne o download padrão do plugin
  }

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex >= 0 ? currentIndex : 0}
      plugins={[Zoom, Download, Captions]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      download={{
        download: handleDownload,
      }}
      captions={{
        showToggle: true,
        descriptionTextAlign: 'start',
      }}
      carousel={{
        finite: slides.length <= 1, // Apenas finite se tiver uma imagem
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      styles={{
        container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' },
      }}
    />
  )
}
