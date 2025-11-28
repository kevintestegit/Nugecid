export interface EscavadorStatus {
  running: boolean;
  pid?: number;
  startedAt?: Date;
  stoppedAt?: Date;
  lastOutput?: string;
  lastProcess?: string;
  lastTitle?: string;
  lastLink?: string;
  lastChangeAt?: Date;
  lastError?: string;
  config?: {
    orgaoValor?: string;
    usuario?: string;
    watchInterval?: number;
    beepOnNew?: boolean;
    clickLast?: boolean;
    launchUrl?: string;
  };
}
