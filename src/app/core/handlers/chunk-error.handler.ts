import { ErrorHandler, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const RELOAD_KEY = 'forehapp_chunk_reload';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  private platformId = inject(PLATFORM_ID);

  handleError(error: unknown): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.error(error);
      return;
    }

    const msg = (error as any)?.message ?? '';
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      (error as any)?.name === 'ChunkLoadError';

    if (isChunkError) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    }

    console.error(error);
  }
}
