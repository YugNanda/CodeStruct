import { describe, it, expect, vi } from 'vitest';
import { bubbleSort } from '../bubbleSort';

describe('Bubble Sort Algorithm', () => {
  it('correctly sorts an array of items', async () => {
    // Initial unsorted array
    const initialArray = [
      { id: 1, value: 5 },
      { id: 2, value: 3 },
      { id: 3, value: 8 },
      { id: 4, value: 1 },
      { id: 5, value: 2 }
    ];

    // Mock functions and signals
    let finalArray = [];
    const setArrayMock = vi.fn((newArr) => {
      finalArray = newArr;
    });
    
    // speed=0 to run instantly, fake signals as "unpaused" and "unstopped"
    const speed = 0;
    const stopSignal = { current: false };
    const pauseSignal = { current: false };
    const updateStepInfoMock = vi.fn();

    // Run bubble sort
    await bubbleSort(
      initialArray,
      setArrayMock,
      speed,
      stopSignal,
      pauseSignal,
      updateStepInfoMock
    );

    // Extract the final values to verify
    const sortedValues = finalArray.map(item => item.value);

    expect(sortedValues).toEqual([1, 2, 3, 5, 8]);
    
    // Check that items' status was marked as 'sorted'
    finalArray.forEach(item => {
      expect(item.status).toBe('sorted');
    });
  });

  it('stops early if stopSignal is triggered', async () => {
    const initialArray = [{ id: 1, value: 2 }, { id: 2, value: 1 }];
    const setArrayMock = vi.fn();
    
    // Pre-trigger the stop signal
    const stopSignal = { current: true };
    const pauseSignal = { current: false };

    await bubbleSort(initialArray, setArrayMock, 0, stopSignal, pauseSignal);

    // setArray should not be called because it stopped immediately before making sorting changes
    expect(setArrayMock).not.toHaveBeenCalled();
  });
});