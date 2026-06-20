export const kruskalCPP = `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

// Disjoint Set Data Structure
class DisjointSet {
    vector<int> parent, rank;
public:
    DisjointSet(int n) {
        parent.resize(n);
        rank.resize(n, 0);
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find(int i) {
        if (parent[i] == i)
            return i;
        return parent[i] = find(parent[i]); // Path compression
    }

    void union_set(int i, int j) {
        int root_i = find(i);
        int root_j = find(j);
        
        if (root_i != root_j) {
            // Union by rank
            if (rank[root_i] < rank[root_j]) {
                parent[root_i] = root_j;
            } else if (rank[root_i] > rank[root_j]) {
                parent[root_j] = root_i;
            } else {
                parent[root_j] = root_i;
                rank[root_i]++;
            }
        }
    }
};

// Edge definition
struct Edge {
    int src, dest, weight;
};

// Compare edges by weight
bool compareEdges(Edge a, Edge b) {
    return a.weight < b.weight;
}

void kruskalMST(vector<Edge>& edges, int V) {
    // Sort edges in ascending order of their weight
    sort(edges.begin(), edges.end(), compareEdges);

    DisjointSet ds(V);
    vector<Edge> result;

    for (int i = 0; i < edges.size(); ++i) {
        int u = edges[i].src;
        int v = edges[i].dest;

        int set_u = ds.find(u);
        int set_v = ds.find(v);

        // If including this edge does't cause cycle, add it
        // to result and union the sets
        if (set_u != set_v) {
            result.push_back(edges[i]);
            ds.union_set(set_u, set_v);
        }
    }

    cout << "Minimum Spanning Tree Edges:\\n";
    for (Edge e : result)
        cout << e.src << " -- " << e.dest << " == " << e.weight << "\\n";
}
`;

export const kruskalJava = `import java.util.*;

class KruskalMST {
    // Disjoint Set Data Structure
    static class DisjointSet {
        int[] parent, rank;
        public DisjointSet(int n) {
            parent = new int[n];
            rank = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }

        int find(int i) {
            if (parent[i] == i)
                return i;
            return parent[i] = find(parent[i]); // Path compression
        }

        void unionSet(int i, int j) {
            int root_i = find(i);
            int root_j = find(j);
            
            if (root_i != root_j) {
                // Union by rank
                if (rank[root_i] < rank[root_j]) {
                    parent[root_i] = root_j;
                } else if (rank[root_i] > rank[root_j]) {
                    parent[root_j] = root_i;
                } else {
                    parent[root_j] = root_i;
                    rank[root_i]++;
                }
            }
        }
    }

    // Edge definition
    static class Edge implements Comparable<Edge> {
        int src, dest, weight;
        public Edge(int src, int dest, int weight) {
            this.src = src;
            this.dest = dest;
            this.weight = weight;
        }
        public int compareTo(Edge compareEdge) {
            return this.weight - compareEdge.weight;
        }
    }

    public static void kruskalMST(List<Edge> edges, int V) {
        // Sort edges in ascending order of their weight
        Collections.sort(edges);

        DisjointSet ds = new DisjointSet(V);
        List<Edge> result = new ArrayList<>();

        for (int i = 0; i < edges.size(); ++i) {
            int u = edges.get(i).src;
            int v = edges.get(i).dest;

            int set_u = ds.find(u);
            int set_v = ds.find(v);

            // If including this edge does't cause cycle, add it
            // to result and union the sets
            if (set_u != set_v) {
                result.add(edges.get(i));
                ds.unionSet(set_u, set_v);
            }
        }

        System.out.println("Minimum Spanning Tree Edges:");
        for (Edge e : result)
            System.out.println(e.src + " -- " + e.dest + " == " + e.weight);
    }
}
`;

export const kruskalPython = `class DisjointSet:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, i):
        if self.parent[i] == i:
            return i
        self.parent[i] = self.find(self.parent[i]) # Path compression
        return self.parent[i]

    def union(self, i, j):
        root_i = self.find(i)
        root_j = self.find(j)
        
        if root_i != root_j:
            # Union by rank
            if self.rank[root_i] < self.rank[root_j]:
                self.parent[root_i] = root_j
            elif self.rank[root_i] > self.rank[root_j]:
                self.parent[root_j] = root_i
            else:
                self.parent[root_j] = root_i
                self.rank[root_i] += 1

def kruskal_mst(edges, V):
    # Sort edges in ascending order of their weight
    # edges is a list of tuples: (weight, src, dest)
    edges.sort()

    ds = DisjointSet(V)
    result = []

    for edge in edges:
        w, u, v = edge

        set_u = ds.find(u)
        set_v = ds.find(v)

        # If including this edge does't cause cycle, add it
        # to result and union the sets
        if set_u != set_v:
            result.append(edge)
            ds.union(set_u, set_v)

    print("Minimum Spanning Tree Edges:")
    for w, u, v in result:
        print(f"{u} -- {v} == {w}")
`;

export const kruskalJS = `class DisjointSet {
    constructor(n) {
        this.parent = new Array(n).fill(0).map((_, i) => i);
        this.rank = new Array(n).fill(0);
    }

    find(i) {
        if (this.parent[i] === i)
            return i;
        this.parent[i] = this.find(this.parent[i]); // Path compression
        return this.parent[i];
    }

    unionSet(i, j) {
        let root_i = this.find(i);
        let root_j = this.find(j);
        
        if (root_i !== root_j) {
            // Union by rank
            if (this.rank[root_i] < this.rank[root_j]) {
                this.parent[root_i] = root_j;
            } else if (this.rank[root_i] > this.rank[root_j]) {
                this.parent[root_j] = root_i;
            } else {
                this.parent[root_j] = root_i;
                this.rank[root_i]++;
            }
        }
    }
}

function kruskalMST(edges, V) {
    // Sort edges in ascending order of their weight
    // edges: [{src, dest, weight}, ...]
    edges.sort((a, b) => a.weight - b.weight);

    let ds = new DisjointSet(V);
    let result = [];

    for (let i = 0; i < edges.length; ++i) {
        let u = edges[i].src;
        let v = edges[i].dest;

        let set_u = ds.find(u);
        let set_v = ds.find(v);

        // If including this edge does't cause cycle, add it
        // to result and union the sets
        if (set_u !== set_v) {
            result.push(edges[i]);
            ds.unionSet(set_u, set_v);
        }
    }

    console.log("Minimum Spanning Tree Edges:");
    for (const e of result)
        console.log(\`\${e.src} -- \${e.dest} == \${e.weight}\`);
}
`;

export function generateKruskalSteps(nodes, edges) {
    const steps = [];
    const mstEdges = [];

    // Disjoint set logic representation for recording states
    const parent = new Array(nodes.length).fill(0).map((_, i) => i);
    const find = (i) => {
        if (parent[i] === i) return i;
        parent[i] = find(parent[i]);
        return parent[i];
    };
    const unionSet = (i, j) => {
        let root_i = find(i);
        let root_j = find(j);
        if (root_i !== root_j) {
            parent[root_i] = root_j;
            return true;
        }
        return false;
    };

    // Sort edges by weight
    const sortedEdges = [...edges].map((e, index) => ({ ...e, index })).sort((a, b) => a.weight - b.weight);

    steps.push({
        description: "Initialized Disjoint Set. Edges sorted by weight.",
        mstEdges: [],
        evaluatingEdge: null,
        status: "idle"
    });

    for (const edge of sortedEdges) {
        const { source, target, weight, index } = edge;

        steps.push({
            description: `Evaluating edge between ${nodes[source]?.label} and ${nodes[target]?.label} with weight ${weight}.`,
            mstEdges: [...mstEdges],
            evaluatingEdge: edge,
            status: "evaluating"
        });

        const rootU = find(source);
        const rootV = find(target);

        if (rootU !== rootV) {
            unionSet(source, target);
            mstEdges.push({ source, target });
            steps.push({
                description: `Included edge (${nodes[source]?.label}, ${nodes[target]?.label}). No cycle formed.`,
                mstEdges: [...mstEdges],
                evaluatingEdge: null,
                status: "added"
            });
        } else {
            steps.push({
                description: `Skipped edge (${nodes[source]?.label}, ${nodes[target]?.label}). Forms a cycle.`,
                mstEdges: [...mstEdges],
                evaluatingEdge: edge,
                status: "skipped"
            });
        }

        // Stop if MST has V-1 edges
        if (mstEdges.length === nodes.length - 1) {
            break;
        }
    }

    steps.push({
        description: "Kruskal's algorithm completed. Minimum Spanning Tree formed.",
        mstEdges: [...mstEdges],
        evaluatingEdge: null,
        status: "completed"
    });

    return { steps, mstEdges };
}
