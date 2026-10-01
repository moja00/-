import json
import firebase_admin
from firebase_admin import firestore
import os

try:
    firebase_admin.initialize_app(options={
        'storageBucket': 'alva-billcraft-receipts',
        'projectId': 'alva-epr-510301'
    })
    db = firestore.client()
except Exception as e:
    print("Firebase init error:", e)
    import sys
    sys.exit(1)

def restore_collection(col_name, json_path):
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    batch = db.batch()
    for item in data:
        doc_id = item.get('id')
        if doc_id:
            batch.set(db.collection(col_name).document(doc_id), item)
    batch.commit()
    print(f"Restored {len(data)} items to {col_name} from {json_path}")

restore_collection("attendance", "data/attendance/attendance.json")
