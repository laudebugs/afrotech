// Fills in the note page's photos (<img data-photo>), from this device or the
// signed-in account. A photo found nowhere keeps its alt text and a note.
import { photoUrl } from "../lib/photos";
import { fetchPhotoFromAccount } from "./photo-fetch";

export function showNotePhotos(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>("img[data-photo]").forEach((img) => {
    img.dataset.missing = "";
    void photoUrl(img.dataset.photo!, fetchPhotoFromAccount).then((url) => {
      if (!url) {
        img.title = "This photo isn't on this device. Sign in to see photos from your other devices.";
        return;
      }
      img.src = url;
      delete img.dataset.missing;
    });
  });
}
