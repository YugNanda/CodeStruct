// ── Rat in a Maze Backtracking Algorithm with Animation Frames ──

export function generateRatInAMazeSteps(maze) {
    const n = maze.length;
    // We will assume a rectangular/square maze, typically n x n.
    // Ensure all rows have length n
    const steps = [];
    const solutions = [];

    // Direction arrays: D, L, R, U
    const dirs = [
        { dr: 1, dc: 0, move: "D" },
        { dr: 0, dc: -1, move: "L" },
        { dr: 0, dc: 1, move: "R" },
        { dr: -1, dc: 0, move: "U" }
    ];

    // Initial state
    const visited = Array.from({ length: n }, () => Array(n).fill(0));
    const path = [];

    // Helper to deep copy the current state
    const createStepState = (r, c, phase, desc) => ({
        visited: visited.map(row => [...row]),
        path: [...path],
        row: r,
        col: c,
        phase,
        description: desc,
        maze: maze.map(row => [...row]), // Unchanged maze layout for reference
        solutionsFound: solutions.length
    });

    steps.push(createStepState(-1, -1, "init", `Starting Rat in a Maze solver for ${n}×${n} grid. Goal: Find a path from (0,0) to (${n-1},${n-1}).`));

    function isSafe(r, c) {
        return (r >= 0 && r < n && c >= 0 && c < n && maze[r][c] === 1 && visited[r][c] === 0);
    }

    function solve(r, c, currentPath) {
        // Base case: Reached the destination
        if (r === n - 1 && c === n - 1) {
            solutions.push(currentPath);
            visited[r][c] = 1;
            path.push({ r, c });
            steps.push(createStepState(r, c, "solution-found", `✅ Path found! Reached destination (${r}, ${c}).`));
            path.pop();
            visited[r][c] = 0;
            return;
        }

        // Try all 4 directions: D, L, R, U
        for (const dir of dirs) {
            const nextR = r + dir.dr;
            const nextC = c + dir.dc;

            steps.push(createStepState(nextR, nextC, "trying", `Checking cell (${nextR}, ${nextC}) moving ${dir.move}...`));

            if (isSafe(nextR, nextC)) {
                visited[nextR][nextC] = 1;
                path.push({ r: nextR, c: nextC });

                steps.push(createStepState(nextR, nextC, "placed", `✓ Cell (${nextR}, ${nextC}) is safe. Moving forward.`));

                solve(nextR, nextC, currentPath + dir.move);

                // Backtrack
                visited[nextR][nextC] = 0;
                path.pop();

                steps.push(createStepState(nextR, nextC, "backtrack", `↩ Backtracking from (${nextR}, ${nextC}). Trying next direction.`));
            } else {
                steps.push(createStepState(nextR, nextC, "conflict", `✗ Conflict at (${nextR}, ${nextC}) — cell is blocked, visited, or out of bounds. Skipping.`));
            }
        }
    }

    if (maze[0][0] === 1) {
        visited[0][0] = 1;
        path.push({ r: 0, c: 0 });
        steps.push(createStepState(0, 0, "placed", `Starting at source (0, 0).`));
        solve(0, 0, "");
    } else {
        steps.push(createStepState(0, 0, "conflict", `Source (0, 0) is blocked! Rat cannot move.`));
    }

    // Final step
    steps.push(createStepState(-1, -1, "done", `Completed! Found ${solutions.length} path${solutions.length !== 1 ? "s" : ""} to the destination.`));

    return { steps, solutions: solutions.length };
}

// ── Source Code Snippets ──────────────────────────────────────────────

export const ratInAMazeCPP = `#include <iostream>
#include <vector>
#include <string>

using namespace std;

void findPaths(vector<vector<int>>& maze, int r, int c, string path, vector<vector<int>>& visited, vector<string>& ans, int n) {
    if (r == n - 1 && c == n - 1) {
        ans.push_back(path);
        return;
    }

    // D, L, R, U
    int dr[] = {1, 0, 0, -1};
    int dc[] = {0, -1, 1, 0};
    string move = "DLRU";

    for (int i = 0; i < 4; i++) {
        int nextR = r + dr[i];
        int nextC = c + dc[i];

        if (nextR >= 0 && nextR < n && nextC >= 0 && nextC < n && maze[nextR][nextC] == 1 && !visited[nextR][nextC]) {
            visited[nextR][nextC] = 1;
            findPaths(maze, nextR, nextC, path + move[i], visited, ans, n);
            visited[nextR][nextC] = 0; // Backtrack
        }
    }
}

vector<string> findPath(vector<vector<int>>& maze, int n) {
    vector<string> ans;
    if (maze[0][0] == 0 || maze[n-1][n-1] == 0) return ans;

    vector<vector<int>> visited(n, vector<int>(n, 0));
    visited[0][0] = 1;
    findPaths(maze, 0, 0, "", visited, ans, n);
    return ans;
}

int main() {
    int n = 4;
    vector<vector<int>> maze = {
        {1, 0, 0, 0},
        {1, 1, 0, 1},
        {1, 1, 0, 0},
        {0, 1, 1, 1}
    };
    
    vector<string> results = findPath(maze, n);
    cout << "Total exact paths: " << results.size() << endl;
    for (string p : results) cout << p << " ";
    return 0;
}`;

