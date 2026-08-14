const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");
const crypto = require("crypto");

const app = express();

const PORT = Number(process.env.PORT || 3000);

// ==========================================
// DIRETÓRIOS
// ==========================================

const dataDir = process.env.APP_DATA_DIR || path.join(__dirname, "..");
const inputDir = path.join(dataDir, "input");
const outputDir = path.join(dataDir, "output");

fs.mkdirSync(inputDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "..", "public")
    )
);

// ==========================================
// UPLOAD
// ==========================================

const upload = multer({
    dest: inputDir
});

// ==========================================
// PROGRAMAS
// ==========================================
//
// Em hospedagem Linux:
//
// yt-dlp
// ffmpeg
//
// precisam estar disponíveis no PATH.
//
// No Windows local:
// usamos o yt-dlp.exe do usuário.
//
// ==========================================

const ytDlpPath =
    process.env.YTDLP_PATH ||
    (
        process.platform === "win32"
            ? path.join(
                process.env.USERPROFILE || "",
                "yt-dlp.exe"
            )
            : "yt-dlp"
    );

const ffmpegPath =
    process.env.FFMPEG_PATH ||
    "ffmpeg";

console.log("yt-dlp:", ytDlpPath);
console.log("ffmpeg:", ffmpegPath);

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function timeToSeconds(time) {

    if (typeof time !== "string") {
        return null;
    }

    const parts =
        time.trim()
            .split(":")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(Number.isNaN)
    ) {
        return null;
    }

    const [
        hours,
        minutes,
        seconds
    ] = parts;

    if (
        hours < 0 ||
        minutes < 0 ||
        minutes >= 60 ||
        seconds < 0 ||
        seconds >= 60
    ) {
        return null;
    }

    return (
        hours * 3600 +
        minutes * 60 +
        seconds
    );
}


function secondsToTime(seconds) {

    seconds =
        Math.max(
            0,
            Math.floor(
                Number(seconds) || 0
            )
        );

    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const secs =
        seconds % 60;

    return [
        hours,
        minutes,
        secs
    ]
        .map(
            value =>
                String(value)
                    .padStart(2, "0")
        )
        .join(":");
}


function removeFile(file) {

    if (!fs.existsSync(file)) {
        return;
    }

    try {

        fs.unlinkSync(file);

    } catch (error) {

        console.log(
            "Não foi possível remover:",
            file
        );
    }
}


function createId() {

    return crypto
        .randomBytes(12)
        .toString("hex");
}


function isTwitchVodUrl(url) {

    try {

        const parsed =
            new URL(url);

        return (
            parsed.hostname === "twitch.tv" ||
            parsed.hostname.endsWith(".twitch.tv")
        ) &&
        parsed.pathname.includes("/videos/");

    } catch {

        return false;
    }
}


// ==========================================
// CONSULTAR VOD DA TWITCH
// ==========================================

app.post(
    "/api/twitch",
    (req, res) => {

        const { url } =
            req.body;

        if (!url) {

            return res.status(400).json({
                error:
                    "Cole uma URL da Twitch."
            });
        }

        if (!isTwitchVodUrl(url)) {

            return res.status(400).json({
                error:
                    "URL de VOD da Twitch inválida."
            });
        }

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "CONSULTANDO VOD DA TWITCH"
        );
        console.log(
            "URL:",
            url
        );
        console.log(
            "================================"
        );

        const args = [

            "--no-playlist",

            "--skip-download",

            "--print",
            "%(title)s",

            "--print",
            "%(duration)s",

            url
        ];

        const ytDlp =
            spawn(
                ytDlpPath,
                args
            );

        let stdout = "";
        let stderr = "";
        let responded = false;

        ytDlp.stdout.on(
            "data",
            data => {

                stdout +=
                    data.toString();
            }
        );

        ytDlp.stderr.on(
            "data",
            data => {

                const text =
                    data.toString();

                stderr += text;

                console.log(
                    text.trim()
                );
            }
        );

        ytDlp.on(
            "error",
            error => {

                console.error(
                    "Erro ao iniciar yt-dlp:",
                    error
                );

                if (!responded) {

                    responded = true;

                    res.status(500).json({
                        error:
                            "Não foi possível iniciar o yt-dlp: " +
                            error.message
                    });
                }
            }
        );

        ytDlp.on(
            "close",
            code => {

                if (responded) {
                    return;
                }

                if (code !== 0) {

                    console.error(
                        "yt-dlp terminou:",
                        code
                    );

                    console.error(
                        stderr
                    );

                    responded = true;

                    return res.status(500).json({
                        error:
                            "Não foi possível consultar o VOD da Twitch."
                    });
                }

                const lines =
                    stdout
                        .trim()
                        .split(/\r?\n/)
                        .filter(Boolean);

                if (lines.length < 2) {

                    responded = true;

                    return res.status(500).json({
                        error:
                            "Não foi possível obter os dados do VOD."
                    });
                }

                const title =
                    lines[0].trim();

                const duration =
                    Number(
                        lines[
                            lines.length - 1
                        ].trim()
                    );

                if (
                    !Number.isFinite(duration) ||
                    duration <= 0
                ) {

                    responded = true;

                    return res.status(500).json({
                        error:
                            "A Twitch não retornou uma duração válida."
                    });
                }

                console.log("");
                console.log(
                    "VOD encontrado:"
                );
                console.log(
                    "Título:",
                    title
                );
                console.log(
                    "Duração:",
                    secondsToTime(duration)
                );
                console.log(
                    "================================"
                );

                responded = true;

                res.json({
                    success: true,
                    title,
                    duration
                });
            }
        );
    }
);


