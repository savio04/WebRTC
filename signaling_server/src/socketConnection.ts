import { Express } from "express";
import http from "http";
import { Server } from "socket.io";

interface IRoomProps {
  [key: string]: Map<any, any>;
}

export class SocketConnection {
  private app: Express;
  private rooms = {} as IRoomProps;
  public server = {} as http.Server;

  constructor(app: Express) {
    this.app = app;
  }

  createSocketConnection() {
    this.server = http.createServer(this.app);

    const io = new Server(this.server, {
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("connected");
    });

    const connections = io.of("/webrtc");

    connections.on("connection", (socket) => {
      console.log("new connection", { socketId: socket.id });

      const roomName = socket.handshake.query.roomName as string;

      if (Reflect.has(this.rooms, roomName)) {
        this.rooms[roomName].set(socket.id, socket);
      } else {
        this.rooms[roomName] = new Map();
        this.rooms[roomName].set(socket.id, socket);
      }

      socket.emit("connection-success", {
        success: socket.id,
        peersConnection: this.rooms[roomName].size,
      });

      //Signals the other peers
      this.broadcast(roomName);

      socket.on("disconnect", () => {
        console.log("disconnected");
        this.rooms[roomName].delete(socket.id);
        this.disconnectedPeer(roomName, socket.id);
      });

      socket.on("onlinePeers", (data) => {
        const _connectedPeers = this.rooms[roomName];

        for (const [socketID, _socket] of _connectedPeers.entries()) {
          if (socketID !== data.socketID.local) {
            console.log("new peer online", socketID);
            socket.emit("online-peer", socketID);
          }
        }
      });

      socket.on("offer", (data) => {
        const _connectedPeers = this.rooms[roomName];

        //Dentro de _connectedPeers tenho o id da conexão e o socket object
        for (const [socketID, _socket] of _connectedPeers.entries()) {
          //Não emite apenas para o creador da offer
          if (socketID === data.socketID.remote) {
            _socket.emit("offer", {
              sdp: data.payload,
              socketID: data.socketID.local,
            });
          }
        }
      });

      socket.on("answer", (data) => {
        const _connectedPeers = this.rooms[roomName];

        for (const [socketID, _socket] of _connectedPeers.entries()) {
          //Se tiver apenas essa pessoa não emite
          if (socketID === data.socketID.remote) {
            _socket.emit("answer", {
              sdp: data.payload,
              socketID: data.socketID.local,
            });
          }
        }
      });

      socket.on("candidate", (data) => {
        const _connectedPeers = this.rooms[roomName];

        for (const [socketID, _socket] of _connectedPeers.entries()) {
          //Se tiver apenas essa pessoa não emite
          if (socketID === data.socketID.remote) {
            _socket.emit("candidate", {
              candidate: data.payload,
              socketID: data.socketID.local,
            });
          }
        }
      });
    });

    return this;
  }

  listnerServer(msg: string, port = 3001,) {
    this.server.listen(port, () => {
      console.log(`${msg}`);
    });
  }

  private broadcast(roomName: string) {
    const _connectedPeers = this.rooms[roomName];

    for (const [socketID, socket] of _connectedPeers.entries()) {
      if (socketID !== socket.id) {
        socket.emit("joined-peers", {
          peerCount: this.rooms[roomName].size,
        });
      }
    }
  }

  private disconnectedPeer(roomName: string, socketID: string) {
    //Avisa todos da room que um peer desconectou
    const _connectedPeers = this.rooms[roomName];

    for (const [_socketID, _socket] of _connectedPeers.entries()) {
      _socket.emit("peer-disconnected", {
        peerCount: this.rooms[roomName].size,
        socketID,
      });
    }
  }
}
