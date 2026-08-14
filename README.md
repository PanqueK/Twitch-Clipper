# 🎬 Twitch Clipper

> Aplicativo desktop para criar clips de VODs da Twitch e vídeos locais, com processamento **100% na máquina do usuário**.

![Platform](https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=for-the-badge&logo=windows)
![Electron](https://img.shields.io/badge/Electron-43.2.0-47848F?style=for-the-badge&logo=electron)
![License](https://img.shields.io/badge/license-ISC-blue?style=for-the-badge)

---

## 📌 Sobre o projeto

O **Twitch Clipper** é uma aplicação desktop desenvolvida para facilitar a criação de clips a partir de VODs da Twitch e arquivos de vídeo locais.

Todo o processamento acontece **localmente no computador do usuário**, utilizando **yt-dlp** para obtenção do conteúdo e **FFmpeg** para processamento do vídeo.

### ✨ Principais características

- 🎥 Clips a partir de VODs da Twitch
- 📁 Processamento de vídeos locais
- ⚡ Processamento local
- 🛠️ FFmpeg integrado
- 📥 yt-dlp integrado
- 🖥️ Aplicativo desktop para Windows
- 📦 Instalador `.exe`
- 🚫 Sem limite artificial de 10 minutos
- 💾 Clips salvos localmente
- 🔒 Não requer Node.js instalado no computador do usuário

---

## 🖥️ Como funciona

```text
                  ┌─────────────────────┐
                  │    Twitch Clipper   │
                  └──────────┬──────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
          VOD da Twitch              Vídeo local
                │                         │
                ▼                         │
             yt-dlp                      │
                │                         │
                └────────────┬────────────┘
                             ▼
                           FFmpeg
                             │
                             ▼
                         Clip MP4
                             │
                             ▼
                     Computador do usuário
```

---

## 🚀 Download e instalação

Para usuários finais, basta baixar:

```text
Twitch-Clipper-1.3.0-Setup.exe
```

Execute o instalador e siga as instruções.

### Requisitos

- Windows 10/11 — 64 bits

O usuário final **não precisa instalar manualmente**:

- ❌ Node.js
- ❌ npm
- ❌ FFmpeg
- ❌ yt-dlp
- ❌ Python
- ❌ Visual Studio Code

Os componentes necessários são distribuídos com o aplicativo.

---

## 🧑‍💻 Desenvolvimento

### Pré-requisitos

- Windows 10/11 64 bits
- Node.js LTS
- npm

### Clonar

```bash
git clone https://github.com/SEU-USUARIO/twitch-clipper.git
cd twitch-clipper
```

### Instalar dependências

```bash
npm install
```

### Executar em desenvolvimento

```bash
npm start
```

### Gerar instalador Windows

```bash
npm run dist
```

O instalador será criado em:

```text
dist/
└── Twitch-Clipper-1.3.0-Setup.exe
```

### Gerar versão portátil

```bash
npm run dist:portable
```

---

## 📂 Estrutura

```text
twitch-clipper/
│
├── electron/
│   ├── main.js
│   └── preload.js
│
├── public/
│   └── index.html
│
├── src/
│   ├── server.js
│   └── clip.js
│
├── resources/
│   └── bin/
│       ├── ffmpeg.exe
│       └── yt-dlp.exe
│
├── package.json
└── README.md
```

---

## ⏱️ Limite de duração

O Twitch Clipper **não possui limite artificial de 10 minutos**.

A duração depende principalmente do VOD, espaço disponível, conexão e capacidade da máquina.

Exemplos:

```text
00:05:00 → 00:25:00 = 20 minutos
00:10:00 → 01:10:00 = 1 hora
02:00:00 → 04:30:00 = 2 horas e 30 minutos
```

---

## 🔒 Processamento local

O fluxo principal é:

```text
Usuário
   ↓
Twitch Clipper
   ↓
yt-dlp / FFmpeg
   ↓
Arquivo MP4 local
```

Não é necessário enviar o vídeo para um servidor próprio para realizar o processamento.

> O uso deve respeitar os termos de serviço da Twitch, direitos autorais e demais regras aplicáveis.

---

## ⚙️ Tecnologias

- [Electron](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [FFmpeg](https://ffmpeg.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [Electron Builder](https://www.electron.build/)
- Express
- Multer
- HTML
- CSS
- JavaScript

---

## 🛡️ Segurança

Ao preparar novas versões:

1. mantenha o Electron atualizado;
2. mantenha o yt-dlp atualizado;
3. mantenha o FFmpeg atualizado;
4. execute `npm audit`;
5. teste o instalador em uma máquina limpa;
6. valide os binários antes da distribuição.

---

## 🐛 Problemas e sugestões

Abra uma **Issue** no GitHub contendo, quando possível:

- versão do Twitch Clipper;
- versão do Windows;
- descrição do problema;
- passos para reproduzir;
- mensagem de erro;
- logs ou capturas de tela.

---

## 🗺️ Roadmap

### Versão 1.3.0

- [x] Aplicativo desktop
- [x] Integração com Twitch
- [x] Processamento de vídeo local
- [x] FFmpeg integrado
- [x] yt-dlp integrado
- [x] Instalador Windows
- [x] Versão portátil
- [x] Remoção do limite artificial de 10 minutos

### Próximas versões

- [ ] Barra de progresso real
- [ ] Histórico de clips
- [ ] Configuração da pasta de saída
- [ ] Abrir pasta após processamento
- [ ] Configurações de qualidade
- [ ] Melhor tratamento de erros
- [ ] Atualização automática
- [ ] Interface aprimorada
- [ ] Mais opções de exportação

---

## 📄 Licença

Este projeto está distribuído sob a licença **ISC**.

Consulte o arquivo `LICENSE` para mais informações.

---

## ⚠️ Aviso legal

O Twitch Clipper é uma ferramenta de uso geral para processamento de vídeos.

O usuário é responsável por garantir que possui autorização para baixar, reproduzir, editar ou distribuir o conteúdo processado através da aplicação.

O projeto não é afiliado, patrocinado ou endossado pela Twitch.

---

## ⭐ Contribua

Se este projeto for útil para você, considere deixar uma ⭐ no GitHub.

Pull Requests, Issues e sugestões são bem-vindos.

---

**Twitch Clipper — transforme seus VODs em clips diretamente no seu computador. 🎬**
