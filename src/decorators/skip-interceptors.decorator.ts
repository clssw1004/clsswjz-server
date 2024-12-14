import { SetMetadata } from '@nestjs/common';

export const SKIP_INTERCEPTORS_KEY = 'skipInterceptors';
export const SkipInterceptors = () => SetMetadata(SKIP_INTERCEPTORS_KEY, true); 