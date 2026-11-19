# Fluxo

Um espaço de produtividade minimalista, personalizável e leve. O Fluxo reúne ferramentas de foco, organização e acompanhamento em uma interface que você pode adaptar ao seu jeito de trabalhar.

O projeto possui uma versão web e um aplicativo para Windows, construído com Electron.

## Experimente no navegador

**[Abrir o Fluxo](https://fluxo-phi-eosin.vercel.app/)** — use a versão web diretamente no navegador, sem instalação.

## Downloads

**[Baixar a versão mais recente em Releases](https://github.com/Khrassino/Fluxo/releases/latest)**

Na página de Releases, baixe o instalador do Windows:

`Fluxo-Setup-<versão>.exe`

O aplicativo desktop é distribuído para **Windows 64 bits (x64)**.

## Recursos

- **Início:** relógio, saudação, atalhos personalizáveis e citações.
- **Cronômetro:** temporizador Pomodoro, cronômetro progressivo e aparência ajustável.
- **Progresso:** estatísticas, metas diárias e gráficos para acompanhar o uso e as sessões de foco.
- **Tarefas:** criação, edição, filtros, prioridades, prazos e organização.
- **Área de Trabalho:** quadro infinito com cartões de texto, conexões, escrita e desenho, imagens e PDFs.
- **Personalização:** temas, cores, fontes, efeitos visuais, sons e opções de comportamento.
- **Citações:** biblioteca interna, textos adicionados pelo usuário e fonte externa opcional.
- **Backup:** exportação e importação dos dados, incluindo o conteúdo da Área de Trabalho e arquivos armazenados.

A interface está disponível em português e inglês.

## Instalação no Windows

1. Abra a página de [Releases](https://github.com/Khrassino/Fluxo/releases/latest).
2. Baixe o arquivo `Fluxo-Setup-<versão>.exe`.
3. Execute o instalador e escolha a pasta de destino.
4. Ao terminar, abra o Fluxo pelo atalho criado na área de trabalho ou pelo menu Iniciar.

> **Aviso do Windows:** o instalador não possui assinatura digital. Por isso, o SmartScreen pode exibir um aviso ao executá-lo. Isso não significa, por si só, que o arquivo seja malicioso; verifique sempre se o download veio da página oficial de Releases do projeto.

## Seus dados e backups

O Fluxo armazena as configurações, tarefas, estatísticas e conteúdo de trabalho localmente no dispositivo.

A versão web e a versão desktop mantêm armazenamentos separados. Para transferir seus dados entre elas ou entre computadores:

1. Abra **Configurações → Geral → Exportar dados** na instalação de origem.
2. Guarde o arquivo JSON gerado.
3. Na instalação de destino, use a opção **Importar backup**.

O backup inclui o estado do aplicativo, os quadros da Área de Trabalho e os arquivos associados. Guarde uma cópia do arquivo em um local seguro, especialmente antes de atualizar ou trocar de dispositivo.

Na versão desktop, os dados ficam no diretório de usuário do aplicativo do Windows. Desinstalar o Fluxo não remove esses dados; o instalador também está configurado para preservá-los durante a atualização.

## Privacidade e funcionamento offline

As informações pessoais e os dados de trabalho são armazenados localmente. A versão desktop não carrega os scripts de análise da Vercel usados na versão web.

Alguns recursos opcionais podem acessar serviços externos:
- A fonte externa de citações consulta a API do DummyJSON quando ativada. Os resultados são armazenados em cache local por 24 horas.
- As fontes tipográficas podem ser carregadas do Google Fonts; sem conexão, o aplicativo utiliza fontes de fallback do sistema.

As funções principais e os dados já salvos continuam disponíveis sem conexão. A obtenção de novas citações externas e o carregamento de fontes online dependem de internet.

## Desenvolvimento

O aplicativo web utiliza HTML, CSS e JavaScript. O empacotamento para Windows fica na pasta `desktop/` e utiliza Electron e electron-builder.

### Executar a versão desktop em modo de desenvolvimento

É necessário ter o [Node.js LTS](https://nodejs.org/) instalado.

```bash
cd desktop
npm install
npm start
```

### Gerar o instalador do Windows

Dentro da pasta `desktop/`, execute:

```bash
npm run dist
```

O instalador será gerado em `desktop/dist/`, com o nome definido pela versão em `desktop/package.json`.

Para executar o teste automatizado do aplicativo desktop:

```bash
npm run smoke
```

### Estrutura principal

- `index.html`: entrada da versão web.
- `public/`: arquivos estáticos, scripts, estilos, fontes e recursos.
- `desktop/`: processo principal do Electron, configuração do empacotamento e scripts de build/teste.

## Atualizações

Consulte o [CHANGELOG](CHANGELOG.md) para ver as alterações de cada versão e a página de [Releases](https://github.com/Khrassino/Fluxo/releases) para baixar os instaladores disponíveis.
