import { sleep } from '../utils/helpers';

export const bucketSort = async (array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
    let arr = array.map(item => ({ ...item }));
    let n = arr.length;
    let stepCounter = 0;

    const totalSteps = 4 * n; // Approximation

    if (updateStepInfo) {
        updateStepInfo({
            totalSteps,
            currentStep: 0,
            operation: 'Starting Bucket Sort',
            explanation: 'Bucket Sort works by distributing elements into a number of buckets, sorting each bucket individually, and then merging them back together.',
            variables: { n }
        });
    }

    if (n === 0) return;

    // 1. Find Max
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

    // 2. Distribute into Buckets
    let buckets = Array.from({ length: n }, () => []);
    
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

        let bucketIdx = Math.floor((arr[i].value * n) / (max + 1));
        
        if (updateStepInfo) {
            updateStepInfo({
                currentStep: stepCounter,
                totalSteps,
                operation: `Distributing Elements`,
                explanation: `Placing value ${arr[i].value} into bucket ${bucketIdx} based on the formula: floor(value * n / (max + 1)).`,
                variables: { i, value: arr[i].value, bucketIdx }
            });
        }

        buckets[bucketIdx].push({ ...arr[i] });

        arr[i].status = 'default';
        setArray([...arr]);
    }

    // 3. Reconstruct Array from Buckets
    let idx = 0;
    let bucketBounds = [];
    for (let b = 0; b < n; b++) {
        let start = idx;
        for (let item of buckets[b]) {
            stepCounter++;
            if (stopSignal.current) return;
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            arr[idx] = item;
            arr[idx].status = 'swapping';
            setArray([...arr]);
            await sleep(speed);
            
            if (updateStepInfo) {
                updateStepInfo({
                    currentStep: stepCounter,
                    totalSteps,
                    operation: `Reconstructing Array`,
                    explanation: `Pulling value ${item.value} from bucket ${b} back into the main array at index ${idx}.`,
                    variables: { bucket: b, index: idx, value: item.value }
                });
            }

            arr[idx].status = 'default';
            setArray([...arr]);
            idx++;
        }
        let end = idx;
        if (end > start) {
            bucketBounds.push([start, end, b]);
        }
    }

    // 4. Sort Individual Buckets (Insertion Sort)
    for (let [start, end, b] of bucketBounds) {
        if (end - start <= 1) continue; // No need to sort 1 element

        for (let i = start + 1; i < end; i++) {
            stepCounter++;
            if (stopSignal.current) return;
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            let key = arr[i];
            key.status = 'pivot';
            setArray([...arr]);
            await sleep(speed);

            if (updateStepInfo) {
                updateStepInfo({
                    currentStep: stepCounter,
                    totalSteps,
                    operation: `Sorting Bucket ${b}`,
                    explanation: `Using Insertion Sort inside bucket ${b}. Checking element ${key.value}.`,
                    variables: { bucket: b, key: key.value }
                });
            }

            let j = i - 1;
            while (j >= start && arr[j].value > key.value) {
                arr[j].status = 'comparing';
                setArray([...arr]);
                await sleep(speed);

                arr[j + 1] = arr[j];
                arr[j + 1].status = 'swapping';
                setArray([...arr]);
                await sleep(speed);

                arr[j + 1].status = 'default';
                j--;
            }
            arr[j + 1] = key;
            arr[j + 1].status = 'default';
            setArray([...arr]);
            await sleep(speed);
        }
    }

    // Final sweep to mark as sorted
    for (let i = 0; i < n; i++) {
        if (stopSignal.current) return;
        arr[i].status = 'sorted';
    }
    setArray([...arr]);

    if (updateStepInfo) {
        updateStepInfo({
            currentStep: totalSteps,
            totalSteps,
            operation: 'Bucket Sort Complete',
            explanation: 'All buckets have been sorted and merged. The algorithm is finished!',
            variables: {}
        });
    }
};

