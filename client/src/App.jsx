import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import StoryDetail from './pages/StoryDetail'
import Reader from './pages/Reader'
import Collections from './pages/Collections'

function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/story/:id" element={<StoryDetail />} />
          <Route path="/story/:storyId/chapter/:chapterId" element={<Reader />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
