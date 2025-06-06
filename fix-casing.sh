#!/bin/bash

# Read all real filenames in ui directory (without extensions)
mapfile -t ui_files < <(ls src/components/ui | sed 's/\.tsx$//')

# Loop through all .tsx files that import from '@/components/ui/'
grep -rl "@/components/ui/" src/ | while read -r file; do
  for real_file in "${ui_files[@]}"; do
    # lowercase version of real filename
    real_lower=$(echo "$real_file" | tr '[:upper:]' '[:lower:]')
    # regex to find lowercase import path that matches ignoring case
    pattern="@/components/ui/${real_lower}"

    # Check if file contains this import (case-insensitive)
    if grep -iq "$pattern" "$file"; then
      # Replace with correct casing
      sed -i "s|@/components/ui/${real_lower}|@/components/ui/${real_file}|g" "$file"
      echo "Fixed casing in $file for $real_file"
    fi
  done
done
