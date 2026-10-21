import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Post = { id: number; title: string; body: string }
type Comment = { id: number; name: string; email: string; body: string }
type Account = { username: string; password: string }
type SavedComment = Comment & { postId: number }

const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts'
const STORAGE_KEY = 'miniblog-posts'
const ACCOUNTS_KEY = 'miniblog-accounts'
const COMMENTS_KEY = 'miniblog-comments'
const STORY_IMAGES = [
  'https://images.unsplash.com/photo-1730647730723-f99dc3bcf36a?auto=format&fit=crop&w=1400&q=85',
  'https://images.unsplash.com/photo-1630429119965-afd934d79557?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1710704735060-92e7f997b6de?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1714036806265-d9e0bbea237a?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1734017492555-6e18cfb7d02e?auto=format&fit=crop&w=700&q=80',
  'https://images.unsplash.com/photo-1759289615376-3dafb9a1fe9c?auto=format&fit=crop&w=700&q=80',
]

function readSavedPosts(): Post[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as Post[]) : []
  } catch {
    return []
  }
}

function readAccounts(): Account[] {
  try {
    const saved = localStorage.getItem(ACCOUNTS_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as Account[]) : []
  } catch {
    return []
  }
}

function readSavedComments(): SavedComment[] {
  try {
    const saved = localStorage.getItem(COMMENTS_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as SavedComment[]) : []
  } catch {
    return []
  }
}

function App() {
  const [posts, setPosts] = useState<Post[]>([])
  const [localPosts, setLocalPosts] = useState<Post[]>(readSavedPosts)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [savedComments, setSavedComments] = useState<SavedComment[]>(readSavedComments)
  const [newComment, setNewComment] = useState('')
  const [commentFormError, setCommentFormError] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registerError, setRegisterError] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newBody, setNewBody] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const canWritePosts = isLoggedIn && username === 'admin'

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch(POSTS_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Posts request failed')
        return response.json()
      })
      .then((data: Post[]) => setPosts(data))
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === 'AbortError') return
        setError('Không tải được bài viết. Hãy kiểm tra kết nối rồi thử lại.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (!selectedPost) {
      setComments([])
      setCommentsError('')
      setCommentsLoading(false)
      return
    }
    const controller = new AbortController()
    setCommentsLoading(true)
    setCommentsError('')
    fetch(`https://jsonplaceholder.typicode.com/posts/${selectedPost.id}/comments`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Comments request failed')
        return response.json()
      })
      .then((data: Comment[]) => setComments(data))
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name === 'AbortError') return
        setCommentsError('Không tải được bình luận. Hãy thử mở lại bài viết.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setCommentsLoading(false)
      })
    return () => controller.abort()
  }, [selectedPost])

  const allPosts = [...localPosts, ...posts]
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase()
  const filteredPosts = allPosts.filter((post) =>
    post.title.toLocaleLowerCase().includes(normalizedSearch),
  )
  const pageSize = 8
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / pageSize))
  const safePage = Math.min(currentPage, pageCount)
  const pagePosts = filteredPosts.slice((safePage - 1) * pageSize, safePage * pageSize)
  const featuredPost = pagePosts[0]
  const latestPosts = pagePosts.slice(1, 5)
  const founderPosts = pagePosts.slice(5, 8)
  const firstPageNumber = Math.min(Math.max(1, safePage - 2), Math.max(1, pageCount - 4))
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => firstPageNumber + index,
  )
  const pageImageOffset = (safePage - 1) * 3
  const visibleComments = selectedPost
    ? [...comments, ...savedComments.filter((comment) => comment.postId === selectedPost.id)]
    : comments

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedUsername = username.trim()
    const matchingAccount = readAccounts().find((account) => account.username.toLocaleLowerCase() === normalizedUsername.toLocaleLowerCase() && account.password === password)
    if ((normalizedUsername === 'admin' && password === '123456') || matchingAccount) {
      setIsLoggedIn(true)
      setLoginError('')
      setPassword('')
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu chưa chính xác.')
    }
  }

  const handleRegister = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegisterError('')
    const normalizedUsername = username.trim()
    if (normalizedUsername.length < 3) {
      setRegisterError('Tên đăng nhập cần có ít nhất 3 ký tự.')
      return
    }
    if (password.length < 6) {
      setRegisterError('Mật khẩu cần có ít nhất 6 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setRegisterError('Mật khẩu xác nhận chưa khớp.')
      return
    }
    const accounts = readAccounts()
    if (normalizedUsername.toLocaleLowerCase() === 'admin' || accounts.some((account) => account.username.toLocaleLowerCase() === normalizedUsername.toLocaleLowerCase())) {
      setRegisterError('Tên đăng nhập này đã được sử dụng.')
      return
    }
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, { username: normalizedUsername, password }]))
      setIsLoggedIn(true)
      setUsername(normalizedUsername)
      setPassword('')
      setConfirmPassword('')
    } catch {
      setRegisterError('Không thể lưu tài khoản trên trình duyệt này.')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setShowRegister(false)
    setUsername('')
    setPassword('')
    setLoginError('')
    setNewTitle('')
    setNewBody('')
    setFormError('')
    setFormSuccess('')
  }

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')
    const title = newTitle.trim()
    const body = newBody.trim()
    if (!title || !body) {
      setFormError('Vui lòng nhập cả tiêu đề và nội dung bài viết.')
      return
    }
    const createdPost: Post = { id: Date.now(), title, body }
    const updatedPosts = [createdPost, ...localPosts]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts))
      setLocalPosts(updatedPosts)
      setNewTitle('')
      setNewBody('')
      setSearchTerm('')
      setCurrentPage(1)
      setFormSuccess('Bài viết đã được lưu và thêm vào đầu danh sách.')
    } catch {
      setFormError('Không thể lưu bài viết trên trình duyệt này.')
    }
  }

  const handleCreateComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCommentFormError('')
    const body = newComment.trim()
    if (!selectedPost || !body) {
      setCommentFormError('Hãy nhập nội dung bình luận trước khi gửi.')
      return
    }
    const createdComment: SavedComment = {
      id: Date.now(),
      postId: selectedPost.id,
      name: username || 'Bạn đọc',
      email: username ? `${username}@miniblog.local` : 'bandoc@miniblog.local',
      body,
    }
    const updatedComments = [...savedComments, createdComment]
    try {
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments))
      setSavedComments(updatedComments)
      setNewComment('')
    } catch {
      setCommentFormError('Không thể lưu bình luận trên trình duyệt này.')
    }
  }

  if (window.location.pathname !== '/') {
    return (
      <main className="site-frame not-found-frame">
        <section className="not-found">
          <span className="eyebrow">MINIBLOG</span>
          <p className="not-found-code">404</p>
          <h1>Không tìm thấy trang</h1>
          <p>Đường dẫn này không tồn tại hoặc đã được thay đổi.</p>
          <a className="button button-rust" href="/">Về trang chủ</a>
        </section>
      </main>
    )
  }

  if (!isLoggedIn) {
    return (
      <main className="site-frame login-gate">
        <header className="site-header login-gate-header">
          <a className="brand" href="/" aria-label="MiniBlog">MiniBlog</a>
          <span className="login-gate-caption">ĐỌC · VIẾT · CHIA SẺ</span>
        </header>
        <section className="login-gate-content" aria-labelledby="login-heading">
          <div className="login-gate-art" aria-hidden="true">
            <span className="login-gate-art-label">MINIBLOG EDITORIAL</span>
            <span className="login-gate-art-title">Ghi lại suy nghĩ,<br />chia sẻ góc nhìn.</span>
          </div>
          <div className="login-gate-card">
            <span className="eyebrow">{showRegister ? 'BẮT ĐẦU HÀNH TRÌNH CỦA BẠN' : 'CHÀO MỪNG BẠN TRỞ LẠI'}</span>
            <h1 id="login-heading">{showRegister ? 'Tạo tài khoản' : 'Đăng nhập MiniBlog'}</h1>
            <p>{showRegister ? 'Tạo tài khoản để lưu lại suy nghĩ và chia sẻ góc nhìn của bạn.' : 'Đăng nhập để khám phá bài viết và chia sẻ câu chuyện của bạn.'}</p>
            <form className="login-gate-form" onSubmit={showRegister ? handleRegister : handleLogin}>
              <label htmlFor="login-username">Tên đăng nhập</label>
              <input id="login-username" autoComplete="username" placeholder="Nhập tên đăng nhập" value={username} onChange={(event) => setUsername(event.target.value)} required />
              <label htmlFor="login-password">Mật khẩu</label>
              <input id="login-password" type="password" autoComplete={showRegister ? 'new-password' : 'current-password'} placeholder="Nhập mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} required />
              {showRegister && <>
                <label htmlFor="confirm-password">Xác nhận mật khẩu</label>
                <input id="confirm-password" type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
              </>}
              {(loginError || registerError) && <p className="form-message form-message-error" role="alert">{showRegister ? registerError : loginError}</p>}
              <button className="button button-rust" type="submit">{showRegister ? 'TẠO TÀI KHOẢN' : 'ĐĂNG NHẬP'} <span aria-hidden="true">↗</span></button>
            </form>
            <p className="login-gate-switch">
              {showRegister ? 'Bạn đã có tài khoản?' : 'Bạn chưa có tài khoản?'}{' '}
              <button type="button" onClick={() => { setShowRegister(!showRegister); setLoginError(''); setRegisterError('') }}>{showRegister ? 'Đăng nhập' : 'Đăng ký ngay'}</button>
            </p>
          </div>
        </section>
        <footer className="site-footer login-gate-footer"><span>MiniBlog</span><span>Đọc · Viết · Chia sẻ</span></footer>
      </main>
    )
  }

  return (
    <main className="site-frame">
      <header className="site-header">
        <a className="brand" href="/" aria-label="MiniBlog, về trang chủ">MiniBlog</a>
        <div className="header-actions">
          {isLoggedIn ? (
            <>
              <span className="header-user">{username}</span>
              <button className="button button-rust header-cta" type="button" onClick={handleLogout}>ĐĂNG XUẤT</button>
            </>
          ) : (
            <a className="header-login" href="#account">ĐĂNG NHẬP ↗</a>
          )}
        </div>
      </header>

      <section className="intro-strip" id="about">
        <span>NHỮNG CÂU CHUYỆN ĐÁNG ĐỌC</span>
        <span>Một góc nhỏ để đọc, viết và chia sẻ.</span>
      </section>

      <section className="account-section" id="account" aria-label="Tài khoản">
        {isLoggedIn ? (
          <div className="account-summary"><span><i className="status-dot" />Bạn đang đăng nhập với tài khoản <strong>{username}</strong></span>{canWritePosts && <a href="#write">Viết bài mới ↓</a>}</div>
        ) : (
          <form className="login-form" onSubmit={handleLogin}>
            <strong>Đăng nhập để viết bài</strong>
            <label className="visually-hidden" htmlFor="login-username">Tên đăng nhập</label>
            <input id="login-username" autoComplete="username" placeholder="Tên đăng nhập" value={username} onChange={(event) => setUsername(event.target.value)} />
            <label className="visually-hidden" htmlFor="login-password">Mật khẩu</label>
            <input id="login-password" type="password" autoComplete="current-password" placeholder="Mật khẩu" value={password} onChange={(event) => setPassword(event.target.value)} />
            <button className="button button-rust" type="submit">Đăng nhập</button>
            {loginError && <p className="form-message form-message-error" role="alert">{loginError}</p>}
          </form>
        )}
      </section>

      {!selectedPost && (
        <div className="search-row">
          <label className="visually-hidden" htmlFor="post-search">Tìm bài viết theo tiêu đề</label>
          <span aria-hidden="true">⌕</span>
          <input id="post-search" type="search" placeholder="Tìm theo tiêu đề bài viết..." value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1) }} />
          {searchTerm && <button type="button" onClick={() => { setSearchTerm(''); setCurrentPage(1) }}>Xóa</button>}
        </div>
      )}

      {loading && <div className="state-message" role="status"><span className="spinner" />Đang tải bài viết...</div>}
      {error && <div className="error-message" role="alert"><span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)}>Thử tải lại</button></div>}

      {!loading && !error && selectedPost && (
        <article className="detail-view">
          <button className="back-link" type="button" onClick={() => setSelectedPost(null)}>← Quay lại danh sách</button>
          <h1>{selectedPost.title}</h1>
          <p className="detail-body">{selectedPost.body}</p>
          <section className="comments-section" aria-labelledby="comments-heading">
            <div className="comments-title"><h2 id="comments-heading">Bình luận</h2><span>{commentsLoading ? '...' : visibleComments.length}</span></div>
            {commentsLoading && <p className="muted-text">Đang tải bình luận...</p>}
            {commentsError && <p className="form-message form-message-error" role="alert">{commentsError}</p>}
            {!commentsLoading && !commentsError && visibleComments.length === 0 && <p className="muted-text">Chưa có bình luận cho bài viết này.</p>}
            {!commentsLoading && !commentsError && visibleComments.length > 0 && (
              <div className="comment-list">
                {visibleComments.map((comment) => (
                  <article className="comment-item" key={comment.id}>
                    <span className="comment-avatar" aria-hidden="true">{comment.name.charAt(0).toUpperCase()}</span>
                    <div><strong>{comment.name}</strong><a href={`mailto:${comment.email}`}>{comment.email}</a><p>{comment.body}</p></div>
                  </article>
                ))}
              </div>
            )}
            <form className="comment-form" onSubmit={handleCreateComment}>
              <label htmlFor="new-comment">Viết bình luận</label>
              <textarea id="new-comment" rows={3} maxLength={1000} placeholder="Chia sẻ suy nghĩ của bạn về bài viết..." value={newComment} onChange={(event) => setNewComment(event.target.value)} />
              {commentFormError && <p className="form-message form-message-error" role="alert">{commentFormError}</p>}
              <div className="comment-form-footer"><span>Đang bình luận với tên {username || 'Bạn đọc'}</span><button className="button button-rust" type="submit">Gửi bình luận</button></div>
            </form>
          </section>
        </article>
      )}

      {!loading && !error && !selectedPost && (
        filteredPosts.length > 0 ? (
          <>
            <section className="feature-layout" id="featured" aria-label="Bài viết nổi bật">
              {featuredPost && (
                <button className="feature-card" type="button" onClick={() => setSelectedPost(featuredPost)}>
                  <img src={STORY_IMAGES[pageImageOffset % STORY_IMAGES.length]} alt="Cảnh thiên nhiên minh họa bài viết" />
                  <span className="feature-shade" />
                  <span className="feature-copy"><strong>{featuredPost.title}</strong><small>Mới đăng　·　5 phút đọc</small></span>
                </button>
              )}
              <aside className="latest-panel" aria-labelledby="latest-heading">
                <h2 id="latest-heading">Bài mới nhất</h2>
                {latestPosts.map((post, index) => (
                  <button className="latest-item" type="button" key={post.id} onClick={() => setSelectedPost(post)}>
                    <img src={STORY_IMAGES[(index + 1 + pageImageOffset) % STORY_IMAGES.length]} alt="" />
                    <span><strong>{post.title}</strong><small>Hôm nay　·　5 phút đọc</small></span>
                  </button>
                ))}
              </aside>
            </section>

            <section className="stories-section" id="stories" aria-labelledby="stories-heading">
              <div className="stories-heading"><h2 id="stories-heading">Góc tác giả</h2><span className="stories-note">Những ý tưởng được chia sẻ gần đây</span></div>
              <div className="story-grid">
                {founderPosts.map((post, index) => (
                  <article className="story-card" key={post.id}>
                    <button className="story-image-button" type="button" onClick={() => setSelectedPost(post)} aria-label={`Đọc bài viết: ${post.title}`}>
                      <img src={STORY_IMAGES[(index + 5 + pageImageOffset) % STORY_IMAGES.length]} alt="" />
                    </button>
                    <div className="story-card-copy">
                      <h3><button type="button" onClick={() => setSelectedPost(post)}>{post.title}</button></h3>
                      <p>{post.body}</p>
                      <small>Hôm nay　·　5 phút đọc</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {pageCount > 1 && (
              <nav className="pagination" aria-label="Phân trang bài viết">
                <button className="page-arrow" type="button" aria-label="Trang trước" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>←</button>
                <div className="page-numbers">
                  {pageNumbers.map((page) => <button className={page === safePage ? 'page-number active' : 'page-number'} type="button" key={page} aria-current={page === safePage ? 'page' : undefined} onClick={() => setCurrentPage(page)}>{page}</button>)}
                </div>
                <button className="page-arrow" type="button" aria-label="Trang sau" disabled={safePage === pageCount} onClick={() => setCurrentPage(safePage + 1)}>→</button>
              </nav>
            )}
          </>
        ) : (
          <div className="empty-state"><span>⌕</span><h2>Không tìm thấy bài viết</h2><p>Thử một từ khóa khác hoặc xóa nội dung tìm kiếm.</p><button className="button button-outline" type="button" onClick={() => setSearchTerm('')}>Xóa tìm kiếm</button></div>
        )
      )}

      {canWritePosts && !loading && !error && !selectedPost && (
        <section className="composer" id="write">
          <div className="composer-heading"><div><span className="eyebrow">BÀI VIẾT CỦA BẠN</span><h2>Viết bài mới</h2></div><span aria-hidden="true">✎</span></div>
          <form className="post-form" onSubmit={handleCreatePost}>
            <label htmlFor="post-title">Tiêu đề</label>
            <input id="post-title" maxLength={120} placeholder="Đặt tiêu đề cho bài viết" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} aria-invalid={Boolean(formError && !newTitle.trim())} />
            <label htmlFor="post-body">Nội dung</label>
            <textarea id="post-body" rows={5} placeholder="Bắt đầu viết câu chuyện của bạn..." value={newBody} onChange={(event) => setNewBody(event.target.value)} aria-invalid={Boolean(formError && !newBody.trim())} />
            {formError && <p className="form-message form-message-error" role="alert">{formError}</p>}
            {formSuccess && <p className="form-message form-message-success" role="status">{formSuccess}</p>}
            <div className="composer-footer"><span>Tiêu đề tối đa 120 ký tự</span><button className="button button-rust" type="submit">Đăng bài viết</button></div>
          </form>
        </section>
      )}

      <footer className="site-footer"><a className="brand" href="/">MiniBlog</a><span>Đọc · Viết · Chia sẻ</span><a href="#about">Lên đầu trang ↑</a></footer>
    </main>
  )
}

export default App
