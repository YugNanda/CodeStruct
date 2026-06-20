export const mapColoringCPP = `#include <iostream>
#include <vector>

using namespace std;

bool isSafe(int v, const vector<vector<int>>& graph, const vector<int>& color, int c) {
    for (int i = 0; i < graph.size(); i++) {
        if (graph[v][i] == 1 && color[i] == c) {
            return false;
        }
    }
    return true;
}

bool graphColoringUtil(const vector<vector<int>>& graph, int m, vector<int>& color, int v) {
    if (v == graph.size()) return true;

    for (int c = 1; c <= m; c++) {
        if (isSafe(v, graph, color, c)) {
            color[v] = c;
            if (graphColoringUtil(graph, m, color, v + 1)) return true;
            color[v] = 0; // Backtrack
        }
    }
    return false;
}

void graphColoring(const vector<vector<int>>& graph, int m) {
    vector<int> color(graph.size(), 0);
    if (!graphColoringUtil(graph, m, color, 0)) {
        cout << "Solution does not exist" << endl;
        return;
    }
    for (int c : color) cout << c << " ";
    cout << endl;
}`;

export const mapColoringJava = `import java.util.*;

public class MapColoring {
    private static boolean isSafe(int v, int[][] graph, int[] color, int c) {
        for (int i = 0; i < graph.length; i++) {
            if (graph[v][i] == 1 && color[i] == c) {
                return false;
            }
        }
        return true;
    }

    private static boolean graphColoringUtil(int[][] graph, int m, int[] color, int v) {
        if (v == graph.length) return true;

        for (int c = 1; c <= m; c++) {
            if (isSafe(v, graph, color, c)) {
                color[v] = c;
                if (graphColoringUtil(graph, m, color, v + 1)) return true;
                color[v] = 0; // Backtrack
            }
        }
        return false;
    }

    public static void graphColoring(int[][] graph, int m) {
        int[] color = new int[graph.length];
        if (!graphColoringUtil(graph, m, color, 0)) {
            System.out.println("Solution does not exist");
            return;
        }
        for (int c : color) System.out.print(c + " ");
        System.out.println();
    }
}`;

export const mapColoringPython = `def is_safe(v, graph, color, c):
    for i in range(len(graph)):
        if graph[v][i] == 1 and color[i] == c:
            return False
    return True

def graph_coloring_util(graph, m, color, v):
    if v == len(graph):
        return True

    for c in range(1, m + 1):
        if is_safe(v, graph, color, c):
            color[v] = c
            if graph_coloring_util(graph, m, color, v + 1):
                return True
            color[v] = 0 # Backtrack
            
    return False

def graph_coloring(graph, m):
    color = [0] * len(graph)
    if not graph_coloring_util(graph, m, color, 0):
        print("Solution does not exist")
        return
        
    print(" ".join(map(str, color)))`;

export const mapColoringJS = `function isSafe(v, graph, color, c) {
    for (let i = 0; i < graph.length; i++) {
        if (graph[v][i] === 1 && color[i] === c) {
            return false;
        }
    }
    return true;
}

function graphColoringUtil(graph, m, color, v) {
    if (v === graph.length) return true;

    for (let c = 1; c <= m; c++) {
        if (isSafe(v, graph, color, c)) {
            color[v] = c;
            if (graphColoringUtil(graph, m, color, v + 1)) return true;
            color[v] = 0; // Backtrack
        }
    }
    return false;
}

function graphColoring(graph, m) {
    const color = new Array(graph.length).fill(0);
    if (!graphColoringUtil(graph, m, color, 0)) {
        console.log("Solution does not exist");
        return;
    }
    console.log(color.join(" "));
}`;

// Helper to generate the visualization sequence - EXPORTED HERE
export function generateMapColoringSteps(nodes, edges, numColors) {
    const steps = [];
    const colors = Array(nodes.length).fill(0);
    const adjacencyList = Array.from({ length: nodes.length }, () => []);

    // Build Adjacency List for fast access
    for (const edge of edges) {
        adjacencyList[edge.u].push(edge.v);
        adjacencyList[edge.v].push(edge.u);
    }

    let solutions = 0;

    function isSafe(v, c) {
        for (const neighbor of adjacencyList[v]) {
            if (colors[neighbor] === c) return false;
        }
        return true;
    }

    function solveMapColoring(v) {
        if (v === nodes.length) {
            solutions++;
            steps.push({
                colors: [...colors],
                node: -1,
                color: -1,
                phase: "solution-found",
                description: "Valid map coloring configuration found!",
                solutionCount: solutions
            });
            return;
        }

        for (let c = 1; c <= numColors; c++) {
            steps.push({
                colors: [...colors],
                node: v,
                color: c,
                phase: "trying",
                description: `Trying Color ${c} for Node ${v}`,
                solutionCount: solutions
            });

            if (isSafe(v, c)) {
                colors[v] = c;
                steps.push({
                    colors: [...colors],
                    node: v,
                    color: c,
                    phase: "placed",
                    description: `Color ${c} is valid for Node ${v}`,
                    solutionCount: solutions
                });

                solveMapColoring(v + 1);

                // Backtrack
                colors[v] = 0; 
                steps.push({
                    colors: [...colors],
                    node: v,
                    color: c,
                    phase: "backtrack",
                    description: `Backtracking: Removed Color ${c} from Node ${v}`,
                    solutionCount: solutions
                });
            } else {
                steps.push({
                    colors: [...colors],
                    node: v,
                    color: c,
                    phase: "conflict",
                    description: `Conflict! A neighbor already uses Color ${c}`,
                    solutionCount: solutions
                });
            }
        }
    }

    solveMapColoring(0);
    
    // Stop at the first complete failure if absolutely no solutions, or append end step
    steps.push({
        colors: [...colors],
        node: -1,
        color: -1,
        phase: "completed",
        description: `Exploration complete. Found ${solutions} solutions.`,
        solutionCount: solutions
    });

    return { steps, solutions };
}