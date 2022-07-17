import { GetServerSideProps } from "next"
import { RoomContent } from "../../contents/room"

interface IRoomProps {
  roomId: string;
}

export default function Room({ roomId }: IRoomProps) {
  return <RoomContent roomId={roomId} />
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { roomId } = context.query

  return {
    props: {
      roomId,
    }
  }

}