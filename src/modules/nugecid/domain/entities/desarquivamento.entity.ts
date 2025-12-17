import {
  DesarquivamentoId,
  StatusDesarquivamento,
  StatusDesarquivamentoEnum,
} from "../value-objects";
import { TipoDesarquivamentoEnum } from "../enums/tipo-desarquivamento.enum";

export interface DesarquivamentoDomainProps {
  id?: DesarquivamentoId;
  numeroSolicitacao?: number;
  tipoDesarquivamento: string;
  status: StatusDesarquivamento;
  nomeCompleto: string;
  numeroNicLaudoAuto: string;
  numeroProcesso: string;
  tipoDocumento: string;
  dataSolicitacao: Date;
  dataDesarquivamentoSAG?: Date;
  dataDevolucaoSetor?: Date;
  setorDemandante: string;
  servidorResponsavel: string;
  finalidadeDesarquivamento: string;
  solicitacaoProrrogacao: boolean;
  solicitacaoProrrogacaoTexto?: string;
  dadosAdicionais?: string;
  urgente?: boolean;
  instituto?: string;
  requerente?: string;
  numeroOficio?: string;
  criadoPorId: number;
  responsavelId?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class DesarquivamentoDomain {
  private constructor(
    private readonly _id: DesarquivamentoId | undefined,
    private readonly _numeroSolicitacao: number | undefined,
    private _tipoDesarquivamento: string,
    private _status: StatusDesarquivamento,
    private readonly _nomeCompleto: string,
    private readonly _numeroNicLaudoAuto: string,
    private readonly _numeroProcesso: string,
    private readonly _tipoDocumento: string,
    private _dataSolicitacao: Date,
    private _dataDesarquivamentoSAG: Date | undefined,
    private _dataDevolucaoSetor: Date | undefined,
    private readonly _setorDemandante: string,
    private readonly _servidorResponsavel: string,
    private readonly _finalidadeDesarquivamento: string,
    private readonly _solicitacaoProrrogacao: boolean,
    private readonly _solicitacaoProrrogacaoTexto: string | undefined,
    private readonly _dadosAdicionais: string | undefined,
    private readonly _urgente: boolean | undefined,
    private readonly _instituto: string | undefined,
    private readonly _requerente: string | undefined,
    private readonly _numeroOficio: string | undefined,
    private readonly _criadoPorId: number,
    private _responsavelId: number | undefined,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | undefined,
  ) {
    this.validate();
  }

  // Factory method para criar nova instância
  static create(
    props: Omit<DesarquivamentoDomainProps, "id" | "createdAt" | "updatedAt">,
  ): DesarquivamentoDomain {
    const now = new Date();

    return new DesarquivamentoDomain(
      undefined, // ID será gerado pelo repositório
      props.numeroSolicitacao,
      props.tipoDesarquivamento,
      props.status || StatusDesarquivamento.createSolicitado(),
      props.nomeCompleto,
      props.numeroNicLaudoAuto,
      props.numeroProcesso,
      props.tipoDocumento,
      props.dataSolicitacao,
      props.dataDesarquivamentoSAG,
      props.dataDevolucaoSetor,
      props.setorDemandante,
      props.servidorResponsavel,
      props.finalidadeDesarquivamento,
      props.solicitacaoProrrogacao,
      props.solicitacaoProrrogacaoTexto,
      props.dadosAdicionais,
      props.urgente,
      props.instituto,
      props.requerente,
      props.numeroOficio,
      props.criadoPorId,
      props.responsavelId,
      now,
      now,
      props.deletedAt,
    );
  }

  // Factory method para reconstruir a partir de dados persistidos
  static reconstruct(props: DesarquivamentoDomainProps): DesarquivamentoDomain {
    return new DesarquivamentoDomain(
      props.id,
      props.numeroSolicitacao,
      props.tipoDesarquivamento,
      props.status,
      props.nomeCompleto,
      props.numeroNicLaudoAuto,
      props.numeroProcesso,
      props.tipoDocumento,
      props.dataSolicitacao,
      props.dataDesarquivamentoSAG,
      props.dataDevolucaoSetor,
      props.setorDemandante,
      props.servidorResponsavel,
      props.finalidadeDesarquivamento,
      props.solicitacaoProrrogacao,
      props.solicitacaoProrrogacaoTexto,
      props.dadosAdicionais,
      props.urgente,
      props.instituto,
      props.requerente,
      props.numeroOficio,
      props.criadoPorId,
      props.responsavelId,
      props.createdAt,
      props.updatedAt,
      props.deletedAt,
    );
  }

  // Getters
  get id(): DesarquivamentoId | undefined {
    return this._id;
  }

  get numeroSolicitacao(): number | undefined {
    return this._numeroSolicitacao;
  }

  get tipoDesarquivamento(): string {
    return this._tipoDesarquivamento;
  }

  set tipoDesarquivamento(value: string) {
    this._tipoDesarquivamento = value;
  }

  get status(): StatusDesarquivamento {
    return this._status;
  }

  get nomeCompleto(): string {
    return this._nomeCompleto;
  }

  get numeroNicLaudoAuto(): string {
    return this._numeroNicLaudoAuto;
  }

  get numeroProcesso(): string {
    return this._numeroProcesso;
  }

  get tipoDocumento(): string {
    return this._tipoDocumento;
  }

  get dataSolicitacao(): Date {
    return this._dataSolicitacao;
  }

  get dataDesarquivamentoSAG(): Date | undefined {
    return this._dataDesarquivamentoSAG;
  }

  get dataDevolucaoSetor(): Date | undefined {
    return this._dataDevolucaoSetor;
  }

  get setorDemandante(): string {
    return this._setorDemandante;
  }

  get servidorResponsavel(): string {
    return this._servidorResponsavel;
  }

  get finalidadeDesarquivamento(): string {
    return this._finalidadeDesarquivamento;
  }

  get solicitacaoProrrogacao(): boolean {
    return this._solicitacaoProrrogacao;
  }

  get solicitacaoProrrogacaoTexto(): string | undefined {
    return this._solicitacaoProrrogacaoTexto;
  }

  get dadosAdicionais(): string | undefined {
    return this._dadosAdicionais;
  }

  get urgente(): boolean | undefined {
    return this._urgente;
  }

  get instituto(): string | undefined {
    return this._instituto;
  }

  get requerente(): string | undefined {
    return this._requerente;
  }

  get numeroOficio(): string | undefined {
    return this._numeroOficio;
  }

  get criadoPorId(): number {
    return this._criadoPorId;
  }

  get responsavelId(): number | undefined {
    return this._responsavelId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this._deletedAt;
  }

  // MÃ©todos de negÃ³cio
  private validate(): void {
    if (!this._nomeCompleto || this._nomeCompleto.trim().length === 0) {
      throw new Error("Nome completo Ã© obrigatÃ³rio");
    }

    if (this._nomeCompleto.length > 255) {
      throw new Error("Nome completo deve ter no mÃ¡ximo 255 caracteres");
    }

    if (
      !this._numeroNicLaudoAuto ||
      this._numeroNicLaudoAuto.trim().length === 0
    ) {
      throw new Error("NÃºmero NIC/Laudo/Auto Ã© obrigatÃ³rio");
    }

    // numeroProcesso agora é OPCIONAL - removida validação

    if (!this._tipoDocumento || this._tipoDocumento.trim().length === 0) {
      throw new Error("Tipo do documento Ã© obrigatÃ³rio");
    }

    // setorDemandante agora é OPCIONAL - removida validação

    if (
      !this._servidorResponsavel ||
      this._servidorResponsavel.trim().length === 0
    ) {
      throw new Error("Servidor responsÃ¡vel Ã© obrigatÃ³rio");
    }

    // finalidadeDesarquivamento agora é OPCIONAL - removida validação

    if (this._criadoPorId <= 0) {
      throw new Error("ID do usuÃ¡rio criador deve ser vÃ¡lido");
    }

    if (
      this._responsavelId !== undefined &&
      this._responsavelId !== null &&
      this._responsavelId < 0
    ) {
      throw new Error("ID do responsÃ¡vel deve ser vÃ¡lido");
    }
  }

  // Verifica se pode ser acessado por um usuÃ¡rio
  canBeAccessedBy(userId: number, userRoles: string[]): boolean {
    const upperCaseUserRoles = userRoles.map((role) => role.toUpperCase());
    // Criador sempre pode acessar
    if (this._criadoPorId === userId) {
      return true;
    }

    // ResponsÃ¡vel pode acessar
    if (this._responsavelId === userId) {
      return true;
    }

    // Administradores podem acessar tudo
    if (upperCaseUserRoles.includes("ADMIN")) {
      return true;
    }

    // UsuÃ¡rios com role especÃ­fica podem acessar
    if (
      upperCaseUserRoles.includes("NUGECID_VIEWER") ||
      upperCaseUserRoles.includes("NUGECID_OPERATOR")
    ) {
      return true;
    }

    return false;
  }

  // Verifica se pode ser editado por um usuÃ¡rio
  canBeEditedBy(userId: number, userRoles: string[]): boolean {
    // Normaliza roles vindas do controller (ex.: 'admin', 'coordenador', 'usuario')
    const upperCaseUserRoles = (userRoles || []).map((role) =>
      (role || "").toUpperCase(),
    );
    // Administradores sempre podem editar (override), independentemente do status
    if (upperCaseUserRoles.includes("ADMIN")) {
      return true;
    }
    // NÃ£o pode editar se estiver concluÃ­do (exceto ADMIN - jÃ¡ tratado acima)
    if (this._status.isFinal()) {
      return false;
    }

    // Criador pode editar se ainda estiver pendente
    if (this._criadoPorId === userId && this._status.isPending()) {
      return true;
    }

    // ResponsÃ¡vel pode editar
    if (this._responsavelId === userId) {
      return true;
    }

    // Operadores/coordenadores podem editar
    if (
      upperCaseUserRoles.includes("NUGECID_OPERATOR") ||
      upperCaseUserRoles.includes("COORDENADOR") ||
      upperCaseUserRoles.includes("OPERADOR")
    ) {
      return true;
    }

    return false;
  }

  // Verifica se pode ser excluÃ­do por um usuÃ¡rio (regras especÃ­ficas para exclusÃ£o)
  canBeDeletedBy(userId: number, userRoles: string[]): boolean {
    const upperCaseUserRoles = userRoles.map((role) => role.toUpperCase());

    // Administradores podem excluir qualquer coisa SEM RESTRIÇÕES
    // Necessário para manutenção, importações e correções
    if (upperCaseUserRoles.includes("ADMIN")) {
      return true;
    }

    // Criador pode excluir apenas suas prÃ³prias solicitaÃ§Ãµes que nÃ£o estÃ£o finalizadas ou em andamento
    if (this._criadoPorId === userId) {
      // NÃ£o pode excluir se finalizado ou em andamento
      if (this._status.isFinal() || this._status.isInProgress()) {
        return false;
      }
      return true;
    }

    // ResponsÃ¡vel pode excluir apenas se nÃ£o estiver finalizado
    if (this._responsavelId === userId) {
      if (this._status.isFinal()) {
        return false;
      }
      return true;
    }

    return false;
  }

  // Verifica se pode ser cancelado
  canBeCancelled(): boolean {
    return this._status.canBeCancelled();
  }

  // Verifica se pode ser concluÃ­do
  canBeCompleted(): boolean {
    return this._status.canBeCompleted();
  }

  // Verifica se estÃ¡ vencido (baseado na data de solicitaÃ§Ã£o + 30 dias)
  isOverdue(): boolean {
    if (this._status.isFinal()) {
      return false;
    }
    const deadline = new Date(this._dataSolicitacao);
    deadline.setDate(deadline.getDate() + 30); // 30 dias padrÃ£o
    return new Date() > deadline;
  }

  // Calcula dias restantes atÃ© o vencimento
  getDaysUntilDeadline(): number | null {
    if (this._status.isFinal()) {
      return null;
    }

    const deadline = new Date(this._dataSolicitacao);
    deadline.setDate(deadline.getDate() + 30); // 30 dias padrÃ£o
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // MÃ©todos para alterar estado
  changeStatus(newStatus: StatusDesarquivamento): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `NÃ£o Ã© possÃ­vel alterar status de ${this._status.toString()} para ${newStatus.toString()}`,
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();

    // Se foi concluÃ­do, define data de desarquivamento se nÃ£o foi definida
    if (
      newStatus.value === StatusDesarquivamentoEnum.FINALIZADO &&
      !this._dataDesarquivamentoSAG
    ) {
      this._dataDesarquivamentoSAG = new Date();
    }
  }

  // ForÃ§a alteraÃ§Ã£o de status, ignorando regra de transiÃ§Ã£o (uso administrativo)
  changeStatusForce(newStatus: StatusDesarquivamento): void {
    this._status = newStatus;
    this._updatedAt = new Date();

    // Se for finalizado e nÃ£o houver data de desarquivamento, define agora
    if (
      newStatus.value === StatusDesarquivamentoEnum.FINALIZADO &&
      !this._dataDesarquivamentoSAG
    ) {
      this._dataDesarquivamentoSAG = new Date();
    }
  }

  // Atribui responsÃ¡vel
  assignResponsible(responsavelId: number): void {
    if (responsavelId < 0) {
      throw new Error("ID do responsÃ¡vel deve ser vÃ¡lido");
    }

    this._responsavelId = responsavelId;
    this._updatedAt = new Date();

    // Se estava pendente, muda para em andamento
    if (this._status.isPending()) {
      this._status = StatusDesarquivamento.createDesarquivado();
    }
  }

  // Define data de desarquivamento SAG
  setDataDesarquivamentoSAG(data: Date): void {
    this._dataDesarquivamentoSAG = data;
    this._updatedAt = new Date();
  }

  // Define data de devoluÃ§Ã£o ao setor
  setDataDevolucaoSetor(data: Date | null): void {
    this._dataDevolucaoSetor = data === null ? undefined : data;
    this._updatedAt = new Date();
  }

  // Remove a data de devolução ao setor
  clearDataDevolucaoSetor(): void {
    this._dataDevolucaoSetor = undefined;
    this._updatedAt = new Date();
  }

  // Define data de solicitação
  setDataSolicitacao(data: Date): void {
    this._dataSolicitacao = data;
    this._updatedAt = new Date();
  }

  // Conclui o atendimento
  complete(): void {
    if (!this._status.canBeCompleted()) {
      throw new Error(
        "Desarquivamento nÃ£o pode ser concluÃ­do no status atual",
      );
    }

    this._status = StatusDesarquivamento.createFinalizado();
    if (!this._dataDesarquivamentoSAG) {
      this._dataDesarquivamentoSAG = new Date();
    }
    this._updatedAt = new Date();
  }

  // Cancela o desarquivamento
  cancel(motivo?: string): void {
    if (!this._status.canBeCancelled()) {
      throw new Error(
        "Desarquivamento nÃ£o pode ser cancelado no status atual",
      );
    }

    // Cancel functionality not available in new status structure
    throw new Error(
      "Cancelamento nÃ£o estÃ¡ disponÃ­vel na nova estrutura de status",
    );
    this._updatedAt = new Date();
  }

  // Soft delete
  delete(): void {
    if (this._status.isInProgress()) {
      throw new Error(
        "NÃ£o Ã© possÃ­vel excluir desarquivamento em andamento",
      );
    }

    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  // Restaura soft delete
  restore(): void {
    this._deletedAt = undefined;
    this._updatedAt = new Date();
  }

  // Marca como excluÃ­do (soft delete)
  markAsDeleted(): void {
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  // Verifica se foi excluÃ­do
  isDeleted(): boolean {
    return this._deletedAt !== undefined;
  }

  // Converte para objeto simples (para serialização)
  toPlainObject(): any {
    return {
      id: this._id?.value,
      tipoDesarquivamento: this._tipoDesarquivamento,
      status: this._status.value,
      nomeCompleto: this._nomeCompleto,
      numeroNicLaudoAuto: this._numeroNicLaudoAuto,
      numeroProcesso: this._numeroProcesso,
      tipoDocumento: this._tipoDocumento,
      dataSolicitacao: this._dataSolicitacao,
      dataDesarquivamentoSAG: this._dataDesarquivamentoSAG,
      dataDevolucaoSetor: this._dataDevolucaoSetor,
      setorDemandante: this._setorDemandante,
      servidorResponsavel: this._servidorResponsavel,
      finalidadeDesarquivamento: this._finalidadeDesarquivamento,
      solicitacaoProrrogacao: this._solicitacaoProrrogacao,
      solicitacaoProrrogacaoTexto: this._solicitacaoProrrogacaoTexto,
      dadosAdicionais: this._dadosAdicionais,
      urgente: this._urgente,
      instituto: this._instituto,
      requerente: this._requerente,
      numeroOficio: this._numeroOficio,
      criadoPorId: this._criadoPorId,
      responsavelId: this._responsavelId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
