// ─── Shunting Yard Algorithm – visualization logic + code snippets ──────────────

/**
 * Generate step-by-step frames for the Shunting Yard (Infix → Postfix) algorithm.
 * Each frame captures:
 *   - current token being processed
 *   - operatorStack state
 *   - outputQueue state
 *   - explanation text
 *   - action label
 *   - highlight status of each token
 */
export function generateShuntingYardSteps(expression) {
  const precedence = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 3 };
  const rightAssoc = new Set(["^"]);
  const isOperator = (t) => t in precedence;
  const isOperand = (t) => /^[a-zA-Z0-9]+$/.test(t);

  // Tokenize: supports multi-char operands and handles unary minus very basically
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
  const operatorStack = [];
  const outputQueue = [];

  const snapshot = (currentToken, action, explanation, tokenIndex, status = "default") => {
    frames.push({
      tokens: tokens.map((t, i) => ({
        value: t,
        status: i === tokenIndex ? status : i < tokenIndex ? "processed" : "pending",
      })),
      operatorStack: [...operatorStack],
      outputQueue: [...outputQueue],
      currentToken,
      action,
      explanation,
    });
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (isOperand(token)) {
      outputQueue.push(token);
      snapshot(token, "Enqueue Operand", `"${token}" is an operand → add directly to Output Queue.`, i, "operand");

    } else if (isOperator(token)) {
      snapshot(token, "Read Operator", `"${token}" is an operator (precedence ${precedence[token]}).`, i, "operator");
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== "(" &&
        isOperator(operatorStack[operatorStack.length - 1]) &&
        (precedence[operatorStack[operatorStack.length - 1]] > precedence[token] ||
          (precedence[operatorStack[operatorStack.length - 1]] === precedence[token] &&
            !rightAssoc.has(token)))
      ) {
        const popped = operatorStack.pop();
        outputQueue.push(popped);
        snapshot(token, "Pop Higher Precedence", `Stack top "${popped}" has higher (or equal left-assoc) precedence than "${token}" → pop to output.`, i, "operator");
      }
      operatorStack.push(token);
      snapshot(token, "Push Operator", `Push "${token}" onto the operator stack.`, i, "operator");

    } else if (token === "(") {
      operatorStack.push(token);
      snapshot(token, "Push '('", `"(" is a left parenthesis → push onto operator stack.`, i, "paren");

    } else if (token === ")") {
      snapshot(token, "Read ')'", `")" found → pop operators until matching "(" is found.`, i, "paren");
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== "(") {
        const popped = operatorStack.pop();
        outputQueue.push(popped);
        snapshot(token, "Pop to Output", `Popping "${popped}" from stack to output queue.`, i, "paren");
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === "(") {
        operatorStack.pop(); // discard "("
        snapshot(token, "Discard '('", `Discarding matching "(" from the stack.`, i, "paren");
      }
    }
  }

  // Drain remaining operators
  while (operatorStack.length > 0) {
    const popped = operatorStack.pop();
    outputQueue.push(popped);
    frames.push({
      tokens: tokens.map((t) => ({ value: t, status: "processed" })),
      operatorStack: [...operatorStack],
      outputQueue: [...outputQueue],
      currentToken: popped,
      action: "Drain Stack",
      explanation: `No more tokens. Popping remaining operator "${popped}" from stack to output.`,
    });
  }

  // Final frame
  frames.push({
    tokens: tokens.map((t) => ({ value: t, status: "done" })),
    operatorStack: [],
    outputQueue: [...outputQueue],
    currentToken: null,
    action: "Complete",
    explanation: `Conversion complete! Postfix: ${outputQueue.join(" ")}`,
  });

  return frames;
}

// ─── C++ Snippet ────────────────────────────────────────────────────────────────
export const shuntingYardCPP = `#include <iostream>
#include <stack>
#include <string>
#include <sstream>
#include <unordered_map>
using namespace std;

int precedence(char op) {
    if (op == '+' || op == '-') return 1;
    if (op == '*' || op == '/') return 2;
    if (op == '^') return 3;
    return 0;
}

bool isRightAssociative(char op) { return op == '^'; }
bool isOperator(char c) { return c == '+' || c == '-' || c == '*' || c == '/' || c == '^'; }

string infixToPostfix(const string& expr) {
    stack<char> opStack;
    string output = "";

    for (char token : expr) {
        if (token == ' ') continue;

        if (isalnum(token)) {
            output += token;
            output += ' ';
        } else if (token == '(') {
            opStack.push(token);
        } else if (token == ')') {
            while (!opStack.empty() && opStack.top() != '(') {
                output += opStack.top();
                output += ' ';
                opStack.pop();
            }
            opStack.pop(); // Remove '('
        } else if (isOperator(token)) {
            while (!opStack.empty() && isOperator(opStack.top()) &&
                   (precedence(opStack.top()) > precedence(token) ||
                    (precedence(opStack.top()) == precedence(token) &&
                     !isRightAssociative(token)))) {
                output += opStack.top();
                output += ' ';
                opStack.pop();
            }
            opStack.push(token);
        }
    }

    while (!opStack.empty()) {
        output += opStack.top();
        output += ' ';
        opStack.pop();
    }

    return output;
}

int main() {
    string expr = "a + b * c - ( d / e ) ^ f";
    cout << "Infix:   " << expr << endl;
    cout << "Postfix: " << infixToPostfix(expr) << endl;
    return 0;
}`;

