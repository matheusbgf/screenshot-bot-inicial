# Screenshot Bot 24/7

Bot para abrir um sistema web, capturar o sumário em 1920x1080 e enviar a imagem para um grupo do WhatsApp nos horários configurados.

## Requisitos

- Linux com Node.js 20 ou superior
- Acesso autorizado ao sistema web
- Conta WhatsApp autorizada para enviar ao grupo
- Máquina ligada e com conexão de rede
- Permissão para automatizar o sistema e compartilhar suas capturas

## Instalação para desenvolvimento/teste

1. Copie `.env.example` para `.env`.
2. Preencha `SYSTEM_URL` e `WHATSAPP_GROUP_ID`.
3. Se o sistema exigir formulário de login, preencha os seletores e credenciais no `.env`. Não coloque credenciais no código.
4. Instale as dependências:

   ```bash
   npm install
   npx playwright install chromium
   npm run check
   ```

5. Execute inicialmente em um ambiente de teste:

   ```bash
   npm start
   ```

6. O envio ativo usa a API externa configurada por `API_TOKEN` no `.env` compartilhado e `WHATSAPP_API_URL` (por padrão, `http://127.0.0.1:3241`). Este bot não autentica o WhatsApp Web nem pede QR Code; a sessão do serviço da API é gerenciada fora deste projeto.
7. Confirme o grupo e o token configurados antes de habilitar a rotina.

## Configurar a captura

- A imagem usa o recorte da área de sumário e tem exatamente `SCREENSHOT_WIDTH` x `SCREENSHOT_HEIGHT` pixels.
- `SCREENSHOT_CROP_X` e `SCREENSHOT_CROP_Y` definem o início do recorte. Os valores padrão (`360`, `116`) retiram o menu lateral e a barra superior observados no ElsysOne.
- `PAGE_READY_SELECTOR`: seletor opcional que deve estar visível antes da captura. O bot também exige que o título `SUMÁRIO` esteja dentro do recorte, para evitar enviar uma tela de bloqueio ou uma área errada.
- Antes da captura, o bot aguarda a rede ficar ociosa por até `NETWORK_IDLE_TIMEOUT_MS` e depois espera `PAGE_SETTLE_WAIT_MS` para a aplicação terminar de renderizar informações dinâmicas. Se a página mantiver conexões abertas, o limite de rede é registrado e a espera final ainda acontece.
- `SYSTEM_URL`: endereço da página final a capturar.

## Login

O serviço usa `data/auth-state.json` em modo headless quando existe uma sessão. Para criar a sessão manualmente, defina `HEADLESS=false` e execute `node scripts/authenticate.js`: o Chromium abrirá uma janela; faça login até `SUMÁRIO` aparecer e a sessão será salva localmente. Instale o navegador com `npx playwright install chromium`. Para login automático headless em formulários simples, defina `HEADLESS=true` e configure `LOGIN_URL`, `USERNAME`, `PASSWORD`, `USERNAME_SELECTOR`, `PASSWORD_SELECTOR`, `LOGIN_SUBMIT_SELECTOR` e `POST_LOGIN_READY_SELECTOR`. O último seletor precisa identificar um elemento que só aparece após a autenticação; a sessão é então salva com permissão restrita. SSO, MFA, CAPTCHA e bloqueios corporativos não são contornados. O token WhatsApp é independente e autentica a chamada à API remota; este projeto não executa login de WhatsApp Web.

## Agendamento

`SCHEDULE_TIMES` define os horários locais no fuso `TIMEZONE`. O padrão executa às 01:00, 04:00, 07:00, 10:00, 13:00, 16:00, 19:00 e 22:00. O bot espera o próximo horário e não dispara uma captura ao iniciar. Se uma captura passar do próximo horário, o agendador aguarda o horário seguinte, sem sobrepor execuções.

## Logs

Em execução direta, os logs JSON aparecem no terminal. Em `systemd`:

```bash
journalctl -u screenshot-bot.service -f
journalctl -u screenshot-bot.service --since today
```

## Implantação com systemd

**Não instale diretamente em produção sem revisão e autorização.** Antes de qualquer atualização de serviço existente, faça backup da configuração e registre como reverter.

O arquivo `deploy/screenshot-bot.service` é um modelo. Revise caminhos, usuário, políticas locais e dependências antes de instalar. O envio deste bot usa a API externa e requer que ela esteja disponível e autorizada; este projeto não altera nem reinicia esse serviço.

## Segurança operacional

- Não versione `.env` nem `data/`; eles podem conter credenciais e sessões do sistema web.
- Restrinja as permissões do `.env` e do diretório `data/` ao usuário do serviço.
- Não registre senhas, conteúdo de páginas ou informações sensíveis nos logs.
- As capturas podem conter dados corporativos: compartilhe somente no grupo autorizado e mantenha retenção mínima.
- O envio pode ter resultado ambíguo em falhas de rede; confira o grupo antes de repetir manualmente para evitar duplicidade.
- Este esqueleto precisa ser validado com a URL, os seletores reais, o ID do grupo e o método de autenticação antes de produção.
