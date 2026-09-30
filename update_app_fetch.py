with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fetch('/api/save-receipt'", "(window.apiFetch || fetch)('save-receipt'")
content = content.replace("fetch('/api/delete-receipt'", "(window.apiFetch || fetch)('delete-receipt'")
content = content.replace("fetch('/api/sync-receipts'", "(window.apiFetch || fetch)('sync-receipts'")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced app.js fetch calls successfully.')
