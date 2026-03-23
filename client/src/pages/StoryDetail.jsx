import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import styles from './StoryDetail.module.css'

function StoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState([])
  const [isCollected, setIsCollected] = useState(false)
  const [showChapterList, setShowChapterList] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('novel_collections')
    if (saved) {
      setCollections(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    fetchStory()
    fetchChapters()
  }, [id])

  useEffect(() => {
    setIsCollected(collections.includes(id))
  }, [collections, id])

  const fetchStory = async () => {
    try {
      const res = await fetch(`/api/stories/${id}`)
      const data = await res.json()
      setStory(data)
    } catch (error) {
      console.error('Failed to fetch story:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChapters = async () => {
    try {
      const res = await fetch(`/api/stories/${id}/chapters`)
      if (!res.ok) {
        throw new Error('Failed to fetch')
      }
      const data = await res.json()
      setChapters(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch chapters:', error)
      setChapters([])
    }
  }

  const handleToggleCollect = () => {
    let newCollections
    if (isCollected) {
      newCollections = collections.filter(storyId => storyId !== id)
    } else {
      newCollections = [...collections, id]
    }
    setCollections(newCollections)
    localStorage.setItem('novel_collections', JSON.stringify(newCollections))
  }

  const handleRead = (chapterId) => {
    navigate(`/story/${id}/chapter/${chapterId}`)
  }

  const handleContinueReading = () => {
    // 找到最新阅读的章节或从第一章开始
    const readingProgress = JSON.parse(localStorage.getItem('novel_reading_progress') || '{}')
    const lastChapterId = readingProgress[id]

    if (lastChapterId && chapters.find(c => c.id === lastChapterId)) {
      navigate(`/story/${id}/chapter/${lastChapterId}`)
    } else if (chapters.length > 0) {
      navigate(`/story/${id}/chapter/${chapters[0].id}`)
    }
  }

  const formatWordCount = (count) => {
    if (!count) return '0'
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万'
    }
    return count.toString()
  }

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div className="loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className={styles.detailPage}>
        <div className={styles.notFound}>
          <span>📚</span>
          <p>小说不存在</p>
          <Link to="/" className="btn btn-primary">返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.detailPage}>
      <div className="container">
        {/* 小说头部信息 */}
        <div className={styles.header}>
          <div className={styles.coverSection}>
            <div className={styles.cover}>
              <div className={styles.coverPlaceholder}>
                <span className={styles.coverIcon}>📖</span>
                <span className={styles.coverTitle}>{story.title?.slice(0, 2)}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoSection}>
            <h1 className={styles.title}>{story.title}</h1>

            <div className={styles.meta}>
              <span className={styles.tag}>{story.genre}</span>
              <span className={styles.tag}>{story.style || '连载中'}</span>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>字数</span>
                <span className={styles.statValue}>{formatWordCount(story.current_word_count)}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>章节</span>
                <span className={styles.statValue}>{chapters.length}</span>
              </div>
              {story.current_stage && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>阶段</span>
                  <span className={styles.statValue}>{story.current_stage}</span>
                </div>
              )}
              {story.current_realm && (
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>境界</span>
                  <span className={styles.statValue}>{story.current_realm}</span>
                </div>
              )}
            </div>

            {/* 世界设定简介 */}
            {story.world_settings && (
              <div className={styles.worldInfo}>
                <h3>世界设定</h3>
                {story.world_settings.cultivation_system && (
                  <p><strong>修炼体系:</strong> {story.world_settings.cultivation_system}</p>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button onClick={handleContinueReading} className={styles.readBtn}>
                <span>📖</span>
                {chapters.length > 0 ? '开始阅读' : '暂无章节'}
              </button>

              <button
                onClick={handleToggleCollect}
                className={`${styles.collectBtn} ${isCollected ? styles.collected : ''}`}
              >
                <span className={styles.starIcon}>{isCollected ? '★' : '☆'}</span>
                {isCollected ? '已收藏' : '收藏'}
              </button>

              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className={styles.chapterListBtn}
              >
                <span>📑</span>
                目录 ({chapters.length})
              </button>
            </div>
          </div>
        </div>

        {/* 章节列表 */}
        {showChapterList && (
          <div className={styles.chapterSection}>
            <h2 className={styles.sectionTitle}>
              <span>📑</span> 目录
            </h2>
            <div className={styles.chapterList}>
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={styles.chapterItem}
                  onClick={() => handleRead(chapter.id)}
                >
                  <span className={styles.chapterNum}>{chapter.chapter_number}</span>
                  <span className={styles.chapterTitle}>{chapter.title}</span>
                  <span className={styles.chapterWords}>{chapter.word_count}字</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 最新章节 */}
        {!showChapterList && story.latest_chapter && (
          <div className={styles.latestSection}>
            <h2 className={styles.sectionTitle}>
              <span>⚡</span> 最新章节
            </h2>
            <div
              className={styles.latestChapter}
              onClick={() => handleRead(story.latest_chapter.id)}
            >
              <h3>{story.latest_chapter.title}</h3>
              {story.latest_chapter.summary && (
                <p className={styles.summary}>{story.latest_chapter.summary}</p>
              )}
              <div className={styles.chapterMeta}>
                <span>📝 {story.latest_chapter.word_count}字</span>
                <span>点击阅读 →</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StoryDetail
