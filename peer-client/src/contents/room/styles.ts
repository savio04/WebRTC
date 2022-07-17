import styled from "styled-components";

export const Container = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
`;

export const LocalVideo = styled.video`
  width: 20rem;
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);

  z-index: 101;
  max-width: 100%;

  border-radius: 1rem;

  @media (max-width: 425px){
    width: 10rem;
  }
`;

export const ContainerVideos = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  div {
    width: 70%;
    max-height: 100vh;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 45%));
    grid-gap: 1rem;
    align-items: center;
    justify-content: center;
  }

  video {
    /* width: fit-content; */
    width: 100%;
    -webkit-transform: scaleX(-1);
    transform: scaleX(-1);
  }

  span {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    flex-direction: column;

    @media (max-width: 425px){
      width: 90%;
    }
  }
`;

export const RemoteVideo = styled.video`
  min-width: 100%;
  min-height: 100%;
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);

  overflow: hidden;
`;

export const ButtonsContainer = styled.div`
  position: fixed;
  left: 0;
  top: 0;
`;