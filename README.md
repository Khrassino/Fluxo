# Fluxo

Aplicativo de produtividade minimalista: cronômetro, tarefas, progresso e uma área de trabalho em quadro infinito — tudo local, sem cadastro, sem build e sem dependências.

## Como abrir

Basta abrir o arquivo `index.html` no navegador (duplo clique). Para uma experiência ideal, sirva a pasta com um servidor local:

```bash
npx serve .
# ou
python -m http.server
```

> O app funciona 100% offline. As fontes vêm do Google Fonts (com fallback do sistema) e a música é gerada em tempo real pelo navegador.

## Navegação

A barra inferior fica recolhida como uma **bolinha** com o símbolo do app. Clique nela para expandir a navegação completa (Início, Cronômetro, Progresso, Tarefas, Área de Trabalho e Personalizar); ao clicar, a bolinha faz um movimento elástico e os itens surgem com uma transição suave. Depois de **10 segundos sem movimento do mouse**, ela volta sozinha para o formato de bolinha.

A bolinha também pode ser **arrastada** entre **8 posições**: centro inferior, centro superior, os quatro cantos e o meio das laterais esquerda e direita. Em qualquer posição, a navegação se adapta e se abre na direção mais natural — horizontal no centro e vertical nas laterais e cantos. Quando ela está nas posições direitas, o painel de personalização abre pela **esquerda**, para não cobrir a bolinha.

No painel, em **Geral**, é possível ativar a opção de a bolinha **se expandir ao passar o mouse** e se recolher ao sair.

## Páginas

### Início
- Relógio, saudação, data e atalhos.
- **Atalhos personalizáveis**: escolha quais atalhos aparecem, a ordem e adicione novos (foco rápido, resumo do dia, tarefas pendentes, sequência de dias, música de fundo, cronômetro rápido, nova tarefa, ver progresso e personalizar).
- Os elementos e atalhos da tela podem ser reordenados e ocultados no painel, em **Início**, ou **direto na tela**: o botão **Editar na tela** permite arrastar os blocos, remover atalhos com botão direto ou soltar na lixeira, e adicionar de volta pela barra inferior de ocultos. O relógio é fixo.
- Em **Início → Durante a inatividade**, escolha o que continua visível no modo calmo.

### Cronômetro
- **Duas versões**, escolhidas em **Cronômetro → Estilo da página**:
  - **Clássica**: abas, presets, anel, rótulo, sessões, controles e dica.
  - **Minimalista**: apenas o relógio e o anel. Pressione o relógio e **arraste** para abrir um halo radial: cima inicia ou pausa, direita reinicia, baixo troca o preset e esquerda alterna entre temporizador e cronômetro.
- **Temporizador**: presets Foco (25min), Pausa (5min), Descanso (15min) e duração personalizada.
- **Cronômetro**: contagem progressiva.
- Personalização separada por elementos, em vez de estilos fechados:
  - **Número**: fonte (21 opções), tamanho, peso, espaçamento, cor própria e animação dos dígitos (nenhuma ou flip).
  - **Efeitos do número**: brilho/neon, sombra projetada, contorno vazado e pulsação suave — cada um pode ser ligado ou desligado.
  - **Anel**: ligado/desligado, espessura e estilo sólido, gradiente ou tracejado.
  - **Atrás do número**: nenhum, vidro, cartão ou halo.
  - **Sessões e fundo**: ciclo automático, duração de cada preset, escurecimento, desfoque e som ao finalizar.
  - **Durante a inatividade**: escolha o que permanece visível no modo calmo (anel, rótulo, abas, presets, sessões, controles e dica).
- Atalhos: `Espaço`/`S` inicia ou pausa, `R` reinicia. Sessões de foco concluídas contam no progresso.

### Progresso
- **Até 8 cartões menores de estatísticas personalizáveis**: Dias de uso, Horas de uso, Tarefas realizadas, Sessões de foco, Meta de hoje, Média diária, Tarefas pendentes e Melhor dia de foco.
- Cartões com **tamanho modificável** (1x quadrado ou 2x largo) e presença personalizável: remova o que não quiser e alterne o tamanho direto na tela com um clique ou pelo painel.
- **Dois gráficos simultâneos**: acompanhe horas de uso no gráfico principal e sessões de foco (ou comparativo anual) no segundo gráfico, ambos com quatro visões — **barras**, **linha**, **grade** (heatmap estilo Anki, um quadradinho por dia) e **circular** (heatmap em anéis/espiral) —, períodos independentes e tamanho das células ajustável.
- **Variações da meta diária**: escolha entre barra contínua clássica, medidor circular radial e barra com marcos de porcentagem (25% a 100%).
- Períodos de **7, 14, 30, 90 dias e 1 ano**. No período de 1 ano, o gráfico usa o ano-calendário completo, **incluindo os dias futuros** (aparecem vazios), com navegação entre anos.
- No visual **circular**, cada dia do ano é um quadradinho organizado em anéis; a intensidade da cor representa o nível de trabalho do dia. Na **grade**, cada quadradinho também equivale a um dia, com rótulos de mês e dias da semana, e o tamanho das células pode ir de 10 a 34 px.
- Os blocos e cartões da página podem ser reordenados e ocultados no painel, em **Progresso**, ou pelo botão **Editar na tela** (com lixeira e barra de elementos ocultos).
- Exportação dos dados em JSON.

### Tarefas
- Adicionar, concluir, excluir e limpar concluídas.
- Edição inline: duplo clique no texto ou botão de lápis (`Enter` salva, `Esc` cancela).
- Filtros: todas, pendentes, concluídas.
- Ordenação: recentes, antigas ou A–Z.
- Personalize a **cor de destaque**, a **animação**, a posição das concluídas e o som ao concluir.

### Área de Trabalho
- **Quadro infinito** com pan (arraste o fundo com o cursor em mãozinha) e zoom pela roda do mouse ou pelos botões **+ / − / ajustar**, de 20% a 400%.
- **Cartões de texto** arrastáveis e redimensionáveis, com botão para ligar a outro cartão e remover. Duplo clique no fundo cria uma nota nova.
- **Setas** curvas ligando cartões: use **Ligar**, clique no destino e ajuste depois movendo os cartões. Selecione uma seta e pressione `Delete` para removê-la.
- **PDFs** abertos no próprio quadro com o PDF.js local: arraste o cabeçalho para mover, o canto para redimensionar, use **− / 100% / +** (ou `Ctrl` + roda) para dar zoom interno com rolagem na página e navegue para frente ou para trás pelos botões **‹ / ›**, clicando no lado esquerdo (voltar) ou direito (avançar) da página, pelo número da página (clique para digitar) ou pelas setas do teclado (`←` / `→`).
  - Selecione um trecho e escolha uma das **cinco cores** para destacar, ou **arraste a seleção para fora do PDF** para criar um cartão de nota já vinculado à página de origem.
  - Até **5 PDFs** por quadro. Arquivos acima de **20 MB** pedem confirmação; apenas a página visível de cada PDF é renderizada, e as demais são descartadas para economizar memória.
- **Fundo** com cor do tema, cores próprias ou imagem de até 10 MB. O **cursor** do quadro é padronizado em uma mãozinha pequena para manter coerência com o arraste do quadro e dos cartões.
- **Cronômetro flutuante** com a mesma lógica da página Cronômetro: iniciar/pausar, reiniciar e pular. Pode ser arrastado, minimizado em uma **bolinha** e configurado em três estilos (**minimalista**, **circular com anel** e **flip**), com cor, fonte, tamanho e transparência próprios. O **anel e a bolinha acompanham o tamanho do relógio**: o app mede o texto na fonte escolhida e dimensiona o círculo para o tempo caber por inteiro, e o card mede o próprio tamanho para não encostar no controle de zoom. No estilo **flip**, cada dígito vira um cartão e só o dígito que muda anima, como na página Cronômetro. As configurações ficam em quatro grupos: **Estilo**, **Cor**, **Fonte e tamanho** e **Janela**. A posição e o estilo ficam salvos.
- Tudo é salvo em um banco **IndexedDB próprio** (`fluxo-workspace`), incluindo cartões, setas, fundo, posição da câmera e os arquivos PDF. Os efeitos de fundo são pausados automaticamente enquanto o quadro está aberto.

## Modo calmo

Depois de um tempo sem atividade, os detalhes somem suavemente:

- **Início**: por padrão o relógio permanece em destaque e o restante desaparece devagar. Em **Início → Durante a inatividade** você escolhe exatamente quais elementos continuam.
- **Progresso e Tarefas**: fica apenas um ícone discreto no centro da tela.
- **Cronômetro**: por padrão o número e o anel continuam; abas, presets, sessões, controles, rótulo e dica podem ser ligados ou desligados em **Cronômetro → Durante a inatividade**. Na versão minimalista, apenas o relógio aparece.

Qualquer movimento do mouse, toque ou tecla traz tudo de volta. O tempo é configurável em **30s, 1min, 2min, 5min ou desligado**.

## Personalização (engrenagem na navegação)

O painel é organizado em **3 grupos** e **8 gavetas recolhíveis** (apenas uma aberta por vez):

### Aparência
- **Temas e cores**: 8 temas prontos em ordem natural (**Aurora**, **Noite**, **Floresta**, **Obsidiana**, **Carmesim**, **Neon**, **Alvorada** e **Neve**) + **tema personalizado** com cores próprias de fundo, destaque, destaque secundário, texto e opacidade do vidro.
- **Papel de parede e fonte**: 11 papéis de parede em gradiente — incluindo **Névoa**, **Areia** e **Grafite** —, tema puro, imagem enviada (com opção de remover) e 10 opções de fonte da interface.
- **Efeitos**: movimento do fundo e partículas independentes, com **nível global** (**completos**, **reduzidos** ou **desligados**) para economizar bateria.
  - **Movimento**: Deslizar, Profundidade, Inclinação, Balanço e Deriva, com intensidade e suavidade.
  - **Partículas**: Poeira, Chuva, Onda, Tela molhada e Neve, com quantidade ajustável e interação com o mouse.

### Páginas (na ordem da navegação)
- **Início**: editor de arrasto dos elementos da página, **Atalhos da tela inicial** (ordem e visibilidade), botão **Editar na tela** e itens de **Durante a inatividade** (com Relógio fixo).
- **Cronômetro**: estilo da página, número e dígitos, efeitos do número, anel e fundo do relógio, sessões e durações, fundo durante o foco e **Durante a inatividade** (com Relógio fixo).
- **Progresso**: elementos da página, **Cartões de resumo** (ordem, visibilidade e tamanho 1x/2x no mesmo editor), **Gráfico principal**, **Segundo gráfico**, **Heatmaps** (tamanho das células) e **Meta diária**.
- **Tarefas**: aparência (cor de destaque e animação ao adicionar) e lista e comportamento (ordenação, concluídas ao final e som ao concluir).

### Sistema
- **Geral**: modo calmo, expansão da bolinha ao passar o mouse, música de fundo (chuva, oceano, ambiente, lo-fi ou arquivo próprio com opção de remover), volume, exportação de dados e opção de apagar tudo com confirmação no próprio painel.

## Armazenamento

Tudo fica no seu navegador: configurações, tarefas e estatísticas em `localStorage`; imagens e áudios personalizados em `IndexedDB` (com fallback para `localStorage`). A **Área de Trabalho** usa um banco IndexedDB separado (`fluxo-workspace`) para o quadro e os PDFs. Nada é enviado para a internet. Em **Geral → Exportar dados (JSON)** você baixa um backup, e o mesmo painel oferece a opção de apagar todos os dados (inclusive o quadro).
