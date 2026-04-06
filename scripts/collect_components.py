import shutil
import os
from pathlib import Path
from src.utils.config import settings

def collect_components():
    # Base directory to search (keep input external as per plan D3)
    base_dir = Path("skeleton-web")
    # Destination directory from settings
    dest_dir = settings.paths.components_dir
    
    # Ensure BASE directory exists
    if not base_dir.exists():
        print(f"Error: Directory '{base_dir}' not found. Run this from the project root.")
        return

    # Create destination directory if it doesn't exist
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Searching for .component.ts files in {base_dir}...")
    
    count = 0
    for file_path in base_dir.rglob("*.component.ts"):
        # Get relative path from base_dir to maintain uniqueness
        relative_path = file_path.relative_to(base_dir)
        
        # Flatten the path for the filename to avoid deep nesting in datasets folder
        # e.g., src/app/login/login.component.ts -> src_app_login_login.component.ts
        flat_filename = str(relative_path).replace(os.path.sep, "_")
        target_path = dest_dir / flat_filename
        
        try:
            shutil.copy2(file_path, target_path)
            count += 1
        except Exception as e:
            print(f"Failed to copy {file_path}: {e}")

    print(f"Successfully stored {count} components in {dest_dir}")

def main():
    collect_components()

if __name__ == "__main__":
    main()
