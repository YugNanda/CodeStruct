import { sleep } from '../utils/helpers';

export const radixSort = async (array, setArray, speed, stopSignal, pauseSignal) => {
    let arr = array.map(item => ({ ...item }));

    if (arr.length === 0) return;

    const getMax = async (arr) => {
        let max = arr[0].value;
        let maxIdx = 0;

        // Highlight first element as initial max
        arr[0].status = 'pivot';
        setArray([...arr]);
        await sleep(speed);

        for (let i = 1; i < arr.length; i++) {
            if (stopSignal.current) return max;
            while (pauseSignal.current) {
                if (stopSignal.current) return max;
                await sleep(100);
            }

            // Highlight current element being compared
            arr[i].status = 'comparing';
            setArray([...arr]);
            await sleep(speed);

            if (arr[i].value > max) {
                // If new max found, reset old max status and highlight new max
                arr[maxIdx].status = 'default';
                max = arr[i].value;
                maxIdx = i;
                arr[maxIdx].status = 'pivot';
            } else {
                // Return current element to default
                arr[i].status = 'default';
            }

            setArray([...arr]);
            await sleep(speed);
        }

        // Blink the result
        for (let k = 0; k < 3; k++) {
            arr[maxIdx].status = 'default';
            setArray([...arr]);
            await sleep(150);
            arr[maxIdx].status = 'pivot';
            setArray([...arr]);
            await sleep(150);
        }

        // Reset status before sorting starts
        arr[maxIdx].status = 'default';
        setArray([...arr]);

        return max;
    };

    const countSort = async (exp) => {
        if (stopSignal.current) return;

        let output = new Array(arr.length);
        let count = new Array(10).fill(0);

        for (let i = 0; i < arr.length; i++) {
            if (stopSignal.current) return;
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            arr[i].status = 'comparing';
            setArray([...arr]);
            await sleep(Math.max(10, Math.floor(speed / 2)));

            count[Math.floor(arr[i].value / exp) % 10]++;

            arr[i].status = 'default';
            setArray([...arr]);
        }

        if (stopSignal.current) return;

        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        for (let i = arr.length - 1; i >= 0; i--) {
            if (stopSignal.current) return;
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            const digit = Math.floor(arr[i].value / exp) % 10;
            const index = count[digit] - 1;
            // CLONE THE OBJECT here to break reference with original array position
            output[index] = { ...arr[i] };
            count[digit]--;
        }

        for (let i = 0; i < arr.length; i++) {
            if (stopSignal.current) return;
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            arr[i] = output[i];
            arr[i].status = 'swapping';
            setArray([...arr]);
            await sleep(speed);

            arr[i].status = 'default';
            setArray([...arr]);
        }
    };

    let max = await getMax(arr);

    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        if (stopSignal.current) return;
        await countSort(exp);
    }

    for (let i = 0; i < arr.length; i++) {
        if (stopSignal.current) return;
        arr[i].status = 'sorted';
    }
    setArray([...arr]);
};

export const radixSortCPP = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int getMax(int arr[], int n) {
    int mx = arr[0];
    for (int i = 1; i < n; i++)
        if (arr[i] > mx)
            mx = arr[i];
    return mx;
}

void countSort(int arr[], int n, int exp) {
    int output[n];
    int i, count[10] = {0};

    for (i = 0; i < n; i++)
        count[(arr[i] / exp) % 10]++;

    for (i = 1; i < 10; i++)
        count[i] += count[i - 1];

    for (i = n - 1; i >= 0; i--) {
        output[count[(arr[i] / exp) % 10] - 1] = arr[i];
        count[(arr[i] / exp) % 10]--;
    }

    for (i = 0; i < n; i++)
        arr[i] = output[i];
}

void radixsort(int arr[], int n) {
    int m = getMax(arr, n);

    for (int exp = 1; m / exp > 0; exp *= 10)
        countSort(arr, n, exp);
}

