import React, { useEffect, useState } from 'react'
import { apiService } from '@/services/api'

interface ImageThumbnailProps {
  desarquivamentoId: number
  anexoId: number
  nomeOriginal: string
  tipoMime: string
}

export const ImageThumbnail: React.FC<ImageThumbnailProps> = ({
  desarquivamentoId,
  anexoId,
  nomeOriginal,
  tipoMime,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null

    const loadImage = async () => {
      try {
        setLoading(true)
        setError(false)

        // Busca a imagem via API
        const blob = await apiService.viewDesarquivamentoAnexo(
          desarquivamentoId,
          anexoId
        )

        // Cria URL temporária
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar miniatura:', err)
        setError(true)
        setLoading(false)
      }
    }

    // Só carrega se for imagem
    if (tipoMime.startsWith('image/')) {
      loadImage()
    } else {
      setLoading(false)
    }

    // Cleanup: libera a URL ao desmontar
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [desarquivamentoId, anexoId, tipoMime])

  // Mostrar ícone enquanto carrega
  if (loading) {
    return (
      <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
        <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Se deu erro ou não é imagem, mostrar ícone colorido
  if (error || !tipoMime.startsWith('image/')) {
    return (
      <div
        className={`h-12 w-12 rounded flex items-center justify-center text-white text-xs font-bold ${
          tipoMime.startsWith('image/')
            ? 'bg-green-500'
            : tipoMime === 'application/pdf'
              ? 'bg-red-500'
              : 'bg-blue-500'
        }`}
      >
        {tipoMime.startsWith('image/')
          ? 'IMG'
          : tipoMime === 'application/pdf'
            ? 'PDF'
            : 'DOC'}
      </div>
    )
  }

  // Mostrar miniatura da imagem
  return (
    <div className="h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
      <img
        src={imageUrl || ''}
        alt={nomeOriginal}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
