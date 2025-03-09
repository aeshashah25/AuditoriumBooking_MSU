import React from 'react'
//import '../styles/Global.css'
import Navbar from '../components/Navbar'
import Banner from '../components/Banner'
import Footer from '../components/Footer'
import Archivements from '../components/Archivements'
import Feedback from '../components/Feedback'
import About from '../about/About'
//import Header from '../components/Header'

function Home() {
    return (
        <>
            <Navbar />
            <Banner />
            {/* <AudtDetails />*/}
            <About />
            {/* {<Archivements />*/}
            <Feedback />
            <Footer />
        </>
    )
}

export default Home
