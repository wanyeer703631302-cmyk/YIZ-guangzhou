import requests
import os
import time

# Directory
SAVE_DIR = "h:\\vibe2\\yiz\\phantom-replica\\public\\images\\perspective"

# Ensure directory exists (just in case)
if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

# Image IDs from Unsplash (mix of architecture, abstract, tech)
# We need ~40 images total (20 existing + 20 new)
image_ids = [
    '1550740558-185321aa4718', '1518756131217-31eb79b20e8f', '1493246507139-91e8fad9978e',
    '1516541196185-4be928d5fa8e', '1534229317119-7164797967b5', '1506744038136-46273834b3fb',
    '1550684848-fac1c5b4e853', '1504198266287-165987d5b290', '1519681393797-21e937e02a14',
    '1470071459604-3b5ec3a7fe05', '1441974231531-c6227db76b6e', '1501854140884-074cf2b21d25',
    '1505144809812-422743905656', '1464822759023-fed622ff2c3b', '1472214103451-9374bd1c7dd1',
    '1465146344425-f00d5f5c8f07', '1470252649378-9c29740c9fa8', '1480796927426-f609979314bd',
    '1447752875204-b2650314636d', '1476514525535-07fb3b4ae5f1',
    # New additions (Architecture, Dark, Tech)
    '1486406146926-c627a92ad1ab', '1485470733090-0aae1788d5af', '1504384308090-c54beed04a58',
    '1470813740244-df37b8c1edcb', '1497366216548-37526070297c', '1497366816717-de7f5a40d71a',
    '1497215842964-c2202286a158', '1500462918059-b1a0cb512f1d', '1531297461368-e9f43a63d914',
    '1501167786-2541823bc53c', '1505664194789-a791e679b32d', '1517502884422-41eaead166d4',
    '1502014822145-8a9367efd829', '1464617570381-3e86c31853d4', '1495615080073-5b869b018b5e',
    '1496345875659-11f7dd282d1d', '1500530855697-b586d89ba3ee', '1469474968028-56623f02e42e',
    '1480074568708-e7b720bb6fce', '1446771306078-410a36e2f5f6'
]

print(f"Starting download of {len(image_ids)} images...")

for i, img_id in enumerate(image_ids):
    filename = f"img_{i+1:03d}.jpg"
    filepath = os.path.join(SAVE_DIR, filename)
    
    # Check if exists
    if os.path.exists(filepath):
        print(f"Skipping {filename} (exists)")
        continue
        
    url = f"https://images.unsplash.com/photo-{img_id}?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=60"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded {filename}")
        else:
            print(f"Failed {filename}: Status {response.status_code}")
    except Exception as e:
        print(f"Error {filename}: {e}")
    
    time.sleep(0.1) # Be nice to API

print("Download complete.")