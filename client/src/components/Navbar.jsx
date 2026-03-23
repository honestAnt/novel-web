import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

function Navbar() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [collections, setCollections] = useState([])
  const [isWhiteMode, setIsWhiteMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('novel_collections')
    if (saved) {
      setCollections(JSON.parse(saved))
    }

    // 加载主题设置
    const savedTheme = localStorage.getItem('novel_white_mode')
    if (savedTheme === 'true') {
      setIsWhiteMode(true)
      document.body.classList.add('white-mode')
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  const toggleWhiteMode = () => {
    const newValue = !isWhiteMode
    setIsWhiteMode(newValue)
    localStorage.setItem('novel_white_mode', String(newValue))
    if (newValue) {
      document.body.classList.add('white-mode')
    } else {
      document.body.classList.remove('white-mode')
    }
    // 触发自定义事件通知其他组件
    window.dispatchEvent(new Event('theme-change'))
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>📚</span>
          <span className={styles.logoText}>老王小说</span>
        </Link>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="搜索小说..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            🔍
          </button>
        </form>

        <div className={styles.rightActions}>
          <button onClick={toggleWhiteMode} className={styles.themeBtn} title="切换主题">
            {isWhiteMode ? '🌙' : '☀️'}
          </button>

          <Link to="/collections" className={styles.collectionsLink}>
            <span className={styles.starIcon}>⭐</span>
            <span>我的收藏</span>
            {collections.length > 0 && (
              <span className={styles.badge}>{collections.length}</span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