int main() {
    int n;
    cout << "Enter number of elements: ";
    cin >> n;
    int arr[n];
    for (int i = 0; i < n; i++) cin >> arr[i];

    radixsort(arr, n);

    cout << "Sorted array: \\n";
    for (int i = 0; i < n; i++) cout << arr[i] << " ";
    return 0;
}`;

export const radixSortJava = `import java.util.*;

public class Main {
    // A utility function to get maximum value in arr[]
    static int getMax(int arr[], int n) {
        int mx = arr[0];
        for (int i = 1; i < n; i++)
            if (arr[i] > mx)
                mx = arr[i];
        return mx;
    }

    // A function to do counting sort of arr[] according to
    // the digit represented by exp.
    static void countSort(int arr[], int n, int exp) {
        int output[] = new int[n]; // output array
        int i;
        int count[] = new int[10];
        Arrays.fill(count, 0);

        // Store count of occurrences in count[]
        for (i = 0; i < n; i++)
            count[(arr[i] / exp) % 10]++;

        // Change count[i] so that count[i] now contains
        // actual position of this digit in output[]
        for (i = 1; i < 10; i++)
            count[i] += count[i - 1];

        // Build the output array
        for (i = n - 1; i >= 0; i--) {
            output[count[(arr[i] / exp) % 10] - 1] = arr[i];
            count[(arr[i] / exp) % 10]--;
        }

        // Copy the output array to arr[], so that arr[] now
        // contains sorted numbers according to current digit
        for (i = 0; i < n; i++)
            arr[i] = output[i];
    }

    // The main function to that sorts arr[] of size n using Radix Sort
    static void radixSort(int arr[], int n) {
        // Find the maximum number to know number of digits
        int m = getMax(arr, n);

        // Do counting sort for every digit. Note that instead
        // of passing digit number, exp is passed. exp is 10^i
        // where i is current digit number
        for (int exp = 1; m / exp > 0; exp *= 10)
            countSort(arr, n, exp);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter number of elements: ");
        int n = sc.nextInt();
        int[] arr = new int[n];
        
        System.out.println("Enter elements:");
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        radixSort(arr, n);

        System.out.println("Sorted array:");
        for (int i : arr) System.out.print(i + " ");
    }
}`;

export const radixSortPython = `def counting_sort(arr, exp):
    n = len(arr)
    output = [0] * n
    count = [0] * 10
    
    for i in range(n):
        index = arr[i] // exp
        count[index % 10] += 1
        
    for i in range(1, 10):
        count[i] += count[i - 1]
        
    for i in range(n - 1, -1, -1):
        index = arr[i] // exp
        output[count[index % 10] - 1] = arr[i]
        count[index % 10] -= 1
        
    for i in range(n):
        arr[i] = output[i]

def radix_sort(arr):
    if not arr:
        return
    max_val = max(arr)
    exp = 1
    while max_val // exp > 0:
        counting_sort(arr, exp)
        exp *= 10

if __name__ == "__main__":
    arr = list(map(int, input("Enter elements: ").split()))
    radix_sort(arr)
    print("Sorted array:", *arr)`;

export const radixSortJS = `// Radix Sort Implementation in JavaScript
function getMax(arr) {
    let max = arr[0];
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}

function countingSort(arr, exp) {
    const n = arr.length;
    const output = new Array(n);
    const count = new Array(10).fill(0);

    // Store count of occurrences
    for (let i = 0; i < n; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        count[digit]++;
    }

    // Change count[i] to actual position
    for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
    }

    // Build the output array
    for (let i = n - 1; i >= 0; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        count[digit]--;
    }

    // Copy output array to arr
    for (let i = 0; i < n; i++) {
        arr[i] = output[i];
    }
}

function radixSort(arr) {
    if (arr.length === 0) return arr;

    const max = getMax(arr);

    // Do counting sort for every digit
    for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        countingSort(arr, exp);
    }

    return arr;
}

// Example usage
const arr = [170, 45, 75, 90, 802, 24, 2, 66];
console.log(\"Original array:\", arr);

radixSort(arr);
console.log(\"Sorted array:\", arr);`;