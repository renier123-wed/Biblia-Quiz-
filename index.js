const fs = require('fs');
const Path = require('path');
 
const origenDir = Path.join(__dirname, 'origen');
const procesadosDir = Path.join(__dirname, 'procesados');
 
// 1. Asegurarse de que el directorio 'procesados' exista. Si no, lo crea.
if (!fs.existsSync(procesadosDir)) {
    fs.mkdirSync(procesadosDir);
    console.log(`Directorio 'procesados' creado.`);
}
 
// 2. Leer todos los archivos del directorio 'origen'.
fs.readdir(origenDir, (err, files) => {
    if (err) {
        return console.error("Error: No se pudo leer el directorio 'origen'. Asegúrate de que la carpeta exista.", err);
    }
 
    // 3. Procesar cada archivo .txt que se encuentre.
    files.forEach(file => {
        if (Path.extname(file).toLowerCase() === '.txt') {
            const filePath = Path.join(origenDir, file);
            const bookName = Path.basename(file, '.txt'); // ej: 'genesis', 'apocalipsis'
 
            fs.readFile(filePath, 'utf-8', (error, data) => {
                if (error) {
                    return console.error(`Error al leer el archivo ${file}:`, error);
                }
 
                // Estructura para guardar los capítulos y versículos: [[v1, v2], [v1, v2]]
                const bookData = [];
 
                // Dividir el archivo en líneas y procesar cada una.
                const lines = data.split('\n');
 
                lines.forEach(line => {
                    // Expresión regular mejorada para capturar el formato (num, cap, ver, 'texto...'),
                    // Es más robusta y maneja comillas y otros caracteres dentro del texto.
                    const match = line.match(/^\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'(.*)'\s*\),?$/);
 
                    if (match) {
                        const chapterNum = parseInt(match[1], 10);
                        const verseNum = parseInt(match[2], 10);
                        let verseText = match[3];
 
                        // Escapar comillas simples y barras invertidas dentro del texto para que no rompan el string de JavaScript.
                        verseText = verseText.replace(/'/g, "\\'");
 
                        // El índice del array es el número de capítulo - 1.
                        const chapterIndex = chapterNum - 1;
                        const verseIndex = verseNum - 1;
 
                        // Asegurarse de que el array para el capítulo exista.
                        if (!bookData[chapterIndex]) {
                            bookData[chapterIndex] = [];
                        }
 
                        // Añadir el versículo en su posición correcta.
                        bookData[chapterIndex][verseIndex] = verseText;
                    }
                });
 
                // 4. Formatear el contenido para el archivo JS de salida.
                const outputContent = `export default [\n${bookData
                    .map(chapter => `  [${(chapter || []).map(verse => `'${verse || ''}'`).join(',')}]`) // Rellena versículos vacíos si los hay
                    .join(',\n')}\n];`;
 
                const outputPath = Path.join(procesadosDir, `${bookName}.js`);
                fs.writeFile(outputPath, outputContent, 'utf-8', (err) => {
                    if (err) {
                        console.error(`Error al escribir el archivo ${bookName}.js:`, err);
                    } else {
                        console.log(`✔ Archivo ${bookName}.js generado exitosamente.`);
                    }
                });
            });
        }
    });
});