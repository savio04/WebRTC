import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Draggable } from "../../components/LocalVideo";
import { Video } from "../../components/Video";
import { pc_config } from "../../constants";
import { useRoomContext } from "../../context/RoomContext";
import { ButtonsContainer, ButtonsContainerLocaVideo, Container, ContainerVideos, LocalVideo, RemoteVideo } from "./styles";
import { BiMicrophone, BiMicrophoneOff, BiVideo, BiVideoOff } from 'react-icons/bi'
import { FiPhone, FiPhoneOff } from 'react-icons/fi'
import Link from "next/link";

interface IRoomContentProps {
  roomId: string;
}

export function RoomContent({ roomId }: IRoomContentProps) {
  const socket = useRef<Socket<any, any> | null>(null);
  const localVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peersConnection = useRef<any>();

  const localStream = useRef<MediaStream>();
  const [remoteStreams, setRemoteStreams] = useState<{ id: string; name: string; stream: MediaStream }[]>([]);
  const remoteStreasmRef = useRef<{ id: string; name: string; stream: MediaStream }[]>([])

  const [mic, setMic] = useState(false)
  const [video, setVideo] = useState(false)

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
        //
        setMic(true)
        setVideo(true)
      }

    }catch(error) {
      alert("Precisa permitir audio e video para prosseguir")
      console.log("getUserMedia error", error)
    }
  },[])


  const mutMic = () => {
    if(localVideo.current?.srcObject) {
      const localVideoData = localVideo.current.srcObject as MediaStream

      const stream = localVideoData.getTracks().filter(track => track.kind === 'audio')

      if(stream) {
        stream[0].enabled = !mic
        setMic((prevState) => !prevState)
      }
    }
  }

  const mutVideo = () => {
    if(localVideo.current?.srcObject) {
      const localVideoData = localVideo.current.srcObject as MediaStream

      const stream = localVideoData.getTracks().filter(track => track.kind === 'video')

      if(stream) {
        stream[0].enabled = !video
        setVideo((prevState) => !prevState)
      }
    }
  }

  useEffect(() => {
    console.log("process.env.NEXT_PUBLIC_SERVER", process.env.NEXT_PUBLIC_SERVER)
    if(!socket.current) {
      socket.current = io(`${process.env.NEXT_PUBLIC_SERVER}/webrtc`, { query: { roomName: roomId } })
      
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
        />
          
        <ButtonsContainerLocaVideo mic={mic} video={video}>
          <span>
            <button onClick={mutMic} className="mic">
              {mic ? <BiMicrophone size={20} /> : <BiMicrophoneOff size={20} />}
            </button>

            <Link href={'/home'}>
              <button>
                <FiPhone size={20}  />
              </button>
            </Link>

            <button onClick={mutVideo} className="video">
              {video ? <BiVideo  size={20}/> : <BiVideoOff size={20}/> }
            </button>
          </span>
        </ButtonsContainerLocaVideo>
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
            <p>{`${process.env.NEXT_PUBLIC_BASEURL}/room/${roomId}`}</p>
          </span>
        )}
      </ContainerVideos>
    </Container>
  )
}