import { useEffect, useRef } from "react"

interface IVideoProps {
  stream: MediaStream;
}

export function Video({ stream }: IVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if(videoRef.current)
      videoRef.current.srcObject = stream
  },[stream])

  return (
    <video style={{ borderRadius: '1rem' }} ref={videoRef} autoPlay playsInline></video>
  )
}