export const ratInAMazeJava = `import java.util.ArrayList;

class RatInAMaze {
    static void findPaths(int[][] maze, int r, int c, String path, int[][] visited, ArrayList<String> ans, int n) {
        if (r == n - 1 && c == n - 1) {
            ans.add(path);
            return;
        }

        // D, L, R, U
        int[] dr = {1, 0, 0, -1};
        int[] dc = {0, -1, 1, 0};
        char[] move = {'D', 'L', 'R', 'U'};

        for (int i = 0; i < 4; i++) {
            int nextR = r + dr[i];
            int nextC = c + dc[i];

            if (nextR >= 0 && nextR < n && nextC >= 0 && nextC < n && maze[nextR][nextC] == 1 && visited[nextR][nextC] == 0) {
                visited[nextR][nextC] = 1;
                findPaths(maze, nextR, nextC, path + move[i], visited, ans, n);
                visited[nextR][nextC] = 0; // Backtrack
            }
        }
    }

    public static ArrayList<String> findPath(int[][] maze, int n) {
        ArrayList<String> ans = new ArrayList<>();
        if (maze[0][0] == 0 || maze[n-1][n-1] == 0) return ans;

        int[][] visited = new int[n][n];
        visited[0][0] = 1;
        findPaths(maze, 0, 0, "", visited, ans, n);
        return ans;
    }

    public static void main(String[] args) {
        int n = 4;
        int[][] maze = {
            {1, 0, 0, 0},
            {1, 1, 0, 1},
            {1, 1, 0, 0},
            {0, 1, 1, 1}
        };
        ArrayList<String> results = findPath(maze, n);
        System.out.println("Total paths: " + results.size());
    }
}`;

export const ratInAMazePython = `def find_paths(maze, r, c, path, visited, ans, n):
    if r == n - 1 and c == n - 1:
        ans.append(path)
        return

    # D, L, R, U
    dr = [1, 0, 0, -1]
    dc = [0, -1, 1, 0]
    moves = ['D', 'L', 'R', 'U']

    for i in range(4):
        next_r = r + dr[i]
        next_c = c + dc[i]

        if 0 <= next_r < n and 0 <= next_c < n and maze[next_r][next_c] == 1 and not visited[next_r][next_c]:
            visited[next_r][next_c] = 1
            find_paths(maze, next_r, next_c, path + moves[i], visited, ans, n)
            visited[next_r][next_c] = 0  # Backtrack

def find_path(maze, n):
    ans = []
    if maze[0][0] == 0 or maze[n-1][n-1] == 0:
        return ans
    
    visited = [[0]*n for _ in range(n)]
    visited[0][0] = 1
    find_paths(maze, 0, 0, "", visited, ans, n)
    return ans

n = 4
maze = [
    [1, 0, 0, 0],
    [1, 1, 0, 1],
    [1, 1, 0, 0],
    [0, 1, 1, 1]
]
results = find_path(maze, n)
print(f"Total paths: {len(results)}")`;

export const ratInAMazeJS = `function findPaths(maze, r, c, path, visited, ans, n) {
    if (r === n - 1 && c === n - 1) {
        ans.push(path);
        return;
    }

    // D, L, R, U
    const dr = [1, 0, 0, -1];
    const dc = [0, -1, 1, 0];
    const moves = ['D', 'L', 'R', 'U'];

    for (let i = 0; i < 4; i++) {
        const nextR = r + dr[i];
        const nextC = c + dc[i];

        if (nextR >= 0 && nextR < n && nextC >= 0 && nextC < n && maze[nextR][nextC] === 1 && visited[nextR][nextC] === 0) {
            visited[nextR][nextC] = 1;
            findPaths(maze, nextR, nextC, path + moves[i], visited, ans, n);
            visited[nextR][nextC] = 0; // Backtrack
        }
    }
}

function findPath(maze, n) {
    const ans = [];
    if (maze[0][0] === 0 || maze[n-1][n-1] === 0) return ans;

    const visited = Array.from({length: n}, () => Array(n).fill(0));
    visited[0][0] = 1;
    findPaths(maze, 0, 0, "", visited, ans, n);
    return ans;
}

const n = 4;
const maze = [
    [1, 0, 0, 0],
    [1, 1, 0, 1],
    [1, 1, 0, 0],
    [0, 1, 1, 1]
];
const results = findPath(maze, n);
console.log("Total paths:", results.length);`;
