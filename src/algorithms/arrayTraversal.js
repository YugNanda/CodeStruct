// ─── Code Snippets for each language ────────────────────────────────────────

export const arrayTraversalCPP = `#include <iostream>
#include <vector>
using namespace std;

// Row-wise Traversal
void rowWiseTraversal(const vector<vector<int>>& matrix) {
    int rows = matrix.size();
    int cols = matrix[0].size();

    cout << "Row-wise Traversal:" << endl;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            cout << matrix[i][j] << " ";
        }
        cout << endl;
    }
}

// Column-wise Traversal
void columnWiseTraversal(const vector<vector<int>>& matrix) {
    int rows = matrix.size();
    int cols = matrix[0].size();

    cout << "Column-wise Traversal:" << endl;
    for (int j = 0; j < cols; j++) {
        for (int i = 0; i < rows; i++) {
            cout << matrix[i][j] << " ";
        }
        cout << endl;
    }
}

// Diagonal Traversal (Primary)
void diagonalTraversal(const vector<vector<int>>& matrix) {
    int rows = matrix.size();
    int cols = matrix[0].size();

    cout << "Diagonal Traversal:" << endl;
    for (int d = 0; d < rows + cols - 1; d++) {
        int startRow = (d < cols) ? 0 : d - cols + 1;
        int startCol = (d < cols) ? d : cols - 1;
        while (startRow < rows && startCol >= 0) {
            cout << matrix[startRow][startCol] << " ";
            startRow++;
            startCol--;
        }
        cout << endl;
    }
}

// Spiral Traversal
void spiralTraversal(const vector<vector<int>>& matrix) {
    int top = 0, bottom = matrix.size() - 1;
    int left = 0, right = matrix[0].size() - 1;

    cout << "Spiral Traversal:" << endl;
    while (top <= bottom && left <= right) {
        for (int j = left; j <= right; j++) cout << matrix[top][j] << " ";
        top++;
        for (int i = top; i <= bottom; i++) cout << matrix[i][right] << " ";
        right--;
        if (top <= bottom) {
            for (int j = right; j >= left; j--) cout << matrix[bottom][j] << " ";
            bottom--;
        }
        if (left <= right) {
            for (int i = bottom; i >= top; i--) cout << matrix[i][left] << " ";
            left++;
        }
    }
    cout << endl;
}

int main() {
    vector<vector<int>> matrix = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };

    rowWiseTraversal(matrix);
    cout << endl;
    columnWiseTraversal(matrix);
    cout << endl;
    diagonalTraversal(matrix);
    cout << endl;
    spiralTraversal(matrix);
    return 0;
}
`;

export const arrayTraversalJava = `import java.util.*;

public class Main {

    // Row-wise Traversal
    public static void rowWiseTraversal(int[][] matrix) {
        int rows = matrix.length;
        int cols = matrix[0].length;

        System.out.println("Row-wise Traversal:");
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                System.out.print(matrix[i][j] + " ");
            }
            System.out.println();
        }
    }

    // Column-wise Traversal
    public static void columnWiseTraversal(int[][] matrix) {
        int rows = matrix.length;
        int cols = matrix[0].length;

        System.out.println("Column-wise Traversal:");
        for (int j = 0; j < cols; j++) {
            for (int i = 0; i < rows; i++) {
                System.out.print(matrix[i][j] + " ");
            }
            System.out.println();
        }
    }

    // Diagonal Traversal (Primary)
    public static void diagonalTraversal(int[][] matrix) {
        int rows = matrix.length;
        int cols = matrix[0].length;

        System.out.println("Diagonal Traversal:");
        for (int d = 0; d < rows + cols - 1; d++) {
            int startRow = (d < cols) ? 0 : d - cols + 1;
            int startCol = (d < cols) ? d : cols - 1;
            while (startRow < rows && startCol >= 0) {
                System.out.print(matrix[startRow][startCol] + " ");
                startRow++;
                startCol--;
            }
            System.out.println();
        }
    }

    // Spiral Traversal
    public static void spiralTraversal(int[][] matrix) {
        int top = 0, bottom = matrix.length - 1;
        int left = 0, right = matrix[0].length - 1;

        System.out.println("Spiral Traversal:");
        while (top <= bottom && left <= right) {
            for (int j = left; j <= right; j++) System.out.print(matrix[top][j] + " ");
            top++;
            for (int i = top; i <= bottom; i++) System.out.print(matrix[i][right] + " ");
            right--;
            if (top <= bottom) {
                for (int j = right; j >= left; j--) System.out.print(matrix[bottom][j] + " ");
                bottom--;
            }
            if (left <= right) {
                for (int i = bottom; i >= top; i--) System.out.print(matrix[i][left] + " ");
                left++;
            }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        int[][] matrix = {
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12}
        };

        rowWiseTraversal(matrix);
        System.out.println();
        columnWiseTraversal(matrix);
        System.out.println();
        diagonalTraversal(matrix);
        System.out.println();
        spiralTraversal(matrix);
    }
}
`;

