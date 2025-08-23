import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock audio for tests since components use sound files
(globalThis as any).Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(),
  pause: vi.fn(),
  load: vi.fn(),
}));

// Mock window.print for receipt printing tests
Object.defineProperty(window, 'print', {
  value: vi.fn(),
  writable: true,
});

// Mock network adapter
vi.mock('../network/NetworkAdapter', () => ({
  networkAdapter: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));