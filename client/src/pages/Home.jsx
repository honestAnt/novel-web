import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import StoryCard from '../components/StoryCard'
import styles from './Home.module.css'

function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [stories, setStories] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState([])

  const currentGenre = searchParams.get('genre') || ''
  const currentSearch = searchParams.get('search') || ''

  useEffect(() => {
    const saved = localStorage.getItem('novel_collections')
    if (saved) {
      setCollections(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    fetchGenres()
  }, [])

  useEffect(() => {
    fetchStories()
  }, [currentGenre, currentSearch])

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/genres')
      const data = await res.json()
      setGenres(data)
    } catch (error) {
      console.error('Failed to fetch genres:', error)
    }
  }

  const fetchStories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentGenre) params.append('genre', currentGenre)
      if (currentSearch) params.append('search', currentSearch)
      params.append('limit', '20')

      const res = await fetch(`/api/stories?${params}`)
      const data = await res.json()
      setStories(data.stories || [])
    } catch (error) {
      console.error('Failed to fetch stories:', error)
      setStories([])
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCollect = (storyId) => {
    let newCollections
    if (collections.includes(storyId)) {
      newCollections = collections.filter(id => id !== storyId)
    } else {
      newCollections = [...collections, storyId]
    }
    setCollections(newCollections)
    localStorage.setItem('novel_collections', JSON.stringify(newCollections))
  }

  const handleGenreClick = (genre) => {
    if (genre === currentGenre) {
      setSearchParams({})
    } else {
      setSearchParams({ genre })
    }
  }

  const clearSearch = () => {
    setSearchParams({})
  }

  return (
    <div className={styles.home}>
      <div className="container">
        {/* 分类筛选 */}
        <div className={styles.genreFilter}>
          <button
            className={`${styles.genreBtn} ${!currentGenre ? styles.active : ''}`}
            onClick={() => setSearchParams({})}
          >
            全部
          </button>
          {genres.map(genre => (
            <button
              key={genre}
              className={`${styles.genreBtn} ${currentGenre === genre ? styles.active : ''}`}
              onClick={() => handleGenreClick(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* 搜索结果提示 */}
        {currentSearch && (
          <div className={styles.searchInfo}>
            <span>搜索: "{currentSearch}"</span>
            <span className={styles.resultCount}>找到 {stories.length} 部小说</span>
            <button onClick={clearSearch} className={styles.clearBtn}>
              ✕ 清除
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : stories.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📚</span>
            <p>暂无小说</p>
          </div>
        ) : (
          /* 小说列表 */
          <div className={styles.storyGrid}>
            {stories.map((story, index) => (
              <div key={story.story_id || story.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <StoryCard
                  story={story}
                  isCollected={collections.includes(story.story_id || story.id)}
                  onToggleCollect={handleToggleCollect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