// ==========================================
// BAIXAR SOMENTE O TRECHO DO VOD
// ==========================================

app.post(
    "/api/twitch-clip",
    (req, res) => {

        const {
            url,
            start,
            end
        } = req.body;

        // --------------------------------------
        // URL
        // --------------------------------------

        if (!url) {

            return res.status(400).json({
                error:
                    "URL da Twitch não informada."
            });
        }

        if (!isTwitchVodUrl(url)) {

            return res.status(400).json({
                error:
                    "URL de VOD da Twitch inválida."
            });
        }

        // --------------------------------------
        // TEMPOS
        // --------------------------------------

        const startSeconds =
            timeToSeconds(start);

        const endSeconds =
            timeToSeconds(end);

        if (
            startSeconds === null ||
            endSeconds === null
        ) {

            return res.status(400).json({
                error:
                    "Tempo inválido. Use HH:MM:SS."
            });
        }

        if (
            endSeconds <= startSeconds
        ) {

            return res.status(400).json({
                error:
                    "O fim precisa ser maior que o início."
            });
        }

        // --------------------------------------
        // DURAÇÃO
        // --------------------------------------
        // Não existe mais limite artificial de 10 minutos.
        // O limite prático passa a ser o VOD, espaço em disco,
        // memória e capacidade de processamento da máquina do usuário.

        const duration =
            endSeconds -
            startSeconds;

        // --------------------------------------
        // ID ÚNICO
        // --------------------------------------

        const id =
            createId();

        const output =
            path.join(
                outputDir,
                `clip-${id}.mp4`
            );

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "CRIANDO CLIP DA TWITCH"
        );
        console.log(
            "ID:",
            id
        );
        console.log(
            "URL:",
            url
        );
        console.log(
            "Início:",
            start
        );
        console.log(
            "Fim:",
            end
        );
        console.log(
            "Duração:",
            secondsToTime(duration)
        );
        console.log(
            "================================"
        );

        // --------------------------------------
        // YT-DLP
        // --------------------------------------

        const section =
            `*${start}-${end}`;

        const args = [

            "--no-playlist",

            // Melhor combinação disponível
            "-f",
            "bestvideo+bestaudio/best",

            // Baixar somente a seção
            "--download-sections",
            section,

            // FFmpeg será usado para juntar
            "--merge-output-format",
            "mp4",

            // Arquivo temporário
            "-o",
            output,

            url
        ];

        console.log(
            "Executando yt-dlp..."
        );

        const ytDlp =
            spawn(
                ytDlpPath,
                args
            );

        let stderr = "";
        let responded = false;

        ytDlp.stdout.on(
            "data",
            data => {

                console.log(
                    data.toString().trim()
                );
            }
        );

        ytDlp.stderr.on(
            "data",
            data => {

                const text =
                    data.toString();

                stderr += text;

                console.log(
                    text.trim()
                );
            }
        );

        ytDlp.on(
            "error",
            error => {

                console.error(
                    "Erro ao iniciar yt-dlp:",
                    error
                );

                if (!responded) {

                    responded = true;

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "Erro ao iniciar yt-dlp: " +
                            error.message
                    });
                }
            }
        );

        ytDlp.on(
            "close",
            code => {

                if (responded) {
                    return;
                }

                console.log(
                    "yt-dlp terminou:",
                    code
                );

                if (code !== 0) {

                    console.error(
                        stderr
                    );

                    responded = true;

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "Não foi possível criar o clip."
                    });
                }

                if (
                    !fs.existsSync(output)
                ) {

                    responded = true;

                    return res.status(500).json({
                        error:
                            "O arquivo do clip não foi encontrado."
                    });
                }

                const stats =
                    fs.statSync(output);

                console.log("");
                console.log(
                    "================================"
                );
                console.log(
                    "CLIP CRIADO!"
                );
                console.log(
                    "Arquivo:",
                    output
                );
                console.log(
                    "Tamanho:",
                    (
                        stats.size /
                        1024 /
                        1024
                    ).toFixed(2),
                    "MB"
                );
                console.log(
                    "================================"
                );

                responded = true;

                res.json({
                    success: true,

                    download:
                        `/download/${path.basename(output)}`
                });

            }
        );
    }
);