export const arrayTraversalPython = `# Row-wise Traversal
def row_wise_traversal(matrix):
    rows = len(matrix)
    cols = len(matrix[0])

    print("Row-wise Traversal:")
    for i in range(rows):
        for j in range(cols):
            print(matrix[i][j], end=" ")
        print()

# Column-wise Traversal
def column_wise_traversal(matrix):
    rows = len(matrix)
    cols = len(matrix[0])

    print("Column-wise Traversal:")
    for j in range(cols):
        for i in range(rows):
            print(matrix[i][j], end=" ")
        print()

# Diagonal Traversal (Primary)
def diagonal_traversal(matrix):
    rows = len(matrix)
    cols = len(matrix[0])

    print("Diagonal Traversal:")
    for d in range(rows + cols - 1):
        start_row = 0 if d < cols else d - cols + 1
        start_col = d if d < cols else cols - 1
        while start_row < rows and start_col >= 0:
            print(matrix[start_row][start_col], end=" ")
            start_row += 1
            start_col -= 1
        print()

# Spiral Traversal
def spiral_traversal(matrix):
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    result = []

    print("Spiral Traversal:")
    while top <= bottom and left <= right:
        for j in range(left, right + 1):
            result.append(matrix[top][j])
        top += 1
        for i in range(top, bottom + 1):
            result.append(matrix[i][right])
        right -= 1
        if top <= bottom:
            for j in range(right, left - 1, -1):
                result.append(matrix[bottom][j])
            bottom -= 1
        if left <= right:
            for i in range(bottom, top - 1, -1):
                result.append(matrix[i][left])
            left += 1
    print(" ".join(map(str, result)))

# Example
matrix = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12]
]

row_wise_traversal(matrix)
print()
column_wise_traversal(matrix)
print()
diagonal_traversal(matrix)
print()
spiral_traversal(matrix)
`;

export const arrayTraversalJS = `// 2D Array Traversal Implementations in JavaScript

// Row-wise Traversal
function rowWiseTraversal(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            result.push({ row: i, col: j, value: matrix[i][j] });
        }
    }
    return result;
}

// Column-wise Traversal
function columnWiseTraversal(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];

    for (let j = 0; j < cols; j++) {
        for (let i = 0; i < rows; i++) {
            result.push({ row: i, col: j, value: matrix[i][j] });
        }
    }
    return result;
}

// Diagonal Traversal (Primary diagonals)
function diagonalTraversal(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];

    for (let d = 0; d < rows + cols - 1; d++) {
        let startRow = d < cols ? 0 : d - cols + 1;
        let startCol = d < cols ? d : cols - 1;
        while (startRow < rows && startCol >= 0) {
            result.push({ row: startRow, col: startCol, value: matrix[startRow][startCol] });
            startRow++;
            startCol--;
        }
    }
    return result;
}

// Spiral Traversal
function spiralTraversal(matrix) {
    const result = [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++)
            result.push({ row: top, col: j, value: matrix[top][j] });
        top++;
        for (let i = top; i <= bottom; i++)
            result.push({ row: i, col: right, value: matrix[i][right] });
        right--;
        if (top <= bottom) {
            for (let j = right; j >= left; j--)
                result.push({ row: bottom, col: j, value: matrix[bottom][j] });
            bottom--;
        }
        if (left <= right) {
            for (let i = bottom; i >= top; i--)
                result.push({ row: i, col: left, value: matrix[i][left] });
            left++;
        }
    }
    return result;
}

// Reverse Row-wise Traversal
function reverseRowWiseTraversal(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];

    for (let i = rows - 1; i >= 0; i--) {
        for (let j = cols - 1; j >= 0; j--) {
            result.push({ row: i, col: j, value: matrix[i][j] });
        }
    }
    return result;
}

// Zigzag Row Traversal
function zigzagTraversal(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];

    for (let i = 0; i < rows; i++) {
        if (i % 2 === 0) {
            for (let j = 0; j < cols; j++)
                result.push({ row: i, col: j, value: matrix[i][j] });
        } else {
            for (let j = cols - 1; j >= 0; j--)
                result.push({ row: i, col: j, value: matrix[i][j] });
        }
    }
    return result;
}

// Example usage
const matrix = [
    [1,  2,  3,  4],
    [5,  6,  7,  8],
    [9, 10, 11, 12]
];

console.log("Row-wise:", rowWiseTraversal(matrix));
console.log("Column-wise:", columnWiseTraversal(matrix));
console.log("Diagonal:", diagonalTraversal(matrix));
console.log("Spiral:", spiralTraversal(matrix));
console.log("Reverse Row-wise:", reverseRowWiseTraversal(matrix));
console.log("Zigzag:", zigzagTraversal(matrix));
`;

