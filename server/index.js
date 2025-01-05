// Importamos la dependencia 'Express'
import express from 'express'
// Importamos el logger
import logger from 'morgan'

// Añadir puerto por variable de entorno 
// que sea el 3000
const port = process.env.PORT ?? 3000

// Iniciamos la aplicación llamando a Express
const app = express()
// Usamos el logger
app.use(logger('dev'))

// Manda el archivo de HTML para mostrar en el navegador
app.get('/',(req, res)=> {
    res.sendFile(process.cwd() + '/cliente/index.html')
})

//Iniciamos el servidor para que escuche por un puerto
app.listen(port, () => {
    console.log('Server running in port ' + port)
})