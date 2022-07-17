import 'dotenv/config'
import express, { Express } from 'express';
import { createServer } from 'http'
import { Server } from 'socket.io'

let app: Express;
const rooms: any = {}

main()

function main() {
  //create HTTP server
  createHttpServer()

  //create SOCKET connection
  createSocketConnection()
}


function createHttpServer() {
  app = express()

  app.use(express.json())

  app.get('*', (request, response) => {
    return response.json({ message: '404' })
  })

}

function createSocketConnection() {
  const server = createServer(app)

  server.listen(process.env.PORT, () => {
    console.log(`Api inciciada na porta ${process.env.PORT}...`)
  })

  const io = new Server(server, {
    cors: {
      origin: '*'
    }
  })


  io.on('connection', (socket) => {
    console.log("connected")
  })

  const peers = io.of('/webrtc')

  peers.on('connection', (socket) => {
    console.log("new connection", { socketId: socket.id })
    
    const roomName = socket.handshake.query.roomName as string;

    if(rooms[roomName]) {
      rooms[roomName].set(socket.id, socket)
    }else {
      rooms[roomName] = new Map()
      rooms[roomName].set(socket.id, socket)
    }


    socket.emit('connection-success', {
      success: socket.id,
      peersConnection: rooms[roomName].size
    })
  
    socket.on('disconnect', () => {
      console.log('disconnected')
      // _connectedPeers.delete(socket.id)
      rooms[roomName].delete(socket.id)
      disconnectedPeer(socket.id)
    })

    function broadcast() {
      const _connectedPeers = rooms[roomName]

      for(const [socketID, socket] of _connectedPeers.entries()) {
        if(socketID !== socket.id) {
          socket.emit('joined-peers', {
            peerCount: rooms[roomName].size
          })
        }
      }
    }
  
    broadcast()


    function disconnectedPeer(socketID: string) {
      //Avisa todos da room que um peer desconectou
      const _connectedPeers = rooms[roomName]

      for(const [_socketID, _socket] of _connectedPeers.entries()) {
        _socket.emit('peer-disconnected', {
          peerCount: rooms[roomName].size,
          socketID
        })
      }
    }

    socket.on('onlinePeers', data => {
      const _connectedPeers = rooms[roomName]

      for (const [socketID, _socket] of _connectedPeers.entries()) {
        if(socketID !== data.socketID.local) {
          console.log('new peer online', socketID)
          socket.emit('online-peer', socketID)
        }
      }
    })

    socket.on('offer', data => {
      const _connectedPeers = rooms[roomName]
     
      //Dentro de _connectedPeers tenho o id da conexão e o socket object
      for (const [socketID, _socket] of _connectedPeers.entries()) {
        //Não emite apenas para o creador da offer
        if(socketID === data.socketID.remote) {
          _socket.emit('offer', {
            sdp: data.payload,
            socketID: data.socketID.local
          })
        }
      }
    })
  
    socket.on('answer', (data) => {
      const _connectedPeers = rooms[roomName]

      for (const [socketID, _socket] of _connectedPeers.entries()) {
        //Se tiver apenas essa pessoa não emite
        if(socketID === data.socketID.remote) {
          _socket.emit('answer', {
            sdp: data.payload,
            socketID: data.socketID.local
          })
        }
      }
    })

    socket.on('candidate', (data) => {
      const _connectedPeers = rooms[roomName]

      for (const [socketID, _socket] of _connectedPeers.entries()) {
        //Se tiver apenas essa pessoa não emite
        if(socketID === data.socketID.remote) {
          _socket.emit('candidate', {
            candidate: data.payload,
            socketID: data.socketID.local
          })
        }
      }
    })
  
  })
}



