import { sleep } from '../utils/helpers';

export const selectionSort = async (array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
  let arr = array.map(item => ({ ...item }));
  const n = arr.length;
  let stepCounter = 0;
  const totalSteps = (n * (n - 1)) / 2;

  if (updateStepInfo) {
    updateStepInfo({
      totalSteps,
      currentStep: 0,
      operation: 'Starting Selection Sort',
      explanation: 'Selection Sort finds the minimum element from the unsorted part and puts it at the beginning.',
    });
  }

  for (let i = 0; i < n; i++) {
    if (stopSignal.current) return;
    while (pauseSignal.current) {
      if (stopSignal.current) return;
      await sleep(100);
    }

    let minIndex = i;
    arr[minIndex].status = 'swapping';
    setArray([...arr]);
    await sleep(speed);

    for (let j = i + 1; j < n; j++) {
      if (stopSignal.current) return;
      while (pauseSignal.current) {
        if (stopSignal.current) return;
        await sleep(100);
      }

      arr[j].status = 'comparing';
      setArray([...arr]);
      
      stepCounter++;
      if (updateStepInfo) {
        updateStepInfo({
          currentStep: stepCounter,
          totalSteps,
          operation: `Comparing index ${j} with current minimum`,
        });
      }
      await sleep(speed);

      if (arr[j].value < arr[minIndex].value) {
        arr[minIndex].status = 'default';
        minIndex = j;
        arr[minIndex].status = 'swapping';
        setArray([...arr]);
        await sleep(speed);
      } else {
        arr[j].status = 'default';
      }
    }

    if (stopSignal.current) return;
    while (pauseSignal.current) {
      if (stopSignal.current) return;
      await sleep(100);
    }

    if (minIndex !== i) {
      if (updateStepInfo) {
        updateStepInfo({
          currentStep: stepCounter,
          totalSteps,
          operation: `Swapping indices ${i} and ${minIndex}`,
        });
      }
      arr[i].status = 'swapping';
      arr[minIndex].status = 'swapping';
      setArray([...arr]);
      await sleep(speed);

      const temp = arr[i].value;
      arr[i].value = arr[minIndex].value;
      arr[minIndex].value = temp;

      setArray([...arr]);
      await sleep(speed);

      arr[minIndex].status = 'default';
    } else {
      arr[minIndex].status = 'default';
    }

    arr[i].status = 'sorted';
    setArray([...arr]);
  }
};

export const selectionSortCPP = `#include <iostream>
using namespace std;

void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        if (minIndex != i) {
            int temp = arr[i];
            arr[i] = arr[minIndex];
            arr[minIndex] = temp;
        }
    }
}

int main() {
    int n;
    cout << "Enter number of elements: ";
    cin >> n;

    int arr[n];
    for (int i = 0; i < n; i++) cin >> arr[i];

    selectionSort(arr, n);

    cout << "Sorted array: \\n";
    for (int i = 0; i < n; i++) cout << arr[i] << " ";
    return 0;
}`;

export const selectionSortJava = `import java.util.Scanner;

public class Main {
    public static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) {
                    minIdx = j;
                }
            }
            int temp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = temp;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter number of elements: ");
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        selectionSort(arr);

        System.out.println("Sorted array:");
        for (int i : arr) System.out.print(i + " ");
    }
}`;

export const selectionSortPython = `def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]

if __name__ == "__main__":
    arr = list(map(int, input("Enter elements: ").split()))
    selection_sort(arr)
    print("Sorted array:", *arr)`;

export const selectionSortJS = `// Selection Sort Implementation in JavaScript
function selectionSort(arr) {
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        let minIndex = i;

        // Find the minimum element in unsorted array
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }

        // Swap the found minimum element with the first element
        if (minIndex !== i) {
            [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
        }
    }

    return arr;
}

// Example usage
const arr = [64, 25, 12, 22, 11];
console.log(\"Original array:\", arr);

selectionSort(arr);
console.log(\"Sorted array:\", arr);`;