export const knapsack = async (capacity, items) => {
    const n = items.length;
    const states = []; // Array to store all animation frames

    // Initialize DP table with 0s. 
    // Dimensions: (n + 1) rows, (capacity + 1) columns.
    const dp = Array(n + 1)
        .fill(0)
        .map(() => Array(capacity + 1).fill(0));

    // Frame initialization state
    states.push({
        dp: JSON.parse(JSON.stringify(dp)), // Deep copy grid to save current state
        currentItem: null,
        currentWeight: null,
        comparingCells: [],
        updatedCell: null,
        selectedItems: [],
        message: "Initializing DP table with 0s.",
        phase: "init",
    });

    // Build table dp[][] in bottom-up manner
    for (let i = 1; i <= n; i++) {
        const itemIndex = i - 1;
        const currentItemWeight = items[itemIndex].weight;
        const currentItemValue = items[itemIndex].value;

        for (let w = 1; w <= capacity; w++) {
            // Base frame before decision
            states.push({
                dp: JSON.parse(JSON.stringify(dp)),
                currentItem: itemIndex,
                currentWeight: w,
                comparingCells: [],
                updatedCell: null,
                selectedItems: [],
                message: `Evaluating item ${i} (Weight: ${currentItemWeight}, Value: ${currentItemValue}) at capacity ${w}.`,
                phase: "evaluate",
            });

            if (currentItemWeight <= w) {
                // Item can be included. Compare value of Including vs. Excluding
                const excludeValue = dp[i - 1][w];
                const includeValue = currentItemValue + dp[i - 1][w - currentItemWeight];

                states.push({
                    dp: JSON.parse(JSON.stringify(dp)),
                    currentItem: itemIndex,
                    currentWeight: w,
                    comparingCells: [
                        { r: i - 1, c: w, label: "Exclude" }, // Cell above (excluding current item)
                        { r: i - 1, c: w - currentItemWeight, label: "Include (base)" }, // Remaining capacity cell
                    ],
                    updatedCell: null,
                    selectedItems: [],
                    message: `Weight ${currentItemWeight} <= Capacity ${w}. Max of Exclude (${excludeValue}) or Include (${currentItemValue} + ${dp[i - 1][w - currentItemWeight]}).`,
                    phase: "compare",
                });

                dp[i][w] = Math.max(excludeValue, includeValue);
            } else {
                // Item cannot be included. Inherit value from the row above.
                states.push({
                    dp: JSON.parse(JSON.stringify(dp)),
                    currentItem: itemIndex,
                    currentWeight: w,
                    comparingCells: [{ r: i - 1, c: w, label: "Exclude" }],
                    updatedCell: null,
                    selectedItems: [],
                    message: `Weight ${currentItemWeight} > Capacity ${w}. Item cannot be included. Inheriting value from row above.`,
                    phase: "compare",
                });

                dp[i][w] = dp[i - 1][w];
            }

            // Frame displaying the decided value for the current cell
            states.push({
                dp: JSON.parse(JSON.stringify(dp)),
                currentItem: itemIndex,
                currentWeight: w,
                comparingCells: [],
                updatedCell: { r: i, c: w },
                selectedItems: [],
                message: `Settled dp[${i}][${w}] = ${dp[i][w]}`,
                phase: "update",
            });
        }
    }

    states.push({
        dp: JSON.parse(JSON.stringify(dp)),
        currentItem: null,
        currentWeight: null,
        comparingCells: [],
        updatedCell: null,
        selectedItems: [],
        message: `Table filled! Maximum value is ${dp[n][capacity]}. Starting Backtracking to find selected items.`,
        phase: "backtrack-start",
    });

    // Backtracking to find which items were included
    let res = dp[n][capacity];
    let w = capacity;
    const selectedItemsIndices = [];

    for (let i = n; i > 0 && res > 0; i--) {
        const itemIndex = i - 1;

        // Highlight cell being inspected in backtracking
        states.push({
            dp: JSON.parse(JSON.stringify(dp)),
            currentItem: itemIndex,
            currentWeight: w,
            comparingCells: [
                { r: i, c: w, label: "Current" },
                { r: i - 1, c: w, label: "Above" }
            ],
            updatedCell: null,
            selectedItems: [...selectedItemsIndices],
            message: `Checking if Item ${i} was included. Compare dp[${i}][${w}] with dp[${i - 1}][${w}].`,
            phase: "backtrack-compare",
        });

        if (res === dp[i - 1][w]) {
            // Item was not included
            states.push({
                dp: JSON.parse(JSON.stringify(dp)),
                currentItem: itemIndex,
                currentWeight: w,
                comparingCells: [],
                updatedCell: null,
                selectedItems: [...selectedItemsIndices],
                message: `dp[${i}][${w}] == dp[${i - 1}][${w}]. Item ${i} was EXCLUDED.`,
                phase: "backtrack-exclude",
            });
        } else {
            // Item was included
            selectedItemsIndices.push(itemIndex);
            states.push({
                dp: JSON.parse(JSON.stringify(dp)),
                currentItem: itemIndex,
                currentWeight: w,
                comparingCells: [],
                updatedCell: null,
                selectedItems: [...selectedItemsIndices],
                message: `dp[${i}][${w}] != dp[${i - 1}][${w}]. Item ${i} was INCLUDED. Remaining capacity decreases by ${items[itemIndex].weight}.`,
                phase: "backtrack-include",
            });

            // Deduct item weight from total weight and value
            res -= items[itemIndex].value;
            w -= items[itemIndex].weight;
        }
    }

    // Final State
    states.push({
        dp: JSON.parse(JSON.stringify(dp)),
        currentItem: null,
        currentWeight: null,
        comparingCells: [],
        updatedCell: null,
        selectedItems: selectedItemsIndices,
        message: "Visualization Complete! Items highlighted in green are included in the optimal solution.",
        phase: "done",
        maxValue: dp[n][capacity],
    });

    return states;
};

// ── Source Code Snippets ──────────────────────────────────────────────

export const knapsackCPP = `#include <iostream>
#include <vector>
using namespace std;

int knapsack(int W, vector<int>& wt, vector<int>& val, int n) {
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));

    for (int i = 1; i <= n; i++) {
        for (int w = 1; w <= W; w++) {
            if (wt[i - 1] <= w)
                dp[i][w] = max(val[i - 1] + dp[i - 1][w - wt[i - 1]],
                               dp[i - 1][w]);
            else
                dp[i][w] = dp[i - 1][w];
        }
    }

    // Backtrack to find selected items
    int res = dp[n][W], w = W;
    for (int i = n; i > 0 && res > 0; i--) {
        if (res != dp[i - 1][w]) {
            cout << "Item " << i << " included" << endl;
            res -= val[i - 1];
            w -= wt[i - 1];
        }
    }
    return dp[n][W];
}

int main() {
    vector<int> val = {1, 6, 10, 16};
    vector<int> wt  = {1, 2, 3, 5};
    int W = 7, n = val.size();
    cout << "Max Value: " << knapsack(W, wt, val, n);
    return 0;
}`;

export const knapsackJava = `public class Knapsack {
    static int knapsack(int W, int[] wt, int[] val, int n) {
        int[][] dp = new int[n + 1][W + 1];

        for (int i = 1; i <= n; i++) {
            for (int w = 1; w <= W; w++) {
                if (wt[i - 1] <= w)
                    dp[i][w] = Math.max(
                        val[i - 1] + dp[i - 1][w - wt[i - 1]],
                        dp[i - 1][w]);
                else
                    dp[i][w] = dp[i - 1][w];
            }
        }

        // Backtrack to find selected items
        int res = dp[n][W], w = W;
        for (int i = n; i > 0 && res > 0; i--) {
            if (res != dp[i - 1][w]) {
                System.out.println("Item " + i + " included");
                res -= val[i - 1];
                w -= wt[i - 1];
            }
        }
        return dp[n][W];
    }

    public static void main(String[] args) {
        int[] val = {1, 6, 10, 16};
        int[] wt  = {1, 2, 3, 5};
        int W = 7, n = val.length;
        System.out.println("Max Value: " + knapsack(W, wt, val, n));
    }
}`;

export const knapsackPython = `def knapsack(W, wt, val, n):
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(1, W + 1):
            if wt[i - 1] <= w:
                dp[i][w] = max(
                    val[i - 1] + dp[i - 1][w - wt[i - 1]],
                    dp[i - 1][w])
            else:
                dp[i][w] = dp[i - 1][w]

    # Backtrack to find selected items
    res, w = dp[n][W], W
    for i in range(n, 0, -1):
        if res != dp[i - 1][w]:
            print(f"Item {i} included")
            res -= val[i - 1]
            w -= wt[i - 1]

    return dp[n][W]

val = [1, 6, 10, 16]
wt  = [1, 2, 3, 5]
W, n = 7, len(val)
print("Max Value:", knapsack(W, wt, val, n))`;

export const knapsackJS = `function knapsack(W, wt, val, n) {
    const dp = Array.from({ length: n + 1 },
        () => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let w = 1; w <= W; w++) {
            if (wt[i - 1] <= w)
                dp[i][w] = Math.max(
                    val[i - 1] + dp[i - 1][w - wt[i - 1]],
                    dp[i - 1][w]);
            else
                dp[i][w] = dp[i - 1][w];
        }
    }

    // Backtrack to find selected items
    let res = dp[n][W], w = W;
    for (let i = n; i > 0 && res > 0; i--) {
        if (res !== dp[i - 1][w]) {
            console.log("Item " + i + " included");
            res -= val[i - 1];
            w -= wt[i - 1];
        }
    }
    return dp[n][W];
}

const val = [1, 6, 10, 16];
const wt  = [1, 2, 3, 5];
const W = 7, n = val.length;
console.log("Max Value:", knapsack(W, wt, val, n));`;
