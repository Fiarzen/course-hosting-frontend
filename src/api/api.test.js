import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios before importing the module under test
vi.mock('axios', () => {
  const instance = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { headers: { common: {} } } };
  return { default: { create: () => instance, ...instance } };
});

import { lessonsApi } from './api';
import axios from 'axios';

const axiosInstance = axios.create();

beforeEach(() => {
  vi.clearAllMocks();
});

describe('lessonsApi.getByCourse', () => {
  it('returns [] without calling API when courseId is a non-numeric string', async () => {
    const result = await lessonsApi.getByCourse('abc');
    expect(result).toEqual([]);
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('returns [] without calling API when courseId is a float', async () => {
    const result = await lessonsApi.getByCourse(1.5);
    expect(result).toEqual([]);
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('returns [] without calling API when courseId is undefined', async () => {
    const result = await lessonsApi.getByCourse(undefined);
    expect(result).toEqual([]);
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('calls the API with the numeric courseId when valid', async () => {
    axiosInstance.get.mockResolvedValue({ data: [{ id: 1, title: 'Intro' }] });
    const result = await lessonsApi.getByCourse(42);
    expect(axiosInstance.get).toHaveBeenCalledWith('/lessons/course/42');
    expect(result).toEqual([{ id: 1, title: 'Intro' }]);
  });

  it('accepts a numeric string courseId and calls the API', async () => {
    axiosInstance.get.mockResolvedValue({ data: [] });
    await lessonsApi.getByCourse('5');
    expect(axiosInstance.get).toHaveBeenCalledWith('/lessons/course/5');
  });
});
