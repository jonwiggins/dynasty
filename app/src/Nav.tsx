interface NavProps {
  currentPage: 'dynasty' | 'ubi';
}

export function Nav({ currentPage }: NavProps) {
  return (
    <nav className="site-nav">
      <div className="nav-brand">Fund Simulators</div>
      <div className="nav-links">
        <a
          href="/"
          className={`nav-link ${currentPage === 'dynasty' ? 'active' : ''}`}
        >
          <span className="nav-icon">👑</span>
          Dynasty Fund
        </a>
        <a
          href="/ubi.html"
          className={`nav-link ${currentPage === 'ubi' ? 'active' : ''}`}
        >
          <span className="nav-icon">🌐</span>
          UBI Fund
        </a>
      </div>
    </nav>
  );
}
