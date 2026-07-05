import sys
import re

with open('script.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove string literals and regex literals to avoid false positives
text = re.sub(r'\"(?:\\.|[^\\\"])*\"', '\"\"', text)
text = re.sub(r'\'(?:\\.|[^\\\'])*\'', '\'\'', text)
text = re.sub(r'\`(?:\\.|[^\\\`])*\`', '\`\`', text)
# Remove line comments
text = re.sub(r'//.*', '', text)
# Remove block comments
text = re.sub(r'/\*.*?\*/', '', text, flags=re.DOTALL)

stack = []
lines = text.split('\n')
for i, line in enumerate(lines):
    for char in line:
        if char in '{[(':
            stack.append((char, i+1))
        elif char in '}])':
            if not stack:
                print(f'Unmatched {char} at line {i+1}')
                sys.exit(1)
            top, line_num = stack.pop()
            if (top == '{' and char != '}') or (top == '[' and char != ']') or (top == '(' and char != ')'):
                print(f'Mismatched {char} at line {i+1}, expected match for {top} from line {line_num}')
                sys.exit(1)

if stack:
    print('Unclosed brackets:')
    for bracket, line_num in stack:
        print(f'  {bracket} at line {line_num}')
else:
    print('All brackets match perfectly!')
