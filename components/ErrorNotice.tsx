type ErrorNoticeProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorNotice({ message, onRetry }: ErrorNoticeProps) {
  return (
    <div className="rounded-md border border-line p-5">
      <p role="alert">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-sm border border-ink px-4 py-2 font-medium hover:bg-ink hover:text-paper"
      >
        Retry
      </button>
    </div>
  );
}
