const { spawn } = require("child_process");
const path = require("path");

const input = path.join(__dirname, "..", "input", "video.mp4");
const output = path.join(__dirname, "..", "output", "clip.mp4");

const start = process.argv[2];
const end = process.argv[3];

function timeToSeconds(time) {
    const parts = time.split(":").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return null;
    }

    const [hours, minutes, seconds] = parts;

    if (minutes >= 60 || seconds >= 60) {
        return null;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

if (!start || !end) {
    console.error("Uso:");
    console.error("node src\\clip.js HH:MM:SS HH:MM:SS");
    process.exit(1);
}

const startSeconds = timeToSeconds(start);
const endSeconds = timeToSeconds(end);

if (startSeconds === null || endSeconds === null) {
    console.error("Formato de tempo inválido.");
    console.error("Exemplo: 00:10:25 00:11:40");
    process.exit(1);
}

if (endSeconds <= startSeconds) {
    console.error("O tempo final precisa ser maior que o tempo inicial.");
    process.exit(1);
}

const duration = endSeconds - startSeconds;

console.log("================================");
console.log("       TWITCH CLIPPER");
console.log("================================");
console.log(`Início:   ${start}`);
console.log(`Fim:      ${end}`);
console.log(`Duração:  ${duration} segundos`);
console.log(`Entrada:  ${input}`);
console.log(`Saída:    ${output}`);
console.log("================================");
console.log("Iniciando FFmpeg...\n");

const ffmpeg = spawn("ffmpeg", [
    "-ss", start,
    "-i", input,
    "-t", duration.toString(),
    "-map", "0",
    "-c", "copy",
    "-y",
    output
]);

ffmpeg.stderr.on("data", (data) => {
    process.stdout.write(data.toString());
});

ffmpeg.on("close", (code) => {
    if (code === 0) {
        console.log("\n================================");
        console.log("Clip criado com sucesso!");
        console.log(`Arquivo: ${output}`);
        console.log("================================");
    } else {
        console.error(`\nFFmpeg terminou com código ${code}`);
        process.exit(code);
    }
});