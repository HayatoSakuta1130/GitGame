import sys

with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '\"' in line or '\'' in line or '\`' in line:
        stripped = line.strip()
        if ';' in stripped and stripped.endswith(';'):
            prev_char = stripped[-2]
            if prev_char not in ['\"', '\'', '\`', ')', '}', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'e', 't', 'x', 'y', 'w', 'h', ']', 'l', 'd', 'p', 'n', 'r', 'm']:
                if 'innerText' in line or 'fillText' in line or 'color' in line or 'gameState' in line:
                    print(f'Line {i+1}: {stripped}')
