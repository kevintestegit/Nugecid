import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '@/utils/cn'

interface PrazoItem {
  id: number
  titulo: string
  data: string
  tipo: 'devolucao' | 'solicitacao'
  urgente?: boolean
}

interface PrazosCalendarProps {
  prazos: PrazoItem[]
  isLoading?: boolean
}

const PrazosCalendar: React.FC<PrazosCalendarProps> = ({ prazos, isLoading }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const getPrazosForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return prazos.filter(prazo => prazo.data.startsWith(dateStr))
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/70 shadow-sm backdrop-blur">
              <Calendar className="h-4 w-4 text-primary" />
            </span>
            Calendário de Prazos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border border-border/60 bg-card/85 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.75)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/8 to-transparent" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-white/70 shadow-sm backdrop-blur">
              <Calendar className="h-4 w-4 text-primary" />
            </span>
            Calendário de Prazos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize min-w-[140px] text-center">
              {monthName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-12"></div>
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayPrazos = getPrazosForDay(day)
            const hasPrazos = dayPrazos.length > 0
            const hasUrgente = dayPrazos.some(p => p.urgente)

            return (
              <div
                key={day}
                className={cn(
                  'relative h-12 flex items-center justify-center rounded-lg transition-all cursor-pointer',
                  'hover:bg-muted/50',
                  isToday(day) && 'bg-primary/10 font-bold ring-2 ring-primary/30',
                  hasPrazos && !isToday(day) && 'bg-accent/5',
                  hasUrgente && 'ring-2 ring-red-500/30'
                )}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <span className={cn(
                  'text-sm',
                  isToday(day) && 'text-primary font-bold',
                  !isToday(day) && 'text-foreground'
                )}>
                  {day}
                </span>

                {/* Indicator dots */}
                {hasPrazos && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayPrazos.slice(0, 3).map((prazo, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          prazo.urgente ? 'bg-red-500' : 
                          prazo.tipo === 'devolucao' ? 'bg-blue-500' : 'bg-green-500'
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Tooltip on hover */}
                {hoveredDay === day && hasPrazos && (
                  <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground border-b border-border pb-1">
                        {day} de {monthName}
                      </p>
                      {dayPrazos.map(prazo => (
                        <div key={prazo.id} className="text-xs space-y-1">
                          <div className="flex items-start gap-2">
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-1 shrink-0',
                              prazo.urgente ? 'bg-red-500' :
                              prazo.tipo === 'devolucao' ? 'bg-blue-500' : 'bg-green-500'
                            )} />
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{prazo.titulo}</p>
                              <p className="text-muted-foreground">
                                {prazo.tipo === 'devolucao' ? 'Prazo de devolução' : 'Solicitação'}
                              </p>
                            </div>
                            {prazo.urgente && (
                              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                Urgente
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Devolução</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Solicitação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-muted-foreground">Urgente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PrazosCalendar
