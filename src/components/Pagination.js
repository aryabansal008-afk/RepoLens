export default function Pagination({ page, total, pageSize, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn-ghost" onClick={() => onPage(page - 1)} disabled={page <= 1}>
        Previous
      </button>
      <span>Page {page} of {pages}</span>
      <button type="button" className="btn-ghost" onClick={() => onPage(page + 1)} disabled={page >= pages}>
        Next
      </button>
    </nav>
  );
}
