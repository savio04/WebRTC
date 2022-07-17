import type { GetServerSideProps, NextPage } from 'next'

export default function Index() {
  return <></>
}


export const getServerSideProps: GetServerSideProps = async (context) => {

  return {
    props: {},
    redirect: {
      destination: '/home',
      permanent: false
    }
  }
}