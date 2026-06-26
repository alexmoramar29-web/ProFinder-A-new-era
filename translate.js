const fs = require('fs');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: '' });

async function traducirArchivo() {
    const json = JSON.parse(fs.readFileSync('./src/locales/en/translation.json', 'utf-8'));
    
    const respuesta = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: `Traduce este JSON al español manteniendo las llaves igual: ${JSON.stringify(json)}` }]
    });

    const traducido = JSON.parse(respuesta.choices[0].message.content);
    fs.writeFileSync('./src/locales/es/translation.json', JSON.stringify(traducido, null, 2));
    console.log("¡Traducción completada con éxito!");
}

traducirArchivo();