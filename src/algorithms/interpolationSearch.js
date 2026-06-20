import { sleep } from '../utils/helpers';

export const interpolationSearch = async (array, setArray, speed, stopSignal, pauseSignal) => {
    // 1. Create a copy and SORT it (Interpolation Search requires a sorted array)
    let arr = array.map(item => ({ ...item })).sort((a, b) => a.value - b.value);
    let n = arr.length;

    // 2. Pick a random target from the array
    let randomIndex = Math.floor(Math.random() * n);
    let target = arr[randomIndex].value;

    // Highlight target element (Special color/marker)
    arr[randomIndex].status = 'target';
    setArray([...arr]);

    let low = 0;
    let high = n - 1;

    while (low <= high && target >= arr[low].value && target <= arr[high].value) {
        // --- STOP & PAUSE LOGIC ---
        if (stopSignal.current) return;
        while (pauseSignal.current) {
            if (stopSignal.current) return;
            await sleep(100);
        }

        if (low === high) {
            if (arr[low].value === target) {
                arr[low].status = 'sorted';
                setArray([...arr]);
            }
            return;
        }

        // Interpolation Formula for Position
        // pos = low + [ (high-low) / (arr[high]-arr[low]) ] * (target - arr[low])
        let pos = low + Math.floor(((high - low) / (arr[high].value - arr[low].value)) * (target - arr[low].value));

        // Mark calculated position as 'comparing'
        arr[pos].status = 'comparing';
        setArray([...arr]);
        await sleep(Math.max(speed, 500));

        if (arr[pos].value === target) {
            arr[pos].status = 'sorted'; // Found
            setArray([...arr]);
            await sleep(1000);
            return;
        }

        if (arr[pos].value < target) {
            // Target is in upper part, reset old lower part to default
            for (let i = low; i <= pos; i++) arr[i].status = 'default';
            low = pos + 1;
        } else {
            // Target is in lower part, reset old upper part to default
            for (let i = pos; i <= high; i++) arr[i].status = 'default';
            high = pos - 1;
        }
        
        setArray([...arr]);
    }
};

export const interpolationSearchCPP = `#include <iostream>
using namespace std;

int interpolationSearch(int arr[], int n, int x) {
    int low = 0, high = (n - 1);

    while (low <= high && x >= arr[low] && x <= arr[high]) {
        if (low == high) {
            if (arr[low] == x) return low;
            return -1;
        }

        // Probing the position with interpolation formula
        int pos = low + (((double)(high - low) / (arr[high] - arr[low])) * (x - arr[low]));

        if (arr[pos] == x) return pos;
        if (arr[pos] < x) low = pos + 1;
        else high = pos - 1;
    }
    return -1;
}

int main() {
    int arr[] = {10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47};
    int n = sizeof(arr) / sizeof(arr[0]);
    int x = 18; // Target
    int index = interpolationSearch(arr, n, x);

    if (index != -1) cout << "Element found at index " << index;
    else cout << "Element not found.";
    return 0;
}`;

export const interpolationSearchJava = `import java.util.Scanner;

public class Main {
    public static int interpolationSearch(int[] arr, int x) {
        int low = 0, high = (arr.length - 1);

        while (low <= high && x >= arr[low] && x <= arr[high]) {
            if (low == high) {
                if (arr[low] == x) return low;
                return -1;
            }

            int pos = low + (int)(((double)(high - low) / (arr[high] - arr[low])) * (x - arr[low]));

            if (arr[pos] == x) return pos;
            if (arr[pos] < x) low = pos + 1;
            else high = pos - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47};
        int target = 18;
        int result = interpolationSearch(arr, target);
        
        if (result != -1) System.out.println("Element found at index " + result);
        else System.out.println("Element not found");
    }
}`;

export const interpolationSearchPython = `def interpolation_search(arr, n, x):
    low = 0
    high = n - 1

    while low <= high and x >= arr[low] and x <= arr[high]:
        if low == high:
            if arr[low] == x:
                return low
            return -1

        # Interpolation formula
        pos = low + int(((float(high - low) / (arr[high] - arr[low])) * (x - arr[low])))

        if arr[pos] == x:
            return pos
        if arr[pos] < x:
            low = pos + 1
        else:
            high = pos - 1
            
    return -1

if __name__ == "__main__":
    arr = [10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47]
    target = 18
    index = interpolation_search(arr, len(arr), target)
    print(f"Element found at index {index}" if index != -1 else "Not found")`;

export const interpolationSearchJS = `// Interpolation Search Implementation in JavaScript
function interpolationSearch(arr, target) {
    let low = 0;
    let high = arr.length - 1;

    while (low <= high && target >= arr[low] && target <= arr[high]) {
        if (low === high) {
            if (arr[low] === target) return low;
            return -1;
        }

        // Interpolation formula to estimate position
        const pos = low + Math.floor(
            ((high - low) / (arr[high] - arr[low])) * (target - arr[low])
        );

        if (arr[pos] === target) {
            return pos;
        }

        if (arr[pos] < target) {
            low = pos + 1;
        } else {
            high = pos - 1;
        }
    }

    return -1; // Element not found
}

// Example usage
const arr = [10, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 33, 35, 42, 47];
const target = 18;

const result = interpolationSearch(arr, target);

if (result !== -1) {
    console.log(\"Element found at index:\", result);
} else {
    console.log(\"Element not found\");
}`;