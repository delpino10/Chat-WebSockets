// Importamos la dependencia 'Express'
import express from 'express'
// Importamos el logger
import logger from 'morgan'

// importamos de Socket.io
import { Server } from 'socket.io'
import { createServer } from 'node:http'

// Añadir puerto por variable de entorno 
// que sea el 3000
const port = process.env.PORT ?? 3000

// Iniciamos la aplicación llamando a Express
const app = express()

// Creamos el servidor http
const server = createServer(app)
// Entrada y salida del Servidor. Creamos el Socket
const io =  new Server(server, {
    connectionStateRecovery:{
        maxDisconnectionDuration: 12000
    }
})

// Cuando el socket (io) tenga una conexión, ejecutamos lo que dentro de la función
io.on('connection', (socket) =>{
    console.log('Se ha conectado un usuario')

    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado')
    })

    socket.on('chat message', (msg) =>{
        // muestra el mensaje por consola
        console.log("Mensaje: " + msg)
        // Emite el mensaje a todos los clientes
        io.emit('chat message', msg)
    })

    

    
})

// Usamos el logger
app.use(logger('dev'))

// Manda el archivo de HTML para mostrar en el navegador
app.get('/',(req, res)=> {
    // El archivo se encuentra el Working directory donde se inicio
    // el proyecto (Chat-WebSockets) + la ruta del index.html
    res.sendFile(process.cwd() + '/cliente/index.html')
})

//Iniciamos el servidor para que escuche por un puerto
server.listen(port, () => {
    console.log('Server running in port ' + port)
})