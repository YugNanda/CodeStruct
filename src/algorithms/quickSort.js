import { sleep } from '../utils/helpers';

export const quickSort = async (array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
    let arr = array.map(item => ({ ...item }));

    // Main Recursive Function
    const solve = async (low, high) => {
        if (low < high) {
            let pivotIdx = await partition(arr, low, high, setArray, speed, stopSignal, pauseSignal, updateStepInfo);

            if (pivotIdx === -1) return; // Stop if signal received

            await solve(low, pivotIdx - 1);
            await solve(pivotIdx + 1, high);
        } else if (low >= 0 && low < arr.length) {
            // Single element is always sorted
            arr[low].status = 'sorted';
            setArray([...arr]);
        }
    };

    await solve(0, arr.length - 1);

    // Ensure everything is marked sorted at the end
    if (!stopSignal.current) {
        arr.forEach(item => item.status = 'sorted');
        setArray([...arr]);
    }
};

const partition = async (arr, low, high, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
    let pivotValue = arr[high].value;
    arr[high].status = 'pivot'; // Highlight Pivot with color
    setArray([...arr]);

    let i = low - 1;

    for (let j = low; j < high; j++) {

        // STOP & PAUSE LOGIC 
        if (stopSignal.current) return -1;

        while (pauseSignal.current) {
            if (stopSignal.current) return -1;
            await sleep(100);
        }

        arr[j].status = 'comparing';
        setArray([...arr]);
        if (updateStepInfo) {
            updateStepInfo({
                operation: `Comparing index ${j} with pivot`,
            });
        }
        await sleep(speed);

        if (arr[j].value < pivotValue) {
            i++;
            if (updateStepInfo) {
                updateStepInfo({
                    operation: `Swapping indices ${i} and ${j}`,
                });
            }
            [arr[i].value, arr[j].value] = [arr[j].value, arr[i].value];

            setArray([...arr]);
            await sleep(speed);

            arr[i].status = 'default';
        }
        arr[j].status = 'default';
    }

    if (stopSignal.current) return -1;
    while (pauseSignal.current) {
        if (stopSignal.current) return -1;
        await sleep(100);
    }

    // Pivot placement swap
    [arr[i + 1].value, arr[high].value] = [arr[high].value, arr[i + 1].value];

    arr[high].status = 'default';
    arr[i + 1].status = 'sorted'; // Pivot is now in its correct place
    setArray([...arr]);
    await sleep(speed);

    return i + 1;
};


export const quickSortCPP = `#include <iostream>
using namespace std;

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j <= high - 1; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return (i + 1);
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    int arr[] = {10, 7, 8, 9, 1, 5};
    int n = sizeof(arr) / sizeof(arr[0]);
    quickSort(arr, 0, n - 1);
    cout << "Sorted array: ";
    for (int i = 0; i < n; i++) cout << arr[i] << " ";
    return 0;
}`;

export const quickSortJava = `import java.util.Scanner;

public class Main {
    static int partition(int[] arr, int low, int high) {
        int pivot = arr[high];
        int i = (low - 1);
        for (int j = low; j < high; j++) {
            if (arr[j] < pivot) {
                i++;
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
        int temp = arr[i + 1];
        arr[i + 1] = arr[high];
        arr[high] = temp;
        return i + 1;
    }

    static void quickSort(int[] arr, int low, int high) {
        if (low < high) {
            int pi = partition(arr, low, high);
            quickSort(arr, low, pi - 1);
            quickSort(pi + 1, high);
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        quickSort(arr, 0, n - 1);

        for (int i : arr) System.out.print(i + " ");
    }
}`;

export const quickSortPython = `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

if __name__ == "__main__":
    arr = list(map(int, input("Enter elements: ").split()))
    quick_sort(arr, 0, len(arr) - 1)
    print("Sorted array:", *arr)`;

export const quickSortJS = `// Quick Sort Implementation in JavaScript
function partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}

function quickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        const pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
    return arr;
}

// Example usage
const arr = [10, 7, 8, 9, 1, 5];
console.log(\"Original array:\", arr);

quickSort(arr);
console.log(\"Sorted array:\", arr);`;