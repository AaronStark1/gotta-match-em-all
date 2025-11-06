import { useState } from 'react'

import './App.css'
import LandingPage from './pages/LandingPage'
import { Route, Routes } from 'react-router-dom'
import Game from './pages/Game'
import PageNotFound from './pages/PageNotFound'

function App() {


  return (
    <Routes>
      <Route path='/' element={<LandingPage/>}/>
      <Route path='/play' element={<Game/>}/>
      <Route path='*' element={<PageNotFound/>}/>
    </Routes>
  )
}

export default App
