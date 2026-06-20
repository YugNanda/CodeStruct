// ── N-Queens Backtracking Algorithm with Animation Frames ──

export function generateNQueensSteps(n) {
    const board = Array.from({ length: n }, () => Array(n).fill(0));
    const steps = [];
    const solutions = [];

    // Initial state
    steps.push({
        board: board.map((r) => [...r]),
        row: -1,
        col: -1,
        phase: "init",
        description: `Starting N-Queens solver for ${n}×${n} board. Goal: Place ${n} queens so no two attack each other.`,
        threatened: [],
        queens: [],
        solutionCount: 0,
    });

    function isSafe(board, row, col, n) {
        const threatened = [];

        // Check column
        for (let i = 0; i < row; i++) {
            if (board[i][col] === 1) {
                threatened.push({ r: i, c: col });
                return { safe: false, threatened };
            }
            threatened.push({ r: i, c: col });
        }

        // Check upper-left diagonal
        for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
            if (board[i][j] === 1) {
                threatened.push({ r: i, c: j });
                return { safe: false, threatened };
            }
            threatened.push({ r: i, c: j });
        }

        // Check upper-right diagonal
        for (let i = row - 1, j = col + 1; i >= 0 && j < n; i--, j++) {
            if (board[i][j] === 1) {
                threatened.push({ r: i, c: j });
                return { safe: false, threatened };
            }
            threatened.push({ r: i, c: j });
        }

        return { safe: true, threatened };
    }

    function getQueens(board) {
        const queens = [];
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] === 1) queens.push({ r: i, c: j });
            }
        }
        return queens;
    }

    function solve(board, row, n) {
        if (row === n) {
            // Found a solution
            solutions.push(board.map((r) => [...r]));
            steps.push({
                board: board.map((r) => [...r]),
                row: -1,
                col: -1,
                phase: "solution-found",
                description: `✅ Solution #${solutions.length} found! All ${n} queens are safely placed.`,
                threatened: [],
                queens: getQueens(board),
                solutionCount: solutions.length,
            });
            return;
        }

        for (let col = 0; col < n; col++) {
            const { safe, threatened } = isSafe(board, row, col, n);

            // Step: trying this cell
            steps.push({
                board: board.map((r) => [...r]),
                row,
                col,
                phase: "trying",
                description: `Trying to place Queen at row ${row}, column ${col}...`,
                threatened,
                queens: getQueens(board),
                solutionCount: solutions.length,
            });

            if (safe) {
                board[row][col] = 1;

                // Step: placed queen
                steps.push({
                    board: board.map((r) => [...r]),
                    row,
                    col,
                    phase: "placed",
                    description: `✓ Placed Queen at (${row}, ${col}). Moving to row ${row + 1}.`,
                    threatened: [],
                    queens: getQueens(board),
                    solutionCount: solutions.length,
                });

                solve(board, row + 1, n);

                // Backtrack
                board[row][col] = 0;

                steps.push({
                    board: board.map((r) => [...r]),
                    row,
                    col,
                    phase: "backtrack",
                    description: `↩ Backtracking: Removed Queen from (${row}, ${col}). Trying next column.`,
                    threatened: [],
                    queens: getQueens(board),
                    solutionCount: solutions.length,
                });
            } else {
                // Step: conflict
                steps.push({
                    board: board.map((r) => [...r]),
                    row,
                    col,
                    phase: "conflict",
                    description: `✗ Conflict at (${row}, ${col}) — attacked by existing queen. Skipping.`,
                    threatened,
                    queens: getQueens(board),
                    solutionCount: solutions.length,
                });
            }
        }
    }

    solve(board, 0, n);

    // Final step
    steps.push({
        board: board.map((r) => [...r]),
        row: -1,
        col: -1,
        phase: "done",
        description: `Completed! Found ${solutions.length} solution${solutions.length !== 1 ? "s" : ""} for the ${n}-Queens problem.`,
        threatened: [],
        queens: [],
        solutionCount: solutions.length,
        allSolutions: solutions,
    });

    return { steps, solutions };
}

