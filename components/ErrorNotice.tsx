type ErrorNoticeProps = {
  message: string;
  onRetry: () => void;
  onShowSample: () => void;
};

export function ErrorNotice({
  message,
  onRetry,
  onShowSample,
}: ErrorNoticeProps) {
  return (
    <div className="rounded-md border border-line p-5">
      <p role="alert">{message}</p>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-sm border border-ink px-4 py-2 font-medium hover:bg-ink hover:text-paper"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onShowSample}
          className="text-sm text-accent underline underline-offset-4 hover:no-underline"
        >
          Show a sample result instead
        </button>
      </div>
    </div>
  );
}
