export const kadaneCPP = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int maxSubArraySum(const vector<int>& nums) {
    if (nums.empty()) return 0;
    
    int current_max = nums[0];
    int max_so_far = nums[0];
    
    for (size_t i = 1; i < nums.size(); ++i) {
        current_max = max(nums[i], current_max + nums[i]);
        max_so_far = max(max_so_far, current_max);
    }
    
    return max_so_far;
}

int main() {
    vector<int> nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    cout << "Maximum Subarray Sum: " << maxSubArraySum(nums) << endl;
    return 0;
}
`;

export const kadaneJava = `public class Main {
    public static int maxSubArraySum(int[] nums) {
        if (nums == null || nums.length == 0) return 0;
        
        int currentMax = nums[0];
        int maxSoFar = nums[0];
        
        for (int i = 1; i < nums.length; i++) {
            currentMax = Math.max(nums[i], currentMax + nums[i]);
            maxSoFar = Math.max(maxSoFar, currentMax);
        }
        
        return maxSoFar;
    }
    
    public static void main(String[] args) {
        int[] nums = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println("Maximum Subarray Sum: " + maxSubArraySum(nums));
    }
}
`;

export const kadanePython = `def max_sub_array_sum(nums):
    if not nums:
        return 0
        
    current_max = nums[0]
    max_so_far = nums[0]
    
    for i in range(1, len(nums)):
        current_max = max(nums[i], current_max + nums[i])
        max_so_far = max(max_so_far, current_max)
        
    return max_so_far

# Example usage
nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
print("Maximum Subarray Sum:", max_sub_array_sum(nums))
`;

export const kadaneJS = `function maxSubArraySum(nums) {
    if (nums.length === 0) return 0;
    
    let currentMax = nums[0];
    let maxSoFar = nums[0];
    
    for (let i = 1; i < nums.length; i++) {
        currentMax = Math.max(nums[i], currentMax + nums[i]);
        maxSoFar = Math.max(maxSoFar, currentMax);
    }
    
    return maxSoFar;
}

// Example usage
const nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
console.log("Maximum Subarray Sum:", maxSubArraySum(nums));
`;

export const generateKadaneSteps = (array) => {
  const steps = [];
  if (!array || array.length === 0) return steps;

  let maxSoFar = array[0];
  let currentMax = array[0];
  let start = 0;
  let end = 0;
  let currentStart = 0;

  steps.push({
    index: 0,
    value: array[0],
    currentMax,
    maxSoFar,
    start,
    end,
    currentStart,
    description: `Initialize sums with the first element: ${array[0]}.`,
    phase: "Initialize"
  });

  for (let i = 1; i < array.length; i++) {
    const val = array[i];

    steps.push({
      index: i,
      value: val,
      currentMax,
      maxSoFar,
      start,
      end,
      currentStart,
      description: `Examine element at index ${i}: ${val}. `,
      phase: "Evaluate"
    });

    if (val > currentMax + val) {
      currentMax = val;
      currentStart = i;
      steps.push({
        index: i,
        value: val,
        currentMax,
        maxSoFar,
        start,
        end,
        currentStart,
        description: `${val} is greater than ${currentMax - val} + ${val}. Starting a new subarray at index ${i}. currentMax becomes ${currentMax}.`,
        phase: "Restart Subarray"
      });
    } else {
      const prevMax = currentMax;
      currentMax = currentMax + val;
      steps.push({
        index: i,
        value: val,
        currentMax,
        maxSoFar,
        start,
        end,
        currentStart,
        description: `Adding ${val} to the current subarray sum (${prevMax}). currentMax becomes ${currentMax}.`,
        phase: "Extend Subarray"
      });
    }

    if (currentMax > maxSoFar) {
      maxSoFar = currentMax;
      start = currentStart;
      end = i;
      steps.push({
        index: i,
        value: val,
        currentMax,
        maxSoFar,
        start,
        end,
        currentStart,
        description: `Found new global maximum! maxSoFar becomes ${maxSoFar}. Subarray is now [ ${start} , ${end} ].`,
        phase: "New Record"
      });
    } else {
      steps.push({
        index: i,
        value: val,
        currentMax,
        maxSoFar,
        start,
        end,
        currentStart,
        description: `currentMax (${currentMax}) is not strictly greater than maxSoFar (${maxSoFar}). Keeping previous record.`,
        phase: "Compare Max"
      });
    }
  }

  steps.push({
    index: null,
    value: null,
    currentMax,
    maxSoFar,
    start,
    end,
    currentStart,
    description: `Algorithm complete. Maximum contiguous subarray sum is ${maxSoFar} (indices ${start} to ${end}).`,
    phase: "Done"
  });

  return steps;
};

export const generateRandomArray = (size = 8, min = -10, max = 15) => {
  return Array.from({ length: size }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  );
};

export const PRESET_ARRAYS = [
  {
    label: "Classic Example",
    array: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
  },
  {
    label: "All Positives",
    array: [1, 2, 3, 4, 5, 6]
  },
  {
    label: "All Negatives",
    array: [-3, -5, -2, -9, -1, -4]
  },
  {
    label: "Alternating",
    array: [5, -3, 5, -3, 5, -3]
  },
  {
    label: "Large Single Element",
    array: [-1, -2, 100, -3, -4]
  }
];
