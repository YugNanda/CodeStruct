// ─── Postfix to Infix Algorithm – visualization logic + code snippets ──────────────

/**
 * Generate step-by-step frames for the Postfix to Infix algorithm.
 * Each frame captures:
 *   - current token being processed
 *   - stack state
 *   - explanation text
 *   - action label
 *   - highlight status of each token
 */
export function generatePostfixToInfixSteps(expression) {
  const isOperator = (t) => ["+", "-", "*", "/", "^"].includes(t);
  const isOperand = (t) => /^[a-zA-Z0-9]+$/.test(t);

  const tokenize = (expr) => {
    const tokens = [];
    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];
      if (ch === " ") { i++; continue; }
      if (/[a-zA-Z0-9]/.test(ch)) {
        let tok = "";
        while (i < expr.length && /[a-zA-Z0-9]/.test(expr[i])) tok += expr[i++];
        tokens.push(tok);
      } else {
        tokens.push(ch);
        i++;
      }
    }
    return tokens;
  };

  const tokens = tokenize(expression);
  const frames = [];
  const stack = [];

  const snapshot = (currentToken, action, explanation, tokenIndex, status = "default") => {
    frames.push({
      tokens: tokens.map((t, i) => ({
        value: t,
        status: i === tokenIndex ? status : i < tokenIndex ? "processed" : "pending",
      })),
      stack: [...stack],
      currentToken,
      action,
      explanation,
    });
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (isOperand(token)) {
      stack.push(token);
      snapshot(token, "Push Operand", `Encountered operand "${token}". Push it onto the stack.`, i, "operand");
    } else if (isOperator(token)) {
      snapshot(token, "Read Operator", `Encountered operator "${token}". Need to pop two operands.`, i, "operator");

      if (stack.length < 2) {
        snapshot(token, "Error", `Invalid Postfix expression: not enough operands for "${token}".`, i, "error");
        return frames;
      }

      const op2 = stack.pop(); // right operand
      snapshot(token, "Pop Right", `Popped right operand "${op2}" from the stack.`, i, "operator");
      
      const op1 = stack.pop(); // left operand
      snapshot(token, "Pop Left", `Popped left operand "${op1}" from the stack.`, i, "operator");

      const subExpr = `(${op1}${token}${op2})`;
      stack.push(subExpr);
      snapshot(token, "Push Result", `Combine into "${subExpr}" and push back to stack.`, i, "operator");
    } else {
      snapshot(token, "Invalid Token", `Encountered invalid token "${token}". Skipping.`, i, "error");
    }
  }

  // Final validation and frame
  if (stack.length === 1) {
    frames.push({
      tokens: tokens.map((t) => ({ value: t, status: "done" })),
      stack: [...stack],
      currentToken: null,
      action: "Complete",
      explanation: `Conversion complete! Infix: ${stack[0]}`,
    });
  } else {
    frames.push({
      tokens: tokens.map((t) => ({ value: t, status: "error" })),
      stack: [...stack],
      currentToken: null,
      action: "Error",
      explanation: "Invalid Postfix expression! Stack should contain exactly one item.",
    });
  }

  return frames;
}

// ─── C++ Snippet ────────────────────────────────────────────────────────────────
export const postfixToInfixCPP = `#include <iostream>
#include <stack>
#include <string>
#include <cctype>

using namespace std;

bool isOperator(char x) {
    return x == '+' || x == '-' || x == '*' || x == '/' || x == '^';
}

string postfixToInfix(string expr) {
    stack<string> s;

    for (int i = 0; i < expr.length(); i++) {
        // Skip spaces
        if (expr[i] == ' ') continue;

        if (!isOperator(expr[i])) {
            string op(1, expr[i]);
            while(i+1 < expr.length() && isalnum(expr[i+1])) {
                op += expr[i+1];
                i++;
            }
            s.push(op);
        } else {
            string op2 = s.top(); s.pop();
            string op1 = s.top(); s.pop();
            
            s.push("(" + op1 + expr[i] + op2 + ")");
        }
    }

    return s.top();
}

int main() {
    string expr = "ab*c+";
    cout << "Postfix: " << expr << endl;
    cout << "Infix:   " << postfixToInfix(expr) << endl;
    return 0;
}`;

// ─── Java Snippet ────────────────────────────────────────────────────────────────
export const postfixToInfixJava = `import java.util.Stack;

class PostfixToInfix {

    static boolean isOperator(char x) {
        return x == '+' || x == '-' || x == '*' || x == '/' || x == '^';
    }

    static String postfixToInfix(String expr) {
        Stack<String> s = new Stack<String>();
        String[] tokens = expr.split("(?=[+\\-*/^])|(?<=[+\\-*/^])|\\s+");

        for (String token : tokens) {
            token = token.trim();
            if(token.isEmpty()) continue;

            if (token.length() == 1 && isOperator(token.charAt(0))) {
                String op2 = s.pop();
                String op1 = s.pop();
                s.push("(" + op1 + token + op2 + ")");
            } else {
                s.push(token);
            }
        }
        return s.peek();
    }

    public static void main(String args[]) {
        String expr = "ab*c+";
        System.out.println("Postfix: " + expr);
        System.out.println("Infix:   " + postfixToInfix(expr));
    }
}`;

// ─── Python Snippet ──────────────────────────────────────────────────────────────
export const postfixToInfixPython = `def is_operator(c):
    return c in ('+', '-', '*', '/', '^')

def postfix_to_infix(expr):
    stack = []
    
    # We assume valid spaced tokens or single char operands for simplicity in python tokenizing
    tokens = expr.split()
    if len(tokens) == 1 and len(tokens[0]) > 1:
        # Handling without spaces just grouping by characters
        tokens = list(expr)

    for token in tokens:
        if token == ' ':
            continue
        if is_operator(token):
            op2 = stack.pop()
            op1 = stack.pop()
            stack.append(f"({op1}{token}{op2})")
        else:
            stack.append(token)
            
    return stack[0]

if __name__ == '__main__':
    expr = "a b * c +"
    print(f"Postfix: {expr}")
    print(f"Infix:   {postfix_to_infix(expr)}")`;

// ─── JavaScript Snippet ──────────────────────────────────────────────────────────
export const postfixToInfixJS = `function isOperator(c) {
    return ['+', '-', '*', '/', '^'].includes(c);
}

function postfixToInfix(expr) {
    let stack = [];
    const tokens = expr.match(/[a-zA-Z0-9]+|[+\\-*/^]/g) || [];

    for (let token of tokens) {
        if (isOperator(token)) {
            let op2 = stack.pop();
            let op1 = stack.pop();
            stack.push(\`(\${op1}\${token}\${op2})\`);
        } else {
            stack.push(token);
        }
    }

    return stack[0];
}

const expr = "a b * c +";
console.log("Postfix: ", expr);
console.log("Infix:   ", postfixToInfix(expr));`;
