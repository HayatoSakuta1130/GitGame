import re
with open('script.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

patterns = ['player\.', 'box\.', 'if \(', 'ctx\.', 'for \(', 'const ', 'let ', '} else {', '} else if', '}\);', 'function', 'return', 'gravityDir', 'p11Timer', 'turnDuration', 'speed', 'manage']

for i, line in enumerate(lines):
    idx = line.find('//')
    if idx != -1:
        comment = line[idx:]
        for p in patterns:
            # check if pattern appears after some characters in the comment
            # e.g., if there's a space then the pattern
            if re.search(r'//.*?[^\x00-\x7F].*?\s+' + p, comment):
                print(f'Line {i+1}: {line.strip()}')
                break
