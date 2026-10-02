# Screenshot Bot 24/7

Modelo inicial de bot para abrir um sistema web, capturar uma página ou elemento e enviar a imagem para um grupo do WhatsApp a cada 60 minutos.

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

6. Na primeira inicialização, escaneie o QR Code do WhatsApp no terminal. A sessão será persistida em `data/whatsapp-auth/`. Proteja esse diretório: ele permite acesso à conta do WhatsApp.
7. Confirme o envio para o grupo correto antes de deixar o bot operando.

## Configurar a captura

- `SCREENSHOT_SELECTOR`: seletor CSS do elemento a capturar. Deixe vazio para capturar a página.
- `SCREENSHOT_FULL_PAGE=true`: captura a página inteira quando não há seletor.
- `PAGE_READY_SELECTOR`: seletor que deve estar visível antes da captura.
- `SYSTEM_URL`: endereço da página final a capturar.
- Os seletores dependem do HTML real do sistema e precisam ser ajustados após inspeção autorizada da página.

## Login

O login automático é opcional. Para formulário simples, configure `LOGIN_URL`, `USERNAME`, `PASSWORD`, `USERNAME_SELECTOR`, `PASSWORD_SELECTOR` e `LOGIN_SUBMIT_SELECTOR`. Se houver SSO, MFA, CAPTCHA ou políticas corporativas, não tente contorná-los: use o fluxo aprovado pela organização e adapte a autenticação conforme permitido.

## Agendamento

Por padrão, `RUN_ON_START=true` executa uma captura logo após o WhatsApp ficar pronto e depois espera 60 minutos entre execuções. Isso significa intervalo contado a partir do término da execução, não alinhamento exato com cada hora do relógio.

## Logs

Em execução direta, os logs JSON aparecem no terminal. Em `systemd`:

```bash
journalctl -u screenshot-bot.service -f
journalctl -u screenshot-bot.service --since today
```

## Implantação com systemd

**Não instale diretamente em produção sem revisão e autorização.** Antes de qualquer atualização de serviço existente, faça backup da configuração e registre como reverter.

O arquivo `deploy/screenshot-bot.service` é um modelo. Revise caminhos, usuário, políticas locais e dependências antes de instalar. `whatsapp-web.js` depende de automação do WhatsApp Web e pode ser afetado por mudanças do serviço; para uso corporativo crítico, avalie as políticas internas e a API oficial.

## Segurança operacional

- Não versione `.env`, `data/` ou a sessão de autenticação do WhatsApp.
- Restrinja as permissões do `.env` e do diretório `data/` ao usuário do serviço.
- Não registre senhas, conteúdo de páginas ou informações sensíveis nos logs.
- As capturas podem conter dados corporativos: compartilhe somente no grupo autorizado e mantenha retenção mínima.
- O envio pode ter resultado ambíguo em falhas de rede; confira o grupo antes de repetir manualmente para evitar duplicidade.
- Este esqueleto precisa ser validado com a URL, os seletores reais, o ID do grupo e o método de autenticação antes de produção.
