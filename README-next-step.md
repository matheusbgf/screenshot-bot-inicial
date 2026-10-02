# Próximo passo: validar sessão do ElsysOne

No diretório do projeto original, copie o script `scripts/test-session.js` e substitua `src/browser/client.js` pela versão deste pacote se ainda não tiver atualizado o cliente para carregar `AUTH_STATE_FILE`.

1. Confirme no `.env`:
   `SYSTEM_URL=https://elsysone.com/pt-BR`
   `AUTH_STATE_FILE=./data/auth-state.json`
2. Rode `node scripts/test-session.js`.
3. Observe a janela e confirme visualmente se o sistema abre sem pedir login/MFA.
4. Se redirecionar para a tela de login, a sessão salva não está sendo reutilizada; não tente contornar MFA. Faça login novamente pelo fluxo aprovado e investigue com a equipe responsável.
5. A URL exata da tela a capturar ainda precisará ser configurada depois.

Não compartilhe `data/auth-state.json`, cookies, códigos MFA ou credenciais.