// ─── Step generators for visualization ──────────────────────────────────────

export const TRAVERSAL_MODES = [
  { id: "row", label: "Row-wise", icon: "→" },
  { id: "col", label: "Column-wise", icon: "↓" },
  { id: "diagonal", label: "Diagonal", icon: "↘" },
  { id: "spiral", label: "Spiral", icon: "🌀" },
  { id: "reverseRow", label: "Reverse Row", icon: "←" },
  { id: "zigzag", label: "Zigzag", icon: "↔" },
];

export const generateTraversalSteps = (matrix, mode) => {
  const steps = [];
  const rows = matrix.length;
  const cols = matrix[0].length;
  const visited = [];

  const pushStep = (r, c, desc, currentVisited, phase = null) => {
    steps.push({
      row: r,
      col: c,
      value: matrix[r][c],
      visited: [...currentVisited],
      description: desc,
      phase,
    });
  };

  // Initial step
  steps.push({
    row: null,
    col: null,
    value: null,
    visited: [],
    description: `Starting ${TRAVERSAL_MODES.find((m) => m.id === mode)?.label || mode} traversal on a ${rows}×${cols} matrix.`,
    phase: null,
  });

  switch (mode) {
    case "row": {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          visited.push({ row: i, col: j });
          pushStep(
            i,
            j,
            `Visiting [${i}][${j}] = ${matrix[i][j]}  (Row ${i}, Col ${j})`,
            visited,
            `Row ${i}`
          );
        }
      }
      break;
    }

    case "col": {
      for (let j = 0; j < cols; j++) {
        for (let i = 0; i < rows; i++) {
          visited.push({ row: i, col: j });
          pushStep(
            i,
            j,
            `Visiting [${i}][${j}] = ${matrix[i][j]}  (Col ${j}, Row ${i})`,
            visited,
            `Column ${j}`
          );
        }
      }
      break;
    }

    case "diagonal": {
      let diagIdx = 0;
      for (let d = 0; d < rows + cols - 1; d++) {
        let startRow = d < cols ? 0 : d - cols + 1;
        let startCol = d < cols ? d : cols - 1;
        while (startRow < rows && startCol >= 0) {
          visited.push({ row: startRow, col: startCol });
          pushStep(
            startRow,
            startCol,
            `Visiting [${startRow}][${startCol}] = ${matrix[startRow][startCol]}  (Diagonal ${diagIdx})`,
            visited,
            `Diagonal ${diagIdx}`
          );
          startRow++;
          startCol--;
        }
        diagIdx++;
      }
      break;
    }

    case "spiral": {
      let top = 0,
        bottom = rows - 1,
        left = 0,
        right = cols - 1;
      let round = 0;
      while (top <= bottom && left <= right) {
        for (let j = left; j <= right; j++) {
          visited.push({ row: top, col: j });
          pushStep(
            top,
            j,
            `Visiting [${top}][${j}] = ${matrix[top][j]}  → Moving Right`,
            visited,
            `Layer ${round} → Right`
          );
        }
        top++;
        for (let i = top; i <= bottom; i++) {
          visited.push({ row: i, col: right });
          pushStep(
            i,
            right,
            `Visiting [${i}][${right}] = ${matrix[i][right]}  ↓ Moving Down`,
            visited,
            `Layer ${round} ↓ Down`
          );
        }
        right--;
        if (top <= bottom) {
          for (let j = right; j >= left; j--) {
            visited.push({ row: bottom, col: j });
            pushStep(
              bottom,
              j,
              `Visiting [${bottom}][${j}] = ${matrix[bottom][j]}  ← Moving Left`,
              visited,
              `Layer ${round} ← Left`
            );
          }
          bottom--;
        }
        if (left <= right) {
          for (let i = bottom; i >= top; i--) {
            visited.push({ row: i, col: left });
            pushStep(
              i,
              left,
              `Visiting [${i}][${left}] = ${matrix[i][left]}  ↑ Moving Up`,
              visited,
              `Layer ${round} ↑ Up`
            );
          }
          left++;
        }
        round++;
      }
      break;
    }

    case "reverseRow": {
      for (let i = rows - 1; i >= 0; i--) {
        for (let j = cols - 1; j >= 0; j--) {
          visited.push({ row: i, col: j });
          pushStep(
            i,
            j,
            `Visiting [${i}][${j}] = ${matrix[i][j]}  (Reverse Row ${i}, Col ${j})`,
            visited,
            `Row ${i} (Reverse)`
          );
        }
      }
      break;
    }

    case "zigzag": {
      for (let i = 0; i < rows; i++) {
        if (i % 2 === 0) {
          for (let j = 0; j < cols; j++) {
            visited.push({ row: i, col: j });
            pushStep(
              i,
              j,
              `Visiting [${i}][${j}] = ${matrix[i][j]}  → Left to Right`,
              visited,
              `Row ${i} →`
            );
          }
        } else {
          for (let j = cols - 1; j >= 0; j--) {
            visited.push({ row: i, col: j });
            pushStep(
              i,
              j,
              `Visiting [${i}][${j}] = ${matrix[i][j]}  ← Right to Left`,
              visited,
              `Row ${i} ←`
            );
          }
        }
      }
      break;
    }

    default:
      break;
  }

  // Final step
  steps.push({
    row: null,
    col: null,
    value: null,
    visited: [...visited],
    description: "Traversal complete! All elements visited.",
    phase: "Done",
  });

  return steps;
};

