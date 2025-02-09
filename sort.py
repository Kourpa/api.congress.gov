#!/usr/bin/env python3
import json
import os
from collections import defaultdict
from pathlib import Path

# Base directory for bills - read from
BILLS_DIR = Path('./data/119/bills')
# Output directory - write to
OUTPUT_DIR = Path('./data/119/status')

# Create output directory
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Group bills by status
bills_by_status = defaultdict(list)

# Process each data.json file
for data_file in BILLS_DIR.rglob('*/data.json'):
    billid = data_file.parent.name
    try:
        with open(data_file) as f:
            data = json.load(f)
            bills_by_status[data['status']].append({
                'billid': billid,
                'status': data['status'],
                'status_at': data['status_at']
            })
    except json.JSONDecodeError:
        print(f"Error processing {data_file}")
        continue

# Sort and write status-specific files
for status, bills in bills_by_status.items():
    # Sort by status_at in reverse order
    bills.sort(key=lambda x: x['status_at'], reverse=True)

    # Write status-specific JSON file
    output_file = OUTPUT_DIR / f"{status}.json"
    with open(output_file, 'w') as f:
        json.dump(bills, f, indent=2)

# Create CSV file with all bills
csv_file = OUTPUT_DIR / "all_bills.csv"
with open(csv_file, 'w') as f:
    f.write('billid,status,status_at\n')
    for status, bills in bills_by_status.items():
        for bill in bills:
            f.write(f"{bill['billid']},{bill['status']},{bill['status_at']}\n")
