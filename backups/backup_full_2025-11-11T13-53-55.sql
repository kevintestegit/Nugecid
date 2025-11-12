--
-- PostgreSQL database dump
--

\restrict EaZlD1jeOXsfcR9AduPSKh8DJRFZoCQVVWkQ3bCsVbWtsNkKhPnr6YYtCh7P8Ih

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_preferences DROP CONSTRAINT IF EXISTS fk_user_preferences_user;
ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS fk_notificacoes_tarefa;
ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS fk_notificacoes_remetente;
ALTER TABLE IF EXISTS ONLY public.desarquivamento_comments DROP CONSTRAINT IF EXISTS fk_desarq_comment_user;
ALTER TABLE IF EXISTS ONLY public.desarquivamento_comments DROP CONSTRAINT IF EXISTS fk_desarq_comment_desarq;
ALTER TABLE IF EXISTS ONLY public.pasta_arquivos DROP CONSTRAINT IF EXISTS "FK_pasta_arquivos_pasta";
ALTER TABLE IF EXISTS ONLY public.tarefas DROP CONSTRAINT IF EXISTS "FK_fa270c973649c58c1d561145050";
ALTER TABLE IF EXISTS ONLY public.membros_projeto DROP CONSTRAINT IF EXISTS "FK_e6965151e12e96cb0318a506c31";
ALTER TABLE IF EXISTS ONLY public.colunas DROP CONSTRAINT IF EXISTS "FK_dc1c91ba3046abf8aa44be533bd";
ALTER TABLE IF EXISTS ONLY public.comentarios DROP CONSTRAINT IF EXISTS "FK_d4ccf77b40c5697b7f136170f47";
ALTER TABLE IF EXISTS ONLY public.comentarios DROP CONSTRAINT IF EXISTS "FK_c30e8d64c125cf3a1ece50126a2";
ALTER TABLE IF EXISTS ONLY public.itens_checklist DROP CONSTRAINT IF EXISTS "FK_b49a1c5f0d6b6816fb7f53dba14";
ALTER TABLE IF EXISTS ONLY public.desarquivamento_anexos DROP CONSTRAINT IF EXISTS "FK_a938c127be8edbfb412ca0b0cf1";
ALTER TABLE IF EXISTS ONLY public.tarefas DROP CONSTRAINT IF EXISTS "FK_a1dea9cc06ee0b625201bc6c71a";
ALTER TABLE IF EXISTS ONLY public.projetos DROP CONSTRAINT IF EXISTS "FK_9dd48438e8e95939b63880efae2";
ALTER TABLE IF EXISTS ONLY public.membros_projeto DROP CONSTRAINT IF EXISTS "FK_9655da2f96b65913b0666cd81d7";
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS "FK_933f1f766daaa16d3848d186a59";
ALTER TABLE IF EXISTS ONLY public.tarefas DROP CONSTRAINT IF EXISTS "FK_9234be58f5b6d6d9ad55ceb036b";
ALTER TABLE IF EXISTS ONLY public.anexos DROP CONSTRAINT IF EXISTS "FK_7f2ca515a3bbfa46eac7ead198a";
ALTER TABLE IF EXISTS ONLY public.desarquivamento_anexos DROP CONSTRAINT IF EXISTS "FK_7e390e384cb304a8f234a1d6dde";
ALTER TABLE IF EXISTS ONLY public.tarefas DROP CONSTRAINT IF EXISTS "FK_7b5f8bbda19b2ef0cb37d013a3d";
ALTER TABLE IF EXISTS ONLY public.historico_tarefas DROP CONSTRAINT IF EXISTS "FK_7128414e74109ef8339d65aa88d";
ALTER TABLE IF EXISTS ONLY public.itens_checklist DROP CONSTRAINT IF EXISTS "FK_658ca7dba1fd484b1f70607e71d";
ALTER TABLE IF EXISTS ONLY public.desarquivamentos DROP CONSTRAINT IF EXISTS "FK_5953b78a5f8eac818837a842008";
ALTER TABLE IF EXISTS ONLY public.historico_tarefas DROP CONSTRAINT IF EXISTS "FK_4e178ffeb5373a9176e5a50cc95";
ALTER TABLE IF EXISTS ONLY public.desarquivamentos DROP CONSTRAINT IF EXISTS "FK_22f094b11205fc0a5fd1806db89";
ALTER TABLE IF EXISTS ONLY public.auditorias DROP CONSTRAINT IF EXISTS "FK_21b7d36a2eed9a8d26ebb80f51e";
ALTER TABLE IF EXISTS ONLY public.anexos DROP CONSTRAINT IF EXISTS "FK_1ed88f32d5c33ad81740fc35490";
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS "FK_0c4c36caf8f0abd154e593cf22d";
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
DROP TRIGGER IF EXISTS update_tarefas_updated_at ON public.tarefas;
DROP TRIGGER IF EXISTS update_roles_updated_at ON public.roles;
DROP TRIGGER IF EXISTS update_projetos_updated_at ON public.projetos;
DROP TRIGGER IF EXISTS update_notificacoes_updated_at ON public.notificacoes;
DROP TRIGGER IF EXISTS update_desarquivamentos_updated_at ON public.desarquivamentos;
DROP TRIGGER IF EXISTS update_comentarios_updated_at ON public.comentarios;
DROP TRIGGER IF EXISTS update_colunas_updated_at ON public.colunas;
DROP TRIGGER IF EXISTS trigger_update_user_preferences_updated_at ON public.user_preferences;
DROP TRIGGER IF EXISTS tarefas_sync_timestamps ON public.tarefas;
DROP TRIGGER IF EXISTS desarquivamentos_sync_tipo ON public.desarquivamentos;
DROP INDEX IF EXISTS public.idx_user_preferences_user_key;
DROP INDEX IF EXISTS public.idx_user_preferences_user_id;
DROP INDEX IF EXISTS public.idx_user_preferences_key;
DROP INDEX IF EXISTS public.idx_notificacoes_usuario_lida;
DROP INDEX IF EXISTS public.idx_notificacoes_usuario;
DROP INDEX IF EXISTS public.idx_notificacoes_tipo_created;
DROP INDEX IF EXISTS public.idx_notificacoes_tipo;
DROP INDEX IF EXISTS public.idx_notificacoes_tarefa;
DROP INDEX IF EXISTS public.idx_notificacoes_remetente;
DROP INDEX IF EXISTS public.idx_notificacoes_projeto;
DROP INDEX IF EXISTS public.idx_notificacoes_prioridade;
DROP INDEX IF EXISTS public.idx_notificacoes_lida;
DROP INDEX IF EXISTS public.idx_notificacoes_deleted_at;
DROP INDEX IF EXISTS public.idx_notificacoes_created_at;
DROP INDEX IF EXISTS public.idx_desarquivamentos_numero_solicitacao;
DROP INDEX IF EXISTS public.idx_desarquivamento_anexos_tipo;
DROP INDEX IF EXISTS public."IDX_pasta_arquivos_tipo";
DROP INDEX IF EXISTS public."IDX_pasta_arquivos_pasta";
DROP INDEX IF EXISTS public."IDX_numero_nic_laudo_auto";
DROP INDEX IF EXISTS public."IDX_numero_extraido";
DROP INDEX IF EXISTS public."IDX_desarquivamento_anexos_usuario_id";
DROP INDEX IF EXISTS public."IDX_desarquivamento_anexos_desarquivamento_id";
DROP INDEX IF EXISTS public."IDX_comentarios_deleted_at";
DROP INDEX IF EXISTS public."IDX_DESARQ_COMMENTS_USER";
DROP INDEX IF EXISTS public."IDX_DESARQ_COMMENTS_DESARQ";
DROP INDEX IF EXISTS public."IDX_94b0719f893403890a79cfb30b";
DROP INDEX IF EXISTS public."IDX_900d44fa1a3c1812c0d439a90e";
DROP INDEX IF EXISTS public."IDX_73e021d4d498eda6f6a8ea6750";
DROP INDEX IF EXISTS public."IDX_70c402d367e5bd15d2cdbcf36c";
DROP INDEX IF EXISTS public."IDX_22f094b11205fc0a5fd1806db8";
ALTER TABLE IF EXISTS ONLY public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.user_preferences DROP CONSTRAINT IF EXISTS unique_user_preference;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.pasta_arquivos DROP CONSTRAINT IF EXISTS pasta_arquivos_pkey;
ALTER TABLE IF EXISTS ONLY public.notificacoes DROP CONSTRAINT IF EXISTS notificacoes_pkey;
ALTER TABLE IF EXISTS ONLY public.desarquivamentos DROP CONSTRAINT IF EXISTS desarquivamentos_numero_solicitacao_key;
ALTER TABLE IF EXISTS ONLY public.desarquivamento_comments DROP CONSTRAINT IF EXISTS desarquivamento_comments_pkey;
ALTER TABLE IF EXISTS ONLY public.membros_projeto DROP CONSTRAINT IF EXISTS "UQ_cbb8a02588c227904da9b1adb2a";
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS "UQ_648e3f5447f725579d7d4ffdfb7";
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS "UQ_0790a401b9d234fa921e9aa1777";
ALTER TABLE IF EXISTS ONLY public.planilhas_controle DROP CONSTRAINT IF EXISTS "PK_planilhas_controle_id";
ALTER TABLE IF EXISTS ONLY public.projetos DROP CONSTRAINT IF EXISTS "PK_fb6b6aed4b30e10b976fe8bdf5b";
ALTER TABLE IF EXISTS ONLY public.anexos DROP CONSTRAINT IF EXISTS "PK_da398d73b0fa1e7549520adc9f3";
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS "PK_d7281c63c176e152e4c531594a8";
ALTER TABLE IF EXISTS ONLY public.historico_tarefas DROP CONSTRAINT IF EXISTS "PK_c1607a878f2c8e4b8ea1d62e64c";
ALTER TABLE IF EXISTS ONLY public.auditorias DROP CONSTRAINT IF EXISTS "PK_b84b3505f313ab1a44e7b684ee2";
ALTER TABLE IF EXISTS ONLY public.comentarios DROP CONSTRAINT IF EXISTS "PK_b60b1468bb275db8d5e875c4a78";
ALTER TABLE IF EXISTS ONLY public.migrations DROP CONSTRAINT IF EXISTS "PK_8c82d7f526340ab734260ea46be";
ALTER TABLE IF EXISTS ONLY public.membros_projeto DROP CONSTRAINT IF EXISTS "PK_880851f4e6c101277a40a808729";
ALTER TABLE IF EXISTS ONLY public.desarquivamentos DROP CONSTRAINT IF EXISTS "PK_658c051385ef0d1a2e1886731dd";
ALTER TABLE IF EXISTS ONLY public.desarquivamento_anexos DROP CONSTRAINT IF EXISTS "PK_55c2a164047643dab05e3b626c5";
ALTER TABLE IF EXISTS ONLY public.pastas DROP CONSTRAINT IF EXISTS "PK_43a993b522e01a6a2f0da32041e";
ALTER TABLE IF EXISTS ONLY public.registros DROP CONSTRAINT IF EXISTS "PK_34c305689a504166a73ccaec0b0";
ALTER TABLE IF EXISTS ONLY public.checklists DROP CONSTRAINT IF EXISTS "PK_336ade2047f3d713e1afa20d2c6";
ALTER TABLE IF EXISTS ONLY public.tarefas DROP CONSTRAINT IF EXISTS "PK_2f57a4443470e61ac5de297e30a";
ALTER TABLE IF EXISTS ONLY public.itens_checklist DROP CONSTRAINT IF EXISTS "PK_247b3e0f6ebc51c54c884df0787";
ALTER TABLE IF EXISTS ONLY public.colunas DROP CONSTRAINT IF EXISTS "PK_21100b0dba579f40b31338561ce";
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_preferences ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tarefas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projetos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notificacoes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.membros_projeto ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.itens_checklist ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historico_tarefas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.desarquivamentos ALTER COLUMN numero_solicitacao DROP DEFAULT;
ALTER TABLE IF EXISTS public.desarquivamentos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.desarquivamento_comments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.desarquivamento_anexos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.comentarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.colunas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.checklists ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.auditorias ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.anexos ALTER COLUMN id DROP DEFAULT;
DROP VIEW IF EXISTS public.vw_notificacoes_estatisticas;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.user_preferences_id_seq;
DROP TABLE IF EXISTS public.user_preferences;
DROP SEQUENCE IF EXISTS public.tarefas_id_seq;
DROP TABLE IF EXISTS public.tarefas;
DROP SEQUENCE IF EXISTS public.system_settings_id_seq;
DROP TABLE IF EXISTS public.system_settings;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.registros;
DROP SEQUENCE IF EXISTS public.projetos_id_seq;
DROP TABLE IF EXISTS public.projetos;
DROP TABLE IF EXISTS public.planilhas_controle;
DROP TABLE IF EXISTS public.pastas;
DROP TABLE IF EXISTS public.pasta_arquivos;
DROP SEQUENCE IF EXISTS public.notificacoes_id_seq;
DROP TABLE IF EXISTS public.notificacoes;
DROP SEQUENCE IF EXISTS public.migrations_id_seq;
DROP TABLE IF EXISTS public.migrations;
DROP SEQUENCE IF EXISTS public.membros_projeto_id_seq;
DROP TABLE IF EXISTS public.membros_projeto;
DROP SEQUENCE IF EXISTS public.itens_checklist_id_seq;
DROP TABLE IF EXISTS public.itens_checklist;
DROP SEQUENCE IF EXISTS public.historico_tarefas_id_seq;
DROP TABLE IF EXISTS public.historico_tarefas;
DROP SEQUENCE IF EXISTS public.desarquivamentos_numero_solicitacao_seq;
DROP SEQUENCE IF EXISTS public.desarquivamentos_id_seq;
DROP TABLE IF EXISTS public.desarquivamentos;
DROP SEQUENCE IF EXISTS public.desarquivamento_comments_id_seq;
DROP TABLE IF EXISTS public.desarquivamento_comments;
DROP SEQUENCE IF EXISTS public.desarquivamento_anexos_id_seq;
DROP TABLE IF EXISTS public.desarquivamento_anexos;
DROP SEQUENCE IF EXISTS public.comentarios_id_seq;
DROP TABLE IF EXISTS public.comentarios;
DROP SEQUENCE IF EXISTS public.colunas_id_seq;
DROP TABLE IF EXISTS public.colunas;
DROP SEQUENCE IF EXISTS public.checklists_id_seq;
DROP TABLE IF EXISTS public.checklists;
DROP SEQUENCE IF EXISTS public.auditorias_id_seq;
DROP TABLE IF EXISTS public.auditorias;
DROP SEQUENCE IF EXISTS public.anexos_id_seq;
DROP TABLE IF EXISTS public.anexos;
DROP FUNCTION IF EXISTS public.verificar_solicitacoes_pendentes();
DROP FUNCTION IF EXISTS public.update_user_preferences_updated_at();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.sync_tarefas_timestamps();
DROP FUNCTION IF EXISTS public.sync_desarquivamento_tipo();
DROP FUNCTION IF EXISTS public.criar_notificacao_solicitacao_pendente(p_solicitacao_id integer, p_usuario_id integer, p_dias_pendentes integer);
DROP FUNCTION IF EXISTS public.criar_notificacao_novo_processo(p_processo_id integer, p_usuario_id integer, p_numero_processo character varying);
DROP FUNCTION IF EXISTS public.criar_colunas_padrao(projeto_id_param integer);
DROP TYPE IF EXISTS public.tarefas_prioridade_enum;
DROP TYPE IF EXISTS public.notificacao_tipo_enum;
DROP TYPE IF EXISTS public.notificacao_prioridade_enum;
DROP TYPE IF EXISTS public.membros_projeto_papel_enum;
DROP TYPE IF EXISTS public.historico_tarefas_acao_enum;
DROP TYPE IF EXISTS public.desarquivamentos_status_enum;
DROP TYPE IF EXISTS public.desarquivamentos_desarquivamento_fisico_digital_enum;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: desarquivamentos_desarquivamento_fisico_digital_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.desarquivamentos_desarquivamento_fisico_digital_enum AS ENUM (
    'FISICO',
    'DIGITAL',
    'NAO_LOCALIZADO'
);


--
-- Name: desarquivamentos_status_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.desarquivamentos_status_enum AS ENUM (
    'FINALIZADO',
    'DESARQUIVADO',
    'NAO_COLETADO',
    'SOLICITADO',
    'REARQUIVAMENTO_SOLICITADO',
    'RETIRADO_PELO_SETOR',
    'NAO_LOCALIZADO'
);


--
-- Name: historico_tarefas_acao_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.historico_tarefas_acao_enum AS ENUM (
    'criacao',
    'edicao',
    'movimentacao',
    'atribuicao',
    'prazo_alterado',
    'prioridade_alterada',
    'comentario_adicionado',
    'comentario',
    'anexo_adicionado',
    'checklist_adicionado',
    'item_checklist_concluido',
    'tag_adicionada',
    'tag_removida',
    'exclusao'
);


--
-- Name: membros_projeto_papel_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.membros_projeto_papel_enum AS ENUM (
    'admin',
    'editor',
    'viewer'
);


--
-- Name: notificacao_prioridade_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notificacao_prioridade_enum AS ENUM (
    'baixa',
    'media',
    'alta',
    'critica'
);


--
-- Name: notificacao_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notificacao_tipo_enum AS ENUM (
    'solicitacao_pendente',
    'novo_processo',
    'mencao',
    'tarefa_atribuida',
    'tarefa_alterada',
    'tarefa_comentada',
    'prazo_proximo',
    'tarefa_atrasada',
    'projeto_atualizado'
);


--
-- Name: tarefas_prioridade_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tarefas_prioridade_enum AS ENUM (
    'baixa',
    'media',
    'alta',
    'critica'
);


--
-- Name: criar_colunas_padrao(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_colunas_padrao(projeto_id_param integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
      BEGIN
          INSERT INTO colunas (projeto_id, nome, cor, ordem) VALUES
              (projeto_id_param, 'A Fazer', '#EF4444', 1),
              (projeto_id_param, 'Em Progresso', '#F59E0B', 2),
              (projeto_id_param, 'Em Revisão', '#8B5CF6', 3),
              (projeto_id_param, 'Concluído', '#10B981', 4);
      END;
      $$;


--
-- Name: criar_notificacao_novo_processo(integer, integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_notificacao_novo_processo(p_processo_id integer, p_usuario_id integer, p_numero_processo character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
        DECLARE
          v_notificacao_id INTEGER;
          v_titulo VARCHAR(255);
          v_descricao TEXT;
          v_detalhes JSONB;
        BEGIN
          v_titulo := 'Novo Processo de Desarquivamento';
          v_descricao := 'Um novo processo de desarquivamento foi extraído do SEIRN: ' || p_numero_processo;
          v_detalhes := json_build_object(
            'numero_processo', p_numero_processo,
            'origem', 'SEIRN',
            'data_extracao', CURRENT_TIMESTAMP
          );

          INSERT INTO notificacoes (
            tipo, titulo, descricao, detalhes, usuario_id, processo_id, prioridade
          ) VALUES (
            'novo_processo', v_titulo, v_descricao, v_detalhes, p_usuario_id, p_processo_id, 'media'
          ) RETURNING id INTO v_notificacao_id;

          RETURN v_notificacao_id;
        END;
        $$;


--
-- Name: criar_notificacao_solicitacao_pendente(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.criar_notificacao_solicitacao_pendente(p_solicitacao_id integer, p_usuario_id integer, p_dias_pendentes integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
        DECLARE
          v_notificacao_id INTEGER;
          v_titulo VARCHAR(255);
          v_descricao TEXT;
          v_detalhes JSONB;
        BEGIN
          v_titulo := 'Solicitação Pendente há ' || p_dias_pendentes || ' dias';
          v_descricao := 'Uma solicitação de desarquivamento está pendente há mais de 5 dias sem movimentação.';
          v_detalhes := json_build_object(
            'dias_pendentes', p_dias_pendentes,
            'data_limite', CURRENT_DATE + INTERVAL '2 days'
          );

          INSERT INTO notificacoes (
            tipo, titulo, descricao, detalhes, usuario_id, solicitacao_id, prioridade
          ) VALUES (
            'solicitacao_pendente', v_titulo, v_descricao, v_detalhes, p_usuario_id, p_solicitacao_id, 'alta'
          ) RETURNING id INTO v_notificacao_id;

          RETURN v_notificacao_id;
        END;
        $$;


--
-- Name: sync_desarquivamento_tipo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_desarquivamento_tipo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.desarquivamento_fisico_digital IS NOT NULL THEN
    NEW.tipo_desarquivamento = NEW.desarquivamento_fisico_digital::text;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: sync_tarefas_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.sync_tarefas_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.data_criacao = NEW.created_at;
  NEW.data_atualizacao = NEW.updated_at;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        new_record JSONB;
      BEGIN
        new_record := to_jsonb(NEW);

        IF new_record ? 'updated_at' THEN
          NEW.updated_at := CURRENT_TIMESTAMP;
        ELSIF new_record ? 'data_atualizacao' THEN
          NEW.data_atualizacao := CURRENT_TIMESTAMP;
        ELSE
          RAISE WARNING 'update_updated_at_column: coluna de atualizaÃ§Ã£o nÃ£o encontrada na tabela %', TG_TABLE_NAME;
        END IF;

        RETURN NEW;
      END;
      $$;


--
-- Name: update_user_preferences_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_preferences_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: verificar_solicitacoes_pendentes(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_solicitacoes_pendentes() RETURNS TABLE(desarquivamento_id integer, dias_pendentes integer, usuario_responsavel_id integer)
    LANGUAGE plpgsql
    AS $$
        BEGIN
          RETURN QUERY
          SELECT 
            d.id as desarquivamento_id,
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d.data_solicitacao))::INTEGER as dias_pendentes,
            d.responsavel_id as usuario_responsavel_id
          FROM desarquivamentos d
          WHERE d.status = 'SOLICITADO'
            AND d.data_solicitacao <= CURRENT_TIMESTAMP - INTERVAL '5 days'
            AND d.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM notificacoes n 
              WHERE n.tipo = 'solicitacao_pendente' 
                AND n.solicitacao_id = d.id 
                AND n.deleted_at IS NULL
                AND n.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
            );
        END;
        $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anexos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anexos (
    id integer NOT NULL,
    tarefa_id integer NOT NULL,
    usuario_id integer NOT NULL,
    nome_original character varying(255) NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    caminho_arquivo character varying(500) NOT NULL,
    tipo_mime character varying(100) NOT NULL,
    tamanho_bytes bigint NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: anexos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.anexos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: anexos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.anexos_id_seq OWNED BY public.anexos.id;


--
-- Name: auditorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditorias (
    user_id integer NOT NULL,
    entity_name character varying(100) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    success boolean DEFAULT true NOT NULL,
    error text,
    id integer NOT NULL,
    action character varying NOT NULL,
    entity_id integer,
    details text,
    response text,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
)
WITH (autovacuum_vacuum_scale_factor='0.2', autovacuum_analyze_scale_factor='0.1');


--
-- Name: auditorias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditorias_id_seq OWNED BY public.auditorias.id;


--
-- Name: checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.checklists (
    id integer NOT NULL,
    tarefa_id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.checklists_id_seq OWNED BY public.checklists.id;


--
-- Name: colunas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colunas (
    id integer NOT NULL,
    projeto_id integer NOT NULL,
    nome character varying(100) NOT NULL,
    cor character varying(7) DEFAULT '#3B82F6'::character varying NOT NULL,
    ordem integer NOT NULL,
    ativa boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    wip_limit integer
);


--
-- Name: colunas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.colunas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: colunas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.colunas_id_seq OWNED BY public.colunas.id;


--
-- Name: comentarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comentarios (
    id integer NOT NULL,
    tarefa_id integer NOT NULL,
    autor_id integer NOT NULL,
    conteudo text NOT NULL,
    editado boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone
);


--
-- Name: comentarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comentarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comentarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comentarios_id_seq OWNED BY public.comentarios.id;


--
-- Name: desarquivamento_anexos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desarquivamento_anexos (
    id integer NOT NULL,
    desarquivamento_id integer NOT NULL,
    usuario_id integer NOT NULL,
    nome_original character varying(255) NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    caminho_arquivo character varying(500) NOT NULL,
    tipo_mime character varying(100) NOT NULL,
    tamanho_bytes bigint NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    descricao text,
    tipo_anexo character varying(20) DEFAULT 'desarquivamento'::character varying NOT NULL
);


--
-- Name: desarquivamento_anexos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.desarquivamento_anexos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: desarquivamento_anexos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.desarquivamento_anexos_id_seq OWNED BY public.desarquivamento_anexos.id;


--
-- Name: desarquivamento_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desarquivamento_comments (
    id integer NOT NULL,
    desarquivamento_id integer NOT NULL,
    user_id integer,
    author_name character varying(255) NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: desarquivamento_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.desarquivamento_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: desarquivamento_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.desarquivamento_comments_id_seq OWNED BY public.desarquivamento_comments.id;


--
-- Name: desarquivamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.desarquivamentos (
    id integer NOT NULL,
    status public.desarquivamentos_status_enum DEFAULT 'SOLICITADO'::public.desarquivamentos_status_enum NOT NULL,
    nome_completo character varying(255) NOT NULL,
    numero_nic_laudo_auto character varying(500) NOT NULL,
    numero_processo character varying(255),
    setor_demandante character varying(255),
    servidor_responsavel character varying(255) NOT NULL,
    finalidade_desarquivamento text NOT NULL,
    solicitacao_prorrogacao boolean DEFAULT false NOT NULL,
    urgente boolean DEFAULT false,
    created_by integer NOT NULL,
    responsavel_id integer,
    desarquivamento_fisico_digital public.desarquivamentos_desarquivamento_fisico_digital_enum NOT NULL,
    tipo_documento character varying(100) NOT NULL,
    data_solicitacao timestamp without time zone NOT NULL,
    data_desarquivamento_sag timestamp without time zone,
    data_devolucao_setor timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    solicitacao_prorrogacao_texto text,
    dados_adicionais text,
    numero_solicitacao integer NOT NULL,
    tipo_desarquivamento character varying(50) DEFAULT 'FISICO'::character varying,
    numero_extraido character varying(50)
)
WITH (autovacuum_vacuum_scale_factor='0.1', autovacuum_analyze_scale_factor='0.05');


--
-- Name: desarquivamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.desarquivamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: desarquivamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.desarquivamentos_id_seq OWNED BY public.desarquivamentos.id;


--
-- Name: desarquivamentos_numero_solicitacao_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.desarquivamentos_numero_solicitacao_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: desarquivamentos_numero_solicitacao_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.desarquivamentos_numero_solicitacao_seq OWNED BY public.desarquivamentos.numero_solicitacao;


--
-- Name: historico_tarefas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_tarefas (
    id integer NOT NULL,
    tarefa_id integer NOT NULL,
    usuario_id integer NOT NULL,
    acao public.historico_tarefas_acao_enum NOT NULL,
    descricao text,
    "dadosAnteriores" jsonb,
    "dadosNovos" jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: historico_tarefas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historico_tarefas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historico_tarefas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historico_tarefas_id_seq OWNED BY public.historico_tarefas.id;


--
-- Name: itens_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_checklist (
    id integer NOT NULL,
    checklist_id integer NOT NULL,
    texto character varying(500) NOT NULL,
    concluido boolean DEFAULT false NOT NULL,
    ordem integer NOT NULL,
    concluido_por_id integer,
    concluido_em timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: itens_checklist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.itens_checklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: itens_checklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.itens_checklist_id_seq OWNED BY public.itens_checklist.id;


--
-- Name: membros_projeto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membros_projeto (
    id integer NOT NULL,
    projeto_id integer NOT NULL,
    usuario_id integer NOT NULL,
    papel public.membros_projeto_papel_enum DEFAULT 'viewer'::public.membros_projeto_papel_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: membros_projeto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.membros_projeto_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: membros_projeto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.membros_projeto_id_seq OWNED BY public.membros_projeto.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes (
    id integer NOT NULL,
    tipo public.notificacao_tipo_enum NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text NOT NULL,
    detalhes jsonb,
    lida boolean DEFAULT false NOT NULL,
    prioridade public.notificacao_prioridade_enum DEFAULT 'media'::public.notificacao_prioridade_enum NOT NULL,
    usuario_id integer NOT NULL,
    solicitacao_id integer,
    processo_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone,
    tarefa_id integer,
    projeto_id integer,
    remetente_id integer,
    link text
);


--
-- Name: COLUMN notificacoes.detalhes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.notificacoes.detalhes IS 'Dados específicos como dias pendentes, número do processo, etc.';


--
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- Name: pasta_arquivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pasta_arquivos (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pasta_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    nome_original character varying(255) NOT NULL,
    caminho character varying(512) NOT NULL,
    tamanho_bytes bigint NOT NULL,
    data_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: pastas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pastas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome character varying NOT NULL,
    descricao character varying NOT NULL,
    imagens integer DEFAULT 0 NOT NULL,
    planilhas integer DEFAULT 0 NOT NULL,
    data_criacao timestamp without time zone DEFAULT now() NOT NULL,
    tags text NOT NULL
);


--
-- Name: planilhas_controle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planilhas_controle (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    nome_original character varying NOT NULL,
    caminho character varying NOT NULL,
    tamanho_bytes bigint NOT NULL,
    data_upload timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: projetos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projetos (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    descricao text,
    criador_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: projetos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projetos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projetos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projetos_id_seq OWNED BY public.projetos.id;


--
-- Name: registros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    numero_processo character varying(255) NOT NULL,
    delegacia_origem character varying(255) NOT NULL,
    nome_vitima character varying(255) NOT NULL,
    data_fato date NOT NULL,
    investigador_responsavel character varying(255),
    idade_vitima integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    description character varying(255),
    permissions text DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    name character varying(50) NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    auto_backup boolean DEFAULT true NOT NULL,
    backup_frequency character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    log_level character varying(10) DEFAULT 'info'::character varying NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    cache_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: tarefas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tarefas (
    id integer NOT NULL,
    projeto_id integer NOT NULL,
    coluna_id integer NOT NULL,
    titulo character varying(255) NOT NULL,
    descricao text,
    criador_id integer NOT NULL,
    responsavel_id integer,
    prazo date,
    prioridade public.tarefas_prioridade_enum DEFAULT 'media'::public.tarefas_prioridade_enum NOT NULL,
    ordem integer NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    data_criacao timestamp without time zone DEFAULT now(),
    data_atualizacao timestamp without time zone DEFAULT now()
);


--
-- Name: tarefas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tarefas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tarefas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tarefas_id_seq OWNED BY public.tarefas.id;


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    preference_key character varying(100) NOT NULL,
    preference_value jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE user_preferences; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_preferences IS 'Stores user preferences and settings (dashboard layout, theme, notifications, etc)';


--
-- Name: user_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_preferences_id_seq OWNED BY public.user_preferences.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    role_id integer,
    ativo boolean DEFAULT true NOT NULL,
    tentativas_login integer DEFAULT 0 NOT NULL,
    token_reset character varying(255),
    settings jsonb DEFAULT '{}'::jsonb,
    usuario character varying(255) NOT NULL,
    ultimo_login timestamp without time zone,
    bloqueado_ate timestamp without time zone,
    token_reset_expira timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp without time zone,
    avatar_url character varying(500),
    matricula character varying(50)
)
WITH (autovacuum_vacuum_scale_factor='0.1', autovacuum_analyze_scale_factor='0.05');


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: vw_notificacoes_estatisticas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_notificacoes_estatisticas AS
 SELECT usuario_id,
    count(*) AS total_notificacoes,
    count(
        CASE
            WHEN (lida = false) THEN 1
            ELSE NULL::integer
        END) AS nao_lidas,
    count(
        CASE
            WHEN (lida = true) THEN 1
            ELSE NULL::integer
        END) AS lidas,
    count(
        CASE
            WHEN (tipo = 'solicitacao_pendente'::public.notificacao_tipo_enum) THEN 1
            ELSE NULL::integer
        END) AS solicitacoes_pendentes,
    count(
        CASE
            WHEN (tipo = 'novo_processo'::public.notificacao_tipo_enum) THEN 1
            ELSE NULL::integer
        END) AS novos_processos,
    count(
        CASE
            WHEN ((prioridade = 'critica'::public.notificacao_prioridade_enum) AND (lida = false)) THEN 1
            ELSE NULL::integer
        END) AS criticas_nao_lidas,
    max(created_at) AS ultima_notificacao
   FROM public.notificacoes
  WHERE (deleted_at IS NULL)
  GROUP BY usuario_id;


--
-- Name: anexos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos ALTER COLUMN id SET DEFAULT nextval('public.anexos_id_seq'::regclass);


--
-- Name: auditorias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias ALTER COLUMN id SET DEFAULT nextval('public.auditorias_id_seq'::regclass);


--
-- Name: checklists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists ALTER COLUMN id SET DEFAULT nextval('public.checklists_id_seq'::regclass);


--
-- Name: colunas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colunas ALTER COLUMN id SET DEFAULT nextval('public.colunas_id_seq'::regclass);


--
-- Name: comentarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios ALTER COLUMN id SET DEFAULT nextval('public.comentarios_id_seq'::regclass);


--
-- Name: desarquivamento_anexos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_anexos ALTER COLUMN id SET DEFAULT nextval('public.desarquivamento_anexos_id_seq'::regclass);


--
-- Name: desarquivamento_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_comments ALTER COLUMN id SET DEFAULT nextval('public.desarquivamento_comments_id_seq'::regclass);


--
-- Name: desarquivamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamentos ALTER COLUMN id SET DEFAULT nextval('public.desarquivamentos_id_seq'::regclass);


--
-- Name: desarquivamentos numero_solicitacao; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamentos ALTER COLUMN numero_solicitacao SET DEFAULT nextval('public.desarquivamentos_numero_solicitacao_seq'::regclass);


--
-- Name: historico_tarefas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_tarefas ALTER COLUMN id SET DEFAULT nextval('public.historico_tarefas_id_seq'::regclass);


--
-- Name: itens_checklist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist ALTER COLUMN id SET DEFAULT nextval('public.itens_checklist_id_seq'::regclass);


--
-- Name: membros_projeto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membros_projeto ALTER COLUMN id SET DEFAULT nextval('public.membros_projeto_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- Name: projetos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projetos ALTER COLUMN id SET DEFAULT nextval('public.projetos_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: tarefas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas ALTER COLUMN id SET DEFAULT nextval('public.tarefas_id_seq'::regclass);


--
-- Name: user_preferences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences ALTER COLUMN id SET DEFAULT nextval('public.user_preferences_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: anexos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.anexos (id, tarefa_id, usuario_id, nome_original, nome_arquivo, caminho_arquivo, tipo_mime, tamanho_bytes, created_at) FROM stdin;
\.


--
-- Data for Name: auditorias; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auditorias (user_id, entity_name, ip_address, user_agent, success, error, id, action, entity_id, details, response, "timestamp") FROM stdin;
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	1	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-10-31T14:40:46.344Z"}	\N	2025-10-31 11:40:46.344861
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	2	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-10-31T15:09:39.430Z"}	\N	2025-10-31 12:09:39.430389
2	auth	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	3	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-10-31T16:29:08.918Z"}	\N	2025-10-31 13:29:08.918687
2	auth	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	4	LOGOUT	\N	{"logoutAction":true,"timestamp":"2025-10-31T16:29:13.089Z"}	\N	2025-10-31 13:29:13.089371
1	auth	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	5	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-10-31T16:29:19.625Z"}	\N	2025-10-31 13:29:19.625882
1	auth	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	6	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-10-31T16:42:37.239Z"}	\N	2025-10-31 13:42:37.240211
2	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	7	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-04T11:39:38.013Z"}	\N	2025-11-04 08:39:38.014234
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	8	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-04T11:39:50.126Z"}	\N	2025-11-04 08:39:50.126482
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	9	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-04T12:16:47.257Z"}	\N	2025-11-04 09:16:47.25803
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	10	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-04T12:47:35.811Z"}	\N	2025-11-04 09:47:35.812329
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	11	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-04T13:58:44.902Z"}	\N	2025-11-04 10:58:44.903138
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	12	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T13:49:22.896Z"}	\N	2025-11-06 10:49:22.896942
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	13	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T13:49:32.968Z"}	\N	2025-11-06 10:49:32.969069
1	auth	172.18.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	14	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T13:49:42.825Z"}	\N	2025-11-06 10:49:42.825476
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	15	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T15:11:13.840Z"}	\N	2025-11-06 12:11:13.841558
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	16	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T15:11:26.009Z"}	\N	2025-11-06 12:11:26.010039
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	17	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T15:13:13.095Z"}	\N	2025-11-06 12:13:13.09585
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	18	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T15:38:24.545Z"}	\N	2025-11-06 12:38:24.545738
1	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	19	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T15:56:14.727Z"}	\N	2025-11-06 12:56:14.727648
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	20	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T15:59:43.262Z"}	\N	2025-11-06 12:59:43.26327
1	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	21	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T16:07:38.590Z"}	\N	2025-11-06 13:07:38.590526
1	auth	177.87.99.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	22	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T16:11:55.513Z"}	\N	2025-11-06 13:11:55.514317
1	auth	177.51.10.147	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	t	\N	23	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-06T16:19:19.757Z"}	\N	2025-11-06 13:19:19.757624
1	auth	172.18.0.2	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	t	\N	24	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T10:31:47.039Z"}	\N	2025-11-07 07:31:47.040177
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	25	CREATE	160	{"details":"Novo desarquivamento criado: 1733117 - KIVIAN SANTOS DIAS DA COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":160,"numeroNicLaudoAuto":"1733117","numeroProcesso":"03910025.001253/2024-79","nomeCompleto":"KIVIAN SANTOS DIAS DA COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:17:23.290Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":160,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:17:23.416636
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	26	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T14:19:25.713Z"}	\N	2025-11-07 11:19:25.713674
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	27	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T14:31:09.024Z"}	\N	2025-11-07 11:31:09.025361
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	28	CREATE	260	{"details":"Novo desarquivamento criado: 121941200 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":260,"numeroNicLaudoAuto":"121941200","numeroProcesso":"*","nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:32:18.643Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":260,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:32:18.868534
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	29	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T14:46:35.453Z"}	\N	2025-11-07 11:46:35.453706
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	30	CREATE	360	{"details":"Novo desarquivamento criado: 121941200 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":360,"numeroNicLaudoAuto":"121941200","numeroProcesso":"*","nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.517Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":360,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.518592
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	31	CREATE	361	{"details":"Novo desarquivamento criado: 1560/2019 - SANDRA DIONISIO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":361,"numeroNicLaudoAuto":"1560/2019","numeroProcesso":"OFÍCIO Nº 794/2019","nomeCompleto":"SANDRA DIONISIO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.537Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":361,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.537669
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	32	CREATE	362	{"details":"Novo desarquivamento criado: 1733117 - KIVIAN SANTOS DIAS DA COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":362,"numeroNicLaudoAuto":"1733117","numeroProcesso":"03910025.001253/2024-79","nomeCompleto":"KIVIAN SANTOS DIAS DA COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.546Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":362,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.546334
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	33	CREATE	363	{"details":"Novo desarquivamento criado: 3717458 - ANTONIO FIGUEREDO DE LIMA JUNIOR (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":363,"numeroNicLaudoAuto":"3717458","numeroProcesso":"03910025.001310/2024-10","nomeCompleto":"ANTONIO FIGUEREDO DE LIMA JUNIOR","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.554Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":363,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.554453
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	34	CREATE	364	{"details":"Novo desarquivamento criado: 615/2019 e 619/2019 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":364,"numeroNicLaudoAuto":"615/2019 e 619/2019","numeroProcesso":"*","nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.561Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":364,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.561887
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	35	CREATE	365	{"details":"Novo desarquivamento criado: 140731 - WILLIAN DE OLIVEIRA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":365,"numeroNicLaudoAuto":"140731","numeroProcesso":"03910025.001605/2024-96","nomeCompleto":"WILLIAN DE OLIVEIRA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.569Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":365,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.56961
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	36	CREATE	366	{"details":"Novo desarquivamento criado: 100454 - JOSÉ LEANDRO ALMEIDA PINTO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":366,"numeroNicLaudoAuto":"100454","numeroProcesso":"03910025.001605/2024-96","nomeCompleto":"JOSÉ LEANDRO ALMEIDA PINTO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.575Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":366,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.575454
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	37	CREATE	367	{"details":"Novo desarquivamento criado: 151685 - JOSIMAR JOSÉ DA SILVA JÚNIOR (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":367,"numeroNicLaudoAuto":"151685","numeroProcesso":"03910002.002911/2024-16","nomeCompleto":"JOSIMAR JOSÉ DA SILVA JÚNIOR","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.582Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":367,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.582543
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	38	CREATE	368	{"details":"Novo desarquivamento criado: 2763144 - MARCELO PINHEIRO DE MELO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":368,"numeroNicLaudoAuto":"2763144","numeroProcesso":"03910025.001672/2024-19","nomeCompleto":"MARCELO PINHEIRO DE MELO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.589Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":368,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.589664
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	39	CREATE	369	{"details":"Novo desarquivamento criado: 148133 - LUCIANO MEDEIROS DE ARAÚJO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":369,"numeroNicLaudoAuto":"148133","numeroProcesso":"03910025.001885/2024-32","nomeCompleto":"LUCIANO MEDEIROS DE ARAÚJO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.596Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":369,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.597377
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	40	CREATE	370	{"details":"Novo desarquivamento criado: 2937931 - FERNANDA GONZAGA SOARES (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":370,"numeroNicLaudoAuto":"2937931","numeroProcesso":"03910002.003132/2024-20","nomeCompleto":"FERNANDA GONZAGA SOARES","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.604Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":370,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.60482
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	41	CREATE	371	{"details":"Novo desarquivamento criado: 2763202 - WILKLEFFY JEOVA FERREIRA DANTAS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":371,"numeroNicLaudoAuto":"2763202","numeroProcesso":"03910025.001970/2024-09","nomeCompleto":"WILKLEFFY JEOVA FERREIRA DANTAS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.610Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":371,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.610493
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	42	CREATE	372	{"details":"Novo desarquivamento criado: 2777765 - RUI CASSIMIRO DE OLIVEIRA/ GRACILANE AGUIAR DE SOUSA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":372,"numeroNicLaudoAuto":"2777765","numeroProcesso":"03910010100050/2024-97","nomeCompleto":"RUI CASSIMIRO DE OLIVEIRA/ GRACILANE AGUIAR DE SOUSA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.618Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":372,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.618585
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	43	CREATE	373	{"details":"Novo desarquivamento criado: 3931740 - RICARDO ANTONIO CAVALCANTI ARAÚJO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":373,"numeroNicLaudoAuto":"3931740","numeroProcesso":"03910008.001970/2024-17","nomeCompleto":"RICARDO ANTONIO CAVALCANTI ARAÚJO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.626Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":373,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.626293
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	44	CREATE	374	{"details":"Novo desarquivamento criado: 36.031 LIVRO 361 - HAROLDO DE SÁ BEZERRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":374,"numeroNicLaudoAuto":"36.031 LIVRO 361","numeroProcesso":"05510096.00164/2024-31","nomeCompleto":"HAROLDO DE SÁ BEZERRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.634Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":374,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.634251
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	45	CREATE	375	{"details":"Novo desarquivamento criado: 208225 - FRANCISCO CANINDÉ FERREIRA DE SOUZA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":375,"numeroNicLaudoAuto":"208225","numeroProcesso":"03910024.003455/2024-65","nomeCompleto":"FRANCISCO CANINDÉ FERREIRA DE SOUZA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.641Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":375,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.641402
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	46	CREATE	376	{"details":"Novo desarquivamento criado: 2971494 - BEATRIZ JOENNE DE LIMA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":376,"numeroNicLaudoAuto":"2971494","numeroProcesso":"039100157.000088/2024-14","nomeCompleto":"BEATRIZ JOENNE DE LIMA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.648Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":376,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.648771
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	47	CREATE	377	{"details":"Novo desarquivamento criado: 1813957 - EMERSON WAGNER BEZERRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":377,"numeroNicLaudoAuto":"1813957","numeroProcesso":"03910025.002320/2024-72","nomeCompleto":"EMERSON WAGNER BEZERRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.655Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":377,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.655294
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	48	CREATE	378	{"details":"Novo desarquivamento criado: 1772273 - MARIA DO CÉU GENTIL (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":378,"numeroNicLaudoAuto":"1772273","numeroProcesso":"11910500.000106/2024-84","nomeCompleto":"MARIA DO CÉU GENTIL","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.660Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":378,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.660145
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	49	CREATE	379	{"details":"Novo desarquivamento criado: 2886602 - ANA HELOIZA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":379,"numeroNicLaudoAuto":"2886602","numeroProcesso":"11910500.000111/2024-97","nomeCompleto":"ANA HELOIZA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.667Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":379,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.667549
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	50	CREATE	380	{"details":"Novo desarquivamento criado: 151601 - JOÃO JOAQUIM DE MOURA FILHO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":380,"numeroNicLaudoAuto":"151601","numeroProcesso":"039100157.000106/2024-68","nomeCompleto":"JOÃO JOAQUIM DE MOURA FILHO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.673Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":380,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.674217
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	51	CREATE	381	{"details":"Novo desarquivamento criado: 98253 - SEVERINO MOREIRA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":381,"numeroNicLaudoAuto":"98253","numeroProcesso":"03910007.004428/2024-18","nomeCompleto":"SEVERINO MOREIRA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.681Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":381,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.681574
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	52	CREATE	382	{"details":"Novo desarquivamento criado: 145162 - JOANILSON DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":382,"numeroNicLaudoAuto":"145162","numeroProcesso":"03910025.002516/2024-67","nomeCompleto":"JOANILSON DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.688Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":382,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.688279
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	53	CREATE	383	{"details":"Novo desarquivamento criado: LIVRO 84 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":383,"numeroNicLaudoAuto":"LIVRO 84","numeroProcesso":null,"nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.695Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":383,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.696108
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	54	CREATE	384	{"details":"Novo desarquivamento criado: 1958218 - JESUN SARAIVA / MARIA DE LOURDES DE MELO (SUSPEITA DE DUPLICIDADE) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":384,"numeroNicLaudoAuto":"1958218","numeroProcesso":"03910024.004007/2024-89","nomeCompleto":"JESUN SARAIVA / MARIA DE LOURDES DE MELO (SUSPEITA DE DUPLICIDADE)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.702Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":384,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.703306
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	55	CREATE	385	{"details":"Novo desarquivamento criado: 89203 - MIGUEL ELIAS DE MORAIS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":385,"numeroNicLaudoAuto":"89203","numeroProcesso":"03910014.002759/2024-24","nomeCompleto":"MIGUEL ELIAS DE MORAIS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.709Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":385,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.709551
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	56	CREATE	386	{"details":"Novo desarquivamento criado: - - PRONTUÁRIO DO GRUPO DE LAMPIÃO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":386,"numeroNicLaudoAuto":"-","numeroProcesso":"-","nomeCompleto":"PRONTUÁRIO DO GRUPO DE LAMPIÃO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.715Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":386,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.715765
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	57	CREATE	387	{"details":"Novo desarquivamento criado: 2007406 - JOSÉ CLENILSON COSTA LIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":387,"numeroNicLaudoAuto":"2007406","numeroProcesso":"039100157.000139/2024-16","nomeCompleto":"JOSÉ CLENILSON COSTA LIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.721Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":387,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.721619
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	58	CREATE	388	{"details":"Novo desarquivamento criado: 186028 - ANTONIO CARLOS SOARES DA COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":388,"numeroNicLaudoAuto":"186028","numeroProcesso":"03910024.004353/2024-67","nomeCompleto":"ANTONIO CARLOS SOARES DA COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.727Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":388,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.727347
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	59	CREATE	389	{"details":"Novo desarquivamento criado: 3139138 - LAZARO LEONARDO GOMES DANTAS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":389,"numeroNicLaudoAuto":"3139138","numeroProcesso":"03910008.002963/2024-24","nomeCompleto":"LAZARO LEONARDO GOMES DANTAS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.734Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":389,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.73441
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	60	CREATE	390	{"details":"Novo desarquivamento criado: 147874 - JOSIEL BRAGA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":390,"numeroNicLaudoAuto":"147874","numeroProcesso":"03910025.003026/2024-88","nomeCompleto":"JOSIEL BRAGA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.740Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":390,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.740461
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	61	CREATE	391	{"details":"Novo desarquivamento criado: 201417 - MATHEUS FELIPE PAULISTA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":391,"numeroNicLaudoAuto":"201417","numeroProcesso":"03910025.003026/2024-88","nomeCompleto":"MATHEUS FELIPE PAULISTA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.746Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":391,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.746197
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	62	CREATE	392	{"details":"Novo desarquivamento criado: 57951 - MARIA GORETTI TINOCO DE OLIVEIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":392,"numeroNicLaudoAuto":"57951","numeroProcesso":"039100157.000152/2024-67","nomeCompleto":"MARIA GORETTI TINOCO DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.752Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":392,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.752333
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	63	CREATE	393	{"details":"Novo desarquivamento criado: 002.468.645 | 002.705.228 | 002.685.257 | 1.856.051 - nº 002.468.645, RODRIGU FIGUEIRA DA COSTA\\nnº 002.705.228 RODRIGO RODRIGUES DA SILVA\\nn° 002.685.257 ELIAS RODRIGO DA SILVA\\n\\nnº 1.856.051 RODRIGO RODRIGUES COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":393,"numeroNicLaudoAuto":"002.468.645 | 002.705.228 | 002.685.257 | 1.856.051","numeroProcesso":"11910500.000163/2024-63","nomeCompleto":"nº 002.468.645, RODRIGU FIGUEIRA DA COSTA\\nnº 002.705.228 RODRIGO RODRIGUES DA SILVA\\nn° 002.685.257 ELIAS RODRIGO DA SILVA\\n\\nnº 1.856.051 RODRIGO RODRIGUES COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.757Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":393,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.758151
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	64	CREATE	394	{"details":"Novo desarquivamento criado: 3791219 - n° 3.791.219 (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":394,"numeroNicLaudoAuto":"3791219","numeroProcesso":"039100157.000161/2024-58","nomeCompleto":"n° 3.791.219","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.764Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":394,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.764825
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	357	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:52:26.455Z"}	\N	2025-11-10 12:52:26.45571
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	65	CREATE	395	{"details":"Novo desarquivamento criado: 1086141 - RITA CELIA DANTAS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":395,"numeroNicLaudoAuto":"1086141","numeroProcesso":"039100157.000185/2024-15","nomeCompleto":"RITA CELIA DANTAS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.772Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":395,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.772648
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	66	CREATE	396	{"details":"Novo desarquivamento criado: 1796709 - n° 1.796.709 FRANCISCO TALES DE OLIVEIRA PINTO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":396,"numeroNicLaudoAuto":"1796709","numeroProcesso":"119110101.000895/2024-56","nomeCompleto":"n° 1.796.709 FRANCISCO TALES DE OLIVEIRA PINTO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.778Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":396,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.778322
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	67	CREATE	397	{"details":"Novo desarquivamento criado: 2923684 - 2923684 (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":397,"numeroNicLaudoAuto":"2923684","numeroProcesso":"03910024.005151/2024-32","nomeCompleto":"2923684","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.786Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":397,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.786438
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	68	CREATE	398	{"details":"Novo desarquivamento criado: 138056 - ROMÁRIO MATHEUS DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":398,"numeroNicLaudoAuto":"138056","numeroProcesso":"03910025.003518/2024-73","nomeCompleto":"ROMÁRIO MATHEUS DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.792Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":398,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.792202
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	69	CREATE	399	{"details":"Novo desarquivamento criado: 4.197.288/RN - MARCELO COTTA DE MELLO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":399,"numeroNicLaudoAuto":"4.197.288/RN","numeroProcesso":"039100157.000001/2025-90","nomeCompleto":"MARCELO COTTA DE MELLO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.797Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":399,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.798268
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	70	CREATE	400	{"details":"Novo desarquivamento criado: nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES - nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":400,"numeroNicLaudoAuto":"nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES","numeroProcesso":"11910035.000074/2025-31","nomeCompleto":"nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.804Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":400,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.80448
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	71	CREATE	401	{"details":"Novo desarquivamento criado: BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 - BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 | Alexandro Batista da Costa, laudo de Exame Necroscópico nº 01.01241.06/17) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":401,"numeroNicLaudoAuto":"BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17","numeroProcesso":"039100154.000276/2024-72","nomeCompleto":"BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 | Alexandro Batista da Costa, laudo de Exame Necroscópico nº 01.01241.06/17)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.810Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":401,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.810268
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	72	CREATE	402	{"details":"Novo desarquivamento criado: 3.764.469 \\\\ 3.294.805 - DAMIÃO BARBOSA SIMPLICO | JOÃO CARLOS MARCOLINO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":402,"numeroNicLaudoAuto":"3.764.469 \\\\ 3.294.805","numeroProcesso":"11910035.000083/2025-22","nomeCompleto":"DAMIÃO BARBOSA SIMPLICO | JOÃO CARLOS MARCOLINO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.816Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":402,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.817015
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	73	CREATE	403	{"details":"Novo desarquivamento criado: nº 203.297 SSP/RN - Aristofanes Medeiros da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":403,"numeroNicLaudoAuto":"nº 203.297 SSP/RN","numeroProcesso":"03910024.000276/2025-57","nomeCompleto":"Aristofanes Medeiros da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.822Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":403,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.823123
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	74	CREATE	404	{"details":"Novo desarquivamento criado: nº 140731 - WILLIAN DE OLIVEIRA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":404,"numeroNicLaudoAuto":"nº 140731","numeroProcesso":"03910025.000238/2025-94","nomeCompleto":"WILLIAN DE OLIVEIRA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.828Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":404,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.828222
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	107	CREATE	437	{"details":"Novo desarquivamento criado: 1,303,132 - ELIZABETH VICTOR DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":437,"numeroNicLaudoAuto":"1,303,132","numeroProcesso":"03910024.001991/2025-15","nomeCompleto":"ELIZABETH VICTOR DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.031Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":437,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.032194
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	75	CREATE	405	{"details":"Novo desarquivamento criado: Ofício nº 003/2016 - Prontuário nº 140731 - WILLIAN DE OLIVEIRA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":405,"numeroNicLaudoAuto":"Ofício nº 003/2016 - Prontuário nº 140731","numeroProcesso":"03910025.000238/2025-95","nomeCompleto":"WILLIAN DE OLIVEIRA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.834Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":405,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.834917
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	76	CREATE	406	{"details":"Novo desarquivamento criado: 3769456 - BENICIO COSTA (Não localizado) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":406,"numeroNicLaudoAuto":"3769456","numeroProcesso":"039100157.000034/2025-30","nomeCompleto":"BENICIO COSTA (Não localizado)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.840Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":406,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.840377
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	77	CREATE	407	{"details":"Novo desarquivamento criado: 1994569 - LUCENI SILVA DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":407,"numeroNicLaudoAuto":"1994569","numeroProcesso":"03910025.000559/2025-99","nomeCompleto":"LUCENI SILVA DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.846Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":407,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.846563
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	78	CREATE	408	{"details":"Novo desarquivamento criado: 1. Prontuário Civil nº 2.766.547 - nº 2.766.547 MARCOS ADRIANO FILHO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":408,"numeroNicLaudoAuto":"1. Prontuário Civil nº 2.766.547","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.547 MARCOS ADRIANO FILHO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.853Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":408,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.853235
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	79	CREATE	409	{"details":"Novo desarquivamento criado: 2. Prontuário Civil nº 2.766.548 - nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":409,"numeroNicLaudoAuto":"2. Prontuário Civil nº 2.766.548","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.858Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":409,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.858861
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	80	CREATE	410	{"details":"Novo desarquivamento criado: 3. Prontuário Civil nº 2.766.549 - nº 2.766.549\\tJOSE SANTOS LESSA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":410,"numeroNicLaudoAuto":"3. Prontuário Civil nº 2.766.549","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.549\\tJOSE SANTOS LESSA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.865Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":410,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.865299
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	81	CREATE	411	{"details":"Novo desarquivamento criado: 4. Prontuário Civil nº 2.766.908 - nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":411,"numeroNicLaudoAuto":"4. Prontuário Civil nº 2.766.908","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.872Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":411,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.872275
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	82	CREATE	412	{"details":"Novo desarquivamento criado: 5. Prontuário Civil nº 2.821.275 - nº 2.821.275\\tANTONIO JORGE SILVA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":412,"numeroNicLaudoAuto":"5. Prontuário Civil nº 2.821.275","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.821.275\\tANTONIO JORGE SILVA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.877Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":412,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.877516
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	83	CREATE	413	{"details":"Novo desarquivamento criado: 6. Prontuário Civil nº 2.766.907 - nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":413,"numeroNicLaudoAuto":"6. Prontuário Civil nº 2.766.907","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.884Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":413,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.884877
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	84	CREATE	414	{"details":"Novo desarquivamento criado: 7. Prontuário Civil nº 2.821.274 - nº 2.821.274 JARDIEL SILVA E SILVA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":414,"numeroNicLaudoAuto":"7. Prontuário Civil nº 2.821.274","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.821.274 JARDIEL SILVA E SILVA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.890Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":414,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.890796
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	85	CREATE	415	{"details":"Novo desarquivamento criado: 8. Prontuário Civil nº 2.821.267 - nº 2.821.267\\tIVALDO OLIVEIRA VALERIO (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":415,"numeroNicLaudoAuto":"8. Prontuário Civil nº 2.821.267","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.821.267\\tIVALDO OLIVEIRA VALERIO","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.896Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":415,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.896609
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	86	CREATE	416	{"details":"Novo desarquivamento criado: 9. Prontuário Civil nº 2.722.787 - nº 2.722.787\\tABRAAO DA SILVA MENDES (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":416,"numeroNicLaudoAuto":"9. Prontuário Civil nº 2.722.787","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.722.787\\tABRAAO DA SILVA MENDES","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.903Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":416,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.903396
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	87	CREATE	417	{"details":"Novo desarquivamento criado: Prontuário Civil nº 1.801.841 - JOÃO MARIA DA SILVA BARBOSA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":417,"numeroNicLaudoAuto":"Prontuário Civil nº 1.801.841","numeroProcesso":"03910025.000795/2025-13","nomeCompleto":"JOÃO MARIA DA SILVA BARBOSA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.908Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":417,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.908587
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	88	CREATE	418	{"details":"Novo desarquivamento criado: BIC N° : 259713 (OBS: NÃO CONSTA NO BIC ORIGINAL, INFORMAÇÃO CEDIDA PEL JUDICIÁRIO) Prontuário Civil N°  003880814 - JORGE MATEUS FERREIRA DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":418,"numeroNicLaudoAuto":"BIC N° : 259713 (OBS: NÃO CONSTA NO BIC ORIGINAL, INFORMAÇÃO CEDIDA PEL JUDICIÁRIO) Prontuário Civil N°  003880814","numeroProcesso":"03910009.000711/2025-31","nomeCompleto":"JORGE MATEUS FERREIRA DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.913Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":418,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.914155
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	89	CREATE	419	{"details":"Novo desarquivamento criado: Prontuário Civil nº 1.482.989 - JOSÉ GABRIEL DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":419,"numeroNicLaudoAuto":"Prontuário Civil nº 1.482.989","numeroProcesso":"039100157.000072/2025-92","nomeCompleto":"JOSÉ GABRIEL DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.921Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":419,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.921267
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	90	CREATE	420	{"details":"Novo desarquivamento criado: Prontuário Civil n°3.743.038 SSP/RN - JOSÉ FRANCISCO NOGUEIRA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":420,"numeroNicLaudoAuto":"Prontuário Civil n°3.743.038 SSP/RN","numeroProcesso":"03910024.001342/2025-14","nomeCompleto":"JOSÉ FRANCISCO NOGUEIRA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.926Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":420,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.92669
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	91	CREATE	421	{"details":"Novo desarquivamento criado: Prontuário Civil  nº 3.931.670 - TARCIO BARBOSA FERREIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":421,"numeroNicLaudoAuto":"Prontuário Civil  nº 3.931.670","numeroProcesso":"03910025.001052/2025-52","nomeCompleto":"TARCIO BARBOSA FERREIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.933Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":421,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.933964
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	92	CREATE	422	{"details":"Novo desarquivamento criado: Prontuário Civil nº 1.864.472 - DIVALCI VILAR DE MEDEIROS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":422,"numeroNicLaudoAuto":"Prontuário Civil nº 1.864.472","numeroProcesso":"11910072.000353/2025-59","nomeCompleto":"DIVALCI VILAR DE MEDEIROS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.940Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":422,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.940815
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	93	CREATE	423	{"details":"Novo desarquivamento criado: Prontuário Civil nº 3.379.589 - DIVALCI MENDONCA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":423,"numeroNicLaudoAuto":"Prontuário Civil nº 3.379.589","numeroProcesso":"11910072.000353/2025-59","nomeCompleto":"DIVALCI MENDONCA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.946Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":423,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.94708
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	94	CREATE	424	{"details":"Novo desarquivamento criado: Prontuário civil nº 494.283; nº CPF 381.100.404-20 - JOSIVALDO MONTEIRO DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":424,"numeroNicLaudoAuto":"Prontuário civil nº 494.283; nº CPF 381.100.404-20","numeroProcesso":"11910166.000185/2025-52","nomeCompleto":"JOSIVALDO MONTEIRO DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.953Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":424,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.95346
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	95	CREATE	425	{"details":"Novo desarquivamento criado: Prontuário Civil nº 2.026.941 - DENILDA FELIX DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":425,"numeroNicLaudoAuto":"Prontuário Civil nº 2.026.941","numeroProcesso":"039100157.000090/2025-74","nomeCompleto":"DENILDA FELIX DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.958Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":425,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.958766
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	198	CREATE	528	{"details":"Novo desarquivamento criado: LIVRO 84 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":528,"numeroNicLaudoAuto":"LIVRO 84","numeroProcesso":null,"nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.372Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":528,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.373119
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	96	CREATE	426	{"details":"Novo desarquivamento criado: Prontuário Civil nº: 2.216.369 \\nProntuário Civil nº 3.866.295 - CARLOS JORGE ANDRADE DOS SANTOS (Nº: 2.216.369)\\n - LEONARDO PEREIRA DANTAS (Nº 3.866.295) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":426,"numeroNicLaudoAuto":"Prontuário Civil nº: 2.216.369 \\nProntuário Civil nº 3.866.295","numeroProcesso":"11910535.000068/2025-43","nomeCompleto":"CARLOS JORGE ANDRADE DOS SANTOS (Nº: 2.216.369)\\n - LEONARDO PEREIRA DANTAS (Nº 3.866.295)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.963Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":426,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.964091
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	97	CREATE	427	{"details":"Novo desarquivamento criado: Prontuário Civil nº 2.104.196                                             Prontuário Civil nº 2.082.050 - THIAGO ANDRADE DA SILVA (nº 2.104.196 ) / THIAGO ANDRADE DA SILVA LIMA / THIAGO ANDRADE DA SILVA ( nº 2.082.050) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":427,"numeroNicLaudoAuto":"Prontuário Civil nº 2.104.196                                             Prontuário Civil nº 2.082.050","numeroProcesso":"039100157.000093/2025-16","nomeCompleto":"THIAGO ANDRADE DA SILVA (nº 2.104.196 ) / THIAGO ANDRADE DA SILVA LIMA / THIAGO ANDRADE DA SILVA ( nº 2.082.050)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.970Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":427,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.970484
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	98	CREATE	428	{"details":"Novo desarquivamento criado: nº 2.923.050 SSP/RN - KELLYSON CARLOS DO NASCIMENTO SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":428,"numeroNicLaudoAuto":"nº 2.923.050 SSP/RN","numeroProcesso":"03910024.001553/2025-49","nomeCompleto":"KELLYSON CARLOS DO NASCIMENTO SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.976Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":428,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.976147
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	99	CREATE	429	{"details":"Novo desarquivamento criado: BIC n°138.056 - ROMÁRIO MATHEUS DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":429,"numeroNicLaudoAuto":"BIC n°138.056","numeroProcesso":"03910025.001262/2025-41","nomeCompleto":"ROMÁRIO MATHEUS DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.981Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":429,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.982073
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	100	CREATE	430	{"details":"Novo desarquivamento criado: Nº 301.790 - FRANCISCO DE ASSIS MORENO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":430,"numeroNicLaudoAuto":"Nº 301.790","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"FRANCISCO DE ASSIS MORENO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.987Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":430,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.987957
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	101	CREATE	431	{"details":"Novo desarquivamento criado: Nº 769.262 - LUIZ ANTÔNIO DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":431,"numeroNicLaudoAuto":"Nº 769.262","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"LUIZ ANTÔNIO DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:56.993Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":431,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:56.993375
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	102	CREATE	432	{"details":"Novo desarquivamento criado: Nº 1.857.918 - FRANCISCO FÉLIX DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":432,"numeroNicLaudoAuto":"Nº 1.857.918","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"FRANCISCO FÉLIX DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.000Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":432,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.00053
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	103	CREATE	433	{"details":"Novo desarquivamento criado: Nº 736.031 - FRANCISCO CAETANO FILHO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":433,"numeroNicLaudoAuto":"Nº 736.031","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"FRANCISCO CAETANO FILHO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.007Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":433,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.007478
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	104	CREATE	434	{"details":"Novo desarquivamento criado: RG nº 2.258.371 - RODNEI ELDER PACHECO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":434,"numeroNicLaudoAuto":"RG nº 2.258.371","numeroProcesso":"03910009.001052/2025-51","nomeCompleto":"RODNEI ELDER PACHECO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.013Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":434,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.013414
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	105	CREATE	435	{"details":"Novo desarquivamento criado: RG nº 2.392.130 - LEANDRO QUEIROZ DOS REIS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":435,"numeroNicLaudoAuto":"RG nº 2.392.130","numeroProcesso":"03910009.001052/2025-51","nomeCompleto":"LEANDRO QUEIROZ DOS REIS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.020Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":435,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.020527
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	106	CREATE	436	{"details":"Novo desarquivamento criado: 196,351 - JOSE SILVESTRE DE PONTES (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":436,"numeroNicLaudoAuto":"196,351","numeroProcesso":"03910024.001926/2025-81","nomeCompleto":"JOSE SILVESTRE DE PONTES","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.025Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":436,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.025724
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	108	CREATE	438	{"details":"Novo desarquivamento criado: 2,978,102 - RIGNER LUIZ FREITAS DE FRANCA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":438,"numeroNicLaudoAuto":"2,978,102","numeroProcesso":"03910024.001991/2025-15","nomeCompleto":"RIGNER LUIZ FREITAS DE FRANCA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.037Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":438,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.037926
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	109	CREATE	439	{"details":"Novo desarquivamento criado: Dev. de processo físico - MARCOS ANTÔNIO LIMA DA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":439,"numeroNicLaudoAuto":"Dev. de processo físico","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"MARCOS ANTÔNIO LIMA DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.044Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":439,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.044296
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	110	CREATE	440	{"details":"Novo desarquivamento criado: 12.00113/206 - SILVANEIDE PAULO DA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":440,"numeroNicLaudoAuto":"12.00113/206","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"SILVANEIDE PAULO DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.051Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":440,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.051298
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	111	CREATE	441	{"details":"Novo desarquivamento criado: 01.00394.03/2012 - FRANCISCO ANACLETO DE LIMA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":441,"numeroNicLaudoAuto":"01.00394.03/2012","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"FRANCISCO ANACLETO DE LIMA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.056Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":441,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.056793
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	112	CREATE	442	{"details":"Novo desarquivamento criado: 899/2017 NIC 00142 - N.I. - MULHER (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":442,"numeroNicLaudoAuto":"899/2017 NIC 00142","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I. - MULHER","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.063Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":442,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.063481
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	113	CREATE	443	{"details":"Novo desarquivamento criado: 01.01899.11/13 - N.I. (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":443,"numeroNicLaudoAuto":"01.01899.11/13","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.069Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":443,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.069945
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	114	CREATE	444	{"details":"Novo desarquivamento criado: 01.1020.07/09 - IVANILSON CAVALCANTE FARIAS (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":444,"numeroNicLaudoAuto":"01.1020.07/09","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"IVANILSON CAVALCANTE FARIAS","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.075Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":444,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.075717
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	115	CREATE	445	{"details":"Novo desarquivamento criado: 01.1492.11/11 - CRISTIANE GIL GARCIA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":445,"numeroNicLaudoAuto":"01.1492.11/11","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"CRISTIANE GIL GARCIA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.081Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":445,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.082106
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	116	CREATE	446	{"details":"Novo desarquivamento criado: 01.1493.11/11 - BRUNO AZAMBUJA DE FREITAS (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":446,"numeroNicLaudoAuto":"01.1493.11/11","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"BRUNO AZAMBUJA DE FREITAS","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.088Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":446,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.088473
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	117	CREATE	447	{"details":"Novo desarquivamento criado: Aguardando DHPP - EVANDRO OLIVEIRA DE SOUZA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":447,"numeroNicLaudoAuto":"Aguardando DHPP","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"EVANDRO OLIVEIRA DE SOUZA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.093Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":447,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.093871
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	118	CREATE	448	{"details":"Novo desarquivamento criado: 01.1366.08/14 - N. I. - RODRIGO DE OLIVEIRA DIAS (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":448,"numeroNicLaudoAuto":"01.1366.08/14","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N. I. - RODRIGO DE OLIVEIRA DIAS","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.101Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":448,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.101353
4	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	358	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:55:00.453Z"}	\N	2025-11-10 12:55:00.453503
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	119	CREATE	449	{"details":"Novo desarquivamento criado: 01.0114.01/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":449,"numeroNicLaudoAuto":"01.0114.01/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.106Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":449,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.107028
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	120	CREATE	450	{"details":"Novo desarquivamento criado: 01.1190.06/17 - MAGNO SILVA SENA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":450,"numeroNicLaudoAuto":"01.1190.06/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"MAGNO SILVA SENA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.112Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":450,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.112596
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	121	CREATE	451	{"details":"Novo desarquivamento criado: 01.2063.11/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":451,"numeroNicLaudoAuto":"01.2063.11/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.120Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":451,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.120547
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	122	CREATE	452	{"details":"Novo desarquivamento criado: 01.0860.05/15 - JOSÉ HEBERSON BARBOSA SOARES (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":452,"numeroNicLaudoAuto":"01.0860.05/15","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"JOSÉ HEBERSON BARBOSA SOARES","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.125Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":452,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.126114
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	123	CREATE	453	{"details":"Novo desarquivamento criado: 01.0569.03/17 - FRANCISCO MARCOS ALVES (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":453,"numeroNicLaudoAuto":"01.0569.03/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"FRANCISCO MARCOS ALVES","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.132Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":453,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.132191
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	124	CREATE	454	{"details":"Novo desarquivamento criado: 05.00404.10/16 - ALICE RODRIGUES VICENTE (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":454,"numeroNicLaudoAuto":"05.00404.10/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"ALICE RODRIGUES VICENTE","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.137Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":454,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.138005
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	125	CREATE	455	{"details":"Novo desarquivamento criado: 01.1746.10/14 - FRANKLIN RAGNER SANTOS DE FIGUEIREDO (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":455,"numeroNicLaudoAuto":"01.1746.10/14","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"FRANKLIN RAGNER SANTOS DE FIGUEIREDO","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.144Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":455,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.144278
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	126	CREATE	456	{"details":"Novo desarquivamento criado: 01.1501.07/17 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":456,"numeroNicLaudoAuto":"01.1501.07/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.150Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":456,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.150942
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	127	CREATE	457	{"details":"Novo desarquivamento criado: 01.0516.04/11 - LODOGILDO DE ARAÚJO (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":457,"numeroNicLaudoAuto":"01.0516.04/11","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"LODOGILDO DE ARAÚJO","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.156Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":457,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.156727
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	128	CREATE	458	{"details":"Novo desarquivamento criado: 01.0111.01/13 - JONATHAN CARDOSO DE LIMA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":458,"numeroNicLaudoAuto":"01.0111.01/13","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"JONATHAN CARDOSO DE LIMA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.162Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":458,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.162539
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	129	CREATE	459	{"details":"Novo desarquivamento criado: 09.0002.02.2016 - OSSADA HUMANA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":459,"numeroNicLaudoAuto":"09.0002.02.2016","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"OSSADA HUMANA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.168Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":459,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.168963
4	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	t	\N	359	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T16:24:48.314Z"}	\N	2025-11-10 13:24:48.315224
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	365	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T17:17:23.271Z"}	\N	2025-11-10 14:17:23.272272
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	130	CREATE	460	{"details":"Novo desarquivamento criado: 01.0084.01/17 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":460,"numeroNicLaudoAuto":"01.0084.01/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.175Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":460,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.17531
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	131	CREATE	461	{"details":"Novo desarquivamento criado: 01.1769.09/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":461,"numeroNicLaudoAuto":"01.1769.09/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.180Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":461,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.180637
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	132	CREATE	462	{"details":"Novo desarquivamento criado: 01.0217.02/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":462,"numeroNicLaudoAuto":"01.0217.02/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.186Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":462,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.186416
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	133	CREATE	463	{"details":"Novo desarquivamento criado: 1389/208 - IBRAHIM MOHAMED KHALIL FILHO (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":463,"numeroNicLaudoAuto":"1389/208","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"IBRAHIM MOHAMED KHALIL FILHO","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.191Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":463,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.192028
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	134	CREATE	464	{"details":"Novo desarquivamento criado: 4,244,388 - FRANKLIN GIVANILDO BEZERRA DA COSTA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":464,"numeroNicLaudoAuto":"4,244,388","numeroProcesso":"03910025.001695/2025-04","nomeCompleto":"FRANKLIN GIVANILDO BEZERRA DA COSTA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.197Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":464,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.19794
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	135	CREATE	465	{"details":"Novo desarquivamento criado: 2,820,755 - PATRÍCIA GOMES BEZERRA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":465,"numeroNicLaudoAuto":"2,820,755","numeroProcesso":"039100157.000133/2025-11","nomeCompleto":"PATRÍCIA GOMES BEZERRA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.206Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":465,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.206208
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	136	CREATE	466	{"details":"Novo desarquivamento criado: Não possui - LUIS GONZAGA DA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":466,"numeroNicLaudoAuto":"Não possui","numeroProcesso":"039100121.000005/2025-85","nomeCompleto":"LUIS GONZAGA DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.211Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":466,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.211448
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	137	CREATE	467	{"details":"Novo desarquivamento criado: BIC N° 146.040 - JOÃO MARIA BARACHO ALBINO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":467,"numeroNicLaudoAuto":"BIC N° 146.040","numeroProcesso":"03910025.001717/2025-28","nomeCompleto":"JOÃO MARIA BARACHO ALBINO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.217Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":467,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.217865
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	138	CREATE	468	{"details":"Novo desarquivamento criado: BIC N° 146.040 - JORGE MATEUS FERREIRA DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":468,"numeroNicLaudoAuto":"BIC N° 146.040","numeroProcesso":"03910009.000711/2025-31","nomeCompleto":"JORGE MATEUS FERREIRA DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.223Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":468,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.22408
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	139	CREATE	469	{"details":"Novo desarquivamento criado: nº 1.391.265 - MARIA DE FATIMA SARAIVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":469,"numeroNicLaudoAuto":"nº 1.391.265","numeroProcesso":"039100157.000099/2025-85","nomeCompleto":"MARIA DE FATIMA SARAIVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.229Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":469,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.229447
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	140	CREATE	470	{"details":"Novo desarquivamento criado: 1,725,987 - Nome: Germano Jose Ferreira de Farias\\nFiliação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\\nNaturalidade: Natal/RN\\nData de Nascimento: 14/03/1983 (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":470,"numeroNicLaudoAuto":"1,725,987","numeroProcesso":"03910024.002555/2025-55","nomeCompleto":"Nome: Germano Jose Ferreira de Farias\\nFiliação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\\nNaturalidade: Natal/RN\\nData de Nascimento: 14/03/1983","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.235Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":470,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.235638
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	360	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T16:46:09.449Z"}	\N	2025-11-10 13:46:09.449822
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	141	CREATE	471	{"details":"Novo desarquivamento criado: 1,529,503 - JOHN KENNEDY DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":471,"numeroNicLaudoAuto":"1,529,503","numeroProcesso":"039100157.000110/2025-15","nomeCompleto":"JOHN KENNEDY DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.241Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":471,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.241178
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	142	CREATE	472	{"details":"Novo desarquivamento criado: 1,617,956 - MARCOS DA ROCHA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":472,"numeroNicLaudoAuto":"1,617,956","numeroProcesso":"039100157.000110/2025-16","nomeCompleto":"MARCOS DA ROCHA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.247Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":472,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.247331
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	143	CREATE	473	{"details":"Novo desarquivamento criado: BIC n°109.632 - Daniel Miguel da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":473,"numeroNicLaudoAuto":"BIC n°109.632","numeroProcesso":"039100154.000302/2025-43","nomeCompleto":"Daniel Miguel da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.253Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":473,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.254021
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	144	CREATE	474	{"details":"Novo desarquivamento criado: 1,685,492 - Welkciley Miguel da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":474,"numeroNicLaudoAuto":"1,685,492","numeroProcesso":"039100154.000302/2025-43","nomeCompleto":"Welkciley Miguel da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.260Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":474,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.260344
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	145	CREATE	475	{"details":"Novo desarquivamento criado: RG nº 1.517.069 - Daniel Miguel da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":475,"numeroNicLaudoAuto":"RG nº 1.517.069","numeroProcesso":"039100154.000302/2025-43","nomeCompleto":"Daniel Miguel da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.266Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":475,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.266185
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	146	CREATE	476	{"details":"Novo desarquivamento criado: NÃO INFORMADO / Aguardando o núcleo de Caicó enviar o número - ANTÔNIO SALUSTIO DE AZEVEDO | NASC.: 14/01/1916 (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":476,"numeroNicLaudoAuto":"NÃO INFORMADO / Aguardando o núcleo de Caicó enviar o número","numeroProcesso":"03910181.000389/2025-40","nomeCompleto":"ANTÔNIO SALUSTIO DE AZEVEDO | NASC.: 14/01/1916","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.272Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":476,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.272178
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	147	CREATE	477	{"details":"Novo desarquivamento criado: RG N° 2.617.062 - GEOVANI DE OLIVEIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":477,"numeroNicLaudoAuto":"RG N° 2.617.062","numeroProcesso":"03910025.002014/2025-17","nomeCompleto":"GEOVANI DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.278Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":477,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.278548
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	148	CREATE	478	{"details":"Novo desarquivamento criado: RG N° 3.172.080 - IOLANDA GOMES DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":478,"numeroNicLaudoAuto":"RG N° 3.172.080","numeroProcesso":"039100157.000154/2025-37","nomeCompleto":"IOLANDA GOMES DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.285Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":478,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.285731
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	149	CREATE	479	{"details":"Novo desarquivamento criado: RG nº 1.657.512 - JEAN DEYVID BESERRA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":479,"numeroNicLaudoAuto":"RG nº 1.657.512","numeroProcesso":"039100157.000165/2025-17","nomeCompleto":"JEAN DEYVID BESERRA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.292Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":479,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.292481
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	150	CREATE	480	{"details":"Novo desarquivamento criado: RG 03.636.648 - JOSENILSON DA SILVA BESSA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":480,"numeroNicLaudoAuto":"RG 03.636.648","numeroProcesso":"03910197.000279/2025-17","nomeCompleto":"JOSENILSON DA SILVA BESSA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.298Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":480,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.298582
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	151	CREATE	481	{"details":"Novo desarquivamento criado: 2.043.870/ITEP/RN - ABRAÃO MENDES DA SILVA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":481,"numeroNicLaudoAuto":"2.043.870/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAÃO MENDES DA SILVA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.304Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":481,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.30481
4	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	361	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T16:46:26.274Z"}	\N	2025-11-10 13:46:26.274915
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	152	CREATE	482	{"details":"Novo desarquivamento criado: 2.265.088/ITEP/RN - ABRAAO MENDES TEIXEIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":482,"numeroNicLaudoAuto":"2.265.088/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES TEIXEIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.310Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":482,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.310406
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	153	CREATE	483	{"details":"Novo desarquivamento criado: 2.319.508/ITEP/RN - ABRAAO MENDES PEREIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":483,"numeroNicLaudoAuto":"2.319.508/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES PEREIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.316Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":483,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.317077
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	154	CREATE	484	{"details":"Novo desarquivamento criado: 2.361.121/ITEP/RN - ABRAAO MENDES FARIAS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":484,"numeroNicLaudoAuto":"2.361.121/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES FARIAS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.322Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":484,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.322884
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	155	CREATE	485	{"details":"Novo desarquivamento criado: 2.498.176/ITEP/RN - ABRAAO MENDES SOUZA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":485,"numeroNicLaudoAuto":"2.498.176/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES SOUZA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.328Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":485,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.328207
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	156	CREATE	486	{"details":"Novo desarquivamento criado: 2.766.013/ITEP/RN - JURANDIR BERNARDE LEITE (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":486,"numeroNicLaudoAuto":"2.766.013/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JURANDIR BERNARDE LEITE","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.334Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":486,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.334313
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	157	CREATE	487	{"details":"Novo desarquivamento criado: 2.766.547 /ITEP/RN - MARCOS ADRIANO FILHO (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":487,"numeroNicLaudoAuto":"2.766.547 /ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"MARCOS ADRIANO FILHO","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.339Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":487,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.340097
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	158	CREATE	488	{"details":"Novo desarquivamento criado: 2.766.548/ITEP/RN - JOSE ROBERTO MEDEIROS TENORIO (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":488,"numeroNicLaudoAuto":"2.766.548/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOSE ROBERTO MEDEIROS TENORIO","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.345Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":488,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.345779
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	159	CREATE	489	{"details":"Novo desarquivamento criado: 2.766.549/ITEP/RN - JOSE SANTOS LESSA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":489,"numeroNicLaudoAuto":"2.766.549/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOSE SANTOS LESSA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.353Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":489,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.353184
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	160	CREATE	490	{"details":"Novo desarquivamento criado: 2.766.906/ITEP/RN - OZEAS RODRIGUES DOS SANTOS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":490,"numeroNicLaudoAuto":"2.766.906/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"OZEAS RODRIGUES DOS SANTOS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.358Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":490,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.359052
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	161	CREATE	491	{"details":"Novo desarquivamento criado: 2.766.907/ITEP/RN - JOSE JUNIOR CARLOS DE OLIVEIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":491,"numeroNicLaudoAuto":"2.766.907/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOSE JUNIOR CARLOS DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.364Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":491,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.364865
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	162	CREATE	492	{"details":"Novo desarquivamento criado: 2.821.274/ITEP/RN - JARDIEL SILVA E SILVA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":492,"numeroNicLaudoAuto":"2.821.274/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JARDIEL SILVA E SILVA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.371Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":492,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.371246
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	362	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T16:46:42.351Z"}	\N	2025-11-10 13:46:42.351934
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	163	CREATE	493	{"details":"Novo desarquivamento criado: 3.040.006/ITEP/RN - JAIR RAMOS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":493,"numeroNicLaudoAuto":"3.040.006/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JAIR RAMOS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.376Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":493,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.376953
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	164	CREATE	494	{"details":"Novo desarquivamento criado: 3.433.175/ITEP/RN - ABRAAO MENDES GOMES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":494,"numeroNicLaudoAuto":"3.433.175/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES GOMES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.383Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":494,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.383179
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	165	CREATE	495	{"details":"Novo desarquivamento criado: 2.821.267/ITEP/RN - IVALDO OLIVEIRA VALERIO (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":495,"numeroNicLaudoAuto":"2.821.267/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"IVALDO OLIVEIRA VALERIO","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.388Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":495,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.389043
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	166	CREATE	496	{"details":"Novo desarquivamento criado: 2.611.260/ITEP/RN - JOAO BATISTA DE OLIVEIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":496,"numeroNicLaudoAuto":"2.611.260/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOAO BATISTA DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.393Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":496,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.394074
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	167	CREATE	497	{"details":"Novo desarquivamento criado: 2.766.643/ITEP/RN - ARCELON ALCIM DE SALES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":497,"numeroNicLaudoAuto":"2.766.643/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ARCELON ALCIM DE SALES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.400Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":497,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.400575
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	168	CREATE	498	{"details":"Novo desarquivamento criado: 2.766.908/ITEP/RN - HENRIQUE FEITOSA VASCONCELOS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":498,"numeroNicLaudoAuto":"2.766.908/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"HENRIQUE FEITOSA VASCONCELOS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.406Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":498,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.406389
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	169	CREATE	499	{"details":"Novo desarquivamento criado: 2.722.787/ITEP/RN - ABRAAO DA SILVA MENDES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":499,"numeroNicLaudoAuto":"2.722.787/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO DA SILVA MENDES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.411Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":499,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.411964
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	170	CREATE	500	{"details":"Novo desarquivamento criado: 2.766.528/ITEP/RN - CELIA DE FARIAS MENDES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":500,"numeroNicLaudoAuto":"2.766.528/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"CELIA DE FARIAS MENDES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.417Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":500,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.418138
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	171	CREATE	501	{"details":"Novo desarquivamento criado: 2.821.275/ITEP/RN - ANTONIO JORGE SILVA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":501,"numeroNicLaudoAuto":"2.821.275/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ANTONIO JORGE SILVA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.423Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":501,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.423814
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	172	CREATE	502	{"details":"Novo desarquivamento criado: 2,677,464 - INGRIDE DE OLIVEIRA BATISTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":502,"numeroNicLaudoAuto":"2,677,464","numeroProcesso":"03910133.000613/2025-79","nomeCompleto":"INGRIDE DE OLIVEIRA BATISTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.429Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":502,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.42962
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	173	CREATE	503	{"details":"Novo desarquivamento criado: IDENTIFICAÇÃO CRIMINAL:  Nº: 0283/2019  - ISMAEL MOURA DA SILVA | PRONTUÁRIOS CIVIS: ISMAEL MOURA DA SILVA - Nº 3.730.479        \\n- JOSE DANTAS DA SILVA - Nº 4.186.843 - ISMAEL MOURA DA SILVA (Tipo: FISICO, Status: NAO_COLETADO)","originalData":{"desarquivamentoId":503,"numeroNicLaudoAuto":"IDENTIFICAÇÃO CRIMINAL:  Nº: 0283/2019  - ISMAEL MOURA DA SILVA | PRONTUÁRIOS CIVIS: ISMAEL MOURA DA SILVA - Nº 3.730.479        \\n- JOSE DANTAS DA SILVA - Nº 4.186.843","numeroProcesso":"11910492.000107/2025-56","nomeCompleto":"ISMAEL MOURA DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_COLETADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.436Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":503,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.436228
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	174	CREATE	504	{"details":"Novo desarquivamento criado: nº 1.945.298 - ANDREASA FERREIRA DA FONSECA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":504,"numeroNicLaudoAuto":"nº 1.945.298","numeroProcesso":"03910025.002606/2025-39","nomeCompleto":"ANDREASA FERREIRA DA FONSECA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T14:46:57.441Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":504,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 11:46:57.441488
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	175	CREATE	505	{"details":"Novo desarquivamento criado: 121941200 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":505,"numeroNicLaudoAuto":"121941200","numeroProcesso":"*","nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.204Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":505,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.204735
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	176	CREATE	506	{"details":"Novo desarquivamento criado: 1560/2019 - SANDRA DIONISIO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":506,"numeroNicLaudoAuto":"1560/2019","numeroProcesso":"OFÍCIO Nº 794/2019","nomeCompleto":"SANDRA DIONISIO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.216Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":506,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.21644
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	177	CREATE	507	{"details":"Novo desarquivamento criado: 1733117 - KIVIAN SANTOS DIAS DA COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":507,"numeroNicLaudoAuto":"1733117","numeroProcesso":"03910025.001253/2024-79","nomeCompleto":"KIVIAN SANTOS DIAS DA COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.222Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":507,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.222809
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	178	CREATE	508	{"details":"Novo desarquivamento criado: 3717458 - ANTONIO FIGUEREDO DE LIMA JUNIOR (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":508,"numeroNicLaudoAuto":"3717458","numeroProcesso":"03910025.001310/2024-10","nomeCompleto":"ANTONIO FIGUEREDO DE LIMA JUNIOR","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.230Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":508,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.230605
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	179	CREATE	509	{"details":"Novo desarquivamento criado: 615/2019 e 619/2019 - * (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":509,"numeroNicLaudoAuto":"615/2019 e 619/2019","numeroProcesso":"*","nomeCompleto":"*","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.237Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":509,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.237943
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	180	CREATE	510	{"details":"Novo desarquivamento criado: 140731 - WILLIAN DE OLIVEIRA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":510,"numeroNicLaudoAuto":"140731","numeroProcesso":"03910025.001605/2024-96","nomeCompleto":"WILLIAN DE OLIVEIRA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.246Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":510,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.246457
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	181	CREATE	511	{"details":"Novo desarquivamento criado: 100454 - JOSÉ LEANDRO ALMEIDA PINTO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":511,"numeroNicLaudoAuto":"100454","numeroProcesso":"03910025.001605/2024-96","nomeCompleto":"JOSÉ LEANDRO ALMEIDA PINTO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.253Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":511,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.253748
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	182	CREATE	512	{"details":"Novo desarquivamento criado: 151685 - JOSIMAR JOSÉ DA SILVA JÚNIOR (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":512,"numeroNicLaudoAuto":"151685","numeroProcesso":"03910002.002911/2024-16","nomeCompleto":"JOSIMAR JOSÉ DA SILVA JÚNIOR","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.261Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":512,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.261363
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	183	CREATE	513	{"details":"Novo desarquivamento criado: 2763144 - MARCELO PINHEIRO DE MELO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":513,"numeroNicLaudoAuto":"2763144","numeroProcesso":"03910025.001672/2024-19","nomeCompleto":"MARCELO PINHEIRO DE MELO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.267Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":513,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.267464
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	184	CREATE	514	{"details":"Novo desarquivamento criado: 148133 - LUCIANO MEDEIROS DE ARAÚJO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":514,"numeroNicLaudoAuto":"148133","numeroProcesso":"03910025.001885/2024-32","nomeCompleto":"LUCIANO MEDEIROS DE ARAÚJO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.274Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":514,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.274558
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	185	CREATE	515	{"details":"Novo desarquivamento criado: 2937931 - FERNANDA GONZAGA SOARES (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":515,"numeroNicLaudoAuto":"2937931","numeroProcesso":"03910002.003132/2024-20","nomeCompleto":"FERNANDA GONZAGA SOARES","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.281Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":515,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.282035
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	186	CREATE	516	{"details":"Novo desarquivamento criado: 2763202 - WILKLEFFY JEOVA FERREIRA DANTAS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":516,"numeroNicLaudoAuto":"2763202","numeroProcesso":"03910025.001970/2024-09","nomeCompleto":"WILKLEFFY JEOVA FERREIRA DANTAS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.286Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":516,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.287122
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	187	CREATE	517	{"details":"Novo desarquivamento criado: 2777765 - RUI CASSIMIRO DE OLIVEIRA/ GRACILANE AGUIAR DE SOUSA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":517,"numeroNicLaudoAuto":"2777765","numeroProcesso":"03910010100050/2024-97","nomeCompleto":"RUI CASSIMIRO DE OLIVEIRA/ GRACILANE AGUIAR DE SOUSA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.294Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":517,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.294816
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	188	CREATE	518	{"details":"Novo desarquivamento criado: 3931740 - RICARDO ANTONIO CAVALCANTI ARAÚJO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":518,"numeroNicLaudoAuto":"3931740","numeroProcesso":"03910008.001970/2024-17","nomeCompleto":"RICARDO ANTONIO CAVALCANTI ARAÚJO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.301Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":518,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.301329
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	189	CREATE	519	{"details":"Novo desarquivamento criado: 36.031 LIVRO 361 - HAROLDO DE SÁ BEZERRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":519,"numeroNicLaudoAuto":"36.031 LIVRO 361","numeroProcesso":"05510096.00164/2024-31","nomeCompleto":"HAROLDO DE SÁ BEZERRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.307Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":519,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.307952
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	190	CREATE	520	{"details":"Novo desarquivamento criado: 208225 - FRANCISCO CANINDÉ FERREIRA DE SOUZA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":520,"numeroNicLaudoAuto":"208225","numeroProcesso":"03910024.003455/2024-65","nomeCompleto":"FRANCISCO CANINDÉ FERREIRA DE SOUZA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.315Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":520,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.315367
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	191	CREATE	521	{"details":"Novo desarquivamento criado: 2971494 - BEATRIZ JOENNE DE LIMA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":521,"numeroNicLaudoAuto":"2971494","numeroProcesso":"039100157.000088/2024-14","nomeCompleto":"BEATRIZ JOENNE DE LIMA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.320Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":521,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.321126
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	192	CREATE	522	{"details":"Novo desarquivamento criado: 1813957 - EMERSON WAGNER BEZERRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":522,"numeroNicLaudoAuto":"1813957","numeroProcesso":"03910025.002320/2024-72","nomeCompleto":"EMERSON WAGNER BEZERRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.329Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":522,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.330112
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	193	CREATE	523	{"details":"Novo desarquivamento criado: 1772273 - MARIA DO CÉU GENTIL (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":523,"numeroNicLaudoAuto":"1772273","numeroProcesso":"11910500.000106/2024-84","nomeCompleto":"MARIA DO CÉU GENTIL","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.336Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":523,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.336953
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	194	CREATE	524	{"details":"Novo desarquivamento criado: 2886602 - ANA HELOIZA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":524,"numeroNicLaudoAuto":"2886602","numeroProcesso":"11910500.000111/2024-97","nomeCompleto":"ANA HELOIZA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.344Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":524,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.344968
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	195	CREATE	525	{"details":"Novo desarquivamento criado: 151601 - JOÃO JOAQUIM DE MOURA FILHO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":525,"numeroNicLaudoAuto":"151601","numeroProcesso":"039100157.000106/2024-68","nomeCompleto":"JOÃO JOAQUIM DE MOURA FILHO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.352Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":525,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.3523
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	196	CREATE	526	{"details":"Novo desarquivamento criado: 98253 - SEVERINO MOREIRA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":526,"numeroNicLaudoAuto":"98253","numeroProcesso":"03910007.004428/2024-18","nomeCompleto":"SEVERINO MOREIRA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.359Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":526,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.359658
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	197	CREATE	527	{"details":"Novo desarquivamento criado: 145162 - JOANILSON DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":527,"numeroNicLaudoAuto":"145162","numeroProcesso":"03910025.002516/2024-67","nomeCompleto":"JOANILSON DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.366Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":527,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.366439
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	199	CREATE	529	{"details":"Novo desarquivamento criado: 1958218 - JESUN SARAIVA / MARIA DE LOURDES DE MELO (SUSPEITA DE DUPLICIDADE) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":529,"numeroNicLaudoAuto":"1958218","numeroProcesso":"03910024.004007/2024-89","nomeCompleto":"JESUN SARAIVA / MARIA DE LOURDES DE MELO (SUSPEITA DE DUPLICIDADE)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.380Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":529,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.38045
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	200	CREATE	530	{"details":"Novo desarquivamento criado: 89203 - MIGUEL ELIAS DE MORAIS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":530,"numeroNicLaudoAuto":"89203","numeroProcesso":"03910014.002759/2024-24","nomeCompleto":"MIGUEL ELIAS DE MORAIS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.386Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":530,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.386339
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	201	CREATE	531	{"details":"Novo desarquivamento criado: - - PRONTUÁRIO DO GRUPO DE LAMPIÃO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":531,"numeroNicLaudoAuto":"-","numeroProcesso":"-","nomeCompleto":"PRONTUÁRIO DO GRUPO DE LAMPIÃO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.392Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":531,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.393286
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	202	CREATE	532	{"details":"Novo desarquivamento criado: 2007406 - JOSÉ CLENILSON COSTA LIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":532,"numeroNicLaudoAuto":"2007406","numeroProcesso":"039100157.000139/2024-16","nomeCompleto":"JOSÉ CLENILSON COSTA LIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.399Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":532,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.399674
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	203	CREATE	533	{"details":"Novo desarquivamento criado: 186028 - ANTONIO CARLOS SOARES DA COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":533,"numeroNicLaudoAuto":"186028","numeroProcesso":"03910024.004353/2024-67","nomeCompleto":"ANTONIO CARLOS SOARES DA COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.405Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":533,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.405684
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	204	CREATE	534	{"details":"Novo desarquivamento criado: 3139138 - LAZARO LEONARDO GOMES DANTAS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":534,"numeroNicLaudoAuto":"3139138","numeroProcesso":"03910008.002963/2024-24","nomeCompleto":"LAZARO LEONARDO GOMES DANTAS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.412Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":534,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.412698
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	205	CREATE	535	{"details":"Novo desarquivamento criado: 147874 - JOSIEL BRAGA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":535,"numeroNicLaudoAuto":"147874","numeroProcesso":"03910025.003026/2024-88","nomeCompleto":"JOSIEL BRAGA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.418Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":535,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.418159
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	206	CREATE	536	{"details":"Novo desarquivamento criado: 201417 - MATHEUS FELIPE PAULISTA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":536,"numeroNicLaudoAuto":"201417","numeroProcesso":"03910025.003026/2024-88","nomeCompleto":"MATHEUS FELIPE PAULISTA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.423Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":536,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.423745
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	207	CREATE	537	{"details":"Novo desarquivamento criado: 57951 - MARIA GORETTI TINOCO DE OLIVEIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":537,"numeroNicLaudoAuto":"57951","numeroProcesso":"039100157.000152/2024-67","nomeCompleto":"MARIA GORETTI TINOCO DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.429Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":537,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.430127
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	208	CREATE	538	{"details":"Novo desarquivamento criado: 002.468.645 | 002.705.228 | 002.685.257 | 1.856.051 - nº 002.468.645, RODRIGU FIGUEIRA DA COSTA\\nnº 002.705.228 RODRIGO RODRIGUES DA SILVA\\nn° 002.685.257 ELIAS RODRIGO DA SILVA\\n\\nnº 1.856.051 RODRIGO RODRIGUES COSTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":538,"numeroNicLaudoAuto":"002.468.645 | 002.705.228 | 002.685.257 | 1.856.051","numeroProcesso":"11910500.000163/2024-63","nomeCompleto":"nº 002.468.645, RODRIGU FIGUEIRA DA COSTA\\nnº 002.705.228 RODRIGO RODRIGUES DA SILVA\\nn° 002.685.257 ELIAS RODRIGO DA SILVA\\n\\nnº 1.856.051 RODRIGO RODRIGUES COSTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.435Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":538,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.435147
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	209	CREATE	539	{"details":"Novo desarquivamento criado: 3791219 - n° 3.791.219 (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":539,"numeroNicLaudoAuto":"3791219","numeroProcesso":"039100157.000161/2024-58","nomeCompleto":"n° 3.791.219","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.441Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":539,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.441525
4	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	363	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T17:05:46.824Z"}	\N	2025-11-10 14:05:46.824929
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	210	CREATE	540	{"details":"Novo desarquivamento criado: 1086141 - RITA CELIA DANTAS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":540,"numeroNicLaudoAuto":"1086141","numeroProcesso":"039100157.000185/2024-15","nomeCompleto":"RITA CELIA DANTAS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.448Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":540,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.448672
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	211	CREATE	541	{"details":"Novo desarquivamento criado: 1796709 - n° 1.796.709 FRANCISCO TALES DE OLIVEIRA PINTO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":541,"numeroNicLaudoAuto":"1796709","numeroProcesso":"119110101.000895/2024-56","nomeCompleto":"n° 1.796.709 FRANCISCO TALES DE OLIVEIRA PINTO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.454Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":541,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.454479
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	212	CREATE	542	{"details":"Novo desarquivamento criado: 2923684 - 2923684 (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":542,"numeroNicLaudoAuto":"2923684","numeroProcesso":"03910024.005151/2024-32","nomeCompleto":"2923684","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.461Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":542,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.461671
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	213	CREATE	543	{"details":"Novo desarquivamento criado: 138056 - ROMÁRIO MATHEUS DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":543,"numeroNicLaudoAuto":"138056","numeroProcesso":"03910025.003518/2024-73","nomeCompleto":"ROMÁRIO MATHEUS DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.467Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":543,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.468074
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	214	CREATE	544	{"details":"Novo desarquivamento criado: 4.197.288/RN - MARCELO COTTA DE MELLO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":544,"numeroNicLaudoAuto":"4.197.288/RN","numeroProcesso":"039100157.000001/2025-90","nomeCompleto":"MARCELO COTTA DE MELLO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.473Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":544,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.473941
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	215	CREATE	545	{"details":"Novo desarquivamento criado: nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES - nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":545,"numeroNicLaudoAuto":"nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES","numeroProcesso":"11910035.000074/2025-31","nomeCompleto":"nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.480Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":545,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.480815
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	216	CREATE	546	{"details":"Novo desarquivamento criado: BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 - BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 | Alexandro Batista da Costa, laudo de Exame Necroscópico nº 01.01241.06/17) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":546,"numeroNicLaudoAuto":"BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17","numeroProcesso":"039100154.000276/2024-72","nomeCompleto":"BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 | Alexandro Batista da Costa, laudo de Exame Necroscópico nº 01.01241.06/17)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.485Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":546,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.486083
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	217	CREATE	547	{"details":"Novo desarquivamento criado: 3.764.469 \\\\ 3.294.805 - DAMIÃO BARBOSA SIMPLICO | JOÃO CARLOS MARCOLINO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":547,"numeroNicLaudoAuto":"3.764.469 \\\\ 3.294.805","numeroProcesso":"11910035.000083/2025-22","nomeCompleto":"DAMIÃO BARBOSA SIMPLICO | JOÃO CARLOS MARCOLINO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.491Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":547,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.491887
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	218	CREATE	548	{"details":"Novo desarquivamento criado: nº 203.297 SSP/RN - Aristofanes Medeiros da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":548,"numeroNicLaudoAuto":"nº 203.297 SSP/RN","numeroProcesso":"03910024.000276/2025-57","nomeCompleto":"Aristofanes Medeiros da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.498Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":548,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.498278
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	219	CREATE	549	{"details":"Novo desarquivamento criado: nº 140731 - WILLIAN DE OLIVEIRA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":549,"numeroNicLaudoAuto":"nº 140731","numeroProcesso":"03910025.000238/2025-94","nomeCompleto":"WILLIAN DE OLIVEIRA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.503Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":549,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.503556
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	252	CREATE	582	{"details":"Novo desarquivamento criado: 1,303,132 - ELIZABETH VICTOR DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":582,"numeroNicLaudoAuto":"1,303,132","numeroProcesso":"03910024.001991/2025-15","nomeCompleto":"ELIZABETH VICTOR DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.701Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":582,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.701528
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	220	CREATE	550	{"details":"Novo desarquivamento criado: Ofício nº 003/2016 - Prontuário nº 140731 - WILLIAN DE OLIVEIRA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":550,"numeroNicLaudoAuto":"Ofício nº 003/2016 - Prontuário nº 140731","numeroProcesso":"03910025.000238/2025-95","nomeCompleto":"WILLIAN DE OLIVEIRA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.510Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":550,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.510547
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	221	CREATE	551	{"details":"Novo desarquivamento criado: 3769456 - BENICIO COSTA (Não localizado) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":551,"numeroNicLaudoAuto":"3769456","numeroProcesso":"039100157.000034/2025-30","nomeCompleto":"BENICIO COSTA (Não localizado)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.516Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":551,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.516421
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	222	CREATE	552	{"details":"Novo desarquivamento criado: 1994569 - LUCENI SILVA DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":552,"numeroNicLaudoAuto":"1994569","numeroProcesso":"03910025.000559/2025-99","nomeCompleto":"LUCENI SILVA DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.521Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":552,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.521462
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	223	CREATE	553	{"details":"Novo desarquivamento criado: 1. Prontuário Civil nº 2.766.547 - nº 2.766.547 MARCOS ADRIANO FILHO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":553,"numeroNicLaudoAuto":"1. Prontuário Civil nº 2.766.547","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.547 MARCOS ADRIANO FILHO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.528Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":553,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.528363
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	224	CREATE	554	{"details":"Novo desarquivamento criado: 2. Prontuário Civil nº 2.766.548 - nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":554,"numeroNicLaudoAuto":"2. Prontuário Civil nº 2.766.548","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.534Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":554,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.534408
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	225	CREATE	555	{"details":"Novo desarquivamento criado: 3. Prontuário Civil nº 2.766.549 - nº 2.766.549\\tJOSE SANTOS LESSA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":555,"numeroNicLaudoAuto":"3. Prontuário Civil nº 2.766.549","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.549\\tJOSE SANTOS LESSA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.539Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":555,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.539872
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	226	CREATE	556	{"details":"Novo desarquivamento criado: 4. Prontuário Civil nº 2.766.908 - nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":556,"numeroNicLaudoAuto":"4. Prontuário Civil nº 2.766.908","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.546Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":556,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.546437
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	227	CREATE	557	{"details":"Novo desarquivamento criado: 5. Prontuário Civil nº 2.821.275 - nº 2.821.275\\tANTONIO JORGE SILVA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":557,"numeroNicLaudoAuto":"5. Prontuário Civil nº 2.821.275","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.821.275\\tANTONIO JORGE SILVA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.552Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":557,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.552926
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	228	CREATE	558	{"details":"Novo desarquivamento criado: 6. Prontuário Civil nº 2.766.907 - nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":558,"numeroNicLaudoAuto":"6. Prontuário Civil nº 2.766.907","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.559Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":558,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.559481
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	229	CREATE	559	{"details":"Novo desarquivamento criado: 7. Prontuário Civil nº 2.821.274 - nº 2.821.274 JARDIEL SILVA E SILVA (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":559,"numeroNicLaudoAuto":"7. Prontuário Civil nº 2.821.274","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.821.274 JARDIEL SILVA E SILVA","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.565Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":559,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.566047
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	230	CREATE	560	{"details":"Novo desarquivamento criado: 8. Prontuário Civil nº 2.821.267 - nº 2.821.267\\tIVALDO OLIVEIRA VALERIO (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":560,"numeroNicLaudoAuto":"8. Prontuário Civil nº 2.821.267","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.821.267\\tIVALDO OLIVEIRA VALERIO","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.572Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":560,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.572436
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	231	CREATE	561	{"details":"Novo desarquivamento criado: 9. Prontuário Civil nº 2.722.787 - nº 2.722.787\\tABRAAO DA SILVA MENDES (Tipo: FISICO, Status: SOLICITADO)","originalData":{"desarquivamentoId":561,"numeroNicLaudoAuto":"9. Prontuário Civil nº 2.722.787","numeroProcesso":"039100157.000036/2025-29","nomeCompleto":"nº 2.722.787\\tABRAAO DA SILVA MENDES","tipoDesarquivamento":"FISICO","status":"SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.578Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":561,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.579043
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	232	CREATE	562	{"details":"Novo desarquivamento criado: Prontuário Civil nº 1.801.841 - JOÃO MARIA DA SILVA BARBOSA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":562,"numeroNicLaudoAuto":"Prontuário Civil nº 1.801.841","numeroProcesso":"03910025.000795/2025-13","nomeCompleto":"JOÃO MARIA DA SILVA BARBOSA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.584Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":562,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.584374
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	233	CREATE	563	{"details":"Novo desarquivamento criado: BIC N° : 259713 (OBS: NÃO CONSTA NO BIC ORIGINAL, INFORMAÇÃO CEDIDA PEL JUDICIÁRIO) Prontuário Civil N°  003880814 - JORGE MATEUS FERREIRA DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":563,"numeroNicLaudoAuto":"BIC N° : 259713 (OBS: NÃO CONSTA NO BIC ORIGINAL, INFORMAÇÃO CEDIDA PEL JUDICIÁRIO) Prontuário Civil N°  003880814","numeroProcesso":"03910009.000711/2025-31","nomeCompleto":"JORGE MATEUS FERREIRA DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.589Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":563,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.5893
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	234	CREATE	564	{"details":"Novo desarquivamento criado: Prontuário Civil nº 1.482.989 - JOSÉ GABRIEL DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":564,"numeroNicLaudoAuto":"Prontuário Civil nº 1.482.989","numeroProcesso":"039100157.000072/2025-92","nomeCompleto":"JOSÉ GABRIEL DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.595Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":564,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.595941
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	235	CREATE	565	{"details":"Novo desarquivamento criado: Prontuário Civil n°3.743.038 SSP/RN - JOSÉ FRANCISCO NOGUEIRA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":565,"numeroNicLaudoAuto":"Prontuário Civil n°3.743.038 SSP/RN","numeroProcesso":"03910024.001342/2025-14","nomeCompleto":"JOSÉ FRANCISCO NOGUEIRA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.601Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":565,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.601554
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	236	CREATE	566	{"details":"Novo desarquivamento criado: Prontuário Civil  nº 3.931.670 - TARCIO BARBOSA FERREIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":566,"numeroNicLaudoAuto":"Prontuário Civil  nº 3.931.670","numeroProcesso":"03910025.001052/2025-52","nomeCompleto":"TARCIO BARBOSA FERREIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.607Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":566,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.607853
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	237	CREATE	567	{"details":"Novo desarquivamento criado: Prontuário Civil nº 1.864.472 - DIVALCI VILAR DE MEDEIROS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":567,"numeroNicLaudoAuto":"Prontuário Civil nº 1.864.472","numeroProcesso":"11910072.000353/2025-59","nomeCompleto":"DIVALCI VILAR DE MEDEIROS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.613Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":567,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.613874
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	238	CREATE	568	{"details":"Novo desarquivamento criado: Prontuário Civil nº 3.379.589 - DIVALCI MENDONCA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":568,"numeroNicLaudoAuto":"Prontuário Civil nº 3.379.589","numeroProcesso":"11910072.000353/2025-59","nomeCompleto":"DIVALCI MENDONCA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.619Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":568,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.619857
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	239	CREATE	569	{"details":"Novo desarquivamento criado: Prontuário civil nº 494.283; nº CPF 381.100.404-20 - JOSIVALDO MONTEIRO DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":569,"numeroNicLaudoAuto":"Prontuário civil nº 494.283; nº CPF 381.100.404-20","numeroProcesso":"11910166.000185/2025-52","nomeCompleto":"JOSIVALDO MONTEIRO DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.625Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":569,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.625297
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	240	CREATE	570	{"details":"Novo desarquivamento criado: Prontuário Civil nº 2.026.941 - DENILDA FELIX DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":570,"numeroNicLaudoAuto":"Prontuário Civil nº 2.026.941","numeroProcesso":"039100157.000090/2025-74","nomeCompleto":"DENILDA FELIX DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.631Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":570,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.632037
3	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	350	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T14:21:45.650Z"}	\N	2025-11-10 11:21:45.651007
2	auth	172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	t	\N	352	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:24:54.694Z"}	\N	2025-11-10 12:24:54.694755
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	241	CREATE	571	{"details":"Novo desarquivamento criado: Prontuário Civil nº: 2.216.369 \\nProntuário Civil nº 3.866.295 - CARLOS JORGE ANDRADE DOS SANTOS (Nº: 2.216.369)\\n - LEONARDO PEREIRA DANTAS (Nº 3.866.295) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":571,"numeroNicLaudoAuto":"Prontuário Civil nº: 2.216.369 \\nProntuário Civil nº 3.866.295","numeroProcesso":"11910535.000068/2025-43","nomeCompleto":"CARLOS JORGE ANDRADE DOS SANTOS (Nº: 2.216.369)\\n - LEONARDO PEREIRA DANTAS (Nº 3.866.295)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.637Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":571,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.63719
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	242	CREATE	572	{"details":"Novo desarquivamento criado: Prontuário Civil nº 2.104.196                                             Prontuário Civil nº 2.082.050 - THIAGO ANDRADE DA SILVA (nº 2.104.196 ) / THIAGO ANDRADE DA SILVA LIMA / THIAGO ANDRADE DA SILVA ( nº 2.082.050) (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":572,"numeroNicLaudoAuto":"Prontuário Civil nº 2.104.196                                             Prontuário Civil nº 2.082.050","numeroProcesso":"039100157.000093/2025-16","nomeCompleto":"THIAGO ANDRADE DA SILVA (nº 2.104.196 ) / THIAGO ANDRADE DA SILVA LIMA / THIAGO ANDRADE DA SILVA ( nº 2.082.050)","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.644Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":572,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.644197
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	243	CREATE	573	{"details":"Novo desarquivamento criado: nº 2.923.050 SSP/RN - KELLYSON CARLOS DO NASCIMENTO SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":573,"numeroNicLaudoAuto":"nº 2.923.050 SSP/RN","numeroProcesso":"03910024.001553/2025-49","nomeCompleto":"KELLYSON CARLOS DO NASCIMENTO SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.650Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":573,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.650295
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	244	CREATE	574	{"details":"Novo desarquivamento criado: BIC n°138.056 - ROMÁRIO MATHEUS DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":574,"numeroNicLaudoAuto":"BIC n°138.056","numeroProcesso":"03910025.001262/2025-41","nomeCompleto":"ROMÁRIO MATHEUS DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.655Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":574,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.655178
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	245	CREATE	575	{"details":"Novo desarquivamento criado: Nº 301.790 - FRANCISCO DE ASSIS MORENO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":575,"numeroNicLaudoAuto":"Nº 301.790","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"FRANCISCO DE ASSIS MORENO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.661Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":575,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.661837
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	246	CREATE	576	{"details":"Novo desarquivamento criado: Nº 769.262 - LUIZ ANTÔNIO DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":576,"numeroNicLaudoAuto":"Nº 769.262","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"LUIZ ANTÔNIO DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.667Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":576,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.66735
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	247	CREATE	577	{"details":"Novo desarquivamento criado: Nº 1.857.918 - FRANCISCO FÉLIX DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":577,"numeroNicLaudoAuto":"Nº 1.857.918","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"FRANCISCO FÉLIX DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.672Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":577,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.672185
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	248	CREATE	578	{"details":"Novo desarquivamento criado: Nº 736.031 - FRANCISCO CAETANO FILHO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":578,"numeroNicLaudoAuto":"Nº 736.031","numeroProcesso":"039100157.000100/2025-71","nomeCompleto":"FRANCISCO CAETANO FILHO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.679Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":578,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.679229
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	249	CREATE	579	{"details":"Novo desarquivamento criado: RG nº 2.258.371 - RODNEI ELDER PACHECO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":579,"numeroNicLaudoAuto":"RG nº 2.258.371","numeroProcesso":"03910009.001052/2025-51","nomeCompleto":"RODNEI ELDER PACHECO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.684Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":579,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.685074
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	250	CREATE	580	{"details":"Novo desarquivamento criado: RG nº 2.392.130 - LEANDRO QUEIROZ DOS REIS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":580,"numeroNicLaudoAuto":"RG nº 2.392.130","numeroProcesso":"03910009.001052/2025-51","nomeCompleto":"LEANDRO QUEIROZ DOS REIS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.690Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":580,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.690232
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	251	CREATE	581	{"details":"Novo desarquivamento criado: 196,351 - JOSE SILVESTRE DE PONTES (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":581,"numeroNicLaudoAuto":"196,351","numeroProcesso":"03910024.001926/2025-81","nomeCompleto":"JOSE SILVESTRE DE PONTES","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.696Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":581,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.696446
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	253	CREATE	583	{"details":"Novo desarquivamento criado: 2,978,102 - RIGNER LUIZ FREITAS DE FRANCA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":583,"numeroNicLaudoAuto":"2,978,102","numeroProcesso":"03910024.001991/2025-15","nomeCompleto":"RIGNER LUIZ FREITAS DE FRANCA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.706Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":583,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.706419
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	254	CREATE	584	{"details":"Novo desarquivamento criado: Dev. de processo físico - MARCOS ANTÔNIO LIMA DA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":584,"numeroNicLaudoAuto":"Dev. de processo físico","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"MARCOS ANTÔNIO LIMA DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.712Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":584,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.71297
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	255	CREATE	585	{"details":"Novo desarquivamento criado: 12.00113/206 - SILVANEIDE PAULO DA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":585,"numeroNicLaudoAuto":"12.00113/206","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"SILVANEIDE PAULO DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.718Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":585,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.71882
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	256	CREATE	586	{"details":"Novo desarquivamento criado: 01.00394.03/2012 - FRANCISCO ANACLETO DE LIMA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":586,"numeroNicLaudoAuto":"01.00394.03/2012","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"FRANCISCO ANACLETO DE LIMA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.723Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":586,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.724168
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	257	CREATE	587	{"details":"Novo desarquivamento criado: 899/2017 NIC 00142 - N.I. - MULHER (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":587,"numeroNicLaudoAuto":"899/2017 NIC 00142","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I. - MULHER","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.730Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":587,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.730665
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	258	CREATE	588	{"details":"Novo desarquivamento criado: 01.01899.11/13 - N.I. (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":588,"numeroNicLaudoAuto":"01.01899.11/13","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.736Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":588,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.736879
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	259	CREATE	589	{"details":"Novo desarquivamento criado: 01.1020.07/09 - IVANILSON CAVALCANTE FARIAS (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":589,"numeroNicLaudoAuto":"01.1020.07/09","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"IVANILSON CAVALCANTE FARIAS","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.743Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":589,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.744207
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	260	CREATE	590	{"details":"Novo desarquivamento criado: 01.1492.11/11 - CRISTIANE GIL GARCIA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":590,"numeroNicLaudoAuto":"01.1492.11/11","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"CRISTIANE GIL GARCIA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.751Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":590,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.751597
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	261	CREATE	591	{"details":"Novo desarquivamento criado: 01.1493.11/11 - BRUNO AZAMBUJA DE FREITAS (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":591,"numeroNicLaudoAuto":"01.1493.11/11","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"BRUNO AZAMBUJA DE FREITAS","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.757Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":591,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.757688
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	262	CREATE	592	{"details":"Novo desarquivamento criado: Aguardando DHPP - EVANDRO OLIVEIRA DE SOUZA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":592,"numeroNicLaudoAuto":"Aguardando DHPP","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"EVANDRO OLIVEIRA DE SOUZA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.764Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":592,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.764941
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	263	CREATE	593	{"details":"Novo desarquivamento criado: 01.1366.08/14 - N. I. - RODRIGO DE OLIVEIRA DIAS (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":593,"numeroNicLaudoAuto":"01.1366.08/14","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N. I. - RODRIGO DE OLIVEIRA DIAS","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.770Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":593,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.77022
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	351	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T14:21:57.376Z"}	\N	2025-11-10 11:21:57.376466
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	264	CREATE	594	{"details":"Novo desarquivamento criado: 01.0114.01/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":594,"numeroNicLaudoAuto":"01.0114.01/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.775Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":594,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.775571
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	265	CREATE	595	{"details":"Novo desarquivamento criado: 01.1190.06/17 - MAGNO SILVA SENA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":595,"numeroNicLaudoAuto":"01.1190.06/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"MAGNO SILVA SENA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.782Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":595,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.782287
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	266	CREATE	596	{"details":"Novo desarquivamento criado: 01.2063.11/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":596,"numeroNicLaudoAuto":"01.2063.11/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.787Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":596,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.787643
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	267	CREATE	597	{"details":"Novo desarquivamento criado: 01.0860.05/15 - JOSÉ HEBERSON BARBOSA SOARES (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":597,"numeroNicLaudoAuto":"01.0860.05/15","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"JOSÉ HEBERSON BARBOSA SOARES","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.793Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":597,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.793999
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	268	CREATE	598	{"details":"Novo desarquivamento criado: 01.0569.03/17 - FRANCISCO MARCOS ALVES (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":598,"numeroNicLaudoAuto":"01.0569.03/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"FRANCISCO MARCOS ALVES","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.799Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":598,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.799899
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	269	CREATE	599	{"details":"Novo desarquivamento criado: 05.00404.10/16 - ALICE RODRIGUES VICENTE (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":599,"numeroNicLaudoAuto":"05.00404.10/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"ALICE RODRIGUES VICENTE","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.805Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":599,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.805517
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	270	CREATE	600	{"details":"Novo desarquivamento criado: 01.1746.10/14 - FRANKLIN RAGNER SANTOS DE FIGUEIREDO (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":600,"numeroNicLaudoAuto":"01.1746.10/14","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"FRANKLIN RAGNER SANTOS DE FIGUEIREDO","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.812Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":600,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.812175
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	271	CREATE	601	{"details":"Novo desarquivamento criado: 01.1501.07/17 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":601,"numeroNicLaudoAuto":"01.1501.07/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.817Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":601,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.817762
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	272	CREATE	602	{"details":"Novo desarquivamento criado: 01.0516.04/11 - LODOGILDO DE ARAÚJO (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":602,"numeroNicLaudoAuto":"01.0516.04/11","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"LODOGILDO DE ARAÚJO","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.823Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":602,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.82339
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	273	CREATE	603	{"details":"Novo desarquivamento criado: 01.0111.01/13 - JONATHAN CARDOSO DE LIMA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":603,"numeroNicLaudoAuto":"01.0111.01/13","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"JONATHAN CARDOSO DE LIMA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.830Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":603,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.830344
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	274	CREATE	604	{"details":"Novo desarquivamento criado: 09.0002.02.2016 - OSSADA HUMANA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":604,"numeroNicLaudoAuto":"09.0002.02.2016","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"OSSADA HUMANA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.835Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":604,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.835946
3	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	353	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:41:55.328Z"}	\N	2025-11-10 12:41:55.32899
4	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	t	\N	364	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T17:07:15.950Z"}	\N	2025-11-10 14:07:15.950275
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	275	CREATE	605	{"details":"Novo desarquivamento criado: 01.0084.01/17 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":605,"numeroNicLaudoAuto":"01.0084.01/17","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.840Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":605,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.841003
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	276	CREATE	606	{"details":"Novo desarquivamento criado: 01.1769.09/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":606,"numeroNicLaudoAuto":"01.1769.09/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.847Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":606,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.847338
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	277	CREATE	607	{"details":"Novo desarquivamento criado: 01.0217.02/16 - N.I. (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":607,"numeroNicLaudoAuto":"01.0217.02/16","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"N.I.","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.852Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":607,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.852599
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	278	CREATE	608	{"details":"Novo desarquivamento criado: 1389/208 - IBRAHIM MOHAMED KHALIL FILHO (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":608,"numeroNicLaudoAuto":"1389/208","numeroProcesso":"03910003.001984/2025-53","nomeCompleto":"IBRAHIM MOHAMED KHALIL FILHO","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.857Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":608,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.857443
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	279	CREATE	609	{"details":"Novo desarquivamento criado: 4,244,388 - FRANKLIN GIVANILDO BEZERRA DA COSTA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":609,"numeroNicLaudoAuto":"4,244,388","numeroProcesso":"03910025.001695/2025-04","nomeCompleto":"FRANKLIN GIVANILDO BEZERRA DA COSTA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.863Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":609,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.863583
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	280	CREATE	610	{"details":"Novo desarquivamento criado: 2,820,755 - PATRÍCIA GOMES BEZERRA DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":610,"numeroNicLaudoAuto":"2,820,755","numeroProcesso":"039100157.000133/2025-11","nomeCompleto":"PATRÍCIA GOMES BEZERRA DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.868Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":610,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.86893
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	281	CREATE	611	{"details":"Novo desarquivamento criado: Não possui - LUIS GONZAGA DA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":611,"numeroNicLaudoAuto":"Não possui","numeroProcesso":"039100121.000005/2025-85","nomeCompleto":"LUIS GONZAGA DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.873Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":611,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.873573
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	282	CREATE	612	{"details":"Novo desarquivamento criado: BIC N° 146.040 - JOÃO MARIA BARACHO ALBINO (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":612,"numeroNicLaudoAuto":"BIC N° 146.040","numeroProcesso":"03910025.001717/2025-28","nomeCompleto":"JOÃO MARIA BARACHO ALBINO","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.880Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":612,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.880196
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	283	CREATE	613	{"details":"Novo desarquivamento criado: BIC N° 146.040 - JORGE MATEUS FERREIRA DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":613,"numeroNicLaudoAuto":"BIC N° 146.040","numeroProcesso":"03910009.000711/2025-31","nomeCompleto":"JORGE MATEUS FERREIRA DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.885Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":613,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.885884
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	284	CREATE	614	{"details":"Novo desarquivamento criado: nº 1.391.265 - MARIA DE FATIMA SARAIVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":614,"numeroNicLaudoAuto":"nº 1.391.265","numeroProcesso":"039100157.000099/2025-85","nomeCompleto":"MARIA DE FATIMA SARAIVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.890Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":614,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.890452
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	285	CREATE	615	{"details":"Novo desarquivamento criado: 1,725,987 - Nome: Germano Jose Ferreira de Farias\\nFiliação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\\nNaturalidade: Natal/RN\\nData de Nascimento: 14/03/1983 (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":615,"numeroNicLaudoAuto":"1,725,987","numeroProcesso":"03910024.002555/2025-55","nomeCompleto":"Nome: Germano Jose Ferreira de Farias\\nFiliação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\\nNaturalidade: Natal/RN\\nData de Nascimento: 14/03/1983","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.896Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":615,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.896884
3	auth	172.18.0.2	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	t	\N	354	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:43:24.793Z"}	\N	2025-11-10 12:43:24.79419
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	286	CREATE	616	{"details":"Novo desarquivamento criado: 1,529,503 - JOHN KENNEDY DOS SANTOS (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":616,"numeroNicLaudoAuto":"1,529,503","numeroProcesso":"039100157.000110/2025-15","nomeCompleto":"JOHN KENNEDY DOS SANTOS","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.901Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":616,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.902021
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	287	CREATE	617	{"details":"Novo desarquivamento criado: 1,617,956 - MARCOS DA ROCHA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":617,"numeroNicLaudoAuto":"1,617,956","numeroProcesso":"039100157.000110/2025-16","nomeCompleto":"MARCOS DA ROCHA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.907Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":617,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.907408
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	288	CREATE	618	{"details":"Novo desarquivamento criado: BIC n°109.632 - Daniel Miguel da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":618,"numeroNicLaudoAuto":"BIC n°109.632","numeroProcesso":"039100154.000302/2025-43","nomeCompleto":"Daniel Miguel da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.914Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":618,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.914339
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	289	CREATE	619	{"details":"Novo desarquivamento criado: 1,685,492 - Welkciley Miguel da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":619,"numeroNicLaudoAuto":"1,685,492","numeroProcesso":"039100154.000302/2025-43","nomeCompleto":"Welkciley Miguel da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.920Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":619,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.920868
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	290	CREATE	620	{"details":"Novo desarquivamento criado: RG nº 1.517.069 - Daniel Miguel da Costa (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":620,"numeroNicLaudoAuto":"RG nº 1.517.069","numeroProcesso":"039100154.000302/2025-43","nomeCompleto":"Daniel Miguel da Costa","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.926Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":620,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.927001
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	291	CREATE	621	{"details":"Novo desarquivamento criado: NÃO INFORMADO / Aguardando o núcleo de Caicó enviar o número - ANTÔNIO SALUSTIO DE AZEVEDO | NASC.: 14/01/1916 (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":621,"numeroNicLaudoAuto":"NÃO INFORMADO / Aguardando o núcleo de Caicó enviar o número","numeroProcesso":"03910181.000389/2025-40","nomeCompleto":"ANTÔNIO SALUSTIO DE AZEVEDO | NASC.: 14/01/1916","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.932Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":621,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.932568
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	292	CREATE	622	{"details":"Novo desarquivamento criado: RG N° 2.617.062 - GEOVANI DE OLIVEIRA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":622,"numeroNicLaudoAuto":"RG N° 2.617.062","numeroProcesso":"03910025.002014/2025-17","nomeCompleto":"GEOVANI DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.937Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":622,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.93791
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	293	CREATE	623	{"details":"Novo desarquivamento criado: RG N° 3.172.080 - IOLANDA GOMES DA SILVA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":623,"numeroNicLaudoAuto":"RG N° 3.172.080","numeroProcesso":"039100157.000154/2025-37","nomeCompleto":"IOLANDA GOMES DA SILVA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.944Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":623,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.944345
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	294	CREATE	624	{"details":"Novo desarquivamento criado: RG nº 1.657.512 - JEAN DEYVID BESERRA SILVA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":624,"numeroNicLaudoAuto":"RG nº 1.657.512","numeroProcesso":"039100157.000165/2025-17","nomeCompleto":"JEAN DEYVID BESERRA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.949Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":624,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.950036
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	295	CREATE	625	{"details":"Novo desarquivamento criado: RG 03.636.648 - JOSENILSON DA SILVA BESSA (Tipo: FISICO, Status: REARQUIVAMENTO_SOLICITADO)","originalData":{"desarquivamentoId":625,"numeroNicLaudoAuto":"RG 03.636.648","numeroProcesso":"03910197.000279/2025-17","nomeCompleto":"JOSENILSON DA SILVA BESSA","tipoDesarquivamento":"FISICO","status":"REARQUIVAMENTO_SOLICITADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.955Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":625,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.955594
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	296	CREATE	626	{"details":"Novo desarquivamento criado: 2.043.870/ITEP/RN - ABRAÃO MENDES DA SILVA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":626,"numeroNicLaudoAuto":"2.043.870/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAÃO MENDES DA SILVA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.961Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":626,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.961426
2	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	355	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:50:30.047Z"}	\N	2025-11-10 12:50:30.04813
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	297	CREATE	627	{"details":"Novo desarquivamento criado: 2.265.088/ITEP/RN - ABRAAO MENDES TEIXEIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":627,"numeroNicLaudoAuto":"2.265.088/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES TEIXEIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.967Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":627,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.967129
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	298	CREATE	628	{"details":"Novo desarquivamento criado: 2.319.508/ITEP/RN - ABRAAO MENDES PEREIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":628,"numeroNicLaudoAuto":"2.319.508/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES PEREIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.972Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":628,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.972123
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	299	CREATE	629	{"details":"Novo desarquivamento criado: 2.361.121/ITEP/RN - ABRAAO MENDES FARIAS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":629,"numeroNicLaudoAuto":"2.361.121/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES FARIAS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.978Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":629,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.978353
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	300	CREATE	630	{"details":"Novo desarquivamento criado: 2.498.176/ITEP/RN - ABRAAO MENDES SOUZA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":630,"numeroNicLaudoAuto":"2.498.176/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES SOUZA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.983Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":630,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.983347
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	301	CREATE	631	{"details":"Novo desarquivamento criado: 2.766.013/ITEP/RN - JURANDIR BERNARDE LEITE (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":631,"numeroNicLaudoAuto":"2.766.013/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JURANDIR BERNARDE LEITE","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.988Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":631,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.988504
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	302	CREATE	632	{"details":"Novo desarquivamento criado: 2.766.547 /ITEP/RN - MARCOS ADRIANO FILHO (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":632,"numeroNicLaudoAuto":"2.766.547 /ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"MARCOS ADRIANO FILHO","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:41.994Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":632,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:41.994824
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	303	CREATE	633	{"details":"Novo desarquivamento criado: 2.766.548/ITEP/RN - JOSE ROBERTO MEDEIROS TENORIO (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":633,"numeroNicLaudoAuto":"2.766.548/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOSE ROBERTO MEDEIROS TENORIO","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.000Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":633,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.000155
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	304	CREATE	634	{"details":"Novo desarquivamento criado: 2.766.549/ITEP/RN - JOSE SANTOS LESSA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":634,"numeroNicLaudoAuto":"2.766.549/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOSE SANTOS LESSA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.005Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":634,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.005348
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	305	CREATE	635	{"details":"Novo desarquivamento criado: 2.766.906/ITEP/RN - OZEAS RODRIGUES DOS SANTOS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":635,"numeroNicLaudoAuto":"2.766.906/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"OZEAS RODRIGUES DOS SANTOS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.011Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":635,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.011813
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	306	CREATE	636	{"details":"Novo desarquivamento criado: 2.766.907/ITEP/RN - JOSE JUNIOR CARLOS DE OLIVEIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":636,"numeroNicLaudoAuto":"2.766.907/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOSE JUNIOR CARLOS DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.017Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":636,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.017793
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	307	CREATE	637	{"details":"Novo desarquivamento criado: 2.821.274/ITEP/RN - JARDIEL SILVA E SILVA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":637,"numeroNicLaudoAuto":"2.821.274/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JARDIEL SILVA E SILVA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.022Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":637,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.022407
4	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	356	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T15:50:41.099Z"}	\N	2025-11-10 12:50:41.100002
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	308	CREATE	638	{"details":"Novo desarquivamento criado: 3.040.006/ITEP/RN - JAIR RAMOS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":638,"numeroNicLaudoAuto":"3.040.006/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JAIR RAMOS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.028Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":638,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.028275
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	309	CREATE	639	{"details":"Novo desarquivamento criado: 3.433.175/ITEP/RN - ABRAAO MENDES GOMES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":639,"numeroNicLaudoAuto":"3.433.175/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO MENDES GOMES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.034Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":639,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.0343
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	310	CREATE	640	{"details":"Novo desarquivamento criado: 2.821.267/ITEP/RN - IVALDO OLIVEIRA VALERIO (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":640,"numeroNicLaudoAuto":"2.821.267/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"IVALDO OLIVEIRA VALERIO","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.039Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":640,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.039257
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	311	CREATE	641	{"details":"Novo desarquivamento criado: 2.611.260/ITEP/RN - JOAO BATISTA DE OLIVEIRA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":641,"numeroNicLaudoAuto":"2.611.260/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"JOAO BATISTA DE OLIVEIRA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.045Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":641,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.045991
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	312	CREATE	642	{"details":"Novo desarquivamento criado: 2.766.643/ITEP/RN - ARCELON ALCIM DE SALES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":642,"numeroNicLaudoAuto":"2.766.643/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ARCELON ALCIM DE SALES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.051Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":642,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.051233
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	313	CREATE	643	{"details":"Novo desarquivamento criado: 2.766.908/ITEP/RN - HENRIQUE FEITOSA VASCONCELOS (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":643,"numeroNicLaudoAuto":"2.766.908/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"HENRIQUE FEITOSA VASCONCELOS","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.056Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":643,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.056946
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	314	CREATE	644	{"details":"Novo desarquivamento criado: 2.722.787/ITEP/RN - ABRAAO DA SILVA MENDES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":644,"numeroNicLaudoAuto":"2.722.787/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ABRAAO DA SILVA MENDES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.063Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":644,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.063403
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	315	CREATE	645	{"details":"Novo desarquivamento criado: 2.766.528/ITEP/RN - CELIA DE FARIAS MENDES (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":645,"numeroNicLaudoAuto":"2.766.528/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"CELIA DE FARIAS MENDES","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.068Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":645,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.069029
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	316	CREATE	646	{"details":"Novo desarquivamento criado: 2.821.275/ITEP/RN - ANTONIO JORGE SILVA (Tipo: FISICO, Status: RETIRADO_PELO_SETOR)","originalData":{"desarquivamentoId":646,"numeroNicLaudoAuto":"2.821.275/ITEP/RN","numeroProcesso":"039100157.000028/2025-82","nomeCompleto":"ANTONIO JORGE SILVA","tipoDesarquivamento":"FISICO","status":"RETIRADO_PELO_SETOR","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.074Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":646,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.074635
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	317	CREATE	647	{"details":"Novo desarquivamento criado: 2,677,464 - INGRIDE DE OLIVEIRA BATISTA (Tipo: FISICO, Status: FINALIZADO)","originalData":{"desarquivamentoId":647,"numeroNicLaudoAuto":"2,677,464","numeroProcesso":"03910133.000613/2025-79","nomeCompleto":"INGRIDE DE OLIVEIRA BATISTA","tipoDesarquivamento":"FISICO","status":"FINALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.080Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":647,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.081091
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	318	CREATE	648	{"details":"Novo desarquivamento criado: IDENTIFICAÇÃO CRIMINAL:  Nº: 0283/2019  - ISMAEL MOURA DA SILVA | PRONTUÁRIOS CIVIS: ISMAEL MOURA DA SILVA - Nº 3.730.479        \\n- JOSE DANTAS DA SILVA - Nº 4.186.843 - ISMAEL MOURA DA SILVA (Tipo: FISICO, Status: NAO_COLETADO)","originalData":{"desarquivamentoId":648,"numeroNicLaudoAuto":"IDENTIFICAÇÃO CRIMINAL:  Nº: 0283/2019  - ISMAEL MOURA DA SILVA | PRONTUÁRIOS CIVIS: ISMAEL MOURA DA SILVA - Nº 3.730.479        \\n- JOSE DANTAS DA SILVA - Nº 4.186.843","numeroProcesso":"11910492.000107/2025-56","nomeCompleto":"ISMAEL MOURA DA SILVA","tipoDesarquivamento":"FISICO","status":"NAO_COLETADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.086Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":648,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.086386
1	DESARQUIVAMENTO	system	nugecid-service	t	\N	319	CREATE	649	{"details":"Novo desarquivamento criado: nº 1.945.298 - ANDREASA FERREIRA DA FONSECA (Tipo: FISICO, Status: NAO_LOCALIZADO)","originalData":{"desarquivamentoId":649,"numeroNicLaudoAuto":"nº 1.945.298","numeroProcesso":"03910025.002606/2025-39","nomeCompleto":"ANDREASA FERREIRA DA FONSECA","tipoDesarquivamento":"FISICO","status":"NAO_LOCALIZADO","changes":null,"previousValues":null},"timestamp":"2025-11-07T15:06:42.091Z","action":"CREATE","resource":"DESARQUIVAMENTO","userId":1,"resourceId":649,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-07 12:06:42.09128
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	320	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:08:17.162Z"}	\N	2025-11-07 12:08:17.162832
1	auth	172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	321	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:08:48.254Z"}	\N	2025-11-07 12:08:48.254455
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	322	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:23:18.934Z"}	\N	2025-11-07 12:23:18.934487
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	323	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:23:50.353Z"}	\N	2025-11-07 12:23:50.353907
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	324	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:33:40.877Z"}	\N	2025-11-07 12:33:40.877542
1	auth	172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	325	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:41:10.250Z"}	\N	2025-11-07 12:41:10.251069
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	326	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T15:48:39.022Z"}	\N	2025-11-07 12:48:39.023106
2	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	327	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:11:33.393Z"}	\N	2025-11-07 13:11:33.394072
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	328	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:11:53.985Z"}	\N	2025-11-07 13:11:53.985426
3	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	329	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:15:25.272Z"}	\N	2025-11-07 13:15:25.272574
3	auth	172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	330	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:16:41.208Z"}	\N	2025-11-07 13:16:41.208977
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	331	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:17:01.717Z"}	\N	2025-11-07 13:17:01.717783
3	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	332	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:18:47.156Z"}	\N	2025-11-07 13:18:47.15632
1	auth	172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	333	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:30:38.560Z"}	\N	2025-11-07 13:30:38.560962
1	auth	172.18.0.5	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	334	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:31:04.302Z"}	\N	2025-11-07 13:31:04.302596
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	335	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:35:59.126Z"}	\N	2025-11-07 13:35:59.127104
3	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	336	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:36:28.470Z"}	\N	2025-11-07 13:36:28.470935
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	337	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:36:47.456Z"}	\N	2025-11-07 13:36:47.456563
3	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	338	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:39:46.505Z"}	\N	2025-11-07 13:39:46.506023
3	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	339	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:39:54.696Z"}	\N	2025-11-07 13:39:54.696604
4	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	340	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:48:20.296Z"}	\N	2025-11-07 13:48:20.296687
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	341	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-07T16:48:38.208Z"}	\N	2025-11-07 13:48:38.20853
1	auth	177.65.217.20	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	t	\N	342	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-08T00:36:29.354Z"}	\N	2025-11-07 21:36:29.355224
1	auth	177.89.21.209	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	t	\N	343	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-08T13:58:09.621Z"}	\N	2025-11-08 10:58:09.621699
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	344	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T12:02:22.920Z"}	\N	2025-11-10 09:02:22.920897
1	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	345	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T13:56:33.496Z"}	\N	2025-11-10 10:56:33.496613
3	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	346	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T14:08:16.095Z"}	\N	2025-11-10 11:08:16.095609
1	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	347	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T14:08:33.573Z"}	\N	2025-11-10 11:08:33.573485
3	auth	172.18.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36	t	\N	348	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T14:08:48.681Z"}	\N	2025-11-10 11:08:48.681664
3	auth	172.18.0.2	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	349	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T14:21:24.382Z"}	\N	2025-11-10 11:21:24.382398
2	auth	181.77.57.180	Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1	t	\N	366	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-10T22:18:06.466Z"}	\N	2025-11-10 19:18:06.466693
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	399	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-11T11:58:44.515Z"}	\N	2025-11-11 08:58:44.515758
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	400	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:11:05.248Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:11:05.251813
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	401	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:15:55.901Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:15:55.902029
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	402	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:15:58.510Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:15:58.510752
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	403	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:23:12.332Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:23:12.337501
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	404	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:23:14.462Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:23:14.462688
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	405	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:30:31.129Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:30:31.131913
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	406	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:30:32.848Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:30:32.849313
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	407	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:37:38.794Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:37:38.797071
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	408	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-11T13:38:44.180Z"}	\N	2025-11-11 10:38:44.180422
1	auth	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	409	LOGIN	\N	{"loginAttempt":true,"timestamp":"2025-11-11T13:39:35.788Z"}	\N	2025-11-11 10:39:35.788919
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	410	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:39:54.990Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:39:54.991154
1	DESARQUIVAMENTO	172.18.0.5	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36	t	\N	411	VIEW	652	{"details":"Desarquivamento visualizado: 123456789 - Teste","originalData":{"desarquivamentoId":652,"numeroNicLaudoAuto":"123456789","numeroProcesso":"123456789","nomeCompleto":"Teste","tipoDesarquivamento":"FISICO","status":"DESARQUIVADO","changes":null,"previousValues":null},"timestamp":"2025-11-11T13:39:57.463Z","action":"VIEW","resource":"DESARQUIVAMENTO","userId":1,"resourceId":652,"metadata":{"environment":"production","version":"1.0.0","service":"nugecid-service"}}	\N	2025-11-11 10:39:57.464235
\.


--
-- Data for Name: checklists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.checklists (id, tarefa_id, titulo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: colunas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.colunas (id, projeto_id, nome, cor, ordem, ativa, created_at, wip_limit) FROM stdin;
1	1	A Fazer	#6B7280	1	t	2025-10-31 13:31:40.556504	\N
2	1	Em Progresso	#3B82F6	2	t	2025-10-31 13:31:40.559537	\N
3	1	Em Revisão	#F59E0B	3	t	2025-10-31 13:31:40.561215	\N
4	1	Concluído	#10B981	4	t	2025-10-31 13:31:40.562955	\N
\.


--
-- Data for Name: comentarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comentarios (id, tarefa_id, autor_id, conteudo, editado, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: desarquivamento_anexos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.desarquivamento_anexos (id, desarquivamento_id, usuario_id, nome_original, nome_arquivo, caminho_arquivo, tipo_mime, tamanho_bytes, created_at, descricao, tipo_anexo) FROM stdin;
3	568	1	download.jpeg	ae9bd8a9-8f86-4704-b784-5ec62e40ee98.jpeg	/app/uploads/desarquivamentos/ae9bd8a9-8f86-4704-b784-5ec62e40ee98.jpeg	image/jpeg	10500	2025-11-07 13:13:11.896212	Desarquivamento	desarquivamento
12	652	1	image.jpg	5fd85414-269c-4d9a-8a5e-12876862e3de.jpg	/app/uploads/desarquivamentos/5fd85414-269c-4d9a-8a5e-12876862e3de.jpg	image/jpeg	3181901	2025-11-10 10:57:03.767246	Doc	rearquivamento
13	652	3	image.jpg	d12a0cf3-c234-4712-9ef1-a8a9d9e08c29.jpg	/app/uploads/desarquivamentos/d12a0cf3-c234-4712-9ef1-a8a9d9e08c29.jpg	image/jpeg	2476786	2025-11-10 12:44:14.995669	foto 2	desarquivamento
\.


--
-- Data for Name: desarquivamento_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.desarquivamento_comments (id, desarquivamento_id, user_id, author_name, comment, created_at) FROM stdin;
2	652	1	Administrador	teste	2025-11-07 13:18:10.314878-03
3	652	1	Administrador	teste	2025-11-10 14:03:24.426832-03
4	652	4	Gesiele Farias	teste	2025-11-10 14:05:54.292726-03
5	652	4	Gesiele Farias	Novo teste	2025-11-10 14:07:28.018792-03
\.


--
-- Data for Name: desarquivamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.desarquivamentos (id, status, nome_completo, numero_nic_laudo_auto, numero_processo, setor_demandante, servidor_responsavel, finalidade_desarquivamento, solicitacao_prorrogacao, urgente, created_by, responsavel_id, desarquivamento_fisico_digital, tipo_documento, data_solicitacao, data_desarquivamento_sag, data_devolucao_setor, created_at, updated_at, deleted_at, solicitacao_prorrogacao_texto, dados_adicionais, numero_solicitacao, tipo_desarquivamento, numero_extraido) FROM stdin;
505	FINALIZADO	*	121941200	*	*	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-04-03 00:00:00	2024-04-03 00:00:00	\N	2025-11-07 12:06:41.193161	2025-11-07 12:06:41.193161	\N	\N	\N	163	FISICO	\N
506	FINALIZADO	SANDRA DIONISIO	1560/2019	OFÍCIO Nº 794/2019	ITEP-II-SbOI	2454009	Importação de dados históricos	f	f	1	\N	FISICO	EXAME DE ANÁLISE PAPILOSCÓPICA	2024-04-17 00:00:00	2024-04-17 00:00:00	\N	2025-11-07 12:06:41.21359	2025-11-07 12:06:41.21359	\N	\N	\N	164	FISICO	\N
507	FINALIZADO	KIVIAN SANTOS DIAS DA COSTA	1733117	03910025.001253/2024-79	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-05-02 00:00:00	2024-05-02 00:00:00	\N	2025-11-07 12:06:41.220356	2025-11-07 12:06:41.220356	\N	\N	\N	165	FISICO	\N
508	FINALIZADO	ANTONIO FIGUEREDO DE LIMA JUNIOR	3717458	03910025.001310/2024-10	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-05-07 00:00:00	2024-05-07 00:00:00	\N	2025-11-07 12:06:41.228019	2025-11-07 12:06:41.228019	\N	\N	\N	166	FISICO	\N
509	FINALIZADO	*	615/2019 e 619/2019	*	*	80231-0	Importação de dados históricos	f	f	1	\N	FISICO	EXAME DE ANÁLISE PAPILOSCÓPICA	2024-05-16 00:00:00	2024-04-17 00:00:00	\N	2025-11-07 12:06:41.234762	2025-11-07 12:06:41.234762	\N	\N	\N	167	FISICO	\N
510	FINALIZADO	WILLIAN DE OLIVEIRA SILVA	140731	03910025.001605/2024-96	NUC DE IDENTIFICAÇÃO	2454009	Importação de dados históricos	f	f	1	\N	FISICO	FICHA DE IDENTIFICAÇÃO CRIMINAL	2024-06-07 00:00:00	2024-06-10 00:00:00	\N	2025-11-07 12:06:41.243931	2025-11-07 12:06:41.243931	\N	\N	\N	168	FISICO	\N
511	FINALIZADO	JOSÉ LEANDRO ALMEIDA PINTO	100454	03910025.001605/2024-96	NUC DE IDENTIFICAÇÃO	2454009	Importação de dados históricos	f	f	1	\N	FISICO	FICHA DE IDENTIFICAÇÃO CRIMINAL	2024-06-07 00:00:00	2024-06-10 00:00:00	\N	2025-11-07 12:06:41.251486	2025-11-07 12:06:41.251486	\N	\N	\N	169	FISICO	\N
512	FINALIZADO	JOSIMAR JOSÉ DA SILVA JÚNIOR	151685	03910002.002911/2024-16	INSTITUTO DE IDENTIFICAÇÃO - II/ITEP	*	Importação de dados históricos	f	f	1	\N	FISICO	FICHA DE IDENTIFICAÇÃO CRIMINAL	2024-06-10 00:00:00	\N	\N	2025-11-07 12:06:41.258814	2025-11-07 12:06:41.258814	\N	\N	\N	170	FISICO	\N
513	FINALIZADO	MARCELO PINHEIRO DE MELO	2763144	03910025.001672/2024-19	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-06-13 00:00:00	2024-06-19 00:00:00	\N	2025-11-07 12:06:41.265442	2025-11-07 12:06:41.265442	\N	\N	\N	171	FISICO	\N
514	FINALIZADO	LUCIANO MEDEIROS DE ARAÚJO	148133	03910025.001885/2024-32	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2024-07-04 00:00:00	2024-07-09 00:00:00	\N	2025-11-07 12:06:41.272032	2025-11-07 12:06:41.272032	\N	\N	\N	172	FISICO	\N
515	FINALIZADO	FERNANDA GONZAGA SOARES	2937931	03910002.003132/2024-20	NUC DE IDENTIFICAÇÃO	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-07-05 00:00:00	2024-07-08 00:00:00	\N	2025-11-07 12:06:41.279635	2025-11-07 12:06:41.279635	\N	\N	\N	173	FISICO	\N
516	FINALIZADO	WILKLEFFY JEOVA FERREIRA DANTAS	2763202	03910025.001970/2024-09	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-07-12 00:00:00	2024-09-03 00:00:00	\N	2025-11-07 12:06:41.285477	2025-11-07 12:06:41.285477	\N	\N	\N	174	FISICO	\N
517	FINALIZADO	RUI CASSIMIRO DE OLIVEIRA/ GRACILANE AGUIAR DE SOUSA	2777765	03910010100050/2024-97	UNIDADE DE PAU DOS FERROS	Não informado	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-07-15 00:00:00	\N	\N	2025-11-07 12:06:41.292457	2025-11-07 12:06:41.292457	\N	\N	\N	175	FISICO	\N
518	FINALIZADO	RICARDO ANTONIO CAVALCANTI ARAÚJO	3931740	03910008.001970/2024-17	SUBCOORDENAÇÃO II	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-07-17 00:00:00	2024-07-17 00:00:00	\N	2025-11-07 12:06:41.299392	2025-11-07 12:06:41.299392	\N	\N	\N	176	FISICO	\N
519	FINALIZADO	HAROLDO DE SÁ BEZERRA	36.031 LIVRO 361	05510096.00164/2024-31	DOCUMENTOSCOPIA	228012-4	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-07-29 00:00:00	2024-08-12 00:00:00	\N	2025-11-07 12:06:41.305321	2025-11-07 12:06:41.305321	\N	\N	\N	177	FISICO	\N
520	FINALIZADO	FRANCISCO CANINDÉ FERREIRA DE SOUZA	208225	03910024.003455/2024-65	ITEP-IML-SbNec	244.678-2	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-08-17 00:00:00	2024-08-20 00:00:00	\N	2025-11-07 12:06:41.313091	2025-11-07 12:06:41.313091	\N	\N	\N	178	FISICO	\N
521	FINALIZADO	BEATRIZ JOENNE DE LIMA	2971494	039100157.000088/2024-14	ITEP-II-SbOI	2454009	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-08-20 00:00:00	2024-08-22 00:00:00	\N	2025-11-07 12:06:41.319158	2025-11-07 12:06:41.319158	\N	\N	\N	179	FISICO	\N
522	FINALIZADO	EMERSON WAGNER BEZERRA	1813957	03910025.002320/2024-72	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-08-20 00:00:00	2024-08-21 00:00:00	\N	2025-11-07 12:06:41.327271	2025-11-07 12:06:41.327271	\N	\N	\N	180	FISICO	\N
523	FINALIZADO	MARIA DO CÉU GENTIL	1772273	11910500.000106/2024-84	ITEP-IC-NA-SPAP	228012-4	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-08-27 00:00:00	2024-09-05 00:00:00	\N	2025-11-07 12:06:41.334926	2025-11-07 12:06:41.334926	\N	\N	\N	181	FISICO	\N
524	FINALIZADO	ANA HELOIZA DA SILVA	2886602	11910500.000111/2024-97	ITEP-IC-NPI-SPD	228012-4	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-09-03 00:00:00	2024-09-05 00:00:00	\N	2025-11-07 12:06:41.342249	2025-11-07 12:06:41.342249	\N	\N	\N	182	FISICO	\N
525	FINALIZADO	JOÃO JOAQUIM DE MOURA FILHO	151601	039100157.000106/2024-68	ITEP-II-SbAI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-09-04 00:00:00	2024-09-03 00:00:00	\N	2025-11-07 12:06:41.350182	2025-11-07 12:06:41.350182	\N	\N	\N	183	FISICO	\N
526	FINALIZADO	SEVERINO MOREIRA DA SILVA	98253	03910007.004428/2024-18	DIREÇÃO II	Não informado	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-09-06 00:00:00	2024-09-11 00:00:00	\N	2025-11-07 12:06:41.357009	2025-11-07 12:06:41.357009	\N	\N	\N	184	FISICO	\N
527	FINALIZADO	JOANILSON DA SILVA	145162	03910025.002516/2024-67	ITEP-II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2024-09-09 00:00:00	2024-09-18 00:00:00	\N	2025-11-07 12:06:41.364371	2025-11-07 12:06:41.364371	\N	\N	\N	185	FISICO	\N
528	FINALIZADO	*	LIVRO 84	\N	ITEP-DGD	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-09-18 00:00:00	2024-09-18 00:00:00	\N	2025-11-07 12:06:41.370102	2025-11-07 12:06:41.370102	\N	\N	\N	186	FISICO	\N
529	FINALIZADO	JESUN SARAIVA / MARIA DE LOURDES DE MELO (SUSPEITA DE DUPLICIDADE)	1958218	03910024.004007/2024-89	ITEP-IML-SbNec	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-09-20 00:00:00	2024-09-23 00:00:00	\N	2025-11-07 12:06:41.378686	2025-11-07 12:06:41.378686	\N	\N	\N	187	FISICO	\N
530	FINALIZADO	MIGUEL ELIAS DE MORAIS	89203	03910014.002759/2024-24	GDG-ITEP	Não informado	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-10-02 00:00:00	\N	\N	2025-11-07 12:06:41.38463	2025-11-07 12:06:41.38463	\N	\N	\N	188	FISICO	\N
531	FINALIZADO	PRONTUÁRIO DO GRUPO DE LAMPIÃO	-	-	GDG-ITEP	367834392-81	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2024-10-08 00:00:00	\N	\N	2025-11-07 12:06:41.390422	2025-11-07 12:06:41.390422	\N	\N	\N	189	FISICO	\N
532	FINALIZADO	JOSÉ CLENILSON COSTA LIRA	2007406	039100157.000139/2024-16	ITEP-II-SbAI	Não informado	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-10-21 00:00:00	\N	\N	2025-11-07 12:06:41.397675	2025-11-07 12:06:41.397675	\N	\N	\N	190	FISICO	\N
533	FINALIZADO	ANTONIO CARLOS SOARES DA COSTA	186028	03910024.004353/2024-67	ITEP-IML-SbNec	244.678-2	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-10-16 00:00:00	2024-10-21 00:00:00	\N	2025-11-07 12:06:41.403873	2025-11-07 12:06:41.403873	\N	\N	\N	191	FISICO	\N
534	FINALIZADO	LAZARO LEONARDO GOMES DANTAS	3139138	03910008.002963/2024-24	ITEP - II - SUBCOORDENAÇÃO	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-10-24 00:00:00	\N	\N	2025-11-07 12:06:41.410342	2025-11-07 12:06:41.410342	\N	\N	\N	192	FISICO	\N
535	FINALIZADO	JOSIEL BRAGA DA SILVA	147874	03910025.003026/2024-88	II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL (prontuário físico não localizado, consta apenas o digital)	2024-10-25 00:00:00	2024-10-31 00:00:00	\N	2025-11-07 12:06:41.416521	2025-11-07 12:06:41.416521	\N	\N	\N	193	FISICO	\N
536	FINALIZADO	MATHEUS FELIPE PAULISTA DA SILVA	201417	03910025.003026/2024-88	II-SbOI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2024-10-25 00:00:00	2024-10-29 00:00:00	\N	2025-11-07 12:06:41.421748	2025-11-07 12:06:41.421748	\N	\N	\N	194	FISICO	\N
537	FINALIZADO	MARIA GORETTI TINOCO DE OLIVEIRA	57951	039100157.000152/2024-67	ITEP-II-SbAI	Não informado	Suspeito de duplicidade	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-11-05 00:00:00	\N	\N	2025-11-07 12:06:41.428178	2025-11-07 12:06:41.428178	\N	\N	\N	195	FISICO	\N
593	NAO_LOCALIZADO	N. I. - RODRIGO DE OLIVEIRA DIAS	01.1366.08/14	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.768495	2025-11-07 12:06:41.768495	\N	\N	\N	251	FISICO	\N
538	FINALIZADO	nº 002.468.645, RODRIGU FIGUEIRA DA COSTA\nnº 002.705.228 RODRIGO RODRIGUES DA SILVA\nn° 002.685.257 ELIAS RODRIGO DA SILVA\n\nnº 1.856.051 RODRIGO RODRIGUES COSTA	002.468.645 | 002.705.228 | 002.685.257 | 1.856.051	11910500.000163/2024-63	ITEP-IC-NPI-SPD	245014-3	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-11-05 00:00:00	2024-11-07 00:00:00	\N	2025-11-07 12:06:41.433491	2025-11-07 12:06:41.433491	\N	\N	\N	196	FISICO	\N
539	FINALIZADO	n° 3.791.219	3791219	039100157.000161/2024-58	ITEP-II-SbAI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-11-18 00:00:00	2024-11-18 00:00:00	\N	2025-11-07 12:06:41.43891	2025-11-07 12:06:41.43891	\N	\N	\N	197	FISICO	\N
540	FINALIZADO	RITA CELIA DANTAS	1086141	039100157.000185/2024-15	ITEP-II-SbAI	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-12-11 00:00:00	2024-12-13 00:00:00	\N	2025-11-07 12:06:41.446162	2025-11-07 12:06:41.446162	\N	\N	\N	198	FISICO	\N
541	FINALIZADO	n° 1.796.709 FRANCISCO TALES DE OLIVEIRA PINTO	1796709	119110101.000895/2024-56	ITEP-II-NUC DE IDENTIFICAÇÃO/ITEP	*	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-10-06 00:00:00	2024-12-13 00:00:00	\N	2025-11-07 12:06:41.452839	2025-11-07 12:06:41.452839	\N	\N	\N	199	FISICO	\N
542	FINALIZADO	2923684	2923684	03910024.005151/2024-32	ITEP-IML-SbNec	Não informado	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2024-12-20 00:00:00	2025-01-08 00:00:00	\N	2025-11-07 12:06:41.459546	2025-11-07 12:06:41.459546	\N	\N	\N	200	FISICO	\N
543	FINALIZADO	ROMÁRIO MATHEUS DA SILVA	138056	03910025.003518/2024-73	ITEP-sBOI	VICTOR	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2024-12-26 00:00:00	2025-01-08 00:00:00	\N	2025-11-07 12:06:41.466081	2025-11-07 12:06:41.466081	\N	\N	\N	201	FISICO	\N
544	FINALIZADO	MARCELO COTTA DE MELLO	4.197.288/RN	039100157.000001/2025-90	ITEP-II-SbAI	RENO ARAUJO GOIS	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-01-07 00:00:00	\N	\N	2025-11-07 12:06:41.472182	2025-11-07 12:06:41.472182	\N	\N	\N	202	FISICO	\N
545	FINALIZADO	nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES	nº 002.405.395 - GLAUCIA COSTA LUIZ DE ARAUJO | nº 002.438.517 - GLAUCIA DA SILVA GOMES	11910035.000074/2025-31	ITEP-IC-NPI-SPD - DOCUMENTOSCOPIA	HEGLAYNE PEREIRA VITAL DA SILVA	Suspeita de fraude	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-01-14 00:00:00	2025-01-20 00:00:00	\N	2025-11-07 12:06:41.478871	2025-11-07 12:06:41.478871	\N	\N	\N	203	FISICO	\N
546	FINALIZADO	BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17 | Alexandro Batista da Costa, laudo de Exame Necroscópico nº 01.01241.06/17)	BIC 91914 e Laudo de Exame Necroscópico nº 01.01241.06/17	039100154.000276/2024-72	ITEP-II-SBPA	PAULA MEDINA LESSA SANTOS, PERITA CRIMINAL	Importação de dados históricos	f	f	1	\N	FISICO	BIC | LAUDO NECROSCÓPICO	2025-01-21 00:00:00	\N	\N	2025-11-07 12:06:41.484265	2025-11-07 12:06:41.484265	\N	\N	\N	204	FISICO	\N
547	FINALIZADO	DAMIÃO BARBOSA SIMPLICO | JOÃO CARLOS MARCOLINO	3.764.469 \\ 3.294.805	11910035.000083/2025-22	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-01-28 00:00:00	2025-02-04 00:00:00	\N	2025-11-07 12:06:41.489731	2025-11-07 12:06:41.489731	\N	\N	\N	205	FISICO	\N
548	FINALIZADO	Aristofanes Medeiros da Costa	nº 203.297 SSP/RN	03910024.000276/2025-57	PASPILOSCOPIA	ANA KAROLINA QUEIROZ DA SILVA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-01-28 00:00:00	2025-01-31 00:00:00	\N	2025-11-07 12:06:41.496265	2025-11-07 12:06:41.496265	\N	\N	\N	206	FISICO	\N
549	FINALIZADO	WILLIAN DE OLIVEIRA SILVA	nº 140731	03910025.000238/2025-94	II-SbOI	VICTOR	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2025-02-03 00:00:00	2025-02-04 00:00:00	\N	2025-11-07 12:06:41.501484	2025-11-07 12:06:41.501484	\N	\N	\N	207	FISICO	\N
550	FINALIZADO	WILLIAN DE OLIVEIRA SILVA	Ofício nº 003/2016 - Prontuário nº 140731	03910025.000238/2025-95	II-SbOI	MATHEUS / VICTOR	Importação de dados históricos	f	f	1	\N	FISICO	OFÍCIO ANEXADO AO PRONTUÁRIO CRIMINAL	2025-02-10 00:00:00	\N	\N	2025-11-07 12:06:41.507898	2025-11-07 12:06:41.507898	\N	\N	\N	208	FISICO	\N
551	FINALIZADO	BENICIO COSTA (Não localizado)	3769456	039100157.000034/2025-30	ITEP-II-SbAI	DEVOLVIDO POR RENO ARAUJO GOIS	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-07 00:00:00	\N	2025-11-07 12:06:41.514812	2025-11-07 12:06:41.514812	\N	\N	\N	209	FISICO	\N
552	FINALIZADO	LUCENI SILVA DOS SANTOS	1994569	03910025.000559/2025-99	49	Físico	Não localizado na empresa	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	\N	\N	2025-11-07 12:06:41.519678	2025-11-07 12:06:41.519678	\N	\N	\N	210	FISICO	\N
553	FINALIZADO	nº 2.766.547 MARCOS ADRIANO FILHO	1. Prontuário Civil nº 2.766.547	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.526095	2025-11-07 12:06:41.526095	\N	\N	\N	211	FISICO	\N
554	SOLICITADO	nº 2.766.548\tJOSE ROBERTO MEDEIROS TENORIO	2. Prontuário Civil nº 2.766.548	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.532456	2025-11-07 12:06:41.532456	\N	\N	\N	212	FISICO	\N
555	SOLICITADO	nº 2.766.549\tJOSE SANTOS LESSA	3. Prontuário Civil nº 2.766.549	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.537879	2025-11-07 12:06:41.537879	\N	\N	\N	213	FISICO	\N
556	SOLICITADO	nº 2.766.908\tHENRIQUE FEITOSA VASCONCELOS	4. Prontuário Civil nº 2.766.908	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.54458	2025-11-07 12:06:41.54458	\N	\N	\N	214	FISICO	\N
562	FINALIZADO	JOÃO MARIA DA SILVA BARBOSA	Prontuário Civil nº 1.801.841	03910025.000795/2025-13	ITEP-II-SOI	JOÃO VICTOR BILRO MANGUINHO	Identificação Criminal	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-31 00:00:00	\N	\N	2025-11-07 12:06:41.5828	2025-11-07 12:06:41.5828	\N	\N	\N	220	FISICO	\N
563	FINALIZADO	JORGE MATEUS FERREIRA DOS SANTOS	BIC N° : 259713 (OBS: NÃO CONSTA NO BIC ORIGINAL, INFORMAÇÃO CEDIDA PEL JUDICIÁRIO) Prontuário Civil N°  003880814	03910009.000711/2025-31	\N	Não informado	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CRIMINAL	2025-04-09 00:00:00	\N	\N	2025-11-07 12:06:41.587595	2025-11-07 12:06:41.587595	\N	\N	\N	221	FISICO	\N
564	FINALIZADO	JOSÉ GABRIEL DA SILVA	Prontuário Civil nº 1.482.989	039100157.000072/2025-92	ITEP-II-SAI	224.181-1	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-02-22 00:00:00	2025-04-24 00:00:00	\N	2025-11-07 12:06:41.593934	2025-11-07 12:06:41.593934	\N	\N	\N	222	FISICO	\N
560	SOLICITADO	nº 2.821.267\tIVALDO OLIVEIRA VALERIO	8. Prontuário Civil nº 2.821.267	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.570579	2025-11-07 12:54:30.343911	\N	\N	\N	218	FISICO	\N
558	SOLICITADO	nº 2.766.907\tJOSE JUNIOR CARLOS DE OLIVEIRA	6. Prontuário Civil nº 2.766.907	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.556926	2025-11-07 12:54:32.161092	\N	\N	\N	216	FISICO	\N
557	SOLICITADO	nº 2.821.275\tANTONIO JORGE SILVA	5. Prontuário Civil nº 2.821.275	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.550996	2025-11-07 12:54:34.852398	\N	\N	\N	215	FISICO	\N
559	SOLICITADO	nº 2.821.274 JARDIEL SILVA E SILVA	7. Prontuário Civil nº 2.821.274	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.563574	2025-11-07 12:54:36.916807	\N	\N	\N	217	FISICO	\N
565	FINALIZADO	JOSÉ FRANCISCO NOGUEIRA DA SILVA	Prontuário Civil n°3.743.038 SSP/RN	03910024.001342/2025-14	ITEP-IML-SNP	ANA KAROLINA QUEIROZ OLIVEIRA	Identificação necropapiloscópica de cadáver registrado no Instituto de Medicina Legal	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-04-28 00:00:00	\N	\N	2025-11-07 12:06:41.599721	2025-11-07 12:06:41.599721	\N	\N	\N	223	FISICO	\N
566	FINALIZADO	TARCIO BARBOSA FERREIRA	Prontuário Civil  nº 3.931.670	03910025.001052/2025-52	ITEP-II-SOI	JOÃO VICTOR BILRO MANGUINHO	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-04-29 00:00:00	2025-05-21 00:00:00	\N	2025-11-07 12:06:41.605989	2025-11-07 12:06:41.605989	\N	\N	\N	224	FISICO	\N
567	FINALIZADO	DIVALCI VILAR DE MEDEIROS	Prontuário Civil nº 1.864.472	11910072.000353/2025-59	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	realização de exame grafotécnico	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-04-30 00:00:00	2025-05-22 00:00:00	\N	2025-11-07 12:06:41.611891	2025-11-07 12:06:41.611891	\N	\N	\N	225	FISICO	\N
571	FINALIZADO	CARLOS JORGE ANDRADE DOS SANTOS (Nº: 2.216.369)\n - LEONARDO PEREIRA DANTAS (Nº 3.866.295)	Prontuário Civil nº: 2.216.369 \nProntuário Civil nº 3.866.295	11910535.000068/2025-43	ITEP-IC-NPI-SPD	DANIELA CHRISTINA GIOPPO	Perícia grafotécnica	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-05-15 00:00:00	2025-05-26 00:00:00	\N	2025-11-07 12:06:41.635359	2025-11-07 12:06:41.635359	\N	\N	\N	229	FISICO	\N
573	FINALIZADO	KELLYSON CARLOS DO NASCIMENTO SANTOS	nº 2.923.050 SSP/RN	03910024.001553/2025-49	ITEP-IML-SNP	ANA KAROLINA DE QUEIROZ OLIVEIRA	NECROPAPILOSCOPIA	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-05-20 00:00:00	\N	\N	2025-11-07 12:06:41.648499	2025-11-07 12:06:41.648499	\N	\N	\N	231	FISICO	\N
574	FINALIZADO	ROMÁRIO MATHEUS DA SILVA	BIC n°138.056	03910025.001262/2025-41	ITEP-II-SOI	JOÃO VICTOR BILRO MANGUINHO	Importação de dados históricos	f	f	1	\N	FISICO	BOLETIM DE IDENTIFICAÇÃO CRIMINAL	2025-05-26 00:00:00	\N	\N	2025-11-07 12:06:41.653502	2025-11-07 12:06:41.653502	\N	\N	\N	232	FISICO	\N
575	FINALIZADO	FRANCISCO DE ASSIS MORENO	Nº 301.790	039100157.000100/2025-71	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico	f	f	1	\N	FISICO	Fichas de identificação civil	2025-06-04 00:00:00	2025-06-06 00:00:00	\N	2025-11-07 12:06:41.659816	2025-11-07 12:06:41.659816	\N	\N	\N	233	FISICO	\N
576	FINALIZADO	LUIZ ANTÔNIO DA SILVA	Nº 769.262	039100157.000100/2025-71	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico	f	f	1	\N	FISICO	Fichas de identificação civil	2025-06-04 00:00:00	2025-06-06 00:00:00	\N	2025-11-07 12:06:41.665721	2025-11-07 12:06:41.665721	\N	\N	\N	234	FISICO	\N
577	FINALIZADO	FRANCISCO FÉLIX DA SILVA	Nº 1.857.918	039100157.000100/2025-71	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico	f	f	1	\N	FISICO	Fichas de identificação civil	2025-06-04 00:00:00	2025-06-06 00:00:00	\N	2025-11-07 12:06:41.670498	2025-11-07 12:06:41.670498	\N	\N	\N	235	FISICO	\N
578	FINALIZADO	FRANCISCO CAETANO FILHO	Nº 736.031	039100157.000100/2025-71	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico	f	f	1	\N	FISICO	Fichas de identificação civil	2025-06-04 00:00:00	2025-06-06 00:00:00	\N	2025-11-07 12:06:41.67694	2025-11-07 12:06:41.67694	\N	\N	\N	236	FISICO	\N
579	FINALIZADO	RODNEI ELDER PACHECO	RG nº 2.258.371	03910009.001052/2025-51	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico	f	f	1	\N	FISICO	Fichas de identificação civil	2025-06-15 00:00:00	2025-07-06 00:00:00	\N	2025-11-07 12:06:41.682879	2025-11-07 12:06:41.682879	\N	\N	\N	237	FISICO	\N
580	FINALIZADO	LEANDRO QUEIROZ DOS REIS	RG nº 2.392.130	03910009.001052/2025-51	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico	f	f	1	\N	FISICO	Fichas de identificação civil	2025-06-15 00:00:00	2025-07-06 00:00:00	\N	2025-11-07 12:06:41.688427	2025-11-07 12:06:41.688427	\N	\N	\N	238	FISICO	\N
581	FINALIZADO	JOSE SILVESTRE DE PONTES	196,351	03910024.001926/2025-81	SETOR DE NECROPAPILOSCOPIA DO IML	ANA KAROLINA DE QUEIROZ OLIVEIRA	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-06-18 00:00:00	\N	\N	2025-11-07 12:06:41.694747	2025-11-07 12:06:41.694747	\N	\N	\N	239	FISICO	\N
582	FINALIZADO	ELIZABETH VICTOR DOS SANTOS	1,303,132	03910024.001991/2025-15	SETOR DE NECROPAPILOSCOPIA DO IML	ANA KAROLINA DE QUEIROZ OLIVEIRA	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-06-26 00:00:00	\N	\N	2025-11-07 12:06:41.700022	2025-11-07 12:06:41.700022	\N	\N	\N	240	FISICO	\N
583	FINALIZADO	RIGNER LUIZ FREITAS DE FRANCA	2,978,102	03910024.001991/2025-15	SETOR DE NECROPAPILOSCOPIA DO IML	ANA KAROLINA DE QUEIROZ OLIVEIRA	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-06-26 00:00:00	\N	\N	2025-11-07 12:06:41.704842	2025-11-07 12:06:41.704842	\N	\N	\N	241	FISICO	\N
584	NAO_LOCALIZADO	MARCOS ANTÔNIO LIMA DA SILVA	Dev. de processo físico	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.711094	2025-11-07 12:06:41.711094	\N	\N	\N	242	FISICO	\N
585	NAO_LOCALIZADO	SILVANEIDE PAULO DA SILVA	12.00113/206	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.717177	2025-11-07 12:06:41.717177	\N	\N	\N	243	FISICO	\N
586	REARQUIVAMENTO_SOLICITADO	FRANCISCO ANACLETO DE LIMA	01.00394.03/2012	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.722213	2025-11-07 12:06:41.722213	\N	\N	\N	244	FISICO	\N
587	RETIRADO_PELO_SETOR	N.I. - MULHER	899/2017 NIC 00142	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico (Carbonizada -  Só a primeira folha)	2025-07-18 00:00:00	2025-08-22 00:00:00	\N	2025-11-07 12:06:41.728773	2025-11-07 12:06:41.728773	\N	\N	\N	245	FISICO	\N
588	REARQUIVAMENTO_SOLICITADO	N.I.	01.01899.11/13	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico (Só a primeira folha)	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.734913	2025-11-07 12:06:41.734913	\N	\N	\N	246	FISICO	\N
589	REARQUIVAMENTO_SOLICITADO	IVANILSON CAVALCANTE FARIAS	01.1020.07/09	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.741238	2025-11-07 12:06:41.741238	\N	\N	\N	247	FISICO	\N
590	NAO_LOCALIZADO	CRISTIANE GIL GARCIA	01.1492.11/11	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.749477	2025-11-07 12:06:41.749477	\N	\N	\N	248	FISICO	\N
591	NAO_LOCALIZADO	BRUNO AZAMBUJA DE FREITAS	01.1493.11/11	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.755558	2025-11-07 12:06:41.755558	\N	\N	\N	249	FISICO	\N
592	NAO_LOCALIZADO	EVANDRO OLIVEIRA DE SOUZA	Aguardando DHPP	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico  - (Não localizado no caderno 2015)	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.762522	2025-11-07 12:06:41.762522	\N	\N	\N	250	FISICO	\N
570	FINALIZADO	DENILDA FELIX DA SILVA	Prontuário Civil nº 2.026.941	039100157.000090/2025-74	ITEP-II-SAI	RAFAELA CICERA DE ALBUQUERQUE DUDA DA ROCHA	Investigação de RG	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-05-12 00:00:00	2025-05-25 00:00:00	\N	2025-11-07 12:06:41.629821	2025-11-10 09:31:26.161671	\N	\N	\N	228	FISICO	\N
569	FINALIZADO	JOSIVALDO MONTEIRO DA SILVA	Prontuário civil nº 494.283; nº CPF 381.100.404-20	11910166.000185/2025-52	ITEP-IC-NPI-SPD	DANIELA CHRISTINA GIOPPO	realização de exame grafotécnico	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-05-12 00:00:00	2025-05-24 00:00:00	\N	2025-11-07 12:06:41.623287	2025-11-10 09:31:01.731662	\N	\N	\N	227	FISICO	\N
568	FINALIZADO	DIVALCI MENDONCA DA SILVA	Prontuário Civil nº 3.379.589	11910072.000353/2025-59	ITEP-IC-NPI-SPD	HEGLAYNE PEREIRA VITAL DA SILVA	realização de exame grafotécnico	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-04-30 00:00:00	2025-05-23 00:00:00	\N	2025-11-07 12:06:41.618203	2025-11-10 09:31:53.898492	\N	\N	\N	226	FISICO	\N
594	NAO_LOCALIZADO	N.I.	01.0114.01/16	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.773655	2025-11-07 12:06:41.773655	\N	\N	\N	252	FISICO	\N
595	NAO_LOCALIZADO	MAGNO SILVA SENA	01.1190.06/17	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.780267	2025-11-07 12:06:41.780267	\N	\N	\N	253	FISICO	\N
596	NAO_LOCALIZADO	N.I.	01.2063.11/16	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.785574	2025-11-07 12:06:41.785574	\N	\N	\N	254	FISICO	\N
597	REARQUIVAMENTO_SOLICITADO	JOSÉ HEBERSON BARBOSA SOARES	01.0860.05/15	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.79144	2025-11-07 12:06:41.79144	\N	\N	\N	255	FISICO	\N
598	NAO_LOCALIZADO	FRANCISCO MARCOS ALVES	01.0569.03/17	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.798127	2025-11-07 12:06:41.798127	\N	\N	\N	256	FISICO	\N
599	REARQUIVAMENTO_SOLICITADO	ALICE RODRIGUES VICENTE	05.00404.10/16	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico - (Só encontrado conj. carnal e no caderno não consta ato lib.)	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.803801	2025-11-07 12:06:41.803801	\N	\N	\N	257	FISICO	\N
600	NAO_LOCALIZADO	FRANKLIN RAGNER SANTOS DE FIGUEIREDO	01.1746.10/14	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.810043	2025-11-07 12:06:41.810043	\N	\N	\N	258	FISICO	\N
601	NAO_LOCALIZADO	N.I.	01.1501.07/17	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.81603	2025-11-07 12:06:41.81603	\N	\N	\N	259	FISICO	\N
602	NAO_LOCALIZADO	LODOGILDO DE ARAÚJO	01.0516.04/11	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.8213	2025-11-07 12:06:41.8213	\N	\N	\N	260	FISICO	\N
603	REARQUIVAMENTO_SOLICITADO	JONATHAN CARDOSO DE LIMA	01.0111.01/13	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.828535	2025-11-07 12:06:41.828535	\N	\N	\N	261	FISICO	\N
604	REARQUIVAMENTO_SOLICITADO	OSSADA HUMANA	09.0002.02.2016	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	2025-08-22 00:00:00	2025-08-25 00:00:00	2025-11-07 12:06:41.834336	2025-11-07 12:06:41.834336	\N	\N	\N	262	FISICO	\N
605	NAO_LOCALIZADO	N.I.	01.0084.01/17	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.839185	2025-11-07 12:06:41.839185	\N	\N	\N	263	FISICO	\N
606	NAO_LOCALIZADO	N.I.	01.1769.09/16	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.845541	2025-11-07 12:06:41.845541	\N	\N	\N	264	FISICO	\N
607	NAO_LOCALIZADO	N.I.	01.0217.02/16	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.851058	2025-11-07 12:06:41.851058	\N	\N	\N	265	FISICO	\N
608	NAO_LOCALIZADO	IBRAHIM MOHAMED KHALIL FILHO	1389/208	03910003.001984/2025-53	SETOR DE NECROPAPILOSCOPIA DO IML	Não informado	EXAME NECROPAPILOSCÓPICO	f	f	1	\N	FISICO	Laudo necroscópico	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.855744	2025-11-07 12:06:41.855744	\N	\N	\N	266	FISICO	\N
609	NAO_LOCALIZADO	FRANKLIN GIVANILDO BEZERRA DA COSTA	4,244,388	03910025.001695/2025-04	Apoio a investigação	João Victor Bilro Manguinho	Requisição Pericial de Identificação Criminal	f	f	1	\N	FISICO	Prontuário Civil	2025-07-18 00:00:00	\N	\N	2025-11-07 12:06:41.861875	2025-11-07 12:06:41.861875	\N	\N	\N	267	FISICO	\N
610	FINALIZADO	PATRÍCIA GOMES BEZERRA DA SILVA	2,820,755	039100157.000133/2025-11	ITEP-II-SAI	Rafaela Cícera de Albuquerque Duda da Rocha	Apoio a Investigação	f	f	1	\N	FISICO	Segunda via de Prontuário Civil	2025-07-16 00:00:00	2025-07-18 00:00:00	\N	2025-11-07 12:06:41.867067	2025-11-07 12:06:41.867067	\N	\N	\N	268	FISICO	\N
611	NAO_LOCALIZADO	LUIS GONZAGA DA SILVA	Não possui	039100121.000005/2025-85	ITEP - PAU DOS FERROS	LEILA EMIDIA CARVALHO FONTES CARDOSO	Requisição para exame de necropapiloscopia	f	f	1	\N	FISICO	Prontuário Civil	2025-07-28 00:00:00	\N	\N	2025-11-07 12:06:41.872027	2025-11-07 12:06:41.872027	\N	\N	\N	269	FISICO	\N
612	FINALIZADO	JOÃO MARIA BARACHO ALBINO	BIC N° 146.040	03910025.001717/2025-28	ITEP - II - SOI	João Victor Bilro Manguinho	Importação de dados históricos	f	f	1	\N	FISICO	Boletim de Identificação Criminal	2025-07-22 00:00:00	2025-09-04 00:00:00	2025-09-04 00:00:00	2025-11-07 12:06:41.878103	2025-11-07 12:06:41.878103	\N	\N	\N	270	FISICO	\N
613	FINALIZADO	JORGE MATEUS FERREIRA DOS SANTOS	BIC N° 146.040	03910009.000711/2025-31	ITEP - II - SBP	João Freire de Medeiros Neto	Requisção para realização de exame de confronto papiloscópico. Encontrado no arquivo físico do ITEP	f	f	1	\N	FISICO	Boletim de Identificação Criminal	2025-05-09 00:00:00	2025-07-28 00:00:00	\N	2025-11-07 12:06:41.884304	2025-11-07 12:06:41.884304	\N	\N	\N	271	FISICO	\N
614	FINALIZADO	MARIA DE FATIMA SARAIVA	nº 1.391.265	039100157.000099/2025-85	ITEP-IC-NPI-SPD	Heglayne Pereira Vital da Silva	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-01 00:00:00	\N	\N	2025-11-07 12:06:41.888945	2025-11-07 12:06:41.888945	\N	\N	\N	272	FISICO	\N
615	NAO_LOCALIZADO	Nome: Germano Jose Ferreira de Farias\nFiliação: João Batista de Farias Filho e Cleide Aquino Ferreira de Farias\nNaturalidade: Natal/RN\nData de Nascimento: 14/03/1983	1,725,987	03910024.002555/2025-55	ITEP-IML-SNP	Dinara Rodrigues de Andrade Silva	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-07 00:00:00	\N	\N	2025-11-07 12:06:41.894922	2025-11-07 12:06:41.894922	\N	\N	\N	273	FISICO	\N
616	FINALIZADO	JOHN KENNEDY DOS SANTOS	1,529,503	039100157.000110/2025-15	ITEP-IC-NPI-SPD	Heglayne Pereira Vital da Silva	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-13 00:00:00	\N	\N	2025-11-07 12:06:41.900488	2025-11-07 12:06:41.900488	\N	\N	\N	274	FISICO	\N
617	FINALIZADO	MARCOS DA ROCHA SILVA	1,617,956	039100157.000110/2025-16	ITEP-IC-NPI-SPD	Heglayne Pereira Vital da Silva	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-14 00:00:00	\N	\N	2025-11-07 12:06:41.905539	2025-11-07 12:06:41.905539	\N	\N	\N	275	FISICO	\N
618	FINALIZADO	Daniel Miguel da Costa	BIC n°109.632	039100154.000302/2025-43	ITEP-II-SBP	Stephanie Isuetcoff Lucrécio	Importação de dados históricos	f	f	1	\N	FISICO	Boletim de Identificação Criminal	2025-08-14 00:00:00	2025-08-19 00:00:00	2025-08-20 00:00:00	2025-11-07 12:06:41.91265	2025-11-07 12:06:41.91265	\N	\N	\N	276	FISICO	\N
619	FINALIZADO	Welkciley Miguel da Costa	1,685,492	039100154.000302/2025-43	ITEP-II-SBP	Stephanie Isuetcoff Lucrécio	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-18 00:00:00	2025-08-19 00:00:00	\N	2025-11-07 12:06:41.91876	2025-11-07 12:06:41.91876	\N	\N	\N	277	FISICO	\N
620	FINALIZADO	Daniel Miguel da Costa	RG nº 1.517.069	039100154.000302/2025-43	ITEP-II-SBP	Stephanie Isuetcoff Lucrécio	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-18 00:00:00	2025-08-19 00:00:00	2025-08-20 00:00:00	2025-11-07 12:06:41.924611	2025-11-07 12:06:41.924611	\N	\N	\N	278	FISICO	\N
621	NAO_LOCALIZADO	ANTÔNIO SALUSTIO DE AZEVEDO | NASC.: 14/01/1916	NÃO INFORMADO / Aguardando o núcleo de Caicó enviar o número	03910181.000389/2025-40	ITEP-NUC-IDENT-CHEFIA-CAICO	ALYNE SWERDA PEREIRA E SILVA	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-20 00:00:00	\N	\N	2025-11-07 12:06:41.930997	2025-11-07 12:06:41.930997	\N	\N	\N	279	FISICO	\N
622	FINALIZADO	GEOVANI DE OLIVEIRA	RG N° 2.617.062	03910025.002014/2025-17	ITEP-II-SOI	Matheus Medeiros de Azevedo	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-27 00:00:00	\N	\N	2025-11-07 12:06:41.93608	2025-11-07 12:06:41.93608	\N	\N	\N	280	FISICO	\N
623	FINALIZADO	IOLANDA GOMES DA SILVA	RG N° 3.172.080	039100157.000154/2025-37	ITEP-II-SAI	Rafaela Cícera de Albuquerque Duda da Rocha	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-08-28 00:00:00	\N	\N	2025-11-07 12:06:41.941802	2025-11-07 12:06:41.941802	\N	\N	\N	281	FISICO	\N
624	NAO_LOCALIZADO	JEAN DEYVID BESERRA SILVA	RG nº 1.657.512	039100157.000165/2025-17	ITEP-II-SAI	Rafaela Cícera de Albuquerque Duda da Rocha	Importação de dados históricos	f	f	1	\N	FISICO	Prontuário Civil	2025-09-15 00:00:00	\N	\N	2025-11-07 12:06:41.948048	2025-11-07 12:06:41.948048	\N	\N	\N	282	FISICO	\N
625	REARQUIVAMENTO_SOLICITADO	JOSENILSON DA SILVA BESSA	RG 03.636.648	03910197.000279/2025-17	Núcleo de Identificação da Regional de Pau dos Ferros	Jenneson Andrade de Araujo	Liberação do corpo	f	f	1	\N	FISICO	Prontuário Civil	2025-09-15 00:00:00	2025-09-16 00:00:00	\N	2025-11-07 12:06:41.95403	2025-11-07 12:06:41.95403	\N	\N	\N	283	FISICO	\N
626	RETIRADO_PELO_SETOR	ABRAÃO MENDES DA SILVA	2.043.870/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.959292	2025-11-07 12:06:41.959292	\N	\N	\N	284	FISICO	\N
627	RETIRADO_PELO_SETOR	ABRAAO MENDES TEIXEIRA	2.265.088/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.965181	2025-11-07 12:06:41.965181	\N	\N	\N	285	FISICO	\N
628	RETIRADO_PELO_SETOR	ABRAAO MENDES PEREIRA	2.319.508/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.970546	2025-11-07 12:06:41.970546	\N	\N	\N	286	FISICO	\N
629	RETIRADO_PELO_SETOR	ABRAAO MENDES FARIAS	2.361.121/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.976146	2025-11-07 12:06:41.976146	\N	\N	\N	287	FISICO	\N
630	RETIRADO_PELO_SETOR	ABRAAO MENDES SOUZA	2.498.176/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.981823	2025-11-07 12:06:41.981823	\N	\N	\N	288	FISICO	\N
631	RETIRADO_PELO_SETOR	JURANDIR BERNARDE LEITE	2.766.013/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.986791	2025-11-07 12:06:41.986791	\N	\N	\N	289	FISICO	\N
632	RETIRADO_PELO_SETOR	MARCOS ADRIANO FILHO	2.766.547 /ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.992538	2025-11-07 12:06:41.992538	\N	\N	\N	290	FISICO	\N
633	RETIRADO_PELO_SETOR	JOSE ROBERTO MEDEIROS TENORIO	2.766.548/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:41.998544	2025-11-07 12:06:41.998544	\N	\N	\N	291	FISICO	\N
634	RETIRADO_PELO_SETOR	JOSE SANTOS LESSA	2.766.549/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.00387	2025-11-07 12:06:42.00387	\N	\N	\N	292	FISICO	\N
635	RETIRADO_PELO_SETOR	OZEAS RODRIGUES DOS SANTOS	2.766.906/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.009527	2025-11-07 12:06:42.009527	\N	\N	\N	293	FISICO	\N
636	RETIRADO_PELO_SETOR	JOSE JUNIOR CARLOS DE OLIVEIRA	2.766.907/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.015973	2025-11-07 12:06:42.015973	\N	\N	\N	294	FISICO	\N
637	RETIRADO_PELO_SETOR	JARDIEL SILVA E SILVA	2.821.274/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.020951	2025-11-07 12:06:42.020951	\N	\N	\N	295	FISICO	\N
638	RETIRADO_PELO_SETOR	JAIR RAMOS	3.040.006/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.026074	2025-11-07 12:06:42.026074	\N	\N	\N	296	FISICO	\N
639	RETIRADO_PELO_SETOR	ABRAAO MENDES GOMES	3.433.175/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.032334	2025-11-07 12:06:42.032334	\N	\N	\N	297	FISICO	\N
640	RETIRADO_PELO_SETOR	IVALDO OLIVEIRA VALERIO	2.821.267/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.037635	2025-11-07 12:06:42.037635	\N	\N	\N	298	FISICO	\N
641	RETIRADO_PELO_SETOR	JOAO BATISTA DE OLIVEIRA	2.611.260/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.043514	2025-11-07 12:06:42.043514	\N	\N	\N	299	FISICO	\N
642	RETIRADO_PELO_SETOR	ARCELON ALCIM DE SALES	2.766.643/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.049489	2025-11-07 12:06:42.049489	\N	\N	\N	300	FISICO	\N
643	RETIRADO_PELO_SETOR	HENRIQUE FEITOSA VASCONCELOS	2.766.908/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.055249	2025-11-07 12:06:42.055249	\N	\N	\N	301	FISICO	\N
644	RETIRADO_PELO_SETOR	ABRAAO DA SILVA MENDES	2.722.787/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.061486	2025-11-07 12:06:42.061486	\N	\N	\N	302	FISICO	\N
645	RETIRADO_PELO_SETOR	CELIA DE FARIAS MENDES	2.766.528/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.06714	2025-11-07 12:06:42.06714	\N	\N	\N	303	FISICO	\N
646	RETIRADO_PELO_SETOR	ANTONIO JORGE SILVA	2.821.275/ITEP/RN	039100157.000028/2025-82	Documentoscopia	Daniela Christina Gioppo	Exame grafotécnico	f	f	1	\N	FISICO	Prontuário Civil	2025-10-07 00:00:00	\N	\N	2025-11-07 12:06:42.072956	2025-11-07 12:06:42.072956	\N	\N	\N	304	FISICO	\N
647	FINALIZADO	INGRIDE DE OLIVEIRA BATISTA	2,677,464	03910133.000613/2025-79	Unidade Regional de Caicó	Mucio Flavio de Carvalho	Necropapiloscopia	f	f	1	\N	FISICO	Prontuário Civil	2025-10-14 00:00:00	\N	\N	2025-11-07 12:06:42.079265	2025-11-07 12:06:42.079265	\N	\N	\N	305	FISICO	\N
648	NAO_COLETADO	ISMAEL MOURA DA SILVA	IDENTIFICAÇÃO CRIMINAL:  Nº: 0283/2019  - ISMAEL MOURA DA SILVA | PRONTUÁRIOS CIVIS: ISMAEL MOURA DA SILVA - Nº 3.730.479        \n- JOSE DANTAS DA SILVA - Nº 4.186.843	11910492.000107/2025-56	Setor de Biometria e Papiloscopia	Paula Medina Lessa Santos	Papiloscopia	f	f	1	\N	FISICO	Informação técnica	2025-10-16 00:00:00	\N	\N	2025-11-07 12:06:42.084892	2025-11-07 12:06:42.084892	\N	\N	\N	306	FISICO	\N
649	NAO_LOCALIZADO	ANDREASA FERREIRA DA FONSECA	nº 1.945.298	03910025.002606/2025-39	Setor Operacional de Identificação	João Victor Bilro Manguinho	Papiloscopia	f	f	1	\N	FISICO	Prontuário Civil	2025-10-29 00:00:00	\N	\N	2025-11-07 12:06:42.089527	2025-11-07 12:06:42.089527	\N	\N	\N	307	FISICO	\N
650	SOLICITADO	JEAN DAVID BEZERRA BRITO	2.669.908	039100157.000190/2025-09	Setor de Perícias de documentoscopia	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico entre as assinaturas coletadas	f	f	1	\N	FISICO	Prontuário Civil	2025-11-07 00:00:00	\N	\N	2025-11-07 12:13:58.904	2025-11-07 12:13:58.904	\N	\N	\N	308	FISICO	\N
651	SOLICITADO	GEAN DAVID BEZERRA BRITO	2.821.942	039100157.000190/2025-09	Setor de Perícias de documentoscopia	HEGLAYNE PEREIRA VITAL DA SILVA	Exame grafotécnico entre as assinaturas coletadas	f	f	1	\N	FISICO	Prontuário Civil	2025-11-07 00:00:00	\N	\N	2025-11-07 12:15:51.243	2025-11-11 08:53:26.775164	\N	\N	\N	309	FISICO	\N
561	SOLICITADO	nº 2.722.787\tABRAAO DA SILVA MENDES	9. Prontuário Civil nº 2.722.787	039100157.000036/2025-29	ITEP-II-SbAI	COLETADO E DEVOLVIDO POR RAFAELA CICERA	Importação de dados históricos	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-03-07 00:00:00	2025-03-10 00:00:00	\N	2025-11-07 12:06:41.577112	2025-11-07 12:54:39.286944	\N	\N	\N	219	FISICO	\N
572	FINALIZADO	THIAGO ANDRADE DA SILVA (nº 2.104.196 ) / THIAGO ANDRADE DA SILVA LIMA / THIAGO ANDRADE DA SILVA ( nº 2.082.050)	Prontuário Civil nº 2.104.196                                             Prontuário Civil nº 2.082.	039100157.000093/2025-16	ITEP-II-SAI	RAFAELA CICERA DE ALBUQUERQUE DUDA DA ROCHA	Apoio a investigação - II	f	f	1	\N	FISICO	PRONTUÁRIO CIVIL	2025-05-15 00:00:00	2025-05-27 00:00:00	\N	2025-11-07 12:06:41.641582	2025-11-10 09:50:50.158742	\N	\N	\N	230	FISICO	\N
652	DESARQUIVADO	Teste	123456789	123456789	Teste	Teste	Teste Teste	f	f	1	\N	FISICO	Teste	2025-11-07 00:00:00	2025-11-10 00:00:00	2025-11-10 00:00:00	2025-11-07 13:17:45.584	2025-11-10 14:04:07.963035	\N	\N	\N	310	FISICO	\N
\.


--
-- Data for Name: historico_tarefas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historico_tarefas (id, tarefa_id, usuario_id, acao, descricao, "dadosAnteriores", "dadosNovos", created_at) FROM stdin;
\.


--
-- Data for Name: itens_checklist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.itens_checklist (id, checklist_id, texto, concluido, ordem, concluido_por_id, concluido_em, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: membros_projeto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.membros_projeto (id, projeto_id, usuario_id, papel, created_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1700000001000	CreateRolesTable1700000001000
2	1700000002000	CreateUsuariosTable1700000002000
3	1700000003000	CreateAuditoriasTable1700000003000
4	1700000004000	CreateDesarquivamentosTable1700000004000
5	1700000005000	AddPerformanceOptimizations1700000005000
6	1734706800000	FixHistoricoENotificacoes1734706800000
7	1756810640639	UpdateStatusEnum1756810640639
8	1756820000000	AlterTipoDocumentoToVarchar1756820000000
9	1756827500000	AlterDesarquivamentosIdToInteger1756827500000
10	1757339200000	AlterUsuariosIdToInteger1757339200000
11	1757945400000	AddRoleSettings1757945400000
12	1757946400001	AddUserSettings1757946400001
13	1757948200002	AdjustDesarquivamentoLengths1757948200002
14	1757949000000	CreateDesarquivamentoComments1757949000000
15	1758124112456	014CreateProjetosTable1758124112456
16	1758124300000	015CreateTarefasTables1758124300000
17	1758235300000	016CreateNotificacoesTable1758235300000
18	1758891636986	AddNewFieldsToDesarquivamentos1758891636986
19	1758896630308	RemoveNumeroNicLaudoAutoUniqueConstraint1758896630308
20	1759300000000	AddAtivaToColunas1759300000000
21	1759300000001	AddNumeroSolicitacao1759300000001
22	1760534469393	AddDeletedAtToComentarios1760534469393
23	1760534717255	CreateAnexosTable1760534717255
24	1760535445964	CreateChecklistsTable1760535445964
25	1760535508184	CreateItensChecklistTable1760535508184
26	1760545200000	AddEditadoToComentariosManual1760545200000
27	1760546000000	UpdateTimestampTrigger1760546000000
28	1760546200000	CreatePastaArquivos1760546200000
29	1760546400000	CreatePastasTableManual1760546400000
30	1760547000000	CreateDesarquivamentoAnexosTable1760547000000
31	1760950000000	AddDescricaoToDesarquivamentoAnexos1760950000000
32	1760960000000	AddMissingColumnsToNotificacoes1760960000000
33	1760966500000	AddWipLimitToColunas1760966500000
34	1762020000000	CreatePlanilhasControleTable1762020000000
36	1762105000000	AddAvatarUrlToUsuarios1762105000000
37	1730988000000	AddNumeroExtraido1730988000000
38	1730988100000	MakeFieldsNullable1730988100000
39	1762600000000	AddTipoAnexoToDesarquivamentoAnexos1762600000000
40	1763200000000	AddMatriculaToUsuarios1763200000000
41	1763300000000	CreateSystemSettings1763300000000
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificacoes (id, tipo, titulo, descricao, detalhes, lida, prioridade, usuario_id, solicitacao_id, processo_id, created_at, updated_at, deleted_at, tarefa_id, projeto_id, remetente_id, link) FROM stdin;
53	solicitacao_pendente	nº 2.766.548\tJOSE ROBERTO MEDEIROS TENORIO — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	554	2025-11-10 15:00:00.014774	2025-11-10 15:00:00.014774	\N	\N	\N	\N	\N
2	tarefa_atribuida	Nova tarefa atribuída	Administrador atribuiu você à tarefa "teste1"	{"prazo": "2025-11-07", "projeto": "teste", "prioridade": "media"}	f	media	1	\N	\N	2025-10-31 13:32:35.880627	2025-10-31 13:32:50.391117	2025-10-31 13:32:50.391117	2	1	1	/tarefas/2
1	tarefa_atribuida	Nova tarefa atribuída	Administrador atribuiu você à tarefa "teste"	{"prazo": "2025-11-05", "projeto": "teste", "prioridade": "media"}	f	media	1	\N	\N	2025-10-31 13:32:17.093653	2025-10-31 13:32:57.717347	2025-10-31 13:32:57.717347	1	1	1	/tarefas/1
17	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	560	2025-11-07 13:00:00.027493	2025-11-10 14:17:32.649062	2025-11-10 14:17:32.649062	\N	\N	\N	\N
16	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	556	2025-11-07 13:00:00.022923	2025-11-10 14:17:32.802123	2025-11-10 14:17:32.802123	\N	\N	\N	\N
15	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	555	2025-11-07 13:00:00.018848	2025-11-10 14:17:32.947225	2025-11-10 14:17:32.947225	\N	\N	\N	\N
14	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	554	2025-11-07 13:00:00.010114	2025-11-10 14:17:33.107411	2025-11-10 14:17:33.107411	\N	\N	\N	\N
13	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	416	2025-11-07 12:00:00.06675	2025-11-10 14:17:33.259449	2025-11-10 14:17:33.259449	\N	\N	\N	\N
12	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	416	2025-11-07 12:00:00.063204	2025-11-10 14:17:33.410734	2025-11-10 14:17:33.410734	\N	\N	\N	\N
11	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	415	2025-11-07 12:00:00.061871	2025-11-10 14:17:33.56916	2025-11-10 14:17:33.56916	\N	\N	\N	\N
10	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	415	2025-11-07 12:00:00.058174	2025-11-10 14:17:33.721576	2025-11-10 14:17:33.721576	\N	\N	\N	\N
9	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	414	2025-11-07 12:00:00.052545	2025-11-10 14:17:33.883755	2025-11-10 14:17:33.883755	\N	\N	\N	\N
7	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	413	2025-11-07 12:00:00.048011	2025-11-10 14:17:34.03479	2025-11-10 14:17:34.03479	\N	\N	\N	\N
8	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	410	2025-11-07 12:00:00.044417	2025-11-10 14:17:34.185582	2025-11-10 14:17:34.185582	\N	\N	\N	\N
6	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.275\\tANTONIO JORGE SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	412	2025-11-07 12:00:00.04301	2025-11-10 14:17:34.33935	2025-11-10 14:17:34.33935	\N	\N	\N	\N
5	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	411	2025-11-07 12:00:00.039185	2025-11-10 14:17:34.499767	2025-11-10 14:17:34.499767	\N	\N	\N	\N
4	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	410	2025-11-07 12:00:00.034731	2025-11-10 14:17:34.650123	2025-11-10 14:17:34.650123	\N	\N	\N	\N
54	solicitacao_pendente	nº 2.766.549\tJOSE SANTOS LESSA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	555	2025-11-10 15:00:00.025329	2025-11-10 15:00:00.025329	\N	\N	\N	\N	\N
23	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	561	2025-11-07 13:00:00.044179	2025-11-08 10:59:42.112184	2025-11-08 10:59:42.112184	\N	\N	\N	\N
25	solicitacao_pendente	Desarquivamento aguardando há 246 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 246, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	561	2025-11-08 11:00:00.01567	2025-11-08 11:02:04.05594	2025-11-08 11:02:04.05594	\N	\N	\N	\N
21	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	559	2025-11-07 13:00:00.039982	2025-11-08 11:02:05.399578	2025-11-08 11:02:05.399578	\N	\N	\N	\N
26	solicitacao_pendente	Desarquivamento aguardando há 246 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 246, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	559	2025-11-08 12:00:00.024993	2025-11-10 08:21:26.635479	2025-11-10 08:21:26.635479	\N	\N	\N	\N
27	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	559	2025-11-10 09:00:00.024916	2025-11-10 11:59:52.196087	2025-11-10 11:59:52.196087	\N	\N	\N	\N
31	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	556	2025-11-10 13:00:00.030423	2025-11-10 14:17:28.091578	2025-11-10 14:17:28.091578	\N	\N	\N	\N
30	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	555	2025-11-10 13:00:00.025606	2025-11-10 14:17:28.233977	2025-11-10 14:17:28.233977	\N	\N	\N	\N
29	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	554	2025-11-10 13:00:00.013781	2025-11-10 14:17:31.322658	2025-11-10 14:17:31.322658	\N	\N	\N	\N
28	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	559	2025-11-10 12:00:00.030831	2025-11-10 14:17:31.722739	2025-11-10 14:17:31.722739	\N	\N	\N	\N
24	solicitacao_pendente	Desarquivamento aguardando há 246 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 246, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	561	2025-11-08 11:00:00.015009	2025-11-10 14:17:31.891757	2025-11-10 14:17:31.891757	\N	\N	\N	\N
22	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	559	2025-11-07 13:00:00.043875	2025-11-10 14:17:32.059348	2025-11-10 14:17:32.059348	\N	\N	\N	\N
20	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.275\\tANTONIO JORGE SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	557	2025-11-07 13:00:00.035729	2025-11-10 14:17:32.218863	2025-11-10 14:17:32.218863	\N	\N	\N	\N
18	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	558	2025-11-07 13:00:00.03165	2025-11-10 14:17:32.363104	2025-11-10 14:17:32.363104	\N	\N	\N	\N
19	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	556	2025-11-07 13:00:00.030924	2025-11-10 14:17:32.498133	2025-11-10 14:17:32.498133	\N	\N	\N	\N
3	solicitacao_pendente	Desarquivamento aguardando há 245 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 245, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	t	alta	1	\N	409	2025-11-07 12:00:00.02497	2025-11-10 14:17:35.376785	2025-11-10 14:17:35.376785	\N	\N	\N	\N
55	solicitacao_pendente	nº 2.766.908\tHENRIQUE FEITOSA VASCONCELOS — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	556	2025-11-10 15:00:00.031864	2025-11-10 15:00:00.031864	\N	\N	\N	\N	\N
37	solicitacao_pendente	nº 2.766.548\tJOSE ROBERTO MEDEIROS TENORIO — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	554	2025-11-10 14:00:00.015931	2025-11-10 14:00:00.015931	\N	\N	\N	\N	\N
38	solicitacao_pendente	nº 2.766.548\tJOSE ROBERTO MEDEIROS TENORIO — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.548\\tJOSE ROBERTO MEDEIROS TENORIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	554	2025-11-10 14:00:00.024638	2025-11-10 14:00:00.024638	\N	\N	\N	\N	\N
39	solicitacao_pendente	nº 2.766.549\tJOSE SANTOS LESSA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	555	2025-11-10 14:00:00.02988	2025-11-10 14:00:00.02988	\N	\N	\N	\N	\N
40	solicitacao_pendente	nº 2.766.549\tJOSE SANTOS LESSA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.549\\tJOSE SANTOS LESSA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	555	2025-11-10 14:00:00.03404	2025-11-10 14:00:00.03404	\N	\N	\N	\N	\N
41	solicitacao_pendente	nº 2.766.908\tHENRIQUE FEITOSA VASCONCELOS — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	556	2025-11-10 14:00:00.039801	2025-11-10 14:00:00.039801	\N	\N	\N	\N	\N
42	solicitacao_pendente	nº 2.766.908\tHENRIQUE FEITOSA VASCONCELOS — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.908\\tHENRIQUE FEITOSA VASCONCELOS", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	556	2025-11-10 14:00:00.043691	2025-11-10 14:00:00.043691	\N	\N	\N	\N	\N
43	solicitacao_pendente	nº 2.821.267\tIVALDO OLIVEIRA VALERIO — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	560	2025-11-10 14:00:00.048446	2025-11-10 14:00:00.048446	\N	\N	\N	\N	\N
44	solicitacao_pendente	nº 2.821.267\tIVALDO OLIVEIRA VALERIO — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	560	2025-11-10 14:00:00.052536	2025-11-10 14:00:00.052536	\N	\N	\N	\N	\N
45	solicitacao_pendente	nº 2.766.907\tJOSE JUNIOR CARLOS DE OLIVEIRA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	558	2025-11-10 14:00:00.057168	2025-11-10 14:00:00.057168	\N	\N	\N	\N	\N
46	solicitacao_pendente	nº 2.766.907\tJOSE JUNIOR CARLOS DE OLIVEIRA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	558	2025-11-10 14:00:00.061384	2025-11-10 14:00:00.061384	\N	\N	\N	\N	\N
47	solicitacao_pendente	nº 2.821.275\tANTONIO JORGE SILVA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.275\\tANTONIO JORGE SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	557	2025-11-10 14:00:00.065608	2025-11-10 14:00:00.065608	\N	\N	\N	\N	\N
36	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	561	2025-11-10 13:00:00.052782	2025-11-10 14:17:26.767402	2025-11-10 14:17:26.767402	\N	\N	\N	\N
34	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.275\\tANTONIO JORGE SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	557	2025-11-10 13:00:00.045215	2025-11-10 14:17:27.476233	2025-11-10 14:17:27.476233	\N	\N	\N	\N
33	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	558	2025-11-10 13:00:00.040082	2025-11-10 14:17:27.628011	2025-11-10 14:17:27.628011	\N	\N	\N	\N
48	solicitacao_pendente	nº 2.821.275\tANTONIO JORGE SILVA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.275\\tANTONIO JORGE SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	557	2025-11-10 14:00:00.070146	2025-11-10 14:00:00.070146	\N	\N	\N	\N	\N
49	solicitacao_pendente	nº 2.821.274 JARDIEL SILVA E SILVA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	559	2025-11-10 14:00:00.07702	2025-11-10 14:00:00.07702	\N	\N	\N	\N	\N
50	solicitacao_pendente	nº 2.821.274 JARDIEL SILVA E SILVA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	559	2025-11-10 14:00:00.080921	2025-11-10 14:00:00.080921	\N	\N	\N	\N	\N
51	solicitacao_pendente	nº 2.722.787\tABRAAO DA SILVA MENDES — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	3	\N	561	2025-11-10 14:00:00.085741	2025-11-10 14:00:00.085741	\N	\N	\N	\N	\N
52	solicitacao_pendente	nº 2.722.787\tABRAAO DA SILVA MENDES — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	4	\N	561	2025-11-10 14:00:00.089653	2025-11-10 14:00:00.089653	\N	\N	\N	\N	\N
35	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	559	2025-11-10 13:00:00.049044	2025-11-10 14:17:27.229219	2025-11-10 14:17:27.229219	\N	\N	\N	\N
32	solicitacao_pendente	Desarquivamento aguardando há 248 dias	Um desarquivamento permanece com status SOLICITADO há mais de 5 dias.	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	560	2025-11-10 13:00:00.035105	2025-11-10 14:17:27.946519	2025-11-10 14:17:27.946519	\N	\N	\N	\N
56	solicitacao_pendente	nº 2.821.267\tIVALDO OLIVEIRA VALERIO — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.267\\tIVALDO OLIVEIRA VALERIO", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	560	2025-11-10 15:00:00.036821	2025-11-10 15:00:00.036821	\N	\N	\N	\N	\N
57	solicitacao_pendente	nº 2.766.907\tJOSE JUNIOR CARLOS DE OLIVEIRA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.766.907\\tJOSE JUNIOR CARLOS DE OLIVEIRA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	558	2025-11-10 15:00:00.042298	2025-11-10 15:00:00.042298	\N	\N	\N	\N	\N
58	solicitacao_pendente	nº 2.821.275\tANTONIO JORGE SILVA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.275\\tANTONIO JORGE SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	557	2025-11-10 15:00:00.047492	2025-11-10 15:00:00.047492	\N	\N	\N	\N	\N
59	solicitacao_pendente	nº 2.821.274 JARDIEL SILVA E SILVA — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.821.274 JARDIEL SILVA E SILVA", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	559	2025-11-10 15:00:00.052499	2025-11-10 15:00:00.052499	\N	\N	\N	\N	\N
60	solicitacao_pendente	nº 2.722.787\tABRAAO DA SILVA MENDES — aguardando há 248 dias	Processo 039100157.000036/2025-29 • PRONTUÁRIO CIVIL • Solicitado em 07/03/2025	{"nome_completo": "nº 2.722.787\\tABRAAO DA SILVA MENDES", "acao_requerida": "Verificar andamento do desarquivamento", "dias_pendentes": 248, "tipo_documento": "PRONTUÁRIO CIVIL", "numero_processo": "039100157.000036/2025-29", "data_solicitacao": "2025-03-07T03:00:00.000Z"}	f	alta	1	\N	561	2025-11-10 15:00:00.057121	2025-11-10 15:00:00.057121	\N	\N	\N	\N	\N
\.


--
-- Data for Name: pasta_arquivos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pasta_arquivos (id, pasta_id, tipo, nome_original, caminho, tamanho_bytes, data_upload) FROM stdin;
\.


--
-- Data for Name: pastas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pastas (id, nome, descricao, imagens, planilhas, data_criacao, tags) FROM stdin;
\.


--
-- Data for Name: planilhas_controle; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.planilhas_controle (id, nome_original, caminho, tamanho_bytes, data_upload) FROM stdin;
\.


--
-- Data for Name: projetos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projetos (id, nome, descricao, criador_id, created_at, updated_at) FROM stdin;
1	teste	teste	1	2025-10-31 13:31:40.551295	2025-10-31 13:31:40.551295
\.


--
-- Data for Name: registros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.registros (id, numero_processo, delegacia_origem, nome_vitima, data_fato, investigador_responsavel, idade_vitima, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, description, permissions, ativo, created_at, updated_at, settings, name) FROM stdin;
1	Administrador do sistema	{"all": true}	t	2025-10-31 11:31:55.495251	2025-10-31 11:31:55.495251	{}	admin
2	Coordenador	{"read": true, "create": true, "update": true}	t	2025-10-31 11:31:55.495251	2025-10-31 11:31:55.495251	{}	coordenador
3	Usuário padrão	{"read": true}	t	2025-10-31 11:31:55.495251	2025-10-31 11:31:55.495251	{}	usuario
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, auto_backup, backup_frequency, log_level, maintenance_mode, cache_enabled, created_at, updated_at) FROM stdin;
1	t	daily	info	f	t	2025-11-11 10:19:16.262179	2025-11-11 10:19:16.262179
2	t	daily	info	f	t	2025-11-11 10:19:18.946328	2025-11-11 10:19:18.946328
\.


--
-- Data for Name: tarefas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tarefas (id, projeto_id, coluna_id, titulo, descricao, criador_id, responsavel_id, prazo, prioridade, ordem, tags, created_at, updated_at, deleted_at, data_criacao, data_atualizacao) FROM stdin;
1	1	1	teste	teste	1	1	2025-11-05	media	1	[]	2025-10-31 13:32:17.084276	2025-10-31 13:32:17.084276	\N	2025-10-31 13:32:17.084276	2025-10-31 13:32:17.084276
2	1	2	teste1	teste1	1	1	2025-11-07	media	1	[]	2025-10-31 13:32:35.866212	2025-10-31 13:32:35.866212	\N	2025-10-31 13:32:35.866212	2025-10-31 13:32:35.866212
\.


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_preferences (id, user_id, preference_key, preference_value, created_at, updated_at) FROM stdin;
1	1	dashboard-layout	{"cards": [{"id": "stats", "size": "large", "type": "stats", "title": "Estatísticas", "visible": true, "position": 0, "gridColumn": "col-span-1"}, {"id": "quick-actions", "size": "large", "type": "quick-actions", "title": "Ações Rápidas", "visible": true, "position": 1, "gridColumn": "col-span-1"}, {"id": "calendar", "size": "large", "type": "calendar", "title": "Calendário de Prazos", "visible": true, "position": 2, "gridColumn": "col-span-1"}, {"id": "tasks", "size": "large", "type": "tasks", "title": "Minhas Tarefas", "visible": true, "position": 3, "gridColumn": "col-span-1"}, {"id": "activity", "size": "large", "type": "activity", "title": "Atividade Recente", "visible": true, "position": 4, "gridColumn": "col-span-1"}, {"id": "online-users", "size": "large", "type": "online-users", "title": "Usuários Online", "visible": true, "position": 5, "gridColumn": "col-span-1"}], "userId": 1, "updatedAt": "2025-11-07T16:49:40.485Z"}	2025-11-06 13:19:26.877334	2025-11-11 07:50:06.393649
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nome, senha, role_id, ativo, tentativas_login, token_reset, settings, usuario, ultimo_login, bloqueado_ate, token_reset_expira, created_at, updated_at, deleted_at, avatar_url, matricula) FROM stdin;
3	Bianca Mayara	$2a$10$mQYtMDmlfhqUfWrNcrspGOvaDHodcWuesyEGmOvIQbnDvZOVgra6u	1	t	0	\N	{}	bianca	2025-11-10 12:43:24.781	\N	\N	2025-11-07 13:14:53.584	2025-11-10 12:43:24.783225	\N	/uploads/avatars/user-3-1762784494813.jpeg	250140-6
4	Gesiele Farias	$2a$10$kYOdIrDfIAzIcxpwA.eXXuR3aLwm2YRnbdmVUc9JbIAhqewEdE8Qq	1	t	0	\N	{}	gesiele	2025-11-10 14:07:15.944	\N	\N	2025-11-07 13:48:05.862	2025-11-10 14:07:15.945493	\N	\N	\N
2	Teste	$2a$10$Y41YZ7bY63fYuYWquEXgfesUl8ZYO3aQuhy5y1uc06mD4z90ccVUy	3	t	0	\N	{}	teste	2025-11-10 19:18:06.455	\N	\N	2025-10-31 13:29:02.14	2025-11-10 19:18:06.457871	\N	\N	\N
1	Administrador	$2a$12$ix6P6.1Gohh9dm73jusbXuiBkTPiiiZM4DHHXwLB8L4QIXc3lOt6e	1	t	0	\N	{"theme": "light", "autoSave": true, "showEmail": true, "showPhone": false, "compactView": false, "itemsPerPage": 5}	admin	2025-11-11 10:39:35.783	\N	\N	2025-10-31 11:33:06.847485	2025-11-11 10:39:35.784784	\N	\N	\N
\.


--
-- Name: anexos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.anexos_id_seq', 1, false);


--
-- Name: auditorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auditorias_id_seq', 411, true);


--
-- Name: checklists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.checklists_id_seq', 1, false);


--
-- Name: colunas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.colunas_id_seq', 4, true);


--
-- Name: comentarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comentarios_id_seq', 1, false);


--
-- Name: desarquivamento_anexos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamento_anexos_id_seq', 13, true);


--
-- Name: desarquivamento_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamento_comments_id_seq', 5, true);


--
-- Name: desarquivamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamentos_id_seq', 653, true);


--
-- Name: desarquivamentos_numero_solicitacao_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamentos_numero_solicitacao_seq', 311, true);


--
-- Name: historico_tarefas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historico_tarefas_id_seq', 1, false);


--
-- Name: itens_checklist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.itens_checklist_id_seq', 1, false);


--
-- Name: membros_projeto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.membros_projeto_id_seq', 1, false);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 41, true);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 60, true);


--
-- Name: projetos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projetos_id_seq', 1, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 2, true);


--
-- Name: tarefas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tarefas_id_seq', 2, true);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 1, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 4, true);


--
-- Name: colunas PK_21100b0dba579f40b31338561ce; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colunas
    ADD CONSTRAINT "PK_21100b0dba579f40b31338561ce" PRIMARY KEY (id);


--
-- Name: itens_checklist PK_247b3e0f6ebc51c54c884df0787; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT "PK_247b3e0f6ebc51c54c884df0787" PRIMARY KEY (id);


--
-- Name: tarefas PK_2f57a4443470e61ac5de297e30a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT "PK_2f57a4443470e61ac5de297e30a" PRIMARY KEY (id);


--
-- Name: checklists PK_336ade2047f3d713e1afa20d2c6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT "PK_336ade2047f3d713e1afa20d2c6" PRIMARY KEY (id);


--
-- Name: registros PK_34c305689a504166a73ccaec0b0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros
    ADD CONSTRAINT "PK_34c305689a504166a73ccaec0b0" PRIMARY KEY (id);


--
-- Name: pastas PK_43a993b522e01a6a2f0da32041e; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pastas
    ADD CONSTRAINT "PK_43a993b522e01a6a2f0da32041e" PRIMARY KEY (id);


--
-- Name: desarquivamento_anexos PK_55c2a164047643dab05e3b626c5; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_anexos
    ADD CONSTRAINT "PK_55c2a164047643dab05e3b626c5" PRIMARY KEY (id);


--
-- Name: desarquivamentos PK_658c051385ef0d1a2e1886731dd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamentos
    ADD CONSTRAINT "PK_658c051385ef0d1a2e1886731dd" PRIMARY KEY (id);


--
-- Name: membros_projeto PK_880851f4e6c101277a40a808729; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membros_projeto
    ADD CONSTRAINT "PK_880851f4e6c101277a40a808729" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: comentarios PK_b60b1468bb275db8d5e875c4a78; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT "PK_b60b1468bb275db8d5e875c4a78" PRIMARY KEY (id);


--
-- Name: auditorias PK_b84b3505f313ab1a44e7b684ee2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT "PK_b84b3505f313ab1a44e7b684ee2" PRIMARY KEY (id);


--
-- Name: historico_tarefas PK_c1607a878f2c8e4b8ea1d62e64c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_tarefas
    ADD CONSTRAINT "PK_c1607a878f2c8e4b8ea1d62e64c" PRIMARY KEY (id);


--
-- Name: usuarios PK_d7281c63c176e152e4c531594a8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY (id);


--
-- Name: anexos PK_da398d73b0fa1e7549520adc9f3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT "PK_da398d73b0fa1e7549520adc9f3" PRIMARY KEY (id);


--
-- Name: projetos PK_fb6b6aed4b30e10b976fe8bdf5b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT "PK_fb6b6aed4b30e10b976fe8bdf5b" PRIMARY KEY (id);


--
-- Name: planilhas_controle PK_planilhas_controle_id; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planilhas_controle
    ADD CONSTRAINT "PK_planilhas_controle_id" PRIMARY KEY (id);


--
-- Name: usuarios UQ_0790a401b9d234fa921e9aa1777; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT "UQ_0790a401b9d234fa921e9aa1777" UNIQUE (usuario);


--
-- Name: roles UQ_648e3f5447f725579d7d4ffdfb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE (name);


--
-- Name: membros_projeto UQ_cbb8a02588c227904da9b1adb2a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membros_projeto
    ADD CONSTRAINT "UQ_cbb8a02588c227904da9b1adb2a" UNIQUE (projeto_id, usuario_id);


--
-- Name: desarquivamento_comments desarquivamento_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_comments
    ADD CONSTRAINT desarquivamento_comments_pkey PRIMARY KEY (id);


--
-- Name: desarquivamentos desarquivamentos_numero_solicitacao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamentos
    ADD CONSTRAINT desarquivamentos_numero_solicitacao_key UNIQUE (numero_solicitacao);


--
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- Name: pasta_arquivos pasta_arquivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pasta_arquivos
    ADD CONSTRAINT pasta_arquivos_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_preferences unique_user_preference; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT unique_user_preference UNIQUE (user_id, preference_key);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: IDX_22f094b11205fc0a5fd1806db8; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_22f094b11205fc0a5fd1806db8" ON public.desarquivamentos USING btree (created_by);


--
-- Name: IDX_70c402d367e5bd15d2cdbcf36c; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_70c402d367e5bd15d2cdbcf36c" ON public.desarquivamentos USING btree (data_solicitacao);


--
-- Name: IDX_73e021d4d498eda6f6a8ea6750; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_73e021d4d498eda6f6a8ea6750" ON public.desarquivamentos USING btree (status);


--
-- Name: IDX_900d44fa1a3c1812c0d439a90e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_900d44fa1a3c1812c0d439a90e" ON public.desarquivamentos USING btree (numero_processo);


--
-- Name: IDX_94b0719f893403890a79cfb30b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_94b0719f893403890a79cfb30b" ON public.desarquivamentos USING btree (desarquivamento_fisico_digital);


--
-- Name: IDX_DESARQ_COMMENTS_DESARQ; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_DESARQ_COMMENTS_DESARQ" ON public.desarquivamento_comments USING btree (desarquivamento_id);


--
-- Name: IDX_DESARQ_COMMENTS_USER; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_DESARQ_COMMENTS_USER" ON public.desarquivamento_comments USING btree (user_id);


--
-- Name: IDX_comentarios_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_comentarios_deleted_at" ON public.comentarios USING btree (deleted_at);


--
-- Name: IDX_desarquivamento_anexos_desarquivamento_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_desarquivamento_anexos_desarquivamento_id" ON public.desarquivamento_anexos USING btree (desarquivamento_id);


--
-- Name: IDX_desarquivamento_anexos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_desarquivamento_anexos_usuario_id" ON public.desarquivamento_anexos USING btree (usuario_id);


--
-- Name: IDX_numero_extraido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_numero_extraido" ON public.desarquivamentos USING btree (numero_extraido);


--
-- Name: IDX_numero_nic_laudo_auto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_numero_nic_laudo_auto" ON public.desarquivamentos USING btree (numero_nic_laudo_auto);


--
-- Name: IDX_pasta_arquivos_pasta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pasta_arquivos_pasta" ON public.pasta_arquivos USING btree (pasta_id);


--
-- Name: IDX_pasta_arquivos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pasta_arquivos_tipo" ON public.pasta_arquivos USING btree (tipo);


--
-- Name: idx_desarquivamento_anexos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desarquivamento_anexos_tipo ON public.desarquivamento_anexos USING btree (tipo_anexo);


--
-- Name: idx_desarquivamentos_numero_solicitacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_desarquivamentos_numero_solicitacao ON public.desarquivamentos USING btree (numero_solicitacao);


--
-- Name: idx_notificacoes_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_created_at ON public.notificacoes USING btree (created_at);


--
-- Name: idx_notificacoes_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_deleted_at ON public.notificacoes USING btree (deleted_at);


--
-- Name: idx_notificacoes_lida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_lida ON public.notificacoes USING btree (lida);


--
-- Name: idx_notificacoes_prioridade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_prioridade ON public.notificacoes USING btree (prioridade);


--
-- Name: idx_notificacoes_projeto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_projeto ON public.notificacoes USING btree (projeto_id);


--
-- Name: idx_notificacoes_remetente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_remetente ON public.notificacoes USING btree (remetente_id);


--
-- Name: idx_notificacoes_tarefa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tarefa ON public.notificacoes USING btree (tarefa_id);


--
-- Name: idx_notificacoes_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tipo ON public.notificacoes USING btree (tipo);


--
-- Name: idx_notificacoes_tipo_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_tipo_created ON public.notificacoes USING btree (tipo, created_at);


--
-- Name: idx_notificacoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_usuario ON public.notificacoes USING btree (usuario_id);


--
-- Name: idx_notificacoes_usuario_lida; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notificacoes_usuario_lida ON public.notificacoes USING btree (usuario_id, lida);


--
-- Name: idx_user_preferences_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_key ON public.user_preferences USING btree (preference_key);


--
-- Name: idx_user_preferences_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);


--
-- Name: idx_user_preferences_user_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_user_key ON public.user_preferences USING btree (user_id, preference_key);


--
-- Name: desarquivamentos desarquivamentos_sync_tipo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER desarquivamentos_sync_tipo BEFORE INSERT OR UPDATE ON public.desarquivamentos FOR EACH ROW EXECUTE FUNCTION public.sync_desarquivamento_tipo();


--
-- Name: tarefas tarefas_sync_timestamps; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tarefas_sync_timestamps BEFORE INSERT OR UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.sync_tarefas_timestamps();


--
-- Name: user_preferences trigger_update_user_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_user_preferences_updated_at();


--
-- Name: colunas update_colunas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_colunas_updated_at BEFORE UPDATE ON public.colunas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: comentarios update_comentarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_comentarios_updated_at BEFORE UPDATE ON public.comentarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: desarquivamentos update_desarquivamentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_desarquivamentos_updated_at BEFORE UPDATE ON public.desarquivamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notificacoes update_notificacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notificacoes_updated_at BEFORE UPDATE ON public.notificacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projetos update_projetos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles update_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tarefas update_tarefas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON public.tarefas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: usuarios update_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: checklists FK_0c4c36caf8f0abd154e593cf22d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.checklists
    ADD CONSTRAINT "FK_0c4c36caf8f0abd154e593cf22d" FOREIGN KEY (tarefa_id) REFERENCES public.tarefas(id) ON DELETE CASCADE;


--
-- Name: anexos FK_1ed88f32d5c33ad81740fc35490; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT "FK_1ed88f32d5c33ad81740fc35490" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: auditorias FK_21b7d36a2eed9a8d26ebb80f51e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditorias
    ADD CONSTRAINT "FK_21b7d36a2eed9a8d26ebb80f51e" FOREIGN KEY (user_id) REFERENCES public.usuarios(id);


--
-- Name: desarquivamentos FK_22f094b11205fc0a5fd1806db89; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamentos
    ADD CONSTRAINT "FK_22f094b11205fc0a5fd1806db89" FOREIGN KEY (created_by) REFERENCES public.usuarios(id);


--
-- Name: historico_tarefas FK_4e178ffeb5373a9176e5a50cc95; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_tarefas
    ADD CONSTRAINT "FK_4e178ffeb5373a9176e5a50cc95" FOREIGN KEY (tarefa_id) REFERENCES public.tarefas(id) ON DELETE CASCADE;


--
-- Name: desarquivamentos FK_5953b78a5f8eac818837a842008; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamentos
    ADD CONSTRAINT "FK_5953b78a5f8eac818837a842008" FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id);


--
-- Name: itens_checklist FK_658ca7dba1fd484b1f70607e71d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT "FK_658ca7dba1fd484b1f70607e71d" FOREIGN KEY (concluido_por_id) REFERENCES public.usuarios(id);


--
-- Name: historico_tarefas FK_7128414e74109ef8339d65aa88d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_tarefas
    ADD CONSTRAINT "FK_7128414e74109ef8339d65aa88d" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: tarefas FK_7b5f8bbda19b2ef0cb37d013a3d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT "FK_7b5f8bbda19b2ef0cb37d013a3d" FOREIGN KEY (criador_id) REFERENCES public.usuarios(id);


--
-- Name: desarquivamento_anexos FK_7e390e384cb304a8f234a1d6dde; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_anexos
    ADD CONSTRAINT "FK_7e390e384cb304a8f234a1d6dde" FOREIGN KEY (desarquivamento_id) REFERENCES public.desarquivamentos(id) ON DELETE CASCADE;


--
-- Name: anexos FK_7f2ca515a3bbfa46eac7ead198a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anexos
    ADD CONSTRAINT "FK_7f2ca515a3bbfa46eac7ead198a" FOREIGN KEY (tarefa_id) REFERENCES public.tarefas(id) ON DELETE CASCADE;


--
-- Name: tarefas FK_9234be58f5b6d6d9ad55ceb036b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT "FK_9234be58f5b6d6d9ad55ceb036b" FOREIGN KEY (coluna_id) REFERENCES public.colunas(id);


--
-- Name: usuarios FK_933f1f766daaa16d3848d186a59; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT "FK_933f1f766daaa16d3848d186a59" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: membros_projeto FK_9655da2f96b65913b0666cd81d7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membros_projeto
    ADD CONSTRAINT "FK_9655da2f96b65913b0666cd81d7" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: projetos FK_9dd48438e8e95939b63880efae2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projetos
    ADD CONSTRAINT "FK_9dd48438e8e95939b63880efae2" FOREIGN KEY (criador_id) REFERENCES public.usuarios(id);


--
-- Name: tarefas FK_a1dea9cc06ee0b625201bc6c71a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT "FK_a1dea9cc06ee0b625201bc6c71a" FOREIGN KEY (responsavel_id) REFERENCES public.usuarios(id);


--
-- Name: desarquivamento_anexos FK_a938c127be8edbfb412ca0b0cf1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_anexos
    ADD CONSTRAINT "FK_a938c127be8edbfb412ca0b0cf1" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: itens_checklist FK_b49a1c5f0d6b6816fb7f53dba14; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_checklist
    ADD CONSTRAINT "FK_b49a1c5f0d6b6816fb7f53dba14" FOREIGN KEY (checklist_id) REFERENCES public.checklists(id) ON DELETE CASCADE;


--
-- Name: comentarios FK_c30e8d64c125cf3a1ece50126a2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT "FK_c30e8d64c125cf3a1ece50126a2" FOREIGN KEY (autor_id) REFERENCES public.usuarios(id);


--
-- Name: comentarios FK_d4ccf77b40c5697b7f136170f47; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comentarios
    ADD CONSTRAINT "FK_d4ccf77b40c5697b7f136170f47" FOREIGN KEY (tarefa_id) REFERENCES public.tarefas(id) ON DELETE CASCADE;


--
-- Name: colunas FK_dc1c91ba3046abf8aa44be533bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colunas
    ADD CONSTRAINT "FK_dc1c91ba3046abf8aa44be533bd" FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: membros_projeto FK_e6965151e12e96cb0318a506c31; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membros_projeto
    ADD CONSTRAINT "FK_e6965151e12e96cb0318a506c31" FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: tarefas FK_fa270c973649c58c1d561145050; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tarefas
    ADD CONSTRAINT "FK_fa270c973649c58c1d561145050" FOREIGN KEY (projeto_id) REFERENCES public.projetos(id) ON DELETE CASCADE;


--
-- Name: pasta_arquivos FK_pasta_arquivos_pasta; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pasta_arquivos
    ADD CONSTRAINT "FK_pasta_arquivos_pasta" FOREIGN KEY (pasta_id) REFERENCES public.pastas(id) ON DELETE CASCADE;


--
-- Name: desarquivamento_comments fk_desarq_comment_desarq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_comments
    ADD CONSTRAINT fk_desarq_comment_desarq FOREIGN KEY (desarquivamento_id) REFERENCES public.desarquivamentos(id) ON DELETE CASCADE;


--
-- Name: desarquivamento_comments fk_desarq_comment_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.desarquivamento_comments
    ADD CONSTRAINT fk_desarq_comment_user FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: notificacoes fk_notificacoes_remetente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT fk_notificacoes_remetente FOREIGN KEY (remetente_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;


--
-- Name: notificacoes fk_notificacoes_tarefa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT fk_notificacoes_tarefa FOREIGN KEY (tarefa_id) REFERENCES public.tarefas(id) ON DELETE CASCADE;


--
-- Name: user_preferences fk_user_preferences_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- Name: notificacoes notificacoes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EaZlD1jeOXsfcR9AduPSKh8DJRFZoCQVVWkQ3bCsVbWtsNkKhPnr6YYtCh7P8Ih

