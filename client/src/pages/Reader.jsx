import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import styles from './Reader.module.css'

function Reader() {
  const { storyId, chapterId } = useParams()
  const navigate = useNavigate()
  const contentRef = useRef(null)

  const [chapter, setChapter] = useState(null)
  const [adjacentChapters, setAdjacentChapters] = useState({ prev: null, next: null })
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)

  // 阅读器设置
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [showTopBar, setShowTopBar] = useState(true)
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [brightness, setBrightness] = useState(100)
  const [bgColor, setBgColor] = useState('#1c1c1c')

  const bgOptions = [
    { name: '夜间', color: '#1c1c1c', textColor: '#c9c9c9' },
    { name: '白天', color: '#f5f5f5', textColor: '#333333' },
    { name: '护眼', color: '#e8dcc8', textColor: '#5d5d5d' },
    { name: '墨水', color: '#2a2a2a', textColor: '#c3c3c3' },
  ]

  const [textColor, setTextColor] = useState('#c9c9c9')

  const handleBgChange = (bg) => {
    setBgColor(bg.color)
    setTextColor(bg.textColor)
  }

  // 保存阅读进度
  useEffect(() => {
    if (chapterId) {
      const progress = JSON.parse(localStorage.getItem('novel_reading_progress') || '{}')
      progress[storyId] = parseInt(chapterId)
      localStorage.setItem('novel_reading_progress', JSON.stringify(progress))
    }
  }, [chapterId, storyId])

  // 获取章节列表
  useEffect(() => {
    fetch(`/api/stories/${storyId}/chapters`)
      .then(res => res.json())
      .then(data => setChapters(data))
      .catch(err => console.error('Failed to fetch chapters:', err))
  }, [storyId])

  // 获取章节内容
  useEffect(() => {
    fetchChapter()
  }, [chapterId])

  // 键盘翻页
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && adjacentChapters.prev) {
        navigate(`/story/${storyId}/chapter/${adjacentChapters.prev.id}`)
      } else if (e.key === 'ArrowRight' && adjacentChapters.next) {
        navigate(`/story/${storyId}/chapter/${adjacentChapters.next.id}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [adjacentChapters, navigate, storyId])

  const fetchChapter = async () => {
    setLoading(true)
    try {
      const [chapterRes, adjacentRes] = await Promise.all([
        fetch(`/api/chapters/${chapterId}`),
        fetch(`/api/chapters/${chapterId}/adjacent`)
      ])

      const chapterData = await chapterRes.json()
      const adjacentData = await adjacentRes.json()

      setChapter(chapterData)
      setAdjacentChapters(adjacentData)

      // 滚动到顶部
      if (contentRef.current) {
        contentRef.current.scrollTop = 0
      }
    } catch (error) {
      console.error('Failed to fetch chapter:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevChapter = () => {
    if (adjacentChapters.prev) {
      navigate(`/story/${storyId}/chapter/${adjacentChapters.prev.id}`)
    }
  }

  const handleNextChapter = () => {
    if (adjacentChapters.next) {
      navigate(`/story/${storyId}/chapter/${adjacentChapters.next.id}`)
    }
  }

  const handleChapterSelect = (id) => {
    navigate(`/story/${storyId}/chapter/${id}`)
    setShowToc(false)
  }

  const getCurrentChapterIndex = () => {
    return chapters.findIndex(c => c.id === parseInt(chapterId))
  }

  const currentIndex = getCurrentChapterIndex()

  return (
    <div
      className={styles.reader}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        filter: `brightness(${brightness}%)`,
        fontSize: `${fontSize}px`,
        lineHeight: lineHeight
      }}
    >
      {/* 顶部工具栏 */}
      <div className={`${styles.topBar} ${showTopBar ? styles.visible : ''}`}>
        <button onClick={() => navigate(`/story/${storyId}`)} className={styles.backBtn}>
          ← 返回
        </button>
        <h1 className={styles.chapterTitle}>{chapter?.title || '加载中...'}</h1>
        <div className={styles.topActions}>
          <button onClick={() => setShowToc(!showToc)} className={styles.iconBtn}>
            📑
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={styles.iconBtn}>
            Aa
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className={styles.settingsPanel}>
          <div className={styles.settingItem}>
            <label>字号</label>
            <div className={styles.sliderContainer}>
              <span>A-</span>
              <input
                type="range"
                min="14"
                max="28"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
              <span>A+</span>
            </div>
          </div>
          <div className={styles.settingItem}>
            <label>行距</label>
            <div className={styles.sliderContainer}>
              <span>紧凑</span>
              <input
                type="range"
                min="1.4"
                max="2.4"
                step="0.1"
                value={lineHeight}
                onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              />
              <span>宽松</span>
            </div>
          </div>
          <div className={styles.settingItem}>
            <label>亮度</label>
            <div className={styles.sliderContainer}>
              <span>🌙</span>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
              />
              <span>☀️</span>
            </div>
          </div>
          <div className={styles.settingItem}>
            <label>背景</label>
            <div className={styles.bgOptions}>
              {bgOptions.map((bg) => (
                <button
                  key={bg.name}
                  className={`${styles.bgBtn} ${bgColor === bg.color ? styles.active : ''}`}
                  style={{ backgroundColor: bg.color }}
                  onClick={() => handleBgChange(bg)}
                  title={bg.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 目录面板 */}
      {showToc && (
        <div className={styles.tocPanel}>
          <div className={styles.tocHeader}>
            <h3>目录</h3>
            <button onClick={() => setShowToc(false)} className={styles.closeBtn}>✕</button>
          </div>
          <div className={styles.tocList}>
            {chapters.map((ch, index) => (
              <div
                key={ch.id}
                className={`${styles.tocItem} ${ch.id === parseInt(chapterId) ? styles.current : ''}`}
                onClick={() => handleChapterSelect(ch.id)}
              >
                <span className={styles.tocNum}>{ch.chapter_number}</span>
                <span className={styles.tocTitle}>{ch.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 阅读内容 */}
      <div
        className={styles.content}
        ref={contentRef}
        onClick={(e) => {
          // 点击内容区域切换顶部栏显示，但不在设置面板激活时关闭它
          if (!showSettings) {
            setShowTopBar(!showTopBar)
          }
        }}
      >
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <article className={styles.article}>
            <h2 className={styles.title}>{chapter?.title}</h2>
            <div className={styles.meta}>
              <span>字数: {chapter?.word_count}</span>
            </div>
            <div className={styles.textContent}>
              {chapter?.content?.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className={styles.paragraph}>
                    {paragraph}
                  </p>
                )
              ))}
            </div>
          </article>
        )}
      </div>

      {/* 底部翻页 */}
      <div className={`${styles.bottomBar} ${showTopBar ? styles.visible : ''}`}>
        <button
          className={styles.navBtn}
          onClick={handlePrevChapter}
          disabled={!adjacentChapters.prev}
        >
          ← 上一章
        </button>
        <div className={styles.progress}>
          {currentIndex + 1} / {chapters.length}
        </div>
        <button
          className={styles.navBtn}
          onClick={handleNextChapter}
          disabled={!adjacentChapters.next}
        >
          下一章 →
        </button>
      </div>

      {/* 进度条 */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${chapters.length ? ((currentIndex + 1) / chapters.length) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

export default Reader