// ─── Helper to generate random 2D matrices ─────────────────────────────────

export const generateRandomMatrix = (rows, cols, min = 1, max = 99) => {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () =>
      Math.floor(Math.random() * (max - min + 1)) + min
    )
  );
};

// ─── Preset matrices for quick loading ──────────────────────────────────────

export const PRESET_MATRICES = [
  {
    label: "3×3 Sequential",
    matrix: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ],
  },
  {
    label: "3×4 Classic",
    matrix: [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
    ],
  },
  {
    label: "4×4 Powers of 2",
    matrix: [
      [1, 2, 4, 8],
      [16, 32, 64, 128],
      [256, 512, 1, 2],
      [4, 8, 16, 32],
    ],
  },
  {
    label: "4×4 Identity",
    matrix: [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ],
  },
  {
    label: "5×5 Spiral-friendly",
    matrix: [
      [1, 2, 3, 4, 5],
      [16, 17, 18, 19, 6],
      [15, 24, 25, 20, 7],
      [14, 23, 22, 21, 8],
      [13, 12, 11, 10, 9],
    ],
  },
  {
    label: "3×3 All Zeros",
    matrix: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
  },
  {
    label: "2×2 Minimal",
    matrix: [
      [1, 2],
      [3, 4],
    ],
  },
  {
    label: "6×6 Large",
    matrix: [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
      [13, 14, 15, 16, 17, 18],
      [19, 20, 21, 22, 23, 24],
      [25, 26, 27, 28, 29, 30],
      [31, 32, 33, 34, 35, 36],
    ],
  },
];