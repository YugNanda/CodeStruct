import { sleep } from '../utils/helpers';

export const bubbleSort = async (array, setArray, speed, stopSignal, pauseSignal, updateStepInfo) => {
    let arr = array.map(item => ({ ...item }));
    let n = arr.length;
    let stepCounter = 0;
    const totalSteps = n * (n - 1) / 2;

    // Initialize step info
    if (updateStepInfo) {
        updateStepInfo({
            totalSteps,
            currentStep: 0,
            operation: 'Starting Bubble Sort',
            explanation: 'Bubble Sort will iterate through the array, comparing adjacent elements and swapping them if they are in the wrong order.',
            variables: { i: 0, j: 0, n }
        });
    }

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            stepCounter++;

            // 1. CHECK FOR STOP
            if (stopSignal.current) return;

            // 2. CHECK FOR PAUSE (The Wait Loop)
            while (pauseSignal.current) {
                if (stopSignal.current) return;
                await sleep(100);
            }

            // Update step info for comparison
            if (updateStepInfo) {
                updateStepInfo({
                    currentStep: stepCounter,
                    totalSteps,
                    operation: `Comparing indices ${j} and ${j + 1}`,
                    explanation: `Checking if element at index ${j} (value: ${arr[j].value}) is greater than element at index ${j + 1} (value: ${arr[j + 1].value}).`,
                    variables: { i, j, 'arr[j]': arr[j].value, 'arr[j+1]': arr[j + 1].value, sorted: n - i - 1 }
                });
            }

            arr[j].status = 'comparing';
            arr[j + 1].status = 'comparing';
            setArray([...arr]);
            await sleep(speed);

            if (arr[j].value > arr[j + 1].value) {
                // Update step info for swap
                if (updateStepInfo) {
                    updateStepInfo({
                        currentStep: stepCounter,
                        totalSteps,
                        operation: `Swapping ${arr[j].value} and ${arr[j + 1].value}`,
                        explanation: `Since ${arr[j].value} > ${arr[j + 1].value}, we swap these two elements to move the larger value towards the right.`,
                        variables: { i, j, 'swapping': `${arr[j].value} ↔ ${arr[j + 1].value}`, sorted: n - i - 1 }
                    });
                }

                arr[j].status = 'swapping';
                arr[j + 1].status = 'swapping';

                let temp = arr[j].value;
                arr[j].value = arr[j + 1].value;
                arr[j + 1].value = temp;

                setArray([...arr]);
                await sleep(speed);
            }

            arr[j].status = 'default';
            arr[j + 1].status = 'default';
        }
        arr[n - 1 - i].status = 'sorted';
        setArray([...arr]);
        
        // Update step info for sorted element
        if (updateStepInfo) {
            updateStepInfo({
                currentStep: stepCounter,
                totalSteps,
                operation: `Element ${arr[n - 1 - i].value} is now sorted`,
                explanation: `The element at index ${n - 1 - i} is in its final sorted position.`,
                variables: { i, 'sorted index': n - 1 - i, 'sorted value': arr[n - 1 - i].value }
            });
        }
    }
    
    // Final step
    if (updateStepInfo) {
        updateStepInfo({
            currentStep: totalSteps,
            totalSteps,
            operation: 'Bubble Sort Complete',
            explanation: 'All elements have been sorted in ascending order. The algorithm is finished!',
            variables: {}
        });
    }
};

export const bubbleSortCPP = `#include <iostream>
#include <vector>
#include <algorithm> 
void bubbleSort(std::vector<int>& arr) {
    const std::size_t n = arr.size();
    if (n < 2) return;

    for (std::size_t i = 0; i < n - 1; ++i) {
        bool swapped = false;
        for (std::size_t j = 0; j < n - i - 1; ++j) {
            if (arr[j] > arr[j + 1]) {
                std::swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}

int main() {
    std::size_t n;
    std::cout << "Enter number of elements: ";
    if (!(std::cin >> n)) return 1;
    std::vector<int> arr(n);

    std::cout << "Enter " << n << " elements: " << std::endl;
    for (std::size_t i = 0; i < n; ++i) {
        std::cin >> arr[i];
    }

    bubbleSort(arr);     

    std::cout << "Sorted array: " << std::endl;
    for (const auto& element : arr) {
        std::cout << element << " ";
    }
    std::cout << std::endl;

    return 0;
}`;

export const bubbleSortJava = `import java.util.Scanner;

public class Main {
    public static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    // swap arr[j+1] and arr[j]
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter number of elements: ");
        int n = sc.nextInt();
        int[] arr = new int[n];
        
        System.out.println("Enter elements:");
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();

        bubbleSort(arr);

        System.out.println("Sorted array:");
        for (int i : arr) System.out.print(i + " ");
    }
}`;

export const bubbleSortPython = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

if __name__ == "__main__":
    arr = list(map(int, input("Enter number of elements: ").split()))
    bubble_sort(arr)
    print("Sorted array:", *arr)`;

export const bubbleSortJS = `// Bubble Sort Implementation in JavaScript
function bubbleSort(arr) {
    const n = arr.length;

    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap elements
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }

    return arr;
}

// Example usage
const arr = [64, 34, 25, 12, 22, 11, 90];
console.log(\"Original array:\", arr);

bubbleSort(arr);
console.log(\"Sorted array:\", arr);`;