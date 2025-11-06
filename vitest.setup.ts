// vitest.setup.ts
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock global objects if needed
global.Headers = vi.fn();