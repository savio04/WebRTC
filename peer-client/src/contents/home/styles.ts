import styled from "styled-components";

export const Container = styled.div`
  width: 100%;
  height: 100vh;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;


  button {
    background: none;

    border: 1px solid black;
    padding: 1rem;
    border-radius: 0.5rem;
    margin-top: 5rem;
    cursor: pointer;
    &:hover {
      opacity: 0.5;
    }
  }
`;