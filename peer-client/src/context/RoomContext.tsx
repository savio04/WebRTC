import { createContext, ReactNode, useContext, useState } from "react";
import { io, Socket } from "socket.io-client";

interface IRoomContext {
  socket: Socket<any, any> | null;
  socketInitializer: () => void;
  teste: string;
}

interface IRoomProvider {
  children: ReactNode;
}
const RoomContext = createContext({} as IRoomContext);

export function RoomProvider({ children }: IRoomProvider) {
  const [socket, setSocket] = useState<Socket<any, any> | null>(null)
  const teste = 'hvbdskjhvbsdhbvsjhdbv'

  function socketInitializer() {
    if(!socket) {
      const connection = io('http://localhost:3001/webrtc')
      setSocket(connection)
    }
  }

  return (
    <RoomContext.Provider value={{ socket, socketInitializer, teste }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoomContext = () => useContext(RoomContext)