// ==========================================
// DOWNLOAD DE CLIP
// ==========================================

app.get(
    "/download/:filename",
    (req, res) => {

        const filename =
            path.basename(
                req.params.filename
            );

        // Aceita somente nossos clips
        if (
            !filename.startsWith("clip-") ||
            !filename.endsWith(".mp4")
        ) {

            return res.status(400).send(
                "Arquivo inválido."
            );
        }

        const file =
            path.join(
                outputDir,
                filename
            );

        if (
            !fs.existsSync(file)
        ) {

            return res.status(404).send(
                "Clip não encontrado."
            );
        }

        res.download(
            file,
            "clip.mp4"
        );
    }
);


// ==========================================
// UPLOAD DE VÍDEO LOCAL
// ==========================================

app.post(
    "/api/upload",
    upload.single("video"),
    (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({
                    error:
                        "Nenhum vídeo foi enviado."
                });
            }

            const extension =
                path.extname(
                    req.file.originalname
                ).toLowerCase();

            const newPath =
                path.join(
                    inputDir,
                    "video" + extension
                );

            const files =
                fs.readdirSync(
                    inputDir
                );

            for (const file of files) {

                if (
                    file.startsWith("video.")
                ) {

                    removeFile(
                        path.join(
                            inputDir,
                            file
                        )
                    );
                }
            }

            fs.renameSync(
                req.file.path,
                newPath
            );

            console.log(
                "Vídeo local recebido:",
                newPath
            );

            res.json({
                success: true,
                filename:
                    "video" + extension
            });

        } catch (error) {

            console.error(
                "Erro no upload:",
                error
            );

            if (
                req.file &&
                req.file.path
            ) {

                removeFile(
                    req.file.path
                );
            }

            res.status(500).json({
                error:
                    "Erro ao salvar o vídeo."
            });
        }
    }
);


// ==========================================
// CLIP DE VÍDEO LOCAL
// ==========================================

app.post(
    "/api/clip",
    (req, res) => {

        const {
            start,
            end
        } = req.body;

        const startSeconds =
            timeToSeconds(start);

        const endSeconds =
            timeToSeconds(end);

        if (
            startSeconds === null ||
            endSeconds === null
        ) {

            return res.status(400).json({
                error:
                    "Formato inválido. Use HH:MM:SS."
            });
        }

        if (
            endSeconds <= startSeconds
        ) {

            return res.status(400).json({
                error:
                    "O fim precisa ser maior que o início."
            });
        }

        const files =
            fs.readdirSync(
                inputDir
            );

        const videoFile =
            files.find(
                file =>
                    file.startsWith("video.")
            );

        if (!videoFile) {

            return res.status(400).json({
                error:
                    "Nenhum vídeo foi selecionado."
            });
        }

        const input =
            path.join(
                inputDir,
                videoFile
            );

        const id =
            createId();

        const output =
            path.join(
                outputDir,
                `clip-${id}.mp4`
            );

        const duration =
            endSeconds -
            startSeconds;

        console.log(
            "Criando clip local:",
            start,
            "→",
            end
        );

        const ffmpeg =
            spawn(
                ffmpegPath,
                [
                    "-ss",
                    start,

                    "-i",
                    input,

                    "-t",
                    duration.toString(),

                    "-map",
                    "0",

                    "-c",
                    "copy",

                    "-y",
                    output
                ]
            );

        let errorOutput = "";

        ffmpeg.stderr.on(
            "data",
            data => {

                errorOutput +=
                    data.toString();
            }
        );

        ffmpeg.on(
            "error",
            error => {

                console.error(
                    error
                );

                removeFile(output);

                return res.status(500).json({
                    error:
                        "Não foi possível iniciar o FFmpeg."
                });
            }
        );

        ffmpeg.on(
            "close",
            code => {

                if (code !== 0) {

                    console.error(
                        errorOutput
                    );

                    removeFile(output);

                    return res.status(500).json({
                        error:
                            "Erro ao processar o vídeo."
                    });
                }

                res.json({
                    success: true,

                    download:
                        `/download/${path.basename(output)}`
                });
            }
        );
    }
);


// ==========================================
// HEALTH CHECK
// ==========================================

app.get(
    "/health",
    (req, res) => {

        res.json({
            status: "ok",
            service: "twitch-clipper"
        });
    }
);


// ==========================================
// SERVIDOR
// ==========================================

const server = app.listen(
    PORT,
    "127.0.0.1",
    () => {

        console.log("");
        console.log(
            "================================"
        );
        console.log(
            "       TWITCH CLIPPER"
        );
        console.log(
            "================================"
        );
        console.log(
            `Servidor: http://localhost:${PORT}`
        );
        console.log(
            "yt-dlp:",
            ytDlpPath
        );
        console.log(
            "ffmpeg:",
            ffmpegPath
        );
        console.log(
            "================================"
        );
        console.log("");
    }
);

global.__TWITCH_CLIPPER_SERVER__ = server;
module.exports = server;
