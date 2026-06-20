import { sleep } from '../utils/helpers';

export const insertionSort = async (array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
  let arr = array.map(item => ({ ...item }));
  const n = arr.length;

  for (let i = 1; i < n; i++) {
    if (stopSignal.current) return;
    while (pauseSignal.current) {
      if (stopSignal.current) return;
      await sleep(100);
    }

    let j = i;
    arr[i].status = 'comparing';
    setArray([...arr]);
    if (updateStepInfo) {
      updateStepInfo({
        operation: `Comparing index ${i}`,
      });
    }
    await sleep(speed);

    while (j > 0 && arr[j - 1].value > arr[j].value) {
      if (stopSignal.current) return;
      while (pauseSignal.current) {
        if (stopSignal.current) return;
        await sleep(100);
      }

      arr[j].status = 'swapping';
      arr[j - 1].status = 'swapping';
      setArray([...arr]);
      if (updateStepInfo) {
        updateStepInfo({
          operation: `Swapping indices ${j} and ${j - 1}`,
        });
      }
      await sleep(speed);

      const temp = arr[j].value;
      arr[j].value = arr[j - 1].value;
      arr[j - 1].value = temp;

      setArray([...arr]);
      await sleep(speed);

      arr[j].status = 'default';
      j--;
    }

    arr[j].status = 'default';
    for (let k = 0; k <= i; k++) arr[k].status = 'sorted';
    setArray([...arr]);
  }
};

export const insertionSortCPP = `#include <iostream>
using namespace std;

void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

int main() {
    int n;
    cout << "Enter number of elements: ";
    cin >> n;

    int arr[n];
    for (int i = 0; i < n; i++) cin >> arr[i];

    insertionSort(arr, n);

    cout << "Sorted array: \\n";
    for (int i = 0; i < n; i++) cout << arr[i] << " ";
    return 0;
}`;

export const insertionSortJava = `import java.util.Scanner;

public class Main {
    public static void insertionSort(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; ++i) {
            int key = arr[i];
            int j = i - 1;

            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j = j - 1;
            }
            arr[j + 1] = key;
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        insertionSort(arr);

        for (int i : arr) System.out.print(i + " ");
    }
}`;

export const insertionSortPython = `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key

if __name__ == "__main__":
    arr = list(map(int, input("Enter elements: ").split()))
    insertion_sort(arr)
    print("Sorted array:", *arr)`;

export const insertionSortJS = `// Insertion Sort Implementation in JavaScript
function insertionSort(arr) {
    const n = arr.length;

    for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;

        // Move elements greater than key one position ahead
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }

    return arr;
}

// Example usage
const arr = [12, 11, 13, 5, 6];
console.log(\"Original array:\", arr);

insertionSort(arr);
console.log(\"Sorted array:\", arr);`;