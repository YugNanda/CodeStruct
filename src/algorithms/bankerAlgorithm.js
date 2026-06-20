// ─── Banker's Algorithm Implementation ─────────────────────────────────────

/**
 * Banker's Algorithm - Deadlock Avoidance
 * Safely allocates resources to processes while avoiding deadlock
 */

export const generateBankersAlgorithmSteps = (processes, resources, maxNeed, allocated) => {
  const steps = [];
  const n = processes.length;
  const m = resources.length;

  // Initialize state
  let available = [...resources];
  let need = allocated.map((alloc, i) =>
    maxNeed[i].map((max, j) => Math.max(0, max - alloc[j]))
  );
  let finish = new Array(n).fill(false);
  let safeSequence = [];

  const snapshot = (description, action, details = {}) => {
    steps.push({
      available: [...available],
      allocated: allocated.map(row => [...row]),
      need: need.map(row => [...row]),
      finish: [...finish],
      safeSequence: [...safeSequence],
      currentProcess: details.process !== undefined ? details.process : -1,
      highlightProcess: details.highlightProcess !== undefined ? details.highlightProcess : -1,
      description,
      action,
      details
    });
  };

  snapshot(
    "Initialization",
    "Starting Banker's Algorithm. Calculating Need Matrix = Max - Allocated.",
    {
      process: -1
    }
  );

  // Main safety algorithm
  let processesCompleted = 0;
  let iterations = 0;
  const maxIterations = n * n + 1; // Prevention against infinite loops

  while (processesCompleted < n && iterations < maxIterations) {
    let found = false;
    iterations++;

    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;

      // detailed comparison logic for visualization
      let canAllocate = true;
      let failureResource = -1;
      
      // Check if process i can be satisfied
      for (let j = 0; j < m; j++) {
        if (need[i][j] > available[j]) {
          canAllocate = false;
          failureResource = j;
          break;
        }
      }

      if (canAllocate) {
        // Process i can proceed
        snapshot(
          `Checking Process P${i}`,
          `Need [${need[i].join(', ')}] ≤ Available [${available.join(', ')}]`,
          { 
            process: i, 
            highlightProcess: i,
            comparison: {
              success: true,
              need: [...need[i]],
              available: [...available]
            }
          }
        );

        // Allocate resources (simulate execution)
        for (let j = 0; j < m; j++) {
          available[j] += allocated[i][j];
          // formally we don't zero out allocated in the algo description usually, 
          // but logically the resources return to pool. 
          // For visualization, we can keep them in 'allocated' or zero them. 
          // Standard algo just adds allocated to available.
        }

        finish[i] = true;
        safeSequence.push(i);
        processesCompleted++;
        found = true;

        snapshot(
          `Process P${i} Executed`,
          `P${i} finished. Resources returned: [${allocated[i].join(', ')}]`,
          { 
            process: i, 
            highlightProcess: i,
            explanation: `New Available = Old Available + Allocated[P${i}]`
          }
        );

        // Restart scan from P0 to ensure we find the lexicographically first safe sequence usually
        // or just break to restart the loop logic
        break; 
      } else {
        // Only snapshot failed checks if we want detailed debugging, 
        // otherwise it gets too noisy. We'll snapshot it if it's the *only* option or occasionally.
        // For this visualizer, let's snapshot it to show why it was skipped.
         snapshot(
          `Skipping Process P${i}`,
          `Need R${failureResource} (${need[i][failureResource]}) > Available (${available[failureResource]})`,
          { 
            process: i, 
            highlightProcess: i,
            comparison: {
              success: false,
              failIndex: failureResource,
              need: [...need[i]],
              available: [...available]
            }
          }
        );
      }
    }

    if (!found && processesCompleted < n) {
      // Deadlock detected
      snapshot(
        "DEADLOCK DETECTED",
        "No further processes can be satisfied with current available resources.",
        { process: -1 }
      );
      return steps;
    }
  }

  if (processesCompleted === n) {
    snapshot(
      "SAFE STATE FOUND",
      `System is Safe. Sequence: ${safeSequence.map(p => `P${p}`).join(' → ')}`,
      { process: -1, safeSequence: [...safeSequence] }
    );
  } else {
    // Should be caught by the !found check, but safety fallback
    snapshot("UNSAFE STATE", "Could not complete all processes.", { process: -1 });
  }

  return steps;
};

/**
 * Check if resource request can be granted
 */
export const checkResourceRequest = (pid, request, available, need, allocated, maxNeed) => {
  const m = request.length;
  
  // Step 1: Check if request <= need
  for (let j = 0; j < m; j++) {
    if (request[j] > need[pid][j]) {
      return { granted: false, reason: `Request for R${j} (${request[j]}) exceeds declare max need (${need[pid][j]})` };
    }
  }

  // Step 2: Check if request <= available
  for (let j = 0; j < m; j++) {
    if (request[j] > available[j]) {
      return { granted: false, reason: `Insufficient available resources for R${j}. Have ${available[j]}, requested ${request[j]}` };
    }
  }

  // Step 3: Simulate allocation and check for safe state
  const tempAvailable = [...available];
  // Deep copy for simulation
  const tempAllocated = allocated.map(row => [...row]);
  const tempNeed = need.map(row => [...row]);

  for (let j = 0; j < m; j++) {
    tempAvailable[j] -= request[j];
    tempAllocated[pid][j] += request[j];
    tempNeed[pid][j] -= request[j];
  }

  // Run safety check
  if (isSafeState(tempAvailable, tempAllocated, tempNeed, allocated.length, m)) {
    return { granted: true, reason: "Request granted. System remains in Safe State." };
  } else {
    return { granted: false, reason: "Request denied. Allocation would lead to Unsafe State." };
  }
};

const isSafeState = (available, allocated, need, n, m) => {
  // Deep copy available because we modify it in the loop
  let work = [...available];
  let finish = new Array(n).fill(false);
  let safeSequence = [];

  let count = 0;
  while (count < n) {
    let found = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      
      let canAllocate = true;
      for (let j = 0; j < m; j++) {
        if (need[i][j] > work[j]) {
          canAllocate = false;
          break;
        }
      }

      if (canAllocate) {
        for (let j = 0; j < m; j++) {
          work[j] += allocated[i][j];
        }
        finish[i] = true;
        safeSequence.push(i);
        found = true;
        count++;
      }
    }
    if (!found) break; 
  }

  return count === n;
};

// ─── Code Snippets ────────────────────────────────────────────────────────

export const bankerCPP = `#include <iostream>
#include <vector>
using namespace std;

// Banker's Algorithm Implementation
class BankersAlgorithm {
    int n, m;
    vector<int> available;
    vector<vector<int>> max, allocation, need;

public:
    BankersAlgorithm(int procs, int rsrcs, vector<int> avail, 
                     vector<vector<int>> maxNeed, vector<vector<int>> alloc) {
        n = procs;
        m = rsrcs;
        available = avail;
        max = maxNeed;
        allocation = alloc;
        
        need.resize(n, vector<int>(m));
        calculateNeed();
    }

    void calculateNeed() {
        for (int i = 0; i < n; i++)
            for (int j = 0; j < m; j++)
                need[i][j] = max[i][j] - allocation[i][j];
    }

    bool isSafe() {
        vector<int> work = available;
        vector<bool> finish(n, false);
        vector<int> safeSeq;

        int count = 0;
        while (count < n) {
            bool found = false;
            for (int i = 0; i < n; i++) {
                if (!finish[i]) {
                    bool canAllocate = true;
                    for (int j = 0; j < m; j++) {
                        if (need[i][j] > work[j]) {
                            canAllocate = false;
                            break;
                        }
                    }

                    if (canAllocate) {
                        for (int j = 0; j < m; j++)
                            work[j] += allocation[i][j];
                        
                        safeSeq.push_back(i);
                        finish[i] = true;
                        found = true;
                        count++;
                    }
                }
            }
            if (!found) return false;
        }

        cout << "Safe Sequence: ";
        for (int i : safeSeq) cout << "P" << i << " ";
        cout << endl;
        return true;
    }
};

int main() {
    // Example Configuration
    vector<int> avail = {3, 3, 2};
    vector<vector<int>> max = {{7, 5, 3}, {3, 2, 2}, {9, 0, 2}, {2, 2, 2}, {4, 3, 3}};
    vector<vector<int>> alloc = {{0, 1, 0}, {2, 0, 0}, {3, 0, 2}, {2, 1, 1}, {0, 0, 2}};

    BankersAlgorithm banker(5, 3, avail, max, alloc);
    
    if (banker.isSafe())
        cout << "System is in SAFE state." << endl;
    else
        cout << "System is in UNSAFE state." << endl;

    return 0;
}`;

export const bankerJava = `import java.util.*;

public class BankersAlgorithm {
    private int n, m;
    private int[] available;
    private int[][] max, allocation, need;

    public BankersAlgorithm(int n, int m, int[] avail, int[][] maxNeed, int[][] alloc) {
        this.n = n;
        this.m = m;
        this.available = avail;
        this.max = maxNeed;
        this.allocation = alloc;
        this.need = new int[n][m];
        calculateNeed();
    }

    private void calculateNeed() {
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                need[i][j] = max[i][j] - allocation[i][j];
            }
        }
    }

    public boolean isSafe() {
        int[] work = Arrays.copyOf(available, m);
        boolean[] finish = new boolean[n];
        List<Integer> safeSeq = new ArrayList<>();
        int count = 0;

        while (count < n) {
            boolean found = false;
            for (int i = 0; i < n; i++) {
                if (!finish[i]) {
                    boolean canAllocate = true;
                    for (int j = 0; j < m; j++) {
                        if (need[i][j] > work[j]) {
                            canAllocate = false;
                            break;
                        }
                    }

                    if (canAllocate) {
                        for (int j = 0; j < m; j++)
                            work[j] += allocation[i][j];
                        
                        finish[i] = true;
                        safeSeq.add(i);
                        found = true;
                        count++;
                    }
                }
            }
            if (!found) return false;
        }

        System.out.println("Safe Sequence: " + safeSeq);
        return true;
    }

    public static void main(String[] args) {
        int[] avail = {3, 3, 2};
        int[][] max = {{7, 5, 3}, {3, 2, 2}, {9, 0, 2}, {2, 2, 2}, {4, 3, 3}};
        int[][] alloc = {{0, 1, 0}, {2, 0, 0}, {3, 0, 2}, {2, 1, 1}, {0, 0, 2}};

        BankersAlgorithm banker = new BankersAlgorithm(5, 3, avail, max, alloc);
        System.out.println("Is system safe? " + banker.isSafe());
    }
}`;

export const bankerPython = `class BankersAlgorithm:
    def __init__(self, n, m, available, max_need, allocation):
        self.n = n  # Processes
        self.m = m  # Resources
        self.available = available
        self.max = max_need
        self.allocation = allocation
        self.need = [[0]*m for _ in range(n)]
        self.calculate_need()

    def calculate_need(self):
        for i in range(self.n):
            for j in range(self.m):
                self.need[i][j] = self.max[i][j] - self.allocation[i][j]

    def is_safe(self):
        work = self.available[:]
        finish = [False] * self.n
        safe_seq = []
        count = 0

        while count < self.n:
            found = False
            for i in range(self.n):
                if not finish[i]:
                    can_allocate = True
                    for j in range(self.m):
                        if self.need[i][j] > work[j]:
                            can_allocate = False
                            break
                    
                    if can_allocate:
                        for j in range(self.m):
                            work[j] += self.allocation[i][j]
                        
                        finish[i] = True
                        safe_seq.append(i)
                        found = True
                        count += 1
            
            if not found:
                return False

        print(f"Safe Sequence: {safe_seq}")
        return True

# Driver Code
if __name__ == "__main__":
    avail = [3, 3, 2]
    max_need = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
    alloc = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]]

    banker = BankersAlgorithm(5, 3, avail, max_need, alloc)
    print(f"Is system safe? {banker.is_safe()}")`;

export const bankerJS = `class BankersAlgorithm {
    constructor(n, m, available, maxNeed, allocation) {
        this.n = n;
        this.m = m;
        this.available = available;
        this.max = maxNeed;
        this.allocation = allocation;
        this.need = Array(n).fill().map(() => Array(m).fill(0));
        this.calculateNeed();
    }

    calculateNeed() {
        for (let i = 0; i < this.n; i++) {
            for (let j = 0; j < this.m; j++) {
                this.need[i][j] = this.max[i][j] - this.allocation[i][j];
            }
        }
    }

    isSafe() {
        let work = [...this.available];
        let finish = new Array(this.n).fill(false);
        let safeSeq = [];
        let count = 0;

        while (count < this.n) {
            let found = false;
            for (let i = 0; i < this.n; i++) {
                if (!finish[i]) {
                    let canAllocate = true;
                    for (let j = 0; j < this.m; j++) {
                        if (this.need[i][j] > work[j]) {
                            canAllocate = false;
                            break;
                        }
                    }

                    if (canAllocate) {
                        for (let j = 0; j < this.m; j++) {
                            work[j] += this.allocation[i][j];
                        }
                        finish[i] = true;
                        safeSeq.push(i);
                        found = true;
                        count++;
                    }
                }
            }
            if (!found) return false;
        }

        console.log("Safe Sequence:", safeSeq);
        return true;
    }
}

// Driver Code
const avail = [3, 3, 2];
const maxNeed = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]];
const alloc = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]];

const banker = new BankersAlgorithm(5, 3, avail, maxNeed, alloc);
console.log("Is system safe?", banker.isSafe());`;