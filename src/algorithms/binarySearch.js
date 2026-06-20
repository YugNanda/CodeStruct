import { sleep } from '../utils/helpers';

export const binarysearch = async(array, setArray, speed, stopSignal, pauseSignal) => {
    //making a copy to as we cant manipulate directly in react
    //sorting LOGIC
    let arr = array.map(item => ({ ...item }));
    arr.sort(function(a, b){return a.value - b.value});
    let n = arr.length;


    //selecting a random number
    let randnum = Math.floor(Math.random() * n);
    let target = arr[randnum].value;

    //setting Array as arr
    arr[randnum].status='target';
    setArray([...arr]);

    await sleep(1000);

    console.log(`binarySearch Search Target: ${target}`);

    let high=n-1;
    let low=0;
    let mid;
    while(low<=high){

        //stop logic
        if(stopSignal.current) return;

        //pause logic
        while(pauseSignal.current){
            if(stopSignal.current) return;
            await sleep(1000);
        }

        mid=Math.floor((high+low)/2);
        arr[mid].status="comparing";
        setArray([...arr]);//setting to yellow for comparing
        await sleep(Math.max(speed, 1000));

        if(arr[mid].value==target){
            arr[mid].status='sorted'; //marking Green
            setArray([...arr]);
            await sleep(1000);
            return;
        }
        if(arr[mid].value>target){
            high=mid-1;
            for(let i=mid;i<n;i++){
                arr[i].status='swapping'//marking red for showing discarded
            }
            setArray([...arr]);
        }
        else{
            low=mid+1;
            for(let i=mid;i>=0;i--){
                arr[i].status='swapping'
            }
            setArray([...arr]);
        }
    }
    console.log("Element does not exist in array");
}

export const binarySearchCPP = `#include <iostream>
using namespace std;

void binarysearch(int arr[],int target,int n){
    int low=0;
    int high=n-1;
    int mid;
    while(low<=high){
        mid=(high+low)/2;
        if(arr[mid]==target){
            cout<<"Element has been found at position "<<mid;
            return;
        }
        if(arr[mid]>target){
            high=mid-1;
        }
        else{
            low=mid+1;
        }
    }
    cout<<"Element does not exist in array";
}

int main(){
    int n;
    int target;
    cout<<"Enter the number of elements and elements";
    cin>>n;
    int arr[n];
    for(int i=0;i<n;i++){
        cin>>arr[i];
    }
    cout<<"Enter the target";
    cin>>target;

    binarysearch(arr,target,n);
}`;

export const binarySearchJava = `import java.util.Arrays;
import java.util.Scanner;

public class Main {
    public static int binarySearch(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;

            if (arr[mid] == target)
                return mid;

            if (arr[mid] < target)
                left = mid + 1;
            else
                right = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter number of elements: ");
        int n = sc.nextInt();
        int[] arr = new int[n];
        
        System.out.println("Enter sorted elements:");
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        
        System.out.print("Enter target: ");
        int target = sc.nextInt();

        int result = binarySearch(arr, target);
        System.out.println(result == -1 ? "Not found" : "Found at index: " + result);
    }
}`;

export const binarySearchPython = `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = left + (right - left) // 2
        
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

if __name__ == "__main__":
    arr = list(map(int, input("Enter sorted elements: ").split()))
    target = int(input("Enter target: "))
    
    result = binary_search(arr, target)
    
    if result != -1:
        print(f"Element found at index: {result}")
    else:
        print("Element not found")`;

export const binarySearchJS = `// Binary Search Implementation in JavaScript
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = Math.floor(left + (right - left) / 2);

        if (arr[mid] === target) {
            return mid;
        }

        if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1; // Element not found
}

// Example usage
const arr = [10, 20, 30, 50, 70, 80];
const target = 30;

// Ensure array is sorted
arr.sort((a, b) => a - b);

const result = binarySearch(arr, target);

if (result !== -1) {
    console.log("Element found at index:", result);
} else {
    console.log("Element not found");
}`;