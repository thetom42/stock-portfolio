import json
import re
import os

# Function to extract required information from a single file
def extract_info_from_file(file_path):
    with open(file_path, 'r') as file:
        data = json.load(file)
    
    extracted_data = []
    for entry in data:
        text = entry.get('text', '')
        # Use regex to extract the required fields
        tokens_in = re.search(r'"tokensIn":(\d+)', text)
        tokens_out = re.search(r'"tokensOut":(\d+)', text)
        cache_writes = re.search(r'"cacheWrites":(\d+)', text)
        cache_reads = re.search(r'"cacheReads":(\d+)', text)
        cost = re.search(r'"cost":([\d.]+)', text)
        
        extracted_entry = {
            'ts': entry.get('ts'),
            'tokensIn': int(tokens_in.group(1)) if tokens_in else None,
            'tokensOut': int(tokens_out.group(1)) if tokens_out else None,
            'cacheWrites': int(cache_writes.group(1)) if cache_writes else None,
            'cacheReads': int(cache_reads.group(1)) if cache_reads else None,
            'cost': float(cost.group(1)) if cost else None
        }

        # Only add the entry if cost is not None
        if extracted_entry['cost'] is not None:
            extracted_data.append(extracted_entry)
    
    return extracted_data

# Directory to search for ui_messages.json files
root_dir = 'cline/tasks'

# List to hold all extracted data
all_extracted_data = []

# Traverse through all subfolders and process each ui_messages.json file
for subdir, _, files in os.walk(root_dir):
    for file in files:
        if file == 'ui_messages.json':
            file_path = os.path.join(subdir, file)
            all_extracted_data.extend(extract_info_from_file(file_path))

# Sort the extracted data by the 'ts' attribute
all_extracted_data.sort(key=lambda x: x['ts'])

# Write the extracted data to cost.json
with open('cost.json', 'w') as outfile:
    json.dump(all_extracted_data, outfile, indent=4)

# Compute the totals for the specified fields
totals = {
    'tokensIn': sum(item['tokensIn'] for item in all_extracted_data if item['tokensIn'] is not None),
    'tokensOut': sum(item['tokensOut'] for item in all_extracted_data if item['tokensOut'] is not None),
    'cacheWrites': sum(item['cacheWrites'] for item in all_extracted_data if item['cacheWrites'] is not None),
    'cacheReads': sum(item['cacheReads'] for item in all_extracted_data if item['cacheReads'] is not None),
    'cost': sum(item['cost'] for item in all_extracted_data if item['cost'] is not None)
}

# Print the totals to stdout
print(json.dumps(totals, indent=4))