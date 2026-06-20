export const kosarajuCPP = `#include <iostream>
#include <vector>
#include <stack>

using namespace std;

void dfs(int node, vector<vector<int>>& adj, vector<bool>& vis, stack<int>& st) {
    vis[node] = true;
    for (auto it : adj[node]) {
        if (!vis[it]) {
            dfs(it, adj, vis, st);
        }
    }
    st.push(node);
}

void dfs3(int node, vector<vector<int>>& adjT, vector<bool>& vis, vector<int>& scc) {
    vis[node] = true;
    scc.push_back(node);
    for (auto it : adjT[node]) {
        if (!vis[it]) {
            dfs3(it, adjT, vis, scc);
        }
    }
}

int kosaraju(int V, vector<vector<int>>& adj) {
    vector<bool> vis(V, false);
    stack<int> st;

    // Step 1: Push nodes to stack according to finishing time
    for (int i = 0; i < V; i++) {
        if (!vis[i]) {
            dfs(i, adj, vis, st);
        }
    }

    // Step 2: Reverse the reversed edges
    vector<vector<int>> adjT(V);
    for (int i = 0; i < V; i++) {
        vis[i] = false;
        for (auto it : adj[i]) {
            // i -> it becomes it -> i
            adjT[it].push_back(i);
        }
    }

    // Step 3: Do DFS according to stack
    int sccCount = 0;
    while (!st.empty()) {
        int node = st.top();
        st.pop();

        if (!vis[node]) {
            sccCount++;
            vector<int> scc;
            dfs3(node, adjT, vis, scc);
            cout << "SCC " << sccCount << ": ";
            for (int n : scc) {
                cout << n << " ";
            }
            cout << endl;
        }
    }
    return sccCount;
}

int main() {
    int V, E;
    cout << "Enter V and E: ";
    cin >> V >> E;

    vector<vector<int>> adj(V);
    cout << "Enter directed edges (u v):\\n";
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
    }

    int result = kosaraju(V, adj);
    cout << "Total Strongly Connected Components: " << result << endl;

    return 0;
}
`;

export const kosarajuJava = `import java.util.*;

public class Main {
    private static void dfs(int node, ArrayList<ArrayList<Integer>> adj, boolean[] vis, Stack<Integer> st) {
        vis[node] = true;
        for (Integer it : adj.get(node)) {
            if (!vis[it]) {
                dfs(it, adj, vis, st);
            }
        }
        st.push(node);
    }

    private static void dfs3(int node, ArrayList<ArrayList<Integer>> adjT, boolean[] vis, ArrayList<Integer> scc) {
        vis[node] = true;
        scc.add(node);
        for (Integer it : adjT.get(node)) {
            if (!vis[it]) {
                dfs3(it, adjT, vis, scc);
            }
        }
    }

    public static int kosaraju(int V, ArrayList<ArrayList<Integer>> adj) {
        boolean[] vis = new boolean[V];
        Stack<Integer> st = new Stack<>();

        for (int i = 0; i < V; i++) {
            if (!vis[i]) {
                dfs(i, adj, vis, st);
            }
        }

        ArrayList<ArrayList<Integer>> adjT = new ArrayList<>();
        for (int i = 0; i < V; i++) {
            adjT.add(new ArrayList<>());
        }
        for (int i = 0; i < V; i++) {
            vis[i] = false;
            for (Integer it : adj.get(i)) {
                adjT.get(it).add(i);
            }
        }

        int sccCount = 0;
        while (!st.isEmpty()) {
            int node = st.pop();

            if (!vis[node]) {
                sccCount++;
                ArrayList<Integer> scc = new ArrayList<>();
                dfs3(node, adjT, vis, scc);
                
                System.out.print("SCC " + sccCount + ": ");
                for (int n : scc) {
                    System.out.print(n + " ");
                }
                System.out.println();
            }
        }
        return sccCount;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter V and E: ");
        int V = sc.nextInt();
        int E = sc.nextInt();
        
        ArrayList<ArrayList<Integer>> adj = new ArrayList<>(V);
        for(int i=0; i<V; i++) adj.add(new ArrayList<>());
        
        System.out.println("Enter directed edges (u v):");
        for (int i = 0; i < E; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
        }

        int result = kosaraju(V, adj);
        System.out.println("Total Strongly Connected Components: " + result);
    }
}
`;

export const kosarajuPython = `def dfs(node, adj, vis, st):
    vis[node] = True
    for it in adj[node]:
        if not vis[it]:
            dfs(it, adj, vis, st)
    st.append(node)

def dfs3(node, adjT, vis, scc):
    vis[node] = True
    scc.append(node)
    for it in adjT[node]:
        if not vis[it]:
            dfs3(it, adjT, vis, scc)

def kosaraju(V, adj):
    vis = [False] * V
    st = []

    for i in range(V):
        if not vis[i]:
            dfs(i, adj, vis, st)

    adjT = [[] for _ in range(V)]
    for i in range(V):
        vis[i] = False
        for it in adj[i]:
            adjT[it].append(i)

    sccCount = 0
    while st:
        node = st.pop()
        if not vis[node]:
            sccCount += 1
            scc = []
            dfs3(node, adjT, vis, scc)
            print(f"SCC {sccCount}: {' '.join(map(str, scc))}")
            
    return sccCount

def main():
    V, E = map(int, input("Enter V and E: ").split())
    
    adj = [[] for _ in range(V)]
    
    print("Enter directed edges (u v):")
    for _ in range(E):
        u, v = map(int, input().split())
        adj[u].append(v)
    
    result = kosaraju(V, adj)
    print(f"Total Strongly Connected Components: {result}")

if __name__ == "__main__":
    main()
`;

export const kosarajuJS = `// Kosaraju's Algorithm for SCCs in JavaScript

function dfs(node, adj, vis, st) {
    vis[node] = true;
    for (const it of adj[node]) {
        if (!vis[it]) {
            dfs(it, adj, vis, st);
        }
    }
    st.push(node);
}

function dfs3(node, adjT, vis, scc) {
    vis[node] = true;
    scc.push(node);
    for (const it of adjT[node]) {
        if (!vis[it]) {
            dfs3(it, adjT, vis, scc);
        }
    }
}

function kosaraju(V, adj) {
    const vis = new Array(V).fill(false);
    const st = [];

    // Step 1: Fill stack with nodes in increasing order of completion times
    for (let i = 0; i < V; i++) {
        if (!vis[i]) {
            dfs(i, adj, vis, st);
        }
    }

    // Step 2: Create a reversed graph
    const adjT = Array.from({ length: V }, () => []);
    for (let i = 0; i < V; i++) {
        vis[i] = false;
        for (const it of adj[i]) {
            adjT[it].push(i);
        }
    }

    // Step 3: Process nodes in decreasing order of completion times
    let sccCount = 0;
    while (st.length > 0) {
        const node = st.pop();

        if (!vis[node]) {
            sccCount++;
            const scc = [];
            dfs3(node, adjT, vis, scc);
            console.log(\`SCC \${sccCount}: \${scc.join(" ")}\`);
        }
    }
    return sccCount;
}

// Example usage
const V = 5; // Number of vertices
const adj = Array.from({ length: V }, () => []);

// Add directed edges
const edges = [[0, 2], [2, 1], [1, 0], [0, 3], [3, 4]];
edges.forEach(([u, v]) => {
    adj[u].push(v);
});

const result = kosaraju(V, adj);
console.log("Total Strongly Connected Components:", result);
`;

export const kosaraju = async () => { };
