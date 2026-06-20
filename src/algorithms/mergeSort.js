import { sleep } from '../utils/helpers';

export const mergeSort = async (
  array,
  setArray,
  speed,
  stopSignal,
  pauseSignal,
  updateStepInfo
) => {

  let arr = array.map(item => ({ ...item }));

  const checkPauseAndStop = async () => {
    if (stopSignal.current) return true;

    while (pauseSignal.current) {
      if (stopSignal.current) return true;
      await sleep(100);
    }

    return false;
  };

  const merge = async (left, mid, right) => {
    let leftArr = arr.slice(left, mid + 1).map(item => ({ ...item }));
    let rightArr = arr.slice(mid + 1, right + 1).map(item => ({ ...item }));

    let i = 0;
    let j = 0;
    let k = left;

    while (i < leftArr.length && j < rightArr.length) {

      if (await checkPauseAndStop()) return;
      arr[k].status = 'comparing';
      setArray([...arr]);
      if (updateStepInfo) {
        updateStepInfo({
          operation: `Comparing values for merge`,
        });
      }
      await sleep(speed);

      if (leftArr[i].value <= rightArr[j].value) {
        arr[k] = { ...leftArr[i], status: 'default' }; 
        i++;
      } else {
        arr[k] = { ...rightArr[j], status: 'default' };
        j++;
      }

      setArray([...arr]);
      k++;
    }

    while (i < leftArr.length) {

      if (await checkPauseAndStop()) return;

      arr[k].status = 'comparing';
      setArray([...arr]);
      if (updateStepInfo) {
        updateStepInfo({
          operation: `Placing remaining element`,
        });
      }
      await sleep(speed);

      arr[k] = { ...leftArr[i], status: 'default' };
      setArray([...arr]);

      i++;
      k++;
    }

    while (j < rightArr.length) {

      if (await checkPauseAndStop()) return;

      arr[k].status = 'comparing';
      setArray([...arr]);
      if (updateStepInfo) {
        updateStepInfo({
          operation: `Placing remaining element`,
        });
      }
      await sleep(speed);

      arr[k] = { ...rightArr[j], status: 'default' };
      setArray([...arr]);

      j++;
      k++;
    }
  };

  const mergeSortHelper = async (left, right) => {
    if (left >= right || stopSignal.current) return;

    const mid = Math.floor((left + right) / 2);

    await mergeSortHelper(left, mid);
    await mergeSortHelper(mid + 1, right);

    if (stopSignal.current) return;

    await merge(left, mid, right);
  };

  await mergeSortHelper(0, arr.length - 1);

  if (stopSignal.current) return;

  // Final sorted state
  for (let i = 0; i < arr.length; i++) {
    arr[i].status = 'sorted';
  }

  setArray([...arr]);
};

export const mergeSortCPP = `#include <iostream>
using namespace std;

void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    // Create temporary arrays
    int L[n1], R[n2];

    // Copy data to temp arrays
    for (int i = 0; i < n1; i++)
        L[i] = arr[left + i];
    for (int j = 0; j < n2; j++)
        R[j] = arr[mid + 1 + j];

    // Merge the temp arrays back
    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }

    // Copy remaining elements of L[]
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }

    // Copy remaining elements of R[]
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

void mergeSort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        // Sort first and second halves
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        // Merge sorted halves
        merge(arr, left, mid, right);
    }
}

int main() {
    int n;
    cout << "Enter number of elements: ";
    cin >> n;

    int arr[n];
    for (int i = 0; i < n; i++)
        cin >> arr[i];

    mergeSort(arr, 0, n - 1);

    cout << "Sorted array: \\n";
    for (int i = 0; i < n; i++)
        cout << arr[i] << " ";

    return 0;
}`;
export const mergeSortPython = `def merge(arr, left, mid, right):
    n1 = mid - left + 1
    n2 = right - mid

    L = arr[left:mid + 1]
    R = arr[mid + 1:right + 1]

    i = 0
    j = 0
    k = left

    while i < n1 and j < n2:
        if L[i] <= R[j]:
            arr[k] = L[i]
            i += 1
        else:
            arr[k] = R[j]
            j += 1
        k += 1

    while i < n1:
        arr[k] = L[i]
        i += 1
        k += 1

    while j < n2:
        arr[k] = R[j]
        j += 1
        k += 1


def mergeSort(arr, left, right):
    if left < right:
        mid = left + (right - left) // 2

        mergeSort(arr, left, mid)
        mergeSort(arr, mid + 1, right)

        merge(arr, left, mid, right)


if __name__ == "__main__":
    n = int(input("Enter number of elements: "))
    arr = list(map(int, input().split()))

    mergeSort(arr, 0, n - 1)

    print("Sorted array:")
    print(*arr)
`;
export const mergeSortJava = `import java.util.Scanner;

public class MergeSort {

    static void merge(int arr[], int left, int mid, int right) {
        int n1 = mid - left + 1;
        int n2 = right - mid;

        int L[] = new int[n1];
        int R[] = new int[n2];

        for (int i = 0; i < n1; i++)
            L[i] = arr[left + i];

        for (int j = 0; j < n2; j++)
            R[j] = arr[mid + 1 + j];

        int i = 0, j = 0, k = left;

        while (i < n1 && j < n2) {
            if (L[i] <= R[j]) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            k++;
        }

        while (i < n1) {
            arr[k] = L[i];
            i++;
            k++;
        }

        while (j < n2) {
            arr[k] = R[j];
            j++;
            k++;
        }
    }

    static void mergeSort(int arr[], int left, int right) {
        if (left < right) {
            int mid = left + (right - left) / 2;

            mergeSort(arr, left, mid);
            mergeSort(arr, mid + 1, right);

            merge(arr, left, mid, right);
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.print("Enter number of elements: ");
        int n = sc.nextInt();

        int arr[] = new int[n];

        for (int i = 0; i < n; i++)
            arr[i] = sc.nextInt();

        mergeSort(arr, 0, n - 1);

        System.out.println("Sorted array:");
        for (int i = 0; i < n; i++)
            System.out.print(arr[i] + " ");

        sc.close();
    }
}`;
export const mergeSortJS = `function merge(arr, left, mid, right) {
  const n1 = mid - left + 1;
  const n2 = right - mid;

  const L = arr.slice(left, mid + 1);
  const R = arr.slice(mid + 1, right + 1);

  let i = 0, j = 0, k = left;

  while (i < n1 && j < n2) {
      if (L[i] <= R[j]) {
          arr[k] = L[i];
          i++;
      } else {
          arr[k] = R[j];
          j++;
      }
      k++;
  }

  while (i < n1) {
      arr[k] = L[i];
      i++;
      k++;
  }

  while (j < n2) {
      arr[k] = R[j];
      j++;
      k++;
  }
}

function mergeSort(arr, left, right) {
  if (left < right) {
      const mid = Math.floor(left + (right - left) / 2);

      mergeSort(arr, left, mid);
      mergeSort(arr, mid + 1, right);

      merge(arr, left, mid, right);
  }
}

// Example usage
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter numbers separated by space: ", (input) => {
  const arr = input.split(" ").map(Number);

  mergeSort(arr, 0, arr.length - 1);

  console.log("Sorted array:");
  console.log(arr.join(" "));
  rl.close();
});
`;