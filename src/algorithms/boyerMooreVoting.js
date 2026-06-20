export const boyerMooreCPP = `#include <iostream>
#include <vector>
using namespace std;

int findMajorityElement(vector<int>& nums) {
    int candidate = -1, count = 0;

    // Phase 1: Find Candidate
    for (int num : nums) {
        if (count == 0) {
            candidate = num;
            count = 1;
        } else if (num == candidate) count++;
        else count--;
    }

    // Phase 2: Verify Candidate
    int actualCount = 0;
    for (int num : nums) {
        if (num == candidate) actualCount++;
    }

    return (actualCount > nums.size() / 2) ? candidate : -1;
}
`;

export const boyerMooreJava = `public class BoyerMoore {
    public static int findMajority(int[] nums) {
        int candidate = -1, count = 0;
        // Phase 1: Find Candidate
        for (int num : nums) {
            if (count == 0) {
                candidate = num;
                count = 1;
            } else if (num == candidate) count++;
            else count--;
        }
        // Phase 2: Verification
        int actualCount = 0;
        for (int n : nums) if (n == candidate) actualCount++;
        return actualCount > nums.length / 2 ? candidate : -1;
    }
}
`;

export const boyerMoorePython = `def boyer_moore(nums):
    candidate, count = None, 0
    # Phase 1
    for num in nums:
        if count == 0:
            candidate, count = num, 1
        elif num == candidate:
            count += 1
        else:
            count -= 1
            
    # Phase 2: Verification
    if nums.count(candidate) > len(nums) // 2:
        return candidate
    return -1
`;

export const boyerMooreJS = `function boyerMoore(nums) {
    let candidate = null, count = 0;
    // Phase 1
    for (let num of nums) {
        if (count === 0) { candidate = num; count = 1; }
        else if (num === candidate) count++;
        else count--;
    }
    // Phase 2
    const actualCount = nums.filter(x => x === candidate).length;
    return actualCount > nums.length / 2 ? candidate : -1;
}
`;

export const generateBoyerMooreSteps = (array) => {
    const steps = [];
    let candidate = null;
    let count = 0;

    // --- PHASE 1: CANDIDATE FINDING ---
    steps.push({
        phase: 1,
        array: [...array],
        currentIndex: -1,
        candidate: null,
        count: 0,
        description: "Phase 1: Finding a potential candidate using the voting mechanism."
    });

    for (let i = 0; i < array.length; i++) {
        const num = array[i];
        
        if (count === 0) {
            candidate = num;
            count = 1;
            steps.push({
                phase: 1,
                array: [...array],
                currentIndex: i,
                candidate,
                count,
                description: `Count is 0. New candidate picked: ${num}.`
            });
        } else if (num === candidate) {
            count++;
            steps.push({
                phase: 1,
                array: [...array],
                currentIndex: i,
                candidate,
                count,
                description: `${num} matches candidate. Count increments to ${count}.`
            });
        } else {
            count--;
            steps.push({
                phase: 1,
                array: [...array],
                currentIndex: i,
                candidate,
                count,
                description: `${num} differs from candidate. One 'vote' canceled. Count: ${count}.`
            });
        }
    }

    // --- PHASE 2: VERIFICATION ---
    const finalCandidate = candidate;
    let actualCount = 0;
    steps.push({
        phase: 2,
        array: [...array],
        currentIndex: -1,
        candidate: finalCandidate,
        count: 0,
        description: `Phase 2: Verifying if ${finalCandidate} is truly the majority (> N/2).`
    });

    for (let i = 0; i < array.length; i++) {
        const isMatch = array[i] === finalCandidate;
        if (isMatch) actualCount++;
        
        steps.push({
            phase: 2,
            array: [...array],
            currentIndex: i,
            candidate: finalCandidate,
            count: actualCount,
            description: isMatch 
                ? `Found candidate ${finalCandidate}. Total occurrences: ${actualCount}.` 
                : `Skipping ${array[i]}. Does not match candidate.`
        });
    }

    const isMajority = actualCount > array.length / 2;
    steps.push({
        phase: 3,
        array: [...array],
        currentIndex: -1,
        candidate: finalCandidate,
        count: actualCount,
        description: isMajority 
            ? `Success! ${finalCandidate} appeared ${actualCount} times (> ${Math.floor(array.length/2)}).` 
            : `Failed. ${finalCandidate} is not a majority element.`
    });

    return steps;
};