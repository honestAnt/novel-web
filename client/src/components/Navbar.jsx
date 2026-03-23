import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import styles from './Navbar.module.css'

function Navbar() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [collections, setCollections] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('novel_collections')
    if (saved) {
      setCollections(JSON.parse(saved))
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`)
    }
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>📚</span>
          <span className={styles.logoText}>起点小说</span>
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

        <Link to="/collections" className={styles.collectionsLink}>
          <span className={styles.starIcon}>⭐</span>
          <span>我的收藏</span>
          {collections.length > 0 && (
            <span className={styles.badge}>{collections.length}</span>
          )}
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
