export const floydWarshallCPP = `#include <iostream>
#include <vector>
using namespace std;

const int INF = 1e9;

void floydWarshall(int V, vector<vector<int>>& graph) {
    vector<vector<int>> dist = graph;

    for (int k = 0; k < V; k++) {
        for (int i = 0; i < V; i++) {
            for (int j = 0; j < V; j++) {
                if (dist[i][k] != INF && dist[k][j] != INF && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    // Print the shortest distance matrix
    for (int i = 0; i < V; ++i) {
        for (int j = 0; j < V; ++j) {
            if (dist[i][j] == INF) cout << "INF ";
            else cout << dist[i][j] << " ";
        }
        cout << endl;
    }
}
`;

export const floydWarshallJava = `import java.util.Arrays;

public class Main {
    static final int INF = (int) 1e9;

    public static void floydWarshall(int V, int[][] graph) {
        int[][] dist = new int[V][V];
        for (int i = 0; i < V; i++) {
            dist[i] = Arrays.copyOf(graph[i], V);
        }

        for (int k = 0; k < V; k++) {
            for (int i = 0; i < V; i++) {
                for (int j = 0; j < V; j++) {
                    if (dist[i][k] != INF && dist[k][j] != INF && dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }

        // Print the shortest distance matrix
        for (int i = 0; i < V; ++i) {
            for (int j = 0; j < V; ++j) {
                if (dist[i][j] == INF) System.out.print("INF ");
                else System.out.print(dist[i][j] + " ");
            }
            System.out.println();
        }
    }
}
`;

export const floydWarshallPython = `def floyd_warshall(V, graph):
    INF = float('inf')
    dist = [row[:] for row in graph]
    
    for k in range(V):
        for i in range(V):
            for j in range(V):
                if dist[i][k] != INF and dist[k][j] != INF and dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    
    # Print the shortest distance matrix
    for i in range(V):
        for j in range(V):
            if dist[i][j] == INF:
                print("INF", end=" ")
            else:
                print(dist[i][j], end=" ")
        print()
`;

export const floydWarshallJS = `// Floyd-Warshall Algorithm Implementation in JavaScript
function floydWarshall(V, graph) {
    const INF = Infinity;
    const dist = Array.from({ length: V }, (_, i) => [...graph[i]]);

    for (let k = 0; k < V; k++) {
        for (let i = 0; i < V; i++) {
            for (let j = 0; j < V; j++) {
                if (dist[i][k] !== INF && dist[k][j] !== INF && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// Example usage
const INF = Infinity;
const V = 4;
// Adjacency matrix representation of the graph
const graph = [
    [0, 5, INF, 10],
    [INF, 0, 3, INF],
    [INF, INF, 0, 1],
    [INF, INF, INF, 0]
];

const shortestDistances = floydWarshall(V, graph);
console.log("Shortest distance matrix:");
shortestDistances.forEach(row => {
    console.log(row.map(val => val === INF ? "INF" : val).join(" "));
});
`;

export const generateFloydWarshallSteps = (nodes, edges) => {
    const steps = [];
    const n = nodes.length;
    const INF = Infinity;

    // Map node.id to matrix index and vice versa
    const nodeToIndex = {};
    const indexToNode = {};
    nodes.forEach((node, idx) => {
        nodeToIndex[node.id] = idx;
        indexToNode[idx] = node.id;
    });

    // Initialize distance matrix
    const dist = Array.from({ length: n }, () => Array(n).fill(INF));
    for (let i = 0; i < n; i++) dist[i][i] = 0;

    edges.forEach(edge => {
        const u = nodeToIndex[edge.source];
        const v = nodeToIndex[edge.target];
        dist[u][v] = Math.min(dist[u][v], edge.weight);
        dist[v][u] = Math.min(dist[v][u], edge.weight); // Standard undirected graph setup
    });

    // Initial state step
    steps.push({
        distances: dist.map(row => [...row]),
        k: null,
        i: null,
        j: null,
        description: "Initialize distance matrix with edges. Diagonals are 0."
    });

    for (let k = 0; k < n; k++) {
        const idK = indexToNode[k];
        for (let i = 0; i < n; i++) {
            const idI = indexToNode[i];
            for (let j = 0; j < n; j++) {
                const idJ = indexToNode[j];

                // Checking paths step
                steps.push({
                    distances: dist.map(row => [...row]),
                    k: idK,
                    i: idI,
                    j: idJ,
                    description: `Checking path from ${nodes[i].label} to ${nodes[j].label} via ${nodes[k].label}.`
                });

                if (dist[i][k] !== INF && dist[k][j] !== INF && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];

                    // Relaxation step
                    steps.push({
                        distances: dist.map(row => [...row]),
                        k: idK,
                        i: idI,
                        j: idJ,
                        description: `Updated distance [${nodes[i].label}][${nodes[j].label}] to ${dist[i][j]}.`
                    });
                }
            }
        }
    }

    // Final state
    steps.push({
        distances: dist.map(row => [...row]),
        k: null,
        i: null,
        j: null,
        description: "Algorithm complete. All-pairs shortest paths found."
    });

    return { steps, nodeToIndex, indexToNode };
};
