export const bellmanFordCPP = `#include <iostream>
#include <vector>
#include <climits>
using namespace std;

const int INF = INT_MAX;

struct Edge {
    int u, v, weight;
};

void bellmanFord(int start, int V, const vector<Edge>& edges) {
    vector<int> dist(V, INF);
    dist[start] = 0;

    // Relax all edges V - 1 times
    for (int i = 0; i < V - 1; ++i) {
        for (const auto& edge : edges) {
            if (dist[edge.u] != INF && dist[edge.u] + edge.weight < dist[edge.v]) {
                dist[edge.v] = dist[edge.u] + edge.weight;
            }
        }
    }

    // Check for negative-weight cycles
    for (const auto& edge : edges) {
        if (dist[edge.u] != INF && dist[edge.u] + edge.weight < dist[edge.v]) {
            cout << "Graph contains a negative-weight cycle";
            return;
        }
    }

    // Output distances
    for (int i = 0; i < V; ++i) {
        if (dist[i] == INF) cout << "INF ";
        else cout << dist[i] << " ";
    }
}
`;

export const bellmanFordJava = `import java.util.*;

class Edge {
    int u, v, weight;
    
    Edge(int u, int v, int weight) {
        this.u = u;
        this.v = v;
        this.weight = weight;
    }
}

public class Main {
    static final int INF = Integer.MAX_VALUE;

    public static void bellmanFord(int start, int V, List<Edge> edges) {
        int[] dist = new int[V];
        Arrays.fill(dist, INF);
        dist[start] = 0;

        // Relax all edges V - 1 times
        for (int i = 0; i < V - 1; ++i) {
            for (Edge edge : edges) {
                if (dist[edge.u] != INF && dist[edge.u] + edge.weight < dist[edge.v]) {
                    dist[edge.v] = dist[edge.u] + edge.weight;
                }
            }
        }

        // Check for negative-weight cycles
        for (Edge edge : edges) {
            if (dist[edge.u] != INF && dist[edge.u] + edge.weight < dist[edge.v]) {
                System.out.println("Graph contains a negative-weight cycle");
                return;
            }
        }

        // Output distances
        for (int i = 0; i < V; ++i) {
            if (dist[i] == INF) System.out.print("INF ");
            else System.out.print(dist[i] + " ");
        }
    }
}
`;

export const bellmanFordPython = `def bellman_ford(start, V, edges):
    INF = float('inf')
    dist = [INF] * V
    dist[start] = 0

    # Relax all edges V - 1 times
    for _ in range(V - 1):
        for u, v, weight in edges:
            if dist[u] != INF and dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight

    # Check for negative-weight cycles
    for u, v, weight in edges:
        if dist[u] != INF and dist[u] + weight < dist[v]:
            print("Graph contains a negative-weight cycle")
            return

    # Output distances
    for i in range(V):
        if dist[i] == INF:
            print("INF", end=" ")
        else:
            print(dist[i], end=" ")
`;

export const bellmanFordJS = `// Bellman-Ford Algorithm Implementation in JavaScript
function bellmanFord(start, V, edges) {
    const INF = Infinity;
    const dist = new Array(V).fill(INF);
    dist[start] = 0;

    // Relax all edges V - 1 times
    for (let i = 0; i < V - 1; i++) {
        for (const { u, v, weight } of edges) {
            if (dist[u] !== INF && dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
            }
        }
    }

    // Check for negative-weight cycles
    for (const { u, v, weight } of edges) {
        if (dist[u] !== INF && dist[u] + weight < dist[v]) {
            console.log("Graph contains a negative-weight cycle");
            return null; // or throw an error
        }
    }

    return dist;
}

// Example usage
const V = 5;
// Add edges: {u: from, v: to, weight: weight}
const edges = [
    { u: 0, v: 1, weight: -1 },
    { u: 0, v: 2, weight: 4 },
    { u: 1, v: 2, weight: 3 },
    { u: 1, v: 3, weight: 2 },
    { u: 1, v: 4, weight: 2 },
    { u: 3, v: 2, weight: 5 },
    { u: 3, v: 1, weight: 1 },
    { u: 4, v: 3, weight: -3 }
];

const distances = bellmanFord(0, V, edges);
if (distances) {
    console.log("Shortest distances from node 0:", distances);
}
`;

export const generateBellmanFordSteps = (nodes, edges, startNodeId) => {
    const steps = [];
    const distances = {};
    const previous = {};
    const V = nodes.length;
    let hasNegativeCycle = false;

    // Initialize tracking arrays
    nodes.forEach(node => {
        distances[node.id] = Infinity;
        previous[node.id] = null;
    });
    distances[startNodeId] = 0;

    // Base state
    steps.push({
        distances: { ...distances },
        highlightEdge: null,
        description: "Initialize distances to Infinity, and start node to 0.",
        iteration: 0,
        hasNegativeCycle: false
    });

    // Relax all edges V - 1 times
    for (let i = 1; i <= V - 1; i++) {
        let anyChange = false;

        steps.push({
            distances: { ...distances },
            highlightEdge: null,
            description: `Phase ${i} of ${V - 1}: Relaxing all edges.`,
            iteration: i,
            hasNegativeCycle: false
        });

        for (const edge of edges) {
            const u = edge.source;
            const v = edge.target;
            const weight = edge.weight;

            steps.push({
                distances: { ...distances },
                highlightEdge: { source: u, target: v, isChecking: true },
                description: `Checking edge ${u} \u2192 ${v} with weight ${weight}.`,
                iteration: i,
                hasNegativeCycle: false
            });

            if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
                distances[v] = distances[u] + weight;
                previous[v] = u;
                anyChange = true;

                steps.push({
                    distances: { ...distances },
                    highlightEdge: { source: u, target: v, isRelaxed: true },
                    description: `Relaxed edge ${u} \u2192 ${v}. Updated distance of ${v} to ${distances[v]}.`,
                    iteration: i,
                    hasNegativeCycle: false
                });
            }
        }

        // Optimization: if no distances were updated, we can stop early.
        if (!anyChange) {
            steps.push({
                distances: { ...distances },
                highlightEdge: null,
                description: `No changes in phase ${i}. Early termination.`,
                iteration: i,
                hasNegativeCycle: false
            });
            break;
        }
    }

    // Step V: check for negative weight cycles
    steps.push({
        distances: { ...distances },
        highlightEdge: null,
        description: "Final phase: Checking for negative-weight cycles.",
        iteration: 'Cycle Check',
        hasNegativeCycle: false
    });

    for (const edge of edges) {
        const u = edge.source;
        const v = edge.target;
        const weight = edge.weight;

        if (distances[u] !== Infinity && distances[u] + weight < distances[v]) {
            hasNegativeCycle = true;
            steps.push({
                distances: { ...distances },
                highlightEdge: { source: u, target: v, isCycleCycle: true },
                description: `Negative cycle detected! Edge ${u} \u2192 ${v} can still be relaxed.`,
                iteration: 'Cycle Detected',
                hasNegativeCycle: true
            });
            break;
        }
    }

    steps.push({
        distances: { ...distances },
        highlightEdge: null,
        description: hasNegativeCycle ? "Algorithm terminated due to negative weight cycle." : "Algorithm complete.",
        iteration: 'Done',
        hasNegativeCycle
    });

    return { steps, previous, hasNegativeCycle };
};
