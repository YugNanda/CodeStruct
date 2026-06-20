// ── Sudoku Solver Backtracking Algorithm with Animation Frames ──

export function generateSudokuSteps(initialBoard) {
    const board = initialBoard.map((row) => [...row]);
    const steps = [];
    let isSolved = false;

    // Initial state
    steps.push({
        board: board.map((r) => [...r]),
        row: -1,
        col: -1,
        val: null,
        phase: "init",
        description: `Starting Sudoku Solver. Goal: Fill the 9×9 grid so every row, column, and 3×3 box contains 1-9 without repetition.`,
    });

    function isValid(board, row, col, num) {
        // Check row
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num) return false;
        }

        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][col] === num) return false;
        }

        // Check 3x3 box
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[i + startRow][j + startCol] === num) return false;
            }
        }

        return true;
    }

    function solve(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    for (let num = 1; num <= 9; num++) {
                        // Step: trying a number
                        if (!isSolved) {
                            steps.push({
                                board: board.map((r) => [...r]),
                                row,
                                col,
                                val: num,
                                phase: "trying",
                                description: `Trying number ${num} at row ${row}, column ${col}...`,
                            });
                        }

                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;

                            // Step: placed number
                            if (!isSolved) {
                                steps.push({
                                    board: board.map((r) => [...r]),
                                    row,
                                    col,
                                    val: num,
                                    phase: "placed",
                                    description: `✓ Placed ${num} at (${row}, ${col}). Moving to next empty cell.`,
                                });
                            }

                            if (solve(board)) {
                                return true; // Solution found deeper down
                            }

                            // Backtrack
                            board[row][col] = 0;
                            if (!isSolved) {
                                steps.push({
                                    board: board.map((r) => [...r]),
                                    row,
                                    col,
                                    val: num,
                                    phase: "backtrack",
                                    description: `↩ Backtracking: Removed ${num} from (${row}, ${col}). Cannot solve further with this path.`,
                                });
                            }
                        } else {
                            // Step: conflict
                            if (!isSolved) {
                                steps.push({
                                    board: board.map((r) => [...r]),
                                    row,
                                    col,
                                    val: num,
                                    phase: "conflict",
                                    description: `✗ Conflict for ${num} at (${row}, ${col}) — violates Sudoku rules. Skipping.`,
                                });
                            }
                        }
                    }
                    return false; // Triggers backtracking
                }
            }
        }
        
        // If we reach here, the board is solved
        isSolved = true;
        steps.push({
            board: board.map((r) => [...r]),
            row: -1,
            col: -1,
            val: null,
            phase: "solution-found",
            description: `✅ Solution found! The Sudoku puzzle is completely solved.`,
        });
        return true;
    }

    solve(board);

    // Final step
    steps.push({
        board: board.map((r) => [...r]),
        row: -1,
        col: -1,
        val: null,
        phase: "done",
        description: isSolved ? `Completed! Sudoku puzzle solved successfully.` : `Completed! No valid solution exists for this puzzle.`,
    });

    return { steps, finalBoard: board, isSolved };
}

// ── Source Code Snippets ──────────────────────────────────────────────

export const sudokuCPP = `#include <iostream>
#include <vector>
using namespace std;

bool isValid(vector<vector<int>>& board, int row, int col, int num) {
    for (int i = 0; i < 9; i++) {
        if (board[row][i] == num) return false;
        if (board[i][col] == num) return false;
        if (board[3 * (row / 3) + i / 3][3 * (col / 3) + i % 3] == num) return false;
    }
    return true;
}

bool solveSudoku(vector<vector<int>>& board) {
    for (int row = 0; row < 9; row++) {
        for (int col = 0; col < 9; col++) {
            if (board[row][col] == 0) {
                for (int num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) return true;
                        board[row][col] = 0; // Backtrack
                    }
                }
                return false;
            }
        }
    }
    return true;
}

int main() {
    vector<vector<int>> board = {
        {5,3,0,0,7,0,0,0,0},
        {6,0,0,1,9,5,0,0,0},
        {0,9,8,0,0,0,0,6,0},
        {8,0,0,0,6,0,0,0,3},
        {4,0,0,8,0,3,0,0,1},
        {7,0,0,0,2,0,0,0,6},
        {0,6,0,0,0,0,2,8,0},
        {0,0,0,4,1,9,0,0,5},
        {0,0,0,0,8,0,0,7,9}
    };
    if (solveSudoku(board)) {
        cout << "Sudoku solved successfully!\\n";
    } else {
        cout << "No solution exists.\\n";
    }
    return 0;
}`;

export const sudokuJava = `public class SudokuSolver {

    public static boolean isValid(int[][] board, int row, int col, int num) {
        for (int i = 0; i < 9; i++) {
            if (board[row][i] == num) return false;
            if (board[i][col] == num) return false;
            if (board[3 * (row / 3) + i / 3][3 * (col / 3) + i % 3] == num) return false;
        }
        return true;
    }

    public static boolean solveSudoku(int[][] board) {
        for (int row = 0; row < 9; row++) {
            for (int col = 0; col < 9; col++) {
                if (board[row][col] == 0) {
                    for (int num = 1; num <= 9; num++) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (solveSudoku(board)) return true;
                            board[row][col] = 0; // Backtrack
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    public static void main(String[] args) {
        int[][] board = {
            {5,3,0,0,7,0,0,0,0},
            {6,0,0,1,9,5,0,0,0},
            {0,9,8,0,0,0,0,6,0},
            {8,0,0,0,6,0,0,0,3},
            {4,0,0,8,0,3,0,0,1},
            {7,0,0,0,2,0,0,0,6},
            {0,6,0,0,0,0,2,8,0},
            {0,0,0,4,1,9,0,0,5},
            {0,0,0,0,8,0,0,7,9}
        };
        if (solveSudoku(board)) {
            System.out.println("Sudoku solved successfully!");
        } else {
            System.out.println("No solution exists.");
        }
    }
}`;

export const sudokuPython = `def is_valid(board, row, col, num):
    for i in range(9):
        if board[row][i] == num:
            return False
        if board[i][col] == num:
            return False
        if board[3 * (row // 3) + i // 3][3 * (col // 3) + i % 3] == num:
            return False
    return True

def solve_sudoku(board):
    for row in range(9):
        for col in range(9):
            if board[row][col] == 0:
                for num in range(1, 10):
                    if is_valid(board, row, col, num):
                        board[row][col] = num
                        if solve_sudoku(board):
                            return True
                        board[row][col] = 0  # Backtrack
                return False
    return True

board = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
]

if solve_sudoku(board):
    print("Sudoku solved successfully!")
else:
    print("No solution exists.")`;

export const sudokuJS = `function isValid(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num) return false;
        if (board[i][col] === num) return false;
        const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
        const boxCol = 3 * Math.floor(col / 3) + (i % 3);
        if (board[boxRow][boxCol] === num) return false;
    }
    return true;
}

function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) return true;
                        board[row][col] = 0; // Backtrack
                    }
                }
                return false;
            }
        }
    }
    return true;
}

const board = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
];

if (solveSudoku(board)) {
    console.log("Sudoku solved successfully!");
} else {
    console.log("No solution exists.");
}`;
