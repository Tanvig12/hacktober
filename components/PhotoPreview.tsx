import Image from "next/image";
import { toDataUrl, type ResizedImage } from "@/lib/resize";

type PhotoPreviewProps = {
  photo: ResizedImage;
  dimmed: boolean;
  onChangePhoto?: () => void;
};

export function PhotoPreview({
  photo,
  dimmed,
  onChangePhoto,
}: PhotoPreviewProps) {
  return (
    <figure>
      <Image
        src={toDataUrl(photo)}
        alt="Your photo"
        width={photo.width}
        height={photo.height}
        unoptimized
        className={`h-auto w-full rounded-md border border-line transition-opacity ${
          dimmed ? "opacity-40" : ""
        }`}
      />
      {onChangePhoto && (
        <figcaption className="mt-3">
          <button
            type="button"
            onClick={onChangePhoto}
            className="text-sm text-accent underline underline-offset-4 hover:no-underline"
          >
            Change photo
          </button>
        </figcaption>
      )}
    </figure>
  );
}
