import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Draggable } from "../../components/LocalVideo";
import { Video } from "../../components/Video";
import { pc_config } from "../../constants";
import { useRoomContext } from "../../context/RoomContext";
import { ButtonsContainer, Container, ContainerVideos, LocalVideo, RemoteVideo } from "./styles";

interface IRoomContentProps {
  roomId: string;
}

export function RoomContent({ roomId }: IRoomContentProps) {
  const socket = useRef<Socket<any, any> | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const peersConnection = useRef<any>();

  const localStream = useRef<MediaStream>();
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; name: string; stream: MediaStream }[]>([]);
  const remoteStreasmRef = useRef<{ id: string; name: string; stream: MediaStream }[]>([])

  //
  const [pressed, setPressed] = useState(false)
  const [position, setPosition] = useState<{x: number; y: number;} | null>(null)
  
  //Criar Peer quando um usuario está online
  function CreatePeerConnection(socketID: string) {
    try{
      console.log("create peer for", socketID)
      const newPeerConnection = new RTCPeerConnection(pc_config)
  
      peersConnection.current = {...peersConnection.current, [socketID]: newPeerConnection}

      newPeerConnection.onicecandidate = (event) => {
        if(event.candidate) {
          socket.current?.emit('candidate', { payload: event.candidate, socketID: { local: socket.current.id, remote: socketID } })
        }
      }

      newPeerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams
        
        const remoteVideo = {
          id: socketID,
          name: socketID,
          stream: remoteStream
        }

        if(remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream
        }
        
        setRemoteStreams(prevState => {
          const existsStream = prevState.findIndex(video => video.id === remoteVideo.id)
          
          if(existsStream < 0) {
            remoteStreasmRef.current = [...prevState, remoteVideo]
            return [...prevState, remoteVideo]
          }

          remoteStreasmRef.current = prevState
          return prevState
        })
      }

      if(localStream.current) {
        localStream.current.getTracks().forEach(track => {
          newPeerConnection.addTrack(track, localStream.current as MediaStream)
        })
      }

      return newPeerConnection
    }catch(error) {
      console.log("error", error)
    }
  }

  //Salvar stream local
  //Emitir evento de novo peer online
  const getLocalStream = useCallback(async () => {
    try{
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user'},
      })

      if(localVideo.current) {
        localVideo.current.srcObject = stream
        localStream.current = stream

        //Emite que tem um novo usuario online
        socket.current?.emit('onlinePeers', { payload: null, socketID: { local: socket.current.id } })
      }

    }catch(error) {
      alert("Precisa permitir audio e video para prosseguir")
      console.log("getUserMedia error", error)
    }
  },[])


  useEffect(() => {
    if(!socket.current) {
      socket.current = io('http://localhost:3001/webrtc', { query: { roomName: roomId } })
      
      //connection sucess
      socket.current.on('connection-success', (data: any) => {
        console.log('connection', data.success)

        getLocalStream()
      })

      //peer disconnected
      socket.current.on('peer-disconnected', (data: any) => {
        console.log("data", data)
        const remoteStremDeleted = remoteStreasmRef.current.filter(stream => String(stream.id) !== String(data.socketID))
        setRemoteStreams(remoteStremDeleted)
      })

      socket.current.on('online-peer', async (socketID: string) => {
        // create and send offer to the peer (data.socketID)
        // 1. Create new pc
        const peerConnection = CreatePeerConnection(socketID)

        // 2. Create Offer
        if (peerConnection) {
          const sdp = await peerConnection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })

          await peerConnection.setLocalDescription(sdp)

          socket.current?.emit('offer', { payload: sdp, socketID: { local: socket.current.id, remote: socketID } })
        }
      })

      socket.current.on('offer', async (data: any) => {
        //1. created peer
        const peerConnection =  CreatePeerConnection(data.socketID)

        //2.peer
        if(peerConnection) {
          try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
    
            const sdp = await peerConnection.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
  
            await peerConnection.setLocalDescription(sdp)
            socket.current?.emit('answer', { payload: sdp, socketID: { local: socket.current.id, remote: data.socketID } })
          }catch(err) {
            console.log("erro ", err)
          }
        }
      })
  
      socket.current.on('answer', async (data: any) => {
        // get remote's peerConnection
        const peerConnection = peersConnection.current[data.socketID]
        
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp))
      })
  
      socket.current.on('candidate', (data: any) => {
        // get remote's peerConnection
        console.log("candidate", data)
        console.log("peersConnection.current", peersConnection.current)
        const peerConnection = peersConnection.current[data.socketID]
  
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
      })
    }

    return () => {
      if(socket.current) {
        socket.current.disconnect()
        socket.current = null
      }
    }
  }, [getLocalStream, roomId])


  return (
    <Container>
      <Draggable 
        style={{
          zIndex: 1,
          position: 'absolute',
          right: '2rem',
          bottom: '2rem',
          cursor: 'move'
        }}
      >
        <LocalVideo 
          ref={localVideo}
          muted 
          playsInline 
          autoPlay
          ></LocalVideo>
      </Draggable>
      
      <ContainerVideos>
        {remoteStreams.length > 0 ? (
          <div>
          {remoteStreams.map(remoteVideo => (
            <Video 
              key={remoteVideo.id}
              stream={remoteVideo.stream}
            />
          ))}
        </div>
        ) : (
          <span>
            <h2>Só você esta aqui!</h2>
            <h3>Convide mais pessoas compartilhando o link abaixo</h3>
            <p>{`http://localhost:3000/room/${roomId}`}</p>
          </span>
        )}
      </ContainerVideos>
    </Container>
  )
}