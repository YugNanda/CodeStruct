export const cpuSchedulingCPP = `// Preemptive CPU Scheduling (Round Robin & SRTF)
#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>

struct Process {
    int id, at, bt, rt, ct, tat, wt;
    bool isCompleted = false;
};

// Round Robin (RR)
void roundRobin(std::vector<Process>& processes, int quantum) {
    int n = processes.size();
    int time = 0, completed = 0;
    std::queue<int> readyQueue;
    
    // Sort by arrival time
    std::sort(processes.begin(), processes.end(), [](Process& a, Process& b) {
        return a.at < b.at;
    });

    int currentIdx = -1;
    int timeInQuantum = 0;

    while (completed < n) {
        // Enqueue arriving processes
        for (int i = 0; i < n; i++) {
            if (processes[i].at == time && !processes[i].isCompleted && i != currentIdx) {
                readyQueue.push(i);
            }
        }

        // Context switch
        if (currentIdx != -1) {
            if (processes[currentIdx].rt == 0) {
                processes[currentIdx].isCompleted = true;
                processes[currentIdx].ct = time;
                processes[currentIdx].tat = time - processes[currentIdx].at;
                processes[currentIdx].wt = processes[currentIdx].tat - processes[currentIdx].bt;
                completed++;
                currentIdx = -1;
            } else if (timeInQuantum == quantum) {
                readyQueue.push(currentIdx);
                currentIdx = -1;
            }
        }

        // Fetch next
        if (currentIdx == -1 && !readyQueue.empty()) {
            currentIdx = readyQueue.front();
            readyQueue.pop();
            timeInQuantum = 0;
        }

        if (currentIdx != -1) {
            processes[currentIdx].rt--;
            timeInQuantum++;
        }
        time++;
    }
}
`;

export const cpuSchedulingJava = `// Preemptive CPU Scheduling (Round Robin & SRTF)
import java.util.*;

class Process {
    int id, at, bt, rt, ct, tat, wt;
    boolean isCompleted;

    public Process(int id, int at, int bt) {
        this.id = id;
        this.at = at;
        this.bt = bt;
        this.rt = bt;
        this.isCompleted = false;
    }
}

public class CPUScheduling {
    // Shortest Remaining Time First (SRTF)
    public static void srtf(List<Process> processes) {
        int n = processes.size();
        int time = 0, completed = 0;
        
        while (completed != n) {
            int shortestIdx = -1;
            int minRt = Integer.MAX_VALUE;

            for (int i = 0; i < n; i++) {
                if (processes.get(i).at <= time && !processes.get(i).isCompleted) {
                    if (processes.get(i).rt < minRt) {
                        minRt = processes.get(i).rt;
                        shortestIdx = i;
                    }
                    if (processes.get(i).rt == minRt) {
                        if (shortestIdx == -1 || processes.get(i).at < processes.get(shortestIdx).at) {
                            shortestIdx = i;
                        }
                    }
                }
            }

            if (shortestIdx == -1) {
                time++;
                continue;
            }

            // Execute process
            processes.get(shortestIdx).rt--;

            if (processes.get(shortestIdx).rt == 0) {
                processes.get(shortestIdx).isCompleted = true;
                processes.get(shortestIdx).ct = time + 1;
                processes.get(shortestIdx).tat = processes.get(shortestIdx).ct - processes.get(shortestIdx).at;
                processes.get(shortestIdx).wt = processes.get(shortestIdx).tat - processes.get(shortestIdx).bt;
                completed++;
            }
            time++;
        }
    }
}
`;

export const cpuSchedulingPython = `# Preemptive CPU Scheduling (Round Robin)
def round_robin(processes, quantum):
    time = 0
    completed = 0
    n = len(processes)
    queue = []
    
    # Sort by arrival time
    processes.sort(key=lambda x: x['at'])
    for p in processes:
        p['rt'] = p['bt']
        p['isCompleted'] = False
        
    current_idx = -1
    time_in_quantum = 0

    while completed < n:
        # Enqueue arriving processes
        for i, p in enumerate(processes):
            if p['at'] == time and not p['isCompleted'] and i != current_idx:
                queue.append(i)

        # Context switch conditions
        if current_idx != -1:
            if processes[current_idx]['rt'] == 0:
                processes[current_idx]['isCompleted'] = True
                processes[current_idx]['ct'] = time
                processes[current_idx]['tat'] = time - processes[current_idx]['at']
                processes[current_idx]['wt'] = processes[current_idx]['tat'] - processes[current_idx]['bt']
                completed += 1
                current_idx = -1
            elif time_in_quantum == quantum:
                queue.append(current_idx)
                current_idx = -1

        # Fetch next process
        if current_idx == -1 and queue:
            current_idx = queue.pop(0)
            time_in_quantum = 0

        # Execute
        if current_idx != -1:
            processes[current_idx]['rt'] -= 1
            time_in_quantum += 1
            
        time += 1
        
    return processes
`;

export const cpuSchedulingJS = `// Preemptive CPU Scheduling (Round Robin)
function roundRobin(processes, quantum) {
    let time = 0, completed = 0;
    const n = processes.length;
    const queue = [];
    
    // Sort processes by arrival time initially
    processes.sort((a, b) => a.at - b.at);
    
    // Initialize remaining time (rt)
    processes.forEach(p => {
        p.rt = p.bt;
        p.isCompleted = false;
    });
    
    let currentProcess = null;
    let timeInQuantum = 0;

    while (completed < n) {
        // Enqueue newly arrived processes
        processes.forEach(p => {
            if (p.at === time && !p.isCompleted && currentProcess?.id !== p.id) {
                queue.push(p);
            }
        });

        // Context switch if quantum expires or process finishes
        if (currentProcess) {
            if (currentProcess.rt === 0) {
                currentProcess.isCompleted = true;
                currentProcess.ct = time;
                currentProcess.tat = currentProcess.ct - currentProcess.at;
                currentProcess.wt = currentProcess.tat - currentProcess.bt;
                completed++;
                currentProcess = null;
            } else if (timeInQuantum === quantum) {
                queue.push(currentProcess);
                currentProcess = null;
            }
        }

        // Schedule next process
        if (!currentProcess && queue.length > 0) {
            currentProcess = queue.shift();
            timeInQuantum = 0;
        }

        // Execute step
        if (currentProcess) {
            currentProcess.rt -= 1;
            timeInQuantum++;
        }
        time++;
    }
    
    return processes;
}
`;