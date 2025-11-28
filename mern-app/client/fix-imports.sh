#!/bin/bash

# Complete @ import fix script for all files

echo "Fixing @ imports globally..."

# Fix all JavaScript/TypeScript files in src
find src -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" \) | while read file; do
  # Get the directory depth of the file
  dir=$(dirname "$file")
  depth=$(echo "$dir" | tr -cd '/' | wc -c)
  depth=$((depth - 1)) # Subtract 1 for 'src' dir
  
  # Build relative path to src
  if [ $depth -eq 0 ]; then
    rel="."
  else
    rel=$(printf '../%.0s' $(seq 1 $depth))rel="../.."
  fi
  
  # Replace @ imports with relative paths
  sed -i "s|from \"@/|from \"${rel}/|g" "$file"
  sed -i "s|from '@/|from '${rel}/|g" "$file"
done

echo "✅ All @ imports fixed!"