// ── Source Code Snippets ──────────────────────────────────────────────

export const nQueensCPP = `#include <iostream>
#include <vector>
using namespace std;

bool isSafe(vector<vector<int>>& board, int row, int col, int n) {
    for (int i = 0; i < row; i++)
        if (board[i][col]) return false;
    for (int i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--)
        if (board[i][j]) return false;
    for (int i = row-1, j = col+1; i >= 0 && j < n; i--, j++)
        if (board[i][j]) return false;
    return true;
}

void solve(vector<vector<int>>& board, int row, int n, int& count) {
    if (row == n) { count++; return; }
    for (int col = 0; col < n; col++) {
        if (isSafe(board, row, col, n)) {
            board[row][col] = 1;
            solve(board, row + 1, n, count);
            board[row][col] = 0;  // Backtrack
        }
    }
}

int main() {
    int n = 8;
    vector<vector<int>> board(n, vector<int>(n, 0));
    int count = 0;
    solve(board, 0, n, count);
    cout << "Total solutions: " << count << endl;
    return 0;
}`;

export const nQueensJava = `public class NQueens {
    static int count = 0;

    static boolean isSafe(int[][] board, int row, int col, int n) {
        for (int i = 0; i < row; i++)
            if (board[i][col] == 1) return false;
        for (int i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--)
            if (board[i][j] == 1) return false;
        for (int i = row-1, j = col+1; i >= 0 && j < n; i--, j++)
            if (board[i][j] == 1) return false;
        return true;
    }

    static void solve(int[][] board, int row, int n) {
        if (row == n) { count++; return; }
        for (int col = 0; col < n; col++) {
            if (isSafe(board, row, col, n)) {
                board[row][col] = 1;
                solve(board, row + 1, n);
                board[row][col] = 0;  // Backtrack
            }
        }
    }

    public static void main(String[] args) {
        int n = 8;
        int[][] board = new int[n][n];
        solve(board, 0, n);
        System.out.println("Total solutions: " + count);
    }
}`;

export const nQueensPython = `def is_safe(board, row, col, n):
    for i in range(row):
        if board[i][col]: return False
    i, j = row - 1, col - 1
    while i >= 0 and j >= 0:
        if board[i][j]: return False
        i -= 1; j -= 1
    i, j = row - 1, col + 1
    while i >= 0 and j < n:
        if board[i][j]: return False
        i -= 1; j += 1
    return True

def solve(board, row, n, solutions):
    if row == n:
        solutions.append([r[:] for r in board])
        return
    for col in range(n):
        if is_safe(board, row, col, n):
            board[row][col] = 1
            solve(board, row + 1, n, solutions)
            board[row][col] = 0  # Backtrack

n = 8
board = [[0] * n for _ in range(n)]
solutions = []
solve(board, 0, n, solutions)
print(f"Total solutions: {len(solutions)}")`;

export const nQueensJS = `function isSafe(board, row, col, n) {
    for (let i = 0; i < row; i++)
        if (board[i][col]) return false;
    for (let i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--)
        if (board[i][j]) return false;
    for (let i = row-1, j = col+1; i >= 0 && j < n; i--, j++)
        if (board[i][j]) return false;
    return true;
}

function solve(board, row, n, solutions) {
    if (row === n) {
        solutions.push(board.map(r => [...r]));
        return;
    }
    for (let col = 0; col < n; col++) {
        if (isSafe(board, row, col, n)) {
            board[row][col] = 1;
            solve(board, row + 1, n, solutions);
            board[row][col] = 0;  // Backtrack
        }
    }
}

const n = 8;
const board = Array.from({length: n}, () => Array(n).fill(0));
const solutions = [];
solve(board, 0, n, solutions);
console.log("Total solutions:", solutions.length);`;
