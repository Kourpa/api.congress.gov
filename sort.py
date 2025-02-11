#!/usr/bin/env python3
import json
import os
from collections import defaultdict
from pathlib import Path

# Base directory for bills - read from
BILLS_DIR = Path('./data/119/bills')
# Output directory - write to
OUTPUT_DIR = Path('./data/119/status')
# Create output directory and house/senate subdirectories
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
(OUTPUT_DIR / "house").mkdir(exist_ok=True)
(OUTPUT_DIR / "senate").mkdir(exist_ok=True)

# Group bills by status and chamber
bills_by_status = defaultdict(list)
house_bills_by_status = defaultdict(list)
senate_bills_by_status = defaultdict(list)

# Process each data.json file
for data_file in BILLS_DIR.rglob('*/data.json'):
    billid = data_file.parent.name
    try:
        with open(data_file) as f:
            data = json.load(f)
            bill_info = {
                'billid': billid,
                'status': data['status'],
                'status_at': data['status_at']
            }

            # Add to main status list
            bills_by_status[data['status']].append(bill_info)

            # Sort into house/senate based on first letter of billid
            if billid.lower().startswith('h'):
                house_bills_by_status[data['status']].append(bill_info)
            elif billid.lower().startswith('s'):
                senate_bills_by_status[data['status']].append(bill_info)

    except json.JSONDecodeError:
        print(f"Error processing {data_file}")
        continue

# Function to write status files for a specific chamber


def write_status_files(bills_dict, output_path):
    for status, bills in bills_dict.items():
        # Sort by status_at in reverse order
        bills.sort(key=lambda x: x['status_at'], reverse=True)
        # Write status-specific JSON file
        output_file = output_path / f"{status}.json"
        with open(output_file, 'w') as f:
            json.dump(bills, f, indent=2)


# Write files for all bills
write_status_files(bills_by_status, OUTPUT_DIR)

# Write files for house bills
write_status_files(house_bills_by_status, OUTPUT_DIR / "house")

# Write files for senate bills
write_status_files(senate_bills_by_status, OUTPUT_DIR / "senate")

# Create CSV files for each chamber


def write_csv(bills_dict, output_file):
    with open(output_file, 'w') as f:
        f.write('billid,status,status_at\n')
        for status, bills in bills_dict.items():
            for bill in bills:
                f.write(f"{bill['billid']},{bill['status']},{
                        bill['status_at']}\n")


# Write main CSV
write_csv(bills_by_status, OUTPUT_DIR / "all_bills.csv")

# Write house CSV
write_csv(house_bills_by_status, OUTPUT_DIR / "house/house_bills.csv")

# Write senate CSV
write_csv(senate_bills_by_status, OUTPUT_DIR / "senate/senate_bills.csv")
