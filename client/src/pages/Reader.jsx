import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import styles from './Reader.module.css'

function Reader() {
  const { storyId, chapterId } = useParams()
  const navigate = useNavigate()
  const contentRef = useRef(null)

  const [chapter, setChapter] = useState(null)
  const [adjacentChapters, setAdjacentChapters] = useState({ prev: null, next: null })
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)

  // 从 localStorage 加载阅读器设置
  const loadReaderSettings = () => {
    const saved = localStorage.getItem('novel_reader_settings')
    if (saved) {
      return JSON.parse(saved)
    }
    return null
  }

  const savedSettings = loadReaderSettings()

  // 阅读器设置
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)
  const [showTopBar, setShowTopBar] = useState(true)
  const [fontSize, setFontSize] = useState(savedSettings?.fontSize || 18)
  const [lineHeight, setLineHeight] = useState(savedSettings?.lineHeight || 1.8)
  const [letterSpacing, setLetterSpacing] = useState(savedSettings?.letterSpacing || 0)
  const [fontFamily, setFontFamily] = useState(savedSettings?.fontFamily || '"Noto Serif SC", serif')
  const [brightness, setBrightness] = useState(savedSettings?.brightness || 100)
  const [bgColor, setBgColor] = useState(savedSettings?.bgColor || '#1c1c1c')

  const bgOptions = [
    { name: '夜间', color: '#1c1c1c', textColor: '#c9c9c9' },
    { name: '白天', color: '#f5f5f5', textColor: '#333333' },
    { name: '护眼', color: '#e8dcc8', textColor: '#5d5d5d' },
    { name: '墨水', color: '#2a2a2a', textColor: '#c3c3c3' },
  ]

  const [customBgColor, setCustomBgColor] = useState(savedSettings?.customBgColor || '#1c1c1c')
  const [customTextColor, setCustomTextColor] = useState(savedSettings?.customTextColor || '#c9c9c9')

  // 沉浸式阅读模式
  const [immersiveMode, setImmersiveMode] = useState(false)

  // 沉浸式阅读模式控制
  const toggleImmersiveMode = () => {
    if (!immersiveMode) {
      // 进入沉浸式模式
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      }
      setImmersiveMode(true)
    } else {
      // 退出沉浸式模式
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }
      setImmersiveMode(false)
    }
  }

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && immersiveMode) {
        setImmersiveMode(false)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [immersiveMode])

  const fontOptions = [
    { name: '默认', value: '"Noto Serif SC", serif' },
    { name: '黑体', value: '"Noto Sans SC", sans-serif' },
    { name: '楷体', value: '"LXGW WenKai", cursive' },
    { name: '宋体', value: '"SimSun", serif' },
  ]

  const [textColor, setTextColor] = useState(savedSettings?.textColor || '#c9c9c9')

  const handleBgChange = (bg) => {
    setBgColor(bg.color)
    setTextColor(bg.textColor)
  }

  const handleCustomBgChange = (color) => {
    setCustomBgColor(color)
    setBgColor(color)
    // 根据背景亮度自动设置文字颜色
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    const newTextColor = brightness > 128 ? '#333333' : '#c9c9c9'
    setCustomTextColor(newTextColor)
    setTextColor(newTextColor)
  }

  // 检测全局白色主题（只在首次加载时应用，不覆盖用户保存的设置）
  useEffect(() => {
    const updateTheme = () => {
      const isWhiteMode = document.body.classList.contains('white-mode')
      // 检查用户是否已有自定义背景设置
      const hasCustomBg = savedSettings && savedSettings.bgColor

      if (!hasCustomBg) {
        // 只有在没有保存设置时才应用主题
        if (isWhiteMode) {
          setBgColor('#f5f5f5')
          setTextColor('#333333')
        } else {
          // 恢复默认深色主题
          setBgColor('#1c1c1c')
          setTextColor('#c9c9c9')
        }
      }
    }

    // 初始检测
    updateTheme()

    // 监听 localStorage 变化
    const handleStorageChange = (e) => {
      if (e.key === 'novel_white_mode') {
        if (e.newValue === 'true') {
          document.body.classList.add('white-mode')
        } else {
          document.body.classList.remove('white-mode')
        }
        updateTheme()
      }
    }

    // 监听自定义主题切换事件
    const handleThemeChange = () => {
      updateTheme()
    }

    // 监听 class 变化
    const observer = new MutationObserver(() => {
      updateTheme()
    })

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('theme-change', handleThemeChange)

    return () => {
      observer.disconnect()
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('theme-change', handleThemeChange)
    }
  }, [])

  // 保存阅读进度
  useEffect(() => {
    if (chapterId) {
      const progress = JSON.parse(localStorage.getItem('novel_reading_progress') || '{}')
      progress[storyId] = parseInt(chapterId)
      localStorage.setItem('novel_reading_progress', JSON.stringify(progress))
    }
  }, [chapterId, storyId])

  // 保存阅读器设置到 localStorage（只在设置改变时保存，不在首次渲染时保存）
  useEffect(() => {
    // 延迟保存，确保不会覆盖已有的设置
    const timer = setTimeout(() => {
      const settings = {
        fontSize,
        lineHeight,
        letterSpacing,
        fontFamily,
        brightness,
        bgColor,
        textColor,
        customBgColor,
        customTextColor,
      }
      localStorage.setItem('novel_reader_settings', JSON.stringify(settings))
    }, 100)
    return () => clearTimeout(timer)
  }, [fontSize, lineHeight, letterSpacing, fontFamily, brightness, bgColor, textColor, customBgColor, customTextColor])

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
        filter: `brightness(${brightness}%)`,
      }}
    >
      {/* 顶部工具栏 - 始终显示 */}
      <div className={styles.topBar}>
        <button onClick={() => navigate(`/story/${storyId}`)} className={styles.backBtn}>
          ← 返回
        </button>
        <h1 className={styles.chapterTitle}>{chapter?.title || '加载中...'}</h1>
        <div className={styles.topActions}>
          <button onClick={() => setShowToc(!showToc)} className={styles.iconBtn}>
            章节
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className={styles.iconBtn}>
            调整
          </button>
          <button onClick={toggleImmersiveMode} className={styles.iconBtn} title="沉浸式阅读">
            全屏
          </button>
        </div>
      </div>

      {/* 左侧设置面板 */}
      <div className={`${styles.settingsPanel} ${showSettings ? styles.open : ''}`}>
        <div className={styles.settingsHeader}>
          <h3>阅读设置</h3>
          <button onClick={() => setShowSettings(false)} className={styles.closeSettingsBtn}>✕</button>
        </div>

        <div className={styles.settingsContent}>
          {/* 字号 */}
          <div className={styles.settingItem}>
            <label>字号: {fontSize}px</label>
            <input
              type="range"
              min="12"
              max="28"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* 字体风格 */}
          <div className={styles.settingItem}>
            <label>字体</label>
            <div className={styles.fontOptions}>
              {fontOptions.map((font) => (
                <button
                  key={font.name}
                  className={`${styles.fontBtn} ${fontFamily === font.value ? styles.active : ''}`}
                  style={{ fontFamily: font.value }}
                  onClick={() => setFontFamily(font.value)}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </div>

          {/* 行间距 */}
          <div className={styles.settingItem}>
            <label>行距: {lineHeight}</label>
            <input
              type="range"
              min="1.4"
              max="2.6"
              step="0.1"
              value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* 字间距 */}
          <div className={styles.settingItem}>
            <label>字距: {letterSpacing}px</label>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={letterSpacing}
              onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* 亮度 */}
          <div className={styles.settingItem}>
            <label>亮度: {brightness}%</label>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>

          {/* 背景 */}
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

          {/* 自定义背景颜色 */}
          <div className={styles.settingItem}>
            <label>自定义背景</label>
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => handleCustomBgChange(e.target.value)}
              className={styles.colorPicker}
            />
            <span className={styles.colorValue}>{customBgColor}</span>
          </div>

          {/* 自定义字体颜色 */}
          <div className={styles.settingItem}>
            <label>自定义字体颜色</label>
            <input
              type="color"
              value={customTextColor}
              onChange={(e) => {
                setCustomTextColor(e.target.value)
                setTextColor(e.target.value)
              }}
              className={styles.colorPicker}
            />
            <span className={styles.colorValue}>{customTextColor}</span>
          </div>
        </div>
      </div>

      {/* 遮罩层 */}
      {showSettings && <div className={styles.overlay} onClick={() => setShowSettings(false)} />}
      {showToc && <div className={styles.overlay} onClick={() => setShowToc(false)} />}

      {/* 目录面板 */}
      <div className={`${styles.tocPanel} ${showToc ? styles.open : ''}`}>
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

      {/* 阅读内容 */}
      <div
        className={styles.content}
        ref={contentRef}
        onClick={(e) => {
          // 点击内容区域切换顶部栏显示，关闭目录面板
          if (showToc) {
            setShowToc(false)
          }
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
            <div
              className={styles.textContent}
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                letterSpacing: `${letterSpacing}px`,
                color: textColor,
              }}
            >
              <ReactMarkdown>{chapter?.content}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>

      {/* 底部翻页 */}
      <div className={`${styles.bottomBar} ${!showTopBar ? styles.hidden : ''}`}>
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

      {/* 沉浸式阅读模式 */}
      {immersiveMode && (
        <div className={styles.immersiveOverlay} style={{ backgroundColor: bgColor }}>
          {/* 顶部退出按钮 */}
          <div className={styles.immersiveTop}>
            <button onClick={toggleImmersiveMode} className={styles.immersiveExitBtn}>
              ✕ 退出全屏
            </button>
          </div>

          {/* 阅读内容 */}
          <div className={styles.immersiveContent} ref={contentRef}>
            <article className={styles.immersiveArticle}>
              <h2 className={styles.immersiveTitle}>{chapter?.title}</h2>
              <div
                className={styles.immersiveText}
                style={{
                  fontFamily: fontFamily,
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  letterSpacing: `${letterSpacing}px`,
                  color: textColor,
                }}
              >
                <ReactMarkdown>{chapter?.content}</ReactMarkdown>
              </div>
            </article>
          </div>

          {/* 底部翻页 */}
          <div className={styles.immersiveBottom}>
            <button
              className={styles.immersiveNavBtn}
              onClick={handlePrevChapter}
              disabled={!adjacentChapters.prev}
            >
              ← 上一章
            </button>
            <span className={styles.immersiveProgress}>
              {currentIndex + 1} / {chapters.length}
            </span>
            <button
              className={styles.immersiveNavBtn}
              onClick={handleNextChapter}
              disabled={!adjacentChapters.next}
            >
              下一章 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reader
