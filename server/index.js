// Importamos la dependencia 'Express'
import express from 'express'
// Importamos el logger
import logger from 'morgan'
// importamos de Socket.io
import { Server } from 'socket.io'
import { createServer } from 'node:http'
// importamos dotenv para leer las variables de entorno
import dotenv from 'dotenv'
//El paquete @libsql/client es utilizado para conectarse a una base de datos LibSQL 
// (o una compatible con SQLite) desde aplicaciones Node.js o JavaScript.
import { createClient } from '@libsql/client'

// Leerlas variables de entorno
dotenv.config()

// Añadir puerto por variable de entorno 
// o que sea el 3000
const port = process.env.PORT ?? 3000

// Iniciamos la aplicación llamando a Express
const app = express()

// Creamos el servidor http y le pasamos la app
const server = createServer(app)

// Entrada y salida del Servidor. Creamos el Socket de entrada y salida
const io =  new Server(server, {
    connectionStateRecovery:{
        maxDisconnectionDuration: 12000
    }
})

// Conectamos la Base de Datos
const bd = createClient({
    url: "libsql://star-captain-flint-delpino10.turso.io",
    authToken:process.env.DB_TOKEN
})

// Iniciamos la BD y creamos una tabla
await bd.execute(`
    CREATE TABLE IF NOT EXISTS messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        user TEXT
    )
    `)

// Cuando el socket (io) tenga una conexión, ejecutamos lo que dentro de la función
io.on('connection', async (socket) =>{

    console.log('Se ha conectado un usuario')

    // Cuando el cliente se desconecta
    socket.on('disconnect', () => {
        console.log('Un usuario se ha desconectado')
    })

    // El servidor recibe el mensaje del Cliente
    socket.on('chat message', async (msg) =>{
        let result
        const username = socket.handshake.auth.username ?? 'anónimo'
        console.log({username})

        try{
            result = await bd.execute({
                sql: 'INSERT INTO messages (content, user) VALUES (:msg, :username)',
                args: {msg, username}
            })
        }catch (e){
            console.error(e)
            return
        }

        // muestra el mensaje por consola
        console.log("Mensaje: " + msg)


        // Emite el mensaje a todos los clientes
        // Rescata el último mensaje de la BD mediante su id que se ha mandado
        io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
    })

    if(!socket.recovered){// <- Recuperar los mensaje sin conexion
        try{
            const results = await bd.execute({
                sql:'SELECT id, content, user FROM messages WHERE id > ?',
                args:[socket.handshake.auth.serverOffset ?? 0]
            })

            results.rows.forEach(row => {
                socket.emit('chat message', row.content, row.id.toString(), row.user)
            })
        }catch (e){
            console.error(e)
            return
        }
    } 
    
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