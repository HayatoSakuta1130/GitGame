with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

injection = '''
<script>
window.onerror = function(msg, url, line, col, error) {
    document.body.innerHTML = "<div style='background:red;color:white;font-size:24px;padding:20px;z-index:9999;position:absolute;top:0;left:0;width:100%;height:100%;'><h1>JavaScript Error</h1><p>" + msg + "</p><p>Line: " + line + "</p><p>Please tell the AI this error message!</p></div>";
    return false;
};
</script>
'''

if 'window.onerror' not in text:
    text = text.replace('<head>', '<head>' + injection)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
