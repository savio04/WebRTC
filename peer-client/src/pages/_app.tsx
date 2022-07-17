import type { AppProps } from 'next/app'
import { RoomProvider } from '../context/RoomContext'
import { GlobalStyle } from '../styles/GlobalStyles'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyle />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
