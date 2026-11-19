# Changelog

As mudanças relevantes do Fluxo são registradas neste arquivo.

## [1.0.1] - 2026-11-19

### Adicionado
- Aplicativo desktop para Windows 64 bits, empacotado com Electron.
- Instalador NSIS com atalhos para a área de trabalho e o menu Iniciar.
- Sistema de citações na página inicial, com biblioteca interna em português e inglês.
- Possibilidade de adicionar, editar e excluir citações personalizadas.
- Integração opcional com a API do DummyJSON para obter citações externas, com cache local.
- Personalização das citações: tamanho, fonte, alinhamento e exibição da autoria.
- Importação e restauração de backups completos, incluindo dados do aplicativo, quadros da Área de Trabalho e arquivos associados.
- Ferramentas de escrita e desenho na Área de Trabalho.
- Edição e controles aprimorados para fórmulas LaTeX na Área de Trabalho.

### Melhorado
- Internacionalização da interface, com inglês como idioma padrão para novas instalações e preservação da preferência de idioma já escolhida.
- Experiência da Área de Trabalho, incluindo padrões de fundo e controles.
- Preparação da versão Electron: os arquivos web são copiados para o pacote desktop, sem alterar os arquivos originais.
- Na versão desktop, os scripts de Vercel Analytics e Speed Insights são removidos do HTML empacotado.
- Testes automatizados para navegação, persistência, PDFs, áudio e exportação/restauração de backups.

### Observações
- A versão desktop mantém seus dados separados da versão web. Use a função de exportação e importação para transferir informações entre instalações.
- O instalador para Windows ainda não possui assinatura digital.
