import { Link } from 'react-router-dom'
import styles from './StoryCard.module.css'

function StoryCard({ story, isCollected, onToggleCollect }) {
  const formatWordCount = (count) => {
    if (!count) return '0'
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万'
    }
    return count.toString()
  }

  return (
    <div className={styles.card}>
      <Link to={`/story/${story.story_id || story.id}`} className={styles.coverLink}>
        <div className={styles.cover}>
          <div className={styles.coverPlaceholder}>
            <span className={styles.coverIcon}>📖</span>
            <span className={styles.coverTitle}>{story.title?.slice(0, 2)}</span>
          </div>
        </div>
      </Link>

      <div className={styles.content}>
        <Link to={`/story/${story.story_id || story.id}`} className={styles.titleLink}>
          <h3 className={styles.title}>{story.title}</h3>
        </Link>

        <div className={styles.meta}>
          <span className={styles.genre}>{story.genre || '未知类型'}</span>
          <span className={styles.divider}>·</span>
          <span className={styles.style}>{story.style || '连载中'}</span>
        </div>

        <div className={styles.stats}>
          <span className={styles.wordCount}>
            📝 {formatWordCount(story.current_word_count)}字
          </span>
          {story.latest_chapter_num && (
            <span className={styles.chapterCount}>
              📄 {story.latest_chapter_num}章
            </span>
          )}
        </div>

        {story.latest_chapter && (
          <p className={styles.latestChapter}>
            最新: {story.latest_chapter}
          </p>
        )}

        <button
          className={`${styles.collectBtn} ${isCollected ? styles.collected : ''}`}
          onClick={(e) => {
            e.preventDefault()
            onToggleCollect(story.story_id || story.id)
          }}
        >
          <span className={styles.starIcon}>{isCollected ? '★' : '☆'}</span>
          <span>{isCollected ? '已收藏' : '收藏'}</span>
        </button>
      </div>
    </div>
  )
}

export default StoryCard
