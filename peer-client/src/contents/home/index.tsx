import Link from "next/link";
import { useMemo } from "react";
import { Container } from "./styles";

export function HomeContent() {
  const roomId = useMemo(() => (new Date().getTime().toString()), [])

  return(
    <Container>
      <h1>Using peer to peer</h1>

      <Link href={`/room/${roomId}`} >
        <button>New room</button>
      </Link>
    </Container>
  )
}