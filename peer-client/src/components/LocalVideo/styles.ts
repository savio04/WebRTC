import styled from 'styled-components'

export const Container = styled.div`
  cursor: move;
`;

export const Video = styled.video`
  width: 20rem;
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);

  position: fixed;
  z-index: 1;
  right: 2rem;
  bottom: 2rem;

  max-width: 100%;

  @media (max-width: 425px){
    width: 10rem;
  }
`;