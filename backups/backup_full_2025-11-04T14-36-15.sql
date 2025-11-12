--
-- PostgreSQL database dump
--

\restrict 8tBI5RRgO7DE3wziU9izCgcMA2pxpJ8OB9lb7ifvNu1t5qTCM7fd9ipgvHy6Bsl

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
DROP INDEX IF EXISTS public."IDX_pasta_arquivos_tipo";
DROP INDEX IF EXISTS public."IDX_pasta_arquivos_pasta";
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
DROP INDEX IF EXISTS public."IDX_1f854addb916eae485509b5f97";
ALTER TABLE IF EXISTS ONLY public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.user_preferences DROP CONSTRAINT IF EXISTS unique_user_preference;
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
    descricao text
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
    numero_nic_laudo_auto character varying(100) NOT NULL,
    numero_processo character varying(255) NOT NULL,
    setor_demandante character varying(255) NOT NULL,
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
    tipo_desarquivamento character varying(50) DEFAULT 'FISICO'::character varying
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
    avatar_url character varying(500)
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

COPY public.desarquivamento_anexos (id, desarquivamento_id, usuario_id, nome_original, nome_arquivo, caminho_arquivo, tipo_mime, tamanho_bytes, created_at, descricao) FROM stdin;
\.


--
-- Data for Name: desarquivamento_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.desarquivamento_comments (id, desarquivamento_id, user_id, author_name, comment, created_at) FROM stdin;
\.


--
-- Data for Name: desarquivamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.desarquivamentos (id, status, nome_completo, numero_nic_laudo_auto, numero_processo, setor_demandante, servidor_responsavel, finalidade_desarquivamento, solicitacao_prorrogacao, urgente, created_by, responsavel_id, desarquivamento_fisico_digital, tipo_documento, data_solicitacao, data_desarquivamento_sag, data_devolucao_setor, created_at, updated_at, deleted_at, solicitacao_prorrogacao_texto, dados_adicionais, numero_solicitacao, tipo_desarquivamento) FROM stdin;
157	DESARQUIVADO	Kevin	123456	78945613	Nugecid	2502127	testesadeatasd	t	t	1	\N	FISICO	Laudo	2025-11-04 00:00:00	\N	\N	2025-11-04 10:59:15.318	2025-11-04 10:59:36.279023	\N	\N	\N	15	FISICO
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
\.


--
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificacoes (id, tipo, titulo, descricao, detalhes, lida, prioridade, usuario_id, solicitacao_id, processo_id, created_at, updated_at, deleted_at, tarefa_id, projeto_id, remetente_id, link) FROM stdin;
2	tarefa_atribuida	Nova tarefa atribuída	Administrador atribuiu você à tarefa "teste1"	{"prazo": "2025-11-07", "projeto": "teste", "prioridade": "media"}	f	media	1	\N	\N	2025-10-31 13:32:35.880627	2025-10-31 13:32:50.391117	2025-10-31 13:32:50.391117	2	1	1	/tarefas/2
1	tarefa_atribuida	Nova tarefa atribuída	Administrador atribuiu você à tarefa "teste"	{"prazo": "2025-11-05", "projeto": "teste", "prioridade": "media"}	f	media	1	\N	\N	2025-10-31 13:32:17.093653	2025-10-31 13:32:57.717347	2025-10-31 13:32:57.717347	1	1	1	/tarefas/1
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
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nome, senha, role_id, ativo, tentativas_login, token_reset, settings, usuario, ultimo_login, bloqueado_ate, token_reset_expira, created_at, updated_at, deleted_at, avatar_url) FROM stdin;
2	Teste	$2a$10$Y41YZ7bY63fYuYWquEXgfesUl8ZYO3aQuhy5y1uc06mD4z90ccVUy	3	t	0	\N	{}	teste	2025-11-04 08:39:37.992	\N	\N	2025-10-31 13:29:02.14	2025-11-04 08:39:37.99731	\N	\N
1	Administrador	$2a$12$zDwqBH2OtXHVngf7e2fIieCZk8gSA6Tvefbo7cjntJrl5hAHunM6C	1	t	0	\N	{}	admin	2025-11-04 10:58:44.886	\N	\N	2025-10-31 11:33:06.847485	2025-11-04 10:58:44.892238	\N	\N
\.


--
-- Name: anexos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.anexos_id_seq', 1, false);


--
-- Name: auditorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auditorias_id_seq', 11, true);


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

SELECT pg_catalog.setval('public.desarquivamento_anexos_id_seq', 1, true);


--
-- Name: desarquivamento_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamento_comments_id_seq', 1, true);


--
-- Name: desarquivamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamentos_id_seq', 157, true);


--
-- Name: desarquivamentos_numero_solicitacao_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.desarquivamentos_numero_solicitacao_seq', 15, true);


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

SELECT pg_catalog.setval('public.migrations_id_seq', 34, true);


--
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 2, true);


--
-- Name: projetos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projetos_id_seq', 1, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: tarefas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tarefas_id_seq', 2, true);


--
-- Name: user_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_preferences_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 2, true);


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
-- Name: IDX_1f854addb916eae485509b5f97; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IDX_1f854addb916eae485509b5f97" ON public.desarquivamentos USING btree (numero_nic_laudo_auto);


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
-- Name: IDX_pasta_arquivos_pasta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pasta_arquivos_pasta" ON public.pasta_arquivos USING btree (pasta_id);


--
-- Name: IDX_pasta_arquivos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_pasta_arquivos_tipo" ON public.pasta_arquivos USING btree (tipo);


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

\unrestrict 8tBI5RRgO7DE3wziU9izCgcMA2pxpJ8OB9lb7ifvNu1t5qTCM7fd9ipgvHy6Bsl

