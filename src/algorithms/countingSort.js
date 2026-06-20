import { sleep } from '../utils/helpers';

export const countingSort = async (array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
    let arr = array.map(item => ({ ...item }));
    let n = arr.length;
    let stepCounter = 0;

    // Estimate total steps: finding max (n), counting (n), placing back (n)
    const totalSteps = 3 * n;

    // Initialize step info
    if (updateStepInfo) {
        updateStepInfo({
            totalSteps,
            currentStep: 0,
            operation: 'Starting Counting Sort',
            explanation: 'Counting Sort is a non-comparison sorting algorithm that counts the frequency of each element to place them in correct order.',
            variables: { n }
        });
    }

    // 1. Find Max Value
    let max = arr[0].value;
    for (let i = 0; i < n; i++) {
        stepCounter++;
        if (stopSignal.current) return;
        while (pauseSignal.current) {
            if (stopSignal.current) return;
            await sleep(100);
        }

        arr[i].status = 'comparing';
        setArray([...arr]);
        await sleep(speed);

        if (updateStepInfo) {
            updateStepInfo({
                currentStep: stepCounter,
                totalSteps,
                operation: `Finding Maximum Value`,
                explanation: `Checking if element at index ${i} (${arr[i].value}) is greater than current max (${max}).`,
                variables: { i, max, 'arr[i]': arr[i].value }
            });
        }

        if (arr[i].value > max) {
            max = arr[i].value;
        }

        arr[i].status = 'default';
        setArray([...arr]);
    }

    // 2. Count Frequencies
    let count = new Array(max + 1).fill(0);
    for (let i = 0; i < n; i++) {
        stepCounter++;
        if (stopSignal.current) return;
        while (pauseSignal.current) {
            if (stopSignal.current) return;
            await sleep(100);
        }

        arr[i].status = 'target';
        setArray([...arr]);
        await sleep(speed);

        count[arr[i].value]++;

        if (updateStepInfo) {
            updateStepInfo({
                currentStep: stepCounter,
                totalSteps,
                operation: `Counting Frequencies`,
                explanation: `Incrementing the count for value ${arr[i].value}. Its count is now ${count[arr[i].value]}.`,
                variables: { i, value: arr[i].value, [`count[${arr[i].value}]`]: count[arr[i].value] }
            });
        }

        arr[i].status = 'default';
        setArray([...arr]);
    }

    // 3. Reconstruct Array
    let k = 0;
    for (let i = 0; i <= max; i++) {
        while (count[i] > 0) {
            stepCounter++;
            if (stopSignal.current) return;
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            arr[k].value = i;
            arr[k].status = 'swapping';
            setArray([...arr]);
            await sleep(speed);

            if (updateStepInfo) {
                updateStepInfo({
                    currentStep: stepCounter,
                    totalSteps,
                    operation: `Placing Sorted Elements`,
                    explanation: `Placing value ${i} back into the array at index ${k} because its count is > 0.`,
                    variables: { k, value: i, remaining_count: count[i] - 1 }
                });
            }

            arr[k].status = 'sorted';
            setArray([...arr]);
            await sleep(speed);

            k++;
            count[i]--;
        }
    }

    // Final step
    if (updateStepInfo) {
        updateStepInfo({
            currentStep: totalSteps,
            totalSteps,
            operation: 'Counting Sort Complete',
            explanation: 'All elements have been placed back based on their frequency counts. The algorithm is finished!',
            variables: {}
        });
    }
};

export const countingSortCPP = `#include <iostream>
#include <vector>
#include <algorithm>

void countingSort(std::vector<int>& arr) {
    if (arr.empty()) return;

    // Find the maximum value
    int max = *std::max_element(arr.begin(), arr.end());

    // Create a count array
    std::vector<int> count(max + 1, 0);

    // Store counts
    for (int i = 0; i < arr.size(); i++) {
        count[arr[i]]++;
    }

    // Reconstruct the array
    int index = 0;
    for (int i = 0; i <= max; i++) {
        while (count[i] > 0) {
            arr[index++] = i;
            count[i]--;
        }
    }
}

int main() {
    std::vector<int> arr = {4, 2, 2, 8, 3, 3, 1};
    countingSort(arr);
    for (int num : arr) {
        std::cout << num << " ";
    }
    std::cout << std::endl;
    return 0;
}`;

export const countingSortJava = `import java.util.Arrays;

public class CountingSort {
    public static void countingSort(int[] arr) {
        if (arr.length == 0) return;

        // Find the maximum value
        int max = arr[0];
        for (int i = 1; i < arr.length; i++) {
            if (arr[i] > max) max = arr[i];
        }

        // Create a count array
        int[] count = new int[max + 1];

        // Store counts
        for (int i = 0; i < arr.length; i++) {
            count[arr[i]]++;
        }

        // Reconstruct the array
        int index = 0;
        for (int i = 0; i <= max; i++) {
            while (count[i] > 0) {
                arr[index++] = i;
                count[i]--;
            }
        }
    }

    public static void main(String[] args) {
        int[] arr = {4, 2, 2, 8, 3, 3, 1};
        countingSort(arr);
        System.out.println(Arrays.toString(arr));
    }
}`;

export const countingSortPython = `def counting_sort(arr):
    if not arr: return
    
    # Find the maximum value
    max_val = max(arr)
    
    # Create a count array
    count = [0] * (max_val + 1)
    
    # Store counts
    for num in arr:
        count[num] += 1
        
    # Reconstruct the array
    index = 0
    for i in range(max_val + 1):
        while count[i] > 0:
            arr[index] = i
            index += 1
            count[i] -= 1

if __name__ == "__main__":
    arr = [4, 2, 2, 8, 3, 3, 1]
    counting_sort(arr)
    print(arr)`;

export const countingSortJS = `// Counting Sort Implementation in JavaScript
function countingSort(arr) {
    if (arr.length === 0) return arr;

    // Find the maximum value
    let max = Math.max(...arr);

    // Create a count array
    let count = new Array(max + 1).fill(0);

    // Store counts
    for (let i = 0; i < arr.length; i++) {
        count[arr[i]]++;
    }

    // Reconstruct the array
    let index = 0;
    for (let i = 0; i <= max; i++) {
        while (count[i] > 0) {
            arr[index++] = i;
            count[i]--;
        }
    }

    return arr;
}

// Example usage
const arr = [4, 2, 2, 8, 3, 3, 1];
console.log("Original array:", arr);
countingSort(arr);
console.log("Sorted array:", arr);`;