// ─── Java Snippet ────────────────────────────────────────────────────────────────
export const shuntingYardJava = `import java.util.Stack;

public class ShuntingYard {

    static int precedence(char op) {
        if (op == '+' || op == '-') return 1;
        if (op == '*' || op == '/') return 2;
        if (op == '^') return 3;
        return 0;
    }

    static boolean isRightAssoc(char op) { return op == '^'; }
    static boolean isOperator(char c) {
        return c == '+' || c == '-' || c == '*' || c == '/' || c == '^';
    }

    static String infixToPostfix(String expr) {
        Stack<Character> stack = new Stack<>();
        StringBuilder output = new StringBuilder();

        for (char token : expr.toCharArray()) {
            if (token == ' ') continue;

            if (Character.isLetterOrDigit(token)) {
                output.append(token).append(' ');
            } else if (token == '(') {
                stack.push(token);
            } else if (token == ')') {
                while (!stack.isEmpty() && stack.peek() != '(') {
                    output.append(stack.pop()).append(' ');
                }
                stack.pop(); // Remove '('
            } else if (isOperator(token)) {
                while (!stack.isEmpty() && isOperator(stack.peek()) &&
                       (precedence(stack.peek()) > precedence(token) ||
                        (precedence(stack.peek()) == precedence(token) &&
                         !isRightAssoc(token)))) {
                    output.append(stack.pop()).append(' ');
                }
                stack.push(token);
            }
        }

        while (!stack.isEmpty()) {
            output.append(stack.pop()).append(' ');
        }

        return output.toString().trim();
    }

    public static void main(String[] args) {
        String expr = "a + b * c - ( d / e ) ^ f";
        System.out.println("Infix:   " + expr);
        System.out.println("Postfix: " + infixToPostfix(expr));
    }
}`;

// ─── Python Snippet ──────────────────────────────────────────────────────────────
export const shuntingYardPython = `def precedence(op):
    if op in ('+', '-'): return 1
    if op in ('*', '/'): return 2
    if op == '^': return 3
    return 0

def is_right_assoc(op): return op == '^'
def is_operator(c): return c in ('+', '-', '*', '/', '^')

def infix_to_postfix(expr):
    stack = []
    output = []

    for token in expr.split():
        if token.isalnum():
            output.append(token)
        elif token == '(':
            stack.append(token)
        elif token == ')':
            while stack and stack[-1] != '(':
                output.append(stack.pop())
            stack.pop()  # Remove '('
        elif is_operator(token):
            while (stack and is_operator(stack[-1]) and
                   (precedence(stack[-1]) > precedence(token) or
                    (precedence(stack[-1]) == precedence(token) and
                     not is_right_assoc(token)))):
                output.append(stack.pop())
            stack.append(token)

    while stack:
        output.append(stack.pop())

    return ' '.join(output)

if __name__ == '__main__':
    expr = "a + b * c - ( d / e ) ^ f"
    print("Infix:  ", expr)
    print("Postfix:", infix_to_postfix(expr))`;

// ─── JavaScript Snippet ──────────────────────────────────────────────────────────
export const shuntingYardJS = `function precedence(op) {
  if (op === '+' || op === '-') return 1;
  if (op === '*' || op === '/') return 2;
  if (op === '^') return 3;
  return 0;
}

const isRightAssoc = (op) => op === '^';
const isOperator = (c) => ['+', '-', '*', '/', '^'].includes(c);

function infixToPostfix(expr) {
  const tokens = expr.match(/[a-zA-Z0-9]+|[+\\-*/^()]/g) || [];
  const stack = [];
  const output = [];

  for (const token of tokens) {
    if (/^[a-zA-Z0-9]+$/.test(token)) {
      output.push(token);
    } else if (token === '(') {
      stack.push(token);
    } else if (token === ')') {
      while (stack.length && stack[stack.length - 1] !== '(') {
        output.push(stack.pop());
      }
      stack.pop(); // Remove '('
    } else if (isOperator(token)) {
      while (
        stack.length &&
        isOperator(stack[stack.length - 1]) &&
        (precedence(stack[stack.length - 1]) > precedence(token) ||
          (precedence(stack[stack.length - 1]) === precedence(token) &&
            !isRightAssoc(token)))
      ) {
        output.push(stack.pop());
      }
      stack.push(token);
    }
  }

  while (stack.length) output.push(stack.pop());
  return output.join(' ');
}

const expr = "a + b * c - ( d / e ) ^ f";
console.log("Infix:  ", expr);
console.log("Postfix:", infixToPostfix(expr));`;