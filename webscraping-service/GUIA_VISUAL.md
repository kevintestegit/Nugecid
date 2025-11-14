# 👁️ Guia de Visualização e Configuração do Webscraping

## 🎯 Sim! Você pode ver o navegador abrindo e executando!

Criei 3 scripts Python para você **VER** o navegador Chrome abrindo e fazer a configuração manualmente.

## 📁 Scripts Criados

### 1️⃣ **debug_visual.py** - Mais Simples
**Use este primeiro!**

```bash
cd webscraping-service
python debug_visual.py
```

**O que faz:**
- ✅ Abre Chrome VISÍVEL (você vê tudo!)
- ✅ Navega para o SEIRN
- ✅ Deixa você explorar manualmente
- ✅ Salva screenshot e HTML para análise

**Perfeito para:**
- Ver se tudo está funcionando
- Explorar o site do SEIRN
- Identificar onde estão os campos

---

### 2️⃣ **test_login_visual.py** - Login Interativo
**Use para configurar o login!**

```bash
cd webscraping-service
python test_login_visual.py
```

**Modo 1 - LOGIN MANUAL:**
- Abre navegador
- Você faz login manualmente
- Enquanto faz, inspeciona (F12) os campos
- Anota os seletores

**Modo 2 - LOGIN AUTOMÁTICO:**
- Após configurar seletores no arquivo
- Testa login automático
- Você vê acontecendo!

**Como configurar credenciais:**
1. Edite `test_login_visual.py`
2. Encontre essas linhas:
```python
USERNAME = "seu_usuario"  # PREENCHER
PASSWORD = "sua_senha"    # PREENCHER
```
3. Substitua pelos seus dados

**Como configurar seletores:**
1. Execute modo MANUAL primeiro
2. Anote IDs/NAMEs dos campos
3. Atualize o dicionário SELETORES:
```python
SELETORES = {
    'username_field': ('ID', 'txtUsuario'),  # Exemplo
    'password_field': ('ID', 'txtSenha'),    # Exemplo
    'login_button': ('ID', 'btnEntrar'),     # Exemplo
}
```

---

### 3️⃣ **configurador_interativo.py** - Configuração Completa
**Use para fazer setup completo!**

```bash
cd webscraping-service
python configurador_interativo.py
```

**O que faz (passo a passo):**
1. Abre navegador Chrome VISÍVEL
2. Navega para SEIRN
3. Deixa você fazer login manualmente
4. Guia você para buscar um processo
5. Ajuda a identificar todos os seletores
6. **GERA arquivo com configuração customizada!**

**Resultado:**
- `seirn_config_customizado.py` - Código pronto para usar!
- `seirn_resultado.html` - HTML para análise
- `seirn_screenshot.png` - Screenshot da página

---

## 🚀 Passo a Passo Recomendado

### Passo 1: Instalar dependências (se ainda não fez)

```bash
cd webscraping-service
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

### Passo 2: Teste simples (ver navegador)

```bash
python debug_visual.py
```

🔍 **Você vai ver:** Navegador Chrome abrindo com a página do SEIRN

### Passo 3: Configure login

```bash
# Edite o arquivo primeiro
nano test_login_visual.py

# Preencha USERNAME e PASSWORD

# Execute
python test_login_visual.py
# Escolha opção 1 (MANUAL)
```

🔍 **Você vai ver:** 
- Navegador abre
- Você faz login manualmente
- Com F12 inspeciona os campos
- Anota os IDs

### Passo 4: Configure busca de processos

```bash
python configurador_interativo.py
```

🔍 **Você vai ver:**
- Script guia você passo a passo
- Navegador fica aberto
- Você interage manualmente
- No final, gera arquivo de config!

### Passo 5: Use a configuração gerada

Copie os seletores de `seirn_config_customizado.py` para `app/seirn_service.py`

---

## 💡 Como Encontrar Seletores CSS

Quando o navegador estiver aberto:

### 1. Abrir DevTools
- Pressione **F12** ou
- Clique direito → Inspecionar

### 2. Selecionar elemento
- Clique na setinha no canto do DevTools
- Clique no campo que quer inspecionar

### 3. Ver o HTML
```html
<input id="numeroProcesso" name="processo" class="form-control">
```

### 4. Anotar seletores:
- **Por ID:** `By.ID, "numeroProcesso"`
- **Por NAME:** `By.NAME, "processo"`
- **Por CLASS:** `By.CLASS_NAME, "form-control"`

### 5. Para seletor CSS (BeautifulSoup):
- **ID:** `"#numeroProcesso"`
- **Class:** `".form-control"`
- **Múltiplas classes:** `".form-control.input-lg"`

---

## 🎬 Exemplo Visual de Uso

```bash
# Terminal 1: Ativar ambiente
cd webscraping-service
source venv/bin/activate

# Ver navegador abrindo
python debug_visual.py

# Você verá:
# 1. Navegador Chrome abre ✅
# 2. Carrega página do SEIRN ✅
# 3. Você pode interagir ✅
# 4. Pressiona ENTER quando terminar ✅
```

---

## 🔧 Desativar Modo Headless

Se quiser que o serviço principal também mostre o navegador:

**No arquivo `.env`:**
```env
HEADLESS=false
```

**Ou no código `scraper.py`:**
```python
# Linha 29 - Comentar esta linha:
# if settings.HEADLESS:
#     chrome_options.add_argument("--headless=new")
```

---

## 📝 Checklist de Configuração

- [ ] Instalar dependências Python
- [ ] Executar `debug_visual.py` para testar
- [ ] Editar `test_login_visual.py` com suas credenciais
- [ ] Executar login manual e anotar seletores de login
- [ ] Atualizar SELETORES no `test_login_visual.py`
- [ ] Testar login automático
- [ ] Executar `configurador_interativo.py`
- [ ] Seguir wizard interativo
- [ ] Anotar todos os seletores de busca
- [ ] Copiar config de `seirn_config_customizado.py`
- [ ] Atualizar `app/seirn_service.py`
- [ ] Testar serviço completo!

---

## ⚠️ Troubleshooting

### Erro: Chrome driver não encontrado
```bash
# O script já instala automaticamente com webdriver-manager
# Se der erro, instale manualmente:
pip install webdriver-manager
```

### Erro: Chrome não abre
```bash
# Instale Chrome/Chromium:
# Ubuntu/Debian:
sudo apt-get install chromium-browser

# Ou use Chrome normal já instalado
```

### Navegador fecha muito rápido
```bash
# Todos os scripts têm input() para pausar
# Pressione ENTER só quando terminar de ver
```

### Quer ver em câmera lenta
```python
# Adicione após cada ação:
import time
time.sleep(2)  # Espera 2 segundos
```

---

## 🎓 Dicas Importantes

1. **Sempre use F12 (DevTools)** para inspecionar elementos
2. **Procure por IDs primeiro** - são mais confiáveis
3. **Teste manualmente antes** de automatizar
4. **Anote TODOS os seletores** em um arquivo
5. **Tire screenshots** para referência
6. **Salve o HTML** para analisar depois

---

## 📞 Próximos Passos

1. ✅ Execute `debug_visual.py` agora
2. ✅ Veja o navegador abrindo
3. ✅ Explore o SEIRN manualmente
4. ✅ Anote URL de login e busca
5. ✅ Configure credenciais e teste login
6. ✅ Use configurador interativo
7. ✅ Atualize `seirn_service.py` com seus seletores

---

**Status**: 👁️ Scripts visuais prontos!
**Próximo**: Execute `python debug_visual.py` e veja o navegador abrindo!
