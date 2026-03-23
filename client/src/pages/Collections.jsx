import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StoryCard from '../components/StoryCard'
import styles from './Collections.module.css'

function Collections() {
  const [collections, setCollections] = useState([])
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('novel_collections')
    if (saved) {
      const ids = JSON.parse(saved)
      setCollections(ids)
      fetchStories(ids)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchStories = async (ids) => {
    if (ids.length === 0) {
      setStories([])
      setLoading(false)
      return
    }

    try {
      const allStories = []
      for (const id of ids) {
        const res = await fetch(`/api/stories/${id}`)
        if (res.ok) {
          const data = await res.json()
          allStories.push(data)
        }
      }
      setStories(allStories)
    } catch (error) {
      console.error('Failed to fetch stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCollect = (storyId) => {
    const newCollections = collections.filter(id => id !== storyId)
    setCollections(newCollections)
    setStories(stories.filter(s => (s.story_id || s.id) !== storyId))
    localStorage.setItem('novel_collections', JSON.stringify(newCollections))
  }

  return (
    <div className={styles.collections}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>
            <span className={styles.starIcon}>⭐</span>
            我的收藏
          </h1>
          <span className={styles.count}>
            {stories.length} 本小说
          </span>
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : stories.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📚</span>
            <p>还没有收藏任何小说</p>
            <Link to="/" className="btn btn-primary">
              去发现小说
            </Link>
          </div>
        ) : (
          <div className={styles.storyGrid}>
            {stories.map((story, index) => (
              <div key={story.story_id || story.id} className="fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                <StoryCard
                  story={story}
                  isCollected={true}
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

export default Collections