export const bucketSortCPP = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void bucketSort(float arr[], int n) {
    if (n <= 0) return;

    // 1. Create n empty buckets
    vector<float> b[n];

    // 2. Put array elements in different buckets
    for (int i = 0; i < n; i++) {
        int bi = n * arr[i]; // Index in bucket
        b[bi].push_back(arr[i]);
    }

    // 3. Sort individual buckets
    for (int i = 0; i < n; i++) {
        sort(b[i].begin(), b[i].end());
    }

    // 4. Concatenate all buckets into arr[]
    int index = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < b[i].size(); j++) {
            arr[index++] = b[i][j];
        }
    }
}

int main() {
    float arr[] = {0.897, 0.565, 0.656, 0.1234, 0.665, 0.3434};
    int n = sizeof(arr) / sizeof(arr[0]);
    bucketSort(arr, n);

    cout << "Sorted array is \\n";
    for (int i = 0; i < n; i++)
        cout << arr[i] << " ";
    return 0;
}
`;

export const bucketSortJava = `import java.util.*;

public class BucketSort {
    public static void bucketSort(float[] arr, int n) {
        if (n <= 0) return;

        // 1. Create n empty buckets
        @SuppressWarnings("unchecked")
        Vector<Float>[] buckets = new Vector[n];
        for (int i = 0; i < n; i++) {
            buckets[i] = new Vector<Float>();
        }

        // 2. Put array elements in different buckets
        for (int i = 0; i < n; i++) {
            float idx = arr[i] * n;
            buckets[(int)idx].add(arr[i]);
        }

        // 3. Sort individual buckets
        for (int i = 0; i < n; i++) {
            Collections.sort(buckets[i]);
        }

        // 4. Concatenate all buckets into arr[]
        int index = 0;
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < buckets[i].size(); j++) {
                arr[index++] = buckets[i].get(j);
            }
        }
    }

    public static void main(String args[]) {
        float arr[] = { (float)0.897, (float)0.565, (float)0.656, 
                        (float)0.1234, (float)0.665, (float)0.3434 };
        int n = arr.length;
        bucketSort(arr, n);

        System.out.println("Sorted array is ");
        for (float el : arr) {
            System.out.print(el + " ");
        }
    }
}
`;

export const bucketSortPython = `def bucketSort(arr):
    n = len(arr)
    if n <= 0: return arr
    
    # 1. Create n empty buckets
    buckets = [[] for _ in range(n)]

    # 2. Put array elements in different buckets
    for num in arr:
        # Expected arr elements to be between 0.0 and 1.0 
        # For general integers, use: bi = (num * n) // (max(arr) + 1)
        bi = int(n * num)
        if bi == n:
            bi -= 1
        buckets[bi].append(num)

    # 3. Sort individual buckets
    for i in range(n):
        buckets[i] = sorted(buckets[i])

    # 4. Concatenate all buckets into arr[]
    index = 0
    for i in range(n):
        for j in range(len(buckets[i])):
            arr[index] = buckets[i][j]
            index += 1
            
    return arr

if __name__ == "__main__":
    arr = [0.897, 0.565, 0.656, 0.1234, 0.665, 0.3434]
    print("Sorted array is:", bucketSort(arr))
`;

export const bucketSortJS = `// Bucket Sort Implementation in JavaScript
function bucketSort(arr) {
    let n = arr.length;
    if (n <= 0) return arr;

    // Optional: Normalizing to handle arbitrary values (not just 0-1)
    let max = Math.max(...arr);
    
    // 1. Create n empty buckets
    let buckets = Array.from({ length: n }, () => []);

    // 2. Put array elements in different buckets
    for (let i = 0; i < n; i++) {
        let bucketIdx = Math.floor((arr[i] * n) / (max + 1));
        buckets[bucketIdx].push(arr[i]);
    }

    // 3. Sort individual buckets
    for (let i = 0; i < n; i++) {
        buckets[i].sort((a, b) => a - b);
    }

    // 4. Concatenate all buckets into arr[]
    let index = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < buckets[i].length; j++) {
            arr[index++] = buckets[i][j];
        }
    }

    return arr;
}

// Example usage
const arr = [0.897, 0.565, 0.656, 0.1234, 0.665, 0.3434];
// (For integers: [34, 12, 59, 1, 99, 45])
console.log("Original array:", arr);
console.log("Sorted array:", bucketSort(arr));
`;
