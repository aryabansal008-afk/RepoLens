export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="state-card" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn-solid" onClick={onRetry}>Try again</button>
      ) : null}
    </div>
  );
}
