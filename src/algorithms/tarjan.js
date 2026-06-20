export const tarjanCPP = `#include <iostream>
#include <vector>
#include <stack>
#include <algorithm>

using namespace std;

void dfs(int u, vector<vector<int>>& adj, vector<int>& disc, vector<int>& low, stack<int>& st, vector<bool>& inStack, int& time, int& sccCount) {
    disc[u] = low[u] = ++time;
    st.push(u);
    inStack[u] = true;

    for (int v : adj[u]) {
        if (disc[v] == -1) {
            dfs(v, adj, disc, low, st, inStack, time, sccCount);
            low[u] = min(low[u], low[v]);
        } else if (inStack[v]) {
            low[u] = min(low[u], disc[v]);
        }
    }

    if (low[u] == disc[u]) {
        sccCount++;
        cout << "SCC " << sccCount << ": ";
        while (st.top() != u) {
            int node = st.top();
            st.pop();
            inStack[node] = false;
            cout << node << " ";
        }
        int node = st.top();
        st.pop();
        inStack[node] = false;
        cout << node << endl;
    }
}

int tarjan(int V, vector<vector<int>>& adj) {
    vector<int> disc(V, -1);
    vector<int> low(V, -1);
    vector<bool> inStack(V, false);
    stack<int> st;
    int time = 0, sccCount = 0;

    for (int i = 0; i < V; i++) {
        if (disc[i] == -1) {
            dfs(i, adj, disc, low, st, inStack, time, sccCount);
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

    int result = tarjan(V, adj);
    cout << "Total Strongly Connected Components: " << result << endl;

    return 0;
}
`;

export const tarjanJava = `import java.util.*;

public class Main {
    private static int time = 0;
    private static int sccCount = 0;

    private static void dfs(int u, ArrayList<ArrayList<Integer>> adj, int[] disc, int[] low, Stack<Integer> st, boolean[] inStack) {
        disc[u] = low[u] = ++time;
        st.push(u);
        inStack[u] = true;

        for (int v : adj.get(u)) {
            if (disc[v] == -1) {
                dfs(v, adj, disc, low, st, inStack);
                low[u] = Math.min(low[u], low[v]);
            } else if (inStack[v]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }

        if (low[u] == disc[u]) {
            sccCount++;
            System.out.print("SCC " + sccCount + ": ");
            while (st.peek() != u) {
                int node = st.pop();
                inStack[node] = false;
                System.out.print(node + " ");
            }
            int node = st.pop();
            inStack[node] = false;
            System.out.println(node);
        }
    }

    public static int tarjan(int V, ArrayList<ArrayList<Integer>> adj) {
        int[] disc = new int[V];
        int[] low = new int[V];
        Arrays.fill(disc, -1);
        Arrays.fill(low, -1);
        boolean[] inStack = new boolean[V];
        Stack<Integer> st = new Stack<>();
        
        time = 0;
        sccCount = 0;

        for (int i = 0; i < V; i++) {
            if (disc[i] == -1) {
                dfs(i, adj, disc, low, st, inStack);
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
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        System.out.println("Enter directed edges (u v):");
        for (int i = 0; i < E; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
        }

        int result = tarjan(V, adj);
        System.out.println("Total Strongly Connected Components: " + result);
    }
}
`;

export const tarjanPython = `def tarjan(V, adj):
    disc = [-1] * V
    low = [-1] * V
    inStack = [False] * V
    st = []
    time = [0]
    sccCount = [0]

    def dfs(u):
        time[0] += 1
        disc[u] = low[u] = time[0]
        st.append(u)
        inStack[u] = True

        for v in adj[u]:
            if disc[v] == -1:
                dfs(v)
                low[u] = min(low[u], low[v])
            elif inStack[v]:
                low[u] = min(low[u], disc[v])

        if low[u] == disc[u]:
            sccCount[0] += 1
            scc = []
            while st[-1] != u:
                node = st.pop()
                inStack[node] = False
                scc.append(node)
            node = st.pop()
            inStack[node] = False
            scc.append(node)
            print(f"SCC {sccCount[0]}: {' '.join(map(str, reversed(scc)))}")

    for i in range(V):
        if disc[i] == -1:
            dfs(i)

    return sccCount[0]

def main():
    V, E = map(int, input("Enter V and E: ").split())
    adj = [[] for _ in range(V)]

    print("Enter directed edges (u v):")
    for _ in range(E):
        u, v = map(int, input().split())
        adj[u].append(v)

    result = tarjan(V, adj)
    print(f"Total Strongly Connected Components: {result}")

if __name__ == "__main__":
    main()
`;

export const tarjanJS = `// Tarjan's Algorithm for SCCs in JavaScript

function tarjan(V, adj) {
    const disc = new Array(V).fill(-1);
    const low = new Array(V).fill(-1);
    const inStack = new Array(V).fill(false);
    const st = [];
    let time = 0;
    let sccCount = 0;

    function dfs(u) {
        time++;
        disc[u] = low[u] = time;
        st.push(u);
        inStack[u] = true;

        for (const v of adj[u]) {
            if (disc[v] === -1) {
                dfs(v);
                low[u] = Math.min(low[u], low[v]);
            } else if (inStack[v]) {
                low[u] = Math.min(low[u], disc[v]);
            }
        }

        if (low[u] === disc[u]) {
            sccCount++;
            const scc = [];
            while (st[st.length - 1] !== u) {
                const node = st.pop();
                inStack[node] = false;
                scc.push(node);
            }
            const node = st.pop();
            inStack[node] = false;
            scc.push(node);
            console.log(\`SCC \${sccCount}: \${scc.reverse().join(" ")}\`);
        }
    }

    for (let i = 0; i < V; i++) {
        if (disc[i] === -1) {
            dfs(i);
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

const result = tarjan(V, adj);
console.log("Total Strongly Connected Components:", result);
`;

export const tarjan = async () => {};
