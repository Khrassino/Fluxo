# Fluxo Desktop (Windows)

Empacota o Fluxo (os mesmos arquivos de `index.html` + `public/`) como um app de Windows com instalador, usando **Electron**. Nada do app web é alterado: o script `prepare-web` copia os arquivos para `desktop/web/` a cada build.

## Gerar o instalador (no Windows)

1. Instale o [Node.js](https://nodejs.org) (versão **LTS**).
2. Abra um terminal **dentro da pasta `desktop`** do projeto.
3. Rode, uma vez: `npm install`
4. Para testar o app numa janela: `npm start`
5. Para gerar o instalador: `npm run dist`

O instalador fica em `desktop/dist/Fluxo-Setup-1.0.0.exe` (cerca de 135 MB). Ele pergunta onde instalar e cria atalhos na área de trabalho e no menu Iniciar.

> Como o instalador não é assinado digitalmente, o Windows pode mostrar o aviso "O Windows protegeu seu computador" (SmartScreen). Clique em **Mais informações → Executar assim mesmo**. Isso é normal em projetos pessoais.

## Seus dados

- Ficam em `%APPDATA%\Fluxo` (localStorage e IndexedDB do app), separados dos dados do navegador. Para levar o que já existe na versão web, use **Exportar dados** na versão web e **Importar backup** no app instalado.
- Desinstalar o app **não apaga** os dados. Instalar uma versão nova por cima também os mantém.
- **Não altere** `SCHEME` (`app`) nem `HOST` (`fluxo`) em `main.js`: os dados ficam ligados a esse endereço (`app://fluxo`). Mudar qualquer um dos dois faz o app abrir vazio.

## Atualizar o app depois de mudanças no Fluxo

Traga a versão mais recente da branch `main` e rode `npm run dist` de novo. Se mudar a versão em `package.json`, o nome do instalador muda junto.

## O que esta versão faz de diferente da web

- Remove os scripts de análise da Vercel (Web Analytics e Speed Insights).
- Serve os arquivos por `app://fluxo/` (e não por `file://`), com suporte a requisições parciais para a música e o worker do leitor de PDF funcionando.
- Mantém o cronômetro rodando com a janela minimizada.
- Janela única, sem barra de menus (aparece ao apertar `Alt`; zoom e tela cheia ficam lá). `F11` não é um atalho do app, use o menu **Exibir**.
- Links externos abrem no navegador padrão.

## Teste automático (opcional)

`npm run smoke` abre o app, navega pelas cinco páginas e confere: carregamento, dados que sobrevivem ao reiniciar, worker do PDF, música com requisições parciais, exportação de backup e ausência dos scripts da Vercel. No Linux ele usa `xvfb-run`.

## Pendências conhecidas

- As fontes (Inter e as do cronômetro) ainda vêm do Google Fonts: sem internet, o app usa a fonte do sistema. Para ficar 100% offline, é preciso embutir as fontes.
- O instalador ainda não é assinado.
