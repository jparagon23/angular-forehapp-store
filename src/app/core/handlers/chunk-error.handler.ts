import { ErrorHandler, Injectable } from '@angular/core';

const RELOAD_KEY = 'forehapp_chunk_reload';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    const msg = (error as any)?.message ?? '';
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      (error as any)?.name === 'ChunkLoadError';

    if (isChunkError) {
      // Guard against infinite reload loops: only reload once per session
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return;
      }
    }

    console.error(error);
  }
}
