import { ApiService } from "./api";

const api = new ApiService();

export interface EscavadorStatus {
  running: boolean;
  pid?: number;
  startedAt?: string;
  stoppedAt?: string;
  lastOutput?: string;
  lastProcess?: string;
  lastTitle?: string;
  lastLink?: string;
  lastChangeAt?: string;
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

export interface StartEscavadorPayload {
  usuario?: string;
  senha?: string;
  launchUrl?: string;
  watchInterval?: number;
  beepOnNew?: boolean;
  clickLast?: boolean;
}

class EscavadorService {
  async getStatus(): Promise<EscavadorStatus> {
    const { data } = await api.get<EscavadorStatus>("/escavador-seirn/status");
    return data;
  }

  async start(payload: StartEscavadorPayload): Promise<EscavadorStatus> {
    const { data } = await api.post<EscavadorStatus>(
      "/escavador-seirn/start",
      payload,
    );
    return data;
  }

  async stop(): Promise<void> {
    await api.post("/escavador-seirn/stop", {});
  }
}

export default new EscavadorService